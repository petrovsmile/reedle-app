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
        <AppSafeAreaView style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => this.close()}
          style={{ flex: 1, position: 'relative', zIndex: 2147483647, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={{ width: '100%', maxWidth: 424, padding: 24, borderRadius: 8, backgroundColor: appThemeStore.colors.surface }}>
              {this.state.title ? <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: appThemeStore.colors.text }}>{this.state.title}</Text> : null}
              {this.state.message ? <Text style={{ marginTop: this.state.title ? 16 : 0, fontSize: 16, lineHeight: 24, textAlign: 'center', color: appThemeStore.colors.mutedText }}>{this.state.message}</Text> : null}
              <View style={{ flexDirection: 'column', marginTop: 24 }}>
                {this.state.buttons.map((button, index) => {
                  var isCancel = button.style == 'cancel';
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => this.close(button)}
                      style={{ width: '100%', minHeight: 48, marginTop: index == 0 ? 0 : 8, borderWidth: isCancel ? 1 : 0, borderColor: appThemeStore.colors.border, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: isCancel ? appThemeStore.colors.backgroundLight : app_theme_colors.red }}>
                      <Text style={{ color: isCancel ? appThemeStore.colors.text : '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>{button.text || 'Понятно'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
        </AppSafeAreaView>
      </Modal>
    );
  }
}
