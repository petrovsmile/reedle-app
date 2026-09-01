class AdvertisingConfig {
  constructor(platform) {
    this.platform = platform;
    this.bannerUnitId = platform === 'ios' ? 'R-M-1281415-12' : 'R-M-1281416-12';
    this.rewardedUnitId = platform === 'ios' ? 'R-M-1281415-13' : 'R-M-1281416-13';
    this.webFullscreenUnitIds = {
      desktop: 'R-A-19117521-1',
      touch: 'R-A-19117521-1'
    };
  }

  showWebFullscreen(darkTheme) {
    if (this.platform !== 'web' || typeof window === 'undefined') {
      return Promise.resolve('unavailable');
    }

    return new Promise((resolve) => {
      var finished = false;
      var sdkTimeout = setTimeout(() => finish('timeout'), 10000);
      var finish = (result) => {
        if (finished) return;
        finished = true;
        clearTimeout(sdkTimeout);
        resolve(result);
      };

      window.yaContextCb = window.yaContextCb || [];
      window.yaContextCb.push(() => {
        try {
          if (!window.Ya || !window.Ya.Context || !window.Ya.Context.AdvManager) {
            finish('unavailable');
            return;
          }

          var manager = window.Ya.Context.AdvManager;
          var webPlatform = manager.getPlatform ? manager.getPlatform() : 'touch';
          var blockId = this.webFullscreenUnitIds[webPlatform] || this.webFullscreenUnitIds.touch;

          manager.render({
            type: 'fullscreen',
            blockId: blockId,
            platform: webPlatform,
            darkTheme: darkTheme === true,
            onRender: () => clearTimeout(sdkTimeout),
            onClose: () => finish('closed'),
            onError: () => finish('error')
          });
        } catch (error) {
          finish('error');
        }
      });
    });
  }
}
