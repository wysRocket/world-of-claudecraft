# Firebase Auth Migration: Design Spec

**Date:** 2026-07-22

**Status:** Approved direction, ready for implementation planning

## 1. Purpose

Move account sign-in from this repo's in-house password + OAuth stack onto Firebase
Auth, while keeping Postgres as the sole source of truth for every account and every
piece of game data. This is Phase 1 of a larger, explicitly deferred initiative:
broader persistence work (Firestore for game data, beyond accounts) is intentionally
out of scope here and will get its own spec once this phase has shipped and proven
itself.

## 2. Current state (what exists today)

- `server/auth.ts`: scrypt password hashing (`SCRYPT_N=16384`, `r=8`, `p=1`) plus
  verification, used by the email/password path.
- `server/auth_routes.ts`: the `RouteDef` module for `/api/register`, `/api/login`,
  and related credential routes, registered in `server/http/registry.ts`.
- `server/discord_oauth.ts` + `server/discord_db.ts`: Discord OAuth login/link flow.
  `discord_links` table: `account_id` (PK) to `discord_user_id` (UNIQUE), the durable
  1:1 identity mirror.
- `server/apple_auth.ts` + `server/apple_auth_db.ts`: Apple Sign In flow.
  `apple_auth_links` table: `account_id` (PK) to `apple_subject` (UNIQUE), same shape.
- `server/github_oauth.ts`: GitHub OAuth login/link flow.
- `accounts` table (`server/db.ts`): `id`, `username`, `password_hash`, `email`,
  `email_verified_at`, `password_set`, plus moderation/admin/TOTP columns. No
  `firebase_uid` yet.
- `auth_tokens` table: the session mechanism, a bearer token keyed to `account_id`,
  with `scope` (`full`/`read`) and an optional `label`. This is what
  `server/ws_auth.ts` and every authenticated REST route actually check. It does not
  change in this phase.
- `server/email/`: an existing transactional email system (`sender.ts`, `ses_sender.ts`,
  `tokens.ts`, `service.ts`, `events.ts`), available if a migration communication is
  ever needed, though the design below does not require one.
- `server/oauth.ts` + `server/oauth_db.ts` (`oauth_clients`/`oauth_codes`/
  `oauth_device_codes`): a **different, unrelated** system, this repo acting as an
  OAuth *server* for third-party companion apps. Not touched by this spec.

There is currently no Firebase code anywhere in the tree. A single unused
`"firebase": "^12.16.0"` line exists in `package.json` inside an old, unapplied stash
on `main` (`stash@{2}` as of this writing), a prior, incomplete start at this same
work, with no accompanying integration code.

## 3. Scope decisions (settled during brainstorming)

- **Firebase Auth only, not Firestore.** Postgres stays authoritative for accounts,
  sessions, and all game data. No table listed above is replaced or migrated to
  Firestore in this phase.
- **Real accounts exist and must keep working.** No account may be locked out by this
  change; every existing sign-in path needs a migration story, not just new signups.
- **Provider set going forward:** email/password, Google (new), Discord, Apple.
  **GitHub is dropped.** Confirmed no account today is GitHub-only (every GitHub-linked
  account also has another usable sign-in method), so this drops cleanly with no
  lockout risk.
- **Server-side verification uses the full `firebase-admin` SDK**, not a hand-rolled
  JWT check against Google's JWKS. This accepts the dependency-weight cost (this repo's
  "keep the dependency set tiny" rule) in exchange for the SDK's user-management API,
  which the migration path below relies on (`createUser`/`updateUser`).

## 4. Architecture

Firebase Auth becomes the identity front door; the rest of the stack is unchanged.

1. Client signs in via the Firebase JS client SDK (email/password, Google, Discord via
   a custom OIDC provider config, or Apple) and receives a Firebase ID token (a
   short-lived RS256 JWT).
2. Client sends that token to a new server endpoint, replacing the old
   username/password request body for this path.
3. Server verifies the token with `firebase-admin`'s `getAuth().verifyIdToken()`
   (locally cached JWKS verification; no per-request network call to Firebase).
4. Server resolves the verified token to an `accounts` row (see Section 5) and issues
   the **existing** `auth_tokens` bearer session, byte-identical in shape to what the
   old login path issues today.
5. Everything downstream of "you have a valid session token" (`ws_auth.ts`, character
   load, every other authenticated route) sees zero change.

## 5. Data model

One additive, nullable column: `accounts.firebase_uid TEXT UNIQUE`. Populated
per-account as each one migrates (see Section 6), never backfilled in bulk. No other
schema change. `discord_links` and `apple_auth_links` are read (not written) by the new
flow, as the matching keys described next.

## 6. Migration path for existing accounts

No bulk password import: Firebase's scrypt import format needs exact-parameter
matching with Google's own modified scrypt variant, and this repo's Node `scrypt` call
does not match it. Getting that wrong fails silently at import time or, worse, at
first login. Instead, each account migrates individually, transparently, the first
time it signs in after cutover:

