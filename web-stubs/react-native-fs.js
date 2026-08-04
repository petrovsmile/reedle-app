const prefix = 'rnfs:';
const memoryStorage = new Map();

export const DocumentDirectoryPath = '/documents';

const getStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch (error) {
    return null;
  }
};

const keyForPath = path => `${prefix}${path}`;

export async function exists(path) {
  const storage = getStorage();
  return storage ? storage.getItem(keyForPath(path)) !== null : memoryStorage.has(path);
}

export async function readFile(path) {
  const storage = getStorage();
  const value = storage ? storage.getItem(keyForPath(path)) : memoryStorage.get(path);
  if (value == null) throw new Error(`File not found: ${path}`);
  return value;
}

export async function writeFile(path, data) {
  const value = String(data);
  const storage = getStorage();
  if (storage) storage.setItem(keyForPath(path), value);
  else memoryStorage.set(path, value);
}

export async function unlink(path) {
  const storage = getStorage();
  if (storage) {
    const key = keyForPath(path);
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const storageKey = storage.key(index);
      if (storageKey === key || storageKey.startsWith(key)) keys.push(storageKey);
    }
    keys.forEach(storageKey => storage.removeItem(storageKey));
  } else {
    [...memoryStorage.keys()]
      .filter(itemPath => itemPath === path || itemPath.startsWith(path))
      .forEach(itemPath => memoryStorage.delete(itemPath));
  }
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
