# Asmo Learning — Student Panel Backend

Production-shaped REST API for the Asmo Learning Student Panel frontend.

## Stack

- Node.js + Express + TypeScript
- Prisma ORM (SQLite for local dev; portable to PostgreSQL)
- JWT access tokens + rotating, hashed refresh tokens
- bcrypt password hashing
- Zod request validation
- Helmet + CORS

Base URL: `http://localhost:4000/api`

## Getting started

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate   # creates dev.db and applies the schema
npm run seed              # loads demo data (idempotent, safe to re-run)
npm run dev                # starts the API on http://localhost:4000/api
```

Production build:

```bash
npm run build
npm run prisma:deploy     # applies migrations without prompting
npm start
```

`dist/` is a build artifact only — always run `npm run build` from `src/`
before `npm start`; nothing in the source tree depends on `dist/`.

## Demo login

```
email: student@asmo.uz
password: password123
```

Two more demo students (`peer1@asmo.uz`, `peer2@asmo.uz`, `peer3@asmo.uz`, all
`password123`) are seeded for the coin leaderboard, plus a teacher account
(`teacher@asmo.uz` / `password123`).

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Prisma datasource URL (`file:./dev.db` for SQLite) |
| `PORT` | HTTP port (default `4000`) |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRES_IN` | Access token lifetime (e.g. `15m`) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token lifetime in days |
| `CORS_ORIGIN` | Allowed frontend origin (`http://localhost:3000`) |

## Project structure

```
src/
  server.ts          Express app bootstrap (helmet, cors, json, routes)
  routes.ts           All API routes, response serializers, validation schemas
  auth.ts             Password hashing, JWT signing, refresh token rotation
  middleware.ts       authenticate / requireRole / error handling
  lib/prisma.ts        Shared PrismaClient instance
  types/express.d.ts   Augments Express.Request with `req.user`
prisma/
  schema.prisma        Data model
  seed.ts               Idempotent demo data seed
```

## Data model

`User`, `RefreshToken`, `Direction`, `Teacher`, `Group`, `Enrollment`,
`Lesson`, `Homework`, `Submission`, `AttendanceRecord`, `CoinTransaction`,
`Notification`, `Product`, `WishlistItem`, `Purchase`, `Payment`.

Enum fields (role, status, etc.) are stored upper-case in the database and
lower-cased in every API response to match the frontend's TypeScript types.

## Authentication

- `POST /api/auth/register` — body `{ email, password, firstName, lastName, phone? }`.
  Creates a `STUDENT`. Returns `201` with `{ user, accessToken, refreshToken }`.
  Duplicate email → `409`.
- `POST /api/auth/login` — body `{ email, password }` → `{ user, accessToken, refreshToken }`.
  Wrong credentials → `401`.
- `POST /api/auth/refresh` — body `{ refreshToken }`. Rotates the token
  (old one is revoked, a new pair is issued) → `{ accessToken, refreshToken }`.
  Invalid/expired/reused token → `401`.
- `GET /api/auth/me` — requires `Authorization: Bearer <accessToken>` →
  the current user.

Refresh tokens are stored **hashed** (SHA-256) in `RefreshToken`, never in
plaintext.

## Profile

- `PATCH /api/profile` — body `{ firstName?, lastName?, phone?, avatar? }`.
  `avatar` may be an `http(s)` URL or a `data:image/(png|jpeg|jpg|webp);base64,...`
  data URL up to 2 MB. Returns the updated user (no `passwordHash`).

## Settings

- `PATCH /api/settings/email` — body `{ email }`. `409` if taken by another
  user. Revokes all of the user's refresh tokens on success.
- `PATCH /api/settings/password` — body `{ currentPassword, newPassword }`.
  `400` if `currentPassword` is wrong. Revokes all refresh tokens on success.

## Dashboard

- `GET /api/dashboard` → `{ user, groups, coinBalance, recentTransactions,
  unreadNotifications, upcomingLessons }`.
- `GET /api/leaderboard` → active students sorted by coin balance
  (descending).

## Groups & lessons

- `GET /api/groups` — a student only sees groups they're enrolled in.
- `GET /api/groups/:id` — `{ group, lessons }`; `403` if the student isn't
  enrolled.
- `GET /api/lessons/:id` — `{ lesson, homework, submission }`; `403` if the
  student isn't enrolled in the lesson's group.

## Homework

- `POST /api/homework/:id/submit` — body `{ content, attachmentUrl? }`.
  - `403` if the homework isn't in one of the student's groups.
  - `400` if the deadline has passed, or the submission is already graded.
  - Otherwise creates or updates the student's single submission for that
    homework (one submission per student per homework).

## Attendance

- `GET /api/attendance?groupId=` → `{ records, stats: { total, present,
  percentage } }`. Statuses: `present`, `absent`, `late`, `excused`.

## Coins

- `GET /api/coins` → `{ balance, transactions }`.
- `GET /api/leaderboard` → sorted, active students only.

## Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/read-all`
- `PATCH /api/notifications/:id/read` — `404` if it doesn't belong to the
  caller.

## Shop

- `GET /api/products?category=&search=`
- `GET /api/wishlist`
- `POST /api/wishlist/:productId` — idempotent, no duplicates.
- `DELETE /api/wishlist/:productId`
- `POST /api/shop/checkout` — body `{ productIds: string[] }` (or
  `{ items: [{ productId, quantity }] }`). Validates the coin balance,
  then creates the purchase(s) and deducts the coins inside a single
  Prisma transaction.

## Payments

- `GET /api/payments` — the caller's own payment history only.
  Statuses: `paid`, `pending`, `overdue`, `cancelled`. Types: `naqd`
  (cash), `click`, `payme`, `bank`, `uzum`.

## Security

- All endpoints above `/auth/register`, `/auth/login`, `/auth/refresh` and
  `GET /products` require `Authorization: Bearer <accessToken>`.
- Passwords are hashed with bcrypt; `passwordHash` is never serialized.
- Refresh tokens are hashed at rest and rotated on every use.
- Ownership checks scope groups/lessons/notifications/attendance/coins/
  payments/wishlist to `req.user.id`.
- `requireRole()` gates student-only actions (homework submission, shop
  checkout).
- Errors always come back as `{ "error": "message" }`.

## Manual verification performed

- Register → 201 with tokens; re-registering the same email → 409.
- Login with seeded student → 200 with tokens; `GET /auth/me` with the
  access token → current user.
- `PATCH /profile` updates `firstName`/`lastName`/`phone`/`avatar`.
- `PATCH /settings/email` then logging in with the new email; duplicate
  email → 409.
- `PATCH /settings/password` with a wrong `currentPassword` → 400; with the
  correct one, logging in with the new password succeeds.
- `GET /dashboard`, `/groups`, `/groups/:id`, `/lessons/:id`, `/attendance`,
  `/coins`, `/leaderboard`, `/notifications`, `/products`, `/wishlist`,
  `/payments` all return the shapes documented above for the seeded
  student.
- A second seeded user requesting another student's group/lesson gets 403.
- `npm run build` and `prisma migrate` both complete without errors.
