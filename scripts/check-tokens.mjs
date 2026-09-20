#!/usr/bin/env node
/**
 * Design-system guard: asserts the ground layer of the CSS survives any
 * transformation. Born from a real incident — a dead-CSS purge script
 * silently deleted the :root token block and every @keyframes, and the app
 * shipped a transparent, unstyled UI because "lint clean + build passes"
 * has no semantic opinion about CSS.
 *
 * Asserts, in source (default):
 *   1. tokens.css exists and defines the full :root token set
 *   2. every consumed var(--x) is either defined in :root/tokens.css or
 *      runtime-injected (whitelisted below)
 *   3. every @keyframes name referenced by CSS is defined
 *   4. tokens.css is imported in main.jsx before index.css
 *
 * Asserts, in the shipped artifact (--dist, run after vite build):
 *   5. the emitted CSS bundle still defines every required token
 *   6. every keyframes defined in tokens.css survived bundling/minification
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');

const REQUIRED = [
  '--bg', '--bg-secondary', '--surface', '--surface-2', '--border', '--border-light',
  '--text-primary', '--text-secondary', '--text-muted',
  '--shadow-sm', '--shadow-md', '--shadow-lg',
  '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
  '--sidebar-width', '--topbar-height', '--bottomnav-height',
  '--accent', '--danger', '--warning', '--success',
  '--primary', '--primary-dark', '--primary-light',
];

// ── Post-build mode: assert the EMITTED bundle kept the ground layer ──────
if (process.argv.includes('--dist')) {
  const distDir = join(root, 'dist/assets');
  if (!existsSync(distDir)) {
    console.error('✗ --dist: dist/assets not found — run this after vite build.');
    process.exit(1);
  }
  const bundled = readdirSync(distDir)
    .filter(f => f.endsWith('.css'))
    .map(f => readFileSync(join(distDir, f), 'utf8'))
    .join('\n');
  const distErrors = [];
  for (const t of REQUIRED) {
    if (!bundled.includes(`${t}:`)) distErrors.push(`emitted CSS never defines ${t} — bundler dropped the token layer`);
  }
  const tokens = read('src/tokens.css');
  for (const m of tokens.matchAll(/@keyframes\s+([\w-]+)/g)) {
    if (!bundled.includes(`@keyframes ${m[1]}`) && !bundled.includes(`@keyframes${m[1]}`)) {
      distErrors.push(`emitted CSS lost @keyframes ${m[1]}`);
    }
  }
  if (distErrors.length) {
    console.error('\n✗ Emitted-bundle guard FAILED:\n');
    for (const e of distErrors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('✓ emitted-bundle guard: all tokens and keyframes survived into dist CSS');
  process.exit(0);
}

const errors = [];

// ── 1. tokens.css and the :root block ────────────────────────────────────
if (!existsSync(join(root, 'src/tokens.css'))) {
  errors.push('src/tokens.css is MISSING — the design-token ground layer has been deleted.');
} else {
  const tokens = read('src/tokens.css');
  const rootBlock = tokens.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!rootBlock) {
    errors.push('tokens.css no longer contains a :root block.');
  } else {
    const defined = new Set([...rootBlock[1].matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
    for (const t of REQUIRED) {
      if (!defined.has(t)) errors.push(`tokens.css :root is missing required token ${t}`);
    }
    // Runtime-injected tokens must also be present in :root as fallbacks.
    for (const t of ['--primary', '--primary-dark', '--primary-light']) {
      if (!defined.has(t)) errors.push(`tokens.css :root is missing ${t} (AppContext overrides it at runtime but it must exist statically)`);
    }
    // 3. Keyframes defined in tokens.css
    const definedKf = new Set([...tokens.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
    const allCss = tokens + '\n' + read('src/index.css');
    const usedKf = new Set();
    for (const m of allCss.matchAll(/(?:animation(?:-name)?\s*:\s*)([\w-]+)/g)) usedKf.add(m[1]);
    // filter out animation shorthand values that are durations/timings
    const timings = new Set(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'infinite', 'forwards', 'backwards', 'both', 'none', 'alternate', 'normal', 'running', 'paused', 'step-start', 'step-end']);
    for (const kf of usedKf) {
      if (!timings.has(kf) && !definedKf.has(kf)) errors.push(`animation references @keyframes "${kf}" which is not defined in tokens.css`);
    }
    // 2. every var() consumed somewhere in src is defined statically or injected
    const injected = new Set(['--primary', '--primary-dark', '--primary-light', '--primary-rgb']);
    const consumed = new Set();
    for (const f of ['src/index.css', 'src/print.css', 'src/tokens.css']) {
      try { for (const m of read(f).matchAll(/var\(\s*(--[\w-]+)/g)) consumed.add(m[1]); } catch { /* file optional */ }
    }
    for (const v of consumed) {
      if (!defined.has(v) && !injected.has(v)) errors.push(`var(${v}) is consumed but defined nowhere (static or runtime)`);
    }
    // 4. import order in main.jsx
    const main = read('src/main.jsx');
    const ti = main.indexOf("./tokens.css");
    const ii = main.indexOf("./index.css");
    if (ti === -1) errors.push('main.jsx does not import ./tokens.css');
    else if (ii !== -1 && ii < ti) errors.push('main.jsx imports ./index.css before ./tokens.css — tokens must come first');
  }
}

if (errors.length) {
  console.error('\n✗ Design-system guard FAILED:\n');
  for (const e of errors) console.error('  - ' + e);
  console.error('\nThe CSS ground layer was modified or destroyed. Restore src/tokens.css — do not regenerate it by script.\n');
  process.exit(1);
}
console.log('✓ design-system guard: tokens, keyframes, var coverage, import order all OK');
