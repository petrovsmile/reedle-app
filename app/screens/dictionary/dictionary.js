class Dictionary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      words: [],
      do_not_find: false,
      sorting_by: 'date',
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

  async deleteWord(rowMap, data) {
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
    if (shouldPrompt) changes.study_prompted = true;
    var updatedWord = await this.updateWordLearningState(word, changes);

    if (shouldPrompt) {
      AppAlert.alert(
        'Слово показано 10 раз',
        'Пометить «' + word.original + '» как изученное?',
        [
          { text: 'Пока нет', style: 'cancel' },
          { text: 'Изучено', onPress: () => this.updateWordLearningState(updatedWord, { studied: true }) }
        ]
      );
    }
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
    }, () => this.recordLearningShow(questions[0].word));
  }

  selectLearningAnswer(answer) {
    if (this.state.learning_answer != null) return;

    var question = this.state.learning_questions[this.state.learning_index];
    var isCorrect = answer == question.correctAnswer;
    this.setState({
      learning_answer: answer,
      learning_correct: this.state.learning_correct + (isCorrect ? 1 : 0),
      learning_mistakes: isCorrect
        ? this.state.learning_mistakes
        : this.state.learning_mistakes.concat([question.word])
    });
  }

  nextLearningQuestion() {
    if (this.state.learning_index + 1 >= this.state.learning_questions.length) {
      this.setState({ learning_complete: true });
    } else {
      var nextQuestion = this.state.learning_questions[this.state.learning_index + 1];
      this.setState({
        learning_index: this.state.learning_index + 1,
        learning_answer: null
      }, () => this.recordLearningShow(nextQuestion.word));
    }
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
          <TouchableOpacity style={dictionaryStyles.learningBackButton} onPress={() => this.setState({ learning: false })}>
            <Text style={dictionaryStyles.learningBackButtonText}>Вернуться в словарь</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    var question = this.state.learning_questions[this.state.learning_index];
    if (!question) return null;

    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={dictionaryStyles.learningContainer}>
        <View style={dictionaryStyles.learningHeader}>
          <TouchableOpacity onPress={() => this.setState({ learning: false })}>
            <Text style={dictionaryStyles.learningClose}>Закрыть</Text>
          </TouchableOpacity>
          <Text style={dictionaryStyles.learningProgress}>
            {this.state.learning_index + 1} из {this.state.learning_questions.length}
          </Text>
        </View>
        <View style={dictionaryStyles.learningCard}>
          <Text style={dictionaryStyles.learningWord}>{question.word.original}</Text>
          {question.word.transcription != null &&
            <Text style={dictionaryStyles.learningTranscription}>{question.word.transcription}</Text>
          }
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
              style={[dictionaryStyles.learningAnswer, answerStyle]}
              onPress={() => this.selectLearningAnswer(answer)}>
              <Text style={dictionaryStyles.learningAnswerText}>{answer}</Text>
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
            {this.state.do_not_find == false && (this.state.learning ? this.renderLearning() :
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ padding: 8 }}>

                  <TouchableOpacity style={dictionaryStyles.learningStartButton} onPress={() => this.startLearning()}>
                    <Text style={dictionaryStyles.learningPrimaryButtonText}>Учить слова</Text>
                  </TouchableOpacity>

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
                        <View style={{ height: 4, backgroundColor: word.item.studied === true ? '#75b641' : '#eee' }}></View>
                        <View style={{ padding: 8 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontWeight: 'bold', flex: 1 }}>{word.item.original}</Text>
                            <TouchableOpacity
                              onPress={() => this.toggleWordStudied(word.item)}
                              style={[dictionaryStyles.studiedButton, word.item.studied === true && dictionaryStyles.studiedButtonActive]}
                            >
                              <Text style={[dictionaryStyles.studiedButtonText, word.item.studied === true && dictionaryStyles.studiedButtonTextActive]}>
                                {word.item.studied === true ? 'Вернуть в тест' : 'Изучено'}
                              </Text>
                            </TouchableOpacity>
                          </View>
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
                          <AppIcon icon={TrashIcon} size={20} color={app_theme_colors.red} style={{ margin: 10 }} />
                        </TouchableOpacity>
                      </View>
                    )
                  }}
                />
              </View>
            )}
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
