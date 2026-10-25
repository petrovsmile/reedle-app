# Reading progress API

Клиент считает активную читательскую сессию, временно держит неотправленные сессии в очереди при отсутствии сети и считает сервер единственным источником статистики. Неавторизованные сессии не записываются.

Все пользовательские эндпоинты определяют владельца по персональному Bearer-токену. Клиент не передает `user_id`. Статический API-токен приложения используется только для публичных запросов и совместимости.

## Сессии

`POST /api/v2/reading/sessions`

```json
{
  "session_id": "mabc-123-xyz",
  "book_id": 17,
  "book_name": "The Great Gatsby",
  "started_at": "2026-10-15T15:00:00.000Z",
  "finished_at": "2026-10-15T15:18:00.000Z",
  "active_seconds": 840,
  "start_page": 12,
  "end_page": 17,
  "start_percent": 20,
  "end_percent": 28,
  "finish_reason": "reader_closed"
}
```

`session_id` уникален. Повторный запрос должен быть идемпотентным и возвращать существующую запись. На сервере следует ограничить `active_seconds` длительностью сессии и разумным максимумом.

## Краткая сводка для главной

`GET /api/v2/reading/statistics/summary?timezone=Europe/Moscow`

```json
{
  "today": { "minutes": 12, "pages": 4, "words_added": 3 },
  "goal": { "reading_minutes_per_day": 15 },
  "streak": { "current_days": 4 },
  "notification": {
    "id": "goal-almost-done-2026-10-15",
    "title": "Ещё немного",
    "message": "До дневной цели осталось 3 минуты",
    "action": "statistics"
  }
}
```

## Страница статистики

`GET /api/v2/reading/statistics?period=week&timezone=Europe/Moscow`

Допустимые периоды:

- `week` — последние 7 дней, одна точка графика на день;
- `month` — последние 30 дней, одна точка на день;
- `year` — последние 12 календарных месяцев, одна точка на месяц.

Начало и конец периода сервер рассчитывает сам в переданном часовом поясе. Клиентские даты не используются как источник истины.

```json
{
  "period": "week",
  "today": { "minutes": 12, "pages": 4, "words_added": 3 },
  "streak": { "current_days": 4, "best_days": 11 },
  "books_completed": 2,
  "totals": {
    "minutes": 94,
    "pages": 31,
    "words_added": 18,
    "sessions": 9
  },
  "goals_progress": {
    "reading_days": { "current": 4, "target": 5 },
    "books": { "current": 1, "target": 2 }
  },
  "points": [
    { "date": "2026-10-09", "label": "Пт", "minutes": 8 },
    { "date": "2026-10-10", "label": "Сб", "minutes": 15 }
  ]
}
```

Для `year` точка может иметь вид `{ "date": "2026-01", "label": "Янв", "minutes": 320 }`. Пустые дни или месяцы обязательно возвращаются с нулевыми значениями, чтобы график не менял шкалу времени. На время миграции клиент также понимает прежнее поле `days`, но новый API должен возвращать `points`.

Сервер агрегирует данные в часовом поясе пользователя. `today`, недельная цель по активным дням и месячная цель по книгам не зависят от выбранного периода графика. Страница никогда не строит итоговую статистику из локальной очереди.

## Цели

- `GET /api/v2/reading/goals`
- `PUT /api/v2/reading/goals`

```json
{
  "reading_minutes_per_day": 15,
  "reading_days_per_week": 5,
  "books_per_month": 1,
  "reminder_enabled": true,
  "reminder_hour": 19,
  "timezone": "Europe/Moscow"
}
```

Ограничения: минуты `1..240`, дни `1..7`, книги `1..30`, час `0..23`.

## Push-устройства

- `POST /api/v2/push_devices` — создать или обновить устройство по уникальному токену.
- `DELETE /api/v2/push_devices` — отключить токен.

```json
{
  "token": "FCM_TOKEN",
  "platform": "ios",
  "timezone": "Europe/Moscow",
  "app_version": "2.0.0"
}
```

Backend отправляет уведомления через Firebase Cloud Messaging HTTP v1. Payload должен содержать видимое `notification` и `data`:

```json
{
  "notification": { "title": "Время почитать", "body": "До цели осталось 8 минут" },
  "data": { "action": "statistics", "notification_id": "daily-goal-42-2026-10-15" }
}
```

Для продолжения книги: `{ "action": "reader", "book_id": "17" }`. Не отправлять напоминание после выполнения цели, чаще одного раза в день или в локальное ночное время пользователя. Невалидные FCM-токены необходимо деактивировать.
