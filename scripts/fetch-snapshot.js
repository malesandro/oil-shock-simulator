#!/usr/bin/env node
/**
 * Refresh auto-fetchable fields in src/data/snapshot.json before a build.
 *
 * Currently auto-fetches:
 *   - euGasStorage (% full, EU aggregate) from AGSI+ (Gas Infrastructure Europe)
 *
 * Behavior:
 *   - If AGSI_API_KEY is not set in env, exits 0 without modifying anything.
 *     This makes the script safe to run on every build, locally or in CI;
 *     contributors without a key just get whatever's already in snapshot.json.
 *   - If the fetch fails (network, rate limit, schema change), logs a warning
 *     and exits 0 — a stale build is better than a broken deploy.
 *   - Only updates fields whose value actually changes, to keep diffs minimal.
 *
 * To enable AGSI+ auto-fetch:
 *   1. Register a free key at https://agsi.gie.eu/account
 *   2. Set AGSI_API_KEY in your env (locally) or as a GitHub Actions secret
 *
 * Manual fields (scenario probabilities, IEA reserve progress, narratives)
 * are NEVER touched by this script — those require human judgment.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = join(HERE, '..', 'src', 'data', 'snapshot.json');

async function fetchAgsiEuStorage(apiKey) {
  // AGSI+ aggregate EU endpoint. The `full` field is the % of working gas
  // capacity currently in storage across all EU member states.
  const url = 'https://agsi.gie.eu/api?country=eu&type=eu&size=1';
  const res = await fetch(url, { headers: { 'x-key': apiKey } });
  if (!res.ok) throw new Error(`AGSI+ HTTP ${res.status}`);
  const json = await res.json();
  const row = json?.data?.[0];
  if (!row) throw new Error('AGSI+ returned no rows');
  const full = parseFloat(row.full);
  if (!Number.isFinite(full) || full < 0 || full > 100) {
    throw new Error(`AGSI+ "full" out of range: ${row.full}`);
  }
  return { value: Math.round(full), asOf: row.gasDayStart || row.gasDayStartedOn };
}

async function main() {
  const key = process.env.AGSI_API_KEY;
  if (!key) {
    console.log('[fetch-snapshot] AGSI_API_KEY not set — skipping (this is fine).');
    return;
  }

  const raw = await readFile(SNAPSHOT_PATH, 'utf8');
  const snapshot = JSON.parse(raw);
  let changed = false;

  try {
    const { value, asOf } = await fetchAgsiEuStorage(key);
    if (snapshot.euGasStorage !== value) {
      console.log(`[fetch-snapshot] euGasStorage ${snapshot.euGasStorage}% -> ${value}% (AGSI+ gasDay ${asOf})`);
      snapshot.euGasStorage = value;
      snapshot.euGasStorageSource = `agsi (${asOf})`;
      snapshot.asOf = new Date().toISOString().slice(0, 10);
      changed = true;
    } else {
      console.log(`[fetch-snapshot] euGasStorage unchanged at ${value}% (AGSI+ gasDay ${asOf})`);
    }
  } catch (err) {
    console.warn(`[fetch-snapshot] AGSI+ fetch failed: ${err.message} — keeping existing value.`);
  }

  if (changed) {
    await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
    console.log('[fetch-snapshot] snapshot.json updated.');
  }
}

main().catch((err) => {
  console.warn(`[fetch-snapshot] unexpected error: ${err.message} — continuing build.`);
  process.exit(0);
});
