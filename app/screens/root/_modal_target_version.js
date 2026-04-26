const TargetVersion = observer(class TargetVersion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    }
    this.current_version = '1';
    this.target_version = null;
  }

  async componentDidMount() {
    if (appStore.has_internet == true) {
      var response = await new Request('/api/v1/target_version', {}, { do_not_show_error: true }).get();
      if (response != false) {
        if (Platform.OS === 'ios') {
          this.current_version = CURRENT_IOS_VERSION;
          this.target_version = response.ios_version;
        }
        if (Platform.OS === 'android') {
          this.current_version = CURRENT_ANDROID_VERSION;
          this.target_version = response.android_version;
        }

        if (this.compareVersions() == false) {
          this.setState({
            visible: true
          });
        }
      }
    }
  }

  compareVersions() {
    var current = parseInt(this.current_version.split('.').join(''));
    var target = parseInt(this.target_version.split('.').join(''));

    var check = true;

    if (target > current) {
      check = false;
    }

    return check;
  }

  close() {
    this.setState({
      visible: false
    });
  }

  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.state.visible}>

        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: '#FFF', padding: 15 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Обновите приложение</Text>

              <View style={{ marginTop: 15, backgroundColor: '#ddd', borderRadius: 5, padding: 5 }} w>
                <Text style={{ textAlign: 'center', fontSize: 14 }}>
                  {this.current_version} -> {this.target_version}
                </Text>
              </View>


              <Text style={{ marginTop: 15 }}>
                Просим обновить приложение, чтобы иметь доступ ко всем нововведениям.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Обратите внимание, что если приложение не обновлять - это может привести к ошибкам.
              </Text>

              {Platform.OS === 'ios' &&
                <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/ru/app/read-en/id1562732797")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                  <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>App Store</Text>
                </TouchableOpacity>
              }

              {Platform.OS === 'android' &&
                <React.Fragment>
                  <TouchableOpacity onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Google Play</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL("https://apps.rustore.ru/app/com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>RuStore</Text>
                  </TouchableOpacity>
                </React.Fragment>
              }

              <TouchableOpacity onPress={() => this.close()} style={{ marginTop: 15, backgroundColor: '#ddd', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#444', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Обновить позже</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

      </Modal>
    )
  }
});