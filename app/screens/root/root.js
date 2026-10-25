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

const RootApp = observer(class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;
    this.oauthAuthorization = new OAuthAuthorization(this);
    this.navigationRef = React.createRef();
    this.pwaOAuthCallback = false;
    this.restoreWebLocationAfterOAuth();
    this.pendingDeepLink = this.deepLinkFromWebLocation();

    this._checkingSubscription = false;
    this._webSessionRequest = null;
    this._nativeSessionRequest = null;
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
      var params = { book_id: bookMatch[1] };
      if (bookMatch[2]) {
        var locationParams = new URLSearchParams(window.location.search);
        var page = parseInt(locationParams.get('page'), 10);
        var paragraphMatch = window.location.hash.match(/^#paragraph_(\d+)$/);
        if (page > 0) {
          params.bookmark = {
            page: page,
            paragraph: paragraphMatch ? parseInt(paragraphMatch[1], 10) : null,
          };
        }
      }
      return { screen: bookMatch[2] ? 'reader' : 'show', params: params };
    }

    if (/^\/app\/bookmarks\/?$/.test(window.location.pathname)) {
      return { screen: 'home', params: { screen: 'bookmarks' } };
    }

    if (/^\/app\/dictionary\/?$/.test(window.location.pathname)) {
      return { screen: 'home', params: { screen: 'dictionary' } };
    }

    if (/^\/app\/subscription\/?$/.test(window.location.pathname)) {
      return { screen: 'subscription', params: { backTitle: 'Книги' } };
    }

    if (/^\/app\/profile\/?$/.test(window.location.pathname)) {
      return { screen: 'home', params: { screen: 'profile' } };
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
      appStore.setCurrentUser(JSON.parse(current_user));
      await this.migrateNativeAuthentication();
    }

    if (Platform.OS === 'web') {
      var network_state = await NetInfo.fetch();
      appStore.setInternet(network_state.isConnected);
      if (network_state.isConnected) await this.refreshWebSession(false);
      this.startWebSessionChecks();
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

    await push_notification_service.initialize(this);
    push_notification_service.syncDevice();
    push_notification_service.requestPermissionOnStartup().catch((error) => {
      console.warn('Unable to request notification permission:', error);
    });

    var confirm_conditions = await new Storage().get('confirm_conditions_' + POLICY_VERSION);
    var confirm_val = confirm_conditions == 'true';
    appStore.setConfirmConditions(confirm_val);

    this.checkSubscription();
    if (appStore.current_user) {
      await progressService.flush(appStore.current_user.id);
      progressService.loadSummary();
    }

    this._unsubNet = NetInfo.addEventListener(async state => {
      appStore.setInternet(state.isConnected);
      if (state.isConnected) push_notification_service.syncDevice();
      if (state.isConnected && appStore.current_user != false) {
        await this.migrateNativeAuthentication();
        if (appStore.current_user != false) {
          SyncManager.flush(appStore.current_user.id);
          progressService.flush(appStore.current_user.id);
          progressService.loadSummary();
        }
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
    push_notification_service.dispose();
    this.oauthAuthorization.cancel();
    this.stopWebSessionChecks();
    if (this._pwaUpdateHandler && typeof window !== 'undefined') {
      window.removeEventListener('reedle:pwa-update-available', this._pwaUpdateHandler);
    }
    if (this._unsubNet) {
      this._unsubNet();
    }
    if (this._linkSub) {
      this._linkSub.remove();
    }
    appStore.clearErrorTimer();
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

  async refreshWebSession(refreshSubscription = true) {
    if (Platform.OS !== 'web') return false;
    if (this._webSessionRequest) return this._webSessionRequest;

    this._webSessionRequest = (async () => {
      var previousUser = appStore.current_user;
      var response = await new Request('/api/v2/users/current', {}, {
        do_not_show_error: true,
        detailed_response: true
      }).get();

      if (response.ok) {
        appStore.setCurrentUser(response.data);
        await persistCurrentUser(response.data);

        if (refreshSubscription && (!previousUser || previousUser.id != response.data.id)) {
          this.checkSubscription();
    if (appStore.current_user) {
      await progressService.flush(appStore.current_user.id);
      progressService.loadSummary();
    }
          push_notification_service.syncDevice();
        }
        return true;
      }

      if (response.status == 401) {
        await clearAuthenticationState();
        if (previousUser) push_notification_service.syncDevice();
      }
      return false;
    })();

    try {
      return await this._webSessionRequest;
    } finally {
      this._webSessionRequest = null;
    }
  }

  async migrateNativeAuthentication() {
    if (Platform.OS === 'web' || appStore.current_user == false) return false;
    if (await new Storage().get('access_token')) return true;
    if (this._nativeSessionRequest) return this._nativeSessionRequest;

    this._nativeSessionRequest = (async () => {
      var response = await new Request('/api/v2/users/current', {}, {
        do_not_show_error: true,
        detailed_response: true,
        with_credentials: true
      }).get();

      if (response.ok) {
        appStore.setCurrentUser(response.data);
        await persistCurrentUser(response.data);
        return true;
      }

      if (response.status == 401) await clearAuthenticationState();
      return false;
    })();

    try {
      return await this._nativeSessionRequest;
    } finally {
      this._nativeSessionRequest = null;
    }
  }

  startWebSessionChecks() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    this._webSessionHandler = () => this.refreshWebSession();
    this._webVisibilityHandler = () => {
      if (document.visibilityState === 'visible') this.refreshWebSession();
    };

    window.addEventListener('focus', this._webSessionHandler);
    window.addEventListener('pageshow', this._webSessionHandler);
    window.addEventListener('online', this._webSessionHandler);
    document.addEventListener('visibilitychange', this._webVisibilityHandler);
  }

  stopWebSessionChecks() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if (this._webSessionHandler) {
      window.removeEventListener('focus', this._webSessionHandler);
      window.removeEventListener('pageshow', this._webSessionHandler);
      window.removeEventListener('online', this._webSessionHandler);
    }
    if (this._webVisibilityHandler) document.removeEventListener('visibilitychange', this._webVisibilityHandler);
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
    var response = await new Request('/api/v2/users/context', {
    }, {
      do_not_show_error: false
    }).get();

    if (response != false) {
      if (response['country'] == 'RU') {
        appStore.setTypePayment('by_yoo_kassa');
      }
    }
  }

  async sync_subscription_with_server(subscription_id, end_date) {
    return await new Request('/api/v2/payments/sync_subscription', {
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

    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    let sync_with_server = null;

    // 1. Сначала проверяем подписку на сайте
    const current_user = appStore.current_user;
    if (current_user) {
      var response = await new Request('/api/v2/users/subscription', {}, {
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
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    if (sync_with_server) {
      this.sync_subscription_with_server(
        sync_with_server.subscription_id,
        sync_with_server.end_date,
      );
    }

    return has_subscription;
  }


  showError(title, description) {
    appStore.showError(title, description);
  }

  closeError() {
    appStore.closeError();
  }

  checkInternet() {
    NetInfo.fetch().then(state => {
      if (state.isConnected == false) {
        AppAlert.alert('', 'Интернета по-прежнему нет(');
      }
      appStore.setInternet(state.isConnected);
    });
  }

  async confirm_conditions() {
    await new Storage().set('confirm_conditions_' + POLICY_VERSION, 'true');

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
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: '100%' }}>
          <AppIcon icon={ChevronLeftIcon} size={24} color={color || appThemeStore.colors.text} />
          <Text style={{ marginLeft: 8, color: color || appThemeStore.colors.text, fontSize: 16 }}>{title}</Text>
        </TouchableOpacity>
      )
    });

    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <StatusBar
          barStyle={themeColors.text == '#ffffff' ? 'light-content' : 'dark-content'}
        />
        <TargetVersion />
        {appStore.confirm_conditions === null ? (
          <AppSafeAreaView style={{ backgroundColor: themeColors.background }} />
        ) : appStore.confirm_conditions == false ? (
          <AppSafeAreaView style={{ justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: '300px', backgroundColor: themeColors.background }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Image
                  style={{ height: 200, width: 200, }}
                  source={require('./app/images/layouts/logo.png')}
                />
              </View>
              <Text>Продолжая пользоваться приложением вы принимате, что приложение собирает данные о приблизительном и принимаете условия</Text>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")}>
                <Text style={{ color: app_theme_colors.red }}>Политики конфидициальности</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")}>
                <Text style={{ color: app_theme_colors.red, marginBottom: 16 }}>Пользовательского соглашения</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => this.confirm_conditions()} style={profileStyles.form_button}>
                <Text style={profileStyles.form_button_text}>Продолжить</Text>
              </TouchableOpacity>

            </View>
          </AppSafeAreaView>
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
                <Stack.Screen name="statistics" options={({ navigation, route }) => ({
                  ...backButtonOptions(navigation, route.params && route.params.backTitle ? route.params.backTitle : 'Книги'),
                  title: 'Статистика'
                })}>
                  {(stack) => <Statistics root={this} stack={stack} />}
                </Stack.Screen>
                <Stack.Screen name="notification_settings" options={({ navigation, route }) => ({
                  ...backButtonOptions(navigation, route.params && route.params.backTitle ? route.params.backTitle : 'Профиль'),
                  title: 'Уведомления'
                })}>
                  {(stack) => <NotificationSettings root={this} stack={stack} />}
                </Stack.Screen>
                <Stack.Screen
                  name="dictionary_learning"
                  options={({ navigation }) => ({
                    ...backButtonOptions(navigation, 'Словарь')
                  })}>
                  {(stack) => (
                    <ObservedDictionaryLearning root={this} stack={stack} />
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

            <AppErrorNotice />
          </View>
        )}
        <PwaInstallBanner />
        <AppAlertModal />
        <Modal
          animationType="slide"
          presentationStyle="fullScreen"
          visible={appStore.oauth_modal_show}
          onRequestClose={() => this.oauthAuthorization.close()}>
          <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  accessibilityLabel="Закрыть"
                  onPress={() => this.oauthAuthorization.close()}
                  style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon icon={CloseIcon} size={24} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', paddingBottom: 80 }}>
                <ActivityIndicator size="large" color={app_theme_colors.red} />
                <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 24 }}>
                  Идёт авторизация…
                </Text>
                <Text style={{ fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 16 }}>
                  Авторизуйтесь в социальной сети и вернитесь в приложение.
                </Text>
              </View>
            </View>
            <AppErrorNotice />
          </AppSafeAreaView>
        </Modal>
      </View>
    );
  }
});
