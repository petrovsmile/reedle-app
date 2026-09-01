var activeAppSound = null;

class AppSound {
  constructor(filename, basePath, onLoad, onInterrupted) {
    AppSound.stopCurrent();
    this.onInterrupted = onInterrupted;
    this.released = false;
    this.sound = new Sound(filename, basePath, (error) => {
      if (onLoad) onLoad(error);
    });
    activeAppSound = this;
  }

  static stopCurrent() {
    if (activeAppSound) activeAppSound.interrupt();
  }

  interrupt() {
    if (this.released) return;
    try {
      this.sound.stop();
    } catch (_) { }
    this.release();
    if (this.onInterrupted) this.onInterrupted();
  }

  play(callback) {
    this.sound.play(callback);
  }

  setVolume(volume) {
    this.sound.setVolume(volume);
  }

  getDuration() {
    return this.sound.getDuration();
  }

  release() {
    if (this.released) return;
    this.released = true;
    try {
      this.sound.release();
    } catch (_) { }
    if (activeAppSound === this) activeAppSound = null;
  }
}
