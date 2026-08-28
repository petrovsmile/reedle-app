class OAuthAuthorization {
  constructor(root) {
    this.root = root;
    this.webAttempt = 0;
  }

  async authorize(type) {
    var platform = Platform.OS === 'web' ? 'pwa' : 'app';
    var link = HOST + '/oauth_redirect/' + type + '/' + platform;

    this.open();

    if (Platform.OS === 'web') {
      await this.startWeb(type);
      return;
    }

    await Linking.openURL(link);
  }

  open() {
    this.root.setState({
      oauth_modal_show: true,
      oauth_manual_token: '',
      oauth_manual_loading: false,
      oauth_manual_error: false,
    });
  }

  close() {
    this.cancel();
    this.root.setState({
      oauth_modal_show: false,
      oauth_manual_loading: false,
      oauth_manual_error: false,
    });
  }

  cancel() {
    this.webAttempt += 1;
  }

  async authorizeByManualToken() {
    var token = String(this.root.state.oauth_manual_token || '').trim();
    if (!token || this.root.state.oauth_manual_loading) return;

    this.root.setState({ oauth_manual_loading: true, oauth_manual_error: false });
    var user = await new Request('/api/v1/users/by_oauth_token', {
      token: token,
    }, {
      do_not_show_error: true,
    }).get();

    if (!user || user.error != undefined) {
      this.root.setState({
        oauth_manual_loading: false,
        oauth_manual_error: 'Не удалось подтвердить токен. Проверьте его и попробуйте ещё раз.',
      });
      return;
    }

    this.cancel();
    await this.setCurrentUser(user);
  }

  async startWeb(type) {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    var attempt = ++this.webAttempt;
    var oauthWindow = window.open('', '_blank');
    var oauthResponse = await new Request('/oauth_redirect/' + type + '/pwa', {}, {
      do_not_show_error: true,
    }).get();

    if (attempt != this.webAttempt) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    if (!oauthResponse || oauthResponse.error != undefined || !oauthResponse.redirect_url || !oauthResponse.session_token) {
      if (oauthWindow) oauthWindow.close();
      return;
    }

    if (oauthWindow) {
      oauthWindow.location.href = oauthResponse.redirect_url;
    } else {
      window.open(oauthResponse.redirect_url, '_blank', 'noopener,noreferrer');
    }

    var expiresAt = Date.now() + 5 * 60 * 1000;

    while (attempt == this.webAttempt && Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (attempt != this.webAttempt || Date.now() >= expiresAt) return;

      var user = await new Request('/api/v1/users/by_oauth_token', {
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
    if (!url || !url.includes('token=')) return;

    var tokenPart = url.split('token=')[1];
    if (!tokenPart) return;
    var token = tokenPart.split('/')[0].split('&')[0];

    var user = await new Request('/api/v1/users/by_oauth_token', {
      token: token,
    }).get();

    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user);
  }

  async loadPwaUser() {
    var user = await new Request('/api/v1/users/current', {}, { do_not_show_error: true }).get();
    if (!user || user.error != undefined) return;
    await this.setCurrentUser(user, false);
  }

  async setCurrentUser(user, closeModal = true) {
    appStore.setCurrentUser(user);
    this.root.setState({
      current_user: user,
      ...(closeModal ? { oauth_modal_show: false, oauth_manual_loading: false } : {}),
    });
    await new Storage().set('current_user', JSON.stringify(user));
    this.root.checkSubscription();
  }
}
