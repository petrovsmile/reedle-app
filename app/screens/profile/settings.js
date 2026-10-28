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
      secondColorTheme: appThemeStore.colors.second,
      hideWordTranslationUnderline: false,
      hideTranslationIcons: false,
      hideBookmarkIcons: false,
      hideSentenceVoiceoverIcons: false
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
    settings.hideWordTranslationUnderline = settings.hideWordTranslationUnderline === true;
    settings.hideTranslationIcons = settings.hideTranslationIcons === true;
    settings.hideBookmarkIcons = settings.hideBookmarkIcons === true;
    settings.hideSentenceVoiceoverIcons = settings.hideSentenceVoiceoverIcons === true;
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

  renderPreviewSentence(words, sentenceIndex) {
    return (
      <React.Fragment key={'sentence_' + sentenceIndex}>
        {!this.state.hideSentenceVoiceoverIcons &&
          <View style={{ height: this.state.translate_icon_size, marginTop: 8, marginRight: 8, justifyContent: 'center' }}>
            <AppIcon icon={VolumeIcon} size={this.state.translate_icon_size} color={this.state.textColorTheme} />
          </View>
        }
        {words.map((word, wordIndex) =>
          <View
            key={'word_' + sentenceIndex + '_' + wordIndex}
            style={{
              marginTop: 8,
              marginRight: 8,
              borderBottomWidth: this.state.hideWordTranslationUnderline ? 0 : 2,
              borderBottomColor: this.state.secondColorTheme
            }}>
            <Text style={{ fontSize: this.state.fontSize, lineHeight: this.state.translate_icon_size, fontFamily: this.state.fontFamily, color: this.state.textColorTheme }}>
              {word}
            </Text>
          </View>
        )}
        {!this.state.hideTranslationIcons &&
          <View style={{ height: this.state.translate_icon_size, marginTop: 8, marginRight: 8, justifyContent: 'center' }}>
            <AppIcon icon={EllipsisVerticalIcon} size={this.state.translate_icon_size} color={app_theme_colors.red} />
          </View>
        }
      </React.Fragment>
    );
  }

  renderPreviewParagraph(number, sentences, bookmarked) {
    return (
      <View key={'paragraph_' + number} style={{ marginTop: 8, marginBottom: 16, flexDirection: 'row' }}>
        {!this.state.hideBookmarkIcons &&
          <View style={{ width: 40, paddingRight: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, lineHeight: 24, fontFamily: 'Times', color: bookmarked ? app_theme_colors.red : this.state.secondColorTheme }}>{number}</Text>
            <AppIcon
              icon={BookmarkIcon}
              size={24}
              color={bookmarked ? app_theme_colors.red : this.state.secondColorTheme}
              fill={bookmarked ? app_theme_colors.red : 'none'}
              style={{ marginTop: 8 }}
            />
          </View>
        }
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', paddingLeft: this.state.hideBookmarkIcons ? 16 : 0, justifyContent: this.state.textAlign }}>
          {sentences.map((words, sentenceIndex) => this.renderPreviewSentence(words, number + '_' + sentenceIndex))}
          {!this.state.hideTranslationIcons &&
            <View style={{ height: this.state.translate_icon_size, marginTop: 8, marginRight: 8, justifyContent: 'center' }}>
              <AppIcon icon={EllipsisIcon} size={this.state.translate_icon_size} color={app_theme_colors.red} />
            </View>
          }
        </View>
      </View>
    );
  }

  render() {
    if (!this.state.loaded) return <ActivityIndicator style={{ flex: 1 }} color={appThemeStore.colors.mutedText} />;
    var previewParagraphs = [
      [
        ['It', 'is', 'only', 'with', 'the', 'heart', 'that', 'one', 'can', 'see', 'rightly;', 'what', 'is', 'essential', 'is', 'invisible', 'to', 'the', 'eye.']
      ],
      [
        ['The', 'morning', 'was', 'quiet,', 'and', 'a', 'pale', 'golden', 'light', 'stretched', 'across', 'the', 'fields.'],
        ['A', 'small', 'bird', 'landed', 'nearby', 'and', 'listened', 'to', 'the', 'wind.']
      ],
      [
        ['He', 'opened', 'the', 'old', 'book', 'and', 'continued', 'reading.'],
        ['Every', 'page', 'carried', 'him', 'farther', 'from', 'the', 'room', 'and', 'closer', 'to', 'a', 'new', 'adventure.']
      ],
      [
        ['When', 'evening', 'came,', 'the', 'stars', 'appeared', 'one', 'by', 'one.'],
        ['Their', 'soft', 'light', 'reminded', 'him', 'that', 'even', 'a', 'long', 'journey', 'begins', 'with', 'a', 'single', 'step.']
      ],
      [
        ['The', 'road', 'continued', 'beyond', 'the', 'hill,', 'turning', 'gently', 'toward', 'the', 'distant', 'town.'],
        ['He', 'smiled', 'and', 'walked', 'on', 'without', 'looking', 'back.']
      ]
    ];
    return (
      <AppSafeAreaView style={{ backgroundColor: appThemeStore.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
          <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Пример отображения в ридере</Text>
            <View style={{ minHeight: 624, position: 'relative', paddingVertical: 16, paddingRight: 16, borderRadius: 8, borderWidth: 1, borderColor: this.state.secondColorTheme, backgroundColor: this.state.backgroundColorTheme, overflow: 'hidden' }}>
              <Text style={{ marginTop: 8, marginBottom: 8, paddingLeft: 40, fontSize: this.state.fontSize, lineHeight: this.state.translate_icon_size, fontFamily: this.state.fontFamily, color: this.state.textColorTheme }}>
                The Little Prince
              </Text>
              {this.renderPreviewParagraph(12, previewParagraphs[0], true)}
              {this.renderPreviewParagraph(13, previewParagraphs[1], false)}
              {this.renderPreviewParagraph(14, previewParagraphs[2], false)}
              {this.renderPreviewParagraph(15, previewParagraphs[3], false)}
              {this.renderPreviewParagraph(16, previewParagraphs[4], false)}

              <View style={{ position: 'absolute', right: 8, top: 8, width: 216, zIndex: 5 }}>
                <ReaderSettingsPanel
                  {...this.state}
                  changeFontSize={(type) => this.changeFontSize(type)}
                  textAlignChange={() => this.textAlignChange()}
                  changeColorTheme={(background, text, second) => this.changeColorTheme(background, text, second)}
                  chanageFontFamily={(fontFamily) => this.saveSettings({ fontFamily: fontFamily })}
                  changeVisibilitySetting={(settingName, value) => this.saveSettings({ [settingName]: value === true })}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </AppSafeAreaView>
    );
  }
}
