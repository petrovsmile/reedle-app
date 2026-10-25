const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
  const stored = new Map(),
    requests = [];
  const client = {
    platform: 'web',
    setAutoInitEnabled: async () => {},
    registerDeviceForRemoteMessages: async () => {},
    getToken: async () => 'guest-token',
    deleteToken: async () => {},
    registrationPayload: async () => ({
      subscription: {
        endpoint: 'https://push.test/guest',
      },
    }),
  };
  const async_storage = {
    getItem: async key => (stored.has(key) ? stored.get(key) : null),
    setItem: async (key, value) => stored.set(key, value),
    removeItem: async key => stored.delete(key),
  };
  class Request {
    constructor(url, params) {
      this.url = url;
      this.params = params;
    }
    async post() {
      requests.push(this);
      if (requests.length > 1)
        assert.equal(this.params.registration_key, 'device-secret');
      return requests.length === 1
        ? {
            id: 123,
            registration_key: 'device-secret',
          }
        : {
            id: 123,
          };
    }
    async delete() {
      requests.push(this);
      return {
        success: true,
      };
    }
  }
  const context = {
    AsyncStorage: async_storage,
    Request,
    appStore: {
      current_user: false,
      has_internet: true,
    },
    Platform: {
      OS: 'web',
    },
    APP_VERSION: require('../package.json').version,
    Intl,
    setTimeout,
    clearTimeout,
    console,
    Notification: {
      permission: 'granted',
    },
  };
  vm.createContext(context);
  const service_files = [
    'app/services/storage.js',
    'app/services/notifications/user_device_registration.js',
    'app/services/notifications/push_notification_service.js',
  ];
  vm.runInContext(
    service_files.map(file => fs.readFileSync(file, 'utf8')).join('\n') +
      `
    const storage = new Storage();
    this.createPushService = (client) => {
      const registration = new UserDeviceRegistration(client);
      return new PushNotificationService(client, registration, {record: () => Promise.resolve(), flush: () => Promise.resolve()});
    };
  `,
    context,
  );
  return {
    service: context.createPushService(client),
    client,
    stored,
    requests,
    context,
  };
}
(async () => {
  {
    const { service, context } = setup();
    const alerts = [], destinations = [];
    context.AppAlert = { alert: (...args) => alerts.push(args) };
    service.root = { navigationRef: { current: { navigate: (...args) => destinations.push(args) } } };
    const receipts = [], shown_notifications = [];
    const message = { notification: { title: 'Book ready', body: 'Continue reading' }, data: { action: 'reader', book_id: '15' } };
    service.receipts.record = (data, event) => receipts.push({data, event});
    await service.showForegroundMessage(message);
    assert.equal(alerts.length, 0, 'Web uses the worker notification');
    assert.equal(receipts.length, 0, 'Worker records web delivery');
    service.client.platform = 'android';
    service.foreground_notifications = {
      showNotification: async (...args) => { shown_notifications.push(args); return true; },
    };
    await service.showForegroundMessage(message);
    assert.equal(shown_notifications.length, 1);
    assert.equal(receipts[0].event, 'delivered');
    assert.equal(destinations.length, 0, 'Receiving does not navigate');
    service.open(message);
    assert.equal(receipts[1].event, 'opened');
    assert.deepEqual(JSON.parse(JSON.stringify(destinations)), [['reader', { book_id: '15' }]]);
    service.foreground_notifications.showNotification = async () => false;
    await service.showForegroundMessage(message);
    assert.equal(receipts.length, 2, 'Blocked notifications are not marked delivered');
    service.client.platform = 'ios';
    service.foreground_notifications = null;
    await service.showForegroundMessage(message);
    assert.equal(receipts.length, 3, 'iOS system presentation records delivery');
    assert.equal(alerts.length, 0, 'No platform displays a modal');
  }
  {
    const { service, stored, requests } = setup();
    await Promise.all([
      service.sendToken('guest-token'),
      service.sendToken('guest-token'),
    ]);
    assert.equal(requests.length, 2);
    assert.equal(stored.get('user_device_id'), '123');
    assert.equal(
      stored.get('user_device_registration_key'),
      'device-secret',
    );
    assert(requests.every(request => !('user_id' in request.params)));
    await service.detachCurrentUser();
    assert.equal(requests.at(-1).params.detach, true);
    assert.equal(stored.get('user_device_token'), 'guest-token');
    await service.disable();
    assert.equal(requests.at(-1).params.registration_key, 'device-secret');
    assert.equal(stored.get('push_notifications_enabled'), 'false');
    assert.equal(stored.get('user_device_token'), undefined);
    assert.equal(
      stored.get('user_device_registration_key'),
      'device-secret',
    );
  }
  {
    const { service, requests } = setup();
    await service.syncDevice();
    assert.equal(
      requests.length,
      1,
      'Guest with granted permission registers without login',
    );
  }
  {
    const { service, stored, requests } = setup();
    stored.set('push_notifications_enabled', 'false');
    await service.syncDevice();
    assert.equal(
      requests.length,
      0,
      'Explicitly disabled notifications stay disabled',
    );
  }
  {
    const { service, client, stored } = setup();
    let requested = false;
    client.requestPermission = () => {
      requested = true;
      return Promise.resolve(1);
    };
    const enabling = service.enable();
    assert(
      requested,
      'Browser permission is requested directly from the click',
    );
    assert.equal(await enabling, true);
    assert.equal(stored.get('push_notifications_enabled'), 'true');
  }
  {
    const { service } = setup();
    const destinations = [];
    service.root = {
      navigationRef: {
        current: {
          navigate: (...args) => destinations.push(args),
        },
      },
    };
    const notifications = [
      [
        {
          action: 'reader',
          book_id: 15,
        },
        [
          'reader',
          {
            book_id: 15,
          },
        ],
      ],
      [
        {
          action: 'book',
          book_id: 15,
        },
        [
          'show',
          {
            book_id: 15,
          },
        ],
      ],
      [
        {
          action: 'article',
          article_code: 'news',
        },
        [
          'article',
          {
            code: 'news',
          },
        ],
      ],
      [
        {
          action: 'subscription',
        },
        [
          'subscription',
          {
            backTitle: 'Книги',
          },
        ],
      ],
      [
        {
          action: 'unknown',
        },
        ['home'],
      ],
      [
        {
          action: 'reader',
        },
        ['home'],
      ],
    ];
    for (const [data, expected] of notifications) {
      service.open({
        data,
      });
      assert.deepEqual(
        JSON.parse(JSON.stringify(destinations.at(-1))),
        expected,
      );
    }
  }
  for (const platform of ['ios', 'android', 'web']) {
    const { service, client, context, requests } = setup();
    context.Platform.OS = platform;
    client.platform = platform;
    await service.sendToken('guest-token');
    assert.equal(requests[0].params.app_version, require('../package.json').version);
  }
  {
    const { service, context, requests } = setup();
    context.appStore.has_internet = false;
    await service.syncDevice();
    assert.equal(requests.length, 0, 'Offline startup does not request a VAPID key');
  }
  {
    const { service, client, context } = setup();
    const warnings = [];
    context.console = { ...console, warn: (...args) => warnings.push(args) };
    client.getToken = async () => { throw new Error('Unable to obtain VAPID public key: public_key_failed'); };
    await assert.doesNotReject(() => service.syncDevice());
    assert.equal(warnings.length, 1, 'Registration errors are handled by syncDevice');
  }
  console.log(
    'PASS: guest registration, concurrent registration, device key persistence, anonymous detach/disable, notification opt-out, click permission timing, notification navigation',
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
