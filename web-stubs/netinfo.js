const connectedState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi',
};

const NetInfo = {
  async fetch() {
    return connectedState;
  },

  addEventListener(listener) {
    setTimeout(() => listener(connectedState), 0);
    return () => {};
  },
};

export default NetInfo;
