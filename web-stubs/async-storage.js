const memoryStorage = new Map();
let databasePromise;

const openDatabase = () => {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise(resolve => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open('reedle-storage', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('values');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch (error) {
      resolve(null);
    }
  });
  return databasePromise;
};

const databaseOperation = (database, mode, operation) => new Promise((resolve, reject) => {
  const transaction = database.transaction('values', mode);
  const request = operation(transaction.objectStore('values'));
  transaction.oncomplete = () => resolve(request.result);
  transaction.onerror = () => reject(transaction.error || request.error);
  transaction.onabort = () => reject(transaction.error || request.error);
});

const getStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch (error) {
    return null;
  }
};

const AsyncStorage = {
  async getItem(key) {
    const storage = getStorage();
    const database = await openDatabase();
    if (database) {
      const value = await databaseOperation(database, 'readonly', store => store.get(key));
      if (value !== undefined) return value;
      const legacyValue = storage ? storage.getItem(key) : memoryStorage.get(key) ?? null;
      if (legacyValue !== null) {
        await databaseOperation(database, 'readwrite', store => store.put(legacyValue, key));
        // Only remove the legacy copy after the persistent write has committed.
        if (storage) storage.removeItem(key);
        memoryStorage.delete(key);
      }
      return legacyValue;
    }
    return storage ? storage.getItem(key) : memoryStorage.get(key) ?? null;
  },

  async setItem(key, value) {
    const stringValue = String(value);
    const storage = getStorage();
    const database = await openDatabase();
    if (database) {
      await databaseOperation(database, 'readwrite', store => store.put(stringValue, key));
      if (storage) storage.removeItem(key);
      memoryStorage.delete(key);
    } else if (storage) storage.setItem(key, stringValue);
    else memoryStorage.set(key, stringValue);
  },

  async removeItem(key) {
    const storage = getStorage();
    const database = await openDatabase();
    // Remove both copies so legacy data cannot reappear after deletion.
    if (database) await databaseOperation(database, 'readwrite', store => store.delete(key));
    if (storage) storage.removeItem(key);
    else memoryStorage.delete(key);
  },
};

export default AsyncStorage;
