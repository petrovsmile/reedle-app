const ModalTranslateWord = observer(class ModalTranslateWord extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      voiceover_playing: false,
      count_voiceover: 0,
      count_words: 0,
      words: [],
      show_limits_information: false
    }

    // Animated value для пульсирования иконки озвучки слова
    this.scaleAnim = new Animated.Value(1);
  }

  async componentDidMount() {
    if (!this.props.has_subscription) {
      this.check_count_voiceover();
    }

    var words = await new Storage().get('words_keys', '[]');
    words = JSON.parse(words);

    this.setState({
      count_words: words.length
    });
  }

  async check_count_voiceover() {
    var date_today = moment().format("YYYY-MM-DD");
    var count_voiceover_hash = await new Storage().get('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    count_voiceover_hash = JSON.parse(count_voiceover_hash);

    if (count_voiceover_hash['date'] != date_today) {
      count_voiceover_hash['count'] = 0;
      count_voiceover_hash['words'] = [];

      new Storage().set('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    }

    this.setState({
      count_voiceover: count_voiceover_hash['count'],
      words: count_voiceover_hash['words']
    });
  }

  startPulseAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  stopPulseAnimation() {
    this.scaleAnim.setValue(1);
  }

  async voice_word(original) {
    AppMetrica.reportEvent('Voiceover', {
      original: original
    });

    this.setState({
      voiceover_playing: true
    });
    this.startPulseAnimation();

    var pesponse = await new Request('/api/v1/books/voiceover_url_by_word', { original: original }, { do_not_show_error: true }).get();

    url = HOST + pesponse.url;

    if (url == null) {
      Alert.alert('Озвучка не найдена');
      this.setState({
        voiceover_playing: false
      });
      this.stopPulseAnimation();
    } else {
      const sound = new Sound(url, '', error => {
        if (error) {
          appStore.showError('Ошибка воспроизвездения');
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
        }

        sound.play((success) => {
          if (success) {
            if (!this.state.words.includes(original)) {
              var new_words = this.state.words;
              new_words.push(original);
              var new_count = this.state.count_voiceover + 1;

              new Storage().set('count_voiceover', JSON.stringify(
                {
                  date: moment().format("YYYY-MM-DD"),
                  count: new_count,
                  words: new_words
                }
              ));

              this.setState({
                count_voiceover: new_count,
                words: new_words
              });
            }
          }

          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
        });
      })
    }
  }

  async addWordToDictionary() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addWordToDictionary', { word: this.props.original });

      var add_to_server = await new Request('/api/v1/dictionary/words', {
        original: this.props.original,
        user_id: this.props.current_user.id
      }, {
        desciption_error: 'Слово добавлено только на этом устройстве.'
      }).post();

      await new Storage().set('word_' + this.props.original, JSON.stringify({
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate,
        offline: add_to_server == false
      }));
      await this.addWordToKeys('word_' + this.props.original);

      this.props.setWordInDictionary(true);

      this.setState({
        count_words: this.state.count_words + 1
      });
    }
  }


  async addWordToKeys(value) {
    words_keys = await new Storage().get('words_keys');
    if (words_keys == undefined) {
      words_keys = []
    } else {
      words_keys = JSON.parse(words_keys);

      var index = words_keys.indexOf(value);
      if (index > -1) {
        words_keys.splice(index, 1);
      }
    }

    words_keys.unshift(value);

    new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  async deleteWordFromDictionary() {
    this.props.setWordInDictionary(false);

    this.deleteBookmarkKey('word_' + this.props.original);

    this.setState({
      count_words: this.state.count_words - 1
    });

    new Storage().remove('word_' + this.props.original);

    await new Request('/api/v1/dictionary/words', {
      original: this.props.original,
      user_id: this.props.current_user.id
    }, {
      desciption_error: 'Слово удалено только с этого устройства.'
    }).delete();
  }

  async deleteBookmarkKey(value) {
    words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf(value);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    new Storage().set('words_keys', JSON.stringify(words_keys));
  }


  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <TouchableWithoutFeedback>
            <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
              <View style={{
                margin: 20,
                backgroundColor: readerStore.backgroundColorTheme,
                borderRadius: 10,
                alignItems: "center",
                width: 250,
                shadowRadius: 4,
                overflow: 'hidden',
                elevation: 5
              }}>
                {appStore.has_internet ? (
                  <React.Fragment>
                    <React.Fragment>
                      {this.state.count_voiceover < 15 ? (
                        <TouchableWithoutFeedback onPress={() => this.voice_word(this.props.original)}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Animated.Image
                              style={[
                                { width: 24, height: 24 },
                                this.state.voiceover_playing && {
                                  transform: [{ scale: this.scaleAnim }]
                                }
                              ]}
                              source={this.state.voiceover_playing ? require('./app/images/reader/voiceover-active.png') : require('./app/images/reader/voiceover.png')}
                            />
                            {!this.props.has_subscription &&
                              <View style={{ marginTop: 5, width: 24 }}>
                                <Text style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>
                                  {15 - this.state.count_voiceover}/15
                                </Text>
                              </View>
                            }
                          </View>
                        </TouchableWithoutFeedback>
                      ) : (
                        <TouchableWithoutFeedback onPress={() => Alert.alert('Лимт на сегодня закончился.\nОплатите подписку, чтобы пользоваться озвучкой без ограничений\nБесплатно доступно 15 слов в день.')}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Image style={{ width: 24, height: 24 }}
                              source={require('./app/images/reader/voiceover-limited.png')} />
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </React.Fragment>
                  </React.Fragment>
                ) : (
                  <TouchableWithoutFeedback onPress={() => Alert.alert('Нет подключения к интернету!')}>
                    <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                      <Image style={{ width: 24, height: 24 }}
                        source={require('./app/images/reader/voiceover-limited.png')} />
                    </View>
                  </TouchableWithoutFeedback>
                )}

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#f05458', fontSize: 19 }}>{this.props.original}</Text>
                </View>
                {this.props.transcription != null &&
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ color: '#aaa' }}>[{this.props.transcription}]</Text>
                  </View>
                }
                <View style={{ paddingLeft: 10, paddingRight: 10, marginTop: 10 }}>
                  <Text style={{ color: readerStore.textColorTheme, textAlign: 'center' }}>{this.props.translate}</Text>
                </View>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 10, marginTop: 15, height: 40, backgroundColor: '#f05458', width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>

                {this.props.word_in_dictionary ? (
                  <React.Fragment>
                    <View style={{ width: 230, backgroundColor: '#eee', borderRadius: 5, marginBottom: 5 }}>
                      <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 5 }}>
                        Слово добавлено в словарь
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => this.deleteWordFromDictionary()}>
                      <View style={{ borderWidth: 1, borderColor: '#ddd', margin: 10, marginTop: 0, height: 32, width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                        <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Удалить из словаря</Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <View style={{ flexDirection: 'row', height: 32, width: 230, margin: 10, marginTop: 10, alignItems: 'center' }}>
                      {(this.state.count_words < 30 || this.props.has_subscription) ? (
                        <TouchableOpacity onPress={() => this.addWordToDictionary()}>
                          <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, borderWidth: 1, borderColor: '#ddd', height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                            <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Добавить в словарь</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                          <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Вы исчерпали лимит</Text>
                        </View>
                      )}
                      {this.props.has_subscription == false &&
                        <TouchableOpacity onPress={() => this.setState({ show_limits_information: !this.state.show_limits_information })}>
                          <View style={{ width: 24, height: 24, margin: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' }}>
                            {this.state.show_limits_information ? (
                              <Image style={{ width: 22, height: 22}} source={require('./app/images/books/dictionary_info_close.png')} />
                            ) : (
                              <Image style={{ width: 22, height: 22 }} source={require('./app/images/books/dictionary_info.png')} />
                            )}
                          </View>
                        </TouchableOpacity>
                      }
                    </View>

                    {this.state.show_limits_information &&
                      <View style={{ margin: 10, marginTop: 0 }}>
                        <View><Text style={{ textAlign: 'center', fontSize: 12 }}>Без PRO-доступа вы можете</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>добавить до 30 слов</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>и озвучить до 15 слов в день</Text></View>

                        <View><Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12 }}>Вы добавили {this.state.count_words}/30</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>Вы озвучили {this.state.count_voiceover}/15</Text></View>

                        <TouchableOpacity onPress={() => this.props.openSubscription()}>
                          <Text style={{ color: '#f05458', fontSize: 12, marginTop: 4, textAlign: 'center', }}>Приобрести PRO-доступ</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  </React.Fragment>
                )}

              </View>

              {this.props.has_subscription == false &&
                <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {adSize && (
                    <BannerView
                      adUnitId={'R-M-1281415-12'}
                      size={adSize}
                      adRequest={{}}
                    />
                  )}
                </View>
              }
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal >
    )
  }
});