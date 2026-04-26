class Dictionary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      words: [],
      do_not_find: false,
      sorting_by: 'date'
    };

    this.storage_words = [];
  }

  async componentDidMount() {
    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getWords();
    });

    this.getWords();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  async getWords() {
    if (this.props.root.state.current_user != false) {
      await this.setState({
        do_not_find: false,
        words: [],
      });

      this.storage_words = await this.getWordsFromStorage();
      await this.getWordsFromServer();
      var words = await this.getWordsFromStorage();

      if (this.state.sorting_by == 'alphabet') {
        words = words.sort((a, b) => {
          return a.original >= b.original ? 0 : - 1;
        });
      }

      this.setState({
        words: words,
        do_not_find: words.length == 0
      });
    }
  }

  async getWordsFromStorage() {
    var words_keys = await new Storage().get('words_keys', '[]');
    words_keys = JSON.parse(words_keys);

    var words = await Promise.all(words_keys.map(async word_key => {
      var word = await new Storage().get(word_key, '{}');

      return JSON.parse(word);
    }));

    return words;
  }

  async getWordsFromServer() {
    var server_words = await new Request('/api/v1/dictionary/words', {
      user_id: this.props.root.state.current_user.id
    }, {
      do_not_show_error: true
    }).get();

    if (server_words != false) {
      var ar_delete_keys = [];
      var ar_add_keys = [];

      // Удаляем с устройства если на сервере удалили и добавляем на сервере, если есть добавленные на устройстве offline
      await Promise.all(this.storage_words.reverse().map(async storage_word => {
        var has_word = false;
        server_words.map(async server_word => {
          if (server_word.original == storage_word.original && has_word == false) {
            has_word = true;
          }
        })
        if (has_word == false) {
          if (storage_word.offline == true) {
            await new Request('/api/v1/dictionary/words', {
              original: storage_word.original,
              user_id: this.props.root.state.current_user.id
            }, {
              do_not_show_error: true
            }).post();
            storage_word.offline = false;
            
            await new Storage().set('word_' + storage_word.original, JSON.stringify(storage_word));
          } else {
            ar_delete_keys.push('word_' + storage_word.original);
          }
        }
      }));

      await Promise.all(server_words.reverse().map(async server_word => {
        // Добавляем, если на сервере есть новые
        var has_word = false;
        this.storage_words.forEach((storage_word) => {
          if (server_word.original == storage_word.original && has_word == false) {
            has_word = true;
          }
        });

        if (has_word == false) {
          await new Storage().set('word_' + server_word.original, JSON.stringify({
            original: server_word.original,
            transcription: server_word.transcription,
            translate: server_word.translate,
            created_at: server_word.created_at
          }));
          ar_add_keys.push('word_' + server_word.original);
        }
      }));

      words_keys = await new Storage().get('words_keys', '[]');
      words_keys = JSON.parse(words_keys);

      ar_add_keys.forEach(function (add_key) {
        var index = words_keys.indexOf(add_key);
        if (index > -1) {
          words_keys.splice(index, 1);
        }
        words_keys.unshift(add_key);
      });

      ar_delete_keys.forEach(function (delete_key) {
        var index = words_keys.indexOf(delete_key);
        if (index > -1) {
          words_keys.splice(index, 1);
        }
      });

      await new Storage().set('words_keys', JSON.stringify(words_keys));
    }
  }

  async deleteWord(rowMap, data) {
    words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf('word_' + data.original);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    new Storage().set('words_keys', JSON.stringify(words_keys));

    await new Request('/api/v1/dictionary/words', {
      original: data.original,
      user_id: this.props.root.state.current_user.id
    }, {
      desciption_error: 'Слово удалено только с этого устройства.'
    }).delete();

    this.getWords();
  }

  set_sorting_by(sorting_by) {
    this.setState({
      sorting_by: sorting_by
    }, function () {
      this.getWords();
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
          <View style={dictionaryStyles.auth_content}>
            <Text style={dictionaryStyles.auth_into}>
              Для того чтобы воспользоваться
              словарем, необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[dictionaryStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={dictionaryStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[dictionaryStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (
          <React.Fragment>

            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
                  Нет слов...
                </Text>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', marginTop: 8 }}>
                  Мы можете добавить перевод любого слова на странице книги
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили слово, но оно не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: '#ddd', borderRadius: 10 }} onPress={() => this.getWords()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center' }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false &&
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ padding: 8 }}>

                  {this.props.root.state.has_subscription == false &&
                    <React.Fragment>
                      <Text>Вы использовали {this.state.words.length} из 30 слов</Text>
                      <View style={{ marginTop: 10, marginBottom: 10, backgroundColor: '#eee', borderRadius: 4, height: 15, overflow: 'hidden' }}>
                        <View style={{
                          width: Dimensions.get('window').width * (this.state.words.length / 30),
                          height: 15, backgroundColor: '#f05458'
                        }}></View>
                      </View>
                      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15 }}>Без PRO-доступа можно добавить максимум 30 слов</Text>
                    </React.Fragment>
                  }

                  <Text style={{}}>
                    Сортировать по:
                  </Text>


                  <View style={{ height: 24, flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 }}>
                    <TouchableOpacity onPress={() => this.set_sorting_by('date')}>
                      <View style={[dictionaryStyles.button_sorting, this.state.sorting_by == 'date' ? { backgroundColor: '#aaa', borderColor: '#aaa' } : {}]}>
                        <Text style={[this.state.sorting_by == 'date' ? { color: '#FFF' } : {}, { fontSize: 12, lineHeight: 22 }]}>дате добавления</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.set_sorting_by('alphabet')}>
                      <View style={[dictionaryStyles.button_sorting, this.state.sorting_by == 'alphabet' ? { backgroundColor: '#aaa', borderColor: '#aaa' } : {}, { marginLeft: 8 }]}>
                        <Text style={[this.state.sorting_by == 'alphabet' ? { color: '#FFF' } : {}, { fontSize: 12, lineHeight: 22 }]}>по алфавиту</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>


                <SwipeListView
                  style={{ flex: 1, zIndex: 0, paddingTop: 8 }}
                  refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => this.getWords()} />
                  }
                  showsHorizontalScrollIndicator={false}
                  scrollIndicatorInsets={{ right: 1 }}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  data={this.state.words}
                  renderItem={(word) => {
                    return (
                      <View style={{ marginLeft: 8, marginRight: 8, backgroundColor: '#FFF', borderColor: '#eee', borderWidth: 1, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                        <View style={{ height: 4, backgroundColor: '#eee' }}></View>
                        <View style={{ padding: 8 }}>
                          <Text style={{ fontWeight: 'bold' }}>{word.item.original}</Text>
                          {word.item.transcription != null &&
                            <Text style={{ color: '#aaa', marginTop: 4 }}>{word.item.transcription}</Text>
                          }
                          <Text style={{ marginTop: 4 }}>{word.item.translate}</Text>
                        </View>
                      </View>
                    )
                  }}
                  keyExtractor={(word) => word.original}
                  ListEmptyComponent={() => <PreviewWords />}
                  rightOpenValue={-40}
                  disableRightSwipe={true}
                  renderHiddenItem={(data, rowMap) => {
                    return (
                      <View style={{ flex: 1, flexDirection: 'row', heihgt: 40, justifyContent: 'flex-end', marginRight: 8 }}>
                        <TouchableOpacity onPress={() => this.deleteWord(rowMap, data.item)}>
                          <Image style={{ width: 20, height: 20, margin: 10 }} source={require('./app/images/bookmarks/delete.png')} />
                        </TouchableOpacity>
                      </View>
                    )
                  }}
                />
              </View>
            }
          </React.Fragment>
        )}
      </SafeAreaView>

    )
  }
}




function PreviewWords() {
  return (
    <React.Fragment>
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
    </React.Fragment>
  );
}

function PreviewWord() {
  return (
    <React.Fragment>
      <View style={{ margin: 8, height: 50, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee' }}>
        <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
      </View>
    </React.Fragment>
  );
}