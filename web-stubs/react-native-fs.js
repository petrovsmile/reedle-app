const DATABASE_NAME = 'reedle-files';
const DATABASE_VERSION = 1;
const FILES_STORE = 'files';
const memoryStorage = new Map();

export const DocumentDirectoryPath = '/documents';

let databasePromise = null;

const openDatabase = () => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(FILES_STORE)) {
        database.createObjectStore(FILES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return databasePromise;
};

const getValue = (database, path) => new Promise((resolve, reject) => {
  const transaction = database.transaction(FILES_STORE, 'readonly');
  const request = transaction.objectStore(FILES_STORE).get(path);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const hasPathPrefix = (database, path) => new Promise((resolve, reject) => {
  const transaction = database.transaction(FILES_STORE, 'readonly');
  const range = IDBKeyRange.bound(path, path + '\uffff');
  const request = transaction.objectStore(FILES_STORE).openKeyCursor(range);
  request.onsuccess = () => resolve(request.result !== null);
  request.onerror = () => reject(request.error);
});

const putValue = (database, path, value) => new Promise((resolve, reject) => {
  const transaction = database.transaction(FILES_STORE, 'readwrite');
  transaction.objectStore(FILES_STORE).put(value, path);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error);
});

const deletePath = (database, path) => new Promise((resolve, reject) => {
  const transaction = database.transaction(FILES_STORE, 'readwrite');
  const store = transaction.objectStore(FILES_STORE);
  const request = store.openCursor();

  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;

    const storedPath = String(cursor.key);
    if (storedPath === path || storedPath.startsWith(path)) cursor.delete();
    cursor.continue();
  };
  request.onerror = () => reject(request.error);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error);
});

export async function exists(path) {
  const database = await openDatabase();
  if (!database) {
    if (path.endsWith('/')) return [...memoryStorage.keys()].some(itemPath => itemPath.startsWith(path));
    return memoryStorage.has(path);
  }
  if (path.endsWith('/')) return await hasPathPrefix(database, path);
  return (await getValue(database, path)) !== undefined;
}

export async function readFile(path) {
  const database = await openDatabase();
  const value = database ? await getValue(database, path) : memoryStorage.get(path);
  if (value === undefined) throw new Error(`File not found: ${path}`);
  return value;
}

export async function writeFile(path, data) {
  const value = String(data);
  const database = await openDatabase();
  if (database) await putValue(database, path, value);
  else memoryStorage.set(path, value);
}

export async function unlink(path) {
  const database = await openDatabase();
  if (database) {
    await deletePath(database, path);
    return;
  }

  [...memoryStorage.keys()]
    .filter(itemPath => itemPath === path || itemPath.startsWith(path))
    .forEach(itemPath => memoryStorage.delete(itemPath));
}

export async function mkdir() {}

export default {
  DocumentDirectoryPath,
  exists,
  readFile,
  writeFile,
  unlink,
  mkdir,
};