- **Discord / Apple:** user signs in through Firebase's Discord/Apple provider as
  normal. The server reads the provider's external subject id out of the verified
  token (Discord user id / Apple subject) and looks it up in `discord_links` /
  `apple_auth_links`. A match resolves to the existing `account_id`; the server sets
  `firebase_uid` on that row. No new account is created, no re-authorization beyond the
  normal provider consent screen, no data touched.
- **Email/password:** the one case with no token to match against, since the user is
  proving a secret we don't have in Firebase yet. Client attempts Firebase sign-in
  first; if Firebase reports the email as unrecognized, the server falls back to the
  *existing* `verifyPassword()` check in `server/auth.ts` against the stored
  `password_hash`. On success, the server calls `firebase-admin`'s `createUser()` (or
  `updateUser()` if the email already exists in Firebase from an abandoned prior
  attempt) with that same verified password, then sets `firebase_uid`. The user
  experiences this as an ordinary login (same email, same password) with no reset,
  no email, no visible step.
- **GitHub:** retires outright. `server/github_oauth.ts` and its route registration are
  removed in this same change.

## 7. What retires vs. what stays

| Removed | Kept (and why) |
|---|---|
| `server/github_oauth.ts` + its `RouteDef` registration | `server/auth.ts`'s `hashPassword`/`verifyPassword`: needed by the email/password migration fallback until every account has migrated |
| The Discord/Apple OAuth **handshake** code in `server/discord_oauth.ts` / `server/apple_auth.ts` (Firebase's own providers now run the handshake) | `discord_links` / `apple_auth_links` **tables**: read-only migration-matching keys, droppable only once every account has migrated |
| | `auth_tokens` table and `server/ws_auth.ts`: completely unchanged |
| | The old `/api/register` and `/api/login` routes: kept live in parallel during the transition (see Section 9) |

## 8. New server module

A new `server/firebase_auth.ts` `RouteDef` module (this repo's module-first
convention: a new server endpoint is always its own `RouteDef` module, never an
inline route in `main.ts`), registered in `server/http/registry.ts` alongside the
existing `authRoutes`. Owns: ID token verification, the account resolve/link/migrate
logic in Section 6, and a small schema addition (the `firebase_uid` column) applied
the same way every other domain schema in this codebase is: idempotent DDL run at
boot under the advisory lock, not a separate migration file.

New dependencies: `firebase-admin` (server) and `firebase` (client SDK; already an
unused line in the old stash mentioned in Section 2). The server additionally needs a
Firebase service-account credential, loaded from the environment
(`process.loadEnvFile()`, the existing `DATABASE_URL` precedent) and never committed.

## 9. Client-side

The Firebase JS SDK is added to the game client's login/character-select flow. The
sign-in UI gains Google as a new option and routes Discord/Apple/email through
Firebase's flows instead of the current ones. Firebase's client-side config (API key,
project id, etc.) is not a secret: Firebase's own security model puts enforcement on
the server-side token verification, not on hiding these values, so it ships as a
plain client-side constant, same trust level as any other public config today.

## 10. Rollout and rollback

The old `/api/register` and `/api/login` endpoints stay live, unmodified, in parallel
with the new Firebase path for the full transition window: nothing about this change
removes a working login path on day one. Once telemetry shows the email/password
migration fallback (Section 6) is going effectively unused, meaning the accounts that
were going to migrate, have, retiring the old endpoints and the fallback-verify code
is a **follow-up change**, explicitly not part of this phase's completion definition.

## 11. Testing

Route-level tests using the existing `tests/server/helpers/` fakes, covering:

- Fresh signup through each of the four providers (email/password, Google, Discord,
  Apple).
- First-login migration for an existing password account (fallback verify succeeds,
  Firebase user provisioned, `firebase_uid` set).
- First-login migration for an existing Discord-linked account and an existing
  Apple-linked account (token subject matches `discord_links`/`apple_auth_links`,
  `firebase_uid` set, no duplicate account created).
- Session-issuance parity: a migrated login produces an `auth_tokens` row
  indistinguishable in shape from one issued by the legacy path.
- A second login on an already-migrated account goes straight through Firebase
  verification with no fallback path exercised.

## 12. Explicitly out of scope (this phase)

- Firestore, or any migration of game data (characters, guilds, market, mail, bank,
  and so on) off Postgres. A separate, later spec.
- Removing the old `/api/register`/`/api/login` endpoints or the migration-fallback
  code: a follow-up change once migration telemetry supports it (Section 10).
- Any change to the existing TOTP two-factor system on `accounts`; it is independent
  of the sign-in provider and is not touched here.
- Any change to `server/oauth.ts` (this repo's own OAuth *server*, for third-party
  companion apps), an unrelated system.
