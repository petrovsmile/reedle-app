const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function checkNativeReceipts() {
  const stored = new Map(), requests = [];
  let online = false;
  const context = vm.createContext({
    Platform: { OS: 'ios' }, HOST: 'https://api.example.test',
    storage: { get: async (key, fallback) => stored.get(key) || fallback, set: async (key, value) => stored.set(key, value) },
    AbortController, setTimeout, clearTimeout, console,
    fetch: async (url, options) => {
      if (!online) throw new Error('Offline');
      requests.push({ url, options });
      return { ok: true, status: 200 };
    },
  });
  const source = fs.readFileSync('app/services/notifications/notification_receipt_service.js', 'utf8');
  vm.runInContext(source + '\nthis.receipts = new NotificationReceiptService();', context);
  const data = { notification_id: '123', receipt_token: 'signed-receipt' };
  await Promise.all([context.receipts.record(data, 'delivered'), context.receipts.record(data, 'opened')]);
  assert.equal(JSON.parse(stored.get('notification_receipts')).length, 2);
  await context.receipts.record(data, 'opened');
  assert.equal(JSON.parse(stored.get('notification_receipts')).length, 2, 'Pending duplicates are coalesced');
  vm.runInContext('this.receipts = new NotificationReceiptService();', context);
  online = true;
  await context.receipts.flush();
  assert.equal(requests.length, 2, 'Receipts survive restarting the service');
  assert.equal(requests[0].url, 'https://api.example.test/api/v2/notifications/123/events');
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(JSON.parse(requests[1].options.body).event, 'opened');
  assert.deepEqual(JSON.parse(stored.get('notification_receipts')), []);
  await context.receipts.record({}, 'delivered');
  assert.equal(requests.length, 2, 'Old notifications without a receipt token remain compatible');
}

function fakeDatabase(entries) {
  const database = {
    close() {},
    transaction() {
      const transaction = { objectStore: () => ({
        put: entry => request(() => entries.set(entry.key, entry)),
        getAll: () => request(() => [...entries.values()]),
        delete: key => request(() => entries.delete(key)),
      }) };
      function request(operation) {
        const result = { result: operation() };
        queueMicrotask(() => transaction.oncomplete());
        return result;
      }
      return transaction;
    },
  };
  return { open: () => {
    const request = { result: database };
    queueMicrotask(() => request.onsuccess());
    return request;
  } };
}

async function checkWorkerReceipts() {
  const entries = new Map(), requests = [], handlers = {}, actions = [];
  let online = false, show_failure = false;
  const context = vm.createContext({
    indexedDB: fakeDatabase(entries), URL, AbortController, setTimeout, clearTimeout, console,
    fetch: async (url, options) => {
      actions.push('receipt');
      if (!online) throw new Error('Offline');
      requests.push({ url, body: JSON.parse(options.body) });
      return { ok: true, status: 200 };
    },
    self: {
      location: { origin: 'https://app.example.test' },
      addEventListener: (name, handler) => { handlers[name] = handler; },
      registration: {
        sync: { register: async () => {} },
        showNotification: async () => { if (show_failure) throw new Error('Display failed'); actions.push('shown'); },
      },
      clients: { matchAll: async () => [], openWindow: async () => { actions.push('window'); } },
    },
  });
  const source = fs.readFileSync('public/sw.js', 'utf8').replace('__APP_SHELL_ASSETS__', '').replaceAll('__PUBLIC_PATH__', '/');
  vm.runInContext(source, context);
  let pending;
  const data = { notification_id: '456', receipt_token: 'signed-receipt', action: 'reader', book_id: '15' };
  handlers.push({ data: { json: () => ({ title: 'Book ready', body: 'Read', data }) }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(actions[0], 'shown', 'Delivery is recorded after display succeeds');
  assert.equal(entries.size, 1, 'Offline delivery receipt is durable');
  handlers.notificationclick({ notification: { data, close() {} }, waitUntil: promise => { pending = promise; } });
  await pending;
  assert(actions.includes('window'), 'Offline receipt submission does not prevent opening the app');
  assert.equal(entries.size, 2);
  online = true;
  handlers.sync({ tag: 'reedle-notification-events', waitUntil: promise => { pending = promise; } });
  await pending;
  assert.equal(entries.size, 0);
  assert.deepEqual(requests.map(request => request.body.event).sort(), ['delivered', 'opened']);
  show_failure = true;
  handlers.push({ data: { json: () => ({ data: { ...data, notification_id: '789' } }) }, waitUntil: promise => { pending = promise; } });
  await assert.rejects(pending, /Display failed/);
  assert.equal(requests.length, 2, 'Failed display must not be marked delivered');
}
(async () => {
  await checkNativeReceipts();
  await checkWorkerReceipts();
  console.log('PASS: durable native and worker receipt queues, retry after restart/offline, idempotent pending events, display-before-delivery and offline click handling');
})().catch(error => { console.error(error); process.exitCode = 1; });
