const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = process.cwd();
function emittedWorker(production) {
  process.env.NODE_ENV = production ? 'production' : 'development';
  const config_path = path.join(root, 'webpack.config.js');
  delete require.cache[config_path];
  const config = require(config_path);
  const assets = {};
  const compilation = {
    hooks: {
      processAssets: {
        tap: (_, run) => run(),
      },
    },
    entrypoints: new Map([
      [
        'main',
        {
          getFiles: () => ['bundle.js'],
        },
      ],
    ]),
    outputOptions: config.output,
    fileDependencies: new Set(),
    fullHash: 'test-build',
    getAsset: () => ({
      source: {
        source: () => '<html>test</html>',
      },
    }),
    emitAsset: (name, value) => {
      assets[name] = value.source().toString();
    },
  };
  config.plugins
    .find(plugin => plugin.constructor.name === 'EmitPwaAssetsPlugin')
    .apply({
      hooks: {
        thisCompilation: {
          tap: (_, run) => run(compilation),
        },
      },
      webpack: require(path.join(root, 'node_modules/webpack')),
      inputFileSystem: fs,
    });
  assert(!assets['sw.js'].includes('__PWA_CACHE_ENABLED__'));
  return assets['sw.js'];
}
async function checkWorker(production) {
  const handlers = {},
    deleted = [],
    precached = [],
    notifications = [],
    messages = [];
  let claimed = 0,
    skipped = 0;
  const source = emittedWorker(production);
  const cache_name = source.match(/const CACHE_NAME = '([^']+)'/)[1];
  vm.runInNewContext(source, {
    self: {
      addEventListener: (name, handler) => {
        handlers[name] = handler;
      },
      skipWaiting: async () => {
        skipped++;
      },
      clients: {
        matchAll: async () => [
          { url: 'http://localhost:3001/app/', visibilityState: 'visible', postMessage: message => messages.push(message) },
          { url: 'https://other.example/app/', visibilityState: 'visible', postMessage: () => assert.fail('Unrelated tabs must not receive messages') },
        ],
        claim: async () => {
          claimed++;
        },
      },
      location: {
        origin: 'http://localhost:3001',
      },
      registration: {
        showNotification: async (title, options) => notifications.push({ title, options }),
      },
    },
    caches: {
      open: async () => ({
        addAll: async urls => {
          precached.push(...urls);
        },
      }),
      keys: async () => ['reedle-pwa-old', cache_name, 'another-app'],
      delete: async key => {
        deleted.push(key);
      },
    },
    Request: class {
      constructor(url) {
        this.url = url;
      }
    },
    URL,
  });
  let pending;
  handlers.install({
    waitUntil: promise => {
      pending = promise;
    },
  });
  await pending;
  assert.equal(skipped, 1);
  assert.equal(precached.length > 0, production);
  handlers.activate({
    waitUntil: promise => {
      pending = promise;
    },
  });
  await pending;
  assert.equal(claimed, 1);
  assert(deleted.includes('reedle-pwa-old'));
  assert.equal(deleted.includes(cache_name), !production);
  assert(!deleted.includes('another-app'));
  assert(handlers.push && handlers.notificationclick, 'Push remains available');
  handlers.push({
    data: { json: () => ({ title: 'Book ready', body: 'Continue reading', data: { book_id: '15' } }) },
    waitUntil: promise => { pending = promise; },
  });
  await pending;
  assert.equal(notifications[0].title, 'Book ready');
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'REEDLE_NOTIFICATION_RECEIVED');
  assert.equal(messages[0].notification.body, 'Continue reading');
  assert.equal(messages[0].data.book_id, '15');
  if (!production) {
    let intercepted = 0;
    for (const url of [
      '/bundle.js',
      '/main.hot-update.json',
      '/api/v2/users/me',
      '/',
    ]) {
      handlers.fetch({
        request: {
          url: 'http://localhost:3001' + url,
          method: 'GET',
        },
        respondWith: () => {
          intercepted++;
        },
      });
    }
    assert.equal(intercepted, 0, 'Dev requests bypass service worker cache');
  }
}
async function checkPage(production, controlled) {
  const source = fs.readFileSync('index.web.js', 'utf8');
  const handlers = {},
    registrations = [];
  let reloads = 0;
  const registration = {
    update: async () => {},
    addEventListener: () => {},
  };
  vm.runInNewContext(source.slice(source.indexOf('\nif (\n')), {
    process: {
      env: {
        NODE_ENV: production ? 'production' : 'development',
      },
    },
    window: {
      location: {
        pathname: production ? '/app/books/1' : '/',
        reload: () => {
          reloads++;
        },
      },
      addEventListener: () => {},
      setInterval: () => {},
    },
    document: {
      readyState: 'complete',
      addEventListener: () => {},
    },
    navigator: {
      serviceWorker: {
        controller: controlled ? {} : null,
        addEventListener: (name, handler) => {
          handlers[name] = handler;
        },
        register: async (url, options) => {
          registrations.push({
            url,
            options,
          });
          return registration;
        },
      },
    },
    console,
  });
  await Promise.resolve();
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].url, production ? '/app/sw.js' : '/sw.js');
  handlers.controllerchange();
  assert.equal(reloads, production && controlled ? 1 : 0);
  handlers.controllerchange();
  assert.equal(reloads, production ? 1 : 0);
  handlers.controllerchange();
  assert.equal(reloads, production ? 1 : 0);
}
async function checkPublishedVersion(published_name, online = true) {
  const handlers = {};
  const document_handlers = {};
  let reloads = 0;
  let requests = 0;
  const location = { pathname: '/app/books/1', href: 'https://example.test/app/books/1', origin: 'https://example.test', reload: () => { reloads++; } };
  const document = {
    readyState: 'complete', visibilityState: 'visible',
    scripts: [{ src: 'https://example.test/app/bundle.aaaaaaaa.js' }],
    addEventListener: (name, handler) => { document_handlers[name] = handler; },
  };
  const source = fs.readFileSync('index.web.js', 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('\nif (\n')), {
    process: { env: { NODE_ENV: 'production' } },
    window: { location, addEventListener: (name, handler) => { handlers[name] = handler; }, setInterval: () => {} },
    document,
    navigator: { serviceWorker: { controller: {}, addEventListener: () => {}, register: async () => ({ update: async () => {}, addEventListener: () => {} }) } },
    fetch: async (url, options) => {
      requests++;
      assert(url.startsWith('/app/index.html?pwa_update='));
      assert.equal(options.cache, 'no-store');
      if (!online) throw new Error('Offline');
      return { ok: true, text: async () => '<html></html>' };
    },
    DOMParser: class { parseFromString() { return { querySelectorAll: () => published_name ? [{ getAttribute: () => published_name }] : [] }; } },
    URL, console: { warn: () => {}, error: console.error },
  });
  await new Promise(resolve => setImmediate(resolve));
  const expected = online && published_name === 'bundle.bbbbbbbb.js' ? 1 : 0;
  assert.equal(reloads, expected);
  handlers.pageshow();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reloads, expected, 'Only one reload per page');
  const previous_requests = requests;
  document.visibilityState = 'hidden';
  document_handlers.visibilitychange();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, previous_requests, 'Hidden pages do not check the published version');
}

