class UserDeviceRegistration {
  constructor(client) {
    this.client = client;
    this.registration_queue = Promise.resolve();
  }

  platform() {
    return (this.client && this.client.platform) || Platform.OS;
  }

  async subscriptionPayload() {
    if (!this.client || !this.client.registrationPayload) return {};
    return this.client.registrationPayload();
  }

  async register(token) {
    if (!token) return;
    // Startup, reconnect and token refresh must reuse the first registration key.
    this.registration_queue = this.registration_queue
      .catch(() => {})
      .then(() => this.saveRegistration(token));
    return this.registration_queue;
  }

  async saveRegistration(token) {
    const response = await new Request(
      '/api/v2/user_devices',
      {
        token,
        registration_key: await storage.get(
          'user_device_registration_key',
        ),
        platform: this.platform(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        app_version: APP_VERSION,
        ...(await this.subscriptionPayload()),
      },
      {
        do_not_show_error: true,
      },
    ).post();
    if (response === false) {
      if (this.client && this.client.platform === 'web')
        this.client.last_error_code = 'registration_failed';
      throw new Error('Unable to register notification device');
    }
    await storage.set('user_device_token', token);
    await storage.set('user_device_id', response.id.toString());
    if (response.registration_key) {
      await storage.set(
        'user_device_registration_key',
        response.registration_key,
      );
    }
    return true;
  }

  async disable() {
    const token = await storage.get('user_device_token');
    if (!token) return;
    await new Request(
      '/api/v2/user_devices',
      {
        token,
        registration_key: await storage.get(
          'user_device_registration_key',
        ),
      },
      {
        do_not_show_error: true,
      },
    ).delete();
  }

  async clearRegistration() {
    await storage.remove('user_device_token');
    await storage.remove('user_device_id');
    // Keep the key so the same token can be enabled again after opting out.
  }

  async detachUser() {
    await this.registration_queue.catch(() => {});
    const token = await storage.get('user_device_token');
    if (!token) return true;
    const registration_key = await storage.get(
      'user_device_registration_key',
    );
    if (!registration_key) return false;
    const response = await new Request(
      '/api/v2/user_devices',
      {
        token,
        registration_key: registration_key,
        platform: this.platform(),
        detach: true,
        ...(await this.subscriptionPayload()),
      },
      {
        do_not_show_error: true,
      },
    ).post();
    return response !== false;
  }
}
