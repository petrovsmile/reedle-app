const ModalTranslateSentence = observer(class ModalTranslateSentence extends React.Component {
  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <AppSafeAreaView>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => { }}
              style={{ width: '90%', maxWidth: 704 }}
            >
              <View style={{ backgroundColor: readerStore.backgroundColorTheme, borderRadius: 8, alignItems: "center", width: "100%", overflow: 'hidden', elevation: 5 }}>
                <ScrollView style={{ width: '100%', maxHeight: Dimensions.get('window').height - 300 }}>

                  <TouchableOpacity activeOpacity={1}>
                    {this.props.translate.constructor === Array &&
                      <View style={{ margin: 8 }}>
                        {this.props.translate.map((sentence, index) =>
                          <View key={index} style={{ marginTop: 8, flexDirection: "row" }}>
                            <View style={{ width: 24 }}>
                              <Text style={{ fontSize: 18, fontFamily: 'Times', color: '#bbb' }}>{(index + 1)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: readerStore.textColorTheme }}>{sentence}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    }

                    {this.props.translate.constructor != Array &&
                      <Text style={{ padding: 8, color: readerStore.textColorTheme }}>
                        {this.props.translate}
                      </Text>
                    }
                  </TouchableOpacity>

                </ScrollView>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 8, marginTop: 16, height: 40, backgroundColor: app_theme_colors.red, alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'center', borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>

            </TouchableOpacity>

            {this.props.has_subscription == false &&
              <TranslationAdBanner />
            }
          </View>
        </TouchableOpacity>
        </AppSafeAreaView>

      </Modal>
    )
  }
});
