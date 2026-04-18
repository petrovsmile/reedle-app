# Загрузка на TestFlight через GitHub Actions

## 📋 Предварительные условия

1. Приложение уже зарегистрировано в App Store Connect
2. Сертификат подписания создан в Apple Developer
3. Provisioning Profile создан для App Store

## 🔐 Шаг 1: Получить App Store Connect API Key

### На macOS (локально):

1. Перейдите на [App Store Connect](https://appstoreconnect.apple.com)
2. Нажмите на ваше имя (верхний правый угол) → **Users and Access**
3. Перейдите на вкладку **Keys**
4. Нажмите **+** рядом с "App Store Connect API Keys"
5. Заполните форму:
   - **Key Name**: `GitHub Actions` (или ваше имя)
   - **Access Level**: `Admin`
6. Нажмите **Generate**
7. **Важно**: Скачайте файл сразу! Он больше не будет доступен
   - Файл называется `AuthKey_XXXXXXXX.p8`

### Информация, которая вам понадобится:

- **Key ID**: `XXXXXXXX` (буквы после `AuthKey_` и перед `.p8`)
- **Issuer ID**: видно на той же странице
- **Bundle ID**: см. в Xcode или App Store Connect
- **Team ID**: в Apple Developer Account

## 🔑 Шаг 2: Добавить Secrets в GitHub

1. Откройте репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

Добавьте следующие Secrets:

### 1. API Key (base64)

```bash
# На вашей машине где скачан AuthKey_*.p8:
base64 -i ~/Downloads/AuthKey_XXXXXXXX.p8 | pbcopy
```

В GitHub добавьте Secret:
- **Name**: `APP_STORE_CONNECT_API_KEY`
- **Secret**: Вставьте из буфера обмена

### 2. Key ID

- **Name**: `APP_STORE_CONNECT_API_KEY_ID`
- **Secret**: `XXXXXXXX` (из имени файла)

### 3. Issuer ID

- **Name**: `APP_STORE_CONNECT_ISSUER_ID`
- **Secret**: ID с страницы Keys в App Store Connect

## ✅ Шаг 3: Обновить Fastlane конфигурацию

Откройте `ios/fastlane/Fastfile` и замените:

```ruby
app_identifier: "com.your.app.identifier",  # ← На ваш Bundle ID
```

Найдите ваш Bundle ID:
- В Xcode: Project → Targets → General → Bundle Identifier
- В App Store Connect: App Information → Bundle ID

## 🚀 Шаг 4: Запустить сборку

### Вариант 1: Автоматически при push в main

```bash
git push origin main
```

Сборка запустится автоматически. Смотрите в Actions → iOS Build & Upload to TestFlight

### Вариант 2: Ручной запуск

1. Перейдите в **Actions** репозитория
2. Выберите **iOS Build & Upload to TestFlight**
3. Нажмите **Run workflow**

## 📊 Что происходит в workflow

1. ✅ Checkout кода
2. ✅ Установка Node.js зависимостей
3. ✅ Установка Ruby и Cocoapods
4. ✅ Установка Pod-ов
5. ✅ Распаковка API Key из Secrets
6. ✅ Сборка приложения (Release)
7. ✅ Создание архива (.xcarchive)
8. ✅ Экспорт в IPA через Fastlane
9. ✅ Загрузка на TestFlight
10. ✅ Комментарий в PR с результатом

## 📥 Скачать build с TestFlight

После успешной загрузки:

1. Откройте [App Store Connect](https://appstoreconnect.apple.com)
2. Выберите ваше приложение
3. Перейдите в **TestFlight** → **iOS**
4. Вы увидите новый build в очереди на обработку
5. Когда обработка завершится, сможете скачать через TestFlight приложение на устройстве

## 🐛 Решение проблем

### Ошибка: "Signing error"

- Проверьте что Team ID правильный в Xcode
- Убедитесь что Bundle ID совпадает в App Store Connect и Xcode
- Попробуйте запустить локально: `xcodebuild -workspace ios/read_en.xcworkspace -scheme read_en archive`

### Ошибка: "API Key invalid"

- Проверьте что Key ID и Issuer ID правильные
- Убедитесь что .p8 файл правильно закодирован в base64
- Key может быть удален в Apple - создайте новый

### Ошибка: "Bundle ID not found"

- Проверьте Bundle ID в `ios/fastlane/Fastfile`
- Убедитесь что приложение создано в App Store Connect с этим Bundle ID

### Ошибка: "Device is not registered"

- Разрегистрируйте и заново зарегистрируйте устройство в Apple Developer
- Заново создайте Provisioning Profile

### Workflow зависает на "Upload to TestFlight"

- Это нормально, может занять несколько минут
- Можно отключить ожидание обработки в Fastfile:
  ```ruby
  skip_waiting_for_build_processing: true
  ```

## 📝 Полезные команды (локально)

```bash
# Установить fastlane
sudo gem install fastlane -NV

# Проверить конфигурацию
cd ios && fastlane --help

# Запустить локально (требует API Key в ~/.appstoreconnect)
fastlane build_testflight
```

## 🔒 Безопасность

- ✅ API Key хранится только в GitHub Secrets
- ✅ API Key не логируется в workflow
- ✅ Используется ограниченный ключ (Admin, но можно сделать более узкие права)
- ✅ Key можно в любой момент удалить в App Store Connect

## 📚 Дополнительно

- [Fastlane документация](https://docs.fastlane.tools/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [GitHub Actions для iOS](https://github.com/fastlane/fastlane)
