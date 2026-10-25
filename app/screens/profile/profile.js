const Profile = observer(class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      book_colors: [],
      auth_modal: false,
    };
  }

  componentDidMount() {
    this.loadBookColors();
  }

  async loadBookColors() {
    try {
      var exists = await RNFS.exists(file_root + '/' + BOOKS_FILENAME);
      if (exists) {
        var cached_books = JSON.parse(await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8'));
        this.setBookColors(cached_books);
      }

      var server_books = await new Request('/api/v2/books', {}, { do_not_show_error: true }).get();
      if (server_books != false) this.setBookColors(server_books);
    } catch (error) {
      // У страницы всегда остаётся резервный цвет, даже если кэш книг повреждён.
    }
  }

  setBookColors(books) {
    var colors = books
      .map((book) => book.color)
      .filter((color, index, list) => typeof color == 'string' && color.length > 0 && list.indexOf(color) == index);

    this.setState({ book_colors: colors });
  }

  avatarColor(user) {
    if (this.state.book_colors.length == 0) return app_theme_colors.red;

    var numeric_id = parseInt(user.id, 10);
    if (isNaN(numeric_id)) {
      numeric_id = String(user.id || user.email || '')
        .split('')
        .reduce((sum, character) => sum + character.charCodeAt(0), 0);
    }

    return this.state.book_colors[Math.abs(numeric_id) % this.state.book_colors.length];
  }

  avatarLetters(user) {
    var first_name = String(user.first_name || '').trim();
    var last_name = String(user.last_name || '').trim();

    if (first_name.length > 0 && last_name.length > 0) {
      return (Array.from(last_name)[0] + Array.from(first_name)[0]).toUpperCase();
    }

    var email_name = String(user.email || '').split('@')[0];
    return email_name.replace(/[^a-zа-яё0-9]/gi, '').slice(0, 2).toUpperCase() || '?';
  }

  profileTitle(user) {
    var first_name = String(user.first_name || '').trim();
    var last_name = String(user.last_name || '').trim();

    if (first_name.length > 0 && last_name.length > 0) {
      return last_name + ' ' + first_name;
    }

    return user.email;
  }

  renderMenuItem(title, onPress, last) {
    return (
      <TouchableOpacity
        style={[{ minHeight: 56, marginLeft: 16, paddingRight: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: app_theme_colors.backgroundLight }, last && { borderBottomWidth: 0 }]}
        onPress={onPress}>
        <Text style={[{ flex: 1, fontSize: 16 }, { color: appThemeStore.colors.text }]}>{title}</Text>
        <Text style={{ color: '#aaa', fontSize: 18, lineHeight: 28 }}>›</Text>
      </TouchableOpacity>
    );
  }

  render() {
    var current_user = appStore.current_user;

    return (
      <AppSafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          visible={this.state.auth_modal && current_user == false && !appStore.oauth_modal_show}
          onRequestClose={() => this.setState({ auth_modal: false })}
          onDismiss={() => this.setState({ auth_modal: false })}>
          <Auth
            method="login"
            modal={true}
            close={() => this.setState({ auth_modal: false })}
            onSuccess={() => this.setState({ auth_modal: false })}
          />
        </Modal>

        <ScrollView contentContainerStyle={{
          alignItems: 'center',
          paddingTop: 32,
          paddingBottom: 32,
        }}>
          {current_user == false ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Войти в аккаунт"
              onPress={() => this.setState({ auth_modal: true })}
              style={{ minHeight: 48, marginBottom: 32, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: app_theme_colors.red, borderRadius: 8 }}>
              <AppIcon icon={UserIcon} size={24} color={app_theme_colors.inverseText} />
              <Text style={{ marginLeft: 8, color: app_theme_colors.inverseText, fontSize: 16, fontWeight: '600' }}>Войти в аккаунт</Text>
            </TouchableOpacity>
          ) : (
            <React.Fragment>
              <View style={[{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: this.avatarColor(current_user) }]}>
                <Text style={{ color: app_theme_colors.inverseText, fontSize: 32, fontWeight: 'bold' }}>{this.avatarLetters(current_user)}</Text>
              </View>
              <Text style={[{ marginTop: 16, marginBottom: 32, fontSize: 16, color: app_theme_colors.text }, { color: appThemeStore.colors.text }]}>{this.profileTitle(current_user)}</Text>
            </React.Fragment>
          )}

          <View style={{ alignSelf: 'stretch', marginBottom: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: app_theme_colors.backgroundLight }}>
            {this.renderMenuItem('ПРО-доступ', () => this.props.root_stack.navigation.navigate('subscription', { backTitle: 'Профиль' }))}
            {current_user != false &&
              <React.Fragment>
                {this.renderMenuItem('Аккаунт', () => this.props.stack.navigation.navigate('profile_details'))}
                {this.renderMenuItem('Изменить пароль', () => this.props.stack.navigation.navigate('profile_password'))}
              </React.Fragment>
            }
            {current_user != false && this.renderMenuItem('Статистика и цели', () => this.props.root_stack.navigation.navigate('statistics', { backTitle: 'Профиль' }))}
            {this.renderMenuItem('Уведомления', () => this.props.root_stack.navigation.navigate('notification_settings', { backTitle: 'Профиль' }))}
            {this.renderMenuItem('Память', () => this.props.stack.navigation.navigate('profile_memory'))}
            {this.renderMenuItem('Цветовая схема', () => this.props.stack.navigation.navigate('profile_settings'), true)}
          </View>

          <View style={{ alignSelf: 'stretch', paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={[profileStyles.app_info_text, { color: appThemeStore.colors.mutedText }]}>Техническая поддержка:{' '}
              <Text
                accessibilityRole="link"
                onPress={() => Linking.openURL('mailto:info@reedle.ru')}
                style={{ color: app_theme_colors.red, textDecorationLine: 'underline' }}>info@reedle.ru</Text>
            </Text>
            <Text style={[profileStyles.app_info_text, { color: appThemeStore.colors.mutedText }]}>Версия приложения: {APP_VERSION}</Text>
          </View>
        </ScrollView>
      </AppSafeAreaView>
    );
  }
});
