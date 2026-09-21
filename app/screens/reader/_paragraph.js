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
    this.stopPulseAnimation();
    this.pulseAnimation = Animated.loop(
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
    );
    this.pulseAnimation.start();
  }

  stopPulseAnimation() {
    if (this.pulseAnimation) {
      this.pulseAnimation.stop();
      this.pulseAnimation = null;
    }
    this.scaleAnim.stopAnimation();
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
    this.stopPulseAnimation();
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

  displayBlocks(blocks) {
    var result = [];
    var contractionSuffixes = ['s', 'm', 're', 've', 'd', 'll'];

    for (var index = 0; index < blocks.length; index++) {
      var block = blocks[index];
      var previousBlock = result[result.length - 1];
      var value = String(block['v'] || '');
      var normalizedValue = value.replace(/’/g, "'").toLowerCase();
      var nextBlock = blocks[index + 1];
      var nextValue = nextBlock ? String(nextBlock['v'] || '') : '';
      var normalizedNextValue = nextValue.replace(/’/g, "'").toLowerCase();
      var followingBlock = blocks[index + 2];
      var followingValue = followingBlock ? String(followingBlock['v'] || '').toLowerCase() : '';
      var hasPreviousWord = previousBlock && previousBlock['w'] != undefined;
      var isJoinedContraction = normalizedValue == "n't" || (
        normalizedValue[0] == "'" && contractionSuffixes.includes(normalizedValue.slice(1))
      );

      // The parser may return a contraction as one token ("'re" / "n't")
      // or split its apostrophe and ending into separate blocks.
      if (hasPreviousWord && isJoinedContraction) {
        previousBlock['v'] += block['v'];
      } else if (hasPreviousWord && normalizedValue == "'" && contractionSuffixes.includes(normalizedNextValue)) {
        previousBlock['v'] += block['v'] + nextBlock['v'];
        index++;
      } else if (hasPreviousWord && normalizedValue == 'n' && normalizedNextValue == "'t") {
        previousBlock['v'] += block['v'] + nextBlock['v'];
        index++;
      } else if (hasPreviousWord && normalizedValue == 'n' && normalizedNextValue == "'" && followingValue == 't') {
        previousBlock['v'] += block['v'] + nextBlock['v'] + followingBlock['v'];
        index += 2;
      } else {
        result.push({ ...block });
      }
    }
    return result;
  }

  render() {

    return (

      <React.Fragment>
        {(readerStore.page == 1 && this.props.data['name'] == 1) &&
          <View style={{ marginTop: 24, paddingLeft: 40, paddingRight: 24 }}>
            <Text style={[{ fontSize: 18, fontFamily: 'LibreBaskerville-Regular' }, { color: readerStore.textColorTheme }]}>{this.props.book_name_en}</Text>
          </View>
        }
        <View style={{ marginTop: 16, flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => this.addBookmark(this.props.data['name'])} style={{ marginTop: 8, paddingRight: 8, paddingLeft: 16 }}>
            <Text style={[{ fontSize: 18, fontFamily: 'Times', textAlign: 'center' }, { color: readerStore.secondColorTheme }, readerStore.bookmark == this.props.data['name'] && { color: app_theme_colors.red }]}>{this.props.data['name']}</Text>
            <AppIcon
              icon={BookmarkIcon}
              size={24}
              color={readerStore.bookmark == this.props.data['name'] ? app_theme_colors.red : readerStore.secondColorTheme}
              fill={readerStore.bookmark == this.props.data['name'] ? app_theme_colors.red : 'none'}
              style={{ height: 24, width: 24, marginTop: 8 }}
            />

          </TouchableOpacity>
          <View style={[{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginRight: 16 }, { justifyContent: readerStore.textAlign }]}>
            {this.props.data['sentences'].map((sentence, index) =>
              <React.Fragment key={index}>
                {this.props.voiceover && appStore.has_internet ? (
                  <TouchableOpacity onPress={() => this.speakSentence(sentence, index)} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Animated.View style={this.isSpeaking(index) && { transform: [{ scale: this.scaleAnim }] }}>
                      <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color={this.isSpeaking(index) ? app_theme_colors.red : readerStore.textColorTheme} />
                    </Animated.View>
                  </TouchableOpacity>
                ) : this.props.voiceover ? (
                  <TouchableOpacity onPress={() => AppAlert.alert('Нет подключения к интернету!')} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <AppIcon icon={VolumeIcon} size={readerStore.translate_icon_size} color="#aaa" />
                  </TouchableOpacity>
                ) : null}
                {this.displayBlocks(sentence['b']).map((block, index, blocks) => {
                  const nextBlock = blocks[index + 1];
                  const marginRight = block['v'] === '.' || block['v'] === "'" || block['v'] === '"' || block['v'] === '?' || block['v'] === '!' || (nextBlock && (nextBlock['v'] === '.' || nextBlock['v'] === ',' || nextBlock['v'] === ';' || nextBlock['v'] === ':')) ? 4 : 8;
                  return (
                    <React.Fragment key={index} >
                      {block['w'] != undefined &&
                        <TouchableWithoutFeedback onPress={() => this.translateWord(block['w'])}>
                          <View style={{ borderBottomColor: readerStore.secondColorTheme, borderBottomWidth: 2, marginTop: 8, marginRight, boxSizing: 'border-box', height: readerStore.translate_icon_size }}>
                            <Text style={{ fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme, lineHeight: readerStore.translate_icon_size, }}>{block['v']}</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      }
                      {block['w'] == undefined &&
                        <Text style={[{ marginRight }, { marginTop: 8 }, { fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme, lineHeight: readerStore.translate_icon_size, }]}>{block['v']}</Text>
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
                    <AppIcon icon={EllipsisVerticalIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
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
              <AppIcon icon={EllipsisIcon} size={readerStore.translate_icon_size} color={app_theme_colors.red} />
            </TouchableOpacity>


          </View>
        </View>
      </React.Fragment>
    );
  }
});
