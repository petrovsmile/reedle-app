class Show extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      percent: 0,
      book: false,
      have_file: false
    };
  }

  async componentDidMount() {
    homeStore.setOpenProperty(false);

    var initialColor = this.props.stack.route.params.color || '#f05458';

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      this.previousBodyBackgroundColor = document.body.style.backgroundColor;
      document.body.style.backgroundColor = initialColor;
      this.unsubscribeBodyFocus = this.props.stack.navigation.addListener('focus', () => {
        document.body.style.backgroundColor = this.state.book.color || initialColor;
      });
      this.unsubscribeBodyBlur = this.props.stack.navigation.addListener('blur', () => {
        document.body.style.backgroundColor = this.previousBodyBackgroundColor || '#fff';
      });
    }

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await Promise.all(
      books.map(async (book) => {
        if (book.id == this.props.stack.route.params.book_id) {
          var have_file = await new Storage().get('have_file_' + book.id, 'false');

          AppMetrica.reportEvent('openDetail', {
            book_name: book.name
          });
          
          this.setState({
            book: book,
            have_file: have_file == 'true'
          });
          this.props.stack.navigation.setOptions({
            title: book.name_en,
            headerStyle: {
              backgroundColor: book.color,
              borderColor: 'transparent',
              shadowColor: 'transparent'
            }
          });
          if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.body.style.backgroundColor = book.color;
          }
        }
      })
    )
  }

  componentWillUnmount() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (this.unsubscribeBodyFocus) this.unsubscribeBodyFocus();
      if (this.unsubscribeBodyBlur) this.unsubscribeBodyBlur();
      document.body.style.backgroundColor = this.previousBodyBackgroundColor || '#fff';
    }
  }

  openBook(book_id) {
    this.props.stack.navigation.navigate('reader', {
      book_id: book_id
    });
  }

  set_have_file() {
    this.setState({
      have_file: true
    });
  }

  render() {

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: this.state.book.color || this.props.stack.route.params.color || '#f05458' }}>
        <TargetVersion />
        <StatusBar barStyle="light-content" />

        {this.state.book == false &&
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#aaa" />
        }

        {this.state.book != false &&
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly' }}>

            <View>
              <Text style={{ marginBottom: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.author}</Text>
              <Text style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 45, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name_en}</Text>
              <Text style={{ marginTop: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name}</Text>
            </View>

            <View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginRight: 15 }}>
                    <AppIcon icon={BookOpenIcon} size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={{ lineHeight: 20, fontSize: 12, color: '#FFF' }}>{this.props.root.state.books_percents[this.props.stack.route.params.book_id]}%</Text>
                  </View>
                </View>

                <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden', marginRight: 15 }}>
                  {this.props.root.state.has_internet == true || this.state.have_file == true ? (
                    <TouchableOpacity onPress={() => this.openBook(this.state.book.id)}>
                      <AppIcon icon={ChevronRightIcon} size={28} color='#000' style={{ margin: 16 }} />
                    </TouchableOpacity>
                  ) : (
                    <AppIcon icon={WifiOffIcon} size={28} color="#aaa" style={{ margin: 16 }} />
                  )}
                </View>

                {(this.props.root.state.has_subscription) && this.state.have_file == false &&
                  <View style={{ marginRight: 15 }}>
                    {this.props.root.state.has_subscription == true ? (
                      <React.Fragment>
                        {this.props.root.state.has_internet == true &&
                          <ButtonRead
                            set_have_file={() => this.set_have_file()}
                            book_id={this.state.book.id} color={this.state.book.color}
                            book_name={this.state.book.name}
                            book_name_en={this.state.book.name_en}
                            navigation={this.props.stack.navigation}
                          />
                        }
                      </React.Fragment>
                    ) : (
                      <View style={{ opacity: 0.3, height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
                        <AppIcon icon={DownloadIcon} size={28} color={app_theme_colors.red} style={{ margin: 16 }} />
                      </View>
                    )}
                  </View>
                }
              </View>


            </View>

            {this.state.have_file == false && this.props.root.state.has_internet == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>
                  Вы можете скачать книгу,{"\n"} чтобы читать ее без интернета
                </Text>

                {this.props.root.state.has_subscription == false &&
                  <Text style={{ marginTop: 15, color: '#FFF', textAlign: 'center' }}>
                    Функция скачивания доступна{"\n"} только при наличии подписки
                  </Text>
                }
              </View>
            }

            {this.state.have_file == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Книга скачана.</Text>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Вы можете читать ее без интернета</Text>
              </View>
            }
          </View>
        }
      </SafeAreaView>
    );

  }
};
