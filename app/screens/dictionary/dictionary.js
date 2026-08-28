class Dictionary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      words: [],
      do_not_find: false,
      sorting_by: 'date',
      hide_studied: true,
      learning: false,
      learning_questions: [],
      learning_index: 0,
      learning_answer: null,
      learning_correct: 0,
      learning_mistakes: [],
      learning_complete: false
    };

    this.storage_words = [];
  }

  async componentDidMount() {
    this.props.tabs.navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => this.openLearningFromHeader()}
          style={{
            height: 32,
            paddingHorizontal: 12,
            marginRight: 10,
            borderRadius: 6,
            backgroundColor: app_theme_colors.red,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Text style={{ color: '#FFF', fontSize: 13 }}>Учить слова</Text>
        </TouchableOpacity>
      )
    });

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

  openLearningFromHeader() {
    if (this.props.root.state.current_user == false) {
      this.setState({ auth_modal: true, auth_method: 'login' });
      return;
    }

    var source = this.state.words.filter(word => word.original && word.translate && word.studied !== true);
    if (source.length < 10) {
      AppAlert.alert(
        'Недостаточно слов',
        'Для тестирования должно быть добавлено в словарь не менее 10 неизученных слов.'
      );
      return;
    }

    this.props.stack.navigation.navigate('dictionary_learning', { words: this.state.words });
  }

  async getWords() {
    if (this._get_words_promise) return this._get_words_promise;
    this._get_words_promise = this._getWords().finally(() => { this._get_words_promise = null; });
    return this._get_words_promise;
  }

  async _getWords() {
    if (this.props.root.state.current_user != false) {
      this.setState({
        do_not_find: false,
        words: [],
      });

      this.storage_words = await this.getWordsFromStorage();
      await this.getWordsFromServer();
      var words = await this.getWordsFromStorage();

      if (this.state.sorting_by == 'alphabet') {
        words = words.sort((a, b) => a.original.localeCompare(b.original));
      } else {
        words = words.reverse();
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

      return word ? JSON.parse(word) : null;
    }));

    return words.filter(word => word != null);
  }

  async getWordsFromServer() {
    await SyncManager.syncWords(this.props.root.state.current_user.id);
  }

  async deleteWord(data) {
    var words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf('word_' + data.original);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    await new Storage().set('words_keys', JSON.stringify(words_keys));
    await new Storage().remove('word_' + data.original);
    await SyncManager.enqueue('word', 'delete', { original: data.original }, data.version);
    await SyncManager.flush(this.props.root.state.current_user.id);
    await this.getWords();
  }

  confirmDeleteWord(data) {
    AppAlert.confirm(
      'Вы уверены?',
      'Слово «' + data.original + '» будет удалено из словаря.',
      () => this.deleteWord(data),
      'Удалить'
    );
  }

  set_sorting_by(sorting_by) {
    this.setState({
      sorting_by: sorting_by
    }, function () {
      this.getWords();
    });
  }

  shuffle(items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temporary = result[i];
      result[i] = result[j];
      result[j] = temporary;
    }
    return result;
  }

  firstTranslation(translate) {
    return String(translate || '').split(/[,;]/)[0].trim();
  }

  async updateWordLearningState(word, changes) {
    var storageKey = 'word_' + word.original;
    var storedValue = await new Storage().get(storageKey, '{}');
    var storedWord = Object.assign({}, JSON.parse(storedValue), changes);
    await new Storage().set(storageKey, JSON.stringify(storedWord));

    this.setState({
      words: this.state.words.map(item => item.original == word.original ? Object.assign({}, item, changes) : item),
      learning_questions: this.state.learning_questions.map(question => (
        question.word.original == word.original
          ? Object.assign({}, question, { word: Object.assign({}, question.word, changes) })
          : question
      )),
      learning_mistakes: this.state.learning_mistakes.map(item => (
        item.original == word.original ? Object.assign({}, item, changes) : item
      ))
    });

    return storedWord;
  }

  async toggleWordStudied(word) {
    await this.updateWordLearningState(word, { studied: word.studied !== true });
  }

  async recordLearningShow(word) {
    if (!word || word.studied === true) return;

    var learningShows = Number(word.learning_shows || 0) + 1;
    var shouldPrompt = learningShows >= 10 && word.study_prompted !== true;
    var changes = { learning_shows: learningShows };
    if (shouldPrompt) {
      changes.study_prompted = true;
      changes.studied = true;
    }
    await this.updateWordLearningState(word, changes);

    if (shouldPrompt) {
      AppAlert.alert(
        'Слово изучено',
        'Вы правильно повторили «' + word.original + '» 10 раз.'
      );
    }
  }

  renderWordLearningProgress(word) {
    var repetitions = Math.min(Number(word.learning_shows || 0), 10);
    var remaining = Math.max(10 - repetitions, 0);
    var completed = word.studied === true;
    if (completed) return null;

    return (
      <View style={dictionaryStyles.wordLearningProgress}>
        <View style={dictionaryStyles.wordLearningProgressHeader}>
          <Text style={dictionaryStyles.wordLearningProgressText}>
            {'Осталось повторить: ' + remaining}
          </Text>
          <Text style={dictionaryStyles.wordLearningProgressCount}>{repetitions} из 10</Text>
        </View>
        <View style={[dictionaryStyles.wordLearningProgressTrack, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <View style={[
            dictionaryStyles.wordLearningProgressValue,
            { width: (repetitions * 10) + '%' }
          ]} />
        </View>
      </View>
    );
  }

  startLearning(words) {
    var source = (words || this.state.words).filter(word => word.original && word.translate && word.studied !== true);
    if (words == undefined && source.length < 10) {
      AppAlert.alert(
        'Недостаточно слов',
        'Для тестирования должно быть добавлено в словарь не менее 10 неизученных слов.'
      );
      return;
    }
    if (source.length == 0) {
      AppAlert.alert('Нет слов для повторения', 'Все слова отмечены как изученные.');
      return;
    }
    var selectedWords = this.shuffle(source).slice(0, 10);
    var questions = selectedWords.map(word => {
      var correctAnswer = this.firstTranslation(word.translate);
      var wrongAnswers = this.shuffle(source
        .filter(otherWord => otherWord.original != word.original)
        .map(otherWord => this.firstTranslation(otherWord.translate))
        .filter(translate => translate && translate != correctAnswer)
        .filter((translate, index, translations) => translations.indexOf(translate) == index))
        .slice(0, 3);

      return {
        word: word,
        correctAnswer: correctAnswer,
        answers: this.shuffle([correctAnswer].concat(wrongAnswers))
      };
    });

    this.setState({
      learning: true,
      learning_questions: questions,
      learning_index: 0,
      learning_answer: null,
      learning_correct: 0,
      learning_mistakes: [],
      learning_complete: false
    });
  }

  async selectLearningAnswer(answer) {
    if (this.state.learning_answer != null) return;

    var question = this.state.learning_questions[this.state.learning_index];
    var isCorrect = answer == question.correctAnswer;
    await new Promise(resolve => this.setState({
        learning_answer: answer,
        learning_correct: this.state.learning_correct + (isCorrect ? 1 : 0),
        learning_mistakes: isCorrect
          ? this.state.learning_mistakes
          : this.state.learning_mistakes.concat([question.word])
      }, resolve));

    if (isCorrect) {
      await this.recordLearningShow(question.word);
    }
  }

  nextLearningQuestion() {
    if (this.state.learning_index + 1 >= this.state.learning_questions.length) {
      this.setState({ learning_complete: true });
    } else {
      this.setState({
        learning_index: this.state.learning_index + 1,
        learning_answer: null
      });
    }
  }

  closeLearning() {
    this.setState({ learning: false });
  }

  renderLearning() {
    if (this.state.learning_complete) {
      return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={dictionaryStyles.learningContainer}>
          <Text style={dictionaryStyles.learningTitle}>Тест завершён</Text>
          <Text style={dictionaryStyles.learningResult}>
            Правильно: {this.state.learning_correct} из {this.state.learning_questions.length}
          </Text>
          {this.state.learning_mistakes.length > 0 &&
            <TouchableOpacity style={dictionaryStyles.learningPrimaryButton} onPress={() => this.startLearning(this.state.learning_mistakes)}>
              <Text style={dictionaryStyles.learningPrimaryButtonText}>Повторить ошибки</Text>
            </TouchableOpacity>
          }
          <TouchableOpacity style={dictionaryStyles.learningSecondaryButton} onPress={() => this.startLearning()}>
            <Text style={dictionaryStyles.learningSecondaryButtonText}>Новый тест</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dictionaryStyles.learningBackButton, { backgroundColor: appThemeStore.colors.backgroundLight }]} onPress={() => this.closeLearning()}>
            <Text style={[dictionaryStyles.learningBackButtonText, { color: appThemeStore.colors.text }]}>Вернуться в словарь</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    var question = this.state.learning_questions[this.state.learning_index];
    if (!question) return null;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={dictionaryStyles.learningContainer}>
        <View style={[dictionaryStyles.learningHeader, { justifyContent: 'flex-end' }]}>
          <Text style={dictionaryStyles.learningProgress}>
            {this.state.learning_index + 1} из {this.state.learning_questions.length}
          </Text>
        </View>
        <View style={[dictionaryStyles.learningCard, { backgroundColor: appThemeStore.colors.surface, borderColor: appThemeStore.colors.border }]}>
          <Text style={dictionaryStyles.learningWord}>{question.word.original}</Text>
          {question.word.transcription != null &&
            <Text style={dictionaryStyles.learningTranscription}>{question.word.transcription}</Text>
          }
          {this.renderWordLearningProgress(question.word)}
        </View>
        <Text style={dictionaryStyles.learningPrompt}>Выберите перевод</Text>
        {question.answers.map(answer => {
          var answerStyle = null;
          if (this.state.learning_answer != null) {
            if (answer == question.correctAnswer) {
              answerStyle = dictionaryStyles.learningAnswerCorrect;
            } else if (answer == this.state.learning_answer) {
              answerStyle = dictionaryStyles.learningAnswerWrong;
            }
          }

          return (
            <TouchableOpacity
              key={answer}
              disabled={this.state.learning_answer != null}
              style={[dictionaryStyles.learningAnswer, { backgroundColor: appThemeStore.colors.backgroundLight, borderColor: appThemeStore.colors.border }, answerStyle]}
              onPress={() => this.selectLearningAnswer(answer)}>
              <Text style={[dictionaryStyles.learningAnswerText, { color: answerStyle ? '#000' : appThemeStore.colors.text }]}>{answer}</Text>
            </TouchableOpacity>
          );
        })}
        {this.state.learning_answer != null &&
          <TouchableOpacity style={dictionaryStyles.learningPrimaryButton} onPress={() => this.nextLearningQuestion()}>
            <Text style={dictionaryStyles.learningPrimaryButtonText}>
              {this.state.learning_index + 1 == this.state.learning_questions.length ? 'Показать результат' : 'Следующее слово'}
            </Text>
          </TouchableOpacity>
        }
        <View style={{ height: 100 }}></View>
      </ScrollView>
    );
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
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
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: appThemeStore.colors.backgroundLight, borderRadius: 10 }} onPress={() => this.getWords()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center', color: appThemeStore.colors.text }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false && (this.state.learning ? this.renderLearning() :
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

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View>
                      <Text>Сортировать по:</Text>
                      <View style={{ height: 24, flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 }}>
                        <TouchableOpacity onPress={() => this.set_sorting_by('date')}>
                          <View style={[dictionaryStyles.button_sorting, { backgroundColor: this.state.sorting_by == 'date' ? app_theme_colors.red : appThemeStore.colors.backgroundLight, borderColor: this.state.sorting_by == 'date' ? app_theme_colors.red : appThemeStore.colors.border }]}>
                            <Text style={{ color: this.state.sorting_by == 'date' ? '#FFF' : appThemeStore.colors.text, fontSize: 12, lineHeight: 22 }}>дате добавления</Text>
                          </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.set_sorting_by('alphabet')}>
                          <View style={[dictionaryStyles.button_sorting, { backgroundColor: this.state.sorting_by == 'alphabet' ? app_theme_colors.red : appThemeStore.colors.backgroundLight, borderColor: this.state.sorting_by == 'alphabet' ? app_theme_colors.red : appThemeStore.colors.border, marginLeft: 8 }]}>
                            <Text style={{ color: this.state.sorting_by == 'alphabet' ? '#FFF' : appThemeStore.colors.text, fontSize: 12, lineHeight: 22 }}>по алфавиту</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ height: 24, flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                      <Text style={{ color: appThemeStore.colors.text, fontSize: 12, marginRight: 6 }}>Скрыть изученные</Text>
                      <Switch
                        style={{ transform: [{ scale: 0.75 }] }}
                        trackColor={{
                          false: appThemeStore.colors.backgroundLight,
                          true: app_theme_colors.red
                        }}
                        thumbColor="#aaa"
                        activeThumbColor="#aaa"
                        ios_backgroundColor={appThemeStore.colors.backgroundLight}
                        value={this.state.hide_studied}
                        onValueChange={(value) => this.setState({ hide_studied: value })}
                      />
                    </View>
                  </View>
                </View>


                <FlatList
                  style={{ flex: 1, zIndex: 0, paddingTop: 8 }}
                  refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => this.getWords()} />
                  }
                  showsHorizontalScrollIndicator={false}
                  scrollIndicatorInsets={{ right: 1 }}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  data={this.state.hide_studied ? this.state.words.filter(word => word.studied !== true) : this.state.words}
                  renderItem={(word) => {
                    return (
                      <View style={{ marginLeft: 8, marginRight: 8, backgroundColor: appThemeStore.colors.surface, borderColor: appThemeStore.colors.border, borderWidth: 1, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                        <View style={{ height: 4, backgroundColor: word.item.studied === true ? '#75b641' : appThemeStore.colors.backgroundLight }}></View>
                        <View style={{ padding: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontWeight: 'bold', flex: 1, color: appThemeStore.colors.text }}>{word.item.original}</Text>
                            <TouchableOpacity
                              onPress={() => this.toggleWordStudied(word.item)}
                              style={[dictionaryStyles.studiedButton, word.item.studied === true && dictionaryStyles.studiedButtonActive]}
                            >
                              <Text style={[dictionaryStyles.studiedButtonText, word.item.studied === true && dictionaryStyles.studiedButtonTextActive]}>
                                {word.item.studied === true ? 'Вернуть в тест' : 'Изучено'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => this.confirmDeleteWord(word.item)}
                              style={dictionaryStyles.deleteWordButton}
                              accessibilityLabel="Удалить слово">
                              <AppIcon icon={TrashIcon} size={16} color={app_theme_colors.red} />
                            </TouchableOpacity>
                          </View>
                          {word.item.transcription != null &&
                            <Text style={{ color: appThemeStore.colors.mutedText, marginTop: 4 }}>{word.item.transcription}</Text>
                          }
                          <Text style={{ marginTop: 4, color: appThemeStore.colors.text }}>{word.item.translate}</Text>
                          {this.renderWordLearningProgress(word.item)}
                        </View>
                      </View>
                    )
                  }}
                  keyExtractor={(word) => word.original}
                  ListEmptyComponent={() => this.state.words.length > 0
                    ? <Text style={{ padding: 24, textAlign: 'center', color: appThemeStore.colors.mutedText }}>Все слова изучены</Text>
                    : <PreviewWords />}
                />
              </View>
            )}
          </React.Fragment>
        )}
      </SafeAreaView>

    )
  }
}

class DictionaryLearning extends Dictionary {
  componentDidMount() {
    var words = this.props.stack.route.params.words || [];
    this.setState({ words: words }, () => this.startLearning());
  }

  closeLearning() {
    this.props.stack.navigation.goBack();
  }

  render() {
    return (
      <SafeAreaView style={[applicationStyles.save_area_view, { backgroundColor: appThemeStore.colors.background }]}>
        {this.renderLearning()}
      </SafeAreaView>
    );
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
      <View style={{ margin: 8, height: 50, borderRadius: 4, overflow: 'hidden', backgroundColor: appThemeStore.colors.backgroundLight }}>
        <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.text} />
      </View>
    </React.Fragment>
  );
}