function checkForegroundClient() {
  const handlers = {};
  const context = vm.createContext({ document: { visibilityState: 'visible' }, navigator: { serviceWorker: {
    addEventListener: (name, handler) => { handlers[name] = handler; },
    removeEventListener: () => {},
  } } });
  vm.runInContext(fs.readFileSync('app/services/notifications/web_push_messaging_client.js', 'utf8') + '\nthis.client = new WebPushMessagingClient();', context);
  const received = [], opened = [];
  const unsubscribe = context.client.onMessage(message => received.push(message));
  context.client.onNotificationOpenedApp(message => opened.push(message));
  handlers.message({ data: { type: 'REEDLE_NOTIFICATION_RECEIVED', notification: { title: 'Book ready', body: 'Continue reading' }, data: { book_id: '15' } } });
  assert.equal(received[0].notification.title, 'Book ready');
  assert.equal(received[0].data.book_id, '15');
  assert.equal(opened.length, 0);
  context.document.visibilityState = 'hidden';
  handlers.message({ data: { type: 'REEDLE_NOTIFICATION_RECEIVED', notification: { title: 'Background' } } });
  assert.equal(received.length, 1, 'Hidden pages rely on the system notification');
  context.document.visibilityState = 'visible';
  unsubscribe();
  handlers.message({ data: { type: 'REEDLE_NOTIFICATION_RECEIVED' } });
  assert.equal(received.length, 1);
  handlers.message({ data: { type: 'REEDLE_NOTIFICATION_OPENED', data: { book_id: '15' } } });
  assert.equal(opened[0].data.book_id, '15');
}
(async () => {
  await checkPublishedVersion('bundle.bbbbbbbb.js');
  await checkPublishedVersion('bundle.aaaaaaaa.js');
  await checkPublishedVersion(null);
  await checkPublishedVersion('bundle.bbbbbbbb.js', false);
  checkForegroundClient();
  await checkWorker(false);
  await checkWorker(true);
  for (const production of [false, true])
    for (const controlled of [false, true])
      await checkPage(production, controlled);
  assert(
    !fs
      .readFileSync('public/index.html', 'utf8')
      .includes('serviceWorker.register'),
  );
  console.log(
    'PASS: foreground push delivery, hidden tab filtering, click handling, development cache bypass, production precache, reload guards',
  );
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
