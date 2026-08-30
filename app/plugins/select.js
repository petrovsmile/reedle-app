class Select extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false };
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

  render() {
    if (Platform.OS == 'web') return this.renderWeb();

    var selectedOption = this.selectedOption();

    return (
      <React.Fragment>
        <TouchableOpacity
          onPress={() => this.setState({ visible: true })}
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

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.visible}
          onRequestClose={() => this.setState({ visible: false })}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => this.setState({ visible: false })}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ width: '100%', maxWidth: 320, padding: 8, borderRadius: 10, backgroundColor: appThemeStore.colors.surface }}>
                {this.props.options.map(option => {
                  var isSelected = option.value == this.props.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => this.select(option.value)}
                      style={{ minHeight: 44, paddingHorizontal: 12, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isSelected ? appThemeStore.colors.backgroundLight : 'transparent' }}>
                      <Text style={{ color: appThemeStore.colors.text, fontSize: 15 }}>{option.title}</Text>
                      {isSelected && <Text style={{ color: app_theme_colors.red, fontSize: 16 }}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>
      </React.Fragment>
    );
  }
}
