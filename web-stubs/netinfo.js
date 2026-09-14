function currentState(isConnected) {
  const connection = typeof navigator === 'undefined'
    ? null
    : (navigator.connection || navigator.mozConnection || navigator.webkitConnection);

  return {
    isConnected,
    isInternetReachable: isConnected,
    type: connection && connection.type ? connection.type : 'unknown',
  };
}

async function checkConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return true;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => {
    if (controller) controller.abort();
  }, 5000);

  try {
    const response = await window.fetch('/api/v1/target_version?connectivity_check=' + Date.now(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      ...(controller ? { signal: controller.signal } : {}),
    });
    return response.ok;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

const NetInfo = {
  async fetch() {
    return currentState(await checkConnection());
  },

  addEventListener(listener) {
    let disposed = false;
    let checking = false;

    const notify = async () => {
      if (checking || disposed) return;
      checking = true;
      const isConnected = await checkConnection();
      checking = false;
      if (!disposed) listener(currentState(isConnected));
    };
    const initialNotification = setTimeout(notify, 0);
    const connectionInterval = setInterval(notify, 10000);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', notify);
      window.addEventListener('offline', notify);
    }

    return () => {
      disposed = true;
      clearTimeout(initialNotification);
      clearInterval(connectionInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', notify);
        window.removeEventListener('offline', notify);
      }
    };
  },
};

export default NetInfo;
