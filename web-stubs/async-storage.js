const memoryStorage = new Map();

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
    return storage ? storage.getItem(key) : memoryStorage.get(key) ?? null;
  },

  async setItem(key, value) {
    const stringValue = String(value);
    const storage = getStorage();
    if (storage) storage.setItem(key, stringValue);
    else memoryStorage.set(key, stringValue);
  },

  async removeItem(key) {
    const storage = getStorage();
    if (storage) storage.removeItem(key);
    else memoryStorage.delete(key);
  },
};

export default AsyncStorage;
