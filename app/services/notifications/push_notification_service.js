class PushNotificationService {
  constructor(client, registration, receipts) {
    this.client = client;
    this.registration = registration;
    this.receipts = receipts;
    this.root = null;
    this.subscriptions = [];
  }

  async initialize(root) {
    this.root = root;
    if (!this.client) return;
    this.subscriptions = [
      this.client.onMessage(message => this.showForegroundMessage(message).catch(error => {
        console.warn('Unable to show foreground notification:', error);
      })),
      this.client.onNotificationOpenedApp(message => this.open(message)),
      this.client.onTokenRefresh(token => this.sendToken(token)),
    ];
    if (this.subscribeForegroundNotificationOpened) {
      this.subscriptions.push(this.subscribeForegroundNotificationOpened(message => this.open(message)));
      const foreground_notification = await this.foreground_notifications.getInitialNotification();
      if (foreground_notification) setTimeout(() => this.open(foreground_notification), 500);
    }
    const initial_notification = await this.client.getInitialNotification();
    if (initial_notification)
      setTimeout(() => this.open(initial_notification), 500);
  }

  async showForegroundMessage(message) {
    // The web service worker already displays the browser notification and records delivery.
    if (this.client && this.client.platform === 'web') return;
    if (!message.notification) return;
    const { title, body } = message.notification;
    const data = message.data || {};
    if (this.foreground_notifications) {
      const shown = await this.foreground_notifications.showNotification(title || 'Reedle', body || '', data);
      if (!shown) return;
    }
    // iOS presents remote notifications through the Firebase foreground options.
    await this.receipts.record(data, 'delivered');
  }

  async requestPermissionOnStartup() {
    if (!this.client) return;
    if ((await storage.get('push_notifications_enabled')) === 'false')
      return;
    if (
      (await storage.get('push_permission_prompt_shown', 'false')) ===
      'true'
    )
      return;
    if (this.client.platform === 'web') {
      await this.requestWebPermissionOnStartup();
      return;
    }
    await storage.set('push_permission_prompt_shown', 'true');
    await this.enable();
  }

  async requestWebPermissionOnStartup() {
    try {
      this.client.ensureSupported();
    } catch (_) {
      return;
    }
    if (Notification.permission === 'granted') {
      await this.enable();
      return;
    }
    if (Notification.permission !== 'default') return;
    await storage.set('push_permission_prompt_shown', 'true');
    // Browsers require a click to display the system permission prompt.
    AppAlert.alert(
      'Уведомления Reedle',
      'Разрешить приложению отправлять уведомления?',
      [
        {
          text: 'Не сейчас',
          style: 'cancel',
        },
        {
          text: 'Разрешить',
          onPress: () => this.enable(),
        },
      ],
    );
  }

  dispose() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    if (this.client && this.client.dispose) this.client.dispose();
  }

  async requestPermission() {
    if (this.requestNotificationPermission && !(await this.requestNotificationPermission())) return 0;
    if (this.client.platform !== 'web') {
      await this.client.setAutoInitEnabled(true);
    }
    // On web this call must happen before any await, directly from the click.
    return this.client.requestPermission();
  }

  async registerDevice() {
    await this.client.registerDeviceForRemoteMessages();
    const token = await this.client.getToken();
    await this.sendToken(token);
  }

  async enable() {
    if (!this.client) return false;
    try {
      const permission = await this.requestPermission();
      const enabled = permission === 1 || permission === 2;
      await storage.set('push_notifications_enabled', enabled.toString());
      if (enabled) {
        await this.registerDevice();
        if (appStore.current_user) {
          const goal = await new Request('/api/v2/reading/goals', {
            reminder_enabled: true,
          }, { do_not_show_error: true }).put();
          if (goal === false) {
            AppAlert.alert('Не удалось включить напоминания о целях', 'Уведомления разрешены. Попробуйте сохранить напоминания в настройках уведомлений.');
          }
        }
      } else {
        await this.client.setAutoInitEnabled(false);
      }
      return enabled;
    } catch (error) {
      console.warn('Unable to enable push notifications:', error);
      return false;
    }
  }

  async disable() {
    await storage.set('push_notifications_enabled', 'false');
    try {
      await this.registration.disable();
    } catch (_) { }
    if (this.client) {
      try {
        await this.client.deleteToken();
        await this.client.setAutoInitEnabled(false);
      } catch (error) {
        console.warn('Unable to disable push notifications:', error);
      }
    }
    await this.registration.clearRegistration();
  }

  async syncDevice() {
    await this.receipts.flush();
    if (!this.client || !appStore.has_internet) {
      return;
    }
    try {
      const enabled = await storage.get('push_notifications_enabled');
      const browser_permission_granted =
        this.client.platform === 'web' &&
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted';
      if (enabled !== 'true' && (!browser_permission_granted || enabled === 'false')) {
        return;
      }

      await this.client.setAutoInitEnabled(true);
      await this.registerDevice();
      await storage.set('push_notifications_enabled', 'true');
    } catch (error) {
      console.warn('Unable to synchronize push token:', error);
    }
  }

  async sendToken(token) {
    return this.registration.register(token);
  }

  async detachCurrentUser() {
    const detached = await this.registration.detachUser();
    // Do not leave account notifications attached to a device after logout.
    if (!detached) await this.disable();
  }

  errorCode() {
    return this.client && this.client.last_error_code;
  }

  notificationDestination(data) {
    if (data.action === 'statistics')
      return ['statistics', { backTitle: 'Книги' }];
    if (data.action === 'reader' && data.book_id)
      return [
        'reader',
        {
          book_id: data.book_id,
        },
      ];
    if (data.action === 'book' && data.book_id)
      return [
        'show',
        {
          book_id: data.book_id,
        },
      ];
    if (data.action === 'article' && data.article_code)
      return [
        'article',
        {
          code: data.article_code,
        },
      ];
    if (data.action === 'subscription')
      return [
        'subscription',
        {
          backTitle: 'Книги',
        },
      ];
    return ['home'];
  }

  open(message, attempt = 0) {
    if (attempt === 0) this.receipts.record(message && message.data, 'opened');
    if (!this.root || !this.root.navigationRef.current) {
      if (attempt < 5) setTimeout(() => this.open(message, attempt + 1), 500);
      return;
    }
    const data = message && message.data ? message.data : {};
    this.root.navigationRef.current.navigate(
      ...this.notificationDestination(data),
    );
  }
}
