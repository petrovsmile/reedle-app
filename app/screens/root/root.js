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

const ThemeTestSwitcher = observer(() => {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={{ position: 'fixed', top: 10, right: 10, zIndex: 100000, flexDirection: 'row', padding: 5, borderRadius: 18, backgroundColor: appThemeStore.colors.surface, borderWidth: 1, borderColor: appThemeStore.colors.border }}>
      {Object.keys(APP_COLOR_THEMES).map((themeName) => {
        var colors = APP_COLOR_THEMES[themeName];
        var selected = appThemeStore.themeName == themeName;
        return (
          <TouchableOpacity
            key={themeName}
            onPress={() => appThemeStore.setCustomTheme(themeName)}
            accessibilityLabel={'Тема ' + themeName}
            style={{ width: 24, height: 24, marginHorizontal: 3, borderRadius: 12, backgroundColor: colors.background, borderWidth: selected ? 3 : 1, borderColor: selected ? appThemeStore.colors.text : colors.border }}
          />
        );
      })}
    </View>
  );
});

class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;
    this.navigationRef = React.createRef();
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
      type_payment: Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa'
    }

    this.notification_timer;
    this._checkingSubscription = false;
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
      if (oauthParams.get('oauth') == 'pwa') {
        await this.loadPwaOAuthUser();
        window.history.replaceState({}, document.title, window.location.pathname);
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
      this.handleOAuthURL(e.url);
      this.pendingDeepLink = this.deepLinkFromUrl(e.url);
      this.openPendingDeepLink();
    });

    // Обработка URL-схемы когда приложение было убито iOS и запускается заново
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleOAuthURL(url);
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

  async handleOAuthURL(url) {
    if (!url || !url.includes('token=')) return;

    const tokenPart = url.split('token=')[1];
    if (!tokenPart) return;
    const token = tokenPart.split('/')[0].split('&')[0];

    const response = await new Request('/api/v1/users/by_oauth_token', {
      token: token,
    }).get();

    if (!response || response['error'] != undefined) return;

    appStore.setCurrentUser(response);
    this.setState({ current_user: response }); // обновление UI
    await new Storage().set('current_user', JSON.stringify(response));
    this.checkSubscription(); // читает current_user из appStore (синхронно)
  }

  async loadPwaOAuthUser() {
    var response = await new Request('/api/v1/users/current', {}, { do_not_show_error: true }).get();
    if (!response || response['error'] != undefined) return;

    appStore.setCurrentUser(response);
    this.setState({ current_user: response });
    await new Storage().set('current_user', JSON.stringify(response));
    this.checkSubscription();
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
                  headerTitle: '',
                  headerStyle: {
                    backgroundColor: route.params.color,
                    borderColor: 'transparent',
                    shadowColor: 'transparent'
                  },
                  headerShadowVisible: false,
                  headerBackTitle: 'Список книг',
                  headerBackTitleStyle: {
                    color: '#FFF',
                  },
                  headerBackTitleVisible: Platform.OS === 'ios',
                  headerBackImage: () => <AppIcon icon={ChevronLeftIcon} size={22} color="#FFF" style={{ marginLeft: 10 }} />,
                  ...(Platform.OS === 'web' ? {
                    headerTitle: '',
                    headerLeft: () => (
                      <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: '100%' }}
                      >
                        <AppIcon icon={ChevronLeftIcon} size={24} color="#FFF" />
                        <Text style={{ marginLeft: 8, color: '#FFF', fontSize: 17 }}>Список книг</Text>
                      </TouchableOpacity>
                    ),
                  } : {}),
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
                <Stack.Screen name="subscription" options={{ title: 'ПРО-доступ' }}>
                  {() => (
                    <Subscription root={this} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="article" options={{ title: 'Блог', headerBackTitle: 'Блог' }}>
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
        <ThemeTestSwitcher />
      </View>
    );
  }
}
