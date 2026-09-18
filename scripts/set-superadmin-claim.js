#!/usr/bin/env node
/**
 * One-time (and maintenance) script: provision Firebase Auth custom claims.
 *
 * Grants or revokes the `superadmin` custom claim on a Firebase Auth account.
 * Firestore security rules authorize ALL super-admin access exclusively via
 * this claim — see firestore.rules (`isSuperAdmin()`). No passcode, shared
 * password, or profile-document role can ever grant platform access.
 *
 * Run LOCALLY ONLY with a service-account key. Never bundle this file, the
 * firebase-admin dependency, or any service-account JSON into the web app.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
 *   node scripts/set-superadmin-claim.js owner@yourdomain.com
 *   node scripts/set-superadmin-claim.js owner@yourdomain.com --revoke
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!email) {
  console.error(
    'Usage: node scripts/set-superadmin-claim.js <owner-email> [--revoke]\n' +
    '  GOOGLE_APPLICATION_CREDENTIALS must point to a service-account JSON key\n' +
    '  with the "Firebase Authentication Admin" role.'
  );
  process.exit(1);
}

try {
  initializeApp({ credential: applicationDefault() });
  const user = await getAuth().getUserByEmail(email.trim());

  await getAuth().setCustomUserClaims(user.uid, { superadmin: !revoke });

  // Force token refresh on the user's next request so the claim takes effect
  // immediately instead of waiting for the (up to 1h) token expiry.
  await getAuth().revokeRefreshTokens(user.uid);

  console.log(
    revoke
      ? `✔ Revoked 'superadmin' claim from ${email} (${user.uid}).`
      : `✔ Granted 'superadmin' claim to ${email} (${user.uid}).`
  );
  console.log("The user must sign out and sign back in (or refresh their ID token) for the claim to appear.");
} catch (err) {
  console.error('✖ Failed:', err.message);
  process.exit(1);
}
