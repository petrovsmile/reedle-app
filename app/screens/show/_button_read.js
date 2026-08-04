const ButtonRead = observer(class ButtonRead extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      have_file: false,
      button_loader: true,
    };
  }

  async componentDidMount() {
    var have_file = await AsyncStorage.getItem('have_file_' + this.props.book_id);
    this.setState({
      have_file: have_file == 'true',
      button_loader: false,
    });
  }

  componentDidUpdate() {
    if (!this.state.have_file && downloadStore.isCompleted(this.props.book_id)) {
      this.setState({ have_file: true });
      this.props.set_have_file();
    }
  }

  startDownload() {
    downloadStore.start({
      id: this.props.book_id,
      name: this.props.book_name,
      name_en: this.props.book_name_en,
      color: this.props.color,
    });
  }

  renderProgress(download) {
    var progress = download.progress || 0;
    return (
      <View style={{ position: 'absolute', left: -15, top: -15 }}>
        <AnimatedCircularProgress
          size={90}
          width={20}
          fill={progress}
          tintColor={this.props.color}
          backgroundColor="#FFF"
          rotation={0}
          duration={0}>
          {() => progress === 0 ? (
            <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
          ) : (
            <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 12 }}>{progress.toFixed(1)}%</Text>
          )}
        </AnimatedCircularProgress>
      </View>
    );
  }

  render() {
    var download = downloadStore.get(this.props.book_id);
    var downloading = download && download.status !== 'completed' && download.status !== 'error';
    var haveFile = this.state.have_file || downloadStore.isCompleted(this.props.book_id);

    return (
      <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
        {this.state.button_loader ? (
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        ) : downloading ? (
          this.renderProgress(download)
        ) : haveFile ? (
          <Image
            style={{ height: 20, width: 20, margin: 20 }}
            source={require('./app/images/books/arrow-button-read.png')}
          />
        ) : !appStore.has_internet ? (
          <Image
            style={{ height: 30, width: 30, margin: 15, opacity: 0.5 }}
            source={require('./app/images/books/no-connect.png')}
          />
        ) : (
          <TouchableOpacity onPress={() => this.startDownload()}>
            <Image
              style={{ height: 30, width: 30, margin: 15 }}
              source={require('./app/images/books/download.png')}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
});
