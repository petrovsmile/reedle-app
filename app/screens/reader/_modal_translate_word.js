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

  componentWillUnmount() {
    if (this.voiceoverSound) {
      this.voiceoverSound.release();
      this.voiceoverSound = null;
    }
    this.voiceover_playing_lock = false;
  }

  async check_count_voiceover() {
    if (this.props.has_subscription) {
      this.setState({
        count_voiceover: 0,
        words: []
      });
      return;
    }

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

  prepareVoiceoverAudioSession() {
    try {
      Sound.setCategory('Playback', true);
    } catch (e) {
      Sound.setCategory('Playback');
    }

    if (Sound.setActive) {
      try {
        Sound.setActive(true);
      } catch (e) {}
    }
  }

  async voice_word(original) {
    if (this.voiceover_playing_lock) {
      return;
    }

    if (!appStore.has_internet) {
      appStore.showError('Отсутствует подключение к интернету');
      return;
    }

    this.voiceover_playing_lock = true;

    AppMetrica.reportEvent('Voiceover', {
      original: original
    });

    this.setState({
      voiceover_playing: true
    });
    this.startPulseAnimation();

    var pesponse = await new Request('/api/v1/books/voiceover_url_by_word', { original: original }, { do_not_show_error: true }).get();

    if (!pesponse || !pesponse.url) {
      appStore.showError(
        appStore.has_internet ? 'Озвучка не найдена' : 'Отсутствует подключение к интернету'
      );
      this.setState({ voiceover_playing: false });
      this.stopPulseAnimation();
      this.voiceover_playing_lock = false;
      return;
    }

    var url = HOST + pesponse.url;

    {
      this.prepareVoiceoverAudioSession();

      if (this.voiceoverSound) {
        this.voiceoverSound.release();
        this.voiceoverSound = null;
      }

      var sound = new AppSound(url, '', error => {
        if (this.voiceoverSound !== sound) {
          sound.release();
          return;
        }

        if (error) {
          appStore.showError('Ошибка воспроизвездения');
          sound.release();
          this.voiceoverSound = null;
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
          return;
        }

        if (sound.getDuration() <= 0) {
          appStore.showError('Озвучка не найдена');
          sound.release();
          this.voiceoverSound = null;
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
          return;
        }

        sound.setVolume(1);

        sound.play((success) => {
          if (success) {
            if (!this.props.has_subscription && !this.state.words.includes(original)) {
              var new_words = [...this.state.words, original];
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
          this.voiceover_playing_lock = false;

          if (this.voiceoverSound === sound) {
            sound.release();
            this.voiceoverSound = null;
          } else {
            sound.release();
          }
        });
      }, () => {
        if (this.voiceoverSound === sound) {
          this.voiceoverSound = null;
          this.setState({ voiceover_playing: false });
          this.stopPulseAnimation();
          this.voiceover_playing_lock = false;
        }
      })
      this.voiceoverSound = sound;
    }
  }

  async addWordToDictionary() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addWordToDictionary', { word: this.props.original });

      var previousWord = await new Storage().get('word_' + this.props.original, '{}');
      previousWord = JSON.parse(previousWord);
      var wordPayload = {
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate
      };

      await new Storage().set('word_' + this.props.original, JSON.stringify({
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate,
        version: previousWord.version,
        offline: true
      }));
      await this.addWordToKeys('word_' + this.props.original);
      await SyncManager.enqueue('word', 'upsert', wordPayload, previousWord.version);
      await SyncManager.flush(this.props.current_user.id);

      this.props.setWordInDictionary(true);

      this.setState({
        count_words: this.state.count_words + 1
      });
    }
  }


  async addWordToKeys(value) {
    var words_keys = await new Storage().get('words_keys');
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

    await new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  async deleteWordFromDictionary() {
    this.props.setWordInDictionary(false);

    var storedWord = await new Storage().get('word_' + this.props.original, '{}');
    storedWord = JSON.parse(storedWord);
    await this.deleteBookmarkKey('word_' + this.props.original);

    this.setState({
      count_words: this.state.count_words - 1
    });

    await new Storage().remove('word_' + this.props.original);
    await SyncManager.enqueue('word', 'delete', {
      original: this.props.original
    }, storedWord.version);
    await SyncManager.flush(this.props.current_user.id);
  }

  async deleteBookmarkKey(value) {
    var words_keys = await new Storage().get('words_keys', '[]');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf(value);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    await new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  openSubscription() {
    this.props.close();
    setTimeout(() => this.props.openSubscription(), 100);
  }


  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
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
                      {(this.state.count_voiceover < 15 || this.props.has_subscription) ? (
                        <TouchableWithoutFeedback onPress={() => this.voice_word(this.props.original)}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Animated.View style={this.state.voiceover_playing && { transform: [{ scale: this.scaleAnim }] }}>
                              <AppIcon icon={VolumeIcon} size={24} color={this.state.voiceover_playing ? app_theme_colors.red : readerStore.textColorTheme} />
                            </Animated.View>
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
                        <TouchableWithoutFeedback onPress={() => AppAlert.alert('Лимит на сегодня закончился', 'Оплатите подписку, чтобы пользоваться озвучкой без ограничений.\nБесплатно доступно 15 слов в день.')}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <AppIcon icon={VolumeIcon} size={24} color="#aaa" />
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </React.Fragment>
                  </React.Fragment>
                ) : (
                  <TouchableWithoutFeedback onPress={() => appStore.showError('Отсутствует подключение к интернету')}>
                    <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                      <AppIcon icon={VolumeIcon} size={24} color="#aaa" />
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
                    <View style={{ width: 230, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 5, marginBottom: 5 }}>
                      <Text style={{ color: appThemeStore.colors.text, fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 5 }}>
                        Слово добавлено в словарь
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => this.deleteWordFromDictionary()}>
                      <View style={{ borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, margin: 10, marginTop: 0, height: 32, width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                        <Text style={{ color: appThemeStore.colors.text, lineHeight: 30, textAlign: 'center' }}>Удалить из словаря</Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <View style={{ flexDirection: 'row', height: 32, width: 230, margin: 10, marginTop: 10, alignItems: 'center' }}>
                      {(this.state.count_words < 30 || this.props.has_subscription) ? (
                        <TouchableOpacity onPress={() => this.addWordToDictionary()}>
                          <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                            <Text style={{ color: appThemeStore.colors.text, lineHeight: 30, textAlign: 'center' }}>Добавить в словарь</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                          <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Вы исчерпали лимит</Text>
                        </View>
                      )}
                      {this.props.has_subscription == false &&
                        <TouchableOpacity onPress={() => this.setState({ show_limits_information: !this.state.show_limits_information })}>
                          <View style={{ width: 24, height: 24, margin: 6, borderWidth: 1, borderColor: appThemeStore.colors.border, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 4, overflow: 'hidden' }}>
                            {this.state.show_limits_information ? (
                              <AppIcon icon={CloseIcon} size={20} color={appThemeStore.colors.text} style={{ margin: 1 }} />
                            ) : (
                              <Text style={{ color: appThemeStore.colors.text, fontSize: 14, lineHeight: 22, textAlign: 'center' }}>?</Text>
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

                        <TouchableOpacity onPress={() => this.openSubscription()}>
                          <Text style={{ color: '#f05458', fontSize: 12, marginTop: 4, textAlign: 'center', }}>Приобрести PRO-доступ</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  </React.Fragment>
                )}

              </View>
            </TouchableOpacity>

            {this.props.has_subscription == false &&
              <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                {adSizeMini && (
                  <BannerView
                    size={adSizeMini}
                    adRequest={{ adUnitId: AD_UNIT_BANNER }}
                  />
                )}
              </View>
            }
          </View>
        </TouchableOpacity>
      </Modal >
    )
  }
});
