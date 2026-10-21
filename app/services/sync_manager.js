class SyncManager {
  static queue_key = 'sync_operations_v1';
  static _flush_promise = null;

  static operationId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  static entityKey(entity, payload) {
    return entity == 'bookmark' ? payload.book_id.toString() : payload.original;
  }

  static async operations() {
    var value = await new Storage().get(this.queue_key, '[]');
    try {
      return JSON.parse(value);
    } catch (_) {
      return [];
    }
  }

  static async enqueue(entity, action, payload, base_version) {
    var operations = await this.operations();
    var key = this.entityKey(entity, payload);
    operations = operations.filter(operation => !(operation.entity == entity && operation.entity_key == key));
    operations.push({
      operation_id: this.operationId(),
      owner_id: appStore.current_user ? appStore.current_user.id : null,
      entity: entity,
      entity_key: key,
      action: action,
      payload: payload,
      base_version: base_version,
      created_at: new Date().toISOString()
    });
    await new Storage().set(this.queue_key, JSON.stringify(operations));
  }

  static async pendingKeys(entity) {
    var operations = await this.operations();
    return operations.filter(operation => operation.entity == entity).map(operation => operation.entity_key);
  }

  static async flush(owner_id) {
    if (this._flush_promise != null) return this._flush_promise;
    this._flush_promise = this._flush(owner_id).finally(() => { this._flush_promise = null; });
    return this._flush_promise;
  }

  static async _flush(owner_id) {
    var operations = await this.operations();
    var startedOperationIds = operations.map(operation => operation.operation_id);
    var remaining = [];

    for (var operation of operations) {
      var ownerId = operation.owner_id || owner_id;
      if (String(ownerId) != String(owner_id)) {
        remaining.push(operation);
        continue;
      }

      var result = await this.send(operation);
      if (!result.ok && result.status == 409 && result.data && result.data.item) {
        operation.base_version = result.data.item.version;
        operation.operation_id = this.operationId();
        result = await this.send(operation);
      }

      if (result.ok) {
        var currentOperations = await this.operations();
        var hasNewerOperation = currentOperations.some(value =>
          value.entity == operation.entity &&
          value.entity_key == operation.entity_key &&
          value.operation_id != operation.operation_id &&
          startedOperationIds.indexOf(value.operation_id) == -1
        );
        if (!hasNewerOperation) await this.applyAcknowledgement(operation, result.data);
      } else {
        remaining.push(operation);
        if (result.status == 0) {
          var currentIndex = operations.indexOf(operation);
          remaining = remaining.concat(operations.slice(currentIndex + 1));
          break;
        }
      }
    }

    var currentOperations = await this.operations();
    var newlyQueued = currentOperations.filter(operation => startedOperationIds.indexOf(operation.operation_id) == -1);
    remaining = remaining.concat(newlyQueued);
    await new Storage().set(this.queue_key, JSON.stringify(remaining));
    return remaining.length == 0;
  }

  static async send(operation) {
    var url = operation.entity == 'bookmark' ? '/api/v2/bookmarks' : '/api/v2/dictionary/words';
    var params = Object.assign({}, operation.payload, {
      operation_id: operation.operation_id
    });
    if (operation.base_version != undefined && operation.base_version != null) {
      params.base_version = operation.base_version;
    }
    var request = new Request(url, params, { do_not_show_error: true, detailed_response: true });
    return operation.action == 'delete' ? request.delete() : request.post();
  }

  static async applyAcknowledgement(operation, data) {
    var key = operation.entity == 'bookmark' ? 'bookmark_' + operation.payload.book_id : 'word_' + operation.payload.original;
    if (operation.action == 'delete') {
      await new Storage().remove(key);
      return;
    }
    var stored = await new Storage().get(key, '{}');
    stored = JSON.parse(stored);
    stored.version = data.version;
    stored.updated_at = data.updated_at;
    stored.offline = false;
    await new Storage().set(key, JSON.stringify(stored));
  }

  static async syncBookmarks(owner_id) {
    await this.migrateLegacyBookmarks();
    await this.flush(owner_id);
    var response = await new Request('/api/v2/bookmarks', {
      include_deleted: true
    }, { do_not_show_error: true, detailed_response: true }).get();
    if (!response.ok) return null;

    var pending = await this.pendingKeys('bookmark');
    var keys = [];
    for (var item of response.data) {
      var entityKey = item.book.id.toString();
      var storageKey = 'bookmark_' + entityKey;
      if (pending.indexOf(entityKey) > -1) continue;
      if (item.deleted_at) {
        await new Storage().remove(storageKey);
      } else {
        await new Storage().set(storageKey, JSON.stringify({
          book_id: item.book.id,
          book_name: item.book.name,
          page: item.page,
          paragraph: item.paragraph,
          version: item.version,
          updated_at: item.updated_at,
          offline: false
        }));
        keys.push(storageKey);
      }
    }
    var pendingOperations = await this.operations();
    for (var operation of pendingOperations.filter(value => value.entity == 'bookmark' && value.action == 'upsert')) {
      keys.push('bookmark_' + operation.payload.book_id);
    }
    keys = Array.from(new Set(keys));
    await new Storage().set('bookmarks_keys', JSON.stringify(keys));
    return keys;
  }

  static async syncWords(owner_id) {
    await this.migrateLegacyWords();
    await this.flush(owner_id);
    var response = await new Request('/api/v2/dictionary/words', {
      include_deleted: true
    }, { do_not_show_error: true, detailed_response: true }).get();
    if (!response.ok) return null;

    var pending = await this.pendingKeys('word');
    var keys = [];
    for (var item of response.data) {
      var entityKey = item.original;
      var storageKey = 'word_' + entityKey;
      if (pending.indexOf(entityKey) > -1) continue;
      if (item.deleted_at) {
        await new Storage().remove(storageKey);
      } else {
        var localWordValue = await new Storage().get(storageKey);
        var localWord = localWordValue ? JSON.parse(localWordValue) : {};
        await new Storage().set(storageKey, JSON.stringify({
          original: item.original,
          transcription: item.transcription,
          translate: item.translate,
          studied: localWord.studied === true,
          learning_shows: Number(localWord.learning_shows || 0),
          study_prompted: localWord.study_prompted === true,
          created_at: item.created_at,
          version: item.version,
          updated_at: item.updated_at,
          offline: false
        }));
        keys.push(storageKey);
      }
    }
    var pendingOperations = await this.operations();
    for (var operation of pendingOperations.filter(value => value.entity == 'word' && value.action == 'upsert')) {
      keys.push('word_' + operation.payload.original);
    }
    keys = Array.from(new Set(keys));
    await new Storage().set('words_keys', JSON.stringify(keys));
    return keys;
  }

  static async migrateLegacyBookmarks() {
    var keys = JSON.parse(await new Storage().get('bookmarks_keys', '[]'));
    var pending = await this.pendingKeys('bookmark');
    for (var key of keys) {
      var value = await new Storage().get(key);
      if (!value) continue;
      var bookmark = JSON.parse(value);
      if (bookmark.offline == true && pending.indexOf(bookmark.book_id.toString()) == -1) {
        await this.enqueue('bookmark', 'upsert', {
          book_id: bookmark.book_id,
          page: bookmark.page,
          paragraph: bookmark.paragraph
        }, bookmark.version);
      }
    }
  }

  static async migrateLegacyWords() {
    var keys = JSON.parse(await new Storage().get('words_keys', '[]'));
    var pending = await this.pendingKeys('word');
    for (var key of keys) {
      var value = await new Storage().get(key);
      if (!value) continue;
      var word = JSON.parse(value);
      if (word.offline == true && pending.indexOf(word.original) == -1) {
        await this.enqueue('word', 'upsert', {
          original: word.original,
          transcription: word.transcription,
          translate: word.translate
        }, word.version);
      }
    }
  }
}
