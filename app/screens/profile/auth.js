class Auth extends React.Component {
  static contextType = SafeAreaInsetsContext;

  constructor(props) {
    super(props);

    this.state = {
      method: 'login',
      email: null,
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      button_loader: false,
      remember_password_thanks: false
    }
  }

  async componentDidMount() {
    if (this.props.method != undefined) {
      this.setState({
        method: this.props.method
      });
    }
  }

  componentWillUnmount() {
  }

  changeMethod(method) {
    this.setState({
      method: method,
      button_loader: false,
      error: false,
      remember_password_thanks: false
    });
  }

  async sendForm(method) {
    if (this.state.button_loader == false) {
      this.setState({
        button_loader: true
      }, () => {
        if (method == 'login') {
          this.login();
        }
        if (method == 'reg') {
          this.reg();
        }
        if (method == 'remember_password') {
          this.remember_password();
        }
      });
    }
  }

  async login() {
    var response = await new Request('/api/v2/users/login', {
      email: this.state.email,
      password: this.state.password
    }).post();

    this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        this.setState({
          error: false
        });

        appStore.setCurrentUser(response);

        await persistCurrentUser(response);

        await root_app.checkSubscription();
        push_notification_service.syncDevice();
        if (this.props.onSuccess) await this.props.onSuccess(response);
      }
    }

  }

  async reg() {
    var response = await new Request('/api/v2/users/registration', {
      email: this.state.email,
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).post();

    this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        this.setState({
          error: false
        });

        appStore.setCurrentUser(response);

        await persistCurrentUser(response);

        await root_app.checkSubscription();
        push_notification_service.syncDevice();
        if (this.props.onSuccess) await this.props.onSuccess(response);
      }
    }
  }

  async remember_password() {
    var response = await new Request('/api/v2/users/remember_password', {
      email: this.state.email,
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).post();

    this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        this.setState({
          error: false
        });

        this.setState({
          remember_password_thanks: true
        });
      }
    }
  }

  render() {
    var safeAreaInsets = this.context || { top: 0, right: 0 };
    var safeAreaTop = Platform.OS === 'web' ? 0 : (safeAreaInsets.top || 0);
    var safeAreaRight = Platform.OS === 'web' ? 0 : (safeAreaInsets.right || 0);

    return (
      <AppSafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView contentContainerStyle={this.props.modal == true ? { paddingTop: 32 } : undefined}>
          <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>

            <View style={{ padding: 16 }}>
              {this.props.bookmark_info != undefined &&
                <React.Fragment>
                  <Text style={bookmarksStyles.auth_into}>
                    Для того чтобы воспользоваться закладками или словарем,
                    необходимо
                    <Text style={{ color: app_theme_colors.red }}> авторизоваться </Text>
                    или
                    <Text style={{ color: app_theme_colors.red }}> зарегистрироваться</Text>
                  </Text>
                </React.Fragment>
              }

              {this.state.method == 'login' &&
                <Text style={profileStyles.title}>Вход</Text>
              }
              {this.state.method == 'reg' &&
                <Text style={profileStyles.title}>Регистрация</Text>
              }
              {this.state.method == 'remember_password' &&
                <Text style={profileStyles.title}>Восстановить пароль</Text>
              }

              <View style={[{ height: 40, marginBottom: 8, marginTop: 24, backgroundColor: app_theme_colors.backgroundLight, borderRadius: 8 }, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => this.changeMethod('login')} style={[profileStyles.authorization_form_tab, { backgroundColor: this.state.method == 'login' ? appThemeStore.colors.background : appThemeStore.colors.backgroundLight }]}>
                    <Text style={profileStyles.authorization_form_tab_text}>Вход</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.changeMethod('reg')} style={[profileStyles.authorization_form_tab, { backgroundColor: this.state.method == 'reg' ? appThemeStore.colors.background : appThemeStore.colors.backgroundLight }]}>
                    <Text style={profileStyles.authorization_form_tab_text}>Регистрация</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {this.state.remember_password_thanks ? (
                <View style={{ marginBottom: 8, backgroundColor: app_theme_colors.backgroundLight, borderRadius: 8 }}>
                  <Text style={{ textAlign: 'center', margin: 8, fontSize: 16, lineHeight: 100 }}>Новый пароль отправлен на почту</Text>
                </View>
              ) : (
                <React.Fragment>
                  {this.state.method == 'remember_password' &&
                    <Text style={{ textAlign: 'center', marginTop: 24, marginBottom: 8 }}>Новый пароль придет на почту</Text>
                  }

                  <View style={profileStyles.point_input}>
                    <Text style={profileStyles.input_title}>E-mail</Text>
                    <TextInput
                      onChangeText={(value) => this.setState({ email: value })}
                      style={profileStyles.input}
                      placeholder={"E-mail"}
                    />
                  </View>

                  {(this.state.method == 'login' || this.state.method == 'reg') &&
                    <View style={profileStyles.point_input}>
                      <Text style={profileStyles.input_title}>Пароль</Text>
                      <TextInput
                        secureTextEntry={this.state.securePassword}
                        onChangeText={(value) => this.setState({ password: value })}
                        style={profileStyles.input}
                        placeholder={"Пароль"}
                      />
                      <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                        <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={24} color="#777" style={{ margin: 8 }} />
                      </TouchableOpacity>
                    </View>
                  }

                  {this.state.method == 'reg' &&
                    <View style={profileStyles.point_input}>
                      <Text style={profileStyles.input_title}>Повторите пароль</Text>
                      <TextInput
                        secureTextEntry={this.state.securePassword}
                        onChangeText={(value) => this.setState({ repeat_password: value })}
                        style={profileStyles.input}
                        placeholder={"Пароль"}
                      />
                      <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                        <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={24} color="#777" style={{ margin: 8 }} />
                      </TouchableOpacity>
                    </View>
                  }

                  {this.state.error != false &&
                    <Text style={profileStyles.error_block}>{this.state.error}</Text>
                  }

                  <TouchableOpacity onPress={() => this.sendForm(this.state.method)} style={profileStyles.form_button}>
                    {this.state.button_loader == true &&
                      <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                    }

                    {this.state.button_loader == false &&
                      <React.Fragment>
                        {this.state.method == 'login' &&
                          <Text style={profileStyles.form_button_text}>Вход</Text>
                        }
                        {this.state.method == 'reg' &&
                          <Text style={profileStyles.form_button_text}>Регистрация</Text>
                        }
                        {this.state.method == 'remember_password' &&
                          <Text style={profileStyles.form_button_text}>Отправить</Text>
                        }
                      </React.Fragment>
                    }
                  </TouchableOpacity>

                  {this.state.method == 'login' &&
                    <TouchableOpacity onPress={() => this.changeMethod('remember_password')} style={{ marginTop: 16 }}>
                      <Text>Забыли пароль?</Text>
                    </TouchableOpacity>
                  }

                  <Text style={{ textAlign: 'center', marginTop: 24 }}>
                    Войти через соц. сети
                  </Text>
                  <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', marginTop: 16 }}>
                    <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#0077FF', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('vk')}>
                      <SocialAuthIcon name="vk" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#f9d657', borderRadius: 8, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('yandex')}>
                      <SocialAuthIcon name="ya" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#df432f', borderRadius: 8, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('google')}>
                      <SocialAuthIcon name="google" />
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              )}

              <View style={{ height: 104 }}></View>

            </View>
          </View>
        </ScrollView>
        {this.props.modal == true &&
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Закрыть окно авторизации" onPress={() => this.props.close()} style={{ position: Platform.OS === 'web' ? 'fixed' : 'absolute', top: safeAreaTop + 8, right: safeAreaRight + 8, zIndex: 100, elevation: 6, width: 32, height: 32, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon icon={CloseIcon} size={24} color={appThemeStore.colors.text} />
          </TouchableOpacity>
        }
        {this.props.modal == true && <AppErrorNotice />}
      </AppSafeAreaView>
    )
  }
}
