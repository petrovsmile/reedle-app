class WebPushMessagingClient {
  constructor() {
    this.platform = 'web';
    this.last_error_code = null;
    this.message_handlers = new Set();
    this.opened_handlers = new Set();
    this.handleServiceWorkerMessage = event => {
      const message = event.data || {};
      if (message.type === 'REEDLE_NOTIFICATION_RECEIVED') {
        if (document.visibilityState !== 'visible') return;
        this.message_handlers.forEach(handler =>
          handler({ notification: message.notification, data: message.data || {} }),
        );
        return;
      }
      if (message.type != 'REEDLE_NOTIFICATION_OPENED') return;
      this.opened_handlers.forEach(handler =>
        handler({
          data: message.data || {},
        }),
      );
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener(
        'message',
        this.handleServiceWorkerMessage,
      );
    }
  }

  isIos() {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  isStandalone() {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true
    );
  }

  ensureSupported() {
    this.last_error_code = null;
    if (
      typeof window === 'undefined' ||
      !window.isSecureContext ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      this.last_error_code = 'unsupported';
      throw new Error('Web Push is not supported');
    }
    if (this.isIos() && !this.isStandalone()) {
      this.last_error_code = 'install_required';
      throw new Error('Install the PWA before enabling notifications');
    }
  }

  onMessage(handler) {
    this.message_handlers.add(handler);
    return () => this.message_handlers.delete(handler);
  }

  onNotificationOpenedApp(handler) {
    this.opened_handlers.add(handler);
    return () => this.opened_handlers.delete(handler);
  }

  onTokenRefresh() {
    return () => {};
  }

  async getInitialNotification() {
    return null;
  }

  async setAutoInitEnabled() {}

  async requestPermission() {
    try {
      this.ensureSupported();
      let permission = Notification.permission;
      if (permission === 'default')
        permission = await Notification.requestPermission();
      if (permission !== 'granted') this.last_error_code = 'permission_denied';
      return permission === 'granted' ? 1 : 0;
    } catch (error) {
      if (!this.last_error_code) this.last_error_code = 'permission_error';
      throw error;
    }
  }

  async registerDeviceForRemoteMessages() {}

  applicationServerKey(value) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const bytes = window.atob(base64);
    return Uint8Array.from(bytes, character => character.charCodeAt(0));
  }

  workerScope() {
    return (window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')) ? '/app/' : '/';
  }

  async getToken() {
    this.ensureSupported();
    const scope = this.workerScope();
    const registration = await navigator.serviceWorker.register(scope + 'sw.js', {
      scope: scope,
      updateViaCache: 'none',
    });
    // ready may already be resolved to the website's worker at /sw.js.
    // Subscribe to the registration returned for the application's exact scope.
    if (!registration.active) {
      const worker = registration.installing || registration.waiting;
      if (!worker) throw new Error('Notification service worker is unavailable');
      await new Promise((resolve, reject) => {
        function handleStateChange() {
          if (worker.state === 'activated') {
            worker.removeEventListener('statechange', handleStateChange);
            resolve();
          } else if (worker.state === 'redundant') {
            worker.removeEventListener('statechange', handleStateChange);
            reject(new Error('Notification service worker installation failed'));
          } else if (worker.state === 'installed') {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        }
        worker.addEventListener('statechange', handleStateChange);
        handleStateChange();
      });
    }
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const public_key = await this.loadPublicKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.applicationServerKey(public_key),
      });
    }
    this.subscription = subscription;
    return subscription.endpoint;
  }

  async loadPublicKey() {
    const result = await new Request(
      '/api/v2/user_devices/vapid_public_key',
      {},
      {
        do_not_show_error: true,
        detailed_response: true,
      },
    ).get();
    const response = result && result.data;
    if (result && result.ok && response && response.public_key)
      return response.public_key;
    if (response && response.error === 'Web Push is not configured') {
      this.last_error_code = 'server_not_configured';
    } else if (result && result.status === 401) {
      this.last_error_code = 'authentication_required';
    } else {
      this.last_error_code = 'public_key_failed';
    }
    console.warn('Unable to obtain Web Push public key:', {
      status: result && result.status,
      reason: this.last_error_code,
    });
    throw new Error(
      'Unable to obtain VAPID public key: ' + this.last_error_code,
    );
  }

  async registrationPayload() {
    let subscription = this.subscription;
    if (!subscription) {
      const registration = await this.currentRegistration();
      subscription = registration ? await registration.pushManager.getSubscription() : null;
    }
    return subscription
      ? {
          subscription: subscription.toJSON(),
        }
      : {};
  }

  async currentRegistration() {
    const scope = this.workerScope();
    const registration = await navigator.serviceWorker.getRegistration(scope);
    return registration && registration.scope === new URL(scope, window.location.origin).href
      ? registration
      : null;
  }

  async deleteToken() {
    if (!('serviceWorker' in navigator)) return;
    const registration = await this.currentRegistration();
    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;
    if (subscription) await subscription.unsubscribe();
    this.subscription = null;
  }

  dispose() {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener(
        'message',
        this.handleServiceWorkerMessage,
      );
    }
    this.message_handlers.clear();
    this.opened_handlers.clear();
  }
}
