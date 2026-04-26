class ModalNoAd extends React.Component {
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


              <Text>
                В данный момент рекламный блок для вашего устройства не найден.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Реклама будет показана в следующий раз.
              </Text>

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