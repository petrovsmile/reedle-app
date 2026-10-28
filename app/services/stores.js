// ==================== AppStore ====================
class AppStore {
  has_internet = true;
  has_subscription = false;
  subscription_info = {};
  current_user = false;
  confirm_conditions = null;
  books_percents = {};
  books_order = [];
  error_show = false;
  error_title = '';
  error_description = '';
  type_payment = Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa';
  show_subsription = false;
  oauth_modal_show = false;

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
  setBooksOrder(bookIds) { this.books_order = Array.isArray(bookIds) ? bookIds.slice() : []; }
  setTypePayment(value) { this.type_payment = value; }
  setShowSubscription(value) { this.show_subsription = value; }
  setOAuthModalShow(value) { this.oauth_modal_show = value; }

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


function normalizeReaderFontSize(value) {
  var fontSize = Number(value);
  if (fontSize <= 14) return 14;
  if (fontSize <= 16) return 16;
  return 18;
}

// ==================== ReaderStore ====================


class ReaderStore {
  fontSize = 18;
  fontFamily = 'LibreBaskerville-Regular';
  textAlign = 'flex-start';
  translate_icon_size = 24;
  backgroundColorTheme = '#ffffff';
  textColorTheme = '#000000';
  secondColorTheme = '#bbb';
  hideWordTranslationUnderline = false;
  hideTranslationIcons = false;
  hideBookmarkIcons = false;
  hideSentenceVoiceoverIcons = false;
  bookmark = false;
  page = '';
  list_words = null;
  currentSpeaking = null;

  constructor() {
    makeAutoObservable(this);
  }

  setThemeSettings(settings) {
    // Мерджим — обновляем только те поля, которые реально пришли.
    // Иначе при вызове вида setThemeSettings({fontFamily: 'X'}) все
    // остальные поля стали бы undefined (баг со сбросом шрифта/размеров).
    if (settings.fontSize !== undefined) this.fontSize = normalizeReaderFontSize(settings.fontSize);
    if (settings.fontFamily !== undefined) this.fontFamily = settings.fontFamily;
    if (settings.textAlign !== undefined) this.textAlign = settings.textAlign;
    if (settings.translate_icon_size !== undefined) this.translate_icon_size = settings.translate_icon_size;
    if (settings.backgroundColorTheme !== undefined) this.backgroundColorTheme = settings.backgroundColorTheme;
    if (settings.textColorTheme !== undefined) this.textColorTheme = settings.textColorTheme;
    if (settings.secondColorTheme !== undefined) this.secondColorTheme = settings.secondColorTheme;
    if (settings.hideWordTranslationUnderline !== undefined) this.hideWordTranslationUnderline = settings.hideWordTranslationUnderline === true;
    if (settings.hideTranslationIcons !== undefined) this.hideTranslationIcons = settings.hideTranslationIcons === true;
    if (settings.hideBookmarkIcons !== undefined) this.hideBookmarkIcons = settings.hideBookmarkIcons === true;
    if (settings.hideSentenceVoiceoverIcons !== undefined) this.hideSentenceVoiceoverIcons = settings.hideSentenceVoiceoverIcons === true;
  }

  setBookmark(value) { this.bookmark = value; }
  setPage(value) { this.page = value; }
  setCurrentSpeaking(value) { this.currentSpeaking = value; }
  setListWords(words) { this.list_words = words; }
  clearListWords() { this.list_words = null; }
}

// ==================== DownloadStore ====================
class DownloadStore {
  downloads = {};
  completed = {};
  completionListeners = [];

  constructor() {
    makeAutoObservable(this);
  }

  get(bookId) {
    return this.downloads[bookId] || null;
  }

  isCompleted(bookId) {
    return this.completed[bookId] === true;
  }

  setCompleted(bookId, completed) {
    this.completed = Object.assign({}, this.completed, { [bookId]: completed === true });
  }

  setDownload(bookId, changes) {
    this.downloads = Object.assign({}, this.downloads, {
      [bookId]: Object.assign({}, this.downloads[bookId] || {}, changes),
    });
  }

  onCompleted(listener) {
    this.completionListeners.push(listener);
    return () => {
      this.completionListeners = this.completionListeners.filter(item => item !== listener);
    };
  }

  notifyCompleted(bookId) {
    this.completionListeners.slice().forEach(listener => listener(bookId));
  }

  byteLength(value) {
    var size = 0;
    for (var index = 0; index < value.length; index++) {
      var code = value.charCodeAt(index);
      if (code <= 0x7f) {
        size += 1;
      } else if (code <= 0x7ff) {
        size += 2;
      } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
        var nextCode = value.charCodeAt(index + 1);
        if (nextCode >= 0xdc00 && nextCode <= 0xdfff) {
          size += 4;
          index += 1;
        } else {
          size += 3;
        }
      } else {
        size += 3;
      }
    }
    return size;
  }

