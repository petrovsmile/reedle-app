class ModalNoAd extends React.Component {
  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => this.props.close()}>
          <TouchableOpacity activeOpacity={1} onPress={() => { }} style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 32, borderRadius: 16, backgroundColor: appThemeStore.colors.surface, padding: 16 }}>


              <Text>
                В данный момент рекламный блок для вашего устройства не найден.
              </Text>

              <Text style={{ marginTop: 16 }}>
                Реклама будет показана в следующий раз.
              </Text>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 16, backgroundColor: app_theme_colors.success, height: 40, borderRadius: 8 }}>
                <Text style={{ color: app_theme_colors.inverseText, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>

      </Modal>
    )
  }
}
