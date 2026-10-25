class NotificationReceiptService {
  constructor() {
    this.queue = Promise.resolve();
  }

  record(data, event) {
    if (!data || !data.notification_id || !data.receipt_token) return Promise.resolve();
    const receipt = {
      notification_id: String(data.notification_id),
      receipt_token: data.receipt_token,
      event: event,
    };
    return this.schedule(async () => {
      const pending = await this.pendingReceipts();
      const key = this.receiptKey(receipt);
      if (!pending.some(item => this.receiptKey(item) === key)) pending.push(receipt);
      await storage.set('notification_receipts', JSON.stringify(pending));
      await this.sendPendingReceipts();
    });
  }

  receiptKey(receipt) {
    return receipt.notification_id + ':' + receipt.event;
  }

  async pendingReceipts() {
    return JSON.parse(await storage.get('notification_receipts', '[]'));
  }

  schedule(work) {
    this.queue = this.queue.catch(() => {}).then(work).catch(error => {
      console.warn('Unable to synchronize notification events:', error.message);
    });
    return this.queue;
  }

  flush() {
    return this.schedule(() => this.sendPendingReceipts());
  }

  async sendPendingReceipts() {
    const pending = await this.pendingReceipts();
    for (const receipt of pending.slice()) {
      try {
        if (Platform.OS === 'web') {
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration || !registration.active) break;
          // Wait for durable storage in the worker before removing the page copy.
          await new Promise((resolve, reject) => {
            const channel = new MessageChannel();
            const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Receipt storage timed out')); }, 10000);
            channel.port1.onmessage = event => {
              clearTimeout(timeout);
              channel.port1.close();
              if (event.data && event.data.saved) resolve();
              else reject(new Error('Receipt storage failed'));
            };
            registration.active.postMessage({ type: 'REEDLE_NOTIFICATION_EVENT', receipt }, [channel.port2]);
          });
        } else {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          let response;
          try {
            response = await fetch(HOST + '/api/v2/notifications/' + encodeURIComponent(receipt.notification_id) + '/events', {
              method: 'POST', credentials: 'omit', signal: controller.signal,
              headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(receipt),
            });
          } finally {
            clearTimeout(timeout);
          }
          if (!response.ok && ![400, 401, 404, 422].includes(response.status)) break;
        }
        pending.splice(pending.findIndex(item => this.receiptKey(item) === this.receiptKey(receipt)), 1);
        await storage.set('notification_receipts', JSON.stringify(pending));
      } catch (_) {
        break;
      }
    }
    if (Platform.OS === 'web') {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) registration.active.postMessage({ type: 'REEDLE_RETRY_NOTIFICATION_EVENTS' });
    }
  }
}
