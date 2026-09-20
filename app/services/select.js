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
        style={[{ height: 24, paddingHorizontal: 8, borderWidth: 1, borderRadius: 8, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, this.props.style]}>
        <Text numberOfLines={1} style={{ color: appThemeStore.colors.text, fontSize: 14 }}>{selectedOption.title}</Text>
        <Text style={{ color: appThemeStore.colors.mutedText, fontSize: 14, marginLeft: 8 }}>▼</Text>
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
          <AppSafeAreaView style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => this.setState({ visible: false })}
            style={{ flex: 1, justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={{ paddingBottom: 24, backgroundColor: appThemeStore.colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <View style={{ height: 48, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: appThemeStore.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => this.setState({ visible: false })}>
                    <Text style={{ color: appThemeStore.colors.mutedText, fontSize: 16 }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.select(this.state.pendingValue)}>
                    <Text style={{ color: app_theme_colors.red, fontSize: 16, fontWeight: 'bold' }}>Готово</Text>
                  </TouchableOpacity>
                </View>
                <Picker
                  selectedValue={this.state.pendingValue}
                  onValueChange={(value) => this.setState({ pendingValue: value })}
                  itemStyle={{ color: appThemeStore.colors.text, fontSize: 18 }}>
                  {this.renderItems()}
                </Picker>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
          </AppSafeAreaView>
        </Modal>
      </React.Fragment>
    );
  }

  renderAndroid() {
    return (
      <View style={[{ height: 32, borderWidth: 1, borderRadius: 8, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, justifyContent: 'center', overflow: 'hidden' }, this.props.style]}>
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
