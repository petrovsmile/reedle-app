const messagingClient = {
  onMessage: () => () => {},
  onNotificationOpenedApp: () => () => {},
  onTokenRefresh: () => () => {},
  getInitialNotification: async () => null,
  requestPermission: async () => 0,
  setAutoInitEnabled: async () => {},
  registerDeviceForRemoteMessages: async () => {},
  getToken: async () => null,
  deleteToken: async () => {},
};

export default function messaging() {
  return messagingClient;
}

export function getMessaging() {
  return messagingClient;
}
