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
      var response = await new Request('/api/v2/target_version', {}, { do_not_show_error: true }).get();

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
    if (!this.current_version || !this.target_version) return true;
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

        <AppSafeAreaView style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }} onPress={() => this.close()}>
          <TouchableOpacity activeOpacity={1} onPress={() => { }} style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 32, borderRadius: 16, backgroundColor: appThemeStore.colors.surface, padding: 16 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Обновите приложение</Text>

              <View style={{ marginTop: 16, backgroundColor: '#ddd', borderRadius: 8, padding: 8 }} w>
                <Text style={{ textAlign: 'center', fontSize: 14 }}>
                  {this.current_version} -> {this.target_version}
                </Text>
              </View>


              <Text style={{ marginTop: 16 }}>
                Просим обновить приложение, чтобы иметь доступ ко всем нововведениям.
              </Text>

              <Text style={{ marginTop: 16 }}>
                Обратите внимание, что если приложение не обновлять - это может привести к ошибкам.
              </Text>

              {Platform.OS === 'ios' &&
                <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/ru/app/read-en/id1562732797")} style={{ marginTop: 16, backgroundColor: app_theme_colors.success, height: 40, borderRadius: 8 }}>
                  <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>App Store</Text>
                </TouchableOpacity>
              }

              {Platform.OS === 'android' &&
                <React.Fragment>
                  <TouchableOpacity onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.read_en")} style={{ marginTop: 16, backgroundColor: app_theme_colors.success, height: 40, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Google Play</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL("https://apps.rustore.ru/app/com.read_en")} style={{ marginTop: 16, backgroundColor: app_theme_colors.success, height: 40, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>RuStore</Text>
                  </TouchableOpacity>
                </React.Fragment>
              }

              <TouchableOpacity onPress={() => this.close()} style={{ marginTop: 16, backgroundColor: appThemeStore.colors.backgroundLight, height: 40, borderRadius: 8 }}>
                <Text style={{ color: appThemeStore.colors.text, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Обновить позже</Text>
              </TouchableOpacity>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
        </AppSafeAreaView>

      </Modal>
    )
  }
});
