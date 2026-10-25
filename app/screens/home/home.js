const HomeDownloadsPanel = observer(function HomeDownloadsPanel() {
  var downloads = Object.values(downloadStore.downloads);
  if (downloads.length === 0) return null;

  return (
    <View style={[{ marginLeft: 16, marginRight: 16, marginTop: 8, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: '#FFF', elevation: 3 }, { backgroundColor: appThemeStore.colors.surface }]}>
      <Text style={[{ marginBottom: 8, fontSize: 16, fontWeight: '600', color: '#222' }, { color: appThemeStore.colors.text }]}>Загрузка книг</Text>
      {downloads.map((download) =>
        <View key={download.bookId} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[{ marginBottom: 8, fontSize: 14, color: '#333' }, { color: appThemeStore.colors.text }]}>{download.nameEn || download.name}</Text>
            <View style={{ height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: '#e5e5e5' }}>
              <View style={[{ height: 8, borderRadius: 8 }, { width: (download.progress || 0) + '%', backgroundColor: download.status === 'error' ? app_theme_colors.red : download.color || app_theme_colors.success }]} />
            </View>
            <Text style={[{ marginTop: 8, fontSize: 14, color: '#777' }, { color: appThemeStore.colors.mutedText }]}>
              {download.status === 'error'
                ? 'Ошибка загрузки'
                : download.status === 'completed'
                  ? 'Загружено'
                  : (download.progress || 0).toFixed(1) + '%'}
            </Text>
          </View>
          {(download.status === 'completed' || download.status === 'error') &&
            <TouchableOpacity onPress={() => downloadStore.dismiss(download.bookId)} style={{ width: 24, height: 24, marginLeft: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, lineHeight: 24, color: '#999' }}>×</Text>
            </TouchableOpacity>
          }
        </View>
      )}
    </View>
  );
});