  async updateBookSizes(sizes) {
    var booksPath = file_root + '/' + BOOKS_FILENAME;
    if (!(await RNFS.exists(booksPath))) return;

    var books = JSON.parse(await RNFS.readFile(booksPath, 'utf8'));
    books = books.map((book) => Object.prototype.hasOwnProperty.call(sizes, book.id)
      ? Object.assign({}, book, { downloaded_size: sizes[book.id] })
      : book);
    await RNFS.writeFile(booksPath, JSON.stringify(books), 'utf8');
  }

  async calculateBookSize(bookId) {
    var bookPath = file_root + '/books/' + bookId;
    var words = await RNFS.readFile(bookPath + '/words.json', 'utf8');
    var pagination = await RNFS.readFile(bookPath + '/pagination.json', 'utf8');
    var paginationData = JSON.parse(pagination);
    var paragraphIds = [];

    Object.keys(paginationData).forEach((page) => {
      (paginationData[page] || []).forEach((paragraphId) => {
        if (paragraphIds.indexOf(paragraphId) == -1) paragraphIds.push(paragraphId);
      });
    });

    var size = this.byteLength(words) + this.byteLength(pagination);
    var batchSize = 25;
    for (var index = 0; index < paragraphIds.length; index += batchSize) {
      var batch = paragraphIds.slice(index, index + batchSize);
      var contents = await Promise.all(batch.map((paragraphId) =>
        RNFS.readFile(bookPath + '/paragraphs/' + paragraphId + '.json', 'utf8')));
      contents.forEach((value) => { size += this.byteLength(value); });
    }

    return size;
  }

  async hasBookFiles(bookId) {
    try {
      var bookPath = file_root + '/books/' + bookId;
      if (!await RNFS.exists(bookPath + '/words.json')) return false;
      if (!await RNFS.exists(bookPath + '/pagination.json')) return false;

      var pagination = JSON.parse(await RNFS.readFile(bookPath + '/pagination.json', 'utf8'));
      var paragraphIds = [];
      Object.keys(pagination).forEach((page) => {
        (pagination[page] || []).forEach((paragraphId) => {
          if (paragraphIds.indexOf(paragraphId) == -1) paragraphIds.push(paragraphId);
        });
      });

      var existingParagraphs = await Promise.all(paragraphIds.map((paragraphId) =>
        RNFS.exists(bookPath + '/paragraphs/' + paragraphId + '.json')));
      return existingParagraphs.every(Boolean);
    } catch (_) {
      return false;
    }
  }

  async validateCompleted(bookId) {
    var completed = await AsyncStorage.getItem('have_file_' + bookId) == 'true';
    if (!completed) return false;
    if (await this.hasBookFiles(bookId)) return true;

    await AsyncStorage.setItem('have_file_' + bookId, '');
    this.setCompleted(bookId, false);
    return false;
  }

  async removeBooks(bookIds) {
    var ids = (bookIds || []).map((bookId) => String(bookId));
    await Promise.all(ids.map(async (bookId) => {
      await AsyncStorage.setItem('have_file_' + bookId, '');
      var bookDirectory = file_root + '/books/' + bookId + '/';
      if (await RNFS.exists(bookDirectory)) await RNFS.unlink(bookDirectory);
      this.setCompleted(bookId, false);
    }));

    var sizes = {};
    ids.forEach((bookId) => { sizes[bookId] = 0; });
    await this.updateBookSizes(sizes);
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
      var files = await new Request('/api/v2/books/download_list', { book_id: book.id }).get();
      if (!files || files.length === 0) throw new Error('download_list is empty');

      await RNFS.mkdir(file_root + '/books/' + book.id + '/paragraphs/');
      this.setDownload(book.id, { status: 'downloading', progress: 2 });
      var downloadedSize = 0;

      for (var index = 0; index < files.length; index++) {
        var requestPath = files[index];
        var response = await new Request(requestPath, {}).get();
        if (response === false) throw new Error('Failed to download ' + requestPath);

        var filePath = requestPath.replace('/result', '');
        var fileContents = JSON.stringify(response);
        await RNFS.writeFile(file_root + filePath, fileContents, 'utf8');
        downloadedSize += this.byteLength(fileContents);

        var progress = Math.max(2, ((index + 1) / files.length) * 100);
        this.setDownload(book.id, { progress: progress, status: 'downloading' });
      }

      if (!await this.hasBookFiles(book.id)) throw new Error('Downloaded book files are incomplete');

      await this.updateBookSizes({ [book.id]: downloadedSize });
      await AsyncStorage.setItem('have_file_' + book.id, 'true');
      this.setCompleted(book.id, true);
      this.notifyCompleted(book.id);
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

// ==================== HomeStore ====================
class HomeStore {
  open_property = false;

  constructor() {
    makeAutoObservable(this);
  }

  setOpenProperty(value) { this.open_property = value; }
}
