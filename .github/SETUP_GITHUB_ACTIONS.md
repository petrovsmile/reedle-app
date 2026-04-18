# GitHub Actions для iOS сборки

## Описание

Два workflow файла для автоматической сборки iOS приложения:

1. **Обычная сборка** (`ios-build`) - для PR и веток develop/main
2. **Сборка с подписью** (`build-with-signing`) - только на main ветке при push

## Настройка для простой сборки (без подписи)

Обычная сборка работает "из коробки", поскольку использует опции без подписи:

```yaml
CODE_SIGN_IDENTITY="" 
CODE_SIGNING_REQUIRED=NO
```

Просто закоммитьте файлы в репозиторий, и сборка начнет работать на всех PR и push в main/develop.

## Настройка для сборки с подписью и создания IPA

Для создания подписанного IPA нужны следующие Secrets в GitHub:

### 1. Экспортировать сертификат подписи

На локальной машине:

```bash
# Откройте Keychain Access
# Найдите свой сертификат "iPhone Distribution: ..."
# Экспортируйте как .p12 файл с паролем
# Затем конвертируйте в base64

base64 -i ~/path/to/certificate.p12 | pbcopy
# Скопируется в буфер обмена
```

### 2. Экспортировать provisioning profile

```bash
# Provisioning profile обычно находится в:
# ~/Library/MobileDevice/Provisioning Profiles/

# Найдите нужный .mobileprovision файл и конвертируйте:
base64 -i ~/Library/MobileDevice/Provisioning\ Profiles/YourProfile.mobileprovision | pbcopy
```

### 3. Добавить Secrets в GitHub репозиторий

1. Перейти в Settings → Secrets and variables → Actions
2. Нажать "New repository secret" и добавить:

| Название | Значение |
|----------|----------|
| `SIGNING_CERTIFICATE_P12_DATA` | Base64-кодированный .p12 файл сертификата |
| `SIGNING_CERTIFICATE_PASSWORD` | Пароль к сертификату .p12 |
| `PROVISIONING_PROFILE_DATA` | Base64-кодированный .mobileprovision файл |

### 4. Обновить exportOptions.plist

Откройте `ios/exportOptions.plist` и установите:

```xml
<key>teamID</key>
<string>YOUR_TEAM_ID</string>
```

Ваш Team ID можно найти:
1. На Apple Developer
2. В Xcode: Preferences → Accounts → Team ID
3. В сертификате: правой кнопкой → Get Info → Team ID

### 5. (Опционально) Обновить scheme

Если ваш scheme не называется `read_en`, обновите в workflow:

```yaml
-scheme read_en  # Измените на ваш scheme name
```

## Проверка сборки

1. Закоммитьте изменения
2. Перейдите в Actions → iOS Build
3. Нажмите "Run workflow" для ручного запуска
4. Смотрите логи в процессе выполнения

## Результаты

После успешной сборки:

- **Обычная сборка**: артефакт `ios-build` с папкой build
- **Сборка с подписью**: артефакт `ios-ipa` с готовым .ipa файлом

IPA можно загрузить в App Store Connect через Xcode или Application Loader.

## Решение проблем

### Ошибка: "Code signing error"

- Проверьте что сертификат и provisioning profile соответствуют Bundle ID
- Убедитесь что Team ID правильный в exportOptions.plist

### Ошибка: "No signing identity found"

- Проверьте что Secrets добавлены правильно
- Убедитесь что пароль к сертификату правильный

### Ошибка при установке зависимостей

- Убедитесь что Podfile.lock в репозитории (не в .gitignore)
- Проверьте что CocoaPods совместим с вашей версией React Native

## Дополнительные ресурсы

- [GitHub Actions для iOS](https://github.com/fastlane/fastlane)
- [Apple Developer Certificates](https://developer.apple.com/certificates/)
- [React Native iOS сборка](https://reactnative.dev/docs/building-for-apple)
