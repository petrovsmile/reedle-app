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
    if (process.env.NODE_ENV !== 'production') return;
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const registerWorker = () => {
    const scope = (window.location.pathname === '/app' || window.location.pathname.startsWith('/app/')) ? '/app/' : '/';
    navigator.serviceWorker.register(scope + 'sw.js', { scope, updateViaCache: 'none' })
      .then((registration) => {
        applyWaitingUpdate(registration);

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed') applyWaitingUpdate(registration);
          });
        });

        let checking_version = false;
        const checkPublishedVersion = async () => {
          if (process.env.NODE_ENV !== 'production' || checking_version || reloading || document.visibilityState === 'hidden') return;
          const bundle_pattern = /(?:^|\/)bundle\.[a-f0-9]+\.js(?:[?#]|$)/i;
          const loaded_bundle = Array.from(document.scripts || [])
            .map(script => new URL(script.src, window.location.href))
            .find(url => url.origin === window.location.origin && bundle_pattern.test(url.pathname));
          if (!loaded_bundle) return;
          checking_version = true;
          try {
            const response = await fetch(scope + 'index.html?pwa_update=' + Date.now(), { cache: 'no-store' });
            if (!response.ok) return;
            const page = new DOMParser().parseFromString(await response.text(), 'text/html');
            const published_bundle = Array.from(page.querySelectorAll('script[src]'))
              .map(script => new URL(script.getAttribute('src'), new URL(scope, window.location.href)))
              .find(url => url.origin === window.location.origin && bundle_pattern.test(url.pathname));
            if (published_bundle && published_bundle.pathname !== loaded_bundle.pathname && !reloading) {
              reloading = true;
              window.location.reload();
            }
          } catch (error) {
            console.warn('PWA version check failed:', error);
          } finally {
            checking_version = false;
          }
        };
        const checkForUpdate = () => {
          registration.update()
            .then(() => applyWaitingUpdate(registration))
            .catch((error) => console.warn('PWA update check failed:', error));
          checkPublishedVersion();
        };
        checkForUpdate();
        window.addEventListener('focus', checkForUpdate);
        window.addEventListener('online', checkForUpdate);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
        window.addEventListener('pageshow', checkForUpdate);
        window.setInterval(checkForUpdate, 5 * 60 * 1000);
      })
      .catch((error) => console.error('Service worker registration failed:', error));
  };

  if (document.readyState === 'complete') registerWorker();
  else window.addEventListener('load', registerWorker, { once: true });
}