const HomeProgressPanel = observer(function HomeProgressPanel(props) {
  var user = appStore.current_user;
  var summary = progressStore.summary || {};
  var today = summary.today || {};
  var goal = summary.goal || {};
  var goalMinutes = Number(goal.reading_minutes_per_day || 15);
  var minutes = Number(today.minutes || 0);
  var progress = Math.min(100, Math.round(minutes / Math.max(1, goalMinutes) * 100));
  var notice = progressStore.notification || summary.notification;

  if (!user) {
    return (
      <TouchableOpacity onPress={() => props.navigation.navigate('statistics', { backTitle: 'Книги' })} style={[{ marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1 }, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
        <Text style={{ color: appThemeStore.colors.text, fontSize: 16, fontWeight: '700' }}>Сохраняйте свой прогресс</Text>
        <Text style={{ marginTop: 6, color: appThemeStore.colors.mutedText, lineHeight: 20 }}>Войдите, чтобы видеть время чтения, серии дней и персональные цели.</Text>
        <Text style={{ marginTop: 10, color: app_theme_colors.red, fontWeight: '600' }}>Открыть статистику →</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={() => notice ? push_notification_service.open({ data: notice }) : props.navigation.navigate('statistics', { backTitle: 'Книги' })} style={[{ marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1 }, { borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.surface }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: appThemeStore.colors.text, fontSize: 16, fontWeight: '700' }}>Сегодня</Text>
        <Text style={{ color: appThemeStore.colors.mutedText }}>{minutes} из {goalMinutes} мин.</Text>
      </View>
      <View style={{ height: 8, marginTop: 12, borderRadius: 4, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
        <View style={{ width: progress + '%', height: 8, borderRadius: 4, backgroundColor: app_theme_colors.red }} />
      </View>
      {notice ? (
        <Text style={{ marginTop: 12, color: appThemeStore.colors.text, lineHeight: 20 }}>{notice.message || notice.title}</Text>
      ) : (
        <Text style={{ marginTop: 12, color: appThemeStore.colors.mutedText }}>{progress >= 100 ? 'Цель выполнена — отличный результат!' : 'Даже несколько минут чтения сегодня имеют значение.'}</Text>
      )}
    </TouchableOpacity>
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
      show_statistics: true,
      open_property: false,
      search_value: '',
    };

    this.search_value = "";
  }

  async componentDidMount() {
    this._unsubscribeTabPress = this.props.tabs.navigation.addListener('tabPress', () => {
      this.getBooks();
      if (appStore.current_user) progressService.loadSummary();
    });
    this._unsubscribeDownloadCompleted = downloadStore.onCompleted(() => this.filter_books());
    if (appStore.current_user) progressService.loadSummary();

    var sort_new_book_default_migrated = await new Storage().get('sort_new_book_default_enabled_v1');
    if (sort_new_book_default_migrated != 'true') {
      await new Storage().set('sort_new_book', 'true');
      await new Storage().set('sort_new_book_default_enabled_v1', 'true');
    }

    var not_show_read = await new Storage().get('not_show_read', 'false')
    var sort_new_book = await new Storage().get('sort_new_book', 'true');
    var show_only_loaded = await new Storage().get('show_only_loaded', 'false');
    var show_statistics = await new Storage().get('show_statistics', 'true');
    this.setState({
      not_show_read: not_show_read === 'true',
      sort_new_book: sort_new_book === 'true',
      show_only_loaded: show_only_loaded === 'true',
      show_statistics: show_statistics === 'true',
    }, () => {
      this.getBooks();
    });

    // this.props.stack.navigation.navigate('reader', {
    //   book_id: 1
    // });
  }

  componentWillUnmount() {
    if (this._unsubscribeTabPress) this._unsubscribeTabPress();
    if (this._unsubscribeDownloadCompleted) this._unsubscribeDownloadCompleted();
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
        var server_books = await new Request('/api/v2/books', {}, { do_not_show_error: true }).get();
        if (server_books == false) {
          this.filter_books();
        } else {
          if (server_books.length != books.length) {
            var localBooksById = {};
            books.forEach((book) => { localBooksById[book.id] = book; });
            books = server_books.map((book) => localBooksById[book.id] && localBooksById[book.id].downloaded_size
              ? Object.assign({}, book, { downloaded_size: localBooksById[book.id].downloaded_size })
              : book);
            await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(books), 'utf8');
            appStore.setBooksOrder(books.map(book => book.id));

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
            var have_file = await downloadStore.validateCompleted(book.id);
            book['have_file'] = have_file;
            downloadStore.setCompleted(book.id, book['have_file']);
            if (this.state.show_only_loaded == true) {
              check = book['have_file'];
            }

            var percent = Number(await new Storage().get('percent_' + book.id, 0));
            if (!Number.isFinite(percent)) percent = 0;
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
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign('https://reedle.ru');
      return;
    }

    Linking.openURL("https://reedle.ru");
  }

  onChangeText(value) {
    this.search_value = value;
    this.setState({ search_value: value });
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

  setPropertyShowStatistics(value) {
    this.setState({ show_statistics: value });
    AsyncStorage.setItem('show_statistics', value.toString());
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
    var safeAreaInsets = this.props.safeAreaInsets || { top: 0, left: 0, right: 0 };
    var safeAreaTop = safeAreaInsets.top || 0;
    var safeAreaLeft = Platform.OS === 'web' ? 0 : (safeAreaInsets.left || 0);
    var safeAreaRight = Platform.OS === 'web' ? 0 : (safeAreaInsets.right || 0);
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
      <View style={[applicationStyles.save_area_view, { paddingTop: safeAreaTop, paddingLeft: safeAreaLeft, paddingRight: safeAreaRight, backgroundColor: appThemeStore.colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16, marginTop: 16 }}>

          <View style={homeStyles.header_empty_block} />

          <TouchableOpacity
            accessibilityRole='link'
            accessibilityLabel='Перейти на сайт Reedle'
            onPress={() => this.goToSite()}
            style={{ flexDirection: 'row', justifyContent: 'center', height: 32 }}>
            <Text style={[{ fontSize: 28, lineHeight: 32, fontFamily: 'LibreBaskerville-Regular', color: app_theme_colors.text }, { color: appThemeStore.colors.text }]}>Reedle</Text>
            <Text style={{ fontSize: 28, lineHeight: 32, color: app_theme_colors.red, fontFamily: 'LibreBaskerville-Regular' }}>.</Text>
          </TouchableOpacity>

          {(appStore.has_subscription == false) ? (
            <TouchableOpacity onPress={() => this.props.stack.navigation.navigate('subscription', { backTitle: 'Книги' })}>
              <AppIcon icon={MegaphoneOffIcon} size={24} style={{ padding: 4 }} color={appThemeStore.colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={homeStyles.header_empty_block}></View>
          )}
        </View>

        <HomeDownloadsPanel />

        <View style={[{ flexDirection: 'row', height: 40, overflow: 'hidden', backgroundColor: app_theme_colors.backgroundLight, borderRadius: 8, margin: 16 }, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <AppIcon icon={SearchIcon} size={24} color="#999" style={{ margin: 8 }} />
          <TextInput
            style={[{ flex: 1, minWidth: 0, height: 40, fontSize: 16, color: app_theme_colors.text, backgroundColor: 'transparent' }, { color: appThemeStore.colors.text, outlineStyle: 'none' }]}
            value={this.state.search_value}
            onChangeText={(value) => this.onChangeText(value)}
            placeholder={"Поиск"}
            placeholderTextColor={appThemeStore.colors.text}
            clearButtonMode="never"
          />
          {this.state.search_value.length > 0 &&
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Очистить поиск книг" onPress={() => this.onChangeText('')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon icon={CloseIcon} size={24} color={appThemeStore.colors.mutedText} />
            </TouchableOpacity>
          }
        </View>

        <View style={[{ backgroundColor: '#eee', borderRadius: 8, padding: 4, marginLeft: 16, marginRight: 16, zIndex: 1 }, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={{ flexDirection: 'row' }}>
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="Все" level="all" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A1" level="1" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A2" level="2" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B1" level="3" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B2" level="4" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="C1" level="5" current_level={this.state.level} />


            <TouchableOpacity onPress={() => this.openProperty()}>
              <View style={[{ width: 32, height: 32, marginLeft: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, { backgroundColor: appThemeStore.colors.border }]}>
                {this.state.open_property == false &&
                  <AppIcon icon={SlidersIcon} size={24} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
                {this.state.open_property == true &&
                  <AppIcon icon={CloseIcon} size={24} color={appThemeStore.colors.text} style={homeStyles.settings_image} />
                }
              </View>
            </TouchableOpacity>
          </View>
          {this.state.open_property == true &&
            <View style={[{ padding: 8, backgroundColor: '#FFF', marginTop: 8, borderRadius: 8 }, { backgroundColor: appThemeStore.colors.surface }]}>
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

              <View style={homeStyles.properties_point}>

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

              <View style={[homeStyles.properties_point, { marginBottom: 0 }]}>
                <Text style={[homeStyles.properties_point_text, { color: appThemeStore.colors.text }]}>Отображать статистику</Text>
                <Switch
                  accessibilityLabel="Отображать статистику"
                  trackColor={{ false: appThemeStore.colors.backgroundLight, true: app_theme_colors.red }}
                  thumbColor="#aaa"
                  activeThumbColor="#aaa"
                  ios_backgroundColor={appThemeStore.colors.backgroundLight}
                  onValueChange={(value) => this.setPropertyShowStatistics(value)}
                  value={this.state.show_statistics}
                />
              </View>

            </View>
          }

        </View>

        <FlatList
          style={{ flex: 1, marginTop: -8, zIndex: 0, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => this.getBooks()} />
          }
          showsHorizontalScrollIndicator={false}
          scrollIndicatorInsets={{ right: 1 }}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingBottom: 104 }}
          data={visibleBooks}
          ListHeaderComponent={this.state.show_statistics ? () => <HomeProgressPanel navigation={this.props.stack.navigation} /> : null}
          renderItem={(book) => <Book
            books_percents={appStore.books_percents}
            book={book}
            onPress={(book_id, color) => this.props.stack.navigation.navigate('show', {
              book_id: book_id,
              color: color,
            })}
          />}
          keyExtractor={(book) => String(book.id)}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, marginLeft: 16, marginRight: 16, backgroundColor: appThemeStore.colors.border }} />
          )}
          ListEmptyComponent={() => this.state.do_not_find ? (
            <View style={{ marginTop: 72 }}>
              <Text style={{ textAlign: 'center', fontSize: 18, color: '#aaa' }}>Книги не найдены :(</Text>
            </View>
          ) : <PreviewBooks />}
        />

      </View>
    )
  }
});


class LevelSelectorPoint extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress(this.props.level)} style={[{ flex: 1, backgroundColor: '#eee', height: 32, borderRadius: 8 }, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
        <View style={this.props.current_level == this.props.level && [{ backgroundColor: app_theme_colors.red }, { flex: 1, borderRadius: 8 }]}>
          <Text style={{ fontSize: 14, color: '#000', textAlign: 'center', lineHeight: 32 }}>
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
      <View style={{ margin: 16, flexDirection: 'row' }}>
        <View style={{ height: 96, width: 72, marginRight: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.mutedText} />
        </View>
        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', height: 96 }}>
          <View style={{ borderRadius: 8, height: 24, backgroundColor: appThemeStore.colors.backgroundLight, width: '50%' }}></View>
          <View style={{ borderRadius: 8, height: 24, backgroundColor: appThemeStore.colors.backgroundLight }}></View>
          <View style={{ borderRadius: 8, height: 24, backgroundColor: appThemeStore.colors.backgroundLight, width: '70%' }}></View>
        </View>
      </View>
      <View style={{ height: 1, marginLeft: 16, marginRight: 16, backgroundColor: appThemeStore.colors.border }} />
    </React.Fragment>
  );
}
