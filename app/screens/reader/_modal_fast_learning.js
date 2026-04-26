class ModalFastLearning extends React.Component {
  render(){
    return(
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: '#FFF', padding: 15 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Быстрое обучение</Text>

              <Text style={{ marginTop: 15 }}>
                Нажмите на любое подчеркнутое слово, чтобы посмотреть его перевод.
              </Text>

              <Text style={{ marginTop: 15 }}>А также:</Text>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>

                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('./app/images/reader/sentence-translate.png')}
                />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод предложения.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('./app/images/reader/paragraph-translate.png')}
                />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод абзаца.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>

                <View style={{ width: 20, height: 20 }}>
                  <Text style={{ textAlign: 'center', lineHeight: 20, fontSize: 18, fontFamily: 'Times', color: '#f05458' }}>15</Text>
                </View>
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - цифру в левой части, чтобы отметить где вы остановились.
                </Text>
              </View>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

      </Modal>
    )
  }
}