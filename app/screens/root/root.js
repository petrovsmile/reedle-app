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
      confirm_conditions: true,
      books_percents: {},

      error_show: false,
      error_title: '',
      error_description: '',
      type_payment: Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa'
    }

    this.notification_timer;
  }

  async componentDidMount() {
    if (Platform.OS == 'ios') {
      RNIap.setup({ storekitMode: 'STOREKIT_HYBRID_MODE' })

      await RNIap.initConnection();
      await RNIap.getSubscriptions({ skus: ['read_1_month', 'read_6_month', 'read_1_year'] });
      await RNIap.getProducts({ skus: ['read_forever'] });
    }

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

    if (await new Storage().get('openAppFirst') == undefined) {
      new Storage().set('openAppFirst', 'true');

      YandexMetrica.sendEvent('openAppFirst', {
        platform: Platform.OS,
      });
    } else {
      //this.check_location();

      YandexMetrica.sendEvent('openAppNotFirst', {
        platform: Platform.OS,
      });
    }
  }

  componentWillUnmount() {
    if (this._unsubNet) {
      this._unsubNet();
    }
    clearTimeout(this.notification_timer);
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
    var has_subscription = await new Storage().get('has_subscription', 'false');

    var subscription_info = await new Storage().get('subscription_info');
    if (subscription_info != undefined) {
      subscription_info = JSON.parse(subscription_info);
    } else {
      subscription_info = {};
    }

    await this.setState({
      has_subscription: has_subscription == 'true',
      subscription_info: subscription_info
    });
    appStore.setSubscription(has_subscription == 'true');
    appStore.setSubscriptionInfo(subscription_info);

    if (this.type_payment == 'by_store') {
      var purchases = await RNIap.getPurchaseHistory({ skus: ['read_1_month', 'read_6_month', 'read_1_year', 'read_forever'] });
      if (purchases.length != 0) {
        purchases.sort(function (a, b) {
          var keyA = new Date(a.transactionDate),
            keyB = new Date(b.transactionDate);
          // Compare the 2 dates
          if (keyA > keyB) return -1;
          if (keyA < keyB) return 1;
          return 0;
        });

        var purchase = purchases[0];

        var time_subsription = moment.unix(parseInt(purchase.transactionDate) / 1000);

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

        if (moment() < end_date) {
          var subscription_info = {
            end_date: end_date.format('YYYY-MM-DD HH:MM'),
            subscription_id: subscription_id
          }

          await new Storage().set('has_subscription', 'true');
          await new Storage().set('subscription_info', JSON.stringify(subscription_info));

          await this.setState({
            subscription_info: subscription_info,
            has_subscription: true,
          });
          appStore.setSubscription(true);
          appStore.setSubscriptionInfo(subscription_info);

          if (this.state.current_user) {
            this.sync_subscription_with_server(
              this.state.current_user.id,
              subscription_id,
              end_date.format('YYYY-MM-DD HH:MM')
            );
          }
        } else {
          await new Storage().set('has_subscription', 'false');

          await this.setState({
            has_subscription: false
          });
          appStore.setSubscription(false);
        }
      }
    }

    if (this.state.current_user != false && this.state.has_subscription == false) {
      var response = await new Request('/api/v1/users/subscription', {
        user_id: this.state.current_user.id
      }, {
        do_not_show_error: true
      }).get();
      if (response != false) {
        await this.setState({
          subscription_info: response,
          has_subscription: true,
        });
        appStore.setSubscription(true);
        appStore.setSubscriptionInfo(response);
        response['subscription_id'] = response['subscription']['id'];
        await new Storage().set('has_subscription', 'true');
        await new Storage().set('subscription_info', JSON.stringify(response));
      }
    }

    if (this.state.has_subscription == true) {
      var subscription_info = JSON.parse(await new Storage().get('subscription_info'));

      var end_date = moment(subscription_info.end_date);
      var now_time = moment();
      if (end_date < now_time) {
        await new Storage().set('has_subscription', 'false');
        await this.setState({
          has_subscription: false,
        });
        appStore.setSubscription(false);
      }
    }

    return this.state.has_subscription;
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
        {this.state.confirm_conditions == false ? (
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
