const ProfileDetails = observer(
  class ProfileDetails extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        social_loader: false,
      };
    }
    async disconnectSocial(type) {
      if (this.state.social_loader) return;
      this.setState({
        social_loader: type,
      });
      try {
        var response = await new Request(
          '/api/v2/users/social/' + type,
          {},
        ).delete();
        if (response == false || response.error != undefined) return;
        appStore.setCurrentUser(response);
        await persistCurrentUser(response);
      } finally {
        this.setState({
          social_loader: false,
        });
      }
    }
    socialAction(type, connected) {
      if (connected) {
        this.disconnectSocial(type);
      } else {
        this.props.root.oauthAuthorization.authorize(type);
      }
    }
    renderSocialRow(type, title, color, image, connected, last) {
      return (
        <TouchableOpacity
          style={[
            {
              minHeight: 56,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: app_theme_colors.backgroundLight,
            },
            {
              borderBottomColor: appThemeStore.colors.border,
            },
            last && {
              borderBottomWidth: 0,
            },
          ]}
          disabled={this.state.social_loader != false}
          onPress={() => this.socialAction(type, connected)}
        >
          <View
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              },
              {
                backgroundColor: connected
                  ? color
                  : appThemeStore.colors.backgroundLight,
              },
            ]}
          >
            <Image
              style={{
                width: 24,
                height: 24,
              }}
              source={image}
            />
          </View>
          <Text
            style={[
              {
                flex: 1,
                marginLeft: 16,
                fontSize: 16,
              },
              {
                color: appThemeStore.colors.text,
              },
            ]}
          >
            {title}
          </Text>
          {this.state.social_loader == type ? (
            <ActivityIndicator
              size="small"
              color={appThemeStore.colors.mutedText}
            />
          ) : (
            <Text
              style={{
                color: app_theme_colors.red,
                fontSize: 14,
              }}
            >
              {connected ? 'Отключить' : 'Подключить'}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
    async logOut() {
      await push_notification_service.detachCurrentUser();
      await new Request(
        '/api/v2/users/logout',
        {},
        {
          do_not_show_error: true,
        },
      ).delete();
      await clearAuthenticationState();
      progressStore.setSummary(null);
      progressStore.dismissNotification();
    }
    render() {
      var current_user = appStore.current_user;
      if (current_user == false) return <Auth />;
      return (
        <AppSafeAreaView
          style={[
            applicationStyles.save_area_view,
            {
              backgroundColor: appThemeStore.colors.background,
            },
          ]}
        >
          <ScrollView contentContainerStyle={profileStyles.section}>
            <UpdateProfile current_user={current_user} root={this.props.root} />

            <Text
              style={[
                {
                  marginTop: 32,
                  fontSize: 18,
                  fontWeight: 'bold',
                },
                {
                  color: appThemeStore.colors.text,
                },
              ]}
            >
              Привязать соц. сети
            </Text>
            <Text
              style={{
                marginTop: 8,
                marginBottom: 16,
                color: '#777',
              }}
            >
              Для быстрого входа в аккаунт
            </Text>
            <View
              style={[
                {
                  borderWidth: 1,
                  borderColor: app_theme_colors.backgroundLight,
                  borderRadius: 8,
                  overflow: 'hidden',
                },
                {
                  borderColor: appThemeStore.colors.border,
                },
              ]}
            >
              {this.renderSocialRow(
                'vk',
                'VK',
                '#0077FF',
                require('./app/images/profile/auth/socials/vk.png'),
                current_user.vk_connected,
              )}
              {this.renderSocialRow(
                'yandex',
                'Яндекс',
                '#f9d657',
                require('./app/images/profile/auth/socials/ya.png'),
                current_user.yandex_connected,
              )}
              {this.renderSocialRow(
                'google',
                'Google',
                '#df432f',
                require('./app/images/profile/auth/socials/google.png'),
                current_user.google_connected,
                true,
              )}
            </View>

            <TouchableOpacity
              style={{
                height: 40,
                backgroundColor: app_theme_colors.red,
                borderRadius: 8,
                marginTop: 32,
              }}
              onPress={() => this.logOut()}
            >
              <Text
                style={{
                  textAlign: 'center',
                  flex: 1,
                  color: app_theme_colors.inverseText,
                  lineHeight: 40,
                }}
              >
                Выйти из аккаунта
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                height: 40,
                marginTop: 8,
                justifyContent: 'center',
              }}
              onPress={() =>
                Linking.openURL('https://reedle.ru/profile/delete')
              }
            >
              <Text
                style={{
                  color: app_theme_colors.red,
                  textAlign: 'center',
                }}
              >
                Удалить аккаунт
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </AppSafeAreaView>
      );
    }
  },
);
