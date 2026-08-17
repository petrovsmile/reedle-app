class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      book_colors: [],
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
        style={[profileStyles.menu_item, last && profileStyles.menu_item_last]}
        onPress={onPress}>
        <Text style={profileStyles.menu_item_text}>{title}</Text>
        <Text style={profileStyles.menu_item_arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  render() {
    var current_user = this.props.root.state.current_user;

    return (
      <SafeAreaView style={applicationStyles.save_area_view}>
        {current_user == false ? (
          <Auth />
        ) : (
          <ScrollView contentContainerStyle={profileStyles.page}>
            <View style={[profileStyles.avatar, { backgroundColor: this.avatarColor(current_user) }]}>
              <Text style={profileStyles.avatar_text}>{this.avatarLetters(current_user.email)}</Text>
            </View>
            <Text style={profileStyles.email}>{current_user.email}</Text>

            <View style={profileStyles.menu}>
              {this.renderMenuItem('Аккаунт', () => this.props.stack.navigation.navigate('profile_details'))}
              {this.renderMenuItem('Изменить пароль', () => this.props.stack.navigation.navigate('profile_password'))}
              {this.renderMenuItem('ПРО-доступ', () => this.props.root_stack.navigation.navigate('subscription'), true)}
            </View>
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

  socialLink(type) {
    let platform = Platform.OS === 'web' ? "web" : "app"
    let link = HOST + `/oauth_redirect/${type}?platform=${platform}`

    Linking.openURL(link);
  }

  async disconnectSocial(type) {
    if (this.state.social_loader) return;

    this.setState({ social_loader: type });
    var response = await new Request('/api/v1/users/social/' + type, {}).delete();
    this.setState({ social_loader: false });

    if (response == false || response.error != undefined) return;

    appStore.setCurrentUser(response);
    this.props.root.setState({ current_user: response });
    await new Storage().set('current_user', JSON.stringify(response));
  }

  socialAction(type, connected) {
    if (connected) {
      this.disconnectSocial(type);
    } else {
      this.socialLink(type);
    }
  }

  renderSocialRow(type, title, color, image, connected, last) {
    return (
      <TouchableOpacity
        style={[profileStyles.social_row, last && profileStyles.social_row_last]}
        disabled={this.state.social_loader != false}
        onPress={() => this.socialAction(type, connected)}>
        <View style={[profileStyles.social_icon, { backgroundColor: connected ? color : '#ddd' }]}>
          <Image style={profileStyles.social_icon_image} source={image} />
        </View>
        <Text style={profileStyles.social_name}>{title}</Text>
        {this.state.social_loader == type ? (
          <ActivityIndicator size="small" color={app_theme_colors.red} />
        ) : (
          <Text style={profileStyles.social_action}>{connected ? 'Отключить' : 'Подключить'}</Text>
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
      <SafeAreaView style={applicationStyles.save_area_view}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <UpdateProfile current_user={current_user} />

          <Text style={profileStyles.social_title}>Привязать соц. сети</Text>
          <Text style={profileStyles.social_description}>Для быстрого входа в аккаунт</Text>
          <View style={profileStyles.social_list}>
            {this.renderSocialRow('vk', 'VK', '#0077FF', require('./app/images/profile/auth/socials/vk.png'), current_user.vk_connected)}
            {this.renderSocialRow('yandex', 'Яндекс', '#f9d657', require('./app/images/profile/auth/socials/ya.png'), current_user.yandex_connected)}
            {this.renderSocialRow('google', 'Google', '#df432f', require('./app/images/profile/auth/socials/google.png'), current_user.google_connected, true)}
          </View>

          <TouchableOpacity style={profileStyles.log_out_button} onPress={() => this.log_out()}>
            <Text style={profileStyles.log_out_text}>Выйти из аккаунта</Text>
          </TouchableOpacity>

          <TouchableOpacity style={profileStyles.delete_button} onPress={() => Linking.openURL('https://reedle.ru/profile/delete')}>
            <Text style={profileStyles.delete_button_text}>Удалить аккаунт</Text>
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
      <SafeAreaView style={applicationStyles.save_area_view}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <ChangePassword current_user={current_user} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
