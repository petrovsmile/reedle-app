const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(origin, pathname) {
  const scope = (pathname === '/app' || pathname.startsWith('/app/')) ? '/app/' : '/';
  const subscription = { endpoint: origin + '/correct-subscription', toJSON: () => ({ endpoint: origin + '/correct-subscription' }) };
  const registration = {
    scope: origin + scope,
    active: { state: 'activated' },
    pushManager: { getSubscription: async () => subscription },
  };
  const calls = [];
  const service_worker = {
    addEventListener() {},
    register: async (url, options) => { calls.push({ url, options }); return registration; },
    getRegistration: async query => { calls.push({ query }); return registration; },
    get ready() { assert.fail('ready may refer to the old root worker and must not be used'); },
  };
  const context = vm.createContext({
    navigator: { serviceWorker: service_worker, userAgent: 'Chrome', platform: 'MacIntel', maxTouchPoints: 0 },
    window: { location: { origin, pathname }, isSecureContext: true, PushManager: {}, Notification: {} },
    URL,
  });
  vm.runInContext(fs.readFileSync('app/services/notifications/web_push_messaging_client.js', 'utf8') + '\nthis.client = new WebPushMessagingClient();', context);
  return { client: context.client, registration, service_worker, subscription, calls };
}
(async () => {
  for (const origin of ['https://stage.reedle.ru', 'https://reedle.ru', 'http://127.0.0.1:3001']) {
    for (const pathname of ['/', '/app', '/app/', '/app/books/15', '/application']) {
    const scope = pathname === '/app' || pathname.startsWith('/app/') ? '/app/' : '/';
    const { client, registration, service_worker, subscription, calls } = setup(origin, pathname);
    assert.equal(await client.getToken(), subscription.endpoint);
    assert.equal(calls[0].url, scope + 'sw.js');
    assert.equal(calls[0].options.scope, scope);
    client.subscription = null;
    assert.equal((await client.registrationPayload()).subscription.endpoint, subscription.endpoint);
    assert.equal(calls.at(-1).query, scope);
    if (scope !== '/') {
      service_worker.getRegistration = async () => ({ ...registration, scope: origin + '/' });
      assert.equal(await client.currentRegistration(), null, 'Never reuse a different worker scope');
      assert.deepEqual(JSON.parse(JSON.stringify(await client.registrationPayload())), {});
    }
  }
  }
  for (const state of ['activated', 'redundant']) {
    const { client, registration } = setup('https://stage.reedle.ru', '/app/');
    let listener;
    registration.active = null;
    registration.installing = {
      state: 'installing',
      addEventListener: (_, handler) => { listener = handler; },
      removeEventListener() {},
    };
    const pending = client.getToken();
    await new Promise(resolve => setImmediate(resolve));
    registration.installing.state = state;
    if (state === 'activated') registration.active = registration.installing;
    listener();
    if (state === 'activated') assert.equal(await pending, 'https://stage.reedle.ru/correct-subscription');
    else await assert.rejects(pending, /installation failed/);
  }
  console.log('PASS: exact application worker scope on stage/production/local, old root worker rejection, activation and failed installation');
})().catch(error => { console.error(error); process.exitCode = 1; });
