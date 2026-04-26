class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      do_not_find: false,
      level: 'all',
      books: [],
      books_filtered: [],
      books_loader: true,
      not_show_read: true,
      sort_new_book: true,
      show_only_loaded: false,
      open_property: false,
    };

    this.search_value = "";
  }

  async componentDidMount() {
    var not_show_read = await new Storage().get('not_show_read', 'false')
    await this.setState({ not_show_read: not_show_read === 'true' });

    var sort_new_book = await new Storage().get('sort_new_book', 'false');
    await this.setState({ sort_new_book: sort_new_book === 'true' });

    var show_only_loaded = await new Storage().get('show_only_loaded', 'false');
    await this.setState({ show_only_loaded: show_only_loaded === 'true' });

    this.getBooks();

    // this.props.stack.navigation.navigate('Reader', {
    //   book_id: 1
    // });
  }

  async getBooks() {
    await this.setState({
      books: [],
      filter_books: [],
    });

    var exists = await RNFS.exists(file_root + '/' + BOOKS_FILENAME);
    if (exists == false) {
      await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, "[]", 'utf8');
    }

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await this.setState({
      books: books,
    });

    var server_books = await new Request('/api/v1/books', {}, { do_not_show_error: true }).get();
    if (server_books == false) {
      this.filter_books();
    } else {
      if (server_books.length != books.length) {
        books = server_books;
        await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(server_books), 'utf8');

        await this.setState({
          books: books,
        });
        this.filter_books();
      } else {
        this.filter_books();
      }
    }
  }

  //Фильтрует по Level, Названиям, Скачиванию
  async filter_books() {
    await this.setState({
      books_filtered: false,
    });

    var result = [];

    for (const i in this.state.books) {
      var book = this.state.books[i];

      if (this.state.level == 'all' || this.state.level == book.level) {

        var check = false;

        //Названия
        if (this.search_value.length == 0) {
          check = true;
        } else {
          var search_array = this.search_value.split(' ').map(name => name.toLowerCase());
          search_array = search_array.filter(word => word.length > 0);

          book.name.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });

          book.author.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });

          book.name_en.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });
        }

        //Скачана книга
        if (check == true) {
          var have_file = await new Storage().get('have_file_' + book.id, 'false');
          book['have_file'] = have_file == 'true';
          if (this.state.show_only_loaded == true) {
            check = book['have_file'];
          }

          var percent = await new Storage().get('percent_' + book.id, 0);
          book['percent'] = percent;

          if (percent == 100) {
            if (this.state.not_show_read == true) {
              check = false;
            }
          }
        }


        if (check == true) {
          result.push(book);
        }
      }
    }

    percents = {}
    result.forEach(function (book) {
      percents[book.id] = book.percent;
    });

    await this.props.root.setState({
      books_percents: percents
    });

    this.setState({
      books_filtered: result,
      do_not_find: result.length == 0,
    }, function () {
      this.showReview();
    });
  }

  async showReview() {

    var review_showed = await new Storage().get('review_showed', 'false');

    if (review_showed == 'false') {
      var time_show_review = await new Storage().get('time_show_review');

      if (time_show_review == undefined) {
        time_show_review = moment();
        await new Storage().set('time_show_review', moment().format());
      } else {
        time_show_review = moment(time_show_review);
      }

      var now_time = moment();

      var range_time = (now_time - time_show_review) / 1000 / 60;

      if (range_time > 7200) { //7200
        YandexMetrica.sendEvent('reviewShow', { show: true });
        await new Storage().set('review_showed', 'true');
        StoreReview.requestReview();
      }
    }
  }

  goToSite() {
    Linking.openURL("https://reedle.ru");
  }

  onChangeText(value) {
    this.search_value = value;
    this.filter_books();
  }

  setLevel(level) {

    YandexMetrica.sendEvent('setLevel', { level: level });

    this.setState({
      level: level,
    }, function () {
      this.filter_books();
    });
  }
  openProperty() {

    YandexMetrica.sendEvent('openProperty', { show: !this.state.open_property });

    this.setState({
      open_property: !this.state.open_property,
    });
  }

  setPropertyShowRead() {

    YandexMetrica.sendEvent('notShowRead', { value: !this.state.not_show_read });

    AsyncStorage.setItem('not_show_read', (!this.state.not_show_read).toString()).then(() => {
      this.setState({
        not_show_read: !this.state.not_show_read,
      }, () => {
        this.filter_books();
      });
    });


  }
  setPropertySortNewBook() {

    YandexMetrica.sendEvent('sortNewBook', { value: !this.state.sort_new_book });

    AsyncStorage.setItem('sort_new_book', (!this.state.sort_new_book).toString()).then(() => {
      this.setState({
        sort_new_book: !this.state.sort_new_book,
      }, () => {
        this.filter_books();
      });
    });
  }

  setPropertyShowOnlyLoaded() {

    YandexMetrica.sendEvent('showOnlyLoaded', { value: !this.state.show_only_loaded });

    AsyncStorage.setItem('show_only_loaded', (!this.state.show_only_loaded).toString()).then(() => {
      this.setState({
        show_only_loaded: !this.state.show_only_loaded,
      }, () => {
        this.filter_books();
      });
    });
  }

  render() {

    const readBook = (rowMap, rowKey) => {
      if (rowMap[rowKey.id]) {
        rowMap[rowKey.id].closeRow();
      }
      AsyncStorage.setItem('percent_' + rowKey.id, '100').then(() => {
        this.filter_books();
      });
    };

    const deleteBook = (rowMap, rowKey) => {
      if (rowMap[rowKey.id]) {
        rowMap[rowKey.id].closeRow();
      }
      AsyncStorage.setItem('have_file_' + rowKey.id, '').then(() => {
        RNFS.unlink(file_root + '/books/' + rowKey.id + '/').then(() => {
          this.filter_books();
        });
      });
    };

    return (
      <SafeAreaView style={applicationStyles.save_area_view}>
        <View style={homeStyles.header}>

          <View style={homeStyles.header_empty_block} />

          <View style={homeStyles.logo}>
            <Text style={homeStyles.logo_text}>Reedle</Text>
            <Text style={homeStyles.logo_dot}>.</Text>
          </View>

          {(this.props.root.state.has_subscription == false) ? (
            <TouchableOpacity onPress={() => this.props.tabs.navigation.navigate('Subscription')}>
              <Image style={{ width: 30, height: 30, marginTop: 2.5 }} source={require('./app/images/header/ads.jpg')} />
            </TouchableOpacity>
          ) : (
            <View style={homeStyles.header_empty_block}></View>
          )}
        </View>

        <View style={homeStyles.search}>
          <Image
            style={homeStyles.search_image}
            resizeMode={'contain'}
            source={require('./app/images/home/search.png')}
          />
          <TextInput
            style={homeStyles.search_input}
            onChangeText={(value) => this.onChangeText(value)}
            placeholder={"Поиск"}
            clearButtonMode="always"
          />
        </View>

        <View style={homeStyles.level_selector}>
          <View style={homeStyles.level_selector_wrap}>
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="Все" color="#aaa" level="all" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A1" color="#89c053" level="1" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A2" color="#5e9cea" level="2" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B1" color="#f5b945" level="3" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B2" color="#fb836f" level="4" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="C1" color="#fe4444" level="5" current_level={this.state.level} />


            <TouchableOpacity onPress={() => this.openProperty()}>
              <View style={{ backgroundColor: '#ddd', borderRadius: 7, marginLeft: 3 }}>
                {this.state.open_property == false &&
                  <Image
                    style={homeStyles.settings_image}
                    source={require('./app/images/home/settings.png')}
                  />
                }
                {this.state.open_property == true &&
                  <Image
                    style={homeStyles.settings_image}
                    source={require('./app/images/home/settings-close.png')}
                  />
                }
              </View>
            </TouchableOpacity>
          </View>
          {this.state.open_property == true &&
            <View style={homeStyles.properties}>
              <View style={homeStyles.properties_point}>

                <Text style={homeStyles.properties_point_text}>Не показывать прочитанные книги</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertyShowRead()}
                  value={this.state.not_show_read}
                />

              </View>


              <View style={homeStyles.properties_point}>

                <Text style={homeStyles.properties_point_text}>Ставить вперед открытые книги</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertySortNewBook()}
                  value={this.state.sort_new_book}
                />

              </View>

              <View style={[homeStyles.properties_point, { marginBottom: 0 }]}>

                <Text style={homeStyles.properties_point_text}>Показать только скачанные</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertyShowOnlyLoaded()}
                  value={this.state.show_only_loaded}
                />

              </View>

            </View>
          }

        </View>

        <React.Fragment>
          {this.state.do_not_find == true &&
            <View style={{ marginTop: 100 }}>
              <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa' }}>Книги не найдены :(</Text>
            </View>
          }
          {this.state.do_not_find == false &&
            <SwipeListView
              style={{ flex: 1, marginTop: -10, zIndex: 0, paddingTop: 10 }}
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={() => this.getBooks()} />
              }
              showsHorizontalScrollIndicator={false}
              scrollIndicatorInsets={{ right: 1 }}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingBottom: 100 }}
              data={this.state.books_filtered}
              renderItem={(book) => <Book
                books_percents={this.props.root.state.books_percents}
                book={book}
                onPress={(book_id, color) => this.props.stack.navigation.navigate('Show', {
                  book_id: book_id,
                  color: color,
                })}
              />}
              keyExtractor={(book) => book.id}
              ListEmptyComponent={() => <PreviewBooks />}
              rightOpenValue={-130}
              disableRightSwipe={true}

              renderHiddenItem={(data, rowMap) => {

                return (
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#ddd', marginLeft: 15, marginRight: 15, }}>
                    <View style={{ zIndex: 2, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#FFF' }}>
                    </View>
                    <TouchableWithoutFeedback onPress={() => readBook(rowMap, data.item)} >
                      <View style={{ zIndex: 1, marginLeft: -10, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#75b641' }}>
                        <Text numberOfLines={1} style={{ width: 130, position: 'absolute', bottom: 37, left: -27, color: '#FFF', lineHeight: 55, textAlign: 'center', fontSize: 16, transform: [{ rotate: '-90deg' }] }}>Прочитана</Text>
                      </View>
                    </TouchableWithoutFeedback>
                    {data.item.have_file == true &&
                      <TouchableWithoutFeedback onPress={() => deleteBook(rowMap, data.item)}>
                        <View style={{ zIndex: 0, marginLeft: -10, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#f05458' }}>
                          <Text numberOfLines={1} style={{ width: 130, position: 'absolute', bottom: 37, left: -27, color: '#FFF', lineHeight: 55, textAlign: 'center', fontSize: 12, transform: [{ rotate: '-90deg' }] }}>Удалить из памяти</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    }
                  </View>
                )
              }}

            />
          }
        </React.Fragment>

      </SafeAreaView>
    )
  }
}


class LevelSelectorPoint extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress(this.props.level)} style={homeStyles.level_selector_point}>
        <View style={this.props.current_level == this.props.level && [{ backgroundColor: this.props.color }, homeStyles.level_selector_point_active]}>
          <Text style={homeStyles.level_selector_point_text}>
            <Text style={this.props.current_level == this.props.level ? { color: '#FFF' } : { color: '#000' }}>
              {this.props.name}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    )
  }
}


function PreviewBooks() {
  return (
    <React.Fragment>
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
    </React.Fragment>
  );
}

function PreviewBook() {
  return (
    <React.Fragment>
      <View style={{ marginLeft: 15, marginRight: 15, paddingBottom: 15, paddingTop: 15, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ borderRadius: 5, height: 25, backgroundColor: '#eee', width: '50%' }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: '#eee' }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: '#eee', width: '70%' }}></View>
        </View>
      </View>
    </React.Fragment>
  );
}