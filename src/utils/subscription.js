/**
 * Single owner of subscription/credit derivation. Every reader — AppContext,
 * SuperAdmin — derives tenant subscription truth through here so credit math
 * cannot drift between them.
 */

export function defaultTrialSubscription(spentCredits = 0) {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  return {
    plan: 'trial',
    trialEndsAt: trialEndsAt.toISOString(),
    totalCredits: 50,
    spentCredits,
    balanceCredits: Math.max(0, 50 - spentCredits),
  };
}

const TRIAL_TOTAL = 50;
const PRO_TOTAL = 500;

/**
 * Normalize a raw subscription doc (from Firestore or state) into canonical
 * shape. docSpent fills spentCredits when the doc doesn't carry it.
 */
export function deriveSubscription(raw, { docSpent = 0 } = {}) {
  const plan = raw?.plan || 'trial';
  const isPro = plan === 'pro' || plan === 'enterprise';
  const totalCredits = raw?.totalCredits !== undefined ? Number(raw.totalCredits) : (isPro ? PRO_TOTAL : TRIAL_TOTAL);
  const spentCredits = raw?.spentCredits !== undefined ? Number(raw.spentCredits) : docSpent;
  return {
    plan,
    quoteLimit: raw?.quoteLimit,
    trialEndsAt: raw?.trialEndsAt,
    totalCredits,
    spentCredits,
    balanceCredits: raw?.balanceCredits !== undefined ? Number(raw.balanceCredits) : Math.max(0, totalCredits - spentCredits),
    activeUntil: raw?.activeUntil,
  };
}
