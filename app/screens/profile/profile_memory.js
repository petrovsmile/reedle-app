class ProfileMemory extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      books: [],
      loading: true,
      deleting: false,
    };
  }
  componentDidMount() {
    this.loadBooks();
    this.unsubscribeFocus = this.props.stack.navigation.addListener(
      'focus',
      () => this.loadBooks(),
    );
  }
  componentWillUnmount() {
    if (this.unsubscribeFocus) this.unsubscribeFocus();
  }
  async loadBooks() {
    if (this.loading_books_request) return this.loading_books_request;
    this.loading_books_request = this.readBookFiles().finally(() => {
      this.loading_books_request = null;
    });
    return this.loading_books_request;
  }
  async readBookFiles() {
    try {
      var books_path = file_root + '/' + BOOKS_FILENAME;
      if (!(await RNFS.exists(books_path))) {
        this.setState({
          books: [],
          loading: false,
        });
        return;
      }
      var books = JSON.parse(await RNFS.readFile(books_path, 'utf8'));
      var downloaded = await Promise.all(
        books.map(async book => {
          var have_file = await AsyncStorage.getItem('have_file_' + book.id);
          return have_file == 'true' ? book : null;
        }),
      );
      downloaded = downloaded.filter(Boolean);
      var calculated_sizes = {};
      for (var index = 0; index < downloaded.length; index++) {
        var book = downloaded[index];
        if (book.downloaded_size != null) continue;
        try {
          var size = await downloadStore.calculateBookSize(book.id);
          book = Object.assign({}, book, {
            downloaded_size: size,
          });
          downloaded[index] = book;
          calculated_sizes[book.id] = size;
        } catch (_) {
          // Если старая загрузка повреждена, оставляем размер неизвестным.
        }
      }
      if (Object.keys(calculated_sizes).length > 0) {
        await downloadStore.updateBookSizes(calculated_sizes);
      }
      this.setState({
        books: downloaded,
        loading: false,
      });
    } catch (_) {
      this.setState({
        books: [],
        loading: false,
      });
    }
  }
  formatSize(size) {
    var bytes = Number(size || 0);
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
  }
  totalSize() {
    return this.state.books.reduce(
      (total, book) => total + Number(book.downloaded_size || 0),
      0,
    );
  }
  confirmDelete(book) {
    AppAlert.confirm(
      'Удалить книгу?',
      '«' + (book.name_en || book.name) + '» будет удалена с устройства.',
      () => this.deleteBooks([book.id]),
      'Удалить',
    );
  }
  confirmClear() {
    if (this.state.books.length == 0) return;
    AppAlert.confirm(
      'Очистить память?',
      'Все скачанные книги будут удалены с устройства.',
      () => this.deleteBooks(this.state.books.map(book => book.id)),
      'Очистить',
    );
  }
  async deleteBooks(book_ids) {
    if (this.state.deleting) return;
    this.setState({
      deleting: true,
    });
    try {
      await downloadStore.removeBooks(book_ids);
      await this.loadBooks();
    } catch (_) {
      AppAlert.alert('Ошибка', 'Не удалось удалить скачанные книги.');
    } finally {
      this.setState({
        deleting: false,
      });
    }
  }
  render() {
    return (
      <AppSafeAreaView
          edges={['left', 'right', 'bottom']}
        style={[
          applicationStyles.save_area_view,
          {
            backgroundColor: appThemeStore.colors.background,
          },
        ]}
      >
        <View
          style={[
            {
              minHeight: 56,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
            },
            {
              borderBottomColor: appThemeStore.colors.border,
            },
          ]}
        >
          <Text
            style={[
              {
                fontSize: 16,
                fontWeight: '600',
              },
              {
                color: appThemeStore.colors.text,
              },
            ]}
          >
            {'Занято: ' + this.formatSize(this.totalSize())}
          </Text>
          <TouchableOpacity
            disabled={this.state.books.length == 0 || this.state.deleting}
            onPress={() => this.confirmClear()}
          >
            <Text
              style={[
                {
                  color: app_theme_colors.red,
                  fontSize: 16,
                  fontWeight: '600',
                },
                (this.state.books.length == 0 || this.state.deleting) &&
                  profileStyles.memoryActionDisabled,
              ]}
            >
              Очистить
            </Text>
          </TouchableOpacity>
        </View>

        {this.state.loading ? (
          <ActivityIndicator
            style={{
              flex: 1,
            }}
            size="large"
            color={appThemeStore.colors.mutedText}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 32,
            }}
          >
            {this.state.books.length == 0 && (
              <Text
                style={[
                  {
                    paddingTop: 64,
                    textAlign: 'center',
                    fontSize: 16,
                  },
                  {
                    color: appThemeStore.colors.mutedText,
                  },
                ]}
              >
                Скачанных книг нет
              </Text>
            )}
            {this.state.books.map(book => (
              <View
                key={book.id}
                style={[
                  {
                    minHeight: 64,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderBottomWidth: 1,
                  },
                  {
                    borderBottomColor: appThemeStore.colors.border,
                  },
                ]}
              >
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingRight: 16,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      {
                        fontSize: 16,
                      },
                      {
                        color: appThemeStore.colors.text,
                      },
                    ]}
                  >
                    {book.name_en || book.name}
                  </Text>
                  <Text
                    style={[
                      {
                        marginTop: 8,
                        fontSize: 14,
                      },
                      {
                        color: appThemeStore.colors.mutedText,
                      },
                    ]}
                  >
                    {this.formatSize(book.downloaded_size)}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Удалить книгу"
                  disabled={this.state.deleting}
                  onPress={() => this.confirmDelete(book)}
                  style={
                    this.state.deleting && profileStyles.memoryActionDisabled
                  }
                >
                  <AppIcon
                    icon={TrashIcon}
                    size={24}
                    color={app_theme_colors.red}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </AppSafeAreaView>
    );
  }
}
