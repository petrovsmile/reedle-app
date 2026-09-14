function currentState() {
  const isConnected = typeof navigator === 'undefined' ? true : navigator.onLine;
  const connection = typeof navigator === 'undefined'
    ? null
    : (navigator.connection || navigator.mozConnection || navigator.webkitConnection);

  return {
    isConnected,
    isInternetReachable: isConnected,
    type: connection && connection.type ? connection.type : 'unknown',
  };
}

const NetInfo = {
  async fetch() {
    return currentState();
  },

  addEventListener(listener) {
    const notify = () => listener(currentState());
    const initialNotification = setTimeout(notify, 0);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', notify);
      window.addEventListener('offline', notify);
    }

    return () => {
      clearTimeout(initialNotification);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', notify);
        window.removeEventListener('offline', notify);
      }
    };
  },
};

export default NetInfo;
