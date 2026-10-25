class OAuthAuthorization {
  constructor(root) {
    this.root = root;
    this.webAttempt = 0;
  }

  async authorize(type) {
    this.rememberWebLocation();
    this.open();

    await this.startWait(type);
  }

  rememberWebLocation() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        'oauth_return_location',
        window.location.pathname + window.location.search + window.location.hash
      );
    } catch (_) { }
  }

  open() {
    appStore.setOAuthModalShow(true);
  }

  close() {
    this.cancel();
    appStore.setOAuthModalShow(false);
  }

  cancel() {
    this.webAttempt += 1;
  }

  async startWait(type) {
    var attempt = ++this.webAttempt;
    var isWeb = Platform.OS === 'web';
    var oauthWindow = isWeb && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    var platform = isWeb ? 'pwa' : 'app';
    var oauthResponse = await new Request('/api/v2/oauth/redirect_url', { oauth_client: type, platform: platform }, {
      do_not_show_error: false,
    }).get();

    if (attempt != this.webAttempt) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    if (!oauthResponse || oauthResponse.error != undefined || !oauthResponse.redirect_url || !oauthResponse.session_token) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    try {
      if (isWeb) {
        if (oauthWindow) {
          oauthWindow.location.href = oauthResponse.redirect_url;
        } else {
          window.open(oauthResponse.redirect_url, '_blank', 'noopener,noreferrer');
        }
      } else {
        await Linking.openURL(oauthResponse.redirect_url);
      }
    } catch (_) {
      return;
    }

    var expiresAt = Date.now() + 5 * 60 * 1000;

    while (attempt == this.webAttempt && Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (attempt != this.webAttempt || Date.now() >= expiresAt) return;

      var user = await new Request('/api/v2/users/by_oauth_token', {
        token: oauthResponse.session_token,
      }, {
        do_not_show_error: true,
      }).get();

      if (!user || user.error != undefined) continue;

      this.cancel();
      await this.setCurrentUser(user);
      return;
    }
  }

  async handleURL(url) {
    if (!url) return;

    var token = '';
    try {
      token = new URL(url).searchParams.get('token') || '';
    } catch (_) {
      var tokenMatch = String(url).match(/[?&]token=([^&#/]*)/);
      token = tokenMatch ? tokenMatch[1] : '';
    }
    try {
      token = decodeURIComponent(token).trim();
    } catch (_) {
      token = String(token).trim();
    }
    if (!token) return;

    var user = await new Request('/api/v2/users/by_oauth_token', {
      token: token,
    }).get();

    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user);
  }

  async loadPwaUser() {
    var user = await new Request('/api/v2/users/current', {}, { do_not_show_error: true }).get();
    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user, false);
  }

  async setCurrentUser(user, closeModal = true) {
    appStore.setCurrentUser(user);
    if (closeModal) appStore.setOAuthModalShow(false);
    await persistCurrentUser(user);
    this.root.checkSubscription();
    await progressService.flush(appStore.current_user.id);
    progressService.loadSummary();
    push_notification_service.syncDevice();
  }
}
