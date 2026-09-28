# Whisper

Whisper is a full-stack TypeScript dating/chat MVP with persistent SQLite storage, authentication, responsive dashboard UX, direct/group messaging, context-scoped code words, calls, statuses, trends, plans, ads, and demo adapters for encryption/calling/billing.

## Stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- SQLite (`better-sqlite3`) with schema migration + seed/reset scripts
- Server Actions for CRUD/auth flows
- Vitest for critical-flow tests

## Quick start
```bash
npm install
npm run prepare:demo
npm run dev
```
Open http://localhost:3000

Demo credentials:
- `alice@whisper.local` / `demo12345`
- `noah@whisper.local` / `demo12345`
- `maya@whisper.local` / `demo12345`

## Environment
Create `.env.local` from this template:

```env
DATABASE_URL=file:./data/whisper.db
DEMO_ENCRYPTION_SALT=change-me-demo-salt
```

## Commands
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – run production server
- `npm run lint` – lint
- `npm run typecheck` – TypeScript checks
- `npm run test` – run focused tests
- `npm run db:migrate` – apply schema
- `npm run db:seed` – seed realistic demo data
- `npm run db:reset` – wipe and reseed demo data

## Product coverage
- **Auth & sessions:** sign-up/sign-in/sign-out, protected routes, session cookies
- **Profiles:** name/age/bio/location/interests/avatar/online status/profile completion
- **Dashboard shell:** desktop sidebar + mobile bottom nav
- **Views:** Home, Discover, Matches, Messages, Calls, Groups, Status, Trending, Plans, Ads, Profile, Settings
- **Messaging:** direct + group conversations, message CRUD, pin/edit/delete, timestamps, read/unread, typing marker, attachment abstraction, filtering/search
- **Context code words:** per-conversation CRUD/search/resolve (e.g. `32` means different things in different chats)
- **Calls:** history + start/end/missed using demo call provider abstraction
- **Privacy:** block/report structures + settings UX
- **Stories/status:** create/view/delete with expiration metadata
- **Groups:** create/edit/join/leave/member roles
- **Trends:** seeded cards + interactions
- **Plans:** Free/Plus/Premium, feature lists, current subscription state, mock checkout adapter
- **Ads:** sponsored cards, targeting metadata, CTA tracking adapter

## Encryption notes
Current messaging encryption is **demo/local only** and clearly labeled as non-production E2EE.
To harden for production E2EE, implement:
- device key pairs and verified key exchange
- forward secrecy + key rotation
- secure backup/recovery strategy
- metadata minimization and transport hardening
- external key management/HSM support

## Data model overview
Core tables: `users`, `sessions`, `conversations`, `conversation_members`, `messages`, `code_mappings`, `groups`, `statuses`, `trends`, `trend_interactions`, `plans`, `subscriptions`, `ads`, `call_records`, `blocks`, `reports`.

## Mobile extension path (iOS/Android)
The backend/domain logic is in reusable server/data adapters:
- `src/lib/store.ts`
- `src/lib/adapters/*`
- `src/lib/actions.ts`

To extend with Expo/React Native:
1. Add API route wrappers for server actions (REST/JSON endpoints).
2. Reuse the same SQLite schema and adapter contracts.
3. Build mobile UI in Expo and consume the shared API.
4. Replace demo adapters with production call/billing/encryption providers.

## Deployment path
- Deploy app server on Vercel/Node host.
- Persist SQLite using attached volume for small deployments, or migrate schema to Postgres while preserving table design.
- Move session storage and adapters to managed production services.
