class ModalFastLearning extends React.Component {
  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => this.props.close()}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { }}
            style={[{ flexDirection: 'row', justifyContent: 'center' }, Platform.OS === 'web' ? { width: '100%', paddingHorizontal: 32 } : null]}>
            <View style={[{ borderRadius: 16, backgroundColor: appThemeStore.colors.surface, padding: 16 }, Platform.OS === 'web' ? { width: '100%', maxWidth: 504 } : { margin: 32 }]}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Быстрое обучение</Text>

              <Text style={{ marginTop: 16 }}>
                Нажмите на любое подчеркнутое слово, чтобы посмотреть его перевод.
              </Text>

              <Text style={{ marginTop: 16 }}>А также:</Text>

              <View style={{ flexDirection: 'row', marginTop: 8 }}>

                <AppIcon icon={EllipsisVerticalIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
                <Text style={{ lineHeight: 20, marginLeft: 8 }}>
                  - перевод предложения.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <AppIcon icon={EllipsisIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
                <Text style={{ lineHeight: 20, marginLeft: 8 }}>
                  - перевод абзаца.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>

                <View style={{ width: 24, height: 24 }}>
                  <Text style={{ textAlign: 'center', lineHeight: 20, fontSize: 18, fontFamily: 'Times', color: app_theme_colors.red }}>15</Text>
                </View>
                <Text style={{ lineHeight: 20, marginLeft: 8 }}>
                  - цифру в левой части, чтобы отметить где вы остановились.
                </Text>
              </View>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 16, backgroundColor: app_theme_colors.red, height: 40, borderRadius: 8 }}>
                <Text style={{ color: app_theme_colors.inverseText, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>

      </Modal>
    )
  }
}
