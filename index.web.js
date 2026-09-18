import { AppRegistry } from 'react-native';
import App from './App'; // ← путь к вашему компоненту в папке app
import appConfig from './app.json';

const { name: appName } = appConfig;

AppRegistry.registerComponent(appName, () => App);

// Монтируем приложение в DOM
if (typeof document !== 'undefined') {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root')
  });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const splash = document.getElementById('pwa-splash');
      if (!splash) return;
      splash.classList.add('pwa-splash-hidden');
      window.setTimeout(() => splash.remove(), 200);
    });
  });
}

if (
  process.env.NODE_ENV === 'production' &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;

  const applyWaitingUpdate = (registration) => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const registerWorker = () => {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/', updateViaCache: 'none' })
      .then((registration) => {
        applyWaitingUpdate(registration);

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') applyWaitingUpdate(registration);
          });
        });

        const checkForUpdate = () => {
          registration.update()
            .then(() => applyWaitingUpdate(registration))
            .catch((error) => console.warn('PWA update check failed:', error));
        };
        checkForUpdate();
        window.addEventListener('focus', checkForUpdate);
        window.addEventListener('online', checkForUpdate);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
        window.setInterval(checkForUpdate, 60 * 60 * 1000);
      })
      .catch((error) => console.error('Service worker registration failed:', error));
  };

  if (document.readyState === 'complete') registerWorker();
  else window.addEventListener('load', registerWorker, { once: true });
}
