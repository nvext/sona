# Sona

Интернет-магазин звуковых панелей.

## Что реализовано

Система покрывает ключевой путь клиента от выбора панели до отправки заявки менеджеру:

- Регистрация и авторизация пользователя
- Просмотр каталога и карточек звуковых панелей
- Работа с корзиной (добавление и удаление позиций)
- Оформление заявки:
  - создание черновика (`draft`)
  - отправка заявки
  - доставка заявки менеджеру в Telegram
  - автоматические ретраи при ошибках доставки
- Техническая эксплуатация:
  - `GET /health`
  - `GET /ready`
  - `GET /metrics`
- Базовая защита API:
  - авторизация защищенных операций
  - CORS
  - rate limit для auth и отправки заявки
  - `x-request-id` и структурные логи

## Требования

- `bun`
- `PostgreSQL`

## Быстрый старт

```bash
bun install
bun run db:migrate
bun run dev
```

## Docker / Podman

### Локальный запуск через compose

```bash
podman compose up --build
```

Что поднимется:

- `db` - PostgreSQL
- `migrate` - одноразовое применение миграций
- `app` - production-сборка Nuxt/Nitro

Приложение будет доступно на `http://localhost:3000/sona/`.

`compose.yaml` предназначен для локального запуска и задает безопасные локальные значения по умолчанию:

- `AUTH_ACCESS_SECRET=change-me-for-local-compose`
- `ORDER_DELIVERY_PROVIDER=noop`

Для production эти значения нужно заменить.

Если нужно пересобрать все с нуля:

```bash
podman compose down -v
podman compose build --no-cache
podman compose up
```

### Отдельная сборка контейнера

```bash
podman build -t sona:local .
podman run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB_NAME \
  -e AUTH_ACCESS_SECRET=change-me \
  -e ORDER_DELIVERY_PROVIDER=noop \
  sona:local
```

Контейнер запускает Nuxt так, как ожидает preset `node-server`:

```bash
node .output/server/index.mjs
```

## Переменные окружения

Пример см. в `.env.example`.

Обязательные:

- `DATABASE_URL`
- `AUTH_ACCESS_SECRET`
- `ORDER_DELIVERY_PROVIDER` (`noop` или `telegram`)

Если `ORDER_DELIVERY_PROVIDER=telegram`, обязательны:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_MANAGER_CHAT_ID`

Рекомендуемые:

- `CORS_ALLOWED_ORIGINS`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_AUTH_MAX`
- `RATE_LIMIT_SUBMIT_MAX`
- `RATE_LIMIT_ADMIN_WRITE_MAX`
- `ADMIN_UI_ENABLED`
- `ADMIN_WRITE_CSRF_TOKEN`
- `ORDER_DELIVERY_RETRY_INTERVAL`
- `ORDER_DELIVERY_RETRY_BATCH_SIZE`
- `ORDER_DELIVERY_MAX_ATTEMPTS`
- `ORDER_DELIVERY_RETRY_BASE_DELAY`
- `ORDER_DELIVERY_RETRY_MAX_DELAY`
- `LOG_LEVEL` (`info`, `error`, `silent`)
- `TEST_LOG_LEVEL` (`info`, `error`, `silent`)

## Скрипты

```bash
bun run dev
bun run build
bun run preview

bun run db:generate
bun run db:migrate

bun run admin:catalog:build
bun run admin:catalog:sync
bun run admin:catalog:apply
bun run admin:user:role -- --email user@example.com --admin

bun run test:db
bun run test:telegram:smoke
```

### Выдача роли admin

```bash
# выдать admin по email
bun run admin:user:role -- --email user@example.com --admin

# снять admin (вернуть customer)
bun run admin:user:role -- --email user@example.com --customer

# проверить без изменения
bun run admin:user:role -- --email user@example.com --admin --dry-run
```

## Каталог (admin JSON)

Источник каталога: `server/infrastructure/admin/catalog/source.json`.

Поддерживаются изображения:

- URL строкой (`https://...`)
- Локальный путь строкой (`public/images/...`)
- Объект с `path` или объект с полными метаданными

Команды:

```bash
# 1) из source.json -> expanded.json (и копирование локальных файлов в public/uploads/catalog)
bun run admin:catalog:build

# 2) синхронизация expanded.json -> БД
bun run admin:catalog:sync

# shortcut
bun run admin:catalog:apply
```

Поведение `sync`:

- По умолчанию чистит отсутствующие в JSON данные:
  - `files` удаляются
  - `product_cards`, `product_colors`, `products` деактивируются (`isActive=false`)
- Для режима без очистки: `bun run admin:catalog:sync -- --keep-missing`
- Для проверки без записи: `bun run admin:catalog:sync -- --dry-run`

## Runbook (Сервер)

### Проверка после запуска

- `GET /health` -> сервис запущен
- `GET /ready` -> сервис готов принимать трафик (есть доступ к БД)
- `GET /metrics` -> метрики отправки и ретраев заявок

### Ключевые метрики

- `sona_delivery_submit_attempts_total`
- `sona_delivery_submit_delivered_total`
- `sona_delivery_submit_failed_total`
- `sona_delivery_retry_cycles_total`
- `sona_delivery_retry_delivered_total`
- `sona_delivery_retry_failed_total`
- `sona_delivery_retry_last_cycle_timestamp_seconds`

### Если заявки не доставляются

1. Проверить `GET /ready`.
2. Проверить `ORDER_DELIVERY_PROVIDER` и `TELEGRAM_*`.
3. Проверить структурные логи по `requestId` и `orderRequestId`.
4. Проверить в БД поля `status`, `deliveryAttempts`, `nextDeliveryRetryAt`, `lastDeliveryError` в `order_requests`.
5. Если достигнут лимит попыток (`deliveryAttempts >= ORDER_DELIVERY_MAX_ATTEMPTS`), после исправления причины сбросить попытки/`nextDeliveryRetryAt` вручную и дать воркеру повторить доставку.

### Release-checklist

```bash
bunx tsc -b --pretty false
bun test server/infrastructure/api/tests
bun test server/infrastructure/runtime/tests
bun test server/infrastructure/db/repos/tests
bun test server/application
```
