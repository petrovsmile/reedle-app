var root_app;
const appLinking = {
  prefixes: ['read://', 'https://reedle.ru/app/', 'http://localhost:3001/app/'],
  config: {
    screens: {
      home: 'home',
      show: 'books/:book_id',
      reader: 'books/:book_id/reader',
      article: 'blog/:code',
    },
  },
};

class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;
    this.oauthAuthorization = new OAuthAuthorization(this);
    this.navigationRef = React.createRef();
    this.pwaOAuthCallback = false;
    this.restoreWebLocationAfterOAuth();
    this.pendingDeepLink = this.deepLinkFromWebLocation();

    this.state = {
      has_internet: true,
      has_subscription: false,
      subscription_info: {},
      current_user: false,
      confirm_conditions: null, // null = ещё не загружено из Storage
      books_percents: {},

      error_show: false,
      error_title: '',
      error_description: '',
      oauth_modal_show: false,
      oauth_manual_token: '',
      oauth_manual_loading: false,
      oauth_manual_error: false,
      type_payment: Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa'
    }

    this.notification_timer;
    this._checkingSubscription = false;
  }

  restoreWebLocationAfterOAuth() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    var oauthParams = new URLSearchParams(window.location.search);
    if (oauthParams.get('oauth') != 'pwa') return;
    this.pwaOAuthCallback = true;

    try {
      var returnLocation = window.localStorage.getItem('oauth_return_location');
      window.localStorage.removeItem('oauth_return_location');
      if (!returnLocation) return;

      var returnUrl = new URL(returnLocation, window.location.origin);
      if (returnUrl.origin != window.location.origin || !returnUrl.pathname.startsWith('/app')) return;
      window.history.replaceState({}, document.title, returnUrl.pathname + returnUrl.search + returnUrl.hash);
    } catch (_) { }
  }

  deepLinkFromWebLocation() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    var bookMatch = window.location.pathname.match(/^\/app\/books\/(\d+)(\/reader)?\/?$/);
    if (bookMatch) {
      return { screen: bookMatch[2] ? 'reader' : 'show', params: { book_id: bookMatch[1] } };
    }

    var articleMatch = window.location.pathname.match(/^\/app\/blog\/([^/]+)\/?$/);
    if (articleMatch) return { screen: 'article', params: { code: decodeURIComponent(articleMatch[1]) } };
    return null;
  }

  deepLinkFromUrl(url) {
    if (!url) return null;
    var bookMatch = url.match(/^read:\/\/books\/(\d+)(\/reader)?/);
    if (bookMatch) {
      return { screen: bookMatch[2] ? 'reader' : 'show', params: { book_id: bookMatch[1] } };
    }

    var articleMatch = url.match(/^read:\/\/blog\/([^/?]+)/);
    if (articleMatch) return { screen: 'article', params: { code: decodeURIComponent(articleMatch[1]) } };
    return null;
  }

  openPendingDeepLink() {
    if (!this.pendingDeepLink || !this.navigationRef.current) return;

    var target = this.pendingDeepLink;
    this.pendingDeepLink = null;
    this.navigationRef.current.navigate(target.screen, target.params);
  }

  async componentDidMount() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this._pwaUpdateHandler = () => this.showPwaUpdatePrompt();
      window.addEventListener('reedle:pwa-update-available', this._pwaUpdateHandler);
      if (window.reedlePwaUpdateRegistration && window.reedlePwaUpdateRegistration.waiting) {
        this.showPwaUpdatePrompt();
      }
    }

    this.initAds();

    var current_user = await new Storage().get('current_user');

    if (current_user != undefined) {
      var parsed_user = JSON.parse(current_user);
      this.setState({
        current_user: parsed_user,
      });
      appStore.setCurrentUser(parsed_user);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      var oauthParams = new URLSearchParams(window.location.search);
      if (this.pwaOAuthCallback || oauthParams.get('oauth') == 'pwa') {
        await this.oauthAuthorization.loadPwaUser();
        if (oauthParams.get('oauth') == 'pwa') {
          var cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('oauth');
          window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
        }
      }
    }

    var confirm_conditions = await new Storage().get('confirm_conditions_' + POLICY_VERSION);
    var confirm_val = confirm_conditions == 'true';
    this.setState({
      confirm_conditions: confirm_val
    });
    appStore.setConfirmConditions(confirm_val);

    this.checkSubscription();

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
      if (state.isConnected && this.state.current_user != false) {
        SyncManager.flush(this.state.current_user.id);
      }
    });

    // Обработка URL-схемы когда приложение уже запущено (foreground/background)
    this._linkSub = Linking.addEventListener('url', (e) => {
      this.oauthAuthorization.handleURL(e.url);
      this.pendingDeepLink = this.deepLinkFromUrl(e.url);
      this.openPendingDeepLink();
    });

    // Обработка URL-схемы когда приложение было убито iOS и запускается заново
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.oauthAuthorization.handleURL(url);
        this.pendingDeepLink = this.deepLinkFromUrl(url) || this.pendingDeepLink;
        this.openPendingDeepLink();
      }
    }).catch(() => { });

    if (await new Storage().get('openAppFirst') == undefined) {
      new Storage().set('openAppFirst', 'true');

      AppMetrica.reportEvent('openAppFirst', {
        platform: Platform.OS,
      });
    } else {
      //this.check_location();

      AppMetrica.reportEvent('openAppNotFirst', {
        platform: Platform.OS,
      });
    }
  }

  componentWillUnmount() {
    this.oauthAuthorization.cancel();
    if (this._pwaUpdateHandler && typeof window !== 'undefined') {
      window.removeEventListener('reedle:pwa-update-available', this._pwaUpdateHandler);
    }
    if (this._unsubNet) {
      this._unsubNet();
    }
    if (this._linkSub) {
      this._linkSub.remove();
    }
    clearTimeout(this.notification_timer);
    this._subscriptionActivationCancelled = true;
    if (this._subscriptionActivationTimer) {
      clearTimeout(this._subscriptionActivationTimer);
      this._subscriptionActivationTimer = null;
    }
    if (this._subscriptionActivationTimerResolve) {
      this._subscriptionActivationTimerResolve();
      this._subscriptionActivationTimerResolve = null;
    }
  }

  showPwaUpdatePrompt() {
    if (this._pwaUpdatePromptShown) return;
    this._pwaUpdatePromptShown = true;

    AppAlert.alert(
      'Доступна новая версия',
      'Обновите приложение, чтобы применить изменения.',
      [
        {
          text: 'Обновить',
          onPress: () => {
            if (window.reedleApplyPwaUpdate) window.reedleApplyPwaUpdate();
          }
        },
        { text: 'Позже', style: 'cancel' }
      ]
    );
  }

  async initAds() {
    if (Platform.OS === 'ios') {
      try {
        await requestTrackingPermission();
      } catch (e) { }
    }
    await MobileAds.initialize();
    adSizeBig = await BannerAdSize.inlineSize(300, 250);
    adSizeMini = await BannerAdSize.inlineSize(300, 50);
    this.forceUpdate();
  }

  async check_location() {
    var response = await new Request('/api/v1/users/context', {
    }, {
      do_not_show_error: false
    }).get();

    if (response != false) {
      if (response['country'] == 'RU') {
        this.setState({
          type_payment: 'by_yoo_kassa'
        });
        appStore.setTypePayment('by_yoo_kassa');
      }
    }
  }

  async sync_subscription_with_server(user_id, subscription_id, end_date) {
    return await new Request('/api/v1/payments/sync_subscription', {
      user_id: user_id,
      subscription_id: subscription_id,
      end_date: end_date,
    }, {}).post();
  }

  async checkSubscription() {
    if (this._checkingSubscriptionPromise) return this._checkingSubscriptionPromise;

    this._checkingSubscriptionPromise = this._doCheckSubscription();
    try {
      return await this._checkingSubscriptionPromise;
    } finally {
      this._checkingSubscriptionPromise = null;
    }
  }

  waitForSubscriptionActivation() {
    if (this._subscriptionActivationPromise) return this._subscriptionActivationPromise;

    this._subscriptionActivationCancelled = false;

    this._subscriptionActivationPromise = (async () => {
      for (var elapsed = 5000; elapsed <= 300000; elapsed += 5000) {
        await new Promise((resolve) => {
          this._subscriptionActivationTimerResolve = resolve;
          this._subscriptionActivationTimer = setTimeout(() => {
            this._subscriptionActivationTimer = null;
            this._subscriptionActivationTimerResolve = null;
            resolve();
          }, 5000);
        });

        if (this._subscriptionActivationCancelled) return false;
        if (await this.checkSubscription()) {
          AppAlert.alert('Поздравляем! PRO-доступ активирован');
          return true;
        }
      }

      return false;
    })().finally(() => {
      this._subscriptionActivationTimer = null;
      this._subscriptionActivationTimerResolve = null;
      this._subscriptionActivationPromise = null;
    });

    return this._subscriptionActivationPromise;
  }

  async _doCheckSubscription() {
    var has_subscription = (await new Storage().get('has_subscription', 'false')) == 'true';

    var subscription_info_raw = await new Storage().get('subscription_info');
    var subscription_info = subscription_info_raw != undefined
      ? JSON.parse(subscription_info_raw)
      : {};

    this.setState({ has_subscription, subscription_info });
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    let sync_with_server = null;

    // 1. Сначала проверяем подписку на сайте
    const current_user = appStore.current_user;
    if (current_user) {
      var response = await new Request('/api/v1/users/subscription', {
        user_id: current_user.id
      }, {
        do_not_show_error: true
      }).get();

      if (response == false) {
        has_subscription = false;
      } else {
        response['subscription_id'] = response['subscription'] ? response['subscription']['id'] : null;
        const server_end_date = response.end_date ? moment(response.end_date) : null;
        const is_valid = !server_end_date || server_end_date > moment();

        subscription_info = response;
        if (is_valid) {
          has_subscription = true;
        } else {
          has_subscription = false;
        }
      }
    }

    // 2. Если на сайте не найдено — проверяем App Store
    if (!has_subscription && appStore.type_payment == 'by_store') {
      try {
        await Purchases.syncPurchases();
        const customerInfo = await Purchases.getCustomerInfo();

        const proEntitlement = customerInfo.entitlements.active['pro'];

        if (proEntitlement) {
          const productId = proEntitlement.productIdentifier;
          let subscription_id;
          if (productId === 'read_1_month') subscription_id = 1;
          else if (productId === 'read_6_month') subscription_id = 2;
          else if (productId === 'read_1_year') subscription_id = 3;
          else if (productId === 'read_forever') subscription_id = 4;
          else subscription_id = 3;

          const end_date = proEntitlement.expirationDate
            ? moment(proEntitlement.expirationDate)
            : moment().add(200, 'years');

          subscription_info = {
            end_date: end_date.format('YYYY-MM-DD HH:mm'),
            subscription_id: subscription_id,
          };
          has_subscription = true;

          if (current_user) {
            sync_with_server = {
              user_id: current_user.id,
              subscription_id,
              end_date: end_date.format('YYYY-MM-DD HH:mm'),
            };
          }
        } else {
          has_subscription = false;
          subscription_info = {};
        }
      } catch (e) {
        console.warn('Error checking subscription via RevenueCat:', e);
      }
    }

    if (has_subscription && subscription_info.end_date) {
      if (moment(subscription_info.end_date) < moment()) {
        has_subscription = false;
        subscription_info = {};
      }
    }

    await new Storage().set('has_subscription', has_subscription ? 'true' : 'false');
    await new Storage().set('subscription_info', JSON.stringify(subscription_info));
    this.setState({ has_subscription, subscription_info });
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    if (sync_with_server) {
      this.sync_subscription_with_server(
        sync_with_server.user_id,
        sync_with_server.subscription_id,
        sync_with_server.end_date,
      );
    }

    return has_subscription;
  }


  showError(title, description) {
    this.setState({
      error_show: true,
      error_title: title,
      error_description: description,
    });

    console.log(title + ' ' + description);

    clearTimeout(this.notification_timer);
    this.notification_timer = setTimeout(() => {
      this.setState({
        error_show: false
      });
    }, 3000);
  }

  closeError() {
    this.setState({
      error_show: false,
    });
  }

  checkInternet() {
    NetInfo.fetch().then(state => {
      if (state.isConnected == false) {
        AppAlert.alert('', 'Интернета по-прежнему нет(');
      }
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
    });
  }

  async confirm_conditions() {
    await new Storage().set('confirm_conditions_' + POLICY_VERSION, 'true');

    this.setState({
      confirm_conditions: true
    });
    appStore.setConfirmConditions(true);
  }

  render() {


    const Stack = createStackNavigator();
    var themeColors = appThemeStore.colors;
    var backButtonOptions = (navigation, title, color) => ({
      headerTitle: '',
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: '100%' }}>
          <AppIcon icon={ChevronLeftIcon} size={24} color={color || appThemeStore.colors.text} />
          <Text style={{ marginLeft: 4, color: color || appThemeStore.colors.text, fontSize: 16 }}>{title}</Text>
        </TouchableOpacity>
      )
    });

    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <StatusBar
          barStyle={themeColors.text == '#ffffff' ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.surface}
        />
        <TargetVersion />
        {this.state.confirm_conditions === null ? (
          <View style={{ flex: 1, backgroundColor: themeColors.background }} />
        ) : this.state.confirm_conditions == false ? (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 15, backgroundColor: themeColors.background }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Image
                style={{ height: 200, width: 200, }}
                source={require('./app/images/layouts/logo.png')}
              />
            </View>
            <View>
              <Text style={{ textAlign: 'center' }}>Продолжая пользоваться приложением,</Text>

              <Text style={{ textAlign: 'center' }}>вы принимате, что</Text>
              <Text style={{ textAlign: 'center' }}>приложение собирает данные</Text>
              <Text style={{ textAlign: 'center' }}>о приблизительном местоположении</Text>
              <Text style={{ textAlign: 'center' }}>и принимаете условия</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")}>
              <Text style={{ color: app_theme_colors.red, textAlign: 'center' }}>Политики конфидициальности</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")}>
              <Text style={{ color: app_theme_colors.red, textAlign: 'center', marginBottom: 15 }}>Пользовательского соглашения</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.confirm_conditions()} style={profileStyles.form_button}>
              <Text style={profileStyles.form_button_text}>Продолжить</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <NavigationContainer
              theme={appThemeStore.navigationTheme}
              ref={this.navigationRef}
              linking={Platform.OS === 'web' ? undefined : appLinking}
              onReady={() => this.openPendingDeepLink()}>
              <Stack.Navigator initialRouteName="home">
                <Stack.Screen name="home" options={() => ({ headerShown: false })}>
                  {(stack) => (
                    <TabStack root={this} stack={stack} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="show" options={({ navigation, route }) => ({
                  ...backButtonOptions(navigation, 'Список книг', '#FFF'),
                  headerStyle: {
                    backgroundColor: route.params.color,
                    borderColor: 'transparent',
                    shadowColor: 'transparent'
                  },
                  headerShadowVisible: false,
                }
                )}>
                  {(stack) => (
                    <Show stack={stack} root={this} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="reader"
                  options={({ navigation, route }) => ({
                    headerShown: false
                  })}>
                  {(stack) => (
                    <SafeAreaInsetsContext.Consumer>
                      {(insets) => (
                        <Reader
                          home_stack_state={this}
                          root={this}
                          stack={stack}
                          safeAreaInsets={insets}
                        />
                      )}
                    </SafeAreaInsetsContext.Consumer>
                  )}
                </Stack.Screen>
                <Stack.Screen name="subscription" options={({ navigation, route }) => ({
                  ...backButtonOptions(navigation, route.params && route.params.backTitle ? route.params.backTitle : 'Книги')
                })}>
                  {() => (
                    <Subscription root={this} />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="dictionary_learning"
                  options={({ navigation }) => ({
                    ...backButtonOptions(navigation, 'Словарь')
                  })}>
                  {(stack) => (
                    <DictionaryLearning root={this} stack={stack} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="article" options={({ navigation }) => ({
                  ...backButtonOptions(navigation, 'Блог')
                })}>
                  {(stack) => (
                    <BlogArticle stack={stack} />
                  )}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>

            {this.state.error_show == true &&
              <TouchableOpacity onPress={() => this.closeError()} style={applicationStyles.error_request}>
                <View style={applicationStyles.error_request_texts}>
                  <Text style={applicationStyles.error_request_text}>
                    {this.state.error_title}
                  </Text>

                  {this.state.error_description != undefined &&
                    <Text style={applicationStyles.error_request_text}>
                      {this.state.error_description}
                    </Text>
                  }
                </View>
                <View style={applicationStyles.error_request_icon}>
                  <AppIcon icon={CloseIcon} size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            }
          </View>
        )}
        <PwaInstallBanner />
        <AppAlertModal />
        <Modal
          animationType="slide"
          presentationStyle="fullScreen"
          visible={this.state.oauth_modal_show}
          onRequestClose={() => this.oauthAuthorization.close()}>
          <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  accessibilityLabel="Закрыть"
                  onPress={() => this.oauthAuthorization.close()}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon icon={CloseIcon} size={26} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', paddingBottom: 80 }}>
                <ActivityIndicator size="large" color={app_theme_colors.red} />
                <Text style={{ fontSize: 28, fontWeight: '600', textAlign: 'center', marginTop: 24 }}>
                  Идёт авторизация…
                </Text>
                <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 16 }}>
                  Авторизуйтесь в социальной сети и вернитесь в приложение.
                </Text>
                <Text style={{ color: themeColors.mutedText, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 }}>
                  Если авторизация не подтвердилась автоматически, введите токен, который вы получите после успешного входа.
                </Text>

                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={this.state.oauth_manual_token}
                  onChangeText={(value) => this.setState({ oauth_manual_token: value, oauth_manual_error: false })}
                  onSubmitEditing={() => this.oauthAuthorization.authorizeByManualToken()}
                  placeholder="Токен авторизации"
                  returnKeyType="done"
                  style={{ height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 16, marginTop: 28 }}
                />

                {this.state.oauth_manual_error != false &&
                  <Text style={{ color: app_theme_colors.red, lineHeight: 20, marginTop: 10 }}>
                    {this.state.oauth_manual_error}
                  </Text>
                }

                <TouchableOpacity
                  disabled={!String(this.state.oauth_manual_token || '').trim() || this.state.oauth_manual_loading}
                  onPress={() => this.oauthAuthorization.authorizeByManualToken()}
                  style={[
                    profileStyles.form_button,
                    { marginTop: 16, opacity: !String(this.state.oauth_manual_token || '').trim() ? 0.5 : 1 },
                  ]}>
                  {this.state.oauth_manual_loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={profileStyles.form_button_text}>Подтвердить токен</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }
}
