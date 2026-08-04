class Sound {
  constructor(_url, _basePath, onLoad) {
    this.loaded = true;
    setTimeout(() => {
      if (onLoad) onLoad(null);
    }, 0);
  }

  static setCategory() {}
  static setActive() {}

  getDuration() {
    return 1;
  }

  setVolume() {
    return this;
  }

  play(callback) {
    setTimeout(() => {
      if (callback) callback(true);
    }, 0);
  }

  release() {}
}

export default Sound;
