class Profile extends React.Component {
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

      var server_books = await new Request('/api/v1/books', {}, { do_not_show_error: true }).get();
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

  avatarLetters(email) {
    var email_name = String(email || '').split('@')[0];
    return email_name.replace(/[^a-zа-яё0-9]/gi, '').slice(0, 2).toUpperCase() || '?';
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

  appVersion() {
    return Platform.OS == 'android' ? CURRENT_ANDROID_VERSION : CURRENT_IOS_VERSION;
  }

  render() {
    var current_user = this.props.root.state.current_user;

    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          visible={this.state.auth_modal && current_user == false && !this.props.root.state.oauth_modal_show}
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
                <Text style={{ color: app_theme_colors.inverseText, fontSize: 32, fontWeight: 'bold' }}>{this.avatarLetters(current_user.email)}</Text>
              </View>
              <Text style={[{ marginTop: 16, marginBottom: 32, fontSize: 16, color: app_theme_colors.text }, { color: appThemeStore.colors.text }]}>{current_user.email}</Text>
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
            <Text style={[profileStyles.app_info_text, { color: appThemeStore.colors.mutedText }]}>Версия приложения: {this.appVersion()}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

class ProfileMemory extends React.Component {
  constructor(props) {
    super(props);
    this.state = { books: [], loading: true, deleting: false };
  }

  componentDidMount() {
    this.loadBooks();
    this._unsubscribeFocus = this.props.stack.navigation.addListener('focus', () => this.loadBooks());
  }

  componentWillUnmount() {
    if (this._unsubscribeFocus) this._unsubscribeFocus();
  }

  async loadBooks() {
    if (this._loadBooksPromise) return this._loadBooksPromise;
    this._loadBooksPromise = this._loadBooks().finally(() => { this._loadBooksPromise = null; });
    return this._loadBooksPromise;
  }

  async _loadBooks() {
    try {
      var booksPath = file_root + '/' + BOOKS_FILENAME;
      if (!(await RNFS.exists(booksPath))) {
        this.setState({ books: [], loading: false });
        return;
      }

      var books = JSON.parse(await RNFS.readFile(booksPath, 'utf8'));
      var downloaded = await Promise.all(books.map(async (book) => {
        var haveFile = await AsyncStorage.getItem('have_file_' + book.id);
        return haveFile == 'true' ? book : null;
      }));
      downloaded = downloaded.filter(Boolean);

      var calculatedSizes = {};
      for (var index = 0; index < downloaded.length; index++) {
        var book = downloaded[index];
        if (book.downloaded_size != null) continue;

        try {
          var size = await downloadStore.calculateBookSize(book.id);
          book = Object.assign({}, book, { downloaded_size: size });
          downloaded[index] = book;
          calculatedSizes[book.id] = size;
        } catch (_) {
          // Если старая загрузка повреждена, оставляем размер неизвестным.
        }
      }

      if (Object.keys(calculatedSizes).length > 0) {
        await downloadStore.updateBookSizes(calculatedSizes);
      }
      this.setState({ books: downloaded, loading: false });
    } catch (_) {
      this.setState({ books: [], loading: false });
    }
  }

  formatSize(size) {
    var bytes = Number(size || 0);
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
  }

  totalSize() {
    return this.state.books.reduce((total, book) => total + Number(book.downloaded_size || 0), 0);
  }

  confirmDelete(book) {
    AppAlert.confirm(
      'Удалить книгу?',
      '«' + (book.name_en || book.name) + '» будет удалена с устройства.',
      () => this.deleteBooks([book.id]),
      'Удалить'
    );
  }

  confirmClear() {
    if (this.state.books.length == 0) return;
    AppAlert.confirm(
      'Очистить память?',
      'Все скачанные книги будут удалены с устройства.',
      () => this.deleteBooks(this.state.books.map((book) => book.id)),
      'Очистить'
    );
  }

  async deleteBooks(bookIds) {
    if (this.state.deleting) return;
    this.setState({ deleting: true });
    try {
      await downloadStore.removeBooks(bookIds);
      await this.loadBooks();
    } catch (_) {
      AppAlert.alert('Ошибка', 'Не удалось удалить скачанные книги.');
    } finally {
      this.setState({ deleting: false });
    }
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <View style={[{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 }, { borderBottomColor: appThemeStore.colors.border }]}>
          <Text style={[{ fontSize: 16, fontWeight: '600' }, { color: appThemeStore.colors.text }]}>
            {'Занято: ' + this.formatSize(this.totalSize())}
          </Text>
          <TouchableOpacity
            disabled={this.state.books.length == 0 || this.state.deleting}
            onPress={() => this.confirmClear()}>
            <Text style={[{ color: app_theme_colors.red, fontSize: 16, fontWeight: '600' }, (this.state.books.length == 0 || this.state.deleting) && profileStyles.memoryActionDisabled]}>Очистить</Text>
          </TouchableOpacity>
        </View>

        {this.state.loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />
        ) : (
          <ScrollView contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
          }}>
            {this.state.books.length == 0 && (
              <Text style={[{ paddingTop: 64, textAlign: 'center', fontSize: 16 }, { color: appThemeStore.colors.mutedText }]}>Скачанных книг нет</Text>
            )}
            {this.state.books.map((book) => (
              <View key={book.id} style={[{ minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 }, { borderBottomColor: appThemeStore.colors.border }]}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                  <Text numberOfLines={1} style={[{ fontSize: 16 }, { color: appThemeStore.colors.text }]}>{book.name_en || book.name}</Text>
                  <Text style={[{ marginTop: 8, fontSize: 14 }, { color: appThemeStore.colors.mutedText }]}>{this.formatSize(book.downloaded_size)}</Text>
                </View>
                <TouchableOpacity accessibilityLabel="Удалить книгу" disabled={this.state.deleting} onPress={() => this.confirmDelete(book)} style={this.state.deleting && profileStyles.memoryActionDisabled}>
                  <AppIcon icon={TrashIcon} size={24} color={app_theme_colors.red} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }
}

class ProfileDetails extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      social_loader: false,
    };
  }

  async disconnectSocial(type) {
    if (this.state.social_loader) return;

    this.setState({ social_loader: type });
    try {
      var response = await new Request('/api/v1/users/social/' + type, {
        user_id: this.props.root.state.current_user.id,
      }).delete();

      if (response == false || response.error != undefined) return;

      appStore.setCurrentUser(response);
      this.props.root.setState({ current_user: response });
      await new Storage().set('current_user', JSON.stringify(response));
    } finally {
      this.setState({ social_loader: false });
    }
  }

  socialAction(type, connected) {
    if (connected) {
      this.disconnectSocial(type);
    } else {
      this.props.root.oauthAuthorization.authorize(type, this.props.root.state.current_user.id);
    }
  }

  renderSocialRow(type, title, color, image, connected, last) {
    return (
      <TouchableOpacity
        style={[{ minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: app_theme_colors.backgroundLight }, { borderBottomColor: appThemeStore.colors.border }, last && { borderBottomWidth: 0 }]}
        disabled={this.state.social_loader != false}
        onPress={() => this.socialAction(type, connected)}>
        <View style={[{ width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: connected ? color : appThemeStore.colors.backgroundLight }]}>
          <Image style={{ width: 24, height: 24 }} source={image} />
        </View>
        <Text style={[{ flex: 1, marginLeft: 16, fontSize: 16 }, { color: appThemeStore.colors.text }]}>{title}</Text>
        {this.state.social_loader == type ? (
          <ActivityIndicator size="small" color={appThemeStore.colors.mutedText} />
        ) : (
          <Text style={{ color: app_theme_colors.red, fontSize: 14 }}>{connected ? 'Отключить' : 'Подключить'}</Text>
        )}
      </TouchableOpacity>
    );
  }

  async log_out() {
    await new Storage().remove('current_user');
    await new Storage().set('has_subscription', 'false');
    await new Storage().set('subscription_info', JSON.stringify({}));

    this.props.root.setState({
      current_user: false,
      has_subscription: false,
      subscription_info: {},
    });
    appStore.setSubscription(false);
    appStore.setSubscriptionInfo({});
    appStore.setCurrentUser(false);
  }

  render() {
    var current_user = this.props.root.state.current_user;
    if (current_user == false) return <Auth />;

    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <UpdateProfile current_user={current_user} />

          <Text style={[{ marginTop: 32, fontSize: 18, fontWeight: 'bold' }, { color: appThemeStore.colors.text }]}>Привязать соц. сети</Text>
          <Text style={{ marginTop: 8, marginBottom: 16, color: '#777' }}>Для быстрого входа в аккаунт</Text>
          <View style={[{ borderWidth: 1, borderColor: app_theme_colors.backgroundLight, borderRadius: 8, overflow: 'hidden' }, { borderColor: appThemeStore.colors.border }]}>
            {this.renderSocialRow('vk', 'VK', '#0077FF', require('./app/images/profile/auth/socials/vk.png'), current_user.vk_connected)}
            {this.renderSocialRow('yandex', 'Яндекс', '#f9d657', require('./app/images/profile/auth/socials/ya.png'), current_user.yandex_connected)}
            {this.renderSocialRow('google', 'Google', '#df432f', require('./app/images/profile/auth/socials/google.png'), current_user.google_connected, true)}
          </View>

          <TouchableOpacity style={{ height: 40, backgroundColor: app_theme_colors.red, borderRadius: 8, marginTop: 32 }} onPress={() => this.log_out()}>
            <Text style={{ textAlign: 'center', flex: 1, color: app_theme_colors.inverseText, lineHeight: 40 }}>Выйти из аккаунта</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ height: 40, marginTop: 8, justifyContent: 'center' }} onPress={() => Linking.openURL('https://reedle.ru/profile/delete')}>
            <Text style={{ color: app_theme_colors.red, textAlign: 'center' }}>Удалить аккаунт</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

class ProfilePassword extends React.Component {
  render() {
    var current_user = this.props.root.state.current_user;
    if (current_user == false) return <Auth />;

    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <ChangePassword current_user={current_user} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
