class ProgressService {
  constructor() {
    this.queueKey = 'reading_sessions_queue_v1';
    this.currentSession = null;
    this.flushing = false;
    this.flushTimer = null;
    this.queueOperation = Promise.resolve();
  }

  sessionId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  async queue() {
    var value = await new Storage().get(this.queueKey, '[]');
    try {
      return JSON.parse(value);
    } catch (_) {
      return [];
    }
  }

  start(params) {
    if (!params || !params.owner_id) return;
    var previous = this.currentSession;
    if (previous && String(previous.owner_id) === String(params.owner_id) &&
        String(previous.book_id) === String(params.book_id) &&
        Date.now() - previous.last_activity_at <= 3600000) {
      previous.last_activity_at = Date.now();
      this.suspended = false;
      return;
    }
    if (previous) this.finish('book_changed');
    this.suspended = false;

    var now = Date.now();
    this.currentSession = {
      session_id: this.sessionId(),
      owner_id: params.owner_id,
      book_id: params.book_id,
      book_name: params.book_name,
      started_at: new Date(now).toISOString(),
      start_page: Number(params.page || 1),
      end_page: Number(params.page || 1),
      start_percent: Number(params.percent || 0),
      end_percent: Number(params.percent || 0),
      active_seconds: 0,
      last_activity_at: now,
    };
  }

  touch(page, percent) {
    if (!this.currentSession || this.suspended) return;
    var now = Date.now();
    if (now - this.currentSession.last_activity_at > 3600000) {
      var previous = this.currentSession;
      this.finish('idle_timeout');
      this.currentSession = null;
      this.start({ owner_id: previous.owner_id, book_id: previous.book_id,
        book_name: previous.book_name, page: page == undefined ? previous.end_page : page,
        percent: percent == undefined ? previous.end_percent : percent });
    }
    var delta = Math.max(0, Math.min(90, (now - this.currentSession.last_activity_at) / 1000));
    this.currentSession.active_seconds += delta;
    this.currentSession.last_activity_at = now;
    // Возврат назад не уменьшает достигнутую страницу сессии.
    if (page != undefined && Number.isFinite(Number(page))) {
      this.currentSession.end_page = Math.max(this.currentSession.start_page, this.currentSession.end_page, Number(page));
    }
    if (percent != undefined && Number.isFinite(Number(percent))) {
      this.currentSession.end_percent = Math.max(this.currentSession.start_percent, this.currentSession.end_percent, Number(percent));
    }
    clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      this.saveProgress('checkpoint').catch((error) => console.warn('Reading progress save failed', error));
    }, 3000);
  }

  serializeQueue(operation) {
    var result = this.queueOperation.then(operation);
    this.queueOperation = result.catch(() => {});
    return result;
  }

  async finish(reason) {
    if (!this.currentSession) return;
    clearTimeout(this.flushTimer);
    this.flushTimer = null;
    this.suspended = true;
    return this.saveProgress(reason || 'reader_closed');
  }

  async saveProgress(reason) {
    if (!this.currentSession) return;
    var session = Object.assign({}, this.currentSession, {
      finished_at: new Date(this.currentSession.last_activity_at).toISOString(),
      finish_reason: reason
    });
    delete session.last_activity_at;
    session.active_seconds = Math.floor(session.active_seconds);

    // Совсем короткие случайные открытия не искажают статистику.
    if (session.active_seconds < 3 && session.start_percent == session.end_percent) return;

    await this.serializeQueue(async () => {
      var queue = await this.queue();
      queue = queue.filter((item) => item.session_id !== session.session_id);
      queue.push(session);
      await new Storage().set(this.queueKey, JSON.stringify(queue));
    });
    await this.flush(session.owner_id);
  }

  flush(user_id) {
    return this.serializeQueue(() => this.flushQueue(user_id));
  }

  async flushQueue(user_id) {
    if (!user_id || this.flushing || !appStore.has_internet) return false;
    this.flushing = true;
    try {
      var queue = await this.queue();
      var remaining = [];
      for (var session of queue) {
        var ownerId = session.owner_id || session.user_id;
        if (String(ownerId) != String(user_id)) {
          remaining.push(session);
          continue;
        }
        var payload = Object.assign({}, session);
        delete payload.owner_id;
        delete payload.user_id;
        var response = await new Request('/api/v2/reading/sessions', payload, {
          do_not_show_error: true,
          detailed_response: true
        }).post();
        if (!response.ok) remaining.push(session);
        if (!response.ok && response.status == 0) {
          remaining = remaining.concat(queue.slice(queue.indexOf(session) + 1));
          break;
        }
      }
      await new Storage().set(this.queueKey, JSON.stringify(remaining));
      return remaining.length == 0;
    } finally {
      this.flushing = false;
    }
  }

  async loadSummary() {
    if (!appStore.current_user) return null;
    progressStore.setSummaryLoading(true);
    var response = await new Request('/api/v2/reading/statistics/summary', {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }, { do_not_show_error: true }).get();
    progressStore.setSummaryLoading(false);
    if (response === false) return null;
    progressStore.setSummary(response);
    if (response.notification) progressStore.setNotification(response.notification);
    return response;
  }
}
