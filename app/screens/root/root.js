var root_app;
class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;

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
  }

  async componentDidMount() {
    this.initAds();

    var current_user = await new Storage().get('current_user');

    if (current_user != undefined) {
      var parsed_user = JSON.parse(current_user);
      await this.setState({
        current_user: parsed_user,
      });
      appStore.setCurrentUser(parsed_user);
    }

    var confirm_conditions = await new Storage().get('confirm_conditions_' + POLICY_VERSION);
    var confirm_val = confirm_conditions == 'true';
    await this.setState({
      confirm_conditions: confirm_val
    });
    appStore.setConfirmConditions(confirm_val);

    this.checkSubscription();

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
    });

    // Обработка URL-схемы когда приложение уже запущено (foreground/background)
    this._linkSub = Linking.addEventListener('url', (e) => {
      this.handleOAuthURL(e.url);
    });

    // Обработка URL-схемы когда приложение было убито iOS и запускается заново
    Linking.getInitialURL().then((url) => {
      if (url) this.handleOAuthURL(url);
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
    await new Request('/api/v1/payments/sync_subscription', {
      user_id: user_id,
      subscription_id: subscription_id,
      end_date: end_date,
    }, {}).post();
  }

  async checkSubscription() {
    var has_subscription = (await new Storage().get('has_subscription', 'false')) == 'true';

    var subscription_info_raw = await new Storage().get('subscription_info');
    var subscription_info = subscription_info_raw != undefined
      ? JSON.parse(subscription_info_raw)
      : {};

    this.setState({ has_subscription, subscription_info });
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    // 1. Сначала проверяем подписку на сайте
    const current_user = appStore.current_user;
    if (current_user) {
      var response = await new Request('/api/v1/users/subscription', {
        user_id: current_user.id
      }, {
        do_not_show_error: true
      }).get();
      if (response != false) {
        response['subscription_id'] = response['subscription']['id'];
        const server_end_date = response.end_date ? moment(response.end_date) : null;
        const is_valid = !server_end_date || server_end_date > moment();
        if (is_valid) {
          has_subscription = true;
          this.setState({ subscription_info: response, has_subscription: true });
          appStore.setSubscription(true);
          appStore.setSubscriptionInfo(response);
          await new Storage().set('has_subscription', 'true');
          await new Storage().set('subscription_info', JSON.stringify(response));
        }
      }
    }

    // 2. Если на сайте не найдено — проверяем App Store
    if (!has_subscription && this.state.type_payment == 'by_store') {
      try {
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
            end_date: end_date.format('YYYY-MM-DD HH:MM'),
            subscription_id: subscription_id,
          };
          has_subscription = true;

          await new Storage().set('has_subscription', 'true');
          await new Storage().set('subscription_info', JSON.stringify(subscription_info));

          this.setState({ subscription_info, has_subscription: true });
          appStore.setSubscription(true);
          appStore.setSubscriptionInfo(subscription_info);

          if (current_user) {
            this.sync_subscription_with_server(
              current_user.id,
              subscription_id,
              end_date.format('YYYY-MM-DD HH:MM')
            );
          }
        } else {
          has_subscription = false;
          await new Storage().set('has_subscription', 'false');
          this.setState({ has_subscription: false });
          appStore.setSubscription(false);
        }
      } catch (e) {
        console.warn('Error checking subscription via RevenueCat:', e);
      }
    }

    if (has_subscription) {
      var stored_info = JSON.parse(await new Storage().get('subscription_info'));
      var end_date = moment(stored_info.end_date);
      if (end_date < moment()) {
        has_subscription = false;
        await new Storage().set('has_subscription', 'false');
        this.setState({ has_subscription: false });
        appStore.setSubscription(false);
      }
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
        Alert.alert(false, 'Интернета по-прежнему нет(');
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

    return (
      <React.Fragment>
        <TargetVersion />
        {this.state.confirm_conditions === null ? (
          <View style={{ flex: 1, backgroundColor: '#fff' }} />
        ) : this.state.confirm_conditions == false ? (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 15 }}>
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
          <React.Fragment>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" options={() => ({ headerShown: false })}>
                  {(stack) => (
                    <TabStack root={this} stack={stack} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Show" options={({ navigation, route }) => ({
                  title: false,
                  headerStyle: {
                    backgroundColor: route.params.color,
                    borderColor: 'transparent',
                    shadowColor: 'transparent'
                  },
                  headerBackTitle: 'Список книг',
                  headerBackTitleStyle: {
                    color: '#FFF',
                  },
                  headerBackTitleVisible: Platform.OS === 'ios',
                  headerBackImage: () => (
                    <ImageBackground style={{ width: 30, height: 30, marginLeft: 10 }}
                      resizeMode='cover'
                      source={require('./app/images/header/arrow-left-white.png')} />
                  )
                }
                )}>
                  {(stack) => (
                    <Show stack={stack} root={this} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Reader"
                  options={({ navigation, route }) => ({
                    headerShown: false
                  })}>
                  {(stack) => (
                    <Reader home_stack_state={this} root={this} stack={stack} />
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
                  <Image source={require('./app/images/layouts/error_close.png')} style={applicationStyles.error_request_icon_image} />
                </View>
              </TouchableOpacity>
            }
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
