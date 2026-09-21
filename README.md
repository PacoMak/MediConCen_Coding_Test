# MediConCen Coding Test

NestJS HTTP API that maps an `(id1, id2)` pair to a stable `userID`. The first request for a pair creates the mapping; later requests return the same `userID`.

The repo is an npm workspaces monorepo. `apps/api-service` is the HTTP process. Shared packages under `packages/` hold route definitions, domain schemas, Prisma, Redis, and the application service.

## Prerequisites

- Node.js 24 (the API image is `node:24.16.0`)
- npm 11+ (ships with that Node version)
- Docker
- Git

## Installation

```bash
git clone git@github.com:PacoMak/MediConCen_Coding_Test.git
cd MediConCen_Coding_Test
npm ci
```

`npm ci` installs workspace packages and generates the Prisma client.

## Environment / configuration

There is no env file at the repository root. Copy the samples, then fill in credentials.

```bash
cp apps/api-service/.env.sample apps/api-service/.env
cp packages/database-schema/.env.sample packages/database-schema/.env
```

`apps/api-service/.env` is loaded by Nest and by Docker Compose:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `ENV` | `LOCAL`, `DEV`, or `PROD` |
| `DATABASE__SERVER` | MySQL host (`localhost` for a local Nest process; Compose overrides this to `mysql` for the API container) |
| `DATABASE__PORT` | MySQL port (default `3306`) |
| `DATABASE__DATABASE` | Database name |
| `DATABASE__USER` | Application MySQL user |
| `DATABASE__PASSWORD` | Application MySQL password |
| `REDIS__HOST` | Redis host (`localhost` locally; Compose overrides this to `redis`) |
| `REDIS__PORT` | Redis port (default `6379`) |
| `REDIS__PASSWORD` | Redis password (required by Compose) |

Compose also reads `MYSQL_ROOT_PASSWORD` from `apps/api-service/.env` (defaults to `root` if omitted). That value is only for the MySQL container, not for the API process.

`packages/database-schema/.env` is used only by Prisma CLI (`migrate`, `studio`). Set `DATABASE_URL` to the same credentials:

```text
DATABASE_URL="mysql://<username>:<password>@localhost:3306/<db-name>"
```


## Database setup

MySQL 8.4 and Redis run in Compose. Prisma migrations live in `packages/database-schema/src/migrations`.

```bash
docker compose up -d mysql redis mysql-grants
```

Wait until MySQL is healthy, then apply migrations from the host:

```bash
npm exec -w @mediconcen_coding_test/database-schema -- prisma migrate deploy
```

## Starting the application

Apply migrations first (see above). The API process does not run migrations on boot.

### Local Nest process (MySQL and Redis in Docker)

`apps/api-service/.env` should use `DATABASE__SERVER=localhost` and `REDIS__HOST=localhost`.

```bash
npm run dev -w @mediconcen_coding_test/api-service
```

The API listens on `PORT` (default `http://localhost:3000`).

### Full Docker stack

```bash
docker compose up --build
```

Compose builds `apps/api-service/Dockerfile` from the repository root, points the API at the `mysql` and `redis` services, and publishes port `3000`.

OpenAPI UI: [http://localhost:3000/docs](http://localhost:3000/docs)  
OpenAPI JSON: [http://localhost:3000/docs-json](http://localhost:3000/docs-json)

## API endpoints and example requests

### `GET /health`

Liveness plus MySQL and Redis pings. The process stays up if a dependency is down; this endpoint reports it.

```bash
curl -sS http://localhost:3000/health
```

Example response (`200`):

```json
{
  "env": "LOCAL",
  "status": "ok",
  "database": "ok",
  "redis": "ok"
}
```

`status` is `ok` only when both `database` and `redis` are `ok`.

### `POST /user-identities`

Get a `userID` for `(id1, id2)`, creating the mapping when it does not exist.

Request body:

```json
{
  "id1": "ABC123",
  "id2": "XYZ456"
}
```

`id1` and `id2` are required non-empty strings (trimmed).

```bash
curl -sS -X POST http://localhost:3000/user-identities \
  -H 'Content-Type: application/json' \
  -d '{"id1":"ABC123","id2":"XYZ456"}'
```

Example response (`200`):

```json
{
  "userID": "550e8400-e29b-41d4-a716-446655440000"
}
```

A second request with the same pair returns the same `userID`. Invalid bodies return `400`. Unexpected database failures return `500`.

## Running tests

HTTP and unit tests run in-process with Vitest. They do not need Docker, MySQL, or Redis.

```bash
npm run check:test
```

Typecheck and lint:

```bash
npm run check:types
npm run check:lint
```

## Assumptions and technical decisions

- **Idempotent mapping.** `(id1, id2)` is the business key. `userID` is a UUID v4 generated on first insert and reused afterwards.
- **Correctness under concurrency.** Every `POST /user-identities` request waits for a per-pair Redis lock, then reads or creates the row in MySQL, then releases the lock. Redis never stores `userID`. The unique index on `(id1, id2)` is a second line of defence if a lock expires mid-insert.
- **Redis is required for this endpoint.** The API still boots if Redis is unreachable so `/health` can report `redis: error`. `POST /user-identities` waits for the lock and fails if Redis is down.
- **MySQL is required for writes.** The API still boots if MySQL is unreachable so `/health` can report `database: error`. `POST /user-identities` fails until the database is available.
- **Request actor.** `createdBy` / `updatedBy` use the CLS request id (`x-request-id`, or a generated UUID). There is no separate auth user in this coding test.
- **Route-first HTTP and OpenAPI.** Controllers bind method, path, status, and Zod body validation from `@mediconcen_coding_test/api-defs`. Swagger is generated from those route defs, not from Nest Swagger decorators.
- **Layered packages.** HTTP lives in `api-service`; use-case logic in `backend-application-service`; Prisma access in `database-repository`; Redis/Prisma/CLS in `backend-common`; contracts and Zod schemas in dedicated packages.

## Concurrency on `POST /user-identities`

Concurrent requests with the same `(id1, id2)` must all return the same `userID`, and only one row may be inserted.

Redis is used only as a lock. It never stores `userID`. MySQL is the only source of that value.

### Approach

Every request waits for the lock before it touches the database:

1. **Acquire the Redis lock** for this pair (`SET user-identity-lock:<id1>:<id2> token PX 5000 NX`). If another request already holds it, this request retries every 50ms until it gets the lock. Different pairs use different keys and do not block each other. `id1` / `id2` are `encodeURIComponent`’d so a `:` in a value cannot collide with the key delimiter.
2. **Check MySQL** (`getByIdPair`). If a row already exists, use that `userID`.
3. **Create if it does not exist.** Insert a new UUID v4. A unique index on `(id1, id2)` still rejects a duplicate insert if the lock TTL expired mid-write; in that case the service re-reads the existing row from MySQL.
4. **Release the Redis lock.** A Lua script deletes the key only when the token still matches. This runs in `finally`, so the lock is released even if the database step fails.

If Redis is down, the request never reaches MySQL and the endpoint returns `500`. If MySQL is down, the request fails with `500` after the lock is released. `/health` reports the matching `redis` / `database` status.

