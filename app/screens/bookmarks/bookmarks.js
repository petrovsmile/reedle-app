class Bookmarks extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      bookmarks: [],
      do_not_find: false,
    };

    this.storage_bookmarks = [];
    this.search_value = "";
  }

  async componentDidMount() {
    //await new Storage().set('bookmarks_keys', JSON.stringify([]));
    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getBookmarks();
    });

    await this.getBookmarks();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  async getBookmarks() {
    if (this.props.root.state.current_user != false) {
      await this.setState({
        do_not_find: false,
        bookmarks: [],
      });

      this.storage_bookmarks = await this.getBookmarksFromStorage();
      await this.getBookmarksFromServer();
      var bookmarks = await this.getBookmarksFromStorage();

      this.setState({
        bookmarks: bookmarks,
        do_not_find: bookmarks.length == 0
      });
    }
  }

  async getBookmarksFromServer() {
    var server_bookmarks = await new Request('/api/v1/bookmarks', {
      user_id: this.props.root.state.current_user.id
    }, {
      do_not_show_error: true
    }).get();
    if (server_bookmarks != false) {

      var ar_delete_keys = [];
      var ar_add_keys = [];

      // Удаляем с устройства если на сервере удалили и добавляем на сервере, если есть добавленные на устройстве offline
      await Promise.all(this.storage_bookmarks.reverse().map(async storage_bookmark => {
        var has_bookmark = false;
        server_bookmarks.map(async server_bookmark => {
          if (server_bookmark.book.id == storage_bookmark.book_id && has_bookmark == false) {
            has_bookmark = true;
          }
        })
        if (has_bookmark == false) {
          if (storage_bookmark.offline == true) {
            await new Request('/api/v1/bookmarks', {
              book_id: storage_bookmark.book_id,
              user_id: this.props.root.state.current_user.id,
              page: storage_bookmark.page,
              paragraph: storage_bookmark.paragraph
            }, {
              do_not_show_error: true
            }).post();
            storage_bookmark.offline = false;
            await new Storage().set('bookmark_' + storage_bookmark.book_id, JSON.stringify(storage_bookmark));
          } else {
            ar_delete_keys.push('bookmark_' + storage_bookmark.book_id);
          }
        }
      }));

      await Promise.all(server_bookmarks.reverse().map(async server_bookmark => {
        // Добавляем, если на сервере есть новые
        var has_bookmark = false;
        this.storage_bookmarks.forEach((storage_bookmark) => {
          if (server_bookmark.book.id == storage_bookmark.book_id && has_bookmark == false) {
            has_bookmark = true;
          }
        });

        if (has_bookmark == false) {
          await new Storage().set('bookmark_' + server_bookmark.book.id, JSON.stringify({
            book_id: server_bookmark.book.id,
            book_name: server_bookmark.book.name,
            page: server_bookmark.page,
            paragraph: server_bookmark.paragraph
          }));
          ar_add_keys.push('bookmark_' + server_bookmark.book.id);
        }

        // Обновляем, если на сервере параграф больше
        this.storage_bookmarks.forEach((storage_bookmark) => {
          if (server_bookmark.book.id == storage_bookmark.book_id) {
            if (server_bookmark.paragraph > storage_bookmark.paragraph) {
              new Storage().set('bookmark_' + storage_bookmark.book_id, JSON.stringify({
                book_id: storage_bookmark.book_id,
                book_name: storage_bookmark.book_name,
                page: server_bookmark.page,
                paragraph: server_bookmark.paragraph
              }));
              ar_add_keys.push('bookmark_' + server_bookmark.book.id);
            }
          }
        });
      }));

      bookmarks_keys = await new Storage().get('bookmarks_keys');
      if (bookmarks_keys == undefined || bookmarks_keys == null) {
        bookmarks_keys = [];
      } else {
        bookmarks_keys = JSON.parse(bookmarks_keys);
      }

      ar_add_keys.forEach(function (add_key) {
        var index = bookmarks_keys.indexOf(add_key);
        if (index > -1) {
          bookmarks_keys.splice(index, 1);
        }
        bookmarks_keys.unshift(add_key);
      });

      ar_delete_keys.forEach(function (delete_key) {
        var index = bookmarks_keys.indexOf(delete_key);
        if (index > -1) {
          bookmarks_keys.splice(index, 1);
        }
      });

      await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
    }
  }

  async getBookmarksFromStorage() {
    var bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);
    }

    var bookmarks = await Promise.all(bookmarks_keys.map(async bookmark_key => {
      var bookmark = await new Storage().get(bookmark_key);

      return JSON.parse(bookmark);
    }));

    return bookmarks;
  }

  async deleteBookmark(rowMap, data) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf('bookmark_' + data.book_id);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));

    await new Request('/api/v1/bookmarks', {
      book_id: data.book_id,
      user_id: this.props.root.state.current_user.id
    }, {
      desciption_error: 'Закладка удалена только с этого устройства.'
    }).delete();

    this.getBookmarks();
  }

  openBook(book_id, bookmark) {
    // Открываем Reader через корневой стек (над табами), чтобы не было
    // ни нижней таб-панели, ни заголовка вложенного стека закладок.
    this.props.root_stack.navigation.navigate('Reader', {
      book_id: book_id,
      bookmark: bookmark,
    });
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        {this.props.root.state.current_user == false ? (
          <View style={bookmarksStyles.auth_content}>
            <Text style={bookmarksStyles.auth_into}>
              Для того чтобы воспользоваться закладками,
              необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[bookmarksStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={bookmarksStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[bookmarksStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (

          <React.Fragment>
            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', flexDirection: 'row' }}>
                  Чтобы создать закладку,
                  зайдите на книгу и нажмите иконку закладки
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили закладку, но она не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: '#ddd', borderRadius: 10 }} onPress={() => this.getBookmarks()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center' }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false &&
              <SwipeListView
                style={{ flex: 1, zIndex: 0, paddingTop: 10 }}
                refreshControl={
                  <RefreshControl refreshing={false} onRefresh={() => this.getBookmarks()} />
                }
                showsHorizontalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                data={this.state.bookmarks}
                renderItem={(bookmark) => <Bookmark openBook={(book_id, bookmark) => this.openBook(book_id, bookmark)} bookmark={bookmark} />}
                keyExtractor={(bookmark) => bookmark.book_id}
                ListEmptyComponent={() => <PreviewBookmarks />}
                rightOpenValue={-40}
                disableRightSwipe={true}
                renderHiddenItem={(data, rowMap) => {

                  return (
                    <View style={{ flex: 1, flexDirection: 'row', heihgt: 40, justifyContent: 'flex-end', marginRight: 10, }}>
                      <TouchableOpacity onPress={() => this.deleteBookmark(rowMap, data.item)}>
                        <Image style={{ width: 20, height: 20, margin: 10 }} source={require('./app/images/bookmarks/delete.png')} />
                      </TouchableOpacity>
                    </View>
                  )
                }}

              />
            }
          </React.Fragment>

        )}
      </SafeAreaView>

    )
  }
}


function PreviewBookmarks() {
  return (
    <React.Fragment>
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
    </React.Fragment>
  );
}

function PreviewBookmark() {
  return (
    <React.Fragment>
      <View style={{ marginLeft: 15, marginRight: 15, paddingBottom: 15, paddingTop: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ height: 50, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        </View>
      </View>
    </React.Fragment>
  );
}