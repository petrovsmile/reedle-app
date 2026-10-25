class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      saving: false,
      notifications_enabled: false,
      goals_loaded: false,
      goals_saving: false,
      reminder_enabled: false,
      reminder_hour: 19,
      reminder_minute: 0,
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
    const goals = appStore.current_user
      ? await new Request('/api/v2/reading/goals', {}, { do_not_show_error: true }).get()
      : false;
    if (this.is_screen_mounted)
      this.setState({
        goals_loaded: goals !== false,
        reminder_enabled: goals !== false && goals.reminder_enabled === true,
        reminder_hour: goals !== false ? Number(goals.reminder_hour ?? 19) : 19,
        reminder_minute: goals !== false ? Number(goals.reminder_minute ?? 0) : 0,
        loaded: true,
        notifications_enabled: enabled === 'true',
      });
  }

  async saveNotifications(enabled) {
    if (this.state.saving || this.state.goals_saving) return;
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
      await this.load();
    } finally {
      if (this.is_screen_mounted)
        this.setState({
          saving: false,
        });
    }
  }

  async saveGoalNotifications() {
    if (!this.state.notifications_enabled || !this.state.goals_loaded || this.state.goals_saving || this.state.saving) return;
    this.setState({ goals_saving: true });
    try {
      const response = await new Request('/api/v2/reading/goals', {
        reminder_enabled: this.state.reminder_enabled,
        reminder_hour: this.state.reminder_hour,
        reminder_minute: this.state.reminder_minute,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }, { do_not_show_error: true }).put();
      AppAlert.alert(response === false ? 'Не удалось сохранить напоминания' : 'Напоминания сохранены');
    } finally {
      if (this.is_screen_mounted) this.setState({ goals_saving: false });
    }
  }

  renderGoalNotifications() {
    const disabled = !this.state.notifications_enabled || !this.state.goals_loaded || this.state.saving || this.state.goals_saving;
    const time_disabled = disabled || !this.state.reminder_enabled;
    return (
      <View style={{ marginTop: 24, padding: 16, borderWidth: 1, borderColor: appThemeStore.colors.border, borderRadius: 12, backgroundColor: appThemeStore.colors.surface }}>
        <Text style={{ color: appThemeStore.colors.text, fontSize: 18, fontWeight: '600' }}>Напоминания о целях</Text>
        {!this.state.notifications_enabled && <Text style={{ marginTop: 8, color: appThemeStore.colors.mutedText }}>Включите push-уведомления, чтобы настроить напоминания.</Text>}
        {!this.state.goals_loaded && <Text style={{ marginTop: 8, color: appThemeStore.colors.mutedText }}>{appStore.current_user ? 'Не удалось загрузить настройки напоминаний.' : 'Войдите, чтобы настроить напоминания о целях.'}</Text>}
        <View accessibilityState={{ disabled }} style={{ opacity: disabled ? 0.45 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <Text style={{ flex: 1, color: appThemeStore.colors.text }}>Напоминать о цели</Text>
            <Switch accessibilityLabel="Напоминать о цели" disabled={disabled} value={this.state.reminder_enabled} onValueChange={value => this.setState({ reminder_enabled: value })} trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }} />
          </View>
          <Text style={{ marginTop: 16, color: appThemeStore.colors.text }}>Время напоминания</Text>
          <View pointerEvents={time_disabled ? 'none' : 'auto'} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, opacity: !disabled && time_disabled ? 0.45 : 1 }}>
            <Picker accessibilityLabel="Часы" enabled={!time_disabled} selectedValue={this.state.reminder_hour} onValueChange={value => this.setState({ reminder_hour: Number(value) })} style={[{ flex: 1, height: 32, color: appThemeStore.colors.text }, Platform.OS === 'web' && { outlineStyle: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: appThemeStore.colors.border, borderRadius: 8, backgroundColor: appThemeStore.colors.surface, paddingHorizontal: 10, cursor: time_disabled ? 'default' : 'pointer' }]} >
              {Array.from({ length: 24 }, (_, hour) => <Picker.Item key={hour} label={String(hour).padStart(2, '0')} value={hour} />)}
            </Picker>
            <Text style={{ color: appThemeStore.colors.text, marginHorizontal: Platform.OS === 'web' ? 8 : 0 }}>:</Text>
            <Picker accessibilityLabel="Минуты" enabled={!time_disabled} selectedValue={this.state.reminder_minute} onValueChange={value => this.setState({ reminder_minute: Number(value) })} style={[{ flex: 1, height: 32, color: appThemeStore.colors.text }, Platform.OS === 'web' && { outlineStyle: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: appThemeStore.colors.border, borderRadius: 8, backgroundColor: appThemeStore.colors.surface, paddingHorizontal: 10, cursor: time_disabled ? 'default' : 'pointer' }]} >
              {Array.from({ length: 60 }, (_, minute) => <Picker.Item key={minute} label={String(minute).padStart(2, '0')} value={minute} />)}
            </Picker>
          </View>
          <TouchableOpacity disabled={disabled} onPress={() => this.saveGoalNotifications()} style={{ marginTop: 16, padding: 14, borderRadius: 8, alignItems: 'center', backgroundColor: app_theme_colors.red }}>
            {this.state.goals_saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Сохранить напоминания</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
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
                    disabled={this.state.goals_saving}
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
            {this.renderGoalNotifications()}
          </View>
        </ScrollView>
      </AppSafeAreaView>
    );
  }
}
