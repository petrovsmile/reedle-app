const listeners = new Set();

const Speech = {
  async setEngine() {},
  configure() {},
  stop() {},
  speak() {
    setTimeout(() => {
      listeners.forEach(listener => listener());
    }, 0);
  },
  async getAvailableVoices() {
    return [];
  },
  onFinish(listener) {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

export default Speech;
