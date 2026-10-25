class ReaderSettingsPanel extends React.Component {
  renderVisibilitySetting(title, settingName) {
    var selected = this.props[settingName] === true;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => this.props.changeVisibilitySetting(settingName, !selected)}
        style={{ minHeight: 48, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: selected ? app_theme_colors.red : this.props.secondColorTheme, backgroundColor: selected ? app_theme_colors.red : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <AppIcon icon={CheckIcon} size={16} color="#ffffff" />}
        </View>
        <Text style={{ flex: 1, paddingLeft: 8, fontSize: 14, lineHeight: 18, color: this.props.textColorTheme }}>{title}</Text>
      </TouchableOpacity>
    );
  }

  renderColorButton(backgroundColor, textColor, secondColor) {
    var selected = this.props.backgroundColorTheme == backgroundColor;
    return (
      <TouchableOpacity
        onPress={() => this.props.changeColorTheme(backgroundColor, textColor, secondColor)}
        style={{ width: 32, height: 32, marginHorizontal: 4, borderWidth: 1, borderColor: secondColor, borderRadius: 24, backgroundColor: backgroundColor, alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        {selected && <AppIcon icon={CheckIcon} size={16} color={textColor} />}
      </TouchableOpacity>
    );
  }

  renderFontButton(title, fontFamily) {
    var selected = this.props.fontFamily == fontFamily;
    return (
      <TouchableOpacity
        onPress={() => this.props.chanageFontFamily(fontFamily)}
        style={{ paddingVertical: 8, paddingHorizontal: 8, marginBottom: 8, borderRadius: 8, backgroundColor: selected ? appThemeStore.colors.backgroundLight : 'transparent' }}>
        <Text style={{ fontSize: 16, fontFamily: fontFamily, color: appThemeStore.colors.text }}>{title}</Text>
      </TouchableOpacity>
    );
  }

  render() {
    var borderColor = this.props.secondColorTheme;
    return (
      <View style={{ width: 210, alignSelf: 'center', borderRadius: 8, borderWidth: 1, borderColor: borderColor, backgroundColor: this.props.backgroundColorTheme, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', borderBottomColor: borderColor, borderBottomWidth: 1 }}>
          <View style={{ flex: 2, height: 56, flexDirection: 'row', position: 'relative', borderRightWidth: 1, borderRightColor: borderColor }}>
            <TouchableOpacity
              disabled={this.props.fontSize <= 14}
              onPress={() => this.props.changeFontSize('less')}
              style={{ flex: 1, opacity: this.props.fontSize <= 14 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: borderColor, backgroundColor: this.props.fontSize <= 14 ? appThemeStore.colors.backgroundLight : 'transparent' }}>
              <AppIcon icon={MinusIcon} size={24} color={appThemeStore.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={this.props.fontSize >= 24}
              onPress={() => this.props.changeFontSize('more')}
              style={{ flex: 1, opacity: this.props.fontSize >= 24 ? 0.3 : 1, alignItems: 'center', justifyContent: 'center', backgroundColor: this.props.fontSize >= 24 ? appThemeStore.colors.backgroundLight : 'transparent' }}>
              <AppIcon icon={PlusIcon} size={24} color={appThemeStore.colors.text} />
            </TouchableOpacity>
            <View pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 16, marginLeft: -16, width: 32, height: 24, zIndex: 2, elevation: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: this.props.backgroundColorTheme }}>
              <Text style={{ width: 32, fontSize: 14, lineHeight: 24, textAlign: 'center', color: this.props.textColorTheme }}>{this.props.fontSize}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => this.props.textAlignChange()} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
            {this.props.textAlign == 'flex-start' && <AppIcon icon={AlignLeftIcon} size={24} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'flex-end' && <AppIcon icon={AlignRightIcon} size={24} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'center' && <AppIcon icon={AlignCenterIcon} size={24} width={20} height={20} color={appThemeStore.colors.text} />}
            {this.props.textAlign == 'space-evenly' && <AppIcon icon={AlignJustifyIcon} size={24} width={20} height={20} color={appThemeStore.colors.text} />}
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', borderBottomColor: borderColor, borderBottomWidth: 1, paddingVertical: 8 }}>
          {this.renderColorButton('#ffffff', '#000000', '#dddddd')}
          {this.renderColorButton('#eeeeee', '#000000', '#cccccc')}
          {this.renderColorButton('#f8f4e9', '#000000', '#d4c8a0')}
          {this.renderColorButton('#292c2c', '#ffffff', '#5a5d5d')}
          {this.renderColorButton('#000000', '#ffffff', '#444444')}
        </View>

        <View style={{ padding: 8 }}>
          <Text style={{ fontSize: 16, marginBottom: 8, color: this.props.textColorTheme }}>Шрифт текста:</Text>
          {this.renderFontButton('Libre Baskerville', 'LibreBaskerville-Regular')}
          {this.renderFontButton('Times', 'Times')}
          {this.renderFontButton('Arial', 'Arial')}
          {this.renderFontButton('Verdana', 'Verdana')}
        </View>

        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderTopWidth: 1, borderTopColor: borderColor }}>
          {this.renderVisibilitySetting('Скрыть подчеркивание слов с переводом', 'hideWordTranslationUnderline')}
          {this.renderVisibilitySetting('Скрыть иконки перевода предложений и абзацев', 'hideTranslationIcons')}
          {this.renderVisibilitySetting('Скрыть иконки закладок', 'hideBookmarkIcons')}
          {this.renderVisibilitySetting('Скрыть иконки озвучки предложений', 'hideSentenceVoiceoverIcons')}
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
        <AppSafeAreaView style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1, paddingVertical: 16, alignItems: 'flex-end' }}
            onPress={() => this.props.closeSettings && this.props.closeSettings()}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <ScrollView
                style={{ width: 226, maxHeight: '100%' }}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                showsVerticalScrollIndicator={true}>
                <ReaderSettingsPanel {...this.props} />
              </ScrollView>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </AppSafeAreaView>
      </Modal>
    );
  }
}
