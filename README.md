# PreciseQuote — Interior Quotation & Estimation SaaS

Multi-tenant, white-label quotation SaaS for interior design studios, built with
React 19 + Vite + Firebase (Auth + Firestore + Hosting, three sites:
`precisequote` main portal, `vistara-interiors` tenant workspace,
`precisequote-superadmin` platform console). PWA with offline service worker.

## Setup

```bash
npm install
cp .env.example .env   # fill in your Firebase web config values
npm run dev
```

Environment variables required (Firebase web app config, all public by design):
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`.

## Security model

- **Tenant isolation** is enforced by `firestore.rules`: every tenant-scoped
  document carries a `tenantId`, and reads/writes require the caller's profile
  `tenantId` to match. Users cannot change their own `role`, `tenantId`, or
  `dataAccess` (self-escalation is blocked server-side).
- **Platform Super Admin access** is authorized **exclusively** by the
  `superadmin` **Firebase Auth custom claim**, provisioned server-side with the
  Admin SDK. There is no shared passcode and no shared password anywhere in the
  client bundle. The super-admin console (`/super-admin` and the
  `precisequote-superadmin` site) signs in with a personal owner account and
  unlocks only if that account's ID token carries the claim.

### Provisioning a platform owner (one-time, run locally)

```bash
# 1. Create the account (Firebase Console → Authentication → Add user,
#    or any /login registration) — e.g. owner@yourdomain.com

# 2. Download a service-account key with "Firebase Authentication Admin"
#    (Firebase Console → Project settings → Service accounts) to
#    ./serviceAccountKey.json  (gitignored — never commit or ship it)

# 3. Grant the claim and sign in with that account on the super-admin site
export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npm run set:superadmin -- owner@yourdomain.com          # grant
npm run set:superadmin -- owner@yourdomain.com --revoke # revoke
```

The claim is embedded in ID tokens; the script also revokes refresh tokens so
the next sign-in picks it up immediately.

### Rotating credentials / incident response

The legacy deployment shipped a hardcoded platform password and passcode in the
client bundle. After deploying the current rules + bundle, rotate that
account's password with the Admin SDK (Firebase Console's "Reset password"
only sends an email — it cannot set a password, and it is undeliverable for
non-real addresses like `*.internal`):

```bash
npm run set:password -- platform.owner@precisequote.internal            # auto-generates a strong password and writes it to ./new-password.txt
npm run set:password -- platform.owner@precisequote.internal --password "<new>"  # sets a specific password
```

The script picks up `./serviceAccountKey.json` automatically (or honors
`GOOGLE_APPLICATION_CREDENTIALS`), sets the password directly, then
**verifies it with a real sign-in** against production Auth before reporting
success. Copy the generated password from `new-password.txt` (git-ignored)
in a text editor — never from the terminal, which wraps long lines and
corrupts manual copies — then delete the file. All active sessions are
revoked, so every device must sign in
again. Then re-run `set:superadmin` to (re)assert exactly who holds the claim.
After rotation, delete the service-account key file AND revoke the key
server-side (Google Cloud Console → IAM & Admin → Service Accounts → Keys).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run set:superadmin -- <email> [--revoke]` | Grant/revoke the `superadmin` custom claim |
| `npm run set:password -- <email> [--password "<new>"]` | Admin-SDK password rotation (no email; revokes sessions) |

## Deploy

```bash
npm run build
firebase deploy --only firestore:rules   # security rules first
firebase deploy --only hosting           # three hosting targets in firebase.json
```

## Repo layout

- `vistara-app/` — the React SaaS (this app; deployed to all three hosting sites)
- `vistara-mcp-server/` — experimental MCP server prototype (mock data, not wired to production)
- `scraper/` — one-off lead-scraping scripts
