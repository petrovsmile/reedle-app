const Subscription = observer(class Subscription extends React.Component {
  constructor() {
    super();
    this.state = {
      active_subscription: 3,
      load_payment_button: false,
      load_restore_button: false,
      modal_yoo_kassa: false,
      payment_url: '',
      payment_webview_loading: false,
      auth_modal: false,
      load_sync_button: false,
      api_prices: {},
    }

    // Fallback prices used when API is unavailable
    this.read_1_month = 99;
    this.read_6_month = 499;
    this.read_1_year = 799;
    this.read_forever = 2490;
  }

  async componentDidMount() {
    try {
      const result = await new Request(
        '/api/v1/subscriptions/prices', {}, { do_not_show_error: true }
      ).get();
      if (result) this.setState({ api_prices: result });
    } catch (e) { }
  }

  setActiveSubscription(active_subscription) {
    this.setState({ active_subscription });
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
    if (this.state.load_payment_button) return;
    try {
      this.setState({ load_payment_button: true });

      if (subscription_id == 1) var productId = 'read_1_month';
      if (subscription_id == 2) var productId = 'read_6_month';
      if (subscription_id == 3) var productId = 'read_1_year';
      if (subscription_id == 4) var productId = 'read_forever';

      const products = await Purchases.getProducts([productId]);
      if (!products || products.length === 0) {
        throw new Error('Product not found: ' + productId);
      }

      await Purchases.purchaseStoreProduct(products[0]);

      await this.props.root.checkSubscription();
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.warn('IAP error:', error);
        if (error.message && error.message.startsWith('Product not found')) {
          AppAlert.alert('Недоступно', 'Продукт временно недоступен в App Store. Попробуйте позже.');
        } else {
          AppAlert.alert('Ошибка покупки', error.message || 'Неизвестная ошибка. Попробуйте ещё раз.');
        }
      }
    } finally {
      this.setState({ load_payment_button: false });
    }
  }

  async payBySite(subscription_id) {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      if (this.state.load_payment_button == true) return;

      this.setState({ load_payment_button: true });
      try {
        var response = await new Request('/api/v1/payments', {
          user_id: this.props.root.state.current_user.id,
          subscription_id: subscription_id,
          app_payment: 'true'
        }, {}).post();

        if (response != false && response.payment_url) {
          this.setState({
            modal_yoo_kassa: true,
            payment_url: response.payment_url,
            payment_webview_loading: true
          });
        } else {
          AppAlert.alert('Ошибка', 'Не удалось открыть страницу оплаты. Попробуйте ещё раз.');
        }
      } catch (error) {
        AppAlert.alert('Ошибка', 'Не удалось открыть страницу оплаты. Попробуйте ещё раз.');
      } finally {
        this.setState({ load_payment_button: false });
      }
    }
  }

  closeYooKassa() {
    this.props.root.waitForSubscriptionActivation();

    this.setState({
      modal_yoo_kassa: false,
      payment_webview_loading: false
    }, () => {
      AppAlert.alert('Ожидайте подтверждения оплаты. Через некоторое время ПРО доступ автоматически активируется');
    });
  }

  async sync_subscription() {
    if (this.props.root.state.current_user == false) {
      this.setState({ auth_modal: true });
      return;
    }

    const { subscription_info } = appStore;
    if (!subscription_info || !subscription_info.subscription_id) {
      AppAlert.alert('Нет данных подписки для синхронизации');
      return;
    }

    this.setState({ load_sync_button: true });

    try {
      const result = await this.props.root.sync_subscription_with_server(
        this.props.root.state.current_user.id,
        subscription_info.subscription_id,
        moment(subscription_info.end_date).format('YYYY-MM-DD'),
      );

      if (result) {
        AppAlert.alert('Данные синхронизированы');
      } else {
        AppAlert.alert('Ошибка', 'Не удалось синхронизировать. Попробуйте позже.');
      }
    } catch (e) {
      AppAlert.alert('Ошибка', 'Не удалось синхронизировать. Попробуйте позже.');
    } finally {
      this.setState({ load_sync_button: false });
    }
  }

  // Numeric price from site API, or hardcoded fallback
  getNumericPrice(productId, fallback) {
    const p = this.state.api_prices[productId];
    return (p != null) ? p : fallback;
  }

  // Formatted price string
  getPrice(productId, fallback) {
    return this.getNumericPrice(productId, fallback) + ' ₽';
  }

  getPerMonthLabel(productId, fallback, months) {
    const total = this.getNumericPrice(productId, fallback);
    return Math.round(total / months) + ' ₽/мес';
  }

  getDiscountPercent(productId, fallback, months) {
    const monthly = this.getNumericPrice('read_1_month', this.read_1_month);
    const total = this.getNumericPrice(productId, fallback);
    return Math.round((1 - total / months / monthly) * 100);
  }

  getButtonLabel() {
    const { active_subscription } = this.state;
    if (active_subscription == 1) return 'Подписаться за ' + this.getPrice('read_1_month', this.read_1_month);
    if (active_subscription == 2) return 'Подписаться за ' + this.getPrice('read_6_month', this.read_6_month);
    if (active_subscription == 3) return 'Подписаться за ' + this.getPrice('read_1_year', this.read_1_year);
    if (active_subscription == 4) return 'Купить за ' + this.getPrice('read_forever', this.read_forever);
  }

  can_show_pricing() {
    var can_show = true;
    if (appStore.has_subscription == true) {
      if (appStore.subscription_info != undefined) {
        can_show = appStore.subscription_info.subscription_id != 4;
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
    const isCompact = Dimensions.get('window').width <= 360;
    const isDarkTheme = appThemeStore.colors.text == '#ffffff';
    const subscriptionTextColor = (lightColor) => isDarkTheme ? '#FFF' : lightColor;
    const pageHorizontalMargin = isCompact ? 16 : 30;
    const planPadding = isCompact ? 11 : 15;
    const planTitleFontSize = isCompact ? 16 : 18;
    const planPriceFontSize = isCompact ? 16 : 18;
    const badgeFontSize = 12;
    const selectedPlanStyle = isCompact
      ? { borderColor: appThemeStore.colors.border, borderWidth: 2, zIndex: 2 }
      : { borderColor: appThemeStore.colors.border, borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2 };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appThemeStore.colors.background }}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false && !this.props.root.state.oauth_modal_show}
          onRequestClose={() => this.setState({ auth_modal: false })}
          onDismiss={() => this.setState({ auth_modal: false })}>
          <Auth
            method={this.state.auth_method}
            modal={true}
            close={() => this.setState({ auth_modal: false })}
            onSuccess={() => this.setState({ auth_modal: false })}
          />
        </Modal>

        <Modal
          animationType="fade"
          presentationStyle={'overFullScreen'}
          transparent={true}
          visible={this.state.modal_yoo_kassa}
        >
          <View activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View style={{ backgroundColor: appThemeStore.colors.surface, flex: 1, flexDirection: 'column', marginTop: 40, borderRadius: 8 }}>
              <View style={{ height: 56, flexDirection: 'row', justifyContent: 'flex-end', borderBottomColor: '#ddd', borderBottomWidth: 1 }}>
                <TouchableOpacity onPress={() => this.closeYooKassa()} style={{ width: 32, height: 32, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 8, margin: 8 }}>
                  <AppIcon icon={CloseIcon} size={24} color={appThemeStore.colors.text} style={{ margin: 8 }} />
                </TouchableOpacity>

              </View>
              <View style={{ flex: 1 }}>
                {Platform.OS === 'web' ? (
                  <iframe
                    key={this.state.payment_url}
                    src={this.state.payment_url}
                    title="Оплата подписки"
                    style={{ width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#FFF' }}
                    onLoad={() => this.setState({ payment_webview_loading: false })}
                  />
                ) : (
                  <WebView
                    source={{ uri: this.state.payment_url }}
                    style={{ flex: 1 }}
                    onLoadStart={() => this.setState({ payment_webview_loading: true })}
                    onLoadEnd={() => this.setState({ payment_webview_loading: false })}
                    onError={() => this.setState({ payment_webview_loading: false })}
                  />
                )}
                {this.state.payment_webview_loading &&
                  <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: appThemeStore.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={appThemeStore.colors.mutedText} />
                    <Text style={{ marginTop: 16, color: subscriptionTextColor('#777'), fontSize: 14 }}>Загрузка страницы оплаты...</Text>
                  </View>
                }
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView style={{ flex: 1 }} >

          <View style={{ marginLeft: pageHorizontalMargin, marginRight: pageHorizontalMargin }}>

            {appStore.has_subscription == true &&
              <React.Fragment>
                <View style={{ marginTop: 16, borderRadius: 8, backgroundColor: appThemeStore.colors.backgroundLight, padding: 8 }}>
                  {appStore.subscription_info.subscription_id == 4 ? (
                    <React.Fragment>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        У вас активирован
                      </Text>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        вечный PRO-доступ
                      </Text>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        Ваш PRO-доступ активен до:
                      </Text>
                      <View style={{ marginTop: 8 }}>
                        <Text style={{ textAlign: 'center', fontSize: 18, marginTop: 8, fontWeight: 'bold', color: appThemeStore.colors.text }}> {moment(appStore.subscription_info.end_date).format('DD.MM.YYYY')}</Text>
                      </View>
                    </React.Fragment>
                  )}
                </View>

                {appStore.type_payment == 'by_store' &&
                  <React.Fragment>
                    <TouchableOpacity onPress={() => this.sync_subscription()} style={{ marginTop: 16, backgroundColor: app_theme_colors.red, height: 48, borderRadius: 8 }}>
                      {this.state.load_sync_button == true ? (
                        <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 48, fontSize: 16 }}>Синхронизировать с сайтом</Text>
                      )}
                    </TouchableOpacity>
                    <Text style={{ marginTop: 8 }}>
                      Если вы оплатили подписку через AppStore, но на сайте ваша подписка не отображается, синхронизуруйте данные.
                    </Text>
                  </React.Fragment>
                }
              </React.Fragment>
            }

            {appStore.has_subscription == false &&
              <React.Fragment>
                <View style={{ marginTop: 16, flexDirection: 'column', justifyContent: 'center' }}>
                  {appStore.has_subscription == true &&
                    <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Продлить доступ</Text>
                  }
                </View>

                <View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={MegaphoneOffIcon} size={32} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Выключить рекламу</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={WifiIcon} size={32} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Чтение без интернета</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={BookAIcon} size={32} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Словарь без лимитов</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={VolumeIcon} size={32} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Озвучка слов без лимитов</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            }

            {this.can_show_pricing() &&
              <React.Fragment>
                <View style={{ marginTop: 16, borderWidth: 1, borderColor: appThemeStore.colors.border, borderRadius: 8, overflow: isCompact ? 'hidden' : 'visible' }}>

                  {/* 1 месяц */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(1)}>
                    <View style={[{ borderRadius: 8, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 88, flexDirection: 'row', justifyContent: 'space-between' }, this.state.active_subscription == 1 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 1 && { color: app_theme_colors.red }]}>1 месяц</Text>
                        <Text style={{ fontSize: 16, marginTop: 8 }}>{this.getPrice('read_1_month', this.read_1_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_1_month', this.read_1_month, 1)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* 6 месяцев */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(2)}>
                    <View style={[{ borderRadius: 8, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 88, flexDirection: 'row', justifyContent: 'space-between' }, this.state.active_subscription == 2 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 2 && { color: app_theme_colors.red }]}>6 месяцев</Text>
                        <Text style={{ fontSize: 16, marginTop: 8 }}>{this.getPrice('read_6_month', this.read_6_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <View style={{ borderColor: appThemeStore.colors.border, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }}>
                          <Text numberOfLines={1} style={{ fontSize: badgeFontSize }}>Экономия {this.getDiscountPercent('read_6_month', this.read_6_month, 6)}%</Text>
                        </View>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_6_month', this.read_6_month, 6)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* 1 год */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(3)}>
                    <View style={[{ borderRadius: 8, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 88, flexDirection: 'row', justifyContent: 'space-between' }, this.state.active_subscription == 3 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 3 && { color: app_theme_colors.red }]}>1 год</Text>
                        <Text style={{ fontSize: 16, marginTop: 8 }}>{this.getPrice('read_1_year', this.read_1_year)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <View style={{ backgroundColor: app_theme_colors.red, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8 }}>
                          <Text numberOfLines={1} style={{ color: '#FFF', fontSize: badgeFontSize }}>Лучшее предложение</Text>
                        </View>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_1_year', this.read_1_year, 12)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* Навсегда */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(4)}>
                    <View style={[{ borderRadius: 8, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 88, flexDirection: 'row', justifyContent: 'space-between' }, this.state.active_subscription == 4 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 4 && { color: app_theme_colors.red }]}>Навсегда</Text>
                        <Text numberOfLines={1} style={{ fontSize: isCompact ? 14 : 16, marginTop: 8 }}>Единоразовый платёж</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPrice('read_forever', this.read_forever)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                </View>

                {this.state.active_subscription == 4 &&
                  <Text style={{ marginTop: 16, color: subscriptionTextColor('#888'), fontSize: 12 }}>Доступ оплачивается один раз — продлевать не нужно.</Text>
                }
                {appStore.type_payment == 'by_yoo_kassa' && this.state.active_subscription != 4 &&
                  <Text style={{ marginTop: 16, color: subscriptionTextColor('#888'), fontSize: 12 }}>По окончании периода подписка не продлевается автоматически.</Text>
                }

                <Text style={{ marginTop: 8, color: subscriptionTextColor('#888'), fontSize: 12 }}>PRO-доступ распространяется на сайт <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: subscriptionTextColor(app_theme_colors.red) }}>reedle.ru</Text> и другие устройства, авторизованные под вашим аккаунтом.</Text>

                <TouchableOpacity
                  onPress={() => this.state.active_subscription == 4 ? this.initForeverPayment() : this.initSubscriptionPayment()}
                  style={{ marginTop: 16, backgroundColor: app_theme_colors.red, height: 48, borderRadius: 8 }}>
                  {this.state.load_payment_button == true ? (
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  ) : (
                    <Text numberOfLines={1} adjustsFontSizeToFit={true} style={{ color: '#FFF', textAlign: 'center', lineHeight: 48, fontSize: 16, fontWeight: 'bold', paddingHorizontal: 8 }}>
                      {appStore.has_subscription ? 'Продлить' : this.getButtonLabel()}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    this.setState({ load_restore_button: true });
                    await this.props.root.checkSubscription();
                    this.setState({ load_restore_button: false });
                  }}
                  style={{ marginTop: 16, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' }}>
                  {this.state.load_restore_button ? (
                    <ActivityIndicator size="small" color={subscriptionTextColor('#888')} />
                  ) : (
                    <Text style={{ color: subscriptionTextColor('#555'), textAlign: 'center', fontSize: 16 }}>Восстановить покупки</Text>
                  )}
                </TouchableOpacity>

              </React.Fragment>
            }

            <View style={{ marginTop: 32, marginBottom: 32, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")} style={{ marginRight: 16 }}>
                <Text style={{ color: subscriptionTextColor('#aaa'), textAlign: 'center', fontSize: 14 }}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")} style={{}}>
                <Text style={{ color: subscriptionTextColor('#aaa'), textAlign: 'center', fontSize: 14 }}>Privacy policy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Подробности условий использования</Text>

            <Text style={{ fontSize: 14, marginTop: 8, color: subscriptionTextColor('#555'), lineHeight: 20 }}>
              Приложение распространяется бесплатно, без ограничений по времени. Автоматического списания средств нет.{'\n\n'}
              {'PRO-доступ можно приобрести на 1 месяц (' + this.getPrice('read_1_month', this.read_1_month) + '), 6 месяцев (' + this.getPrice('read_6_month', this.read_6_month) + '), 1 год (' + this.getPrice('read_1_year', this.read_1_year) + ') или навсегда (' + this.getPrice('read_forever', this.read_forever) + '). PRO убирает рекламу и открывает чтение без интернета.\n\n'}
              По окончании периода PRO-доступ не продлевается автоматически — для продления необходимо совершить покупку повторно в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: subscriptionTextColor(app_theme_colors.red) }}>reedle.ru</Text>. Пожизненный доступ продлевать не нужно.{'\n\n'}
              Возврат средств возможен только через поддержку Apple (для покупок через App Store). По другим вопросам пишите на info@reedle.ru.
            </Text>

            <View style={{ height: 40 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
});
