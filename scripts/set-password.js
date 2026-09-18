#!/usr/bin/env node
/**
 * Admin password reset via Firebase Admin SDK.
 *
 * Firebase Console's "Reset password" only SENDS an email — useless for
 * accounts on non-deliverable addresses (e.g. *.internal). This script sets
 * the password directly, no email involved.
 *
 * Two anti-transcription measures (both failure modes already happened):
 *   1. After setting the password it VERIFIES it by performing a real
 *      sign-in against the Firebase Auth REST API, so success is proven,
 *      not assumed.
 *   2. The generated password is written to ./new-password.txt (git-ignored).
 *      Open that file in a text editor and copy from there — terminals wrap
 *      long lines and corrupt manual copies.
 *
 * Run LOCALLY ONLY with a service-account key. Never bundle or commit keys.
 * Delete ./new-password.txt as soon as the password is stored safely.
 *
 * Usage:
 *   node scripts/set-password.js <email>                     # generate + verify
 *   node scripts/set-password.js <email> --password "<new>"  # set a specific password
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const email = process.argv[2];
const pwIdx = process.argv.indexOf('--password');
const newPassword = pwIdx > -1 ? process.argv[pwIdx + 1] : `${randomBytes(12).toString('base64url')}Aa1!`;

// Credential: explicit env var wins; else fall back to ./serviceAccountKey.json.
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && existsSync('./serviceAccountKey.json')) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = './serviceAccountKey.json';
}

if (!email || (pwIdx > -1 && !newPassword)) {
  console.error(
    'Usage: node scripts/set-password.js <email> [--password "<new>"]\n' +
    '  Needs a service-account JSON key (env GOOGLE_APPLICATION_CREDENTIALS\n' +
    '  or ./serviceAccountKey.json) with user-management rights.'
  );
  process.exit(1);
}
if (newPassword.length < 6) {
  console.error('✖ Password must be at least 6 characters (Firebase requirement).');
  process.exit(1);
}

// Web API key from .env — used only to verify the new password with a real sign-in.
function readWebApiKey() {
  if (!existsSync('.env')) return null;
  const line = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('VITE_FIREBASE_API_KEY='));
  if (!line) return null;
  const value = line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  return value || null;
}

async function verifyPassword(em, pw) {
  const apiKey = readWebApiKey();
  if (!apiKey) return { skipped: true };
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: em, password: pw, returnSecureToken: false }),
    }
  );
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, error: body?.error?.message };
}

try {
  initializeApp({ credential: applicationDefault() });
  const user = await getAuth().getUserByEmail(email.trim());
  await getAuth().updateUser(user.uid, { password: newPassword });
  await getAuth().revokeRefreshTokens(user.uid);
  console.log(`✔ Password updated for ${email} (${user.uid}). All sessions revoked.`);

  const check = await verifyPassword(email.trim(), newPassword);
  if (check.skipped) {
    console.log('⚠ Could not verify (VITE_FIREBASE_API_KEY not found in .env) — sign-in not tested.');
  } else if (check.ok) {
    console.log('✔ VERIFIED: this exact password just signed in successfully against production Auth.');
  } else {
    console.error(`✖ Verification FAILED (HTTP ${check.status}: ${check.error || 'unknown'}) — the stored password does not sign in.`);
    if (pwIdx > -1 && /[$`"']/.test(newPassword)) {
      console.error('  The password contains shell-special characters; your shell may have mangled it.');
      console.error('  Re-run WITHOUT --password and let the script generate one.');
    }
  }

  if (pwIdx === -1) {
    writeFileSync('new-password.txt', `${email.trim()}\n${newPassword}\n`);
    console.log('');
    console.log('  Password written to ./new-password.txt (git-ignored).');
    console.log('  → Open it in Notepad and copy BOTH lines from there');
    console.log('    (copying from a terminal wraps long lines and corrupts the password).');
    console.log('  → Store it in your password manager, then DELETE the file.');
  }
} catch (err) {
  console.error('✖ Failed:', err.message);
  process.exit(1);
}
