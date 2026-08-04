const Tts = {
  setDefaultLanguage() {},
  setDefaultVoice() {},
  speak() {},
  stop() {},
  addEventListener() {
    return { remove() {} };
  },
  async voices() {
    return [];
  },
};

export default Tts;
