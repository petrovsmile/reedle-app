
class ButtonRead extends React.Component {

  _isMounted = false;

  constructor(props) {

    super(props);

    this.state = {
      have_file: false,
      show_load_status: false,
      progress: 2,
      progress_text: '0',
      have_internet: true,
      button_loader: true,
    }
  }

  async componentDidMount() {

    this._isMounted = true;
    
    var have_file = await AsyncStorage.getItem('have_file_' + this.props.book_id);

    this.setState({
      have_file: have_file == 'true',
      button_loader: false,
    });

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        have_internet: state.isConnected,
      });
    });


  }

  async loadFiles(ar_files, index, count, book_id) {

    if (this._isMounted == true) {
      var path = ar_files[index]; 

      var response = await axios.get("https://reedle.ru" + path, { params: {} });

      var response = await new Request(path, {}).get();
      var file_data = JSON.stringify(response);

      path = path.replace('/result', '');
      
      await RNFS.writeFile(file_root + path, file_data, 'utf8');
      
      index++;

      var progress = (index / count) * 100;
      if (progress < 2) {
        progress = 2;
      }

      

      await this.setState({
        progress: progress,
        progress_text: progress.toFixed(0),
      });

      if (index < count) {
        this.loadFiles(ar_files, index, count, book_id);
      } else {

        YandexMetrica.sendEvent('loader',{status: 'finish'});
        YandexMetrica.sendEvent('loader',{progress: 100});

        await this.setState({
          progress: 100,
          have_file: true,
          show_load_status: false,
        });

        await AsyncStorage.setItem('have_file_' + book_id, 'true');

        this.openBook(book_id);

      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this._unsubNet) {
      this._unsubNet();
    }
  }

  async openBook(book_id) {
    if (this.state.have_file == false) {
      YandexMetrica.sendEvent('loader',{status: 'start'});

      await this.setState({
        show_load_status: true,
      });
      var response = await new Request('/api/v1/books/download_list', { book_id: book_id }).get();
     
      await RNFS.mkdir(file_root + '/books/' + book_id + '/paragraphs/');

      this.setState({
        progress: 2,
      });

      this.loadFiles(response, 0, response.length, book_id);
    } else {
      this.props.set_have_file();
      // this.props.navigation.navigate('Reader', {
      //   book_id: book_id
      // });
    }
  }

  render() {

    return <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
      <React.Fragment>
        {this.state.button_loader == true &&
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        }
        {this.state.button_loader == false &&
          <React.Fragment>
            {this.state.show_load_status == true &&
              <View style={{
                position: 'absolute',
                left: -15,
                top: -15,
              }}>
                <AnimatedCircularProgress
                  size={90}
                  width={20}
                  fill={this.state.progress}
                  tintColor={this.props.color}
                  backgroundColor="#FFF"
                  rotation={0}
                  duration={0}>
                  {
                    (fill) => (
                      <React.Fragment>
                        {this.state.progress_text == '0' &&
                          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
                        }
                        {this.state.progress_text != '0' &&
                          <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>{this.state.progress_text}%</Text>
                        }
                      </React.Fragment>
                    )
                  }
                </AnimatedCircularProgress>
                {this.state.progress_text != '0' &&
                  <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>{this.state.progress_text}%</Text>
                }
              </View>
            }


            {this.state.show_load_status == false &&
              <React.Fragment>

                {this.state.have_file == false &&
                  <React.Fragment>
                    {this.state.have_internet == false &&
                      <Image
                        style={{ height: 30, width: 30, margin: 15, opacity: 0.5 }}
                        source={require('./app/images/books/no-connect.png')}
                      />
                    }
                    {this.state.have_internet == true &&
                      <TouchableOpacity onPress={() => this.openBook(this.props.book_id)}>
                        <Image
                          style={{ height: 30, width: 30, margin: 15 }}
                          source={require('./app/images/books/download.png')}
                        />
                      </TouchableOpacity>
                    }
                  </React.Fragment>
                }
                {this.state.have_file == true &&
                  <TouchableOpacity onPress={() => this.openBook(this.props.book_id)}>
                    <Image
                      style={{ height: 20, width: 20, margin: 20 }}
                      source={require('./app/images/books/arrow-button-read.png')}
                    />
                  </TouchableOpacity>
                }
              </React.Fragment>
            }
          </React.Fragment>
        }
      </React.Fragment>
    </View>
  }
}