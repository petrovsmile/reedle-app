const Subscription = observer(class Subscription extends React.Component {
  constructor() {
    super();
    this.state = {
      active_subscription: 1,
      load_check_status_button: false,
      load_payment_button: false,
      modal_yoo_kassa: false,
      payment_url: '',
      auth_modal: false,
      load_sync_button: false,
    }

    this.read_1_month = 99;
    this.read_6_month = 499;
    this.read_1_year = 799;
    this.read_forever = 2490;
  }

  async componentDidMount() {
    try {
      await RNIap.initConnection();
    } catch (error) {
      console.warn('Error initializing IAP connection:', error);
    }
  }

  async componentWillUnmount() {
    try {
      await RNIap.endConnection();
    } catch (error) {
      console.warn('Error ending IAP connection:', error);
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
        this.setState({
          load_payment_button: true
        });

        if (subscription_id == 1) {
          var productId = 'read_1_month';
          var type = 'subscription';
        }
        if (subscription_id == 2) {
          var productId = 'read_6_month';
          var type = 'subscription';
        }
        if (subscription_id == 3) {
          var productId = 'read_1_year';
          var type = 'subscription';
        }
        if (subscription_id == 4) {
          var productId = 'read_forever';
          var type = 'product';
        }

        if (type == 'subscription') {
          var purchase = await RNIap.requestSubscription({ sku: productId });
          var time_subsription = moment.unix(parseInt(purchase.transactionDate) / 1000);
        }

        if (type == 'product') {
          var purchase = await RNIap.requestPurchase({ sku: productId });
          var time_subsription = moment.unix(parseInt(purchase.transactionDate) / 1000);
        }

        if (purchase.productId == 'read_1_month') {
          var end_date = time_subsription.clone().add(1, 'months');
          var subscription_id = 1;
        }
        if (purchase.productId == 'read_6_month') {
          var end_date = time_subsription.clone().add(6, 'months');
          var subscription_id = 2;
        }
        if (purchase.productId == 'read_1_year') {
          var end_date = time_subsription.clone().add(1, 'years');
          var subscription_id = 3;
        }
        if (purchase.productId == 'read_forever') {
          var end_date = time_subsription.clone().add(200, 'years');
          var subscription_id = 4;
        }

        var subscription_info = {
          end_date: end_date.format('YYYY-MM-DD HH:MM'),
          subscription_id: subscription_id
        }

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

        this.setState({
          load_payment_button: false
        });
      }
    } catch (error) {
      this.setState({
        load_payment_button: false
      });

      // Handle react-native-iap 15.2.0 specific errors
      if (error.code === 'E_USER_CANCELLED') {
        console.log('User cancelled the purchase');
      } else if (error.code === 'E_NETWORK_ERROR') {
        Alert.alert('Ошибка сети', 'Проверьте подключение к интернету');
      } else if (error.code === 'E_UNKNOWN') {
        console.warn('Unknown IAP error:', error.message);
        Alert.alert('Ошибка', 'Ошибка при обработке покупки. Попробуйте позже.');
      } else {
        console.warn('IAP error:', error);
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

                <Text style={{ marginTop: 15, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
                  Варианты
                  {appStore.type_payment == 'by_store' ? (
                    <Text> подписки:</Text>
                  ) : (
                    <Text> оплаты:</Text>
                  )}
                </Text>

                <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, }}>

                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(1)}>
                    <View style={[{
                      borderRadius: 10,
                      zIndex: 1,
                      backgroundColor: '#FFF',
                      padding: 15,
                      height: 85,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderBottomWidth: 1,
                      borderBottomColor: '#ddd'
                    }, this.state.active_subscription == 1 && { borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2 }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 1 && { color: '#f05458' }]}>1 месяц</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.read_1_month} руб</Text>
                      </View>

                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{this.read_1_month} руб/мес</Text>
                      </View>

                    </View>
                  </TouchableWithoutFeedback>

                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(2)}>
                    <View style={[{
                      borderRadius: 10,
                      zIndex: 1,
                      backgroundColor: '#FFF',
                      padding: 15,
                      height: 85,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderBottomWidth: 1,
                      borderBottomColor: '#ddd'
                    }, this.state.active_subscription == 2 && { borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2 }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 2 && { color: '#f05458' }]}>6 месяцев</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.read_6_month} руб</Text>
                      </View>

                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{(this.read_6_month / 6).toFixed(0)}  руб/мес</Text>
                      </View>

                    </View>
                  </TouchableWithoutFeedback>

                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(3)}>
                    <View style={[{
                      borderRadius: 10,
                      zIndex: 1,
                      backgroundColor: '#FFF',
                      padding: 15,
                      height: 85,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      borderBottomWidth: 1,
                      borderBottomColor: '#ddd'
                    }, this.state.active_subscription == 3 && { borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2 }]}>

                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 3 && { color: '#f05458' }]}>1 год</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.read_1_year} руб</Text>
                      </View>

                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{(this.read_1_year / 12).toFixed(0)} руб/мес</Text>
                      </View>

                    </View>
                  </TouchableWithoutFeedback>
                </View>

                <React.Fragment>
                  <Text style={{ marginTop: 15 }}>Вы приобретаете ПРО-доступ на {this.range_of_subscription(this.state.active_subscription)}.</Text>
                  {appStore.type_payment == 'by_yoo_kassa' &&
                    <Text style={{ marginTop: 15 }}>По окончании этого периода, для продления доступа, необходимо произвести оплату еще раз в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text>.</Text>
                  }
                </React.Fragment>

                <TouchableOpacity onPress={() => this.initSubscriptionPayment()} style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 5 }}>
                  {this.state.load_payment_button == true ? (
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  ) : (
                    <React.Fragment>

                      {this.props.root.state.has_subscription ? (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Продлить</Text>
                      ) : (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>
                          {appStore.type_payment == 'by_store' ? (
                            <Text>Подписаться</Text>
                          ) : (
                            <Text>Оплатить {this.range_of_subscription(this.state.active_subscription)}</Text>
                          )}
                        </Text>
                      )}

                    </React.Fragment>
                  )}
                </TouchableOpacity>

                <React.Fragment>
                  <Text style={{ marginTop: 30, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
                    <Text>Купить навсегда</Text>
                  </Text>

                  <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, }}>
                    <View style={[{
                      borderRadius: 10,
                      zIndex: 1,
                      backgroundColor: '#FFF',
                      padding: 15,
                      height: 85,
                      flexDirection: 'row',
                      justifyContent: 'space-between'
                    }]}>

                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 4 && { color: '#f05458' }]}>Навсегда</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.read_forever} руб</Text>
                      </View>
                    </View>
                  </View>

                  <React.Fragment>
                    <Text style={{ marginTop: 15 }}>Вы приобретаете пожизненный ПРО-доступ.</Text>

                    <Text style={{ marginTop: 15 }}>ПРО-доступ "Навсегда" продлевать не нужно и такой возможности не будет. Доступ оплачивается один раз и навсегда.</Text>
                  </React.Fragment>

                  <TouchableOpacity onPress={() => this.initForeverPayment()} style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 5 }}>
                    {this.state.load_payment_button == true ? (
                      <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>
                        <Text>Купить навсегда</Text>
                      </Text>
                    )}
                  </TouchableOpacity>
                </React.Fragment>
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

            <Text style={{fontWeight: 'bold'}}>Подробновсти условий использования</Text>
              
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>Приложение распространяется бесплатно.</Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>Бесплатное пользование не ограничено по времени. Автоматически оплата взиматься не будет.</Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>В любой момент вы можеет купить ПРО-доступ на определенный период: 1 месяц за 99руб, 6 месяцев за 499руб, 1 год за 799руб или навсегда за 2490руб. </Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>ПРО-доступ убирает показ рекламы и дает возможность скачивать книги на устройство.</Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>По окочании периода действия ПРО-доступа его необходмио продлить. Это можно сделать в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text>. Пожизненный ПРО-доступ продлевать не нужно и такой возможности не будет. </Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}>При покупке любого типа ПРО-доступа у вас нет возможности отказаться от его действия. По окочании срока действия вы вернетесь к бесплатной версии. Вечный доступ не отменяется никогда. Автоматически возврат денежных средств не возможен. По вопросам возврата денежных средств и другим финансовым вопросам пишите на почту read-en@yandex.ru.</Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}></Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}></Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}></Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}></Text></View>
            <View><Text style={{ fontSize: 13, marginTop: 5 }}></Text></View>

            <View style={{ height: 50 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
});
