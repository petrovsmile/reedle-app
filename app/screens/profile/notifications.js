class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      saving: false,
      notifications_enabled: false,
    };
  }

  componentDidMount() {
    this.is_screen_mounted = true;
    this.load();
  }

  componentWillUnmount() {
    this.is_screen_mounted = false;
  }

  async load() {
    const enabled = await storage.get(
      'push_notifications_enabled',
      'false',
    );
    if (this.is_screen_mounted)
      this.setState({
        loaded: true,
        notifications_enabled: enabled === 'true',
      });
  }

  async saveNotifications(enabled) {
    if (this.state.saving) return;
    this.setState({
      saving: true,
    });
    try {
      if (enabled) {
        if (!(await push_notification_service.enable())) {
          this.showPermissionError();
          if (this.is_screen_mounted)
            this.setState({
              notifications_enabled: false,
            });
          return;
        }
      } else {
        await push_notification_service.disable();
      }
      if (this.is_screen_mounted)
        this.setState({
          notifications_enabled: enabled,
        });
    } finally {
      if (this.is_screen_mounted)
        this.setState({
          saving: false,
        });
    }
  }

  showPermissionError() {
    const error_code = push_notification_service.errorCode();
    const messages = {
      install_required:
        'На iPhone и iPad сначала добавьте Reedle на экран «Домой», откройте приложение с иконки и попробуйте снова.',
      unsupported: 'Этот браузер не поддерживает push-уведомления Reedle.',
      server_not_configured: 'Web Push пока не настроен на сервере.',
    };
    const message =
      messages[error_code] ||
      'Разрешите уведомления для Reedle в настройках устройства и попробуйте снова.';
    AppAlert.alert('Уведомления не включены', message);
  }

  render() {
    if (!this.state.loaded) {
      return (
        <ActivityIndicator
          style={{
            flex: 1,
          }}
          color={appThemeStore.colors.mutedText}
        />
      );
    }
    return (
      <AppSafeAreaView
        style={{
          backgroundColor: appThemeStore.colors.background,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 48,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 640,
              alignSelf: 'center',
            }}
          >
            <Text
              style={{
                color: appThemeStore.colors.text,
                fontSize: 20,
                fontWeight: '700',
              }}
            >
              Уведомления
            </Text>

            <View
              style={{
                marginTop: 24,
                padding: 16,
                borderWidth: 1,
                borderColor: appThemeStore.colors.border,
                borderRadius: 12,
                backgroundColor: appThemeStore.colors.surface,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingRight: 16,
                  }}
                >
                  <Text
                    style={{
                      color: appThemeStore.colors.text,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    Push-уведомления
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      color: appThemeStore.colors.mutedText,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Получайте уведомления Reedle на этом устройстве.
                  </Text>
                </View>
                {this.state.saving ? (
                  <ActivityIndicator color={app_theme_colors.red} />
                ) : (
                  <Switch
                    value={this.state.notifications_enabled}
                    onValueChange={value => this.saveNotifications(value)}
                    trackColor={{
                      false: appThemeStore.colors.backgroundLight,
                      true: app_theme_colors.red,
                    }}
                  />
                )}
              </View>
              <Text
                style={{
                  marginTop: 12,
                  color: appThemeStore.colors.mutedText,
                  fontSize: 12,
                  lineHeight: 18,
                }}
              >
                Вы можете отключить уведомления для этого устройства в любой
                момент.
              </Text>
            </View>
          </View>
        </ScrollView>
      </AppSafeAreaView>
    );
  }
}
