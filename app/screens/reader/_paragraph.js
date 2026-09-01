var currentSentenceSound = null;
var currentSentenceSoundKey = null;
var currentSentenceSoundOwner = null;

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
    if (!appStore.has_subscription) {
      AppAlert.alert(
        'Озвучка предложений доступна при наличии PRO-доступа',
        '',
        [
          { text: 'Купить PRO-доступ', onPress: this.props.openSubscription },
          { text: 'Отменить', style: 'cancel' }
        ]
      );
      return;
    }

    var soundKey = this.props.book_id + '_' + this.props.data['name'] + '_' + sentenceIndex;

    // Если нажали на уже играющее предложение — остановить
    if (currentSentenceSoundKey === soundKey && currentSentenceSound) {
      currentSentenceSound.release();
      currentSentenceSound = null;
      currentSentenceSoundKey = null;
      currentSentenceSoundOwner = null;
      readerStore.setCurrentSpeaking(null);
      this.stopPulseAnimation();
      return;
    }

    // Как на сайте: одновременно воспроизводится только один готовый аудиофайл.
    if (currentSentenceSound) {
      currentSentenceSound.release();
      if (currentSentenceSoundOwner) currentSentenceSoundOwner.stopPulseAnimation();
    }
    currentSentenceSound = null;
    currentSentenceSoundKey = null;
    currentSentenceSoundOwner = null;

    readerStore.setCurrentSpeaking({ p: this.props.data['name'], i: sentenceIndex });
    this.startPulseAnimation();

    var url = HOST + '/voiceover_books/' + this.props.book_id + '/' + this.props.data['name'] + '/' + sentenceIndex + '.mp3';
    var sound = new AppSound(url, '', error => {
      if (currentSentenceSound !== sound) {
        sound.release();
        return;
      }

      if (error || sound.getDuration() <= 0) {
        appStore.showError('Озвучка не найдена');
        sound.release();
        currentSentenceSound = null;
        currentSentenceSoundKey = null;
        currentSentenceSoundOwner = null;
        readerStore.setCurrentSpeaking(null);
        this.stopPulseAnimation();
        return;
      }

      sound.setVolume(1);
      sound.play(success => {
        if (!success) appStore.showError('Ошибка воспроизведения');
        if (currentSentenceSound === sound) {
          sound.release();
          currentSentenceSound = null;
          currentSentenceSoundKey = null;
          currentSentenceSoundOwner = null;
          readerStore.setCurrentSpeaking(null);
          this.stopPulseAnimation();
        } else {
          sound.release();
        }
      });
    }, () => {
      if (currentSentenceSound === sound) {
        currentSentenceSound = null;
        currentSentenceSoundKey = null;
        currentSentenceSoundOwner = null;
        readerStore.setCurrentSpeaking(null);
        this.stopPulseAnimation();
      }
    });

    currentSentenceSound = sound;
    currentSentenceSoundKey = soundKey;
    currentSentenceSoundOwner = this;
  }

  async componentDidMount() {
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
    if (currentSentenceSoundOwner === this && currentSentenceSound) {
      currentSentenceSound.release();
      currentSentenceSound = null;
      currentSentenceSoundKey = null;
      currentSentenceSoundOwner = null;
      readerStore.setCurrentSpeaking(null);
    }
  }

  async addBookmark() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addBookmark', { bookmark: 'bookmark_' + this.props.book_id + '_' + this.props.data['name'] });

      if (readerStore.bookmark == this.props.data['name']) {
        this.props.setBookmark(false);
        var storedBookmark = await new Storage().get('bookmark_' + this.props.book_id, '{}');
        storedBookmark = JSON.parse(storedBookmark);
        await this.deleteBookmarkKey('bookmark_' + this.props.book_id);
        await new Storage().remove('bookmark_' + this.props.book_id);
        await SyncManager.enqueue('bookmark', 'delete', {
          book_id: this.props.book_id
        }, storedBookmark.version);
        await SyncManager.flush(this.props.current_user.id);
      } else {
        var previousBookmark = await new Storage().get('bookmark_' + this.props.book_id, '{}');
        previousBookmark = JSON.parse(previousBookmark);
        var bookmarkPayload = {
          book_id: this.props.book_id,
          page: this.props.page,
          paragraph: this.props.data['name']
        };

        await new Storage().set('bookmark_' + this.props.book_id, JSON.stringify({
          book_id: this.props.book_id,
          book_name: this.props.book_name,
          page: this.props.page,
          paragraph: this.props.data['name'],
          version: previousBookmark.version,
          offline: true
        }));
        await this.addBookmarkToKeys('bookmark_' + this.props.book_id);
        await SyncManager.enqueue('bookmark', 'upsert', bookmarkPayload, previousBookmark.version);
        await SyncManager.flush(this.props.current_user.id);
        await this.props.setBookmark(this.props.data['name']);
      }

    }
  }

  async addBookmarkToKeys(value) {
    let bookmarks_keys = await new Storage().get('bookmarks_keys');
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

    await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  async deleteBookmarkKey(value) {
    var bookmarks_keys = await new Storage().get('bookmarks_keys', '[]');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf(value);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
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
            <AppIcon
              icon={BookmarkIcon}
              size={20}
              color={readerStore.bookmark == this.props.data['name'] ? app_theme_colors.red : readerStore.secondColorTheme}
              style={readerScreenStyles.bookmarkImage}
            />

          </TouchableOpacity>
          <View style={[readerScreenStyles.sentencesContainer, { justifyContent: readerStore.textAlign }]}>
            <View style={readerScreenStyles.sentenceIndent}></View>
            {this.props.data['sentences'].map((sentence, index) =>
              <React.Fragment key={index}>
                {appStore.has_internet ? (
                  <TouchableOpacity onPress={() => this.speakSentence(sentence, index)} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Animated.View style={this.isSpeaking(index) && { transform: [{ scale: this.scaleAnim }] }}>
                      <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color={this.isSpeaking(index) ? app_theme_colors.red : readerStore.textColorTheme} />
                    </Animated.View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => AppAlert.alert('Нет подключения к интернету!')} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color="#aaa" />
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
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => this.translateText(sentence['tr'])}
                    style={readerScreenStyles.translateButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon icon={EllipsisVerticalIcon} size={readerStore.translate_icon_size} color='#f05458' />
                  </TouchableOpacity>
                }

              </React.Fragment>
            )}


            <TouchableOpacity
              activeOpacity={1}
              onPress={() => this.translateText(this.state.paragraph_translate)}
              style={readerScreenStyles.translateButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon icon={EllipsisIcon} size={readerStore.translate_icon_size} color='#f05458' />
            </TouchableOpacity>


          </View>
        </View>
      </React.Fragment>
    );
  }
});
