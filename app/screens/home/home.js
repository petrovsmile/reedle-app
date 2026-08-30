const HomeDownloadsPanel = observer(function HomeDownloadsPanel() {
  var downloads = Object.values(downloadStore.downloads);
  if (downloads.length === 0) return null;

  return (
      <View style={[homeStyles.downloadsPanel, { backgroundColor: appThemeStore.colors.surface }]}>
      <Text style={[homeStyles.downloadsTitle, { color: appThemeStore.colors.text }]}>Загрузка книг</Text>
      {downloads.map((download) =>
        <View key={download.bookId} style={homeStyles.downloadRow}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[homeStyles.downloadBookName, { color: appThemeStore.colors.text }]}>{download.nameEn || download.name}</Text>
            <View style={homeStyles.downloadProgressTrack}>
              <View style={[
                homeStyles.downloadProgressValue,
                {
                  width: (download.progress || 0) + '%',
                  backgroundColor: download.status === 'error' ? '#f05458' : (download.color || '#75b641'),
                }
              ]} />
            </View>
            <Text style={[homeStyles.downloadStatus, { color: appThemeStore.colors.mutedText }]}>
              {download.status === 'error'
                ? 'Ошибка загрузки'
                : download.status === 'completed'
                  ? 'Загружено'
                  : (download.progress || 0).toFixed(1) + '%'}
            </Text>
          </View>
          {(download.status === 'completed' || download.status === 'error') &&
            <TouchableOpacity onPress={() => downloadStore.dismiss(download.bookId)} style={homeStyles.downloadDismiss}>
              <Text style={homeStyles.downloadDismissText}>×</Text>
            </TouchableOpacity>
          }
        </View>
      )}
    </View>
  );
});

