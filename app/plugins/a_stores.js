// ==================== AppStore ====================
class AppStore {
  has_internet = true;
  has_subscription = false;
  subscription_info = {};
  current_user = false;
  confirm_conditions = true;
  books_percents = {};
  error_show = false;
  error_title = '';
  error_description = '';
  type_payment = Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa';
  show_subsription = false;

  constructor() {
    makeAutoObservable(this);
    this._notification_timer = null;
  }

  setInternet(value) { this.has_internet = value; }
  setSubscription(value) { this.has_subscription = value; }
  setSubscriptionInfo(info) { this.subscription_info = info; }
  setCurrentUser(user) { this.current_user = user; }
  setConfirmConditions(value) { this.confirm_conditions = value; }
  setBooksPercents(percents) { this.books_percents = percents; }
  setTypePayment(value) { this.type_payment = value; }
  setShowSubscription(value) { this.show_subsription = value; }

  showError(title, description) {
    this.error_show = true;
    this.error_title = title;
    this.error_description = description;
    console.log(title + ' ' + description);
    clearTimeout(this._notification_timer);
    this._notification_timer = setTimeout(() => {
      runInAction(() => { this.error_show = false; });
    }, 3000);
  }

  closeError() {
    this.error_show = false;
  }

  clearErrorTimer() {
    clearTimeout(this._notification_timer);
  }
}
const appStore = new AppStore();

// ==================== ReaderStore ====================
class ReaderStore {
  fontSize = 18;
  fontFamily = 'LibreBaskerville-Regular';
  textAlign = 'flex-start';
  translate_icon_size = 24;
  backgroundColorTheme = '#ffffff';
  textColorTheme = '#000000';
  secondColorTheme = '#bbb';
  bookmark = false;
  page = '';
  ttsVoice = false;
  ttsVoiceApplied = false; // true, если текущий ttsVoice уже применён в Tts engine
  list_words = null;
  currentSpeaking = null;

  constructor() {
    makeAutoObservable(this);
  }

  setThemeSettings(settings) {
    // Мерджим — обновляем только те поля, которые реально пришли.
    // Иначе при вызове вида setThemeSettings({fontFamily: 'X'}) все
    // остальные поля стали бы undefined (баг со сбросом шрифта/размеров).
    if (settings.fontSize !== undefined) this.fontSize = settings.fontSize;
    if (settings.fontFamily !== undefined) this.fontFamily = settings.fontFamily;
    if (settings.textAlign !== undefined) this.textAlign = settings.textAlign;
    if (settings.translate_icon_size !== undefined) this.translate_icon_size = settings.translate_icon_size;
    if (settings.backgroundColorTheme !== undefined) this.backgroundColorTheme = settings.backgroundColorTheme;
    if (settings.textColorTheme !== undefined) this.textColorTheme = settings.textColorTheme;
    if (settings.secondColorTheme !== undefined) this.secondColorTheme = settings.secondColorTheme;
  }

  setBookmark(value) { this.bookmark = value; }
  setPage(value) { this.page = value; }
  setTtsVoice(value) { this.ttsVoice = value; this.ttsVoiceApplied = false; }
  setTtsVoiceApplied(value) { this.ttsVoiceApplied = value; }
  setCurrentSpeaking(value) { this.currentSpeaking = value; }
  setListWords(words) { this.list_words = words; }
  clearListWords() { this.list_words = null; }
}
const readerStore = new ReaderStore();

// ==================== DownloadStore ====================
class DownloadStore {
  downloads = {};
  completed = {};

  constructor() {
    makeAutoObservable(this);
  }

  get(bookId) {
    return this.downloads[bookId] || null;
  }

  isCompleted(bookId) {
    return this.completed[bookId] === true;
  }

  setDownload(bookId, changes) {
    this.downloads = Object.assign({}, this.downloads, {
      [bookId]: Object.assign({}, this.downloads[bookId] || {}, changes),
    });
  }

  async start(book) {
    if (!book || this.completed[book.id]) return;
    if (this.downloads[book.id] && this.downloads[book.id].status !== 'error') return;
    if (this.downloads[book.id] && this.downloads[book.id].status === 'error') this.dismiss(book.id);

    this.setDownload(book.id, {
      bookId: book.id,
      name: book.name,
      nameEn: book.name_en,
      color: book.color,
      progress: 0,
      status: 'preparing',
    });

    AppMetrica.reportEvent('loader', { status: 'start' });

    try {
      var files = await new Request('/api/v1/books/download_list', { book_id: book.id }).get();
      if (!files || files.length === 0) throw new Error('download_list is empty');

      await RNFS.mkdir(file_root + '/books/' + book.id + '/paragraphs/');
      this.setDownload(book.id, { status: 'downloading', progress: 2 });

      for (var index = 0; index < files.length; index++) {
        var requestPath = files[index];
        var response = await new Request(requestPath, {}).get();
        if (response === false) throw new Error('Failed to download ' + requestPath);

        var filePath = requestPath.replace('/result', '');
        await RNFS.writeFile(file_root + filePath, JSON.stringify(response), 'utf8');

        var progress = Math.max(2, ((index + 1) / files.length) * 100);
        this.setDownload(book.id, { progress: progress, status: 'downloading' });
      }

      await AsyncStorage.setItem('have_file_' + book.id, 'true');
      this.completed = Object.assign({}, this.completed, { [book.id]: true });
      this.dismiss(book.id);
      AppMetrica.reportEvent('loader', { status: 'finish' });
      AppMetrica.reportEvent('loader', { progress: 100 });
    } catch (error) {
      this.setDownload(book.id, { status: 'error', error: error.message });
      AppMetrica.reportEvent('loader', { status: 'error' });
    }
  }

  dismiss(bookId) {
    var downloads = Object.assign({}, this.downloads);
    delete downloads[bookId];
    this.downloads = downloads;
  }
}
const downloadStore = new DownloadStore();

// ==================== HomeStore ====================
class HomeStore {
  open_property = false;

  constructor() {
    makeAutoObservable(this);
  }

  setOpenProperty(value) { this.open_property = value; }
}
const homeStore = new HomeStore();
