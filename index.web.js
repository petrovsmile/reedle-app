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
}

if (
  process.env.NODE_ENV === 'production' &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  let reloadForUpdate = false;

  const notifyUpdateAvailable = (registration) => {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;

    window.reedlePwaUpdateRegistration = registration;
    window.dispatchEvent(new CustomEvent('reedle:pwa-update-available'));
  };

  window.reedleApplyPwaUpdate = () => {
    const registration = window.reedlePwaUpdateRegistration;
    if (!registration || !registration.waiting) return;

    reloadForUpdate = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadForUpdate) return;
    reloadForUpdate = false;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' })
      .then((registration) => {
        notifyUpdateAvailable(registration);

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') notifyUpdateAvailable(registration);
          });
        });

        window.setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
