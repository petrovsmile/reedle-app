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
    settings.fontSize = normalizeReaderFontSize(settings.fontSize || 18);
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
      'The Little Prince',
      'It is only with the heart that one can see rightly; what is essential is invisible to the eye.',
      'The morning was quiet, and a pale golden light stretched across the fields. A small bird landed nearby and listened to the wind.',
      'He opened the old book and continued reading. Every page carried him farther from the room and closer to a new adventure.',
      'When evening came, the stars appeared one by one. Their soft light reminded him that even a long journey begins with a single step.',
      'The road continued beyond the hill, turning gently toward the distant town. He smiled and walked on without looking back.'
    ];
    return (
      <AppSafeAreaView style={{ backgroundColor: appThemeStore.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Пример отображения</Text>
          <View style={{ minHeight: 624, position: 'relative', padding: 24, borderRadius: 8, borderWidth: 1, borderColor: this.state.secondColorTheme, backgroundColor: this.state.backgroundColorTheme, overflow: 'hidden' }}>
            {previewParagraphs.map((paragraph, index) =>
              <Text key={index} style={{ marginBottom: 16, fontSize: this.state.fontSize, lineHeight: readerLineHeight(this.state.fontSize), fontFamily: this.state.fontFamily, color: this.state.textColorTheme, textAlign: this.previewTextAlign() }}>
                {paragraph}
              </Text>
            )}

            <View style={{ position: 'absolute', right: 8, top: 8, width: 216, zIndex: 5 }}>
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
      </AppSafeAreaView>
    );
  }
}
