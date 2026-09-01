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
