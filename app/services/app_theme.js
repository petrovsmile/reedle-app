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
        notification: app_theme_colors.red
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
        style={[{color:appThemeStore.colors.text,backgroundColor:appThemeStore.colors.surface},props.style,{borderColor:appThemeStore.colors.border,...(Platform.OS==='web'?{outlineStyle:'none'}:{})}]}
      />
    );
  }));
}
