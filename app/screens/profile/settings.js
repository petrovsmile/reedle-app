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
    var value = await new Storage().get('themeReaderSettings');
    var settings = value ? JSON.parse(value) : {};
    if (appThemeStore.mode == 'system') {
      settings.backgroundColorTheme = appThemeStore.colors.background;
      settings.textColorTheme = appThemeStore.colors.text;
      settings.secondColorTheme = appThemeStore.colors.second;
    }
    this.setState(Object.assign({}, this.state, settings, { loaded: true }));
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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appThemeStore.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: 60 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Пример отображения</Text>
          <View style={{ minHeight: 420, position: 'relative', padding: 20, paddingRight: 242, borderRadius: 10, borderWidth: 1, borderColor: this.state.secondColorTheme, backgroundColor: this.state.backgroundColorTheme, overflow: 'hidden' }}>
            <Text style={{ fontSize: 24, fontFamily: this.state.fontFamily, color: this.state.textColorTheme, marginBottom: 18 }}>The Little Prince</Text>
            <Text style={{ fontSize: this.state.fontSize, lineHeight: this.state.fontSize * 1.55, fontFamily: this.state.fontFamily, color: this.state.textColorTheme, textAlign: this.previewTextAlign() }}>
              It is only with the heart that one can see rightly; what is essential is invisible to the eye.
            </Text>

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
