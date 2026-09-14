const Show = observer(class Show extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      percent: 0,
      book: false,
      have_file: false,
      context_menu_visible: false
    };
  }

  async componentDidMount() {
    homeStore.setOpenProperty(false);

    var initialColor = this.props.stack.route.params.color || '#f05458';

    this.props.stack.navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => this.setState({ context_menu_visible: !this.state.context_menu_visible })}
          style={{ width: 48, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
          accessibilityLabel="Действия с книгой">
          <AppIcon icon={EllipsisIcon} size={26} color="#FFF" />
        </TouchableOpacity>
      )
    });

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      this.previousBodyBackgroundColor = document.body.style.backgroundColor;
      document.body.dataset.reedleBackgroundOwner = 'book';
      document.body.style.backgroundColor = initialColor;
      this.unsubscribeBodyFocus = this.props.stack.navigation.addListener('focus', () => {
        document.body.dataset.reedleBackgroundOwner = 'book';
        document.body.style.backgroundColor = this.state.book.color || initialColor;
      });
      this.unsubscribeBodyBlur = this.props.stack.navigation.addListener('blur', () => {
        delete document.body.dataset.reedleBackgroundOwner;
        document.body.style.backgroundColor = appThemeStore.colors.background;
      });
    }

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await Promise.all(
      books.map(async (book) => {
        if (book.id == this.props.stack.route.params.book_id) {
          var have_file = await downloadStore.validateCompleted(book.id);
          downloadStore.setCompleted(book.id, have_file);

          AppMetrica.reportEvent('openDetail', {
            book_name: book.name
          });
          
          this.setState({
            book: book,
            have_file: have_file
          });
          this.props.stack.navigation.setOptions({
            headerTitle: '',
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
      delete document.body.dataset.reedleBackgroundOwner;
      document.body.style.backgroundColor = appThemeStore.colors.background;
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

  requestDownload() {
    AppAlert.alert(
      'Скачивание доступно с PRO',
      'Оформите PRO-доступ, чтобы скачивать книги и читать их без интернета.',
      [
        {
          text: 'Купить PRO-доступ',
          onPress: () => this.props.stack.navigation.navigate('subscription', { backTitle: this.state.book.name_en })
        },
        { text: 'Отмена', style: 'cancel' }
      ]
    );
  }

  async markAsRead() {
    var bookId = this.props.stack.route.params.book_id;
    await new Storage().set('percent_' + bookId, '100');
    var percents = Object.assign({}, this.props.root.state.books_percents, { [bookId]: 100 });
    this.props.root.setState({ books_percents: percents });
    appStore.setBooksPercents(Object.assign({}, appStore.books_percents, { [bookId]: 100 }));
    this.setState({ percent: 100, context_menu_visible: false });
  }

  confirmDeleteFromMemory() {
    this.setState({ context_menu_visible: false }, () => {
      AppAlert.confirm(
        'Вы уверены?',
        'Скачанная книга будет удалена с устройства.',
        () => this.deleteFromMemory(),
        'Удалить'
      );
    });
  }

  async deleteFromMemory() {
    var bookId = this.props.stack.route.params.book_id;
    await downloadStore.removeBooks([bookId]);
    this.setState({ have_file: false });
  }

  render() {

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: this.state.book.color || this.props.stack.route.params.color || '#f05458' }}>
        <TargetVersion />
        <StatusBar barStyle="light-content" />

        {this.state.context_menu_visible &&
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => this.setState({ context_menu_visible: false })}
            style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 20 }}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={{ position: 'absolute', top: 8, right: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: appThemeStore.colors.surface, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 }}>
                <TouchableOpacity onPress={() => this.markAsRead()} style={{ minHeight: 34, paddingHorizontal: 16, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: appThemeStore.colors.text }}>Отметить прочитанной</Text>
                </TouchableOpacity>
                {this.state.have_file &&
                  <TouchableOpacity onPress={() => this.confirmDeleteFromMemory()} style={{ minHeight: 34, paddingHorizontal: 16, justifyContent: 'center', borderTopWidth: 1, borderTopColor: appThemeStore.colors.border }}>
                    <Text style={{ fontSize: 14, color: app_theme_colors.red }}>Удалить из памяти</Text>
                  </TouchableOpacity>
                }
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        }

        {this.state.book == false &&
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFF" />
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
                      <AppIcon icon={ChevronRightIcon} size={28} color="#000" style={{ margin: 16 }} />
                    </TouchableOpacity>
                  ) : (
                    <AppIcon icon={WifiOffIcon} size={28} color="#aaa" style={{ margin: 16 }} />
                  )}
                </View>

                {this.state.have_file == false &&
                  <View style={{ marginRight: 15 }}>
                    {this.props.root.state.has_subscription == true ? (
                      <ButtonRead
                        set_have_file={() => this.set_have_file()}
                        book_id={this.state.book.id} color={this.state.book.color}
                        book_name={this.state.book.name}
                        book_name_en={this.state.book.name_en}
                        navigation={this.props.stack.navigation}
                      />
                    ) : (
                      <TouchableOpacity
                        onPress={() => this.requestDownload()}
                        style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
                        <AppIcon icon={ArrowDownToLineIcon} size={28} color="#000" style={{ margin: 16 }} />
                      </TouchableOpacity>
                    )}
                  </View>
                }
              </View>


            </View>

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
});