const Home = observer(class Home extends React.Component {
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
    var sort_new_book_default_migrated = await new Storage().get('sort_new_book_default_enabled_v1');
    if (sort_new_book_default_migrated != 'true') {
      await new Storage().set('sort_new_book', 'true');
      await new Storage().set('sort_new_book_default_enabled_v1', 'true');
    }

    var not_show_read = await new Storage().get('not_show_read', 'false')
    var sort_new_book = await new Storage().get('sort_new_book', 'true');
    var show_only_loaded = await new Storage().get('show_only_loaded', 'false');
    this.setState({
      not_show_read: not_show_read === 'true',
      sort_new_book: sort_new_book === 'true',
      show_only_loaded: show_only_loaded === 'true',
    }, () => {
      this.getBooks();
    });

    // this.props.stack.navigation.navigate('reader', {
    //   book_id: 1
    // });
  }

  async getBooks() {
    this.setState({
      books: [],
      filter_books: [],
    }, async () => {

      var exists = await RNFS.exists(file_root + '/' + BOOKS_FILENAME);
      if (exists == false) {
        await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, "[]", 'utf8');
      }

      var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
      books = JSON.parse(books);
      appStore.setBooksOrder(books.map(book => book.id));

      this.setState({
        books: books,
      }, async () => {
        var server_books = await new Request('/api/v1/books', {}, { do_not_show_error: true }).get();
        if (server_books == false) {
          this.filter_books();
        } else {
          if (server_books.length != books.length) {
            books = server_books;
            await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(server_books), 'utf8');
            appStore.setBooksOrder(server_books.map(book => book.id));

            this.setState({ books: books }, () => this.filter_books());
          } else {
            this.filter_books();
          }
        }
      });
    });
  }

  //Фильтрует по Level, Названиям, Скачиванию
  async filter_books() {
    this.setState({
      books_filtered: [],
    }, async () => {

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
            downloadStore.setCompleted(book.id, book['have_file']);
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

      var percents = {}
      result.forEach(function (book) {
        percents[book.id] = book.percent;
      });

      this.props.root.setState({
        books_percents: percents
      });
      appStore.setBooksPercents(percents);

      this.setState({
        books_filtered: result,
        do_not_find: result.length == 0,
      }, function () {
        this.showReview();
      });
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
        AppMetrica.reportEvent('reviewShow', { show: true });
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

    AppMetrica.reportEvent('setLevel', { level: level });

    this.setState({
      level: level,
    }, function () {
      this.filter_books();
    });
  }
  openProperty() {

    AppMetrica.reportEvent('openProperty', { show: !this.state.open_property });

    this.setState({
      open_property: !this.state.open_property,
    });
  }

  setPropertyShowRead() {

    AppMetrica.reportEvent('notShowRead', { value: !this.state.not_show_read });

    AsyncStorage.setItem('not_show_read', (!this.state.not_show_read).toString()).then(() => {
      this.setState({
        not_show_read: !this.state.not_show_read,
      }, () => {
        this.filter_books();
      });
    });


  }
  setPropertySortNewBook() {

    AppMetrica.reportEvent('sortNewBook', { value: !this.state.sort_new_book });

    AsyncStorage.setItem('sort_new_book', (!this.state.sort_new_book).toString()).then(() => {
      this.setState({
        sort_new_book: !this.state.sort_new_book,
      }, () => {
        this.filter_books();
      });
    });
  }

  setPropertyShowOnlyLoaded() {

    AppMetrica.reportEvent('showOnlyLoaded', { value: !this.state.show_only_loaded });

    AsyncStorage.setItem('show_only_loaded', (!this.state.show_only_loaded).toString()).then(() => {
      this.setState({
        show_only_loaded: !this.state.show_only_loaded,
      }, () => {
        this.filter_books();
      });
    });
  }

  render() {
    var safeAreaInsets = this.props.safeAreaInsets || { top: 0 };
    var safeAreaTop = safeAreaInsets.top || 0;
    var visibleBooks = Array.isArray(this.state.books_filtered) ? this.state.books_filtered : [];
    if (this.state.not_show_read) {
      visibleBooks = visibleBooks.filter(book => Number(appStore.books_percents[book.id]) !== 100);
    }
    if (this.state.show_only_loaded) {
      visibleBooks = visibleBooks.filter(book => downloadStore.isCompleted(book.id));
    }
    if (this.state.sort_new_book && appStore.books_order.length > 0) {
      var bookOrderPositions = {};
      appStore.books_order.forEach((bookId, index) => { bookOrderPositions[String(bookId)] = index; });
      visibleBooks = visibleBooks.slice().sort((leftBook, rightBook) => {
        var leftPosition = bookOrderPositions[String(leftBook.id)];
        var rightPosition = bookOrderPositions[String(rightBook.id)];
        if (leftPosition === undefined) leftPosition = Number.MAX_SAFE_INTEGER;
        if (rightPosition === undefined) rightPosition = Number.MAX_SAFE_INTEGER;
        return leftPosition - rightPosition;
      });
    }

    return (
      <View style={[applicationStyles.save_area_view, { paddingTop: safeAreaTop, backgroundColor: appThemeStore.colors.background }]}>
        <View style={homeStyles.header}>

          <View style={homeStyles.header_empty_block} />

          <View style={homeStyles.logo}>
            <Text style={[homeStyles.logo_text, { color: appThemeStore.colors.text }]}>Reedle</Text>
            <Text style={homeStyles.logo_dot}>.</Text>
          </View>

          {(this.props.root.state.has_subscription == false) ? (
            <TouchableOpacity onPress={() => this.props.stack.navigation.navigate('subscription', { backTitle: 'Книги' })}>
              <AppIcon icon={MegaphoneOffIcon} size={28} color={appThemeStore.colors.text} style={{ marginTop: 3 }} />
            </TouchableOpacity>
          ) : (
            <View style={homeStyles.header_empty_block}></View>
          )}
        </View>

        <HomeDownloadsPanel />

        <View style={[homeStyles.search, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <AppIcon icon={SearchIcon} size={24} color="#999" style={homeStyles.search_image} />
          <TextInput
            style={[homeStyles.search_input, { color: appThemeStore.colors.text, outlineStyle: 'none' }]}
            onChangeText={(value) => this.onChangeText(value)}
            placeholder={"Поиск"}
            placeholderTextColor={appThemeStore.colors.text}
            clearButtonMode="always"
          />
        </View>

        <View style={[homeStyles.level_selector, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={homeStyles.level_selector_wrap}>
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="Все" color="#aaa" level="all" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A1" color="#89c053" level="1" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A2" color="#5e9cea" level="2" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B1" color="#f5b945" level="3" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B2" color="#fb836f" level="4" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="C1" color="#fe4444" level="5" current_level={this.state.level} />


            <TouchableOpacity onPress={() => this.openProperty()}>
              <View style={{ backgroundColor: appThemeStore.colors.border, borderRadius: 7, marginLeft: 3 }}>
                {this.state.open_property == false &&
                  <AppIcon icon={SlidersIcon} size={22} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
                {this.state.open_property == true &&
                  <AppIcon icon={CloseIcon} size={22} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
              </View>
            </TouchableOpacity>
          </View>
          {this.state.open_property == true &&
            <View style={[homeStyles.properties, { backgroundColor: appThemeStore.colors.surface }]}>
              <View style={homeStyles.properties_point}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Не показывать прочитанные книги</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={() => this.setPropertyShowRead()}
                  value={this.state.not_show_read}
                />

              </View>


              <View style={homeStyles.properties_point}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Ставить вперед открытые книги</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={() => this.setPropertySortNewBook()}
                  value={this.state.sort_new_book}
                />

              </View>

              <View style={[homeStyles.properties_point, { marginBottom: 0 }]}>

                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Показать только скачанные</Text>

                <Switch
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
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
            <FlatList
              style={{ flex: 1, marginTop: -10, zIndex: 0, paddingTop: 10 }}
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={() => this.getBooks()} />
              }
              showsHorizontalScrollIndicator={false}
              scrollIndicatorInsets={{ right: 1 }}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingBottom: 100 }}
              data={visibleBooks}
              renderItem={(book) => <Book
                books_percents={this.props.root.state.books_percents}
                book={book}
                onPress={(book_id, color) => this.props.stack.navigation.navigate('show', {
                  book_id: book_id,
                  color: color,
                })}
              />}
              keyExtractor={(book) => String(book.id)}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, marginLeft: 15, marginRight: 15, backgroundColor: appThemeStore.colors.border }} />
              )}
              ListEmptyComponent={() => <PreviewBooks />}
            />
          }
        </React.Fragment>

      </View>
    )
  }
});


class LevelSelectorPoint extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress(this.props.level)} style={[homeStyles.level_selector_point, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
        <View style={this.props.current_level == this.props.level && [{ backgroundColor: this.props.color }, homeStyles.level_selector_point_active]}>
          <Text style={homeStyles.level_selector_point_text}>
            <Text style={this.props.current_level == this.props.level ? { color: '#FFF' } : { color: appThemeStore.colors.text }}>
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
        <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.mutedText} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ borderRadius: 5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight, width: '50%' }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: appThemeStore.colors.backgroundLight, width: '70%' }}></View>
        </View>
      </View>
    </React.Fragment>
  );
}
