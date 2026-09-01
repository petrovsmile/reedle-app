class AdvertisingConfig {
  constructor(platform) {
    this.platform = platform;
    this.bannerUnitId = platform === 'ios' ? 'R-M-1281415-12' : 'R-M-1281416-12';
    this.rewardedUnitId = platform === 'ios' ? 'R-M-1281415-13' : 'R-M-1281416-13';
    this.webFullscreenUnitIds = {
      desktop: 'R-A-19117521-1',
      touch: 'R-A-19117521-1'
    };
  }

  showWebFullscreen(darkTheme) {
    if (this.platform !== 'web' || typeof window === 'undefined') {
      return Promise.resolve('unavailable');
    }

    return new Promise((resolve) => {
      var finished = false;
      var sdkTimeout = setTimeout(() => finish('timeout'), 10000);
      var finish = (result) => {
        if (finished) return;
        finished = true;
        clearTimeout(sdkTimeout);
        resolve(result);
      };

      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(() => {
        try {
          if (!window.Ya || !window.Ya.Context || !window.Ya.Context.AdvManager) {
            finish('unavailable');
            return;
          }

          var manager = window.Ya.Context.AdvManager;
          var webPlatform = manager.getPlatform ? manager.getPlatform() : 'touch';
          var blockId = this.webFullscreenUnitIds[webPlatform] || this.webFullscreenUnitIds.touch;

          manager.render({
            type: 'fullscreen',
            blockId: blockId,
            platform: webPlatform,
            darkTheme: darkTheme === true,
            onRender: () => clearTimeout(sdkTimeout),
            onClose: () => finish('closed'),
            onError: () => finish('error')
          });
        } catch (error) {
          finish('error');
        }
      });
    });
  }
}

class AppAlertService {
  handler = null;

  alert(title, message, buttons) {
    if (this.handler) {
      var modalButtons = buttons && buttons.length ? buttons.slice() : [{ text: 'Понятно' }];
      modalButtons.sort((left, right) => Number(left.style == 'cancel') - Number(right.style == 'cancel'));
      this.handler({
        title: title || '',
        message: message || '',
        buttons: modalButtons
      });
    }
  }

  confirm(title, message, onConfirm, confirmText) {
    this.alert(title, message, [
      { text: confirmText || 'Подтвердить', style: 'destructive', onPress: onConfirm },
      { text: 'Отмена', style: 'cancel' }
    ]);
  }
}

class AppAlertModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false, title: '', message: '', buttons: [] };
  }

  componentDidMount() {
    AppAlert.handler = (options) => this.setState(Object.assign({ visible: true }, options));
  }

  componentWillUnmount() {
    AppAlert.handler = null;
  }

  close(button) {
    this.setState({ visible: false }, () => {
      if (button && button.onPress) button.onPress();
    });
  }

  render() {
    if (!this.state.visible) return null;

    return (
      <Modal
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={true}
        statusBarTranslucent={true}
        onRequestClose={() => this.close()}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => this.close()}
          style={{ flex: 1, position: 'relative', zIndex: 2147483647, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ width: '100%', maxWidth: 420, padding: 20, borderRadius: 10, backgroundColor: appThemeStore.colors.surface }}>
              {this.state.title ? <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: appThemeStore.colors.text }}>{this.state.title}</Text> : null}
              {this.state.message ? <Text style={{ marginTop: this.state.title ? 12 : 0, fontSize: 16, lineHeight: 23, textAlign: 'center', color: appThemeStore.colors.mutedText }}>{this.state.message}</Text> : null}
              <View style={{ flexDirection: 'column', marginTop: 20 }}>
                {this.state.buttons.map((button, index) => {
                  var isCancel = button.style == 'cancel';
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => this.close(button)}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        marginTop: index == 0 ? 0 : 8,
                        borderWidth: isCancel ? 1 : 0,
                        borderColor: appThemeStore.colors.border,
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isCancel ? appThemeStore.colors.backgroundLight : app_theme_colors.red
                      }}>
                      <Text style={{ color: isCancel ? appThemeStore.colors.text : '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>{button.text || 'Понятно'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  }
}

function createAppIcon() {
  return ({ icon: Icon, strokeWidth = 1.7, ...props }) => (
    <Icon strokeWidth={strokeWidth} {...props} />
  );
}

var activeAppSound = null;

class AppSound {
  constructor(filename, basePath, onLoad, onInterrupted) {
    AppSound.stopCurrent();
    this.onInterrupted = onInterrupted;
    this.released = false;
    this.sound = new Sound(filename, basePath, (error) => {
      if (onLoad) onLoad(error);
    });
    activeAppSound = this;
  }

  static stopCurrent() {
    if (activeAppSound) activeAppSound.interrupt();
  }

  interrupt() {
    if (this.released) return;
    try {
      this.sound.stop();
    } catch (_) { }
    this.release();
    if (this.onInterrupted) this.onInterrupted();
  }

  play(callback) {
    this.sound.play(callback);
  }

  setVolume(volume) {
    this.sound.setVolume(volume);
  }

  getDuration() {
    return this.sound.getDuration();
  }

  release() {
    if (this.released) return;
    this.released = true;
    try {
      this.sound.release();
    } catch (_) { }
    if (activeAppSound === this) activeAppSound = null;
  }
}

const APP_COLOR_THEMES = {
  light: { background: '#ffffff', surface: '#ffffff', backgroundLight: '#eeeeee', border: '#dddddd', text: '#000000', mutedText: '#777777', second: '#bbbbbb' },
  gray: { background: '#eeeeee', surface: '#f7f7f7', backgroundLight: '#dddddd', border: '#cccccc', text: '#000000', mutedText: '#666666', second: '#cccccc' },
  sepia: { background: '#f8f4e9', surface: '#fffaf0', backgroundLight: '#eee6d2', border: '#d4c8a0', text: '#000000', mutedText: '#756d5b', second: '#d4c8a0' },
  dark: { background: '#292c2c', surface: '#353838', backgroundLight: '#444848', border: '#5a5d5d', text: '#ffffff', mutedText: '#bbbbbb', second: '#5a5d5d' },
  black: { background: '#000000', surface: '#161616', backgroundLight: '#242424', border: '#444444', text: '#ffffff', mutedText: '#bbbbbb', second: '#444444' }
};

class AppThemeStore {
  mode = 'system';
  customTheme = 'light';
  systemScheme = Appearance.getColorScheme() || 'light';
  initialized = false;

  constructor() {
    makeAutoObservable(this);
    this.appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      runInAction(() => { this.systemScheme = colorScheme || 'light'; });
    });
  }

  get themeName() {
    if (this.mode == 'custom') return this.customTheme;
    return this.systemScheme == 'dark' ? 'dark' : 'light';
  }

  get colors() { return APP_COLOR_THEMES[this.themeName]; }

  get navigationTheme() {
    var colors = this.colors;
    var baseTheme = colors.text == '#ffffff' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.text,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: '#f05458'
      }
    };
  }

  async initialize() {
    var mode = await AsyncStorage.getItem('app_color_theme_mode');
    var customTheme = await AsyncStorage.getItem('app_color_theme');
    if (!mode) {
      var readerSettingsValue = await AsyncStorage.getItem('themeReaderSettings');
      if (readerSettingsValue) {
        try {
          var readerSettings = JSON.parse(readerSettingsValue);
          var legacyTheme = appThemeNameByBackground(readerSettings.backgroundColorTheme);
          if (legacyTheme != 'light') {
            mode = 'custom';
            customTheme = legacyTheme;
            await AsyncStorage.setItem('app_color_theme_mode', 'custom');
            await AsyncStorage.setItem('app_color_theme', legacyTheme);
          }
        } catch (e) { }
      }
    }
    runInAction(() => {
      this.mode = mode == 'custom' ? 'custom' : 'system';
      this.customTheme = APP_COLOR_THEMES[customTheme] ? customTheme : 'light';
      this.initialized = true;
    });
  }

  async setCustomTheme(themeName) {
    if (!APP_COLOR_THEMES[themeName]) return;
    runInAction(() => {
      this.mode = 'custom';
      this.customTheme = themeName;
    });
    await Promise.all([
      AsyncStorage.setItem('app_color_theme_mode', 'custom'),
      AsyncStorage.setItem('app_color_theme', themeName)
    ]);
  }
}

function appThemeNameByBackground(backgroundColor) {
  return ({
    '#ffffff': 'light',
    '#eeeeee': 'gray',
    '#f8f4e9': 'sepia',
    '#292c2c': 'dark',
    '#000000': 'black'
  })[String(backgroundColor || '').toLowerCase()] || 'light';
}

function createThemedText() {
  return observer(React.forwardRef(function ThemedText(props, ref) {
    return <NativeText {...props} ref={ref} style={[{ color: appThemeStore.colors.text }, props.style]} />;
  }));
}

function createThemedTextInput() {
  return observer(React.forwardRef(function ThemedTextInput(props, ref) {
    return (
      <NativeTextInput
        {...props}
        ref={ref}
        placeholderTextColor={props.placeholderTextColor || appThemeStore.colors.mutedText}
        style={[
          { color: appThemeStore.colors.text, backgroundColor: appThemeStore.colors.surface },
          props.style,
          {
            borderColor: appThemeStore.colors.border,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
          }
        ]}
      />
    );
  }));
}

class OAuthAuthorization {
  constructor(root) {
    this.root = root;
    this.webAttempt = 0;
  }

  async authorize(type) {
    this.open();

    await this.startWait(type);
  }

  open() {
    this.root.setState({
      oauth_modal_show: true,
      oauth_manual_token: '',
      oauth_manual_loading: false,
      oauth_manual_error: false,
    });
  }

  close() {
    this.cancel();
    this.root.setState({
      oauth_modal_show: false,
      oauth_manual_loading: false,
      oauth_manual_error: false,
    });
  }

  cancel() {
    this.webAttempt += 1;
  }

  async authorizeByManualToken() {
    var token = String(this.root.state.oauth_manual_token || '').trim();
    if (!token || this.root.state.oauth_manual_loading) return;

    this.root.setState({ oauth_manual_loading: true, oauth_manual_error: false });
    var user = await new Request('/api/v1/users/by_oauth_token', {
      token: token,
    }, {
      do_not_show_error: true,
    }).get();

    if (!user || user.error != undefined) {
      this.root.setState({
        oauth_manual_loading: false,
        oauth_manual_error: 'Не удалось подтвердить токен. Проверьте его и попробуйте ещё раз.',
      });
      return;
    }

    this.cancel();
    await this.setCurrentUser(user);
  }

  async startWait(type) {
    var attempt = ++this.webAttempt;
    var isWeb = Platform.OS === 'web';
    var oauthWindow = isWeb && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    var platform = isWeb ? 'pwa' : 'app';
    var oauthResponse = await new Request('/oauth_redirect/' + type + '/' + platform, {}, {
      do_not_show_error: true,
    }).get();

    if (attempt != this.webAttempt) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    if (!oauthResponse || oauthResponse.error != undefined || !oauthResponse.redirect_url || !oauthResponse.session_token) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    try {
      if (isWeb) {
        if (oauthWindow) {
          oauthWindow.location.href = oauthResponse.redirect_url;
        } else {
          window.open(oauthResponse.redirect_url, '_blank', 'noopener,noreferrer');
        }
      } else {
        await Linking.openURL(oauthResponse.redirect_url);
      }
    } catch (_) {
      this.root.setState({ oauth_manual_error: 'Не удалось открыть страницу авторизации.' });
      return;
    }

    var expiresAt = Date.now() + 5 * 60 * 1000;

    while (attempt == this.webAttempt && Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (attempt != this.webAttempt || Date.now() >= expiresAt) return;

      var user = await new Request('/api/v1/users/by_oauth_token', {
        token: oauthResponse.session_token,
      }, {
        do_not_show_error: true,
      }).get();

      if (!user || user.error != undefined) continue;

      this.cancel();
      await this.setCurrentUser(user);
      return;
    }
  }

  async handleURL(url) {
    if (!url) return;

    var token = '';
    try {
      token = new URL(url).searchParams.get('token') || '';
    } catch (_) {
      var tokenMatch = String(url).match(/[?&]token=([^&#/]*)/);
      token = tokenMatch ? tokenMatch[1] : '';
    }
    try {
      token = decodeURIComponent(token).trim();
    } catch (_) {
      token = String(token).trim();
    }
    if (!token) return;

    var user = await new Request('/api/v1/users/by_oauth_token', {
      token: token,
    }).get();

    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user);
  }

  async loadPwaUser() {
    var user = await new Request('/api/v1/users/current', {}, { do_not_show_error: true }).get();
    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user, false);
  }

  async setCurrentUser(user, closeModal = true) {
    appStore.setCurrentUser(user);
    this.root.setState({
      current_user: user,
      ...(closeModal ? { oauth_modal_show: false, oauth_manual_loading: false } : {}),
    });
    await new Storage().set('current_user', JSON.stringify(user));
    this.root.checkSubscription();
  }
}

class Request {
  constructor(url, params, options) {
    this.url = url;
    this.params = params;
    if (options == undefined) {
      this.options = {};
    } else {
      this.options = options;
    }
  }

  async get() {
    return await this.makeRequest('get');
  }

  async post() {
    return await this.makeRequest('post');
  }

  async put() {
    return await this.makeRequest('put');
  }

  async delete() {
    return await this.makeRequest('delete');
  }

  AbortSignal(timeoutMs) {
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), timeoutMs || 0);
  
    return abortController.signal;
  }

  async makeRequest(method) {
    if (appStore.has_internet) {
      let url = HOST + this.url;

      try {
        if (method == 'get') {
          var response = await axios.get(url, { signal: this.AbortSignal(5000), params: this.params });
        }

        if (method == 'post') {
          var response = await axios.post(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'put') {
          var response = await axios.put(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'delete') {
          var response = await axios.delete(url,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` },
              data: this.params
            },
          );
        }


        var data = response.data['response'] != undefined ? response.data['response'] : response.data;
        if (this.options.detailed_response == true) {
          return { ok: true, status: response.status, data: data };
        }
        return data;

      } catch (e) {
        if (this.options.do_not_show_error != true) {
          appStore.showError('Ошибка подключения к серверу', this.options.desciption_error);
        }
        if (this.options.detailed_response == true) {
          return {
            ok: false,
            status: e.response ? e.response.status : 0,
            data: e.response && e.response.data ? e.response.data.response : null
          };
        }
        return false;
      }

    } else {
      appStore.showError('Отсутствует подключение к интернету', this.options.desciption_error);
      if (this.options.detailed_response == true) {
        return { ok: false, status: 0, data: null };
      }
      return false;
    }
  }
}

class Select extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false, pendingValue: props.value };
  }

  selectedOption() {
    return this.props.options.find(option => option.value == this.props.value) || this.props.options[0];
  }

  select(value) {
    this.setState({ visible: false }, () => this.props.onValueChange(value));
  }

  renderWeb() {
    var style = Object.assign({
      width: '100%',
      height: 24,
      paddingLeft: 8,
      paddingRight: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: appThemeStore.colors.border,
      borderRadius: 4,
      backgroundColor: appThemeStore.colors.backgroundLight,
      color: appThemeStore.colors.text,
      fontSize: 12,
      boxSizing: 'border-box'
    }, StyleSheet.flatten(this.props.style));

    return React.createElement(
      'select',
      {
        value: this.props.value,
        onChange: (event) => this.props.onValueChange(event.target.value),
        style: style
      },
      this.props.options.map(option => React.createElement(
        'option',
        {
          key: option.value,
          value: option.value,
          style: { backgroundColor: appThemeStore.colors.surface, color: appThemeStore.colors.text }
        },
        option.title
      ))
    );
  }

  renderTrigger() {
    var selectedOption = this.selectedOption();
    return (
      <TouchableOpacity
        onPress={() => this.setState({ visible: true, pendingValue: this.props.value })}
        style={[{
          height: 24,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderRadius: 4,
          borderColor: appThemeStore.colors.border,
          backgroundColor: appThemeStore.colors.backgroundLight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }, this.props.style]}>
        <Text numberOfLines={1} style={{ color: appThemeStore.colors.text, fontSize: 12 }}>{selectedOption.title}</Text>
        <Text style={{ color: appThemeStore.colors.mutedText, fontSize: 10, marginLeft: 8 }}>▼</Text>
      </TouchableOpacity>
    );
  }

  renderItems() {
    return this.props.options.map(option => (
      <Picker.Item
        key={option.value}
        label={option.title}
        value={option.value}
        color={appThemeStore.colors.text}
      />
    ));
  }

  renderIos() {
    return (
      <React.Fragment>
        {this.renderTrigger()}
        <Modal
          animationType="slide"
          presentationStyle="overFullScreen"
          transparent={true}
          visible={this.state.visible}
          onRequestClose={() => this.setState({ visible: false })}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => this.setState({ visible: false })}
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.35)' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ paddingBottom: 24, backgroundColor: appThemeStore.colors.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                <View style={{ height: 48, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: appThemeStore.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => this.select(this.state.pendingValue)}>
                    <Text style={{ color: app_theme_colors.red, fontSize: 16, fontWeight: 'bold' }}>Готово</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.setState({ visible: false })}>
                    <Text style={{ color: appThemeStore.colors.mutedText, fontSize: 16 }}>Отмена</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={this.state.pendingValue}
                  onValueChange={(value) => this.setState({ pendingValue: value })}
                  itemStyle={{ color: appThemeStore.colors.text, fontSize: 20 }}>
                  {this.renderItems()}
                </Picker>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </React.Fragment>
    );
  }

  renderAndroid() {
    return (
      <View style={[{
        height: 32,
        borderWidth: 1,
        borderRadius: 4,
        borderColor: appThemeStore.colors.border,
        backgroundColor: appThemeStore.colors.backgroundLight,
        justifyContent: 'center',
        overflow: 'hidden'
      }, this.props.style]}>
        <Picker
          mode="dropdown"
          selectedValue={this.props.value}
          onValueChange={(value) => this.props.onValueChange(value)}
          dropdownIconColor={appThemeStore.colors.mutedText}
          style={{ width: '100%', height: 32, color: appThemeStore.colors.text }}>
          {this.renderItems()}
        </Picker>
      </View>
    );
  }

  render() {
    if (Platform.OS == 'web') return this.renderWeb();
    if (Platform.OS == 'ios') return this.renderIos();
    return this.renderAndroid();
  }
}

class Storage {
  async get(key, default_value) {
    var value = await AsyncStorage.getItem(key);
    if (value == undefined || value == null || value === '') {
      value = default_value;
      if (default_value != undefined) {
        this.set(key, default_value);
      }
    }
    return value;
  }

  async set(key, value) {
    if (value == undefined) {
      value = '';
    }

    var value = await AsyncStorage.setItem(key, value.toString());
    return value;
  }

  async remove(key) {
    await AsyncStorage.removeItem(key);
  }
}

// ==================== AppStore ====================
class AppStore {
  has_internet = true;
  has_subscription = false;
  subscription_info = {};
  current_user = false;
  confirm_conditions = true;
  books_percents = {};
  books_order = [];
  error_show = false;
  error_title = '';
  error_description = '';
  type_payment = Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa';
  show_subsription = false;

  constructor() {
    makeAutoObservable(this);
    this._notification_timer = null;
  }

  setInternet(value) { this.has_internet = value; }
  setSubscription(value) { this.has_subscription = value; }
  setSubscriptionInfo(info) { this.subscription_info = info; }
  setCurrentUser(user) { this.current_user = user; }
  setConfirmConditions(value) { this.confirm_conditions = value; }
  setBooksPercents(percents) { this.books_percents = percents; }
  setBooksOrder(bookIds) { this.books_order = Array.isArray(bookIds) ? bookIds.slice() : []; }
  setTypePayment(value) { this.type_payment = value; }
  setShowSubscription(value) { this.show_subsription = value; }

  showError(title, description) {
    this.error_show = true;
    this.error_title = title;
    this.error_description = description;
    console.log(title + ' ' + description);
    clearTimeout(this._notification_timer);
    this._notification_timer = setTimeout(() => {
      runInAction(() => { this.error_show = false; });
    }, 3000);
  }

  closeError() {
    this.error_show = false;
  }

  clearErrorTimer() {
    clearTimeout(this._notification_timer);
  }
}

// ==================== ReaderStore ====================
class ReaderStore {
  fontSize = 18;
  fontFamily = 'LibreBaskerville-Regular';
  textAlign = 'flex-start';
  translate_icon_size = 24;
  backgroundColorTheme = '#ffffff';
  textColorTheme = '#000000';
  secondColorTheme = '#bbb';
  bookmark = false;
  page = '';
  list_words = null;
  currentSpeaking = null;

  constructor() {
    makeAutoObservable(this);
  }

  setThemeSettings(settings) {
    // Мерджим — обновляем только те поля, которые реально пришли.
    // Иначе при вызове вида setThemeSettings({fontFamily: 'X'}) все
    // остальные поля стали бы undefined (баг со сбросом шрифта/размеров).
    if (settings.fontSize !== undefined) this.fontSize = settings.fontSize;
    if (settings.fontFamily !== undefined) this.fontFamily = settings.fontFamily;
    if (settings.textAlign !== undefined) this.textAlign = settings.textAlign;
    if (settings.translate_icon_size !== undefined) this.translate_icon_size = settings.translate_icon_size;
    if (settings.backgroundColorTheme !== undefined) this.backgroundColorTheme = settings.backgroundColorTheme;
    if (settings.textColorTheme !== undefined) this.textColorTheme = settings.textColorTheme;
    if (settings.secondColorTheme !== undefined) this.secondColorTheme = settings.secondColorTheme;
  }

  setBookmark(value) { this.bookmark = value; }
  setPage(value) { this.page = value; }
  setCurrentSpeaking(value) { this.currentSpeaking = value; }
  setListWords(words) { this.list_words = words; }
  clearListWords() { this.list_words = null; }
}

// ==================== DownloadStore ====================
class DownloadStore {
  downloads = {};
  completed = {};
  completionListeners = [];

  constructor() {
    makeAutoObservable(this);
  }

  get(bookId) {
    return this.downloads[bookId] || null;
  }

  isCompleted(bookId) {
    return this.completed[bookId] === true;
  }

  setCompleted(bookId, completed) {
    this.completed = Object.assign({}, this.completed, { [bookId]: completed === true });
  }

  setDownload(bookId, changes) {
    this.downloads = Object.assign({}, this.downloads, {
      [bookId]: Object.assign({}, this.downloads[bookId] || {}, changes),
    });
  }

  onCompleted(listener) {
    this.completionListeners.push(listener);
    return () => {
      this.completionListeners = this.completionListeners.filter(item => item !== listener);
    };
  }

  notifyCompleted(bookId) {
    this.completionListeners.slice().forEach(listener => listener(bookId));
  }

  byteLength(value) {
    var size = 0;
    for (var index = 0; index < value.length; index++) {
      var code = value.charCodeAt(index);
      if (code <= 0x7f) {
        size += 1;
      } else if (code <= 0x7ff) {
        size += 2;
      } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
        var nextCode = value.charCodeAt(index + 1);
        if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
          size += 4;
          index += 1;
        } else {
          size += 3;
        }
      } else {
        size += 3;
      }
    }
    return size;
  }

  async updateBookSizes(sizes) {
    var booksPath = file_root + '/' + BOOKS_FILENAME;
    if (!(await RNFS.exists(booksPath))) return;

    var books = JSON.parse(await RNFS.readFile(booksPath, 'utf8'));
    books = books.map((book) => Object.prototype.hasOwnProperty.call(sizes, book.id)
      ? Object.assign({}, book, { downloaded_size: sizes[book.id] })
      : book);
    await RNFS.writeFile(booksPath, JSON.stringify(books), 'utf8');
  }

  async calculateBookSize(bookId) {
    var bookPath = file_root + '/books/' + bookId;
    var words = await RNFS.readFile(bookPath + '/words.json', 'utf8');
    var pagination = await RNFS.readFile(bookPath + '/pagination.json', 'utf8');
    var paginationData = JSON.parse(pagination);
    var paragraphIds = [];

    Object.keys(paginationData).forEach((page) => {
      (paginationData[page] || []).forEach((paragraphId) => {
        if (paragraphIds.indexOf(paragraphId) == -1) paragraphIds.push(paragraphId);
      });
    });

    var size = this.byteLength(words) + this.byteLength(pagination);
    var batchSize = 25;
    for (var index = 0; index < paragraphIds.length; index += batchSize) {
      var batch = paragraphIds.slice(index, index + batchSize);
      var contents = await Promise.all(batch.map((paragraphId) =>
        RNFS.readFile(bookPath + '/paragraphs/' + paragraphId + '.json', 'utf8')));
      contents.forEach((value) => { size += this.byteLength(value); });
    }

    return size;
  }

  async removeBooks(bookIds) {
    var ids = (bookIds || []).map((bookId) => String(bookId));
    await Promise.all(ids.map(async (bookId) => {
      await AsyncStorage.setItem('have_file_' + bookId, '');
      var bookDirectory = file_root + '/books/' + bookId + '/';
      if (await RNFS.exists(bookDirectory)) await RNFS.unlink(bookDirectory);
      this.setCompleted(bookId, false);
    }));

    var sizes = {};
    ids.forEach((bookId) => { sizes[bookId] = 0; });
    await this.updateBookSizes(sizes);
  }

  async start(book) {
    if (!book || this.completed[book.id]) return;
    if (this.downloads[book.id] && this.downloads[book.id].status !== 'error') return;
    if (this.downloads[book.id] && this.downloads[book.id].status === 'error') this.dismiss(book.id);

    this.setDownload(book.id, {
      bookId: book.id,
      name: book.name,
      nameEn: book.name_en,
      color: book.color,
      progress: 0,
      status: 'preparing',
    });

    AppMetrica.reportEvent('loader', { status: 'start' });

    try {
      var files = await new Request('/api/v1/books/download_list', { book_id: book.id }).get();
      if (!files || files.length === 0) throw new Error('download_list is empty');

      await RNFS.mkdir(file_root + '/books/' + book.id + '/paragraphs/');
      this.setDownload(book.id, { status: 'downloading', progress: 2 });
      var downloadedSize = 0;

      for (var index = 0; index < files.length; index++) {
        var requestPath = files[index];
        var response = await new Request(requestPath, {}).get();
        if (response === false) throw new Error('Failed to download ' + requestPath);

        var filePath = requestPath.replace('/result', '');
        var fileContents = JSON.stringify(response);
        await RNFS.writeFile(file_root + filePath, fileContents, 'utf8');
        downloadedSize += this.byteLength(fileContents);

        var progress = Math.max(2, ((index + 1) / files.length) * 100);
        this.setDownload(book.id, { progress: progress, status: 'downloading' });
      }

      await this.updateBookSizes({ [book.id]: downloadedSize });
      await AsyncStorage.setItem('have_file_' + book.id, 'true');
      this.setCompleted(book.id, true);
      this.notifyCompleted(book.id);
      this.dismiss(book.id);
      AppMetrica.reportEvent('loader', { status: 'finish' });
      AppMetrica.reportEvent('loader', { progress: 100 });
    } catch (error) {
      this.setDownload(book.id, { status: 'error', error: error.message });
      AppMetrica.reportEvent('loader', { status: 'error' });
    }
  }

  dismiss(bookId) {
    var downloads = Object.assign({}, this.downloads);
    delete downloads[bookId];
    this.downloads = downloads;
  }
}

// ==================== HomeStore ====================
class HomeStore {
  open_property = false;

  constructor() {
    makeAutoObservable(this);
  }

  setOpenProperty(value) { this.open_property = value; }
}

class SyncManager {
  static queue_key = 'sync_operations_v1';
  static _flush_promise = null;

  static operationId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  static entityKey(entity, payload) {
    return entity == 'bookmark' ? payload.book_id.toString() : payload.original;
  }

  static async operations() {
    var value = await new Storage().get(this.queue_key, '[]');
    try {
      return JSON.parse(value);
    } catch (_) {
      return [];
    }
  }

  static async enqueue(entity, action, payload, base_version) {
    var operations = await this.operations();
    var key = this.entityKey(entity, payload);
    operations = operations.filter(operation => !(operation.entity == entity && operation.entity_key == key));
    operations.push({
      operation_id: this.operationId(),
      entity: entity,
      entity_key: key,
      action: action,
      payload: payload,
      base_version: base_version,
      created_at: new Date().toISOString()
    });
    await new Storage().set(this.queue_key, JSON.stringify(operations));
  }

  static async pendingKeys(entity) {
    var operations = await this.operations();
    return operations.filter(operation => operation.entity == entity).map(operation => operation.entity_key);
  }

  static async flush(user_id) {
    if (this._flush_promise != null) return this._flush_promise;
    this._flush_promise = this._flush(user_id).finally(() => { this._flush_promise = null; });
    return this._flush_promise;
  }

  static async _flush(user_id) {
    var operations = await this.operations();
    var startedOperationIds = operations.map(operation => operation.operation_id);
    var remaining = [];

    for (var operation of operations) {
      var result = await this.send(operation, user_id);
      if (!result.ok && result.status == 409 && result.data && result.data.item) {
        operation.base_version = result.data.item.version;
        operation.operation_id = this.operationId();
        result = await this.send(operation, user_id);
      }

      if (result.ok) {
        var currentOperations = await this.operations();
        var hasNewerOperation = currentOperations.some(value =>
          value.entity == operation.entity &&
          value.entity_key == operation.entity_key &&
          value.operation_id != operation.operation_id &&
          startedOperationIds.indexOf(value.operation_id) == -1
        );
        if (!hasNewerOperation) await this.applyAcknowledgement(operation, result.data);
      } else {
        remaining.push(operation);
        if (result.status == 0) {
          var currentIndex = operations.indexOf(operation);
          remaining = remaining.concat(operations.slice(currentIndex + 1));
          break;
        }
      }
    }

    var currentOperations = await this.operations();
    var newlyQueued = currentOperations.filter(operation => startedOperationIds.indexOf(operation.operation_id) == -1);
    remaining = remaining.concat(newlyQueued);
    await new Storage().set(this.queue_key, JSON.stringify(remaining));
    return remaining.length == 0;
  }

  static async send(operation, user_id) {
    var url = operation.entity == 'bookmark' ? '/api/v1/bookmarks' : '/api/v1/dictionary/words';
    var params = Object.assign({}, operation.payload, {
      user_id: user_id,
      operation_id: operation.operation_id
    });
    if (operation.base_version != undefined && operation.base_version != null) {
      params.base_version = operation.base_version;
    }
    var request = new Request(url, params, { do_not_show_error: true, detailed_response: true });
    return operation.action == 'delete' ? request.delete() : request.post();
  }

  static async applyAcknowledgement(operation, data) {
    var key = operation.entity == 'bookmark' ? 'bookmark_' + operation.payload.book_id : 'word_' + operation.payload.original;
    if (operation.action == 'delete') {
      await new Storage().remove(key);
      return;
    }
    var stored = await new Storage().get(key, '{}');
    stored = JSON.parse(stored);
    stored.version = data.version;
    stored.updated_at = data.updated_at;
    stored.offline = false;
    await new Storage().set(key, JSON.stringify(stored));
  }

  static async syncBookmarks(user_id) {
    await this.migrateLegacyBookmarks();
    await this.flush(user_id);
    var response = await new Request('/api/v1/bookmarks', {
      user_id: user_id,
      include_deleted: true
    }, { do_not_show_error: true, detailed_response: true }).get();
    if (!response.ok) return null;

    var pending = await this.pendingKeys('bookmark');
    var keys = [];
    for (var item of response.data) {
      var entityKey = item.book.id.toString();
      var storageKey = 'bookmark_' + entityKey;
      if (pending.indexOf(entityKey) > -1) continue;
      if (item.deleted_at) {
        await new Storage().remove(storageKey);
      } else {
        await new Storage().set(storageKey, JSON.stringify({
          book_id: item.book.id,
          book_name: item.book.name,
          page: item.page,
          paragraph: item.paragraph,
          version: item.version,
          updated_at: item.updated_at,
          offline: false
        }));
        keys.push(storageKey);
      }
    }
    var pendingOperations = await this.operations();
    for (var operation of pendingOperations.filter(value => value.entity == 'bookmark' && value.action == 'upsert')) {
      keys.push('bookmark_' + operation.payload.book_id);
    }
    keys = Array.from(new Set(keys));
    await new Storage().set('bookmarks_keys', JSON.stringify(keys));
    return keys;
  }

  static async syncWords(user_id) {
    await this.migrateLegacyWords();
    await this.flush(user_id);
    var response = await new Request('/api/v1/dictionary/words', {
      user_id: user_id,
      include_deleted: true
    }, { do_not_show_error: true, detailed_response: true }).get();
    if (!response.ok) return null;

    var pending = await this.pendingKeys('word');
    var keys = [];
    for (var item of response.data) {
      var entityKey = item.original;
      var storageKey = 'word_' + entityKey;
      if (pending.indexOf(entityKey) > -1) continue;
      if (item.deleted_at) {
        await new Storage().remove(storageKey);
      } else {
        var localWordValue = await new Storage().get(storageKey);
        var localWord = localWordValue ? JSON.parse(localWordValue) : {};
        await new Storage().set(storageKey, JSON.stringify({
          original: item.original,
          transcription: item.transcription,
          translate: item.translate,
          studied: localWord.studied === true,
          learning_shows: Number(localWord.learning_shows || 0),
          study_prompted: localWord.study_prompted === true,
          created_at: item.created_at,
          version: item.version,
          updated_at: item.updated_at,
          offline: false
        }));
        keys.push(storageKey);
      }
    }
    var pendingOperations = await this.operations();
    for (var operation of pendingOperations.filter(value => value.entity == 'word' && value.action == 'upsert')) {
      keys.push('word_' + operation.payload.original);
    }
    keys = Array.from(new Set(keys));
    await new Storage().set('words_keys', JSON.stringify(keys));
    return keys;
  }

  static async migrateLegacyBookmarks() {
    var keys = JSON.parse(await new Storage().get('bookmarks_keys', '[]'));
    var pending = await this.pendingKeys('bookmark');
    for (var key of keys) {
      var value = await new Storage().get(key);
      if (!value) continue;
      var bookmark = JSON.parse(value);
      if (bookmark.offline == true && pending.indexOf(bookmark.book_id.toString()) == -1) {
        await this.enqueue('bookmark', 'upsert', {
          book_id: bookmark.book_id,
          page: bookmark.page,
          paragraph: bookmark.paragraph
        }, bookmark.version);
      }
    }
  }

  static async migrateLegacyWords() {
    var keys = JSON.parse(await new Storage().get('words_keys', '[]'));
    var pending = await this.pendingKeys('word');
    for (var key of keys) {
      var value = await new Storage().get(key);
      if (!value) continue;
      var word = JSON.parse(value);
      if (word.offline == true && pending.indexOf(word.original) == -1) {
        await this.enqueue('word', 'upsert', {
          original: word.original,
          transcription: word.transcription,
          translate: word.translate
        }, word.version);
      }
    }
  }
}

import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  Text as NativeText,
  View,
  TouchableOpacity,
  Platform,
  ImageBackground,
  ScrollView,
  FlatList,
  Dimensions,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TextInput as NativeTextInput,
  StyleSheet,
  Modal,
  Button,
  StatusBar,
  RefreshControl,
  Switch,
  Vibration,
  Linking,
  Animated,
  Appearance
} from 'react-native';

import { WebView } from 'react-native-webview';
import { SwipeListView } from 'react-native-swipe-list-view';
import moment from 'moment';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo';
import RNRestart from 'react-native-restart';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import AppMetrica from '@appmetrica/react-native-analytics';
import * as StoreReview from 'react-native-store-review';
import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { BannerView, BannerAdSize, RewardedAdLoader, MobileAds } from 'yandex-mobile-ads';
import {
  AlignCenter as AlignCenterIcon,
  AlignJustify as AlignJustifyIcon,
  AlignLeft as AlignLeftIcon,
  AlignRight as AlignRightIcon,
  Book as BookIcon,
  BookOpen as BookOpenIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CloudDownload as CloudDownloadIcon,
  Download as DownloadIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  FileCheck as FileCheckIcon,
  Menu as MenuIcon,
  Minus as MinusIcon,
  Newspaper as NewspaperIcon,
  Play as PlayIcon,
  Plus as PlusIcon,
  RectangleHorizontal as AdvertisementIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  SlidersHorizontal as SlidersIcon,
  Trash2 as TrashIcon,
  User as UserIcon,
  Volume2 as VolumeIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  X as CloseIcon,
  ArrowDownToLine as ArrowDownToLineIcon,
  BookA as BookAIcon,
  Ellipsis as EllipsisIcon,
  EllipsisVertical as EllipsisVerticalIcon,
  MegaphoneOff as MegaphoneOffIcon
} from 'lucide-react-native';

var RNFS = require('react-native-fs');
var file_root = RNFS.DocumentDirectoryPath;

AppMetrica.activate({
  apiKey: 'c810cef0-e69a-4201-81ce-35e3d0e8ce8d',
  sessionTimeout: 120,
  firstActivationAsUpdate: false,
});

var Sound = require('react-native-sound');
Sound = Sound.default || Sound;
Sound.setCategory('Playback');

if (Platform.OS === 'ios') {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey: 'appl_yVDGxgTAqUpWVfzJNrGMYaxmwhm' });
}

const AppIcon = createAppIcon();
const appThemeStore = new AppThemeStore();
const Text = createThemedText();
const TextInput = createThemedTextInput();
const AppAlert = new AppAlertService();
const appStore = new AppStore();
const readerStore = new ReaderStore();
const downloadStore = new DownloadStore();
const homeStore = new HomeStore();

const advertisingConfig = new AdvertisingConfig(Platform.OS);
let adSizeBig = null;
let adSizeMini = null;
const AD_UNIT_BANNER = advertisingConfig.bannerUnitId;
const AD_UNIT_REWARDED = advertisingConfig.rewardedUnitId;

const CURRENT_IOS_VERSION = '2.0.0'
const CURRENT_ANDROID_VERSION = '2.0.0'
const BOOKS_FILENAME = 'books_v1.json'
const POLICY_VERSION = 'v6'
//const HOST="https://reedle.ru"
const HOST="https://stage.reedle.ru"
//const HOST="http://localhost:3000"
const API_TOKEN = 'yzniq0zn5ygrlg0i3gd1mdi41n3nyycza17dl6tpwdskfo9b50';

const app_theme_colors = {
  background: "#FFF",
  backgroundLight: "#eee",
  backgroundDarkLight: '#ddd',
  text: "#000",
  inverseText: "#FFF",
  red: '#f05458',
}

const applicationStyles = StyleSheet.create({
  save_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header_icon_image: {
    width: 30,
    height: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
    paddingBottom: 10,
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  header_title: {
    lineHeight: 30,
    height: 30,
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10
  },
  error_request: {
    position: 'absolute',
    backgroundColor: app_theme_colors.red,
    width: Dimensions.get('window').width - 30,
    top: 40, 
    left: 15,
    zIndex: 100000000,
    flexDirection: 'row',
    borderRadius: 10,
  },
  error_request_texts: {
    flex: 1,
    padding: 10,
  },
  error_request_text: {
    color: app_theme_colors.inverseText,
    lineHeight: 20,
  },
  error_request_icon: {
    width: 40,
    height: 40,
    padding: 10,
  },
  error_request_icon_image: {
    width: 20,
    height: 20
  }
});
const homeStyles = StyleSheet.create({
  safe_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10
  },
  header_title: {
    lineHeight: 35,
    fontSize: 16
  },
  logo: { 
    flexDirection: 'row',
    justifyContent: 'center',
    height: 35
  },
  logo_text: {
    fontSize: 30,
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular',
    color: app_theme_colors.text,
  },
  logo_dot: {
    fontSize: 30,
    lineHeight: 35,
    color: app_theme_colors.red,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_text: { 
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_image: {
    width: 15,
    height: 15,
    marginTop: 10,
    marginLeft: 5
  },
  search: { 
    flexDirection: 'row',
    height: 40,
    overflow: 'hidden',
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    margin: 15,
    marginTop: 10
  },
  search_image: {
    margin: 8
  },
  search_input: { 
    flex: 1,
    height: 40,
    fontSize: 16,
    color: app_theme_colors.text,
    backgroundColor: 'transparent'
  },
  level_selector: { 
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 3,
    marginLeft: 15,
    marginRight: 15,
    zIndex: 1
  },
  level_selector_wrap: {
    flexDirection: 'row'
  },
  level_selector_point: {
    flex: 1,
    backgroundColor: '#eee',
    height: 30,
    borderRadius: 5,
  },
  level_selector_point_active: {
    flex: 1, 
    borderRadius: 8
  },
  level_selector_point_text: {
    fontSize: 13, 
    color: '#000', 
    textAlign: 'center', 
    lineHeight: 30
  },
  properties: { 
    padding: 10,
    backgroundColor: '#FFF',
    marginTop: 3,
    borderRadius: 7
  },
  properties_point: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  properties_point_text: { 
    fontSize: 14,
    lineHeight: 30,
    color: '#444'
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  settings_image: {
    width: 20,
    height: 20,
    margin: 5
  },
  downloadsPanel: {
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadsTitle: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  downloadBookName: {
    marginBottom: 5,
    fontSize: 13,
    color: '#333',
  },
  downloadProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  downloadProgressValue: {
    height: 6,
    borderRadius: 3,
  },
  downloadStatus: {
    marginTop: 4,
    fontSize: 11,
    color: '#777',
  },
  downloadDismiss: {
    width: 30,
    height: 30,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadDismissText: {
    fontSize: 24,
    lineHeight: 26,
    color: '#999',
  },
});

const bookmarksStyles = StyleSheet.create({
  auth_content: {
    margin: 15,
    marginTop: 30
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 18 
  },
  bookmarkRow: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bookmarkCard: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 5,
    backgroundColor: app_theme_colors.backgroundLight,
    flexDirection: 'row'
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

const blogStyles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: '#fff' },
  scrollContent: { flex: 1, minHeight: 0 },
  content: { padding: 10, paddingBottom: 24 },
  title: { fontSize: 30, fontWeight: 'bold', margin: 5, marginBottom: 12 },
  row: { flex: 1, padding: 5 },
  card: { flex: 1 },
  cardImageWrap: { height: 180, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' },
  cardImage: { width: '100%', height: '100%' },
  infoOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  infoOverlayText: { color: '#fff', fontSize: 12 },
  look: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { marginTop: 9, color: '#111', fontSize: 15, fontWeight: 'bold', lineHeight: 20 },
  loader: { padding: 24 },
  empty: { padding: 30, textAlign: 'center', color: '#777' },
  articleContent: { padding: 15, paddingBottom: 100 },
  articleTitle: { fontSize: 30, lineHeight: 38, fontWeight: 'bold', marginBottom: 10 },
  articleInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  articleInfoText: { color: '#aaa', fontSize: 14 },
  articleImage: { width: '100%', height: 230, borderRadius: 10, backgroundColor: '#eee', marginBottom: 4 },
  block: { marginTop: 16 },
  paragraph: { fontSize: 16, lineHeight: 25, color: '#222' },
  header: { fontSize: 23, lineHeight: 30, fontWeight: 'bold' },
  delimiter: { textAlign: 'center', fontSize: 18, letterSpacing: 6 },
  listRow: { flexDirection: 'row', paddingLeft: 6, marginBottom: 7 },
  listMarker: { width: 25, fontSize: 16, lineHeight: 24 },
  listText: { flex: 1, fontSize: 16, lineHeight: 24 },
  contentImage: { width: '100%', height: 230, borderRadius: 10, backgroundColor: '#eee' },
  caption: { marginTop: 5, color: '#aaa', fontSize: 14 }
});

const dictionaryStyles = StyleSheet.create({
  auth_content: {
    margin: 15,
    marginTop: 30
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 18
  },
  button_sorting: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingLeft: 8, 
    paddingRight: 8, 
    borderRadius: 4,
    height: 24
  },
  studiedButton: {
    borderWidth: 1,
    borderColor: '#75b641',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8
  },
  studiedButtonActive: {
    backgroundColor: '#75b641'
  },
  studiedButtonText: {
    color: '#57922c',
    fontSize: 12
  },
  studiedButtonTextActive: {
    color: '#FFF'
  },
  deleteWordButton: {
    width: 24,
    height: 24,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  wordLearningProgress: {
    alignSelf: 'stretch',
    marginTop: 12
  },
  wordLearningProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  wordLearningProgressText: {
    color: '#777',
    fontSize: 12
  },
  wordLearningProgressCount: {
    color: '#aaa',
    fontSize: 12
  },
  wordLearningProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#eee'
  },
  wordLearningProgressValue: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#75b641'
  },
  learningStartButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f05458',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  learningContainer: {
    flex: 1,
    padding: 16
  },
  learningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  learningClose: {
    color: '#f05458',
    fontSize: 16
  },
  learningProgress: {
    color: '#777',
    fontSize: 16
  },
  learningCard: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF'
  },
  learningWord: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  learningTranscription: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center'
  },
  learningPrompt: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12
  },
  learningAnswer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#FFF'
  },
  learningAnswerCorrect: {
    borderColor: '#75b641',
    backgroundColor: '#eaf6df'
  },
  learningAnswerWrong: {
    borderColor: '#f05458',
    backgroundColor: '#fdebec'
  },
  learningAnswerText: {
    fontSize: 16
  },
  learningPrimaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#f05458',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16
  },
  learningPrimaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  learningSecondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f05458',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12
  },
  learningSecondaryButtonText: {
    color: '#f05458',
    fontSize: 16,
    fontWeight: 'bold'
  },
  learningBackButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12
  },
  learningBackButtonText: {
    color: '#777',
    fontSize: 15
  },
  learningTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50
  },
  learningResult: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20
  }
});

const profileStyles = StyleSheet.create({
  content: {
    padding: 15,
  },
  page: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 30,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar_text: {
    color: app_theme_colors.inverseText,
    fontSize: 32,
    fontWeight: 'bold',
  },
  email: {
    marginTop: 12,
    marginBottom: 28,
    fontSize: 16,
    color: app_theme_colors.text,
  },
  menu: {
    alignSelf: 'stretch',
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: app_theme_colors.backgroundLight,
  },
  menu_item: {
    minHeight: 54,
    marginLeft: 15,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
  },
  menu_item_last: {
    borderBottomWidth: 0,
  },
  menu_item_text: {
    flex: 1,
    fontSize: 16,
  },
  menu_item_arrow: {
    color: '#aaa',
    fontSize: 28,
    lineHeight: 30,
  },
  memorySummary: {
    minHeight: 58,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  memoryTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  memoryClear: {
    color: app_theme_colors.red,
    fontSize: 15,
    fontWeight: '600',
  },
  memoryList: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  memoryRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  memoryBookInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  memoryBookName: {
    fontSize: 15,
  },
  memoryBookSize: {
    marginTop: 5,
    fontSize: 13,
  },
  memoryDelete: {
    color: app_theme_colors.red,
    fontSize: 14,
  },
  memoryActionDisabled: {
    opacity: 0.4,
  },
  memoryEmpty: {
    paddingTop: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  section: {
    alignSelf: 'stretch',
    padding: 15,
  },
  section_title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
  },
  authorization_form_tabs: {
    height: 40,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  authorization_form_tab: {
    flex: 1,
    height: 32,
    lineHeight: 32,
    borderRadius: 7,
    margin: 4,
  },
  authorization_form_tab_text: {
    textAlign: 'center',
    lineHeight: 32,
  },
  form_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
  },
  form_button_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  input_title: {
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundDarkLight,
    borderRadius: 5,
    paddingLeft: 10
  },
  point_input: {
    marginBottom: 15,
  },
  button_remember_password: {
    marginTop: 15,
  },
  remember_password_info: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  error_block: {
    marginBottom: 10,
    color: app_theme_colors.red
  },
  password_hide_image: {
    width: 20,
    height: 20,
    margin: 10,
  },
  button_password_hide: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  log_out_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
    marginTop: 30
  },
  log_out_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  delete_button: {
    height: 40,
    marginTop: 10,
    justifyContent: 'center',
  },
  delete_button_text: {
    color: app_theme_colors.red,
    textAlign: 'center',
  },
  social_title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: 'bold',
  },
  social_description: {
    marginTop: 6,
    marginBottom: 14,
    color: '#777',
  },
  social_list: {
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  social_row: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
  },
  social_row_last: {
    borderBottomWidth: 0,
  },
  social_icon: {
    width: 38,
    height: 38,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  social_icon_image: {
    width: 23,
    height: 23,
  },
  social_name: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  social_action: {
    color: app_theme_colors.red,
    fontSize: 14,
  },
  remember_password_thanks: {
    marginBottom: 10,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  remember_password_thanks_text: {
    textAlign: 'center',
    margin: 10,
    fontSize: 16,
    lineHeight: 100,
  },
  thanks_form: {
    padding: 30,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    marginTop: 15,
  },
  thanks_form_title: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  thanks_form_button_parent: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  thanks_form_button: {
    backgroundColor: app_theme_colors.red,
    width: 50,
    height: 30,
    borderRadius: 5,
    marginTop: 15,
  },
  thanks_form_button_text: {
    color: app_theme_colors.inverseText,
    textAlign: 'center', 
    lineHeight: 30
  }
});

var readerScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    } : {}),
  },
  layout: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    height: 40,
    flexShrink: 0,
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
    } : {}),
  },
  bookTitle: {
    marginTop: 20,
    paddingLeft: 40,
    paddingRight: 20,
  },
  bookTitleText: {
    fontSize: 35,
    fontFamily: 'LibreBaskerville-Regular',
  },
  paragraphRow: {
    marginTop: 15,
    flexDirection: 'row',
  },
  bookmarkButton: {
    marginTop: 5,
    paddingRight: 5,
    paddingLeft: 15,
  },
  bookmarkNumber: {
    fontSize: 18,
    fontFamily: 'Times',
    textAlign: 'center',
  },
  bookmarkNumberActive: {
    color: '#f05458',
  },
  bookmarkImage: {
    height: 20,
    width: 20,
    marginTop: 5,
  },
  sentencesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 15,
  },
  sentenceIndent: {
    width: 15,
  },
  speakButton: {
    marginTop: 5,
    marginRight: 4,
  },
  wordBlock: {
    borderBottomWidth: 2,
    marginTop: 5,
  },
  wordBlockWithMargin: {
    marginLeft: 10,
    borderBottomWidth: 2,
    marginTop: 5,
  },
  punctuation: {
    marginLeft: 3,
    marginTop: 5,
  },
  translateButton: {
    marginTop: 5,
    marginLeft: 5,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none',
    } : {}),
  },
  adContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 306,
    marginTop: 20,
  },
  disableAdsButton: {
    width: 200,
    height: 36,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableAdsButtonText: {
    fontSize: 14,
  },
  readerContainer: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      top: 40,
      bottom: 50,
      left: 0,
      right: 0,
    } : {}),
  },
  footerSpacer: {
    height: Platform.OS === 'web' ? 0 : 50,
  },
  safeRoot: {
    flex: 1,
  },
  readerHeader: {
    height: 40,
    borderBottomWidth: 1,
    flexDirection: 'row',
    position: 'relative',
    zIndex: 2,
  },
  footerNav: {
    height: 50,
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 2,
    } : {}),
  },
  navButton: {
    padding: 10,
  },
  navArrow: {
    width: 30,
    height: 30,
  },
  pageInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 18,
    lineHeight: 50,
    textAlign: 'center',
  },
});

const App = observer(function App() {
  useEffect(() => { appThemeStore.initialize(); }, []);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body.dataset.reedleBackgroundOwner !== 'book') {
      document.body.style.backgroundColor = appThemeStore.colors.background;
    }
  }, [appThemeStore.themeName]);

  return (
    <SafeAreaProvider>
      <RootApp themeName={appThemeStore.themeName} />
    </SafeAreaProvider>
  );
});

export default App;

function articleImageUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : HOST + path;
}

function plainArticleText(value) {
  if (!value) return '';
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function BlogEye({ color }) {
  return <AppIcon icon={EyeIcon} size={16} color={color} style={{ marginRight: 5 }} />;
}

class Blog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { articles: [], page: 1, nextPage: null, loading: true, loadingMore: false, refreshing: false };
  }

  componentDidMount() {
    this.loadArticles(1);
  }

  async loadArticles(page, refreshing) {
    if (page > 1 && this.state.loadingMore) return;
    this.setState(page > 1 ? { loadingMore: true } : (refreshing ? { refreshing: true } : { loading: true }));

    var result = await new Request('/api/v1/articles', { page: page }, { do_not_show_error: true }).get();
    console.log(result)
    if (result != false) {
      this.setState({
        articles: page == 1 ? result.items : this.state.articles.concat(result.items),
        page: page,
        nextPage: result.pagination.next_page,
        loading: false,
        loadingMore: false,
        refreshing: false
      });
    } else {
      this.setState({ loading: false, loadingMore: false, refreshing: false });
    }
  }

  openArticle(article) {
    this.props.stack.navigation.navigate('article', { code: article.code });
  }

  renderArticle({ item }) {
    var uri = articleImageUrl(item.image_url);
    return (
      <View style={blogStyles.row}>
        <TouchableOpacity style={blogStyles.card} onPress={() => this.openArticle(item)}>
          <View style={[blogStyles.cardImageWrap, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
            {uri && <Image source={{ uri: uri }} style={blogStyles.cardImage} resizeMode="cover" />}
            <View style={blogStyles.infoOverlay}>
              <View style={blogStyles.look}>
                <BlogEye color="#fff" />
                <Text style={blogStyles.infoOverlayText}>{item.look}</Text>
              </View>
              <Text style={blogStyles.infoOverlayText}>{item.created_at}</Text>
            </View>
          </View>
          <Text style={[blogStyles.cardTitle, { color: appThemeStore.colors.text }]}>{item.title}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        <SwipeListView
          style={blogStyles.scrollContent}
          data={this.state.articles}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={blogStyles.content}
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.loadArticles(1, true)} />
          }
          ListEmptyComponent={!this.state.loading ? <Text style={blogStyles.empty}>Статей пока нет</Text> : null}
          ListFooterComponent={(this.state.loading || this.state.loadingMore) ? <ActivityIndicator style={blogStyles.loader} color={appThemeStore.colors.mutedText} /> : null}
          renderItem={(item) => this.renderArticle(item)}
          onEndReached={() => this.state.nextPage && this.loadArticles(this.state.nextPage)}
          onEndReachedThreshold={0.4}
        />
      </SafeAreaView>
    );
  }
}

class BlogArticle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { article: null, loading: true };
  }

  async componentDidMount() {
    var article = await new Request('/api/v1/articles/' + encodeURIComponent(this.props.stack.route.params.code), {}, { do_not_show_error: true }).get();
    this.setState({ article: article || null, loading: false });
  }

  renderBlock(block, index) {
    var data = block.data || {};
    if (block.type == 'paragraph') {
      return <Text key={index} style={[blogStyles.block, blogStyles.paragraph, { color: appThemeStore.colors.text }]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'header') {
      return <Text key={index} style={[blogStyles.block, blogStyles.header, { color: appThemeStore.colors.text }]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'delimiter') {
      return <Text key={index} style={[blogStyles.block, blogStyles.delimiter, { color: appThemeStore.colors.text }]}>* * *</Text>;
    }
    if (block.type == 'list') {
      return (
        <View key={index} style={blogStyles.block}>
          {(data.items || []).map((item, itemIndex) => (
            <View key={itemIndex} style={blogStyles.listRow}>
              <Text style={[blogStyles.listMarker, { color: appThemeStore.colors.text }]}>{data.style == 'ordered' ? (itemIndex + 1) + '.' : '•'}</Text>
              <Text style={[blogStyles.listText, { color: appThemeStore.colors.text }]}>{plainArticleText(item)}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (block.type == 'image' && data.file && data.file.url) {
      return (
        <View key={index} style={blogStyles.block}>
          <Image source={{ uri: articleImageUrl(data.file.url) }} style={[blogStyles.contentImage, { backgroundColor: appThemeStore.colors.backgroundLight }]} resizeMode="cover" />
          {data.caption ? <Text style={blogStyles.caption}>{plainArticleText(data.caption)}</Text> : null}
        </View>
      );
    }
    return null;
  }

  render() {
    if (this.state.loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />;
    if (!this.state.article) return <Text style={blogStyles.empty}>Статья не найдена</Text>;

    var article = this.state.article;
    return (
      <SafeAreaView style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView style={blogStyles.scrollContent} contentContainerStyle={blogStyles.articleContent}>
          <View style={blogStyles.articleInfo}>
            <View style={blogStyles.look}>
              <BlogEye color="#aaa" />
              <Text style={blogStyles.articleInfoText}>{article.look}</Text>
            </View>
            <Text style={blogStyles.articleInfoText}>{article.created_at}</Text>
          </View>
          <Text style={[blogStyles.articleTitle, { color: appThemeStore.colors.text }]}>{article.title}</Text>
          {article.image_url && <Image source={{ uri: articleImageUrl(article.image_url) }} style={[blogStyles.articleImage, { backgroundColor: appThemeStore.colors.backgroundLight }]} resizeMode="cover" />}
          {(article.content || []).map((block, index) => this.renderBlock(block, index))}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

class Bookmark extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      have_file: true,
    }
    this.bookmark = this.props.bookmark.item;
  }

  async componentDidMount() {
    var have_file = await new Storage().get('have_file_' + this.bookmark.book_id);
    this.setState({
      have_file: have_file == 'true',
    });
  }

  render() {
    return (
      <View style={bookmarksStyles.bookmarkRow}>
        <TouchableOpacity
          onPress={() => this.props.openBook(this.bookmark.book_id, { page: this.bookmark.page, paragraph: this.bookmark.paragraph })}
          style={[bookmarksStyles.bookmarkCard, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, lineHeight: 40, color: appThemeStore.colors.text }}>{this.bookmark.book_name}</Text>
          <Text style={{ width: 100, textAlign: 'right', lineHeight: 40, fontWeight: 'bold', color: appThemeStore.colors.text }}>Стр. {this.bookmark.page}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.deleteBookmark()}
          style={bookmarksStyles.deleteButton}
          accessibilityLabel="Удалить закладку">
          <AppIcon icon={TrashIcon} size={20} color={app_theme_colors.red} />
        </TouchableOpacity>
      </View>
    )
  }
}

class BookmarkStack extends React.Component {
  constructor(props) {
    super(props);
  }

  refresh() {
    if (this.bookmarksRef) this.bookmarksRef.getBookmarks();
  }

  render() {
    const RootStack = createStackNavigator();

    return (
      <RootStack.Navigator initialRouteName="bookmark">
        <RootStack.Screen name="bookmark" options={() => ({ headerShown: false })}>
          {(stack) => (
            <Bookmarks ref={(ref) => this.bookmarksRef = ref} root={this.props.root} stack={stack} root_stack={this.props.stack} />
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}

class Bookmarks extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      bookmarks: [],
      do_not_find: false,
    };

    this.storage_bookmarks = [];
    this.search_value = "";
  }

  async componentDidMount() {
    //await new Storage().set('bookmarks_keys', JSON.stringify([]));
    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getBookmarks();
    });

    await this.getBookmarks();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  async getBookmarks() {
    if (this._get_bookmarks_promise) return this._get_bookmarks_promise;
    this._get_bookmarks_promise = this._getBookmarks().finally(() => { this._get_bookmarks_promise = null; });
    return this._get_bookmarks_promise;
  }

  async _getBookmarks() {
    if (this.props.root.state.current_user != false) {
      this.setState({
        do_not_find: false,
        bookmarks: [],
      });

      this.storage_bookmarks = await this.getBookmarksFromStorage();
      await this.getBookmarksFromServer();
      var bookmarks = await this.getBookmarksFromStorage();

      this.setState({
        bookmarks: bookmarks,
        do_not_find: bookmarks.length == 0
      });
    }
  }

  async getBookmarksFromServer() {
    await SyncManager.syncBookmarks(this.props.root.state.current_user.id);
  }

  async getBookmarksFromStorage() {
    var bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);
    }

    var bookmarks = await Promise.all(bookmarks_keys.map(async bookmark_key => {
      var bookmark = await new Storage().get(bookmark_key);

      return bookmark ? JSON.parse(bookmark) : null;
    }));

    return bookmarks.filter(bookmark => bookmark != null);
  }

  async deleteBookmark(data) {
    var bookmarks_keys = await new Storage().get('bookmarks_keys');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf('bookmark_' + data.book_id);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
    await new Storage().remove('bookmark_' + data.book_id);
    await SyncManager.enqueue('bookmark', 'delete', { book_id: data.book_id }, data.version);
    await SyncManager.flush(this.props.root.state.current_user.id);
    await this.getBookmarks();
  }

  confirmDeleteBookmark(data) {
    AppAlert.confirm(
      'Вы уверены?',
      'Закладка будет удалена.',
      () => this.deleteBookmark(data),
      'Удалить'
    );
  }

  openBook(book_id, bookmark) {
    // Открываем Reader через корневой стек (над табами), чтобы не было
    // ни нижней таб-панели, ни заголовка вложенного стека закладок.
    this.props.root_stack.navigation.navigate('reader', {
      book_id: book_id,
      bookmark: bookmark,
    });
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        {this.props.root.state.current_user == false ? (
          <View style={bookmarksStyles.auth_content}>
            <Text style={bookmarksStyles.auth_into}>
              Для того чтобы воспользоваться закладками,
              необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[bookmarksStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={bookmarksStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[bookmarksStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (

          <React.Fragment>
            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', flexDirection: 'row' }}>
                  Чтобы создать закладку,
                  зайдите на книгу и нажмите иконку закладки
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили закладку, но она не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 10 }} onPress={() => this.getBookmarks()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center', color: appThemeStore.colors.text }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false &&
              <FlatList
                style={{ flex: 1, zIndex: 0, paddingTop: 10 }}
                refreshControl={
                  <RefreshControl refreshing={false} onRefresh={() => this.getBookmarks()} />
                }
                showsHorizontalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                data={this.state.bookmarks}
                renderItem={(bookmark) => (
                  <Bookmark
                    openBook={(book_id, bookmarkData) => this.openBook(book_id, bookmarkData)}
                    deleteBookmark={() => this.confirmDeleteBookmark(bookmark.item)}
                    bookmark={bookmark}
                  />
                )}
                keyExtractor={(bookmark) => String(bookmark.book_id)}
                ListEmptyComponent={() => <PreviewBookmarks />}
              />
            }
          </React.Fragment>

        )}
      </SafeAreaView>

    )
  }
}


function PreviewBookmarks() {
  return (
    <React.Fragment>
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
    </React.Fragment>
  );
}

function PreviewBookmark() {
  return (
    <React.Fragment>
      <View style={{ marginLeft: 15, marginRight: 15, paddingBottom: 15, paddingTop: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ height: 50, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.mutedText} />
        </View>
      </View>
    </React.Fragment>
  );
}

class Dictionary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      words: [],
      do_not_find: false,
      sorting_by: 'date',
      words_filter: 'unstudied',
      learning: false,
      learning_questions: [],
      learning_index: 0,
      learning_answer: null,
      learning_correct: 0,
      learning_mistakes: [],
      learning_complete: false
    };

    this.storage_words = [];
  }

  async componentDidMount() {
    this.props.tabs.navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => this.openLearningFromHeader()}
          style={{
            height: 32,
            paddingHorizontal: 12,
            marginRight: 10,
            borderRadius: 6,
            backgroundColor: app_theme_colors.red,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Text style={{ color: '#FFF', fontSize: 13 }}>Учить слова</Text>
        </TouchableOpacity>
      )
    });

    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getWords();
    });

    this.getWords();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  insufficientWordsMessage(count) {
    return 'Для тестирования необходимо не менее 10 неизученных слов. Сейчас в словаре: ' + count + ' из 10.';
  }

  openLearningFromHeader() {
    if (this.props.root.state.current_user == false) {
      this.setState({ auth_modal: true, auth_method: 'login' });
      return;
    }

    var source = this.state.words.filter(word => word.original && word.translate && word.studied !== true);
    if (source.length < 10) {
      AppAlert.alert(
        'Недостаточно слов',
        this.insufficientWordsMessage(source.length)
      );
      return;
    }

    this.props.stack.navigation.navigate('dictionary_learning', { words: this.state.words });
  }

  async getWords() {
    if (this._get_words_promise) return this._get_words_promise;
    this._get_words_promise = this._getWords().finally(() => { this._get_words_promise = null; });
    return this._get_words_promise;
  }

  async _getWords() {
    if (this.props.root.state.current_user != false) {
      this.setState({
        do_not_find: false,
        words: [],
      });

      this.storage_words = await this.getWordsFromStorage();
      await this.getWordsFromServer();
      var words = await this.getWordsFromStorage();

      if (this.state.sorting_by == 'alphabet') {
        words = words.sort((a, b) => a.original.localeCompare(b.original));
      } else {
        words = words.reverse();
      }

      this.setState({
        words: words,
        do_not_find: words.length == 0
      });
    }
  }

  async getWordsFromStorage() {
    var words_keys = await new Storage().get('words_keys', '[]');
    words_keys = JSON.parse(words_keys);

    var words = await Promise.all(words_keys.map(async word_key => {
      var word = await new Storage().get(word_key, '{}');

      return word ? JSON.parse(word) : null;
    }));

    return words.filter(word => word != null);
  }

  async getWordsFromServer() {
    await SyncManager.syncWords(this.props.root.state.current_user.id);
  }

  async deleteWord(data) {
    var words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf('word_' + data.original);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    await new Storage().set('words_keys', JSON.stringify(words_keys));
    await new Storage().remove('word_' + data.original);
    await SyncManager.enqueue('word', 'delete', { original: data.original }, data.version);
    await SyncManager.flush(this.props.root.state.current_user.id);
    await this.getWords();
  }

  confirmDeleteWord(data) {
    AppAlert.confirm(
      'Вы уверены?',
      'Слово «' + data.original + '» будет удалено из словаря.',
      () => this.deleteWord(data),
      'Удалить'
    );
  }

  set_sorting_by(sorting_by) {
    this.setState({
      sorting_by: sorting_by
    }, function () {
      this.getWords();
    });
  }

  filteredWords() {
    if (this.state.words_filter == 'studied') {
      return this.state.words.filter(word => word.studied === true);
    }

    if (this.state.words_filter == 'unstudied') {
      return this.state.words.filter(word => word.studied !== true);
    }

    return this.state.words;
  }

  shuffle(items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temporary = result[i];
      result[i] = result[j];
      result[j] = temporary;
    }
    return result;
  }

  firstTranslation(translate) {
    return String(translate || '').split(/[,;]/)[0].trim();
  }

  async updateWordLearningState(word, changes) {
    var storageKey = 'word_' + word.original;
    var storedValue = await new Storage().get(storageKey, '{}');
    var storedWord = Object.assign({}, JSON.parse(storedValue), changes);
    await new Storage().set(storageKey, JSON.stringify(storedWord));

    this.setState({
      words: this.state.words.map(item => item.original == word.original ? Object.assign({}, item, changes) : item),
      learning_questions: this.state.learning_questions.map(question => (
        question.word.original == word.original
          ? Object.assign({}, question, { word: Object.assign({}, question.word, changes) })
          : question
      )),
      learning_mistakes: this.state.learning_mistakes.map(item => (
        item.original == word.original ? Object.assign({}, item, changes) : item
      ))
    });

    return storedWord;
  }

  async toggleWordStudied(word) {
    var changes = { studied: word.studied !== true };
    if (word.studied === true) {
      changes.learning_shows = 0;
      changes.study_prompted = false;
    }
    await this.updateWordLearningState(word, changes);
  }

  async recordLearningShow(word) {
    if (!word || word.studied === true) return;

    var learningShows = Number(word.learning_shows || 0) + 1;
    var shouldPrompt = learningShows >= 10 && word.study_prompted !== true;
    var changes = { learning_shows: learningShows };
    if (shouldPrompt) {
      changes.study_prompted = true;
      changes.studied = true;
    }
    await this.updateWordLearningState(word, changes);

    if (shouldPrompt) {
      AppAlert.alert(
        'Слово изучено',
        'Вы правильно повторили «' + word.original + '» 10 раз.'
      );
    }
  }

  renderWordLearningProgress(word) {
    var repetitions = Math.min(Number(word.learning_shows || 0), 10);
    var remaining = Math.max(10 - repetitions, 0);
    var completed = word.studied === true;
    if (completed) return null;

    return (
      <View style={dictionaryStyles.wordLearningProgress}>
        <View style={dictionaryStyles.wordLearningProgressHeader}>
          <Text style={dictionaryStyles.wordLearningProgressText}>
            {'Осталось повторить: ' + remaining}
          </Text>
          <Text style={dictionaryStyles.wordLearningProgressCount}>{repetitions} из 10</Text>
        </View>
        <View style={[dictionaryStyles.wordLearningProgressTrack, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={[
            dictionaryStyles.wordLearningProgressValue,
            { width: (repetitions * 10) + '%' }
          ]} />
        </View>
      </View>
    );
  }

  startLearning(words) {
    var source = (words || this.state.words).filter(word => word.original && word.translate && word.studied !== true);
    if (words == undefined && source.length < 10) {
      AppAlert.alert(
        'Недостаточно слов',
        this.insufficientWordsMessage(source.length)
      );
      return;
    }
    if (source.length == 0) {
      AppAlert.alert('Нет слов для повторения', 'Все слова отмечены как изученные.');
      return;
    }
    var selectedWords = this.shuffle(source).slice(0, 10);
    var questions = selectedWords.map(word => {
      var correctAnswer = this.firstTranslation(word.translate);
      var wrongAnswers = this.shuffle(source
        .filter(otherWord => otherWord.original != word.original)
        .map(otherWord => this.firstTranslation(otherWord.translate))
        .filter(translate => translate && translate != correctAnswer)
        .filter((translate, index, translations) => translations.indexOf(translate) == index))
        .slice(0, 3);

      return {
        word: word,
        correctAnswer: correctAnswer,
        answers: this.shuffle([correctAnswer].concat(wrongAnswers))
      };
    });

    this.setState({
      learning: true,
      learning_questions: questions,
      learning_index: 0,
      learning_answer: null,
      learning_correct: 0,
      learning_mistakes: [],
      learning_complete: false
    });
  }

  async selectLearningAnswer(answer) {
    if (this.state.learning_answer != null) return;

    var question = this.state.learning_questions[this.state.learning_index];
    var isCorrect = answer == question.correctAnswer;
    await new Promise(resolve => this.setState({
        learning_answer: answer,
        learning_correct: this.state.learning_correct + (isCorrect ? 1 : 0),
        learning_mistakes: isCorrect
          ? this.state.learning_mistakes
          : this.state.learning_mistakes.concat([question.word])
      }, resolve));

    if (isCorrect) {
      await this.recordLearningShow(question.word);
    }
  }

  nextLearningQuestion() {
    if (this.state.learning_index + 1 >= this.state.learning_questions.length) {
      this.setState({ learning_complete: true });
    } else {
      this.setState({
        learning_index: this.state.learning_index + 1,
        learning_answer: null
      });
    }
  }

  closeLearning() {
    this.setState({ learning: false });
  }

  renderLearning() {
    if (this.state.learning_complete) {
      return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={dictionaryStyles.learningContainer}>
          <Text style={dictionaryStyles.learningTitle}>Тест завершён</Text>
          <Text style={dictionaryStyles.learningResult}>
            Правильно: {this.state.learning_correct} из {this.state.learning_questions.length}
          </Text>
          {this.state.learning_mistakes.length > 0 &&
            <TouchableOpacity style={dictionaryStyles.learningPrimaryButton} onPress={() => this.startLearning(this.state.learning_mistakes)}>
              <Text style={dictionaryStyles.learningPrimaryButtonText}>Повторить ошибки</Text>
            </TouchableOpacity>
          }
          <TouchableOpacity style={dictionaryStyles.learningSecondaryButton} onPress={() => this.startLearning()}>
            <Text style={dictionaryStyles.learningSecondaryButtonText}>Новый тест</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dictionaryStyles.learningBackButton, { backgroundColor: appThemeStore.colors.backgroundLight }]} onPress={() => this.closeLearning()}>
            <Text style={[dictionaryStyles.learningBackButtonText, { color: appThemeStore.colors.text }]}>Вернуться в словарь</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    var question = this.state.learning_questions[this.state.learning_index];
    if (!question) return null;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={dictionaryStyles.learningContainer}>
        <View style={[dictionaryStyles.learningHeader, { justifyContent: 'flex-end' }]}>
          <Text style={dictionaryStyles.learningProgress}>
            {this.state.learning_index + 1} из {this.state.learning_questions.length}
          </Text>
        </View>
        <View style={[dictionaryStyles.learningCard, { backgroundColor: appThemeStore.colors.surface, borderColor: appThemeStore.colors.border }]}>
          <Text style={dictionaryStyles.learningWord}>{question.word.original}</Text>
          {question.word.transcription != null &&
            <Text style={dictionaryStyles.learningTranscription}>{question.word.transcription}</Text>
          }
          {this.renderWordLearningProgress(question.word)}
        </View>
        <Text style={dictionaryStyles.learningPrompt}>Выберите перевод</Text>
        {question.answers.map(answer => {
          var answerStyle = null;
          if (this.state.learning_answer != null) {
            if (answer == question.correctAnswer) {
              answerStyle = dictionaryStyles.learningAnswerCorrect;
            } else if (answer == this.state.learning_answer) {
              answerStyle = dictionaryStyles.learningAnswerWrong;
            }
          }

          return (
            <TouchableOpacity
              key={answer}
              disabled={this.state.learning_answer != null}
              style={[dictionaryStyles.learningAnswer, { backgroundColor: appThemeStore.colors.backgroundLight, borderColor: appThemeStore.colors.border }, answerStyle]}
              onPress={() => this.selectLearningAnswer(answer)}>
              <Text style={[dictionaryStyles.learningAnswerText, { color: answerStyle ? '#000' : appThemeStore.colors.text }]}>{answer}</Text>
            </TouchableOpacity>
          );
        })}
        {this.state.learning_answer != null &&
          <TouchableOpacity style={dictionaryStyles.learningPrimaryButton} onPress={() => this.nextLearningQuestion()}>
            <Text style={dictionaryStyles.learningPrimaryButtonText}>
              {this.state.learning_index + 1 == this.state.learning_questions.length ? 'Показать результат' : 'Следующее слово'}
            </Text>
          </TouchableOpacity>
        }
        <View style={{ height: 100 }}></View>
      </ScrollView>
    );
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        {this.props.root.state.current_user == false ? (
          <View style={dictionaryStyles.auth_content}>
            <Text style={dictionaryStyles.auth_into}>
              Для того чтобы воспользоваться
              словарем, необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[dictionaryStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={dictionaryStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[dictionaryStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (
          <React.Fragment>

            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
                  Нет слов...
                </Text>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', marginTop: 8 }}>
                  Мы можете добавить перевод любого слова на странице книги
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили слово, но оно не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 10 }} onPress={() => this.getWords()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center', color: appThemeStore.colors.text }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false && (this.state.learning ? this.renderLearning() :
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ padding: 8 }}>

                  {this.props.root.state.has_subscription == false &&
                    <React.Fragment>
                      <Text>Вы использовали {this.state.words.length} из 30 слов</Text>
                      <View style={{ marginTop: 10, marginBottom: 10, backgroundColor: '#eee', borderRadius: 4, height: 15, overflow: 'hidden' }}>
                        <View style={{
                          width: Dimensions.get('window').width * (this.state.words.length / 30),
                          height: 15, backgroundColor: '#f05458'
                        }}></View>
                      </View>
                      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15 }}>Без PRO-доступа можно добавить максимум 30 слов</Text>
                    </React.Fragment>
                  }

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View>
                      <Text>Сортировать по:</Text>
                      <View style={{ height: 24, flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 }}>
                        <TouchableOpacity onPress={() => this.set_sorting_by('date')}>
                          <View style={[dictionaryStyles.button_sorting, { backgroundColor: this.state.sorting_by == 'date' ? app_theme_colors.red : appThemeStore.colors.backgroundLight, borderColor: this.state.sorting_by == 'date' ? app_theme_colors.red : appThemeStore.colors.border }]}>
                            <Text style={{ color: this.state.sorting_by == 'date' ? '#FFF' : appThemeStore.colors.text, fontSize: 12, lineHeight: 22 }}>дате добавления</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.set_sorting_by('alphabet')}>
                          <View style={[dictionaryStyles.button_sorting, { backgroundColor: this.state.sorting_by == 'alphabet' ? app_theme_colors.red : appThemeStore.colors.backgroundLight, borderColor: this.state.sorting_by == 'alphabet' ? app_theme_colors.red : appThemeStore.colors.border, marginLeft: 8 }]}>
                            <Text style={{ color: this.state.sorting_by == 'alphabet' ? '#FFF' : appThemeStore.colors.text, fontSize: 12, lineHeight: 22 }}>по алфавиту</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ width: 132, marginLeft: 12 }}>
                      <Text style={{ color: appThemeStore.colors.text, textAlign: 'right' }}>Показывать:</Text>
                      <Select
                        style={{ marginTop: 8 }}
                        value={this.state.words_filter}
                        options={[
                          { value: 'all', title: 'Все слова' },
                          { value: 'studied', title: 'Изученные' },
                          { value: 'unstudied', title: 'Не изученные' }
                        ]}
                        onValueChange={(value) => this.setState({ words_filter: value })}
                      />
                    </View>
                  </View>
                </View>


                <FlatList
                  style={{ flex: 1, zIndex: 0, paddingTop: 8 }}
                  refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => this.getWords()} />
                  }
                  showsHorizontalScrollIndicator={false}
                  scrollIndicatorInsets={{ right: 1 }}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  data={this.filteredWords()}
                  renderItem={(word) => {
                    return (
                      <View style={{ marginLeft: 8, marginRight: 8, backgroundColor: appThemeStore.colors.surface, borderColor: appThemeStore.colors.border, borderWidth: 1, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                        <View style={{ height: 4, backgroundColor: word.item.studied === true ? '#75b641' : appThemeStore.colors.backgroundLight }}></View>
                        <View style={{ padding: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontWeight: 'bold', flex: 1, color: appThemeStore.colors.text }}>{word.item.original}</Text>
                            <TouchableOpacity
                              onPress={() => this.toggleWordStudied(word.item)}
                              style={[dictionaryStyles.studiedButton, word.item.studied === true && dictionaryStyles.studiedButtonActive]}
                            >
                              <Text style={[dictionaryStyles.studiedButtonText, word.item.studied === true && dictionaryStyles.studiedButtonTextActive]}>
                                {word.item.studied === true ? 'Вернуть в тест' : 'Изучено'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => this.confirmDeleteWord(word.item)}
                              style={dictionaryStyles.deleteWordButton}
                              accessibilityLabel="Удалить слово">
                              <AppIcon icon={TrashIcon} size={16} color={app_theme_colors.red} />
                            </TouchableOpacity>
                          </View>
                          {word.item.transcription != null &&
                            <Text style={{ color: appThemeStore.colors.mutedText, marginTop: 4 }}>{word.item.transcription}</Text>
                          }
                          <Text style={{ marginTop: 4, color: appThemeStore.colors.text }}>{word.item.translate}</Text>
                          {this.renderWordLearningProgress(word.item)}
                        </View>
                      </View>
                    )
                  }}
                  keyExtractor={(word) => word.original}
                  ListEmptyComponent={() => this.state.words.length > 0
                    ? <Text style={{ padding: 24, textAlign: 'center', color: appThemeStore.colors.mutedText }}>Все слова изучены</Text>
                    : <PreviewWords />}
                />
              </View>
            )}
          </React.Fragment>
        )}
      </SafeAreaView>

    )
  }
}

class DictionaryLearning extends Dictionary {
  componentDidMount() {
    var words = this.props.stack.route.params.words || [];
    this.setState({ words: words }, () => this.startLearning());
  }

  closeLearning() {
    this.props.stack.navigation.goBack();
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        {this.renderLearning()}
      </SafeAreaView>
    );
  }
}




function PreviewWords() {
  return (
    <React.Fragment>
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
    </React.Fragment>
  );
}

function PreviewWord() {
  return (
    <React.Fragment>
      <View style={{ margin: 8, height: 50, borderRadius: 4, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
        <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.text} />
      </View>
    </React.Fragment>
  );
}

const Book = observer(class Book extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var book = this.props.book.item;
    var percent = this.props.books_percents[book.id];
 
    return (
      <View style={{ flex: 1, borderRadius: 10, margin: 5 }}>
        <TouchableOpacity onPress={() => this.props.onPress(book.id, book.color)}
          style={{ marginLeft: 10, marginRight: 10, paddingBottom: 15, paddingTop: 15, flexDirection: 'row' }}>

          <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: book.color }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
              {book.name_en.split(' ').slice(0, 3).map((word, index) =>
                <Text key={index} numberOfLines={1} style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 12, paddingLeft: 5, paddingRight: 5, textAlign: 'center' }}>{word}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: appThemeStore.colors.mutedText }}>{book.author}</Text>
            <Text style={{ fontSize: 14, marginTop: 5, color: appThemeStore.colors.text }}>{book.name}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 0) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 1) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 2) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 3) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 4) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <Text style={{ marginLeft: 5, color: appThemeStore.colors.text }}>
                <Text style={{ fontSize: 14, lineHeight: 15, color: appThemeStore.colors.text }}>{book.complexity_text}</Text>
              </Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              <AppIcon icon={BookOpenIcon} size={20} color={percent == 100 ? '#0fa90f' : '#777'} style={{ marginRight: 8 }} />
              <Text style={{ lineHeight: 20, fontSize: 12, color: appThemeStore.colors.text }}>
                <Text style={percent == 100 && { color: '#0fa90f' }}>
                  {percent}%
                </Text>
              </Text>

              <Text style={{ lineHeight: 20, fontSize: 12, marginLeft: 10, color: appThemeStore.colors.text }}>{book.pages} стр.</Text>


              {downloadStore.isCompleted(book.id) && <AppIcon icon={FileCheckIcon} size={18} color="#0fa90f" style={{ marginLeft: 8 }} />}
            </View>
          </View>

        </TouchableOpacity>
      </View>
    )
  }
});

const HomeDownloadsPanel = observer(function HomeDownloadsPanel() {
  var downloads = Object.values(downloadStore.downloads);
  if (downloads.length === 0) return null;

  return (
      <View style={[homeStyles.downloadsPanel, { backgroundColor: appThemeStore.colors.surface }]}>
      <Text style={[homeStyles.downloadsTitle, { color: appThemeStore.colors.text }]}>Загрузка книг</Text>
      {downloads.map((download) =>
        <View key={download.bookId} style={homeStyles.downloadRow}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[homeStyles.downloadBookName, { color: appThemeStore.colors.text }]}>{download.nameEn || download.name}</Text>
            <View style={homeStyles.downloadProgressTrack}>
              <View style={[
                homeStyles.downloadProgressValue,
                {
                  width: (download.progress || 0) + '%',
                  backgroundColor: download.status === 'error' ? '#f05458' : (download.color || '#75b641'),
                }
              ]} />
            </View>
            <Text style={[homeStyles.downloadStatus, { color: appThemeStore.colors.mutedText }]}>
              {download.status === 'error'
                ? 'Ошибка загрузки'
                : download.status === 'completed'
                  ? 'Загружено'
                  : (download.progress || 0).toFixed(1) + '%'}
            </Text>
          </View>
          {(download.status === 'completed' || download.status === 'error') &&
            <TouchableOpacity onPress={() => downloadStore.dismiss(download.bookId)} style={homeStyles.downloadDismiss}>
              <Text style={homeStyles.downloadDismissText}>×</Text>
            </TouchableOpacity>
          }
        </View>
      )}
    </View>
  );
});

const Home = observer(class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      do_not_find: false,
      level: 'all',
      books: [],
      books_filtered: [],
      books_loader: true,
      not_show_read: true,
      sort_new_book: true,
      show_only_loaded: false,
      open_property: false,
    };

    this.search_value = "";
  }

  async componentDidMount() {
    this._unsubscribeDownloadCompleted = downloadStore.onCompleted(() => this.filter_books());

    var sort_new_book_default_migrated = await new Storage().get('sort_new_book_default_enabled_v1');
    if (sort_new_book_default_migrated != 'true') {
      await new Storage().set('sort_new_book', 'true');
      await new Storage().set('sort_new_book_default_enabled_v1', 'true');
    }

    var not_show_read = await new Storage().get('not_show_read', 'false')
    var sort_new_book = await new Storage().get('sort_new_book', 'true');
    var show_only_loaded = await new Storage().get('show_only_loaded', 'false');
    this.setState({
      not_show_read: not_show_read === 'true',
      sort_new_book: sort_new_book === 'true',
      show_only_loaded: show_only_loaded === 'true',
    }, () => {
      this.getBooks();
    });

    // this.props.stack.navigation.navigate('reader', {
    //   book_id: 1
    // });
  }

  componentWillUnmount() {
    if (this._unsubscribeDownloadCompleted) this._unsubscribeDownloadCompleted();
  }

  async getBooks() {
    this.setState({
      books: [],
      filter_books: [],
    }, async () => {

      var exists = await RNFS.exists(file_root + '/' + BOOKS_FILENAME);
      if (exists == false) {
        await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, "[]", 'utf8');
      }

      var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
      books = JSON.parse(books);
      appStore.setBooksOrder(books.map(book => book.id));

      this.setState({
        books: books,
      }, async () => {
        var server_books = await new Request('/api/v1/books', {}, { do_not_show_error: true }).get();
        if (server_books == false) {
          this.filter_books();
        } else {
          if (server_books.length != books.length) {
            var localBooksById = {};
            books.forEach((book) => { localBooksById[book.id] = book; });
            books = server_books.map((book) => localBooksById[book.id] && localBooksById[book.id].downloaded_size
              ? Object.assign({}, book, { downloaded_size: localBooksById[book.id].downloaded_size })
              : book);
            await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(books), 'utf8');
            appStore.setBooksOrder(books.map(book => book.id));

            this.setState({ books: books }, () => this.filter_books());
          } else {
            this.filter_books();
          }
        }
      });
    });
  }

  //Фильтрует по Level, Названиям, Скачиванию
  async filter_books() {
    this.setState({
      books_filtered: [],
    }, async () => {

      var result = [];

      for (const i in this.state.books) {
        var book = this.state.books[i];

        if (this.state.level == 'all' || this.state.level == book.level) {

          var check = false;

          //Названия
          if (this.search_value.length == 0) {
            check = true;
          } else {
            var search_array = this.search_value.split(' ').map(name => name.toLowerCase());
            search_array = search_array.filter(word => word.length > 0);

            book.name.split(' ').forEach(function (subname) {
              subname = subname.toLowerCase();
              search_array.forEach(function (subsearch) {
                if (subname.includes(subsearch)) {
                  check = true;
                }
              });
            });

            book.author.split(' ').forEach(function (subname) {
              subname = subname.toLowerCase();
              search_array.forEach(function (subsearch) {
                if (subname.includes(subsearch)) {
                  check = true;
                }
              });
            });

            book.name_en.split(' ').forEach(function (subname) {
              subname = subname.toLowerCase();
              search_array.forEach(function (subsearch) {
                if (subname.includes(subsearch)) {
                  check = true;
                }
              });
            });
          }

          //Скачана книга
          if (check == true) {
            var have_file = await new Storage().get('have_file_' + book.id, 'false');
            book['have_file'] = have_file == 'true';
            downloadStore.setCompleted(book.id, book['have_file']);
            if (this.state.show_only_loaded == true) {
              check = book['have_file'];
            }

            var percent = await new Storage().get('percent_' + book.id, 0);
            book['percent'] = percent;

            if (percent == 100) {
              if (this.state.not_show_read == true) {
                check = false;
              }
            }
          }


          if (check == true) {
            result.push(book);
          }
        }
      }

      var percents = {}
      result.forEach(function (book) {
        percents[book.id] = book.percent;
      });

      this.props.root.setState({
        books_percents: percents
      });
      appStore.setBooksPercents(percents);

      this.setState({
        books_filtered: result,
        do_not_find: result.length == 0,
      }, function () {
        this.showReview();
      });
    });
  }

  async showReview() {

    var review_showed = await new Storage().get('review_showed', 'false');

    if (review_showed == 'false') {
      var time_show_review = await new Storage().get('time_show_review');

      if (time_show_review == undefined) {
        time_show_review = moment();
        await new Storage().set('time_show_review', moment().format());
      } else {
        time_show_review = moment(time_show_review);
      }

      var now_time = moment();

      var range_time = (now_time - time_show_review) / 1000 / 60;

      if (range_time > 7200) { //7200
        AppMetrica.reportEvent('reviewShow', { show: true });
        await new Storage().set('review_showed', 'true');
        StoreReview.requestReview();
      }
    }
  }

  goToSite() {
    Linking.openURL("https://reedle.ru");
  }

  onChangeText(value) {
    this.search_value = value;
    this.filter_books();
  }

  setLevel(level) {

    AppMetrica.reportEvent('setLevel', { level: level });

    this.setState({
      level: level,
    }, function () {
      this.filter_books();
    });
  }
  openProperty() {

    AppMetrica.reportEvent('openProperty', { show: !this.state.open_property });

    this.setState({
      open_property: !this.state.open_property,
    });
  }

  setPropertyShowRead() {

    AppMetrica.reportEvent('notShowRead', { value: !this.state.not_show_read });

    AsyncStorage.setItem('not_show_read', (!this.state.not_show_read).toString()).then(() => {
      this.setState({
        not_show_read: !this.state.not_show_read,
      }, () => {
        this.filter_books();
      });
    });


  }
  setPropertySortNewBook() {

    AppMetrica.reportEvent('sortNewBook', { value: !this.state.sort_new_book });

    AsyncStorage.setItem('sort_new_book', (!this.state.sort_new_book).toString()).then(() => {
      this.setState({
        sort_new_book: !this.state.sort_new_book,
      }, () => {
        this.filter_books();
      });
    });
  }

  setPropertyShowOnlyLoaded() {

    AppMetrica.reportEvent('showOnlyLoaded', { value: !this.state.show_only_loaded });

    AsyncStorage.setItem('show_only_loaded', (!this.state.show_only_loaded).toString()).then(() => {
      this.setState({
        show_only_loaded: !this.state.show_only_loaded,
      }, () => {
        this.filter_books();
      });
    });
  }

  render() {
    var safeAreaInsets = this.props.safeAreaInsets || { top: 0 };
    var safeAreaTop = safeAreaInsets.top || 0;
    var visibleBooks = Array.isArray(this.state.books_filtered) ? this.state.books_filtered : [];
    if (this.state.not_show_read) {
      visibleBooks = visibleBooks.filter(book => Number(appStore.books_percents[book.id]) !== 100);
    }
    if (this.state.show_only_loaded) {
      visibleBooks = visibleBooks.filter(book => downloadStore.isCompleted(book.id));
    }
    if (this.state.sort_new_book && appStore.books_order.length > 0) {
      var bookOrderPositions = {};
      appStore.books_order.forEach((bookId, index) => { bookOrderPositions[String(bookId)] = index; });
      visibleBooks = visibleBooks.slice().sort((leftBook, rightBook) => {
        var leftPosition = bookOrderPositions[String(leftBook.id)];
        var rightPosition = bookOrderPositions[String(rightBook.id)];
        if (leftPosition === undefined) leftPosition = Number.MAX_SAFE_INTEGER;
        if (rightPosition === undefined) rightPosition = Number.MAX_SAFE_INTEGER;
        return leftPosition - rightPosition;
      });
    }

    return (
      <View style={[applicationStyles.save_area_view, { paddingTop: safeAreaTop, backgroundColor: appThemeStore.colors.background }]}>
        <View style={homeStyles.header}>

          <View style={homeStyles.header_empty_block} />

          <View style={homeStyles.logo}>
            <Text style={[homeStyles.logo_text, { color: appThemeStore.colors.text }]}>Reedle</Text>
            <Text style={homeStyles.logo_dot}>.</Text>
          </View>

          {(this.props.root.state.has_subscription == false) ? (
            <TouchableOpacity onPress={() => this.props.stack.navigation.navigate('subscription', { backTitle: 'Книги' })}>
              <AppIcon icon={MegaphoneOffIcon} size={28} color={appThemeStore.colors.text} style={{ marginTop: 3 }} />
            </TouchableOpacity>
          ) : (
            <View style={homeStyles.header_empty_block}></View>
          )}
        </View>

        <HomeDownloadsPanel />

        <View style={[homeStyles.search, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <AppIcon icon={SearchIcon} size={24} color="#999" style={homeStyles.search_image} />
          <TextInput
            style={[homeStyles.search_input, { color: appThemeStore.colors.text, outlineStyle: 'none' }]}
            onChangeText={(value) => this.onChangeText(value)}
            placeholder={"Поиск"}
            placeholderTextColor={appThemeStore.colors.text}
            clearButtonMode="always"
          />
        </View>

        <View style={[homeStyles.level_selector, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={homeStyles.level_selector_wrap}>
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="Все" color={appThemeStore.colors.background} level="all" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A1" color="#89c053" level="1" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A2" color="#5e9cea" level="2" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B1" color="#f5b945" level="3" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B2" color="#fb836f" level="4" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="C1" color="#fe4444" level="5" current_level={this.state.level} />


            <TouchableOpacity onPress={() => this.openProperty()}>
              <View style={{ backgroundColor: appThemeStore.colors.border, borderRadius: 7, marginLeft: 3 }}>
                {this.state.open_property == false &&
                  <AppIcon icon={SlidersIcon} size={22} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
                {this.state.open_property == true &&
                  <AppIcon icon={CloseIcon} size={22} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
              </View>
            </TouchableOpacity>
          </View>
          {this.state.open_property == true &&
            <View style={[homeStyles.properties, { backgroundColor: appThemeStore.colors.surface }]}>
              <View style={homeStyles.properties_point}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Не показывать прочитанные книги</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={() => this.setPropertyShowRead()}
                  value={this.state.not_show_read}
                />

              </View>


              <View style={homeStyles.properties_point}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Ставить вперед открытые книги</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={() => this.setPropertySortNewBook()}
                  value={this.state.sort_new_book}
                />

              </View>

              <View style={[homeStyles.properties_point, { marginBottom: 0 }]}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Показать только скачанные</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={() => this.setPropertyShowOnlyLoaded()}
                  value={this.state.show_only_loaded}
                />

              </View>

            </View>
          }

        </View>

        <React.Fragment>
          {this.state.do_not_find == true &&
            <View style={{ marginTop: 100 }}>
              <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa' }}>Книги не найдены :(</Text>
            </View>
          }
          {this.state.do_not_find == false &&
            <FlatList
              style={{ flex: 1, marginTop: -10, zIndex: 0, paddingTop: 10 }}
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={() => this.getBooks()} />
              }
              showsHorizontalScrollIndicator={false}
              scrollIndicatorInsets={{ right: 1 }}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingBottom: 100 }}
              data={visibleBooks}
              renderItem={(book) => <Book
                books_percents={this.props.root.state.books_percents}
                book={book}
                onPress={(book_id, color) => this.props.stack.navigation.navigate('show', {
                  book_id: book_id,
                  color: color,
                })}
              />}
              keyExtractor={(book) => String(book.id)}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, marginLeft: 15, marginRight: 15, backgroundColor: appThemeStore.colors.border }} />
              )}
              ListEmptyComponent={() => <PreviewBooks />}
            />
          }
        </React.Fragment>

      </View>
    )
  }
});


class LevelSelectorPoint extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress(this.props.level)} style={[homeStyles.level_selector_point, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
        <View style={this.props.current_level == this.props.level && [{ backgroundColor: this.props.color }, homeStyles.level_selector_point_active]}>
          <Text style={homeStyles.level_selector_point_text}>
            <Text style={this.props.current_level == this.props.level && this.props.level != 'all' ? { color: '#FFF' } : { color: appThemeStore.colors.text }}>
              {this.props.name}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    )
  }
}


function PreviewBooks() {
  return (
    <React.Fragment>
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
    </React.Fragment>
  );
}

function PreviewBook() {
  return (
    <React.Fragment>
      <View style={{ margin: 5 }}>
        <View style={{ marginLeft: 10, marginRight: 10, paddingBottom: 15, paddingTop: 15, flexDirection: 'row' }}>
          <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
            <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.mutedText} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ borderRadius: 5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight, width: '50%' }}></View>
            <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight }}></View>
            <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight, width: '70%' }}></View>
          </View>
        </View>
      </View>
      <View style={{ height: 1, marginLeft: 15, marginRight: 15, backgroundColor: appThemeStore.colors.border }} />
    </React.Fragment>
  );
}

class ChangePassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    }
  }

  resetForm(){
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id + '/update_password', {
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).put();

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
          success: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.success == true ? (
          <React.Fragment>
            <View style={profileStyles.thanks_form}>
              <Text style={profileStyles.thanks_form_title}>
                Информация успешно обновлена
              </Text>
              <View style={profileStyles.thanks_form_button_parent}>
                <TouchableOpacity onPress={()=>this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </React.Fragment>
        ): (
          <React.Fragment>
            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={20} color="#777" style={{ margin: 10 }} />
              </TouchableOpacity>
            </View>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Повторите пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ repeat_password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={20} color="#777" style={{ margin: 10 }} />
              </TouchableOpacity>
            </View>

            {this.state.error != false &&
              <Text style={profileStyles.error_block}>{this.state.error}</Text>
            }

            <TouchableOpacity style={profileStyles.form_button} onPress={() => this.update()}>
              {this.state.button_loader == true ? (
                <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
              ) : (
                <Text style={profileStyles.form_button_text}>Обновить</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}

class UpdateProfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: this.props.current_user.email,
      error: false,
      success: false,
    }
  }

  resetForm() {
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id, {
      email: this.state.email,
    }).put();

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
          success: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.success == true ? (
          <React.Fragment>
            <View style={[profileStyles.thanks_form, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
              <Text style={[profileStyles.thanks_form_title, { color: appThemeStore.colors.text }]}>
                Информация успешно обновлена
              </Text>
              <View style={profileStyles.thanks_form_button_parent}>
                <TouchableOpacity onPress={() => this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>

            </View>
          </React.Fragment>
        ) : (
          <React.Fragment>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>E-mail</Text>
              <TextInput
                onChangeText={(value) => this.setState({ email: value })}
                style={profileStyles.input}
                placeholder={"E-mail"}
                value={this.state.email}
              />
            </View>

            {this.state.error != false &&
              <Text style={profileStyles.error_block}>{this.state.error}</Text>
            }

            <TouchableOpacity style={profileStyles.form_button} onPress={() => this.update()}>
              {this.state.button_loader == true ? (
                <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
              ) : (
                <Text style={profileStyles.form_button_text}>Обновить</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}

class Auth extends React.Component {
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
    var response = await new Request('/api/v1/users/login', {
      email: this.state.email,
      password: this.state.password
    }).get();

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
        root_app.setState({
          current_user: response
        });

        await new Storage().set('current_user', JSON.stringify(response));

        root_app.checkSubscription();
      }
    }

  }

  async reg() {
    var response = await new Request('/api/v1/users/registration', {
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
        root_app.setState({
          current_user: response
        });

        await new Storage().set('current_user', JSON.stringify(response));
      }
    }
  }

  async remember_password() {
    var response = await new Request('/api/v1/users/remember_password', {
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
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]} >
        <ScrollView>
          <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}>
            {this.props.modal == true &&
              <View style={{ height: 35, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => this.props.close()} style={{ width: 35, height: 35, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 7, margin: 10 }}>
                  <AppIcon icon={CloseIcon} size={20} color={appThemeStore.colors.text} style={{ margin: 7.5 }} />
                </TouchableOpacity>
              </View>
            }

            <View style={profileStyles.content}>
            {this.props.bookmark_info != undefined &&
              <React.Fragment>
                <Text style={bookmarksStyles.auth_into}>
                  Для того чтобы воспользоваться закладками или словарем,
                  необходимо
                  <Text style={{ color: '#f05458' }}> авторизоваться </Text>
                  или
                  <Text style={{ color: '#f05458' }}> зарегистрироваться</Text>
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

            <View style={[profileStyles.authorization_form_tabs, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => this.changeMethod('login')} style={[
                  profileStyles.authorization_form_tab,
                  { backgroundColor: this.state.method == 'login' ? appThemeStore.colors.background : appThemeStore.colors.backgroundLight }
                ]}>
                  <Text style={profileStyles.authorization_form_tab_text}>Вход</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.changeMethod('reg')} style={[
                  profileStyles.authorization_form_tab,
                  { backgroundColor: this.state.method == 'reg' ? appThemeStore.colors.background : appThemeStore.colors.backgroundLight }
                ]}>
                  <Text style={profileStyles.authorization_form_tab_text}>Регистрация</Text>
                </TouchableOpacity>
              </View>
            </View>

            {this.state.remember_password_thanks ? (
              <View style={profileStyles.remember_password_thanks}>
                <Text style={profileStyles.remember_password_thanks_text}>Новый пароль отправлен на почту</Text>
              </View>
            ) : (
              <React.Fragment>
                {this.state.method == 'remember_password' &&
                  <Text style={profileStyles.remember_password_info}>Новый пароль придет на почту</Text>
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
                      <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={20} color="#777" style={{ margin: 10 }} />
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
                      <AppIcon icon={this.state.securePassword ? EyeOffIcon : EyeIcon} size={20} color="#777" style={{ margin: 10 }} />
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
                  <TouchableOpacity onPress={() => this.changeMethod('remember_password')} style={profileStyles.button_remember_password}>
                    <Text style={profileStyles.remember_password_text}>Забыли пароль?</Text>
                  </TouchableOpacity>
                }

                <Text style={{ textAlign: 'center', marginTop: 24 }}>
                  Войти через соц. сети
                </Text>
                <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', marginTop: 16 }}>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#0077FF', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('vk')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/vk.png')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#f9d657', borderRadius: 4, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('yandex')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/ya.png')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#df432f', borderRadius: 4, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }} onPress={() => root_app.oauthAuthorization.authorize('google')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/google.png')} />
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            )}

            <View style={{ height: 100 }}></View>

            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

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
        <Text style={[profileStyles.menu_item_text, { color: appThemeStore.colors.text }]}>{title}</Text>
        <Text style={profileStyles.menu_item_arrow}>›</Text>
      </TouchableOpacity>
    );
  }

  render() {
    var current_user = this.props.root.state.current_user;

    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        {current_user == false ? (
          <Auth />
        ) : (
          <ScrollView contentContainerStyle={profileStyles.page}>
            <View style={[profileStyles.avatar, { backgroundColor: this.avatarColor(current_user) }]}>
              <Text style={profileStyles.avatar_text}>{this.avatarLetters(current_user.email)}</Text>
            </View>
            <Text style={[profileStyles.email, { color: appThemeStore.colors.text }]}>{current_user.email}</Text>

            <View style={profileStyles.menu}>
              {this.renderMenuItem('ПРО-доступ', () => this.props.root_stack.navigation.navigate('subscription', { backTitle: 'Аккаунт' }))}
              {this.renderMenuItem('Аккаунт', () => this.props.stack.navigation.navigate('profile_details'))}
              {this.renderMenuItem('Изменить пароль', () => this.props.stack.navigation.navigate('profile_password'))}
              {this.renderMenuItem('Память', () => this.props.stack.navigation.navigate('profile_memory'))}
              {this.renderMenuItem('Цветовая схема', () => this.props.stack.navigation.navigate('profile_settings'), true)}
            </View>
          </ScrollView>
        )}
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
        <View style={[profileStyles.memorySummary, { borderBottomColor: appThemeStore.colors.border }]}>
          <Text style={[profileStyles.memoryTotal, { color: appThemeStore.colors.text }]}>
            {'Занято: ' + this.formatSize(this.totalSize())}
          </Text>
          <TouchableOpacity
            disabled={this.state.books.length == 0 || this.state.deleting}
            onPress={() => this.confirmClear()}>
            <Text style={[profileStyles.memoryClear, (this.state.books.length == 0 || this.state.deleting) && profileStyles.memoryActionDisabled]}>Очистить</Text>
          </TouchableOpacity>
        </View>

        {this.state.loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />
        ) : (
          <ScrollView contentContainerStyle={profileStyles.memoryList}>
            {this.state.books.length == 0 && (
              <Text style={[profileStyles.memoryEmpty, { color: appThemeStore.colors.mutedText }]}>Скачанных книг нет</Text>
            )}
            {this.state.books.map((book) => (
              <View key={book.id} style={[profileStyles.memoryRow, { borderBottomColor: appThemeStore.colors.border }]}>
                <View style={profileStyles.memoryBookInfo}>
                  <Text numberOfLines={1} style={[profileStyles.memoryBookName, { color: appThemeStore.colors.text }]}>{book.name_en || book.name}</Text>
                  <Text style={[profileStyles.memoryBookSize, { color: appThemeStore.colors.mutedText }]}>{this.formatSize(book.downloaded_size)}</Text>
                </View>
                <TouchableOpacity accessibilityLabel="Удалить книгу" disabled={this.state.deleting} onPress={() => this.confirmDelete(book)} style={this.state.deleting && profileStyles.memoryActionDisabled}>
                  <AppIcon icon={TrashIcon} size={20} color={app_theme_colors.red} />
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
      this.props.root.oauthAuthorization.authorize(type);
    }
  }

  renderSocialRow(type, title, color, image, connected, last) {
    return (
      <TouchableOpacity
        style={[
          profileStyles.social_row,
          { borderBottomColor: appThemeStore.colors.border },
          last && profileStyles.social_row_last,
        ]}
        disabled={this.state.social_loader != false}
        onPress={() => this.socialAction(type, connected)}>
        <View style={[profileStyles.social_icon, { backgroundColor: connected ? color : appThemeStore.colors.backgroundLight }]}>
          <Image style={profileStyles.social_icon_image} source={image} />
        </View>
        <Text style={[profileStyles.social_name, { color: appThemeStore.colors.text }]}>{title}</Text>
        {this.state.social_loader == type ? (
          <ActivityIndicator size="small" color={appThemeStore.colors.mutedText} />
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
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <UpdateProfile current_user={current_user} />

          <Text style={[profileStyles.social_title, { color: appThemeStore.colors.text }]}>Привязать соц. сети</Text>
          <Text style={profileStyles.social_description}>Для быстрого входа в аккаунт</Text>
          <View style={[profileStyles.social_list, { borderColor: appThemeStore.colors.border }]}>
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
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView contentContainerStyle={profileStyles.section}>
          <ChangePassword current_user={current_user} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

class ProfileStack extends React.Component {
  render() {
    const RootStack = createStackNavigator();
    const childScreenOptions = (navigation) => ({
      headerTitle: '',
      headerBackVisible: false,
      headerTintColor: appThemeStore.colors.text,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: '100%' }}>
          <AppIcon icon={ChevronLeftIcon} size={24} color={appThemeStore.colors.text} />
          <Text style={{ marginLeft: 4, color: appThemeStore.colors.text, fontSize: 16 }}>Аккаунт</Text>
        </TouchableOpacity>
      )
    });

    return (
      <RootStack.Navigator initialRouteName="profile_home">
        <RootStack.Screen name="profile_home" options={{ headerShown: false }}>
          {(stack) => <Profile root={this.props.root} root_stack={this.props.root_stack} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_details" options={({ navigation }) => childScreenOptions(navigation)}>
          {() => <ProfileDetails root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_password" options={({ navigation }) => childScreenOptions(navigation)}>
          {() => <ProfilePassword root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_memory" options={({ navigation }) => childScreenOptions(navigation)}>
          {(stack) => <ProfileMemory root={this.props.root} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_settings" options={({ navigation }) => childScreenOptions(navigation)}>
          {(stack) => <ProfileSettings root={this.props.root} stack={stack} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}

class ProfileSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
      fontSize: 18,
      fontFamily: 'LibreBaskerville-Regular',
      textAlign: 'flex-start',
      translate_icon_size: 24,
      backgroundColorTheme: appThemeStore.colors.background,
      textColorTheme: appThemeStore.colors.text,
      secondColorTheme: appThemeStore.colors.second
    };
  }

  async componentDidMount() {
    this._mounted = true;
    this._unsubscribeFocus = this.props.stack.navigation.addListener('focus', () => this.loadSettings());
    await this.loadSettings();
  }

  componentWillUnmount() {
    this._mounted = false;
    if (this._unsubscribeFocus) this._unsubscribeFocus();
  }

  async loadSettings() {
    var value = await new Storage().get('themeReaderSettings');
    var settings = value ? JSON.parse(value) : {};
    settings.backgroundColorTheme = appThemeStore.colors.background;
    settings.textColorTheme = appThemeStore.colors.text;
    settings.secondColorTheme = appThemeStore.colors.second;
    if (this._mounted) this.setState(Object.assign({}, settings, { loaded: true }));
  }

  async saveSettings(changes) {
    var value = await new Storage().get('themeReaderSettings', '{}');
    var settings = Object.assign({}, JSON.parse(value), changes);
    await new Storage().set('themeReaderSettings', JSON.stringify(settings));
    this.setState(changes);
    readerStore.setThemeSettings(changes);
  }

  changeFontSize(type) {
    var fontSize = this.state.fontSize + (type == 'more' ? 2 : -2);
    var iconSizes = { 14: 18, 16: 22, 18: 24, 20: 26, 22: 28, 24: 30 };
    this.saveSettings({ fontSize: fontSize, translate_icon_size: iconSizes[fontSize] });
  }

  textAlignChange() {
    var alignments = ['flex-start', 'flex-end', 'center', 'space-evenly'];
    var index = alignments.indexOf(this.state.textAlign);
    this.saveSettings({ textAlign: alignments[(index + 1) % alignments.length] });
  }

  changeColorTheme(backgroundColor, textColor, secondColor) {
    appThemeStore.setCustomTheme(appThemeNameByBackground(backgroundColor));
    this.saveSettings({ backgroundColorTheme: backgroundColor, textColorTheme: textColor, secondColorTheme: secondColor });
  }

  previewTextAlign() {
    return ({ 'flex-start': 'left', 'flex-end': 'right', center: 'center', 'space-evenly': 'justify' })[this.state.textAlign] || 'left';
  }

  render() {
    if (!this.state.loaded) return <ActivityIndicator style={{ flex: 1 }} color={appThemeStore.colors.mutedText} />;
    var previewParagraphs = [
      'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
      'The morning was quiet, and a pale golden light stretched across the fields. A small bird landed nearby and listened to the wind.',
      'He opened the old book and continued reading. Every page carried him farther from the room and closer to a new adventure.',
      'When evening came, the stars appeared one by one. Their soft light reminded him that even a long journey begins with a single step.',
      'The road continued beyond the hill, turning gently toward the distant town. He smiled and walked on without looking back.'
    ];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appThemeStore.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 60 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Пример отображения</Text>
          <View style={{ minHeight: 620, position: 'relative', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: this.state.secondColorTheme, backgroundColor: this.state.backgroundColorTheme, overflow: 'hidden' }}>
            <Text style={{ fontSize: 24, fontFamily: this.state.fontFamily, color: this.state.textColorTheme, marginBottom: 18 }}>The Little Prince</Text>
            {previewParagraphs.map((paragraph, index) =>
              <Text key={index} style={{ marginBottom: 16, fontSize: this.state.fontSize, lineHeight: this.state.fontSize * 1.55, fontFamily: this.state.fontFamily, color: this.state.textColorTheme, textAlign: this.previewTextAlign() }}>
                {paragraph}
              </Text>
            )}

            <View style={{ position: 'absolute', right: 10, top: 10, width: 212, zIndex: 5 }}>
              <ReaderSettingsPanel
                {...this.state}
                changeFontSize={(type) => this.changeFontSize(type)}
                textAlignChange={() => this.textAlignChange()}
                changeColorTheme={(background, text, second) => this.changeColorTheme(background, text, second)}
                chanageFontFamily={(fontFamily) => this.saveSettings({ fontFamily: fontFamily })}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

class ModalFastLearning extends React.Component {
  render(){
    return(
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => this.props.close()}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              { flexDirection: 'row', justifyContent: 'center' },
              Platform.OS === 'web' ? { width: '100%', paddingHorizontal: 30 } : null
            ]}>
            <View style={[
              { borderRadius: 15, backgroundColor: appThemeStore.colors.surface, padding: 15 },
              Platform.OS === 'web' ? { width: '100%', maxWidth: 500 } : { margin: 30 }
            ]}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Быстрое обучение</Text>

              <Text style={{ marginTop: 15 }}>
                Нажмите на любое подчеркнутое слово, чтобы посмотреть его перевод.
              </Text>

              <Text style={{ marginTop: 15 }}>А также:</Text>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>

                <AppIcon icon={EllipsisVerticalIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод предложения.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <AppIcon icon={EllipsisIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод абзаца.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>

                <View style={{ width: 20, height: 20 }}>
                  <Text style={{ textAlign: 'center', lineHeight: 20, fontSize: 18, fontFamily: 'Times', color: '#f05458' }}>15</Text>
                </View>
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - цифру в левой части, чтобы отметить где вы остановились.
                </Text>
              </View>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>

      </Modal>
    )
  }
}

class ModalNoAd extends React.Component {
  render(){
    return(
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => this.props.close()}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: appThemeStore.colors.surface, padding: 15 }}>


              <Text>
                В данный момент рекламный блок для вашего устройства не найден.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Реклама будет показана в следующий раз.
              </Text>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>

      </Modal>
    )
  }
}

const ModalTranslateSentence = observer(class ModalTranslateSentence extends React.Component {
  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{ width: '90%', maxWidth: 700 }}
            >
              <View style={{
                backgroundColor: readerStore.backgroundColorTheme,
                borderRadius: 10,
                alignItems: "center",
                width: "100%",
                shadowRadius: 4,
                overflow: 'hidden',
                elevation: 5
              }}>
                <ScrollView style={{ width: '100%', maxHeight: Dimensions.get('window').height - 300 }}>

                  <TouchableOpacity activeOpacity={1}>
                    {this.props.translate.constructor === Array &&
                      <View style={{ margin: 10 }}>
                        {this.props.translate.map((sentence, index) =>
                          <View key={index} style={{ marginTop: 5, flexDirection: "row" }}>
                            <View style={{ width: 20 }}>
                              <Text style={{ fontSize: 18, fontFamily: 'Times', color: '#bbb' }}>{(index + 1)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: readerStore.textColorTheme }}>{sentence}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    }

                    {this.props.translate.constructor != Array &&
                      <Text style={{ padding: 10, color: readerStore.textColorTheme }}>
                        {this.props.translate}
                      </Text>
                    }
                  </TouchableOpacity>

                </ScrollView>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 10, marginTop: 15, height: 40, backgroundColor: '#f05458', alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>

            </TouchableOpacity>

            {this.props.has_subscription == false &&
              <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {adSizeMini && (
                  <BannerView
                    size={adSizeMini}
                    adRequest={{ adUnitId: AD_UNIT_BANNER }}
                  />
                )}
              </View>
            }
          </View>
        </TouchableOpacity>

      </Modal>
    )
  }
});

const ModalTranslateWord = observer(class ModalTranslateWord extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      voiceover_playing: false,
      count_voiceover: 0,
      count_words: 0,
      words: [],
      show_limits_information: false
    }

    // Animated value для пульсирования иконки озвучки слова
    this.scaleAnim = new Animated.Value(1);
  }

  async componentDidMount() {
    if (!this.props.has_subscription) {
      this.check_count_voiceover();
    }

    var words = await new Storage().get('words_keys', '[]');
    words = JSON.parse(words);

    this.setState({
      count_words: words.length
    });
  }

  componentWillUnmount() {
    if (this.voiceoverSound) {
      this.voiceoverSound.release();
      this.voiceoverSound = null;
    }
    this.voiceover_playing_lock = false;
  }

  async check_count_voiceover() {
    if (this.props.has_subscription) {
      this.setState({
        count_voiceover: 0,
        words: []
      });
      return;
    }

    var date_today = moment().format("YYYY-MM-DD");
    var count_voiceover_hash = await new Storage().get('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    count_voiceover_hash = JSON.parse(count_voiceover_hash);

    if (count_voiceover_hash['date'] != date_today) {
      count_voiceover_hash['count'] = 0;
      count_voiceover_hash['words'] = [];

      new Storage().set('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    }

    this.setState({
      count_voiceover: count_voiceover_hash['count'],
      words: count_voiceover_hash['words']
    });
  }

  startPulseAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  stopPulseAnimation() {
    this.scaleAnim.setValue(1);
  }

  prepareVoiceoverAudioSession() {
    try {
      Sound.setCategory('Playback', true);
    } catch (e) {
      Sound.setCategory('Playback');
    }

    if (Sound.setActive) {
      try {
        Sound.setActive(true);
      } catch (e) {}
    }
  }

  async voice_word(original) {
    if (this.voiceover_playing_lock) {
      return;
    }
    this.voiceover_playing_lock = true;

    AppMetrica.reportEvent('Voiceover', {
      original: original
    });

    this.setState({
      voiceover_playing: true
    });
    this.startPulseAnimation();

    var pesponse = await new Request('/api/v1/books/voiceover_url_by_word', { original: original }, { do_not_show_error: true }).get();

    if (!pesponse || !pesponse.url) {
      AppAlert.alert('Озвучка не найдена');
      this.setState({ voiceover_playing: false });
      this.stopPulseAnimation();
      this.voiceover_playing_lock = false;
      return;
    }

    var url = HOST + pesponse.url;

    {
      this.prepareVoiceoverAudioSession();

      if (this.voiceoverSound) {
        this.voiceoverSound.release();
        this.voiceoverSound = null;
      }

      var sound = new AppSound(url, '', error => {
        if (this.voiceoverSound !== sound) {
          sound.release();
          return;
        }

        if (error) {
          appStore.showError('Ошибка воспроизвездения');
          sound.release();
          this.voiceoverSound = null;
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
          return;
        }

        if (sound.getDuration() <= 0) {
          appStore.showError('Озвучка не найдена');
          sound.release();
          this.voiceoverSound = null;
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
          return;
        }

        sound.setVolume(1);

        sound.play((success) => {
          if (success) {
            if (!this.props.has_subscription && !this.state.words.includes(original)) {
              var new_words = [...this.state.words, original];
              var new_count = this.state.count_voiceover + 1;

              new Storage().set('count_voiceover', JSON.stringify(
                {
                  date: moment().format("YYYY-MM-DD"),
                  count: new_count,
                  words: new_words
                }
              ));

              this.setState({
                count_voiceover: new_count,
                words: new_words
              });
            }
          }

          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;

          if (this.voiceoverSound === sound) {
            sound.release();
            this.voiceoverSound = null;
          } else {
            sound.release();
          }
        });
      }, () => {
        if (this.voiceoverSound === sound) {
          this.voiceoverSound = null;
          this.setState({ voiceover_playing: false });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
        }
      })
      this.voiceoverSound = sound;
    }
  }

  async addWordToDictionary() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addWordToDictionary', { word: this.props.original });

      var previousWord = await new Storage().get('word_' + this.props.original, '{}');
      previousWord = JSON.parse(previousWord);
      var wordPayload = {
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate
      };

      await new Storage().set('word_' + this.props.original, JSON.stringify({
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate,
        version: previousWord.version,
        offline: true
      }));
      await this.addWordToKeys('word_' + this.props.original);
      await SyncManager.enqueue('word', 'upsert', wordPayload, previousWord.version);
      await SyncManager.flush(this.props.current_user.id);

      this.props.setWordInDictionary(true);

      this.setState({
        count_words: this.state.count_words + 1
      });
    }
  }


  async addWordToKeys(value) {
    var words_keys = await new Storage().get('words_keys');
    if (words_keys == undefined) {
      words_keys = []
    } else {
      words_keys = JSON.parse(words_keys);

      var index = words_keys.indexOf(value);
      if (index > -1) {
        words_keys.splice(index, 1);
      }
    }

    words_keys.unshift(value);

    await new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  async deleteWordFromDictionary() {
    this.props.setWordInDictionary(false);

    var storedWord = await new Storage().get('word_' + this.props.original, '{}');
    storedWord = JSON.parse(storedWord);
    await this.deleteBookmarkKey('word_' + this.props.original);

    this.setState({
      count_words: this.state.count_words - 1
    });

    await new Storage().remove('word_' + this.props.original);
    await SyncManager.enqueue('word', 'delete', {
      original: this.props.original
    }, storedWord.version);
    await SyncManager.flush(this.props.current_user.id);
  }

  async deleteBookmarkKey(value) {
    var words_keys = await new Storage().get('words_keys', '[]');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf(value);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    await new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  openSubscription() {
    this.props.close();
    setTimeout(() => this.props.openSubscription(), 100);
  }


  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={{
                margin: 20,
                backgroundColor: readerStore.backgroundColorTheme,
                borderRadius: 10,
                alignItems: "center",
                width: 250,
                shadowRadius: 4,
                overflow: 'hidden',
                elevation: 5
              }}>
                {appStore.has_internet ? (
                  <React.Fragment>
                    <React.Fragment>
                      {(this.state.count_voiceover < 15 || this.props.has_subscription) ? (
                        <TouchableWithoutFeedback onPress={() => this.voice_word(this.props.original)}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Animated.View style={this.state.voiceover_playing && { transform: [{ scale: this.scaleAnim }] }}>
                              <AppIcon icon={VolumeIcon} size={24} color={this.state.voiceover_playing ? app_theme_colors.red : readerStore.textColorTheme} />
                            </Animated.View>
                            {!this.props.has_subscription &&
                              <View style={{ marginTop: 5, width: 24 }}>
                                <Text style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>
                                  {15 - this.state.count_voiceover}/15
                                </Text>
                              </View>
                            }
                          </View>
                        </TouchableWithoutFeedback>
                      ) : (
                        <TouchableWithoutFeedback onPress={() => AppAlert.alert('Лимит на сегодня закончился', 'Оплатите подписку, чтобы пользоваться озвучкой без ограничений.\nБесплатно доступно 15 слов в день.')}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <AppIcon icon={VolumeIcon} size={24} color="#aaa" />
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </React.Fragment>
                  </React.Fragment>
                ) : (
                  <TouchableWithoutFeedback onPress={() => AppAlert.alert('Нет подключения к интернету!')}>
                    <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                      <AppIcon icon={VolumeIcon} size={24} color="#aaa" />
                    </View>
                  </TouchableWithoutFeedback>
                )}

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#f05458', fontSize: 19 }}>{this.props.original}</Text>
                </View>
                {this.props.transcription != null &&
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ color: '#aaa' }}>[{this.props.transcription}]</Text>
                  </View>
                }
                <View style={{ paddingLeft: 10, paddingRight: 10, marginTop: 10 }}>
                  <Text style={{ color: readerStore.textColorTheme, textAlign: 'center' }}>{this.props.translate}</Text>
                </View>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 10, marginTop: 15, height: 40, backgroundColor: '#f05458', width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>

                {this.props.word_in_dictionary ? (
                  <React.Fragment>
                    <View style={{ width: 230, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 5, marginBottom: 5 }}>
                      <Text style={{ color: appThemeStore.colors.text, fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 5 }}>
                        Слово добавлено в словарь
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => this.deleteWordFromDictionary()}>
                      <View style={{ borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, margin: 10, marginTop: 0, height: 32, width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                        <Text style={{ color: appThemeStore.colors.text, lineHeight: 30, textAlign: 'center' }}>Удалить из словаря</Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <View style={{ flexDirection: 'row', height: 32, width: 230, margin: 10, marginTop: 10, alignItems: 'center' }}>
                      {(this.state.count_words < 30 || this.props.has_subscription) ? (
                        <TouchableOpacity onPress={() => this.addWordToDictionary()}>
                          <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                            <Text style={{ color: appThemeStore.colors.text, lineHeight: 30, textAlign: 'center' }}>Добавить в словарь</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                          <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Вы исчерпали лимит</Text>
                        </View>
                      )}
                      {this.props.has_subscription == false &&
                        <TouchableOpacity onPress={() => this.setState({ show_limits_information: !this.state.show_limits_information })}>
                          <View style={{ width: 24, height: 24, margin: 6, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 4, overflow: 'hidden' }}>
                            {this.state.show_limits_information ? (
                              <AppIcon icon={CloseIcon} size={20} color={appThemeStore.colors.text} style={{ margin: 1 }} />
                            ) : (
                              <Text style={{ color: appThemeStore.colors.text, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>?</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      }
                    </View>

                    {this.state.show_limits_information &&
                      <View style={{ margin: 10, marginTop: 0 }}>
                        <View><Text style={{ textAlign: 'center', fontSize: 12 }}>Без PRO-доступа вы можете</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>добавить до 30 слов</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>и озвучить до 15 слов в день</Text></View>

                        <View><Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12 }}>Вы добавили {this.state.count_words}/30</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>Вы озвучили {this.state.count_voiceover}/15</Text></View>

                        <TouchableOpacity onPress={() => this.openSubscription()}>
                          <Text style={{ color: '#f05458', fontSize: 12, marginTop: 4, textAlign: 'center', }}>Приобрести PRO-доступ</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  </React.Fragment>
                )}

              </View>
            </TouchableOpacity>

            {this.props.has_subscription == false &&
              <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {adSizeMini && (
                  <BannerView
                    size={adSizeMini}
                    adRequest={{ adUnitId: AD_UNIT_BANNER }}
                  />
                )}
              </View>
            }
          </View>
        </TouchableOpacity>
      </Modal >
    )
  }
});

var currentSentenceSound = null;
var currentSentenceSoundKey = null;
var currentSentenceSoundOwner = null;

const Paragraph = observer(class Paragraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sentences: false,
      paragraph_translate: [],
    }

    // Animated value для пульсирования иконки озвучки
    this.scaleAnim = new Animated.Value(1);
  }

  isSpeaking(sentenceIndex) {
    var cur = readerStore.currentSpeaking;
    return cur && cur.p === this.props.data['name'] && cur.i === sentenceIndex;
  }

  startPulseAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  stopPulseAnimation() {
    this.scaleAnim.setValue(1);
  }

  speakSentence(sentence, sentenceIndex) {
    if (!appStore.has_subscription) {
      AppAlert.alert(
        'Озвучка предложений доступна при наличии PRO-доступа',
        '',
        [
          { text: 'Купить PRO-доступ', onPress: this.props.openSubscription },
          { text: 'Отменить', style: 'cancel' }
        ]
      );
      return;
    }

    var soundKey = this.props.book_id + '_' + this.props.data['name'] + '_' + sentenceIndex;

    // Если нажали на уже играющее предложение — остановить
    if (currentSentenceSoundKey === soundKey && currentSentenceSound) {
      currentSentenceSound.release();
      currentSentenceSound = null;
      currentSentenceSoundKey = null;
      currentSentenceSoundOwner = null;
      readerStore.setCurrentSpeaking(null);
      this.stopPulseAnimation();
      return;
    }

    // Как на сайте: одновременно воспроизводится только один готовый аудиофайл.
    if (currentSentenceSound) {
      currentSentenceSound.release();
      if (currentSentenceSoundOwner) currentSentenceSoundOwner.stopPulseAnimation();
    }
    currentSentenceSound = null;
    currentSentenceSoundKey = null;
    currentSentenceSoundOwner = null;

    readerStore.setCurrentSpeaking({ p: this.props.data['name'], i: sentenceIndex });
    this.startPulseAnimation();

    var url = HOST + '/voiceover_books/' + this.props.book_id + '/' + this.props.data['name'] + '/' + sentenceIndex + '.mp3';
    var sound = new AppSound(url, '', error => {
      if (currentSentenceSound !== sound) {
        sound.release();
        return;
      }

      if (error || sound.getDuration() <= 0) {
        appStore.showError('Озвучка не найдена');
        sound.release();
        currentSentenceSound = null;
        currentSentenceSoundKey = null;
        currentSentenceSoundOwner = null;
        readerStore.setCurrentSpeaking(null);
        this.stopPulseAnimation();
        return;
      }

      sound.setVolume(1);
      sound.play(success => {
        if (!success) appStore.showError('Ошибка воспроизведения');
        if (currentSentenceSound === sound) {
          sound.release();
          currentSentenceSound = null;
          currentSentenceSoundKey = null;
          currentSentenceSoundOwner = null;
          readerStore.setCurrentSpeaking(null);
          this.stopPulseAnimation();
        } else {
          sound.release();
        }
      });
    }, () => {
      if (currentSentenceSound === sound) {
        currentSentenceSound = null;
        currentSentenceSoundKey = null;
        currentSentenceSoundOwner = null;
        readerStore.setCurrentSpeaking(null);
        this.stopPulseAnimation();
      }
    });

    currentSentenceSound = sound;
    currentSentenceSoundKey = soundKey;
    currentSentenceSoundOwner = this;
  }

  async componentDidMount() {
    var paragraph_translate = [];
    for (const s in this.props.data['sentences']) {
      paragraph_translate.push(this.props.data['sentences'][s]['tr']);
    }

    this.setState({
      sentences: this.props.data['sentences'],
      paragraph_translate: paragraph_translate,
    });
  }

  componentWillUnmount() {
    if (currentSentenceSoundOwner === this && currentSentenceSound) {
      currentSentenceSound.release();
      currentSentenceSound = null;
      currentSentenceSoundKey = null;
      currentSentenceSoundOwner = null;
      readerStore.setCurrentSpeaking(null);
    }
  }

  async addBookmark() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addBookmark', { bookmark: 'bookmark_' + this.props.book_id + '_' + this.props.data['name'] });

      if (readerStore.bookmark == this.props.data['name']) {
        this.props.setBookmark(false);
        var storedBookmark = await new Storage().get('bookmark_' + this.props.book_id, '{}');
        storedBookmark = JSON.parse(storedBookmark);
        await this.deleteBookmarkKey('bookmark_' + this.props.book_id);
        await new Storage().remove('bookmark_' + this.props.book_id);
        await SyncManager.enqueue('bookmark', 'delete', {
          book_id: this.props.book_id
        }, storedBookmark.version);
        await SyncManager.flush(this.props.current_user.id);
      } else {
        var previousBookmark = await new Storage().get('bookmark_' + this.props.book_id, '{}');
        previousBookmark = JSON.parse(previousBookmark);
        var bookmarkPayload = {
          book_id: this.props.book_id,
          page: this.props.page,
          paragraph: this.props.data['name']
        };

        await new Storage().set('bookmark_' + this.props.book_id, JSON.stringify({
          book_id: this.props.book_id,
          book_name: this.props.book_name,
          page: this.props.page,
          paragraph: this.props.data['name'],
          version: previousBookmark.version,
          offline: true
        }));
        await this.addBookmarkToKeys('bookmark_' + this.props.book_id);
        await SyncManager.enqueue('bookmark', 'upsert', bookmarkPayload, previousBookmark.version);
        await SyncManager.flush(this.props.current_user.id);
        await this.props.setBookmark(this.props.data['name']);
      }

    }
  }

  async addBookmarkToKeys(value) {
    let bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);

      var index = bookmarks_keys.indexOf(value);
      if (index > -1) {
        bookmarks_keys.splice(index, 1);
      }
    }

    bookmarks_keys.unshift(value);

    await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  async deleteBookmarkKey(value) {
    var bookmarks_keys = await new Storage().get('bookmarks_keys', '[]');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf(value);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  translateWord(word_id) {
    word_id = parseInt(word_id);

    var word = readerStore.list_words[word_id];

    AppMetrica.reportEvent('translateWord', { word: word });

    var transcription = word.ts;

    if (word != undefined) {
      if (word.ts != null) {
        if (word.ts.length == 0) {
          transcription = null;
        }
      }

      this.props.openTranslateWord(
        word.o,
        word.tr,
        transcription,
      );
    }
  }

  translateText(translate) {
    AppMetrica.reportEvent('translateText', { platform: Platform.OS });

    this.props.openTranslateSentence(translate);
  }

  render() {

    return (

      <React.Fragment>
        {(readerStore.page == 1 && this.props.data['name'] == 1) &&
          <View style={readerScreenStyles.bookTitle}>
            <Text style={[readerScreenStyles.bookTitleText, { color: readerStore.textColorTheme }]}>{this.props.book_name_en}</Text>
          </View>
        }
        <View style={readerScreenStyles.paragraphRow}>
          <TouchableOpacity onPress={() => this.addBookmark(this.props.data['name'])} style={readerScreenStyles.bookmarkButton}>
            <Text style={[readerScreenStyles.bookmarkNumber, { color: readerStore.secondColorTheme }, (readerStore.bookmark == this.props.data['name']) && readerScreenStyles.bookmarkNumberActive]}>{this.props.data['name']}</Text>
            <AppIcon
              icon={BookmarkIcon}
              size={20}
              color={readerStore.bookmark == this.props.data['name'] ? app_theme_colors.red : readerStore.secondColorTheme}
              style={readerScreenStyles.bookmarkImage}
            />

          </TouchableOpacity>
          <View style={[readerScreenStyles.sentencesContainer, { justifyContent: readerStore.textAlign }]}>
            <View style={readerScreenStyles.sentenceIndent}></View>
            {this.props.data['sentences'].map((sentence, index) =>
              <React.Fragment key={index}>
                {appStore.has_internet ? (
                  <TouchableOpacity onPress={() => this.speakSentence(sentence, index)} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Animated.View style={this.isSpeaking(index) && { transform: [{ scale: this.scaleAnim }] }}>
                      <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color={this.isSpeaking(index) ? app_theme_colors.red : readerStore.textColorTheme} />
                    </Animated.View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => AppAlert.alert('Нет подключения к интернету!')} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color="#aaa" />
                  </TouchableOpacity>
                )}
                {sentence['b'].map((block, index) => {

                  var past_value = "";
                  if (sentence['b'][index - 1] != undefined) {
                    past_value = sentence['b'][index - 1]['v'];
                  }

                  return (
                    <React.Fragment key={index} >
                      {block['w'] != undefined &&
                        <TouchableWithoutFeedback onPress={() => this.translateWord(block['w'])}>
                          <View style={[past_value != '"' && past_value != "'" ? readerScreenStyles.wordBlockWithMargin : readerScreenStyles.wordBlock, { borderBottomColor: readerStore.secondColorTheme }]}>
                            <Text style={{ fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }}>{block['v']}</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      }
                      {block['w'] == undefined &&
                        <Text style={[readerScreenStyles.punctuation, { fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }]}>{block['v']}</Text>
                      }
                    </React.Fragment>
                  );
                }
                )}

                {this.props.data['sentences'].length > 1 &&
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => this.translateText(sentence['tr'])}
                    style={readerScreenStyles.translateButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon icon={EllipsisVerticalIcon} size={readerStore.translate_icon_size} color='#f05458' />
                  </TouchableOpacity>
                }

              </React.Fragment>
            )}


            <TouchableOpacity
              activeOpacity={1}
              onPress={() => this.translateText(this.state.paragraph_translate)}
              style={readerScreenStyles.translateButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon icon={EllipsisIcon} size={readerStore.translate_icon_size} color='#f05458' />
            </TouchableOpacity>


          </View>
        </View>
      </React.Fragment>
    );
  }
});

class ReaderSettingsPanel extends React.Component {
  renderColorButton(backgroundColor, textColor, secondColor) {
    var selected = this.props.backgroundColorTheme == backgroundColor;
    return (
      <TouchableOpacity
        onPress={() => this.props.changeColorTheme(backgroundColor, textColor, secondColor)}
        style={{ width: 30, height: 30, marginHorizontal: 5, borderWidth: 1, borderColor: secondColor, borderRadius: 20, backgroundColor: backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <AppIcon icon={CheckIcon} size={14} color={textColor} />}
      </TouchableOpacity>
    );
  }

  renderFontButton(title, fontFamily) {
    var selected = this.props.fontFamily == fontFamily;
    return (
      <TouchableOpacity
        onPress={() => this.props.chanageFontFamily(fontFamily)}
        style={{ paddingVertical: 8, paddingHorizontal: 10, marginBottom: 4, borderRadius: 6, borderWidth: 1, borderColor: selected ? appThemeStore.colors.border : 'transparent', boxSizing: 'border-box', backgroundColor: appThemeStore.colors.backgroundLight }}>
        <Text style={{ fontSize: 16, fontFamily: fontFamily, color: selected ? app_theme_colors.red : appThemeStore.colors.text }}>{title}</Text>
      </TouchableOpacity>
    );
  }

  render() {
    var iconColor = this.props.textColorTheme;
    var borderColor = this.props.secondColorTheme;
    return (
      <View style={{ width: '100%', maxWidth: this.props.maxWidth || 212, alignSelf: 'center', borderRadius: 10, borderWidth: 1, borderColor: borderColor, backgroundColor: this.props.backgroundColorTheme, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', borderBottomColor: borderColor, borderBottomWidth: 1 }}>
          <View style={{ flex: 2, minHeight: 50, flexDirection: 'row', position: 'relative', borderRightWidth: 1, borderRightColor: borderColor }}>
            <TouchableOpacity
              disabled={this.props.fontSize <= 14}
              onPress={() => this.props.changeFontSize('less')}
              style={{ flex: 1, opacity: this.props.fontSize <= 14 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: borderColor, backgroundColor: appThemeStore.colors.backgroundLight }}>
              <AppIcon icon={MinusIcon} size={20} color={appThemeStore.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={this.props.fontSize >= 24}
              onPress={() => this.props.changeFontSize('more')}
              style={{ flex: 1, opacity: this.props.fontSize >= 24 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appThemeStore.colors.backgroundLight }}>
              <AppIcon icon={PlusIcon} size={20} color={appThemeStore.colors.text} />
            </TouchableOpacity>
            <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 12.5, marginLeft: -15, width: 30, height: 25, zIndex: 2, elevation: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 5, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: this.props.backgroundColorTheme }}>
              <Text style={{ width: 28, fontSize: 13, lineHeight: 23, textAlign: 'center', color: this.props.textColorTheme }}>{this.props.fontSize}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => this.props.textAlignChange()} style={{ flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: appThemeStore.colors.backgroundLight }}>
            {this.props.textAlign == 'flex-start' && <AppIcon icon={AlignLeftIcon} size={20} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'flex-end' && <AppIcon icon={AlignRightIcon} size={20} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'center' && <AppIcon icon={AlignCenterIcon} size={20} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'space-evenly' && <AppIcon icon={AlignJustifyIcon} size={20} width={20} height={20} color={appThemeStore.colors.text} />}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', borderBottomColor: borderColor, borderBottomWidth: 1, paddingVertical: 14 }}>
          {this.renderColorButton('#ffffff', '#000000', '#dddddd')}
          {this.renderColorButton('#eeeeee', '#000000', '#cccccc')}
          {this.renderColorButton('#f8f4e9', '#000000', '#d4c8a0')}
          {this.renderColorButton('#292c2c', '#ffffff', '#5a5d5d')}
          {this.renderColorButton('#000000', '#ffffff', '#444444')}
        </View>

        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 16, marginBottom: 8, color: this.props.textColorTheme }}>Шрифт текста:</Text>
          {this.renderFontButton('Libre Baskerville', 'LibreBaskerville-Regular')}
          {this.renderFontButton('Times', 'Times')}
          {this.renderFontButton('Arial', 'Arial')}
          {this.renderFontButton('Verdana', 'Verdana')}
        </View>
      </View>
    );
  }
}

class ReaderSettings extends React.Component {
  render() {
    return (
      <Modal
        visible={this.props.visible == true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => this.props.closeSettings && this.props.closeSettings()}
        statusBarTranslucent={true}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' }}
          onPress={() => this.props.closeSettings && this.props.closeSettings()}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={{ position: 'absolute', right: 10, top: 45, width: 212 }}>
              <ReaderSettingsPanel {...this.props} />
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  }
}

var scroll_percent = 0;


class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      current_page: null,
      page: '',
      pages: null,
      percent: 0,

      paragraphs: false,
      show_list: false,

      showTranslateWord: false,
      showTranslateSentence: false,

      showThemeSetting: false,

      translate_icon_size: false,
      fontSize: false,
      textAlign: false,

      fontFamily: false,

      backgroundColorTheme: false,
      textColorTheme: false,
      secondColorTheme: false,

      showTraining: false,

      showAdInfo: false,
      showAdOpacity: false,

      showNoAd: false,

      auth_modal: false,

      bookmark: false,

      word_in_dictionary: false,
    };

    this.modalTranslateWordOriginal = null;
    this.modalTranslateWordTranscription = null;
    this.modalTranslateWordTranslate = null;

    this.modalTranslateSentence = "";

    this.book_name;
    this.book_name_en;
  }


  async componentDidMount() {
    this.have_file = await new Storage().get('have_file_' + this.props.stack.route.params.book_id, '') == 'true';

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    books.map((book) => {
      if (book.id == this.props.stack.route.params.book_id) {
        this.book_name = book.name;
        this.book_name_en = book.name_en;
      }
    });

    AppMetrica.reportEvent('openReader', {
      book_name: this.book_name
    });

    var bookmark = await new Storage().get('bookmark_' + this.props.stack.route.params.book_id);
    var bookmarkParagraph = false;

    if (bookmark != undefined) {
      bookmarkParagraph = JSON.parse(bookmark).paragraph;
      this.setState({
        bookmark: bookmarkParagraph,
      });
    }

    var settings = await new Storage().get('themeReaderSettings');

    if (settings == undefined) {
      settings = {
        translate_icon_size: 24,
        fontSize: 18,
        textAlign: 'flex-start',
        backgroundColorTheme: '#ffffff',
        textColorTheme: '#000000',
        secondColorTheme: '#bbb',
        fontFamily: 'LibreBaskerville-Regular',
      }
      new Storage().set('themeReaderSettings', JSON.stringify(settings));
    } else {
      settings = JSON.parse(settings);
    }

    settings['backgroundColorTheme'] = appThemeStore.colors.background;
    settings['textColorTheme'] = appThemeStore.colors.text;
    settings['secondColorTheme'] = appThemeStore.colors.second;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      this.previousBodyBackgroundColor = document.body.style.backgroundColor;
      document.body.style.backgroundColor = settings['backgroundColorTheme'];
      this.unsubscribeBodyFocus = this.props.stack.navigation.addListener('focus', () => {
        document.body.style.backgroundColor = this.state.backgroundColorTheme || settings['backgroundColorTheme'];
      });
      this.unsubscribeBodyBlur = this.props.stack.navigation.addListener('blur', () => {
        document.body.style.backgroundColor = this.previousBodyBackgroundColor || '#fff';
      });
    }

    this.setState({
      translate_icon_size: settings['translate_icon_size'],
      fontSize: settings['fontSize'],
      textAlign: settings['textAlign'],
      backgroundColorTheme: settings['backgroundColorTheme'],
      textColorTheme: settings['textColorTheme'],
      secondColorTheme: settings['secondColorTheme'],
      fontFamily: settings['fontFamily'],
    });

    readerStore.setThemeSettings(settings);
    this._appearanceThemeSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (appThemeStore.mode != 'system') return;
      var colors = APP_COLOR_THEMES[colorScheme == 'dark' ? 'dark' : 'light'];
      this.setState({
        backgroundColorTheme: colors.background,
        textColorTheme: colors.text,
        secondColorTheme: colors.second
      });
      readerStore.setThemeSettings({
        backgroundColorTheme: colors.background,
        textColorTheme: colors.text,
        secondColorTheme: colors.second
      });
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.body.style.backgroundColor = colors.background;
      }
    });
    readerStore.setBookmark(bookmarkParagraph);
    readerStore.setPage(this.state.page);
    if (this.have_file == true) {
      var words = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/words.json');
      words = JSON.parse(words);

      var pagination = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/pagination.json');
      pagination = JSON.parse(pagination);
    } else {
      var words = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/words.json', {}, {}).get();
      var pagination = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/pagination.json', {}, {}).get();
    }

    readerStore.setListWords(words);

    if (this.props.stack.route.params.bookmark == undefined) {
      var page = await new Storage().get('page_' + this.props.stack.route.params.book_id);

      if (page == undefined) {
        page = 1;
      }
    } else {
      var page = this.props.stack.route.params.bookmark.page;
    }


    this.setState({
      page: parseInt(page),
      pages: Object.keys(pagination).length,
    }, () => {
      this.openPage(true);
    });

    var haveTraining = await new Storage().get('haveTraining') == 'true';
    if (haveTraining == false) {
      this.setState({
        showTraining: true,
      });
    }
  }

  componentWillUnmount() {
    if (this._appearanceThemeSubscription) this._appearanceThemeSubscription.remove();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (this.unsubscribeBodyFocus) this.unsubscribeBodyFocus();
      if (this.unsubscribeBodyBlur) this.unsubscribeBodyBlur();
      document.body.style.backgroundColor = this.previousBodyBackgroundColor || '#fff';
    }
    this.setState({
      paragraphs: false,
    });
    readerStore.clearListWords();
    clearTimeout(this._scrollRestoreTimer);
    clearTimeout(this._scrollPercentSaveTimer);
  }

  async openPage(first_load) {
    var open_page = true;

    if (this.have_file == false && this.props.root.state.has_internet == false) {
      open_page = false;
      AppAlert.alert('Отсутствует подключение к интернету');
    }

    if (open_page == true) {

      scroll_percent = 0;

      this.setState({ show_list: false, paragraphs: false });

      await new Storage().set('page_' + this.props.stack.route.params.book_id, this.state.page.toString());

      this.setPercent();

      if (this.have_file == true) {
        var response = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/pagination.json');
        var pagination = JSON.parse(response);
      } else {
        var pagination = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/pagination.json', {}, {}).get();
      }

      await this.goBookUp(this.props.stack.route.params.book_id);

      var pageItems = pagination[this.state.page];
      var bookId = this.props.stack.route.params.book_id;
      var paragraphs = [];
      var batchSize = 3;
      for (var i = 0; i < pageItems.length; i += batchSize) {
        var batch = pageItems.slice(i, i + batchSize);
        var results = await Promise.all(batch.map(async (paragraphId) => {
          if (this.have_file == true) {
            var response = await RNFS.readFile(file_root + '/books/' + bookId + '/paragraphs/' + paragraphId + '.json');
            return { name: paragraphId, sentences: JSON.parse(response) };
          } else {
            var sentences = await new Request('/books/' + bookId + '/result/paragraphs/' + paragraphId + '.json', {}, {}).get();
            return sentences !== false ? { name: paragraphId, sentences: sentences } : null;
          }
        }));
        results.forEach(function (p) { if (p !== null) paragraphs.push(p); });
      }

      if (paragraphs.length != 0) {
        if (this.props.root.state.has_subscription == false) {
          if (paragraphs.length > 3) paragraphs.splice(3, 0, { _type: 'ad', _key: 'ad_3' });
          if (paragraphs.length > 8) paragraphs.splice(8, 0, { _type: 'ad', _key: 'ad_8' });
        }

        this.setState({
          paragraphs: paragraphs,
          show_list: true,
        });

        if (first_load == true) {
          if (this.props.stack.route.params.bookmark == undefined) {
            // Восстанавливаем сохранённую позицию скролла
            var scroll = await new Storage().get('scroll_' + this.props.stack.route.params.book_id);

            if (scroll !== undefined && scroll !== null && scroll !== '') {
              this._scrollRestoreTimer = setTimeout(() => {
                if (this.flatListRef && this.state.paragraphs && this.state.paragraphs.length > 0) {
                  try {
                    var offset = parseInt(scroll);
                    if (!isNaN(offset) && offset >= 0) {
                      this.flatListRef.scrollToOffset({ offset: offset, animated: false });
                    }
                  } catch (e) { }
                }
              }, 500);
            }
          } else {
            // Скролим к параграфу закладки
            var bookmarkParagraphId = this.props.stack.route.params.bookmark.paragraph;
            var bookmarkIndex = paragraphs.findIndex(p => p.name === bookmarkParagraphId);

            if (bookmarkIndex >= 0 && bookmarkIndex < paragraphs.length) {
              this._scrollRestoreTimer = setTimeout(() => {
                if (this.flatListRef && this.state.paragraphs && this.state.paragraphs.length > 0) {
                  try {
                    this.flatListRef.scrollToIndex({ index: bookmarkIndex, animated: false });
                  } catch (e) {
                    // Fallback: если scrollToIndex не работает, пробуем scrollToOffset с примерным смещением
                    try {
                      var approximateOffset = bookmarkIndex * 200; // примерная высота элемента
                      this.flatListRef.scrollToOffset({ offset: approximateOffset, animated: false });
                    } catch (e2) { }
                  }
                }
              }, 500);
            }
          }
        }
      }

      this.setState({
        current_page: this.state.page
      });
    }
  }

  async prevPage() {
    this.setState({
      page: this.state.page - 1,
    }, () => {
      this.checkAd();
    });
  }

  async nextPage() {
    this.setState({
      page: this.state.page + 1,
    }, () => {
      this.checkAd();
    });
  }

  async checkAd() {
    if (this.props.root.state.has_internet == true && this.props.root.state.has_subscription == false) {
      var time_ad = await new Storage().get('time_ad');

      if (time_ad == undefined) {
        time_ad = moment();
        await new Storage().set('time_ad', moment().format());
      } else {
        time_ad = moment(time_ad);
      }

      var now_time = moment();

      var range_time = (now_time - time_ad) / 1000 / 60;

      //range_time = 40;

      if (range_time < 30) {
        this.openPage(false);
      } else {
        if (appStore.show_subsription == true) {
          this.showAdInfo();
        } else if (Platform.OS === 'web') {
          this.showWebAd();
        } else {
          this.showAd();
        }
      }
    } else {
      this.openPage(false);
    }
  }

  showAdInfo() {
    AppMetrica.reportEvent('showAdInfo', { platform: Platform.OS });

    this.setState({
      showAdInfo: true,
    });
  }

  closeAdInfo() {
    this.setState({
      showAdInfo: false,
      page: this.state.current_page
    });
  }


  closeNoAdInfo() {
    this.setState({
      showNoAd: false,
    });
  }


  closeTranslateWord() {
    this.setState({
      showTranslateWord: false,
    });
  }

  closeTranslateSentence() {
    this.setState({
      showTranslateSentence: false,
    });
  }

  async showAd() {
    this.setState({
      showAdInfo: false,
      showAdOpacity: true,
    });

    try {
      const loader = await RewardedAdLoader.create();
      const rewardedAd = await loader.loadAd({
        adUnitId: AD_UNIT_REWARDED,
      });

      rewardedAd.onAdDismissed = () => {
        if (this.state.showAdOpacity == true) {
          this.setState({
            showAdOpacity: false,
          });
          new Storage().set('time_ad', moment().format());
          this.openPage(false);
        }
      };

      rewardedAd.onAdFailedToShow = () => {
        if (this.state.showAdOpacity == true) {
          this.setState({
            showAdOpacity: false,
          });
          if (this.state.showNoAd == false) {
            this.setState({
              showNoAd: true,
            });
          }
          this.openPage(false);
        }
      };

      await rewardedAd.show();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      if (this.state.showAdOpacity == true) {
        this.setState({
          showAdOpacity: false,
        });
        if (this.state.showNoAd == false) {
          this.setState({
            showNoAd: true,
          });
        }
        this.openPage(false);
      }
    }
  }

  async showWebAd() {
    this.setState({
      showAdInfo: false,
      showAdOpacity: true,
    });

    var result = await advertisingConfig.showWebFullscreen(this.state.textColorTheme == '#ffffff');

    if (result == 'closed') {
      await new Storage().set('time_ad', moment().format());
      AppMetrica.reportEvent('loader', { status: 'webFullscreenClosed' });
    }

    this.setState({ showAdOpacity: false });
    this.openPage(false);
  }

  closeTraining() {
    new Storage().set('haveTraining', 'true');

    this.setState({
      showTraining: false,
    });
  }


  sliderValueChange(value) {
    var page = parseInt((value / (100 / (this.state.pages - 1))).toFixed(0)) + 1;
    this.setState({
      page: page,
    });
  }

  async onSlidingComplete() {

    AppMetrica.reportEvent('slidingPage', { platform: Platform.OS });

    this.checkAd();
  }

  onScroll(event) {
    if (event.nativeEvent.contentSize.height <= event.nativeEvent.layoutMeasurement.height) {
      scroll_percent = 100;
    } else {
      scroll_percent = (event.nativeEvent.contentOffset.y / (event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height)) * 100;
      if (scroll_percent < 0) {
        scroll_percent = 0;
      }
      if (scroll_percent > 100) {
        scroll_percent = 100;
      }
    }

    var percent = this.calculatePercent();
    if (percent !== this.state.percent) {
      this.setState({ percent: percent }, () => {
        if (Platform.OS === 'web') {
          clearTimeout(this._scrollPercentSaveTimer);
          this._scrollPercentSaveTimer = setTimeout(() => this.setPercent(), 250);
        }
      });
    }
  }
  onScrollEndDrag(event) {
    new Storage().set('scroll_' + this.props.stack.route.params.book_id, event.nativeEvent.contentOffset.y.toString());
    this.setPercent();
  }

  async setPercent() {
    var percent = this.calculatePercent();

    await new Storage().set('percent_' + this.props.stack.route.params.book_id, percent.toString());

    var percents = this.props.root.state.books_percents;
    percents[this.props.stack.route.params.book_id] = percent;

    this.props.root.setState({
      books_percents: percents,
    });

    this.setState({
      percent: percent,
    });
  }

  calculatePercent() {
    var pages = parseFloat(this.state.pages);
    if (!pages || pages < 1) {
      return 0;
    }

    var percent = ((parseFloat(this.state.page - 1) / pages) * 100) +
      ((100 / pages) * (scroll_percent / 100));
    percent = parseInt(percent.toFixed(0));

    return percent > 98 ? 100 : percent;
  }


  setBookmark(value) {
    readerStore.setBookmark(value);
    this.setState({
      bookmark: value,
    });
  }

  openAuthModal() {
    this.setState({
      showTranslateWord: false,
      auth_modal: true,
    });
  }

  async openTranslateWord(original, translate, transcription) {
    this.modalTranslateWordOriginal = original;
    this.modalTranslateWordTranscription = transcription;
    this.modalTranslateWordTranslate = translate;

    var word = await new Storage().get('word_' + original);

    this.setState({
      word_in_dictionary: word != undefined,
      showTranslateWord: true,
    });
  }

  translateSentence(value) {
    this.modalTranslateSentence = value;
    this.setState({
      showTranslateSentence: true,
    });
  }

  openThemeSetting() {

    AppMetrica.reportEvent('openThemeSetting', { open: !this.state.showThemeSetting });

    this.setState({
      showThemeSetting: !this.state.showThemeSetting,
    });
  }


  chanageFontFamily(fontFamily) {
    this.setState({
      show_list: false,
    }, function () {
      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);
        settings['fontFamily'] = fontFamily;
        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          AppMetrica.reportEvent('changeProperty', { fontFamily: fontFamily });
          this.setState({
            fontFamily: fontFamily,
            show_list: true,
          });
          readerStore.setThemeSettings({ fontFamily: fontFamily });
        });

      });
    });
  }

  changeColorTheme(backgroundColor, textColor, secondColor) {
    appThemeStore.setCustomTheme(appThemeNameByBackground(backgroundColor));
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = backgroundColor;
    }

    this.setState({
      show_list: false,
    }, function () {
      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['backgroundColorTheme'] = backgroundColor;
        settings['textColorTheme'] = textColor;
        settings['secondColorTheme'] = secondColor;

        AppMetrica.reportEvent('changeProperty', { colorTheme: backgroundColor });

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          this.setState({
            backgroundColorTheme: backgroundColor,
            textColorTheme: textColor,
            secondColorTheme: secondColor,
            show_list: true,
          });
          readerStore.setThemeSettings({
            backgroundColorTheme: backgroundColor,
            textColorTheme: textColor,
            secondColorTheme: secondColor,
          });
        });
      });
    });
  }

  textAlignChange() {
    this.setState({
      show_list: false,
    }, function () {

      var nowTextAlign = this.state.textAlign;
      if (nowTextAlign == 'flex-start') {
        nowTextAlign = 'flex-end';
      } else {
        if (nowTextAlign == 'flex-end') {
          nowTextAlign = 'center';
        } else {
          if (nowTextAlign == 'center') {
            nowTextAlign = 'space-evenly';
          } else {
            nowTextAlign = 'flex-start';
          }
        }
      }

      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['textAlign'] = nowTextAlign;

        AppMetrica.reportEvent('changeProperty', { textAlign: nowTextAlign });

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {

          this.setState({
            show_list: true,
            textAlign: nowTextAlign,
          });
          readerStore.setThemeSettings({ textAlign: nowTextAlign });
        });

      });
    });
  }

  changeFontSize(type_change) {
    this.setState({
      show_list: false,
    }, function () {

      if (type_change == 'more') {
        var newFontSize = this.state.fontSize + 2;
      } else {
        var newFontSize = this.state.fontSize - 2;
      }

      AppMetrica.reportEvent('changeProperty', { fontSize: newFontSize });

      if (newFontSize == 14) {
        var translate_icon_size = 18;
      }
      if (newFontSize == 16) {
        var translate_icon_size = 22;
      }
      if (newFontSize == 18) {
        var translate_icon_size = 24;
      }
      if (newFontSize == 20) {
        var translate_icon_size = 26;
      }
      if (newFontSize == 22) {
        var translate_icon_size = 28;
      }
      if (newFontSize == 24) {
        var translate_icon_size = 30;
      }

      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['fontSize'] = newFontSize;
        settings['translate_icon_size'] = translate_icon_size;

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          this.setState({
            fontSize: newFontSize,
            translate_icon_size: translate_icon_size,
            show_list: true,
          });
          readerStore.setThemeSettings({ fontSize: newFontSize, translate_icon_size: translate_icon_size });
        });
      });
    });
  }


  async goBookUp(book_id) {
    var sort_new_book = await new Storage().get('sort_new_book');
    if (sort_new_book == undefined) {
      sort_new_book = 'true';
    }
    if (sort_new_book == 'true') {
      var new_result = [];

      var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
      books = JSON.parse(books);

      books.map((book) => {
        if (book.id == book_id) {
          new_result.unshift(book);
        } else {
          new_result.push(book);
        }
      });

      await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(new_result), 'utf8');
      appStore.setBooksOrder(new_result.map(book => book.id));
    }
  }

  setWordInDictionary(word_in_dictionary) {
    this.setState({
      word_in_dictionary: word_in_dictionary
    });
  }

  openSubscription() {
    this.props.stack.navigation.navigate('subscription', {
      backTitle: this.book_name || this.book_name_en || 'Книги'
    });
  }

  renderParagraphItem({ item }) {
    if (item._type === 'ad') {
      return (
        <View style={readerScreenStyles.adContainer}>
          {adSizeBig && (
            <BannerView
              size={adSizeBig}
              adRequest={{ adUnitId: AD_UNIT_BANNER }}
            />
          )}
          <TouchableOpacity
            onPress={() => this.openSubscription()}
            style={[
              readerScreenStyles.disableAdsButton,
              {
                backgroundColor: readerStore.backgroundColorTheme,
                borderColor: readerStore.secondColorTheme
              }
            ]}>
            <Text style={[readerScreenStyles.disableAdsButtonText, { color: readerStore.textColorTheme }]}>
              Отключить рекламу
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View>
        <Paragraph
          data={item}
          openTranslateSentence={(value) => this.translateSentence(value)}
          openTranslateWord={(o, tr, ts) => this.openTranslateWord(o, tr, ts)}
          openSubscription={() => this.openSubscription()}
          openAuthModal={() => this.openAuthModal()}
          setBookmark={(value) => this.setBookmark(value)}
          current_user={this.props.root.state.current_user}
          page={this.state.page}
          book_name={this.book_name}
          book_name_en={this.book_name_en}
          book_id={this.props.stack.route.params.book_id}
          percent={this.state.percent}
          has_internet={this.props.root.state.has_internet}
        />
      </View>
    );
  }

  render() {
    var safeAreaInsets = this.props.safeAreaInsets || { top: 0, bottom: 0 };
    var safeAreaTop = safeAreaInsets.top || 0;
    var safeAreaBottom = safeAreaInsets.bottom || 0;

    return (
      <React.Fragment>

        {this.state.textColorTheme == '#ffffff' &&
          <StatusBar
            barStyle="light-content"
          />
        }
        {this.state.textColorTheme == '#000000' &&
          <StatusBar
            barStyle="dark-content"
          />
        }

        {(this.state.paragraphs == false) ? (
          <View style={[readerScreenStyles.safeRoot, { backgroundColor: this.state.backgroundColorTheme, paddingTop: safeAreaTop }]}>
            <TouchableOpacity onPress={() => this.props.stack.navigation.goBack()}>
              <AppIcon icon={ChevronLeftIcon} size={30} color={this.state.textColorTheme} style={{ marginTop: 5, marginLeft: 10 }} />
            </TouchableOpacity>

            <ActivityIndicator style={{ flex: 1 }} size="large" color={this.state.secondColorTheme || appThemeStore.colors.mutedText} />
          </View>
        ) : (

          <View style={[readerScreenStyles.safeRoot, { backgroundColor: this.state.backgroundColorTheme, paddingTop: safeAreaTop }]}>

            <Modal
              animationType="slide"
              presentationStyle={'overFullScreen'}
              visible={this.state.auth_modal && this.props.root.state.current_user == false}>
              <Auth
                method={this.state.auth_method}
                modal={true}
                bookmark_info={true}
                close={() => this.setState({ auth_modal: false })}
              />
            </Modal>

            {this.state.showAdOpacity == true &&
              <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
                <ActivityIndicator style={{ flex: 1 }} size="large" color={this.state.secondColorTheme || appThemeStore.colors.mutedText} />
              </View>
            }

            {(this.state.showAdInfo && this.props.root.state.has_subscription == false) &&
              <TouchableOpacity style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '120%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }} onPress={() => this.closeAdInfo()}>
                <TouchableWithoutFeedback>
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: "#FFF",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}>
                    <View style={{ padding: 30 }}>
                      <Text style={{ fontSize: 17 }}>
                        Чтобы приложение было бесплатным, мы вынуждены показывать рекламу. {"\n"} {"\n"}Вы можете приобрести PRO-версию, чтобы отключить рекламу, а еще будет доступен режим чтения без интернета.
                      </Text>

                      <TouchableOpacity onPress={() => this.showAd()} style={{ marginTop: 30, backgroundColor: '#75b641', height: 50, borderRadius: 10 }}>
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Смотреть рекламу</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => this.openSubscription()} style={{ marginTop: 15, marginBottom: 30, backgroundColor: '#f05458', height: 50, borderRadius: 10 }}>
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Приобрести PRO-версию</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            }

            <ModalNoAd visible={this.state.showNoAd} close={() => this.closeNoAdInfo()} />

            <ModalFastLearning
              visible={this.state.showTraining}
              close={() => this.closeTraining()} />

            <ModalTranslateSentence
              has_subscription={this.props.root.state.has_subscription}
              translate={this.modalTranslateSentence}
              visible={this.state.showTranslateSentence}
              close={() => this.closeTranslateSentence()} />

            <ModalTranslateWord
              current_user={this.props.root.state.current_user}
              has_subscription={this.props.root.state.has_subscription}
              original={this.modalTranslateWordOriginal}
              transcription={this.modalTranslateWordTranscription}
              translate={this.modalTranslateWordTranslate}
              word_in_dictionary={this.state.word_in_dictionary}
              visible={this.state.showTranslateWord}
              has_internet={this.props.root.state.has_internet}
              close={() => this.closeTranslateWord()}
              openAuthModal={() => this.openAuthModal()}
              setWordInDictionary={(flag) => this.setWordInDictionary(flag)}
              openSubscription={() => this.openSubscription()}
            />

            <View style={readerScreenStyles.layout}>
              <View style={[readerScreenStyles.header, {
                backgroundColor: this.state.backgroundColorTheme,
                borderBottomWidth: 1,
                borderColor: this.state.secondColorTheme,
              }]}>
                <TouchableOpacity onPress={() => this.props.stack.navigation.goBack()}>
                  <AppIcon icon={ChevronLeftIcon} size={30} color={this.state.textColorTheme} style={{ marginTop: 5, marginLeft: 10 }} />
                </TouchableOpacity>

                {this.state.pages == 1 ? (
                  <View style={{ flex: 1 }}></View>
                ) : (
                  <Slider
                    style={{
                      flex: 1,
                      marginLeft: 5,
                      marginRight: 5,
                      width: Dimensions.get('window').width - 100
                    }}
                    value={this.state.percent}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    minimumTrackTintColor="#fe4444"
                    maximumTrackTintColor={this.state.secondColorTheme}
                    thumbImage={require("./app/images/reader/sliderThumb.png")}
                    onValueChange={(value) => this.sliderValueChange(value)}
                    onSlidingComplete={() => this.onSlidingComplete()}
                  />
                )}

                <TouchableWithoutFeedback onPress={() => this.openThemeSetting()}>
                  <View style={{ height: 30, width: 30, marginTop: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon icon={SettingsIcon} size={26} color={this.state.textColorTheme || '#000000'} />
                  </View>
                </TouchableWithoutFeedback>

                <ReaderSettings
                  visible={this.state.showThemeSetting}
                  closeSettings={() => this.setState({ showThemeSetting: false })}

                  fontSize={this.state.fontSize}
                  changeFontSize={(value) => this.changeFontSize(value)}

                  textAlign={this.state.textAlign}
                  textAlignChange={() => this.textAlignChange()}

                  backgroundColorTheme={this.state.backgroundColorTheme}
                  textColorTheme={this.state.textColorTheme}
                  secondColorTheme={this.state.secondColorTheme}
                  changeColorTheme={(backgroundColor, textColor, secondColor) => this.changeColorTheme(backgroundColor, textColor, secondColor)}

                  fontFamily={this.state.fontFamily}
                  chanageFontFamily={(fontFamily) => this.chanageFontFamily(fontFamily)}
                />

              </View>

              <View style={readerScreenStyles.readerContainer}>
                {this.state.show_list &&
                  <FlatList
                    ref={(ref) => this.flatListRef = ref}
                    data={this.state.paragraphs}
                    keyExtractor={(item) => item._type === 'ad' ? item._key : 'p_' + item.name}
                    renderItem={(itemInfo) => this.renderParagraphItem(itemInfo)}
                    initialNumToRender={5}
                    maxToRenderPerBatch={3}
                    windowSize={7}
                    onScroll={(event) => this.onScroll(event)}
                    onScrollEndDrag={(event) => this.onScrollEndDrag(event)}
                    scrollEventThrottle={8}
                    ListFooterComponent={<View style={{ height: 50 + safeAreaBottom }} />}
                    style={{ flex: 1 }}
                  />
                }
              </View>

              <View style={[readerScreenStyles.footerNav, {
                height: 50 + safeAreaBottom,
                paddingBottom: safeAreaBottom,
                backgroundColor: this.state.backgroundColorTheme,
                borderTopWidth: 1,
                borderTopColor: this.state.secondColorTheme,
              }]}>

                {this.state.page > 1 &&
                  <TouchableOpacity onPress={() => this.prevPage()} style={readerScreenStyles.navButton}>
                    <AppIcon icon={ChevronLeftIcon} size={30} color={this.state.textColorTheme} />
                  </TouchableOpacity>
                }
                {this.state.page == 1 &&
                  <AppIcon icon={ChevronLeftIcon} size={30} color={this.state.textColorTheme} opacity={0.3} style={{ margin: 10 }} />
                }


                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <Text style={{ color: this.state.textColorTheme, lineHeight: 30, fontSize: 16 }}> {this.state.page} / {this.state.pages}</Text>
                </View>

                {this.state.page < this.state.pages &&
                  <TouchableOpacity onPress={() => this.nextPage()} style={{ padding: 10 }}>
                    <AppIcon icon={ChevronRightIcon} size={30} color={this.state.textColorTheme} />
                  </TouchableOpacity>
                }
                {this.state.page == this.state.pages &&
                  <AppIcon icon={ChevronRightIcon} size={30} color={this.state.textColorTheme} opacity={0.3} style={{ margin: 10 }} />
                }

              </View>
            </View>


          </View>

        )}
      </React.Fragment>
    )
  }
};

const TargetVersion = observer(class TargetVersion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    }
    this.current_version = '1';
    this.target_version = null;
  }

  async componentDidMount() {
    if (appStore.has_internet == true) {
      var response = await new Request('/api/v1/target_version', {}, { do_not_show_error: true }).get();

      if (response != false) {
        if (Platform.OS === 'ios') {
          this.current_version = CURRENT_IOS_VERSION;
          this.target_version = response.ios_version;
        }
        if (Platform.OS === 'android') {
          this.current_version = CURRENT_ANDROID_VERSION;
          this.target_version = response.android_version;
        }

        if (this.compareVersions() == false) {
          this.setState({
            visible: true
          });
        }
      }
    }
  }

  compareVersions() {
    if (!this.current_version || !this.target_version) return true;
    var current = parseInt(this.current_version.split('.').join(''));
    var target = parseInt(this.target_version.split('.').join(''));

    var check = true;

    if (target > current) {
      check = false;
    }

    return check;
  }

  close() {
    this.setState({
      visible: false
    });
  }

  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.state.visible}>

        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => this.close()}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: appThemeStore.colors.surface, padding: 15 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Обновите приложение</Text>

              <View style={{ marginTop: 15, backgroundColor: '#ddd', borderRadius: 5, padding: 5 }} w>
                <Text style={{ textAlign: 'center', fontSize: 14 }}>
                  {this.current_version} -> {this.target_version}
                </Text>
              </View>


              <Text style={{ marginTop: 15 }}>
                Просим обновить приложение, чтобы иметь доступ ко всем нововведениям.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Обратите внимание, что если приложение не обновлять - это может привести к ошибкам.
              </Text>

              {Platform.OS === 'ios' &&
                <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/ru/app/read-en/id1562732797")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                  <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>App Store</Text>
                </TouchableOpacity>
              }

              {Platform.OS === 'android' &&
                <React.Fragment>
                  <TouchableOpacity onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Google Play</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL("https://apps.rustore.ru/app/com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>RuStore</Text>
                  </TouchableOpacity>
                </React.Fragment>
              }

              <TouchableOpacity onPress={() => this.close()} style={{ marginTop: 15, backgroundColor: appThemeStore.colors.backgroundLight, height: 40, borderRadius: 10 }}>
                <Text style={{ color: appThemeStore.colors.text, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Обновить позже</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>

      </Modal>
    )
  }
});

function PwaInstallBanner() {
  const [installEvent, setInstallEvent] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    var standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone || window.localStorage.getItem('reedle_install_banner_dismissed') === 'true') {
      return undefined;
    }

    setVisible(true);
    var handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    var handleInstalled = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!visible) return null;

  var isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  var instruction = isIos
    ? 'Нажмите «Поделиться», затем «На экран Домой».'
    : installEvent
      ? 'Установите Reedle, чтобы открывать его как обычное приложение.'
      : 'Откройте меню браузера и выберите «Установить приложение».';

  var close = () => {
    window.localStorage.setItem('reedle_install_banner_dismissed', 'true');
    setVisible(false);
  };

  var install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    var choice = await installEvent.userChoice;
    AppMetrica.reportEvent('installPrompt', { outcome: choice.outcome });
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  return (
    <View style={{
      position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10000,
      padding: 12, borderRadius: 12, backgroundColor: appThemeStore.colors.surface,
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
      flexDirection: 'row', alignItems: 'center'
    }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 3 }}>Установить Reedle</Text>
        <Text style={{ fontSize: 12, color: appThemeStore.colors.mutedText }}>{instruction}</Text>
      </View>
      {installEvent &&
        <TouchableOpacity onPress={install} style={{ backgroundColor: '#f05458', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>Установить</Text>
        </TouchableOpacity>
      }
      <TouchableOpacity accessibilityLabel="Закрыть" onPress={close} style={{ padding: 8 }}>
        <Text style={{ color: appThemeStore.colors.mutedText, fontSize: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

class Header extends React.Component {
  render(){
    return(
      <SafeAreaView style={{backgroundColor: appThemeStore.colors.surface}}>
        <View style={applicationStyles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
            <AppIcon icon={MenuIcon} size={26} color={appThemeStore.colors.text} />
          </TouchableOpacity> 
          <Text style={applicationStyles.header_title}>{this.props.title}</Text>
          <View style={applicationStyles.header_empty_block}/>
        </View>
        
      </SafeAreaView>
    )
  }
}

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

class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;
    this.oauthAuthorization = new OAuthAuthorization(this);
    this.navigationRef = React.createRef();
    this.pendingDeepLink = this.deepLinkFromWebLocation();

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
      oauth_modal_show: false,
      oauth_manual_token: '',
      oauth_manual_loading: false,
      oauth_manual_error: false,
      type_payment: Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa'
    }

    this.notification_timer;
    this._checkingSubscription = false;
  }

  deepLinkFromWebLocation() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

    var bookMatch = window.location.pathname.match(/^\/app\/books\/(\d+)(\/reader)?\/?$/);
    if (bookMatch) {
      return { screen: bookMatch[2] ? 'reader' : 'show', params: { book_id: bookMatch[1] } };
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
      var parsed_user = JSON.parse(current_user);
      this.setState({
        current_user: parsed_user,
      });
      appStore.setCurrentUser(parsed_user);
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      var oauthParams = new URLSearchParams(window.location.search);
      if (oauthParams.get('oauth') == 'pwa') {
        await this.oauthAuthorization.loadPwaUser();
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    var confirm_conditions = await new Storage().get('confirm_conditions_' + POLICY_VERSION);
    var confirm_val = confirm_conditions == 'true';
    this.setState({
      confirm_conditions: confirm_val
    });
    appStore.setConfirmConditions(confirm_val);

    this.checkSubscription();

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
      if (state.isConnected && this.state.current_user != false) {
        SyncManager.flush(this.state.current_user.id);
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
    this.oauthAuthorization.cancel();
    if (this._pwaUpdateHandler && typeof window !== 'undefined') {
      window.removeEventListener('reedle:pwa-update-available', this._pwaUpdateHandler);
    }
    if (this._unsubNet) {
      this._unsubNet();
    }
    if (this._linkSub) {
      this._linkSub.remove();
    }
    clearTimeout(this.notification_timer);
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
    return await new Request('/api/v1/payments/sync_subscription', {
      user_id: user_id,
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

    this.setState({ has_subscription, subscription_info });
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    let sync_with_server = null;

    // 1. Сначала проверяем подписку на сайте
    const current_user = appStore.current_user;
    if (current_user) {
      var response = await new Request('/api/v1/users/subscription', {
        user_id: current_user.id
      }, {
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
              user_id: current_user.id,
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
    this.setState({ has_subscription, subscription_info });
    appStore.setSubscription(has_subscription);
    appStore.setSubscriptionInfo(subscription_info);

    if (sync_with_server) {
      this.sync_subscription_with_server(
        sync_with_server.user_id,
        sync_with_server.subscription_id,
        sync_with_server.end_date,
      );
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
        AppAlert.alert('', 'Интернета по-прежнему нет(');
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
    var themeColors = appThemeStore.colors;
    var backButtonOptions = (navigation, title, color) => ({
      headerTitle: '',
      headerBackVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: '100%' }}>
          <AppIcon icon={ChevronLeftIcon} size={24} color={color || appThemeStore.colors.text} />
          <Text style={{ marginLeft: 4, color: color || appThemeStore.colors.text, fontSize: 16 }}>{title}</Text>
        </TouchableOpacity>
      )
    });

    return (
      <View style={{ flex: 1, backgroundColor: themeColors.background }}>
        <StatusBar
          barStyle={themeColors.text == '#ffffff' ? 'light-content' : 'dark-content'}
          backgroundColor={themeColors.surface}
        />
        <TargetVersion />
        {this.state.confirm_conditions === null ? (
          <View style={{ flex: 1, backgroundColor: themeColors.background }} />
        ) : this.state.confirm_conditions == false ? (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 15, backgroundColor: themeColors.background }}>
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
                <Stack.Screen
                  name="dictionary_learning"
                  options={({ navigation }) => ({
                    ...backButtonOptions(navigation, 'Словарь')
                  })}>
                  {(stack) => (
                    <DictionaryLearning root={this} stack={stack} />
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
                  <AppIcon icon={CloseIcon} size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            }
          </View>
        )}
        <PwaInstallBanner />
        <AppAlertModal />
        <Modal
          animationType="slide"
          presentationStyle="fullScreen"
          visible={this.state.oauth_modal_show}
          onRequestClose={() => this.oauthAuthorization.close()}>
          <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  accessibilityLabel="Закрыть"
                  onPress={() => this.oauthAuthorization.close()}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <AppIcon icon={CloseIcon} size={26} color={themeColors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', paddingBottom: 80 }}>
                <ActivityIndicator size="large" color={app_theme_colors.red} />
                <Text style={{ fontSize: 28, fontWeight: '600', textAlign: 'center', marginTop: 24 }}>
                  Идёт авторизация…
                </Text>
                <Text style={{ fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 16 }}>
                  Авторизуйтесь в социальной сети и вернитесь в приложение.
                </Text>
                <Text style={{ color: themeColors.mutedText, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 }}>
                  Если авторизация не подтвердилась автоматически, введите токен, который вы получите после успешного входа.
                </Text>

                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={this.state.oauth_manual_token}
                  onChangeText={(value) => this.setState({ oauth_manual_token: value, oauth_manual_error: false })}
                  onSubmitEditing={() => this.oauthAuthorization.authorizeByManualToken()}
                  placeholder="Токен авторизации"
                  returnKeyType="done"
                  style={{ height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 16, marginTop: 28 }}
                />

                {this.state.oauth_manual_error != false &&
                  <Text style={{ color: app_theme_colors.red, lineHeight: 20, marginTop: 10 }}>
                    {this.state.oauth_manual_error}
                  </Text>
                }

                <TouchableOpacity
                  disabled={!String(this.state.oauth_manual_token || '').trim() || this.state.oauth_manual_loading}
                  onPress={() => this.oauthAuthorization.authorizeByManualToken()}
                  style={[
                    profileStyles.form_button,
                    { marginTop: 16, opacity: !String(this.state.oauth_manual_token || '').trim() ? 0.5 : 1 },
                  ]}>
                  {this.state.oauth_manual_loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={profileStyles.form_button_text}>Подтвердить токен</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }
}

class TabStack extends React.Component {
  constructor(props) {
    super(props);
  }

  setWebDocumentTitle(title) {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = title;
    }
  }

  render() {
    const Tab = createBottomTabNavigator();


    return (
      <Tab.Navigator initialRouteName="books"
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: appThemeStore.colors.text
        })}>
        <Tab.Screen name="books"
          listeners={{
            focus: () => this.setWebDocumentTitle('Книги'),
            tabPress: () => {
              if (this.homeRef) this.homeRef.getBooks();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookOpenIcon} size={18} color={color} />,
            title: 'Книги',
            headerShown: false
          })}>
          {(tabs) => (
            <SafeAreaInsetsContext.Consumer>
              {(insets) => (
                <Home
                  ref={(ref) => this.homeRef = ref}
                  tabs={tabs}
                  stack={this.props.stack}
                  parent={this}
                  root={this.props.root}
                  safeAreaInsets={insets}
                />
              )}
            </SafeAreaInsetsContext.Consumer>
          )}
        </Tab.Screen>
        <Tab.Screen name="bookmarks"
          listeners={{
            focus: () => this.setWebDocumentTitle('Закладки'),
            tabPress: () => {
              if (this.bookmarkStackRef) this.bookmarkStackRef.refresh();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookmarkIcon} size={18} color={color} />,
            title: 'Закладки',
          })}>
          {(tabs) => (
            <BookmarkStack ref={(ref) => this.bookmarkStackRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="dictionary"
          listeners={{
            focus: () => this.setWebDocumentTitle('Словарь'),
            tabPress: () => {
              if (this.dictionaryRef) this.dictionaryRef.getWords();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookAIcon} size={18} color={color} />,
            title: 'Словарь',
          })}>
          {(tabs) => (
            <Dictionary ref={(ref) => this.dictionaryRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="blog"
          listeners={{
            focus: () => this.setWebDocumentTitle('Блог'),
            tabPress: () => {
              if (this.blogRef) this.blogRef.loadArticles(1);
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={NewspaperIcon} size={18} color={color} />,
            title: 'Блог',
          })}>
          {() => (
            <Blog ref={(ref) => this.blogRef = ref} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="profile"
          listeners={{
            focus: () => this.setWebDocumentTitle('Профиль'),
          }}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => <AppIcon icon={UserIcon} size={18} color={color} />,
            title: 'Аккаунт',
            headerShown: (getFocusedRouteNameFromRoute(route) || 'profile_home') == 'profile_home',
          })}>
          {() => (
            <ProfileStack root={this.props.root} root_stack={this.props.stack} />
          )}
        </Tab.Screen>
      </Tab.Navigator >
    );
  }
}

const ButtonRead = observer(class ButtonRead extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      have_file: false,
      button_loader: true,
    };
  }

  async componentDidMount() {
    var have_file = await AsyncStorage.getItem('have_file_' + this.props.book_id);
    this.setState({
      have_file: have_file == 'true',
      button_loader: false,
    });
  }

  componentDidUpdate() {
    if (!this.state.have_file && downloadStore.isCompleted(this.props.book_id)) {
      this.setState({ have_file: true });
      this.props.set_have_file();
    }
  }

  startDownload() {
    downloadStore.start({
      id: this.props.book_id,
      name: this.props.book_name,
      name_en: this.props.book_name_en,
      color: this.props.color,
    });
  }

  renderProgress(download) {
    var progress = download.progress || 0;
    return (
      <View style={{ position: 'absolute', left: -15, top: -15 }}>
        <AnimatedCircularProgress
          size={90}
          width={20}
          fill={progress}
          tintColor={this.props.color}
          backgroundColor="#FFF"
          rotation={0}
          duration={0}>
          {() => progress === 0 ? (
            <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
          ) : (
            <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 12 }}>{progress.toFixed(1)}%</Text>
          )}
        </AnimatedCircularProgress>
      </View>
    );
  }

  render() {
    var download = downloadStore.get(this.props.book_id);
    var downloading = download && download.status !== 'completed' && download.status !== 'error';
    var haveFile = this.state.have_file || downloadStore.isCompleted(this.props.book_id);

    return (
      <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
        {this.state.button_loader ? (
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        ) : downloading ? (
          this.renderProgress(download)
        ) : haveFile ? (
          <AppIcon icon={ChevronRightIcon} size={20} color="#000" style={{ margin: 20 }} />
        ) : !appStore.has_internet ? (
          <AppIcon icon={WifiOffIcon} size={28} color="#aaa" style={{ margin: 16 }} />
        ) : (
          <TouchableOpacity onPress={() => this.startDownload()}>
            <AppIcon icon={ArrowDownToLineIcon} size={28} color="#000" style={{ margin: 16 }} />
          </TouchableOpacity>
        )}
      </View>
    );
  }
});

const Show = observer(class Show extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      percent: 0,
      book: false,
      have_file: false,
      context_menu_visible: false
    };
  }

  async componentDidMount() {
    homeStore.setOpenProperty(false);

    var initialColor = this.props.stack.route.params.color || '#f05458';

    this.props.stack.navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => this.setState({ context_menu_visible: !this.state.context_menu_visible })}
          style={{ width: 48, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
          accessibilityLabel="Действия с книгой">
          <AppIcon icon={EllipsisIcon} size={26} color="#FFF" />
        </TouchableOpacity>
      )
    });

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      this.previousBodyBackgroundColor = document.body.style.backgroundColor;
      document.body.dataset.reedleBackgroundOwner = 'book';
      document.body.style.backgroundColor = initialColor;
      this.unsubscribeBodyFocus = this.props.stack.navigation.addListener('focus', () => {
        document.body.dataset.reedleBackgroundOwner = 'book';
        document.body.style.backgroundColor = this.state.book.color || initialColor;
      });
      this.unsubscribeBodyBlur = this.props.stack.navigation.addListener('blur', () => {
        delete document.body.dataset.reedleBackgroundOwner;
        document.body.style.backgroundColor = appThemeStore.colors.background;
      });
    }

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await Promise.all(
      books.map(async (book) => {
        if (book.id == this.props.stack.route.params.book_id) {
          var have_file = await new Storage().get('have_file_' + book.id, 'false');
          downloadStore.setCompleted(book.id, have_file == 'true');

          AppMetrica.reportEvent('openDetail', {
            book_name: book.name
          });
          
          this.setState({
            book: book,
            have_file: have_file == 'true'
          });
          this.props.stack.navigation.setOptions({
            headerTitle: '',
            headerStyle: {
              backgroundColor: book.color,
              borderColor: 'transparent',
              shadowColor: 'transparent'
            }
          });
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.body.style.backgroundColor = book.color;
          }
        }
      })
    )
  }

  componentWillUnmount() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (this.unsubscribeBodyFocus) this.unsubscribeBodyFocus();
      if (this.unsubscribeBodyBlur) this.unsubscribeBodyBlur();
      delete document.body.dataset.reedleBackgroundOwner;
      document.body.style.backgroundColor = appThemeStore.colors.background;
    }
  }

  openBook(book_id) {
    this.props.stack.navigation.navigate('reader', {
      book_id: book_id
    });
  }

  set_have_file() {
    this.setState({
      have_file: true
    });
  }

  async markAsRead() {
    var bookId = this.props.stack.route.params.book_id;
    await new Storage().set('percent_' + bookId, '100');
    var percents = Object.assign({}, this.props.root.state.books_percents, { [bookId]: 100 });
    this.props.root.setState({ books_percents: percents });
    appStore.setBooksPercents(Object.assign({}, appStore.books_percents, { [bookId]: 100 }));
    this.setState({ percent: 100, context_menu_visible: false });
  }

  confirmDeleteFromMemory() {
    this.setState({ context_menu_visible: false }, () => {
      AppAlert.confirm(
        'Вы уверены?',
        'Скачанная книга будет удалена с устройства.',
        () => this.deleteFromMemory(),
        'Удалить'
      );
    });
  }

  async deleteFromMemory() {
    var bookId = this.props.stack.route.params.book_id;
    await downloadStore.removeBooks([bookId]);
    this.setState({ have_file: false });
  }

  render() {

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: this.state.book.color || this.props.stack.route.params.color || '#f05458' }}>
        <TargetVersion />
        <StatusBar barStyle="light-content" />

        {this.state.context_menu_visible &&
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => this.setState({ context_menu_visible: false })}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 20 }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ position: 'absolute', top: 8, right: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: appThemeStore.colors.surface, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
                <TouchableOpacity onPress={() => this.markAsRead()} style={{ minHeight: 34, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: appThemeStore.colors.text }}>Отметить прочитанной</Text>
                </TouchableOpacity>
                {this.state.have_file &&
                  <TouchableOpacity onPress={() => this.confirmDeleteFromMemory()} style={{ minHeight: 34, paddingHorizontal: 16, justifyContent: 'center', borderTopWidth: 1, borderTopColor: appThemeStore.colors.border }}>
                    <Text style={{ fontSize: 14, color: app_theme_colors.red }}>Удалить из памяти</Text>
                  </TouchableOpacity>
                }
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        }

        {this.state.book == false &&
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFF" />
        }

        {this.state.book != false &&
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly' }}>

            <View>
              <Text style={{ marginBottom: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.author}</Text>
              <Text style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 45, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name_en}</Text>
              <Text style={{ marginTop: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name}</Text>
            </View>

            <View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginRight: 15 }}>
                    <AppIcon icon={BookOpenIcon} size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={{ lineHeight: 20, fontSize: 12, color: '#FFF' }}>{this.props.root.state.books_percents[this.props.stack.route.params.book_id]}%</Text>
                  </View>
                </View>

                <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden', marginRight: 15 }}>
                  {this.props.root.state.has_internet == true || this.state.have_file == true ? (
                    <TouchableOpacity onPress={() => this.openBook(this.state.book.id)}>
                      <AppIcon icon={ChevronRightIcon} size={28} color="#000" style={{ margin: 16 }} />
                    </TouchableOpacity>
                  ) : (
                    <AppIcon icon={WifiOffIcon} size={28} color="#aaa" style={{ margin: 16 }} />
                  )}
                </View>

                {(this.props.root.state.has_subscription) && this.state.have_file == false &&
                  <View style={{ marginRight: 15 }}>
                    {this.props.root.state.has_subscription == true ? (
                      <React.Fragment>
                        {this.props.root.state.has_internet == true &&
                          <ButtonRead
                            set_have_file={() => this.set_have_file()}
                            book_id={this.state.book.id} color={this.state.book.color}
                            book_name={this.state.book.name}
                            book_name_en={this.state.book.name_en}
                            navigation={this.props.stack.navigation}
                          />
                        }
                      </React.Fragment>
                    ) : (
                      <View style={{ opacity: 0.3, height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
                        <AppIcon icon={DownloadIcon} size={28} color={app_theme_colors.red} style={{ margin: 16 }} />
                      </View>
                    )}
                  </View>
                }
              </View>


            </View>

            {this.state.have_file == false && this.props.root.state.has_internet == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>
                  Вы можете скачать книгу,{"\n"} чтобы читать ее без интернета
                </Text>

                {this.props.root.state.has_subscription == false &&
                  <Text style={{ marginTop: 15, color: '#FFF', textAlign: 'center' }}>
                    Функция скачивания доступна{"\n"} только при наличии подписки
                  </Text>
                }
              </View>
            }

            {this.state.have_file == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Книга скачана.</Text>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Вы можете читать ее без интернета</Text>
              </View>
            }
          </View>
        }
      </SafeAreaView>
    );

  }
});

const Subscription = observer(class Subscription extends React.Component {
  constructor() {
    super();
    this.state = {
      active_subscription: 3,
      load_payment_button: false,
      load_restore_button: false,
      modal_yoo_kassa: false,
      payment_url: '',
      payment_webview_loading: false,
      auth_modal: false,
      load_sync_button: false,
      api_prices: {},
    }

    // Fallback prices used when API is unavailable
    this.read_1_month = 99;
    this.read_6_month = 499;
    this.read_1_year = 799;
    this.read_forever = 2490;
  }

  async componentDidMount() {
    try {
      const result = await new Request(
        '/api/v1/subscriptions/prices', {}, { do_not_show_error: true }
      ).get();
      if (result) this.setState({ api_prices: result });
    } catch (e) { }
  }

  setActiveSubscription(active_subscription) {
    this.setState({ active_subscription });
  }

  async initPayment(subscription_id) {
    AppMetrica.reportEvent('initPayment', { type_payment: appStore.type_payment, subscription_id: subscription_id });
    if (appStore.type_payment == 'by_store') {
      this.payByStore(subscription_id);
    } else {
      this.payBySite(subscription_id);
    }
  }

  async initSubscriptionPayment() {
    this.initPayment(this.state.active_subscription);
  }

  async initForeverPayment() {
    this.initPayment(4);
  }

  async payByStore(subscription_id) {
    if (this.state.load_payment_button) return;
    try {
      this.setState({ load_payment_button: true });

      if (subscription_id == 1) var productId = 'read_1_month';
      if (subscription_id == 2) var productId = 'read_6_month';
      if (subscription_id == 3) var productId = 'read_1_year';
      if (subscription_id == 4) var productId = 'read_forever';

      const products = await Purchases.getProducts([productId]);
      if (!products || products.length === 0) {
        throw new Error('Product not found: ' + productId);
      }

      await Purchases.purchaseStoreProduct(products[0]);

      await this.props.root.checkSubscription();
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.warn('IAP error:', error);
        if (error.message && error.message.startsWith('Product not found')) {
          AppAlert.alert('Недоступно', 'Продукт временно недоступен в App Store. Попробуйте позже.');
        } else {
          AppAlert.alert('Ошибка покупки', error.message || 'Неизвестная ошибка. Попробуйте ещё раз.');
        }
      }
    } finally {
      this.setState({ load_payment_button: false });
    }
  }

  async payBySite(subscription_id) {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      if (this.state.load_payment_button == true) return;

      this.setState({ load_payment_button: true });
      try {
        var response = await new Request('/api/v1/payments', {
          user_id: this.props.root.state.current_user.id,
          subscription_id: subscription_id,
          app_payment: 'true'
        }, {}).post();

        if (response != false && response.payment_url) {
          this.setState({
            modal_yoo_kassa: true,
            payment_url: response.payment_url,
            payment_webview_loading: true
          });
        } else {
          AppAlert.alert('Ошибка', 'Не удалось открыть страницу оплаты. Попробуйте ещё раз.');
        }
      } catch (error) {
        AppAlert.alert('Ошибка', 'Не удалось открыть страницу оплаты. Попробуйте ещё раз.');
      } finally {
        this.setState({ load_payment_button: false });
      }
    }
  }

  closeYooKassa() {
    this.props.root.waitForSubscriptionActivation();

    this.setState({
      modal_yoo_kassa: false,
      payment_webview_loading: false
    }, () => {
      AppAlert.alert('Ожидайте подтверждения оплаты. Через некоторое время ПРО доступ автоматически активируется');
    });
  }

  async sync_subscription() {
    if (this.props.root.state.current_user == false) {
      this.setState({ auth_modal: true });
      return;
    }

    const { subscription_info } = appStore;
    if (!subscription_info || !subscription_info.subscription_id) {
      AppAlert.alert('Нет данных подписки для синхронизации');
      return;
    }

    this.setState({ load_sync_button: true });

    try {
      const result = await this.props.root.sync_subscription_with_server(
        this.props.root.state.current_user.id,
        subscription_info.subscription_id,
        moment(subscription_info.end_date).format('YYYY-MM-DD'),
      );

      if (result) {
        AppAlert.alert('Данные синхронизированы');
      } else {
        AppAlert.alert('Ошибка', 'Не удалось синхронизировать. Попробуйте позже.');
      }
    } catch (e) {
      AppAlert.alert('Ошибка', 'Не удалось синхронизировать. Попробуйте позже.');
    } finally {
      this.setState({ load_sync_button: false });
    }
  }

  // Numeric price from site API, or hardcoded fallback
  getNumericPrice(productId, fallback) {
    const p = this.state.api_prices[productId];
    return (p != null) ? p : fallback;
  }

  // Formatted price string
  getPrice(productId, fallback) {
    return this.getNumericPrice(productId, fallback) + ' ₽';
  }

  getPerMonthLabel(productId, fallback, months) {
    const total = this.getNumericPrice(productId, fallback);
    return Math.round(total / months) + ' ₽/мес';
  }

  getDiscountPercent(productId, fallback, months) {
    const monthly = this.getNumericPrice('read_1_month', this.read_1_month);
    const total = this.getNumericPrice(productId, fallback);
    return Math.round((1 - total / months / monthly) * 100);
  }

  getButtonLabel() {
    const { active_subscription } = this.state;
    if (active_subscription == 1) return 'Подписаться за ' + this.getPrice('read_1_month', this.read_1_month);
    if (active_subscription == 2) return 'Подписаться за ' + this.getPrice('read_6_month', this.read_6_month);
    if (active_subscription == 3) return 'Подписаться за ' + this.getPrice('read_1_year', this.read_1_year);
    if (active_subscription == 4) return 'Купить за ' + this.getPrice('read_forever', this.read_forever);
  }

  can_show_pricing() {
    var can_show = true;
    if (appStore.has_subscription == true) {
      if (appStore.subscription_info != undefined) {
        can_show = appStore.subscription_info.subscription_id != 4;
      }
    }

    return can_show;
  }

  range_of_subscription(subscription_id) {
    var texts = {
      '1': '1 месяц',
      '2': '6 месяцев',
      '3': '1 год'
    }

    return texts[subscription_id];
  }

  render() {
    const isCompact = Dimensions.get('window').width <= 360;
    const isDarkTheme = appThemeStore.colors.text == '#ffffff';
    const subscriptionTextColor = (lightColor) => isDarkTheme ? '#FFF' : lightColor;
    const pageHorizontalMargin = isCompact ? 16 : 30;
    const planPadding = isCompact ? 11 : 15;
    const planTitleFontSize = isCompact ? 19 : 22;
    const planPriceFontSize = isCompact ? 16 : 18;
    const badgeFontSize = isCompact ? 9 : 11;
    const selectedPlanStyle = isCompact
      ? { borderColor: appThemeStore.colors.border, borderWidth: 2, zIndex: 2 }
      : { borderColor: appThemeStore.colors.border, borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2 };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appThemeStore.colors.background }}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        <Modal
          animationType="fade"
          presentationStyle={'overFullScreen'}
          transparent={true}
          visible={this.state.modal_yoo_kassa}
        >
          <View activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View style={{ backgroundColor: appThemeStore.colors.surface, flex: 1, flexDirection: 'column', marginTop: 40, borderRadius: 10 }}>
              <View style={{
                height: 55, flexDirection: 'row', justifyContent: 'flex-end', borderBottomColor: '#ddd', borderBottomWidth: 1
              }}>
                <TouchableOpacity onPress={() => this.closeYooKassa()} style={{ width: 35, height: 35, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 7, margin: 10 }}>
                  <AppIcon icon={CloseIcon} size={20} color={appThemeStore.colors.text} style={{ margin: 7.5 }} />
                </TouchableOpacity>

              </View>
              <View style={{ flex: 1 }}>
                {Platform.OS === 'web' ? (
                  <iframe
                    key={this.state.payment_url}
                    src={this.state.payment_url}
                    title="Оплата подписки"
                    style={{ width: '100%', height: '100%', border: 0, display: 'block', backgroundColor: '#FFF' }}
                    onLoad={() => this.setState({ payment_webview_loading: false })}
                  />
                ) : (
                  <WebView
                    source={{ uri: this.state.payment_url }}
                    style={{ flex: 1 }}
                    onLoadStart={() => this.setState({ payment_webview_loading: true })}
                    onLoadEnd={() => this.setState({ payment_webview_loading: false })}
                    onError={() => this.setState({ payment_webview_loading: false })}
                  />
                )}
                {this.state.payment_webview_loading &&
                  <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: appThemeStore.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={appThemeStore.colors.mutedText} />
                    <Text style={{ marginTop: 12, color: subscriptionTextColor('#777'), fontSize: 14 }}>Загрузка страницы оплаты...</Text>
                  </View>
                }
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView style={{ flex: 1 }} >

          <View style={{ marginLeft: pageHorizontalMargin, marginRight: pageHorizontalMargin }}>

            {appStore.has_subscription == true &&
              <React.Fragment>
                <View style={{ marginTop: 16, borderRadius: 10, backgroundColor: appThemeStore.colors.backgroundLight, padding: 10 }}>
                  {appStore.subscription_info.subscription_id == 4 ? (
                    <React.Fragment>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        У вас активирован
                      </Text>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        вечный PRO-доступ
                      </Text>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Text style={{ textAlign: 'center', fontSize: 18, color: appThemeStore.colors.text }}>
                        Ваш PRO-доступ активен до:
                      </Text>
                      <View style={{ marginTop: 5 }}>
                        <Text style={{ textAlign: 'center', fontSize: 18, marginTop: 5, fontWeight: 'bold', color: appThemeStore.colors.text }}> {moment(appStore.subscription_info.end_date).format('DD.MM.YYYY')}</Text>
                      </View>
                    </React.Fragment>
                  )}
                </View>

                {appStore.type_payment == 'by_store' &&
                  <React.Fragment>
                    <TouchableOpacity onPress={() => this.sync_subscription()} style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 5 }}>
                      {this.state.load_sync_button == true ? (
                        <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Синхронизировать с сайтом</Text>
                      )}
                    </TouchableOpacity>
                    <Text style={{ marginTop: 10 }}>
                      Если вы оплатили подписку через AppStore, но на сайте ваша подписка не отображается, синхронизуруйте данные.
                    </Text>
                  </React.Fragment>
                }
              </React.Fragment>
            }

            {appStore.has_subscription == false &&
              <React.Fragment>
                <View style={{ marginTop: 16, flexDirection: 'column', justifyContent: 'center' }}>
                  {appStore.has_subscription == true &&
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Продлить доступ</Text>
                  }
                </View>

                <View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={MegaphoneOffIcon} size={28} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Выключить рекламу</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={WifiIcon} size={28} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Чтение без интернета</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={BookAIcon} size={28} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Словарь без лимитов</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <AppIcon icon={VolumeIcon} size={28} color={subscriptionTextColor('#000')} style={{ marginBottom: 16 }} />
                    </View>
                    <View style={{ flexDirection: 'column', height: 32, justifyContent: 'center', marginLeft: 8 }}>
                      <Text style={{ fontSize: 16, ineHeight: 32 }}>Озвучка слов без лимитов</Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            }

            {this.can_show_pricing() &&
              <React.Fragment>
                <View style={{ marginTop: 16, borderWidth: 1, borderColor: appThemeStore.colors.border, borderRadius: 10, overflow: isCompact ? 'hidden' : 'visible' }}>

                  {/* 1 месяц */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(1)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                    }, this.state.active_subscription == 1 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 1 && { color: app_theme_colors.red }]}>1 месяц</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_1_month', this.read_1_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_1_month', this.read_1_month, 1)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* 6 месяцев */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(2)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                    }, this.state.active_subscription == 2 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 2 && { color: app_theme_colors.red }]}>6 месяцев</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_6_month', this.read_6_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <View style={{ borderColor: appThemeStore.colors.border, borderWidth: 1, borderRadius: 4, paddingHorizontal: isCompact ? 5 : 8, paddingVertical: 3, marginBottom: 5 }}>
                          <Text numberOfLines={1} style={{ fontSize: badgeFontSize, fontWeight: 'bold' }}>Экономия {this.getDiscountPercent('read_6_month', this.read_6_month, 6)}%</Text>
                        </View>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_6_month', this.read_6_month, 6)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* 1 год */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(3)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                    }, this.state.active_subscription == 3 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 3 && { color: app_theme_colors.red }]}>1 год</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_1_year', this.read_1_year)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <View style={{ backgroundColor: '#f05458', borderRadius: 4, paddingHorizontal: isCompact ? 5 : 8, paddingVertical: 3, marginBottom: 5 }}>
                          <Text numberOfLines={1} style={{ color: '#FFF', fontSize: badgeFontSize, fontWeight: 'bold' }}>Лучшее предложение</Text>
                        </View>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPerMonthLabel('read_1_year', this.read_1_year, 12)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  <View style={{ height: 1, backgroundColor: appThemeStore.colors.border }} />

                  {/* Навсегда */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(4)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: appThemeStore.colors.background, padding: planPadding, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                    }, this.state.active_subscription == 4 && selectedPlanStyle]}>
                      <View style={{ flexShrink: 1, minWidth: 0 }}>
                        <Text style={[{ fontSize: planTitleFontSize, fontWeight: 'bold', color: subscriptionTextColor('#000') }, this.state.active_subscription == 4 && { color: app_theme_colors.red }]}>Навсегда</Text>
                        <Text numberOfLines={1} style={{ fontSize: isCompact ? 14 : 16, marginTop: 5 }}>Единоразовый платёж</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: planPriceFontSize, textAlign: 'right' }}>{this.getPrice('read_forever', this.read_forever)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                </View>

                {this.state.active_subscription == 4 &&
                  <Text style={{ marginTop: 16, color: subscriptionTextColor('#888'), fontSize: 13 }}>Доступ оплачивается один раз — продлевать не нужно.</Text>
                }
                {appStore.type_payment == 'by_yoo_kassa' && this.state.active_subscription != 4 &&
                  <Text style={{ marginTop: 16, color: subscriptionTextColor('#888'), fontSize: 13 }}>По окончании периода подписка не продлевается автоматически.</Text>
                }

                <Text style={{ marginTop: 8, color: subscriptionTextColor('#888'), fontSize: 13 }}>PRO-доступ распространяется на сайт <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: subscriptionTextColor(app_theme_colors.red) }}>reedle.ru</Text> и другие устройства, авторизованные под вашим аккаунтом.</Text>

                <TouchableOpacity
                  onPress={() => this.state.active_subscription == 4 ? this.initForeverPayment() : this.initSubscriptionPayment()}
                  style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 8 }}>
                  {this.state.load_payment_button == true ? (
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  ) : (
                    <Text numberOfLines={1} adjustsFontSizeToFit={true} style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16, fontWeight: 'bold', paddingHorizontal: 10 }}>
                      {appStore.has_subscription ? 'Продлить' : this.getButtonLabel()}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    this.setState({ load_restore_button: true });
                    await this.props.root.checkSubscription();
                    this.setState({ load_restore_button: false });
                  }}
                  style={{ marginTop: 12, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' }}>
                  {this.state.load_restore_button ? (
                    <ActivityIndicator size="small" color={subscriptionTextColor('#888')} />
                  ) : (
                    <Text style={{ color: subscriptionTextColor('#555'), textAlign: 'center', fontSize: 15 }}>Восстановить покупки</Text>
                  )}
                </TouchableOpacity>

              </React.Fragment>
            }

            <View style={{ marginTop: 30, marginBottom: 30, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")} style={{ marginRight: 15 }}>
                <Text style={{ color: subscriptionTextColor('#aaa'), textAlign: 'center', fontSize: 14 }}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")} style={{}}>
                <Text style={{ color: subscriptionTextColor('#aaa'), textAlign: 'center', fontSize: 14 }}>Privacy policy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>Подробности условий использования</Text>

            <Text style={{ fontSize: 13, marginTop: 8, color: subscriptionTextColor('#555'), lineHeight: 20 }}>
              Приложение распространяется бесплатно, без ограничений по времени. Автоматического списания средств нет.{'\n\n'}
              {'PRO-доступ можно приобрести на 1 месяц (' + this.getPrice('read_1_month', this.read_1_month) + '), 6 месяцев (' + this.getPrice('read_6_month', this.read_6_month) + '), 1 год (' + this.getPrice('read_1_year', this.read_1_year) + ') или навсегда (' + this.getPrice('read_forever', this.read_forever) + '). PRO убирает рекламу и открывает чтение без интернета.\n\n'}
              По окончании периода PRO-доступ не продлевается автоматически — для продления необходимо совершить покупку повторно в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: subscriptionTextColor(app_theme_colors.red) }}>reedle.ru</Text>. Пожизненный доступ продлевать не нужно.{'\n\n'}
              Возврат средств возможен только через поддержку Apple (для покупок через App Store). По другим вопросам пишите на info@reedle.ru.
            </Text>

            <View style={{ height: 40 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
});
