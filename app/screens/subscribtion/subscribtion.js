const Subscription = observer(class Subscription extends React.Component {
  constructor() {
    super();
    this.state = {
      active_subscription: 3,
      load_check_status_button: false,
      load_payment_button: false,
      load_restore_button: false,
      modal_yoo_kassa: false,
      payment_url: '',
      auth_modal: false,
      load_sync_button: false,
      store_prices: {},
    }

    this.read_1_month = 99;
    this.read_6_month = 499;
    this.read_1_year = 799;
    this.read_forever = 2490;
  }

  async componentDidMount() {
    if (appStore.type_payment == 'by_store') {
      try {
        const ids = ['read_1_month', 'read_6_month', 'read_1_year', 'read_forever'];
        const products = await Purchases.getProducts(ids);
        const prices = {};
        products.forEach(p => { prices[p.identifier] = p.priceString; });
        this.setState({ store_prices: prices });
      } catch (e) {}
    }
  }

  cancelSubscription() {
    new Storage().set('has_subscription', 'false');
    this.props.root.setState({
      has_subscription: false,
    });
  }

  async checkSubscription() {
    this.setState({
      load_check_status_button: true
    });

    var result = await this.props.root.checkSubscription();

    this.setState({
      load_check_status_button: false
    });

    if (result == false) {
      Alert.alert('У Вас нет активных покупок.');
    }
  }

  async setActiveSubscription(active_subscription) {
    await this.setState({
      active_subscription: active_subscription
    });
  }

  async initPayment(subscription_id) {
    AppMetrica.reportEvent('initPayment', { type_payment: appStore.type_payment, subscription_id: subscription_id });
    if (appStore.type_payment == 'by_store') {
      this.payByStore(subscription_id);
    } else {
      this.payBySite(subscription_id);
    }
  }

  async initSubscriptionPayment() {
    this.initPayment(this.state.active_subscription);
  }

  async initForeverPayment() {
    this.initPayment(4);
  }

  async payByStore(subscription_id) {
    try {
      if (this.state.load_payment_button == false) {
        this.setState({ load_payment_button: true });

        if (subscription_id == 1) var productId = 'read_1_month';
        if (subscription_id == 2) var productId = 'read_6_month';
        if (subscription_id == 3) var productId = 'read_1_year';
        if (subscription_id == 4) var productId = 'read_forever';

        const products = await Purchases.getProducts([productId]);
        if (!products || products.length === 0) {
          throw new Error('Product not found: ' + productId);
        }
        const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);

        const proEntitlement = customerInfo.entitlements.active['pro'];
        if (!proEntitlement) {
          throw new Error('Purchase completed but entitlement not active');
        }

        const end_date = proEntitlement.expirationDate
          ? moment(proEntitlement.expirationDate)
          : moment().add(200, 'years');

        const subscription_info = {
          end_date: end_date.format('YYYY-MM-DD HH:MM'),
          subscription_id: subscription_id,
        };

        await new Storage().set('has_subscription', 'true');
        await new Storage().set('subscription_info', JSON.stringify(subscription_info));

        await this.props.root.setState({
          subscription_info: subscription_info,
          has_subscription: true,
        });

        if (this.props.root.state.current_user) {
          this.props.root.sync_subscription_with_server(
            this.props.root.state.current_user.id,
            subscription_id,
            end_date.format('YYYY-MM-DD HH:MM')
          );
        }

        this.checkSubscription();
        this.setState({ load_payment_button: false });
      }
    } catch (error) {
      this.setState({ load_payment_button: false });
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.warn('IAP error:', error);
        Alert.alert('Ошибка', 'Ошибка при обработке покупки. Попробуйте позже.');
      }
    }
  }

  async payBySite(subscription_id) {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      if (this.state.load_payment_button == false) {
        this.setState({
          load_payment_button: true
        });

        var response = await new Request('/api/v1/payments', {
          user_id: this.props.root.state.current_user.id,
          subscription_id: subscription_id,
          app_payment: 'true'
        }, {}).post();

        this.setState({
          load_payment_button: false
        });

        if (response != false) {
          this.setState({
            modal_yoo_kassa: true,
            payment_url: response.payment_url
          });
        }
      }
    }
  }

  closeYooKassa() {
    this.props.root.checkSubscription();

    this.setState({
      modal_yoo_kassa: false
    });
  }

  async sync_subscription() {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      await this.setState({
        load_sync_button: true
      });

      await this.props.root.sync_subscription_with_server(
        this.props.root.state.current_user.id,
        this.props.root.state.subscription_info.subscription_id,
        moment(this.props.root.state.subscription_info.end_date).format('YYYY-MM-DD'),
      );

      await this.setState({
        load_sync_button: false
      });

      Alert.alert("Данные синхронизированы");
    }
  }

  async restorePurchases() {
    try {
      this.setState({ load_restore_button: true });
      const customerInfo = await Purchases.restorePurchases();
      const proEntitlement = customerInfo.entitlements.active['pro'];
      if (proEntitlement) {
        await this.props.root.checkSubscription();
        Alert.alert('Готово', 'Покупка восстановлена.');
      } else {
        Alert.alert('Покупки не найдены', 'Активных покупок для этого Apple ID не найдено.');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось восстановить покупки. Попробуйте позже.');
    } finally {
      this.setState({ load_restore_button: false });
    }
  }

  getPrice(productId, fallback) {
    const s = this.state.store_prices[productId];
    return s || fallback + ' ₽';
  }

  getDiscount(monthlyTotal, months) {
    const monthly = this.read_1_month;
    const perMonth = monthlyTotal / months;
    return Math.round((1 - perMonth / monthly) * 100);
  }

  getButtonLabel() {
    const { active_subscription } = this.state;
    if (appStore.type_payment == 'by_store') {
      if (active_subscription == 1) return 'Подписаться за ' + this.getPrice('read_1_month', this.read_1_month);
      if (active_subscription == 2) return 'Подписаться за ' + this.getPrice('read_6_month', this.read_6_month);
      if (active_subscription == 3) return 'Подписаться за ' + this.getPrice('read_1_year', this.read_1_year);
      if (active_subscription == 4) return 'Купить за ' + this.getPrice('read_forever', this.read_forever);
    } else {
      if (active_subscription == 1) return 'Оплатить 1 месяц — ' + this.read_1_month + ' ₽';
      if (active_subscription == 2) return 'Оплатить 6 месяцев — ' + this.read_6_month + ' ₽';
      if (active_subscription == 3) return 'Оплатить 1 год — ' + this.read_1_year + ' ₽';
      if (active_subscription == 4) return 'Купить навсегда — ' + this.read_forever + ' ₽';
    }
  }

  can_show_pricing() {
    var can_show = true;
    if (this.props.root.state.has_subscription == true) {
      if (this.props.root.state.subscription_info != undefined) {
        can_show = this.props.root.state.subscription_info.subscription_id != 4;
      }
    }

    return can_show;
  }

  range_of_subscription(subscription_id) {
    var texts = {
      '1': '1 месяц',
      '2': '6 месяцев',
      '3': '1 год'
    }

    return texts[subscription_id];
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        <Modal
          animationType="fade"
          presentationStyle={'overFullScreen'}
          transparent={true}
          visible={this.state.modal_yoo_kassa}
        >
          <View activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View style={{ backgroundColor: '#FFF', flex: 1, flexDirection: 'column', marginTop: 40, borderRadius: 10 }}>
              <View style={{
                height: 55, flexDirection: 'row', justifyContent: 'flex-end', borderBottomColor: '#ddd', borderBottomWidth: 1
              }}>
                <TouchableOpacity onPress={() => this.closeYooKassa()} style={{ width: 35, height: 35, backgroundColor: '#ddd', borderRadius: 7, margin: 10 }}>
                  <Image
                    style={{ height: 20, width: 20, margin: 7.5 }}
                    source={require('./app/images/header/right-menu-close.png')}
                  />
                </TouchableOpacity>

              </View>
              <View style={{ flex: 1 }}>
                <WebView
                  source={{
                    uri: this.state.payment_url,
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView style={{ flex: 1 }} >

          <View style={{ marginLeft: 30, marginRight: 30, }}>

            <React.Fragment>
              {this.props.root.state.has_subscription == true ? (
                <React.Fragment>
                  <View style={{ marginTop: 30, borderRadius: 10, backgroundColor: '#eee', padding: 10 }}>
                    {this.props.root.state.subscription_info.subscription_id == 4 ? (
                      <React.Fragment>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          У вас активирован
                        </Text>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          вечный PRO-доступ
                        </Text>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          Ваш PRO-доступ активен до:
                        </Text>
                        <View style={{ marginTop: 5 }}>
                          <Text style={{ textAlign: 'center', fontSize: 18, marginTop: 5, fontWeight: 'bold', color: '#f05458' }}> {moment(this.props.root.state.subscription_info.end_date).format('DD.MM.YYYY')}</Text>
                        </View>
                      </React.Fragment>
                    )}
                  </View>

                  {appStore.type_payment == 'by_store' &&
                    <React.Fragment>
                      <TouchableOpacity onPress={() => this.sync_subscription()} style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 5 }}>
                        {this.state.load_sync_button == true ? (
                          <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                        ) : (
                          <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Синхронизировать с сайтом</Text>
                        )}
                      </TouchableOpacity>
                      <Text style={{ marginTop: 10 }}>
                        Если вы оплатили подписку через AppStore, но на сайте ваша подписка не отображается, синхронизуруйте данные.
                      </Text>
                    </React.Fragment>
                  }
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 25,
                    fontWeight: 'bold',
                    marginTop: 30,
                  }}>
                    У Вас нет активного PRO-доступа
                  </Text>

                  {(this.props.root.state.current_user || appStore.type_payment == 'by_store') &&
                    <TouchableOpacity onPress={() => this.checkSubscription()} style={{ marginTop: 15, marginLeft: 15, marginRight: 15, backgroundColor: '#f05458', height: 40, borderRadius: 5 }}>
                      {this.state.load_check_status_button == true ? (
                        <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 16 }}>
                          Проверить статус
                        </Text>
                      )}
                    </TouchableOpacity>
                  }

                </React.Fragment>
              )}
              <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 30 }}></View>
            </React.Fragment>


            {this.props.root.state.has_subscription == false &&
              <React.Fragment>
                <View style={{ marginTop: 30, flexDirection: 'column', justifyContent: 'center' }}>
                  {this.props.root.state.has_subscription == true ? (
                    <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>Продлить доступ</Text>
                  ) : (
                    <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>Приобрести PRO-доступ</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 15 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/no_ads.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Выключить</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>рекламу</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/offline.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Чтение</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без интернета</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 15 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/dictionary.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Словарь</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без ограничений</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/voiceover.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Озвучка слов</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без ограничений</Text>
                  </View>
                </View>

                <Text style={{ marginTop: 15 }}>PRO-доступ распространяется на сайт <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text> и другие устройства, авторизованные под вашим аккаунтом.</Text>
              </React.Fragment>
            }

            {this.can_show_pricing() &&
              <React.Fragment>

                <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
                  {appStore.type_payment == 'by_store' ? 'Варианты подписки:' : 'Варианты оплаты:'}
                </Text>

                <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, overflow: 'visible' }}>

                  {/* 1 месяц */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(1)}>
                    <View style={[{
                      borderRadius: 10, backgroundColor: '#FFF', padding: 15, height: 75,
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      borderBottomWidth: 1, borderBottomColor: '#eee',
                    }, this.state.active_subscription == 1 && {
                      borderColor: '#f05458', borderWidth: 2, borderBottomColor: '#f05458',
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 18, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 1 && { color: '#f05458' }]}>1 месяц</Text>
                        <Text style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{this.getPrice('read_1_month', this.read_1_month)}</Text>
                      </View>
                      <Text style={{ fontSize: 15, color: '#555' }}>{this.getPrice('read_1_month', this.read_1_month)}/мес</Text>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* 6 месяцев */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(2)}>
                    <View style={[{
                      backgroundColor: '#FFF', padding: 15, height: 75,
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      borderBottomWidth: 1, borderBottomColor: '#eee',
                    }, this.state.active_subscription == 2 && {
                      borderColor: '#f05458', borderWidth: 2, borderBottomColor: '#f05458',
                    }]}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[{ fontSize: 18, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 2 && { color: '#f05458' }]}>6 месяцев</Text>
                          <View style={{ marginLeft: 8, backgroundColor: '#fff3cd', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 11, color: '#856404', fontWeight: 'bold' }}>−{this.getDiscount(this.read_6_month, 6)}%</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{this.getPrice('read_6_month', this.read_6_month)}</Text>
                      </View>
                      <Text style={{ fontSize: 15, color: '#555' }}>{Math.round(this.read_6_month / 6)} ₽/мес</Text>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* 1 год — выгоднее всего */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(3)}>
                    <View style={[{
                      backgroundColor: '#FFF', padding: 15, height: 75,
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      borderBottomWidth: 1, borderBottomColor: '#eee',
                    }, this.state.active_subscription == 3 && {
                      borderColor: '#f05458', borderWidth: 2, borderBottomColor: '#f05458',
                    }]}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[{ fontSize: 18, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 3 && { color: '#f05458' }]}>1 год</Text>
                          <View style={{ marginLeft: 8, backgroundColor: '#d4edda', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 11, color: '#155724', fontWeight: 'bold' }}>Выгоднее всего −{this.getDiscount(this.read_1_year, 12)}%</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: '#888', marginTop: 3 }}>{this.getPrice('read_1_year', this.read_1_year)}</Text>
                      </View>
                      <Text style={{ fontSize: 15, color: '#555' }}>{Math.round(this.read_1_year / 12)} ₽/мес</Text>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* Навсегда */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(4)}>
                    <View style={[{
                      borderRadius: 10, backgroundColor: '#FFF', padding: 15, height: 75,
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    }, this.state.active_subscription == 4 && {
                      borderColor: '#f05458', borderWidth: 2,
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 18, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 4 && { color: '#f05458' }]}>Навсегда</Text>
                        <Text style={{ fontSize: 14, color: '#888', marginTop: 3 }}>Единоразовый платёж</Text>
                      </View>
                      <Text style={{ fontSize: 15, color: '#555' }}>{this.getPrice('read_forever', this.read_forever)}</Text>
                    </View>
                  </TouchableWithoutFeedback>

                </View>

                {this.state.active_subscription == 4 &&
                  <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>Доступ оплачивается один раз — продлевать не нужно.</Text>
                }
                {appStore.type_payment == 'by_yoo_kassa' && this.state.active_subscription != 4 &&
                  <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>По окончании периода подписка не продлевается автоматически.</Text>
                }

                <TouchableOpacity
                  onPress={() => this.state.active_subscription == 4 ? this.initForeverPayment() : this.initSubscriptionPayment()}
                  style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 8 }}>
                  {this.state.load_payment_button == true ? (
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16, fontWeight: 'bold' }}>
                      {this.props.root.state.has_subscription ? 'Продлить' : this.getButtonLabel()}
                    </Text>
                  )}
                </TouchableOpacity>

                {appStore.type_payment == 'by_store' &&
                  <TouchableOpacity onPress={() => this.restorePurchases()} style={{ marginTop: 12, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' }}>
                    {this.state.load_restore_button ? (
                      <ActivityIndicator size="small" color="#888" />
                    ) : (
                      <Text style={{ color: '#555', textAlign: 'center', fontSize: 15 }}>Восстановить покупки</Text>
                    )}
                  </TouchableOpacity>
                }

              </React.Fragment>
            }

            <View style={{ marginTop: 30, marginBottom: 30, flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")} style={{ marginRight: 15 }}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14 }}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")} style={{}}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14 }}>Privacy policy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>Подробности условий использования</Text>

            <Text style={{ fontSize: 13, marginTop: 8, color: '#555', lineHeight: 20 }}>
              Приложение распространяется бесплатно, без ограничений по времени. Автоматического списания средств нет.{'\n\n'}
              PRO-доступ можно приобрести на 1 месяц (99 ₽), 6 месяцев (499 ₽), 1 год (799 ₽) или навсегда (2 490 ₽). PRO убирает рекламу и открывает чтение без интернета.{'\n\n'}
              По окончании периода PRO-доступ не продлевается автоматически — для продления необходимо совершить покупку повторно в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text>. Пожизненный доступ продлевать не нужно.{'\n\n'}
              Возврат средств возможен только через поддержку Apple (для покупок через App Store). По другим вопросам пишите на read-en@yandex.ru.
            </Text>

            <View style={{ height: 40 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
});
