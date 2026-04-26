import { AppRegistry } from 'react-native';
import App from './App'; // ← путь к вашему компоненту в папке app
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Монтируем приложение в DOM
if (typeof document !== 'undefined') {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root')
  });
}