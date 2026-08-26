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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' })
      .catch((error) => console.error('Service worker registration failed:', error));
  });
}
