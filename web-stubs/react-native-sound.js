class Sound {
  constructor(url, _basePath, onLoad) {
    this.audio = null;
    this.released = false;
    this.onLoad = onLoad;

    if (typeof Audio === 'undefined') {
      setTimeout(() => this.finishLoading(new Error('Audio is not supported')), 0);
      return;
    }

    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.handleCanPlay = () => this.finishLoading(null);
    this.handleError = () => this.finishLoading(new Error('Audio loading failed'));
    this.audio.addEventListener('loadedmetadata', this.handleCanPlay, { once: true });
    this.audio.addEventListener('canplaythrough', this.handleCanPlay, { once: true });
    this.audio.addEventListener('error', this.handleError, { once: true });
    this.audio.src = url;
    this.audio.load();
  }

  static setCategory() {}
  static setActive() {}

  finishLoading(error) {
    if (!this.onLoad || this.released) return;
    var callback = this.onLoad;
    this.onLoad = null;
    callback(error);
  }

  getDuration() {
    if (!this.audio) return 0;
    return Number.isFinite(this.audio.duration) && this.audio.duration > 0 ? this.audio.duration : 1;
  }

  setVolume(volume) {
    if (this.audio) this.audio.volume = volume;
    return this;
  }

  play(callback) {
    if (!this.audio || this.released) {
      if (callback) callback(false);
      return;
    }

    var completed = false;
    var finish = (success) => {
      if (completed) return;
      completed = true;
      this.audio.removeEventListener('ended', handleEnded);
      this.audio.removeEventListener('error', handlePlaybackError);
      if (callback) callback(success);
    };
    var handleEnded = () => finish(true);
    var handlePlaybackError = () => finish(false);

    this.audio.addEventListener('ended', handleEnded, { once: true });
    this.audio.addEventListener('error', handlePlaybackError, { once: true });

    var playPromise = this.audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => finish(false));
    }
  }

  release() {
    this.released = true;
    this.onLoad = null;
    if (!this.audio) return;

    this.audio.pause();
    this.audio.removeEventListener('loadedmetadata', this.handleCanPlay);
    this.audio.removeEventListener('canplaythrough', this.handleCanPlay);
    this.audio.removeEventListener('error', this.handleError);
    this.audio.removeAttribute('src');
    this.audio.load();
    this.audio = null;
  }
}

export default Sound;
