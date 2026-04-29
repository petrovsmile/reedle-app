const Paragraph = observer(class Paragraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sentences: false,
      paragraph_translate: [],
    }

    // Animated value для пульсирования иконки озвучки
    this.scaleAnim = new Animated.Value(1);
  }

  isSpeaking(sentenceIndex) {
    var cur = readerStore.currentSpeaking;
    return cur && cur.p === this.props.data['name'] && cur.i === sentenceIndex;
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

  speakSentence(sentence, sentenceIndex) {
    var text = (sentence['b'] || []).map(function (b) { return b['v'] || ''; }).join('');
    if (!text || !text.trim()) return;

    // Если нажали на уже играющее предложение — остановить
    if (this.isSpeaking(sentenceIndex)) {
      Speech.stop();
      readerStore.setCurrentSpeaking(null);
      this.stopPulseAnimation();
      return;
    }

    // Остановить текущую озвучку и запустить новую.
    Speech.stop();
    readerStore.setCurrentSpeaking({ p: this.props.data['name'], i: sentenceIndex });
    this.startPulseAnimation();

    var applyAndSpeak = function () {
      try { Speech.speak(text.trim()); } catch (e) {}
    };

    // configure вызываем ОДИН РАЗ на голос — при смене или первом запуске.
    if (readerStore.ttsVoice && !readerStore.ttsVoiceApplied) {
      try {
        Speech.configure({ voiceId: readerStore.ttsVoice });
        readerStore.setTtsVoiceApplied(true);
      } catch (e) {}
      applyAndSpeak();
    } else {
      applyAndSpeak();
    }
  }

  async componentDidMount() {
    this._ttsFinish = Speech.onFinish(() => {
      readerStore.setCurrentSpeaking(null);
    });
    var paragraph_translate = [];
    for (const s in this.props.data['sentences']) {
      paragraph_translate.push(this.props.data['sentences'][s]['tr']);
    }

    this.setState({
      sentences: this.props.data['sentences'],
      paragraph_translate: paragraph_translate,
    });
  }

  componentWillUnmount() {
    if (this._ttsFinish) this._ttsFinish.remove();
  }

  async addBookmark() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addBookmark', { bookmark: 'bookmark_' + this.props.book_id + '_' + this.props.data['name'] });

      if (readerStore.bookmark == this.props.data['name']) {
        this.props.setBookmark(false);

        this.deleteBookmarkKey('bookmark_' + this.props.book_id);

        new Storage().remove('bookmark_' + this.props.book_id);

        await new Request('/api/v1/bookmarks', {
          book_id: this.props.book_id,
          user_id: this.props.current_user.id
        }, {
          desciption_error: 'Закладка удалена только с этого устройства.'
        }).delete();
      } else {
        var add_to_server = await new Request('/api/v1/bookmarks', {
          book_id: this.props.book_id,
          user_id: this.props.current_user.id,
          page: this.props.page,
          paragraph: this.props.data['name']
        }, {
          desciption_error: 'Закладка добавлена только на этом устройстве.'
        }).post();

        await new Storage().set('bookmark_' + this.props.book_id, JSON.stringify({
          book_id: this.props.book_id,
          book_name: this.props.book_name,
          page: this.props.page,
          paragraph: this.props.data['name'],
          offline: add_to_server == false
        }));
        await this.addBookmarkToKeys('bookmark_' + this.props.book_id);

        await this.props.setBookmark(this.props.data['name']);
      }

    }
  }

  async addBookmarkToKeys(value) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);

      var index = bookmarks_keys.indexOf(value);
      if (index > -1) {
        bookmarks_keys.splice(index, 1);
      }
    }

    bookmarks_keys.unshift(value);

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  async deleteBookmarkKey(value) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf(value);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  translateWord(word_id) {
    word_id = parseInt(word_id);

    var word = readerStore.list_words[word_id];

    AppMetrica.reportEvent('translateWord', { word: word });

    var transcription = word.ts;

    if (word != undefined) {
      if (word.ts != null) {
        if (word.ts.length == 0) {
          transcription = null;
        }
      }

      this.props.openTranslateWord(
        word.o,
        word.tr,
        transcription,
      );
    }
  }

  translateText(translate) {
    AppMetrica.reportEvent('translateText', { platform: Platform.OS });

    this.props.openTranslateSentence(translate);
  }

  render() {

    return (

      <React.Fragment>
        {(readerStore.page == 1 && this.props.data['name'] == 1) &&
          <View style={readerScreenStyles.bookTitle}>
            <Text style={[readerScreenStyles.bookTitleText, { color: readerStore.textColorTheme }]}>{this.props.book_name_en}</Text>
          </View>
        }
        <View style={readerScreenStyles.paragraphRow}>
          <TouchableOpacity onPress={() => this.addBookmark(this.props.data['name'])} style={readerScreenStyles.bookmarkButton}>
            <Text style={[readerScreenStyles.bookmarkNumber, { color: readerStore.secondColorTheme }, (readerStore.bookmark == this.props.data['name']) && readerScreenStyles.bookmarkNumberActive]}>{this.props.data['name']}</Text>
            {readerStore.bookmark == this.props.data['name'] ? (
              <Image
                style={readerScreenStyles.bookmarkImage}
                source={require('./app/images/reader/bookmark-active.png')}
              />
            ) : (
              <Image
                style={readerScreenStyles.bookmarkImage}
                source={require('./app/images/reader/bookmark.png')}
              />
            )}

          </TouchableOpacity>
          <View style={[readerScreenStyles.sentencesContainer, { justifyContent: readerStore.textAlign }]}>
            <View style={readerScreenStyles.sentenceIndent}></View>
            {this.props.data['sentences'].map((sentence, index) =>
              <React.Fragment key={index}>
                {appStore.has_internet ? (
                  <TouchableOpacity onPress={() => this.speakSentence(sentence, index)} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Animated.Image
                      style={[
                        { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size },
                        this.isSpeaking(index) && {
                          tintColor: '#f05458',
                          transform: [{ scale: this.scaleAnim }]
                        }
                      ]}
                      source={require('./app/images/reader/voiceover.png')}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => Alert.alert('Нет подключения к интернету!')} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image
                      style={{ width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }}
                      source={require('./app/images/reader/voiceover-limited.png')}
                    />
                  </TouchableOpacity>
                )}
                {sentence['b'].map((block, index) => {

                  var past_value = "";
                  if (sentence['b'][index - 1] != undefined) {
                    past_value = sentence['b'][index - 1]['v'];
                  }

                  return (
                    <React.Fragment key={index} >
                      {block['w'] != undefined &&
                        <TouchableWithoutFeedback onPress={() => this.translateWord(block['w'])}>
                          <View style={[past_value != '"' && past_value != "'" ? readerScreenStyles.wordBlockWithMargin : readerScreenStyles.wordBlock, { borderBottomColor: readerStore.secondColorTheme }]}>
                            <Text style={{ fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }}>{block['v']}</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      }
                      {block['w'] == undefined &&
                        <Text style={[readerScreenStyles.punctuation, { fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }]}>{block['v']}</Text>
                      }
                    </React.Fragment>
                  );
                }
                )}

                {this.props.data['sentences'].length > 1 &&
                  <TouchableWithoutFeedback onPress={() => this.translateText(sentence['tr'])}>
                    <Image
                      style={[readerScreenStyles.translateIcon, { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }]}
                      source={require('./app/images/reader/sentence-translate.png')}
                    />
                  </TouchableWithoutFeedback>
                }

              </React.Fragment>
            )}


            <TouchableWithoutFeedback onPress={() => this.translateText(this.state.paragraph_translate)}>
              <Image
                style={[readerScreenStyles.translateIcon, { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }]}
                source={require('./app/images/reader/paragraph-translate.png')}
              />
            </TouchableWithoutFeedback>


          </View>
        </View>
      </React.Fragment>
    );
  }
});