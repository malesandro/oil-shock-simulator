/**
 * Oil Shock Monte Carlo Simulation Engine
 * 
 * 800-run simulation modeling 18-month price trajectories for:
 * - Brent crude oil ($/bbl)
 * - EU natural gas / TTF (€/MWh)
 * - Flight prices (% increase)
 * - Food prices (% increase)
 * - Services / CPI (% increase)
 * 
 * Calibrated against: Rystad Energy, Goldman Sachs, Capital Economics,
 * Deutsche Bank, 2022 Ukraine shock transmission data, 1973/1979 pass-through rates.
 */

// Seeded PRNG for reproducible results
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Run the full Monte Carlo simulation
 * @param {Object} params - Simulation parameters
 * @param {number} params.oilPrice - Starting Brent price ($/bbl)
 * @param {number} params.conflictMonths - Duration of active conflict (1-18)
 * @param {number} params.hormuzReopenMonth - Month Hormuz reopens (0 = stays closed)
 * @param {number} params.euGasStorage - EU gas storage level (% 0-100)
 * @param {boolean} params.reserveRelease - G7 strategic reserve release
 * @param {boolean} params.russiaGasCut - Russia cuts remaining EU gas
 * @param {number} params.demandDestruction - Demand destruction factor (0-1)
 * @param {number} params.shockProb - Monthly infrastructure shock probability (0-100)
 * @param {number} N - Number of simulation runs
 * @returns {Object} Results with arrays of monthly trajectories per variable
 */
export function runSimulation(params, N = 800) {
  const {
    oilPrice, conflictMonths, hormuzReopenMonth, euGasStorage,
    reserveRelease, russiaGasCut, demandDestruction, shockProb
  } = params;

  const R = { flights: [], food: [], services: [], oil: [], gasEU: [] };

  for (let run = 0; run < N; run++) {
    const rng = mulberry32(run * 7919 + 31);

    // ── OIL MODEL ──
    // Initial conditions reflect active crisis (Hormuz already closed, $60→$99 in 10 days)
    const mOil = [];
    let p = oilPrice;
    for (let m = 1; m <= 18; m++) {
      const war = m <= conflictMonths;
      const hOpen = hormuzReopenMonth > 0 && m >= hormuzReopenMonth;

      // First 3 months: additional crisis escalation
      const earlyBoost = m <= 3 ? 8 + gauss(rng) * 4 : 0;
      let sp = war && !hOpen
        ? (6 + gauss(rng) * 3 + earlyBoost)
        : hOpen
          ? (-8 + gauss(rng) * 4)
          : (-4 + gauss(rng) * 2);

      // Reserve release: delayed 1-2 months, weaker early
      const reserveDelay = Math.min(1, Math.max(0, (m - 1) / 2));
      const re = reserveRelease && war ? -(4 + rng() * 8) * reserveDelay : 0;

      // Demand destruction: ramps over 4 months above $110
      const ddBuild = Math.min(1, m / 4);
      const dd = p > 110 ? -((p - 110) * 0.08 * demandDestruction * (1 + rng() * 0.5) * ddBuild) : 0;

      const ru = russiaGasCut && m <= conflictMonths + 3 ? (3 + rng() * 5) : 0;
      const shock = (rng() < (shockProb || 0) / 100) ? (15 + rng() * 20) : 0;
      const noise = gauss(rng) * p * 0.06;

      p = clamp(p + sp + re + dd + ru + shock + noise, 52, 220);
      mOil.push(p);
    }
    R.oil.push(mOil);

    // ── EU GAS MODEL (TTF €/MWh) ──
    const mGas = [];
    let gp = clamp(60 * (50 / Math.max(euGasStorage, 10)), 40, 180);
    for (let m = 1; m <= 18; m++) {
      const war = m <= conflictMonths;
      const hOpen = hormuzReopenMonth > 0 && m >= hormuzReopenMonth;
      const earlyGasBoost = m <= 3 ? 4 + gauss(rng) * 3 : 0;
      const lng = war && !hOpen ? (4 + gauss(rng) * 2.5 + earlyGasBoost) : (-5 + gauss(rng) * 2.5);
      const ru = russiaGasCut ? (5 + rng() * 4) : 0;
      const wm = ((m + 2) % 12);
      const wp = wm >= 9 || wm <= 1 ? (4 + rng() * 6) : 0;
      const shock = (rng() < (shockProb || 0) / 100) ? (10 + rng() * 15) : 0;
      gp = clamp(gp + lng + ru + wp + shock + gauss(rng) * gp * 0.07, 25, 250);
      mGas.push(gp);
    }
    R.gasEU.push(mGas);

    // ── FLIGHTS MODEL ──
    // Fuel ~30% of cost, hedging starts at 55% and decays exponentially
    const mF = [];
    const hr = 0.55;
    for (let m = 1; m <= 18; m++) {
      const oc = (mOil[m - 1] - 65) / 65;
      const hd = Math.max(0, hr * Math.exp(-m * 0.15));
      const er = 1 - hd;
      const pi = oc * 0.30 * er + oc * 0.30 * hd * 0.15;
      const ve = oc > 0.5 ? oc * 0.05 * (1 + rng() * 0.5) : 0;
      mF.push(clamp((pi + ve + gauss(rng) * 0.02) * 100, -15, 150));
    }
    R.flights.push(mF);

    // ── FOOD MODEL ──
    // Multi-stage: transport (fast) + fertilizer (3-6mo lag) + processing (2-3mo lag)
    const mFd = [];
    for (let m = 1; m <= 18; m++) {
      const oc = (mOil[m - 1] - 65) / 65;
      const gc = (mGas[m - 1] - 35) / 35;
      const tr = oc * 0.08 * Math.min(m / 1.5, 1);
      const fl = Math.min(1, Math.max(0, (m - 2) / 4));
      const fe = gc * 0.12 * fl;
      const pl = Math.min(1, Math.max(0, (m - 1) / 3));
      const pr = oc * 0.06 * pl;
      const mk = 1.15 + rng() * 0.15;
      mFd.push(clamp((tr + fe + pr) * mk * 100 + gauss(rng) * 0.01, -5, 120));
    }
    R.food.push(mFd);

    // ── SERVICES / CPI MODEL ──
    // Slow: direct energy + logistics + wage-price spiral with CB dampening
    const mS = [];
    let we = 0;
    for (let m = 1; m <= 18; m++) {
      const oc = (mOil[m - 1] - 65) / 65;
      const gc = (mGas[m - 1] - 35) / 35;
      const de = (oc * 0.03 + gc * 0.02) * Math.min(m / 3, 1);
      const lo = oc * 0.03 * Math.min(m / 2, 1);
      const hi = (mFd[m - 1] / 100) * 0.35 + de;
      we = we * 0.85 + hi * 0.15 * (1 + rng() * 0.3);
      const wp = m >= 4 ? we * 0.6 : 0;
      const cb = (de + lo + wp) > 0.04 ? -((de + lo + wp) - 0.04) * 0.15 * demandDestruction : 0;
      mS.push(clamp((de + lo + wp + cb + gauss(rng) * 0.005) * 100, -3, 50));
    }
    R.services.push(mS);
  }

  return R;
}

/**
 * Compute percentiles from simulation runs at a given month
 */
export function computePercentiles(runs, monthIndex) {
  const values = runs.map((r) => r[monthIndex]).sort((a, b) => a - b);
  const p = (pct) => values[Math.floor(pct * values.length)] || 0;
  return {
    p10: p(0.1),
    p25: p(0.25),
    median: p(0.5),
    p75: p(0.75),
    p90: p(0.9),
  };
}

/**
 * Run sensitivity analysis: vary one parameter at a time, measure impact at month 6
 */
export function runSensitivity(baseParams) {
  const keys = [
    { key: 'conflictMonths', label: 'Conflict Duration', vals: [3, 6, 12], unit: 'mo' },
    { key: 'hormuzReopenMonth', label: 'Hormuz Reopens', vals: [0, 3, 6], unit: 'mo' },
    { key: 'russiaGasCut', label: 'Russia Cuts Gas', vals: [false, true], unit: '' },
    { key: 'reserveRelease', label: 'G7 Reserves', vals: [false, true], unit: '' },
    { key: 'demandDestruction', label: 'Demand Destruction', vals: [0.1, 0.5, 0.9], unit: '' },
    { key: 'shockProb', label: 'Shock Probability', vals: [0, 5, 15], unit: '%' },
  ];

  return keys
    .map(({ key, label, vals, unit }) => {
      const results = vals.map((v) => {
        const p = { ...baseParams, [key]: v };
        const r = runSimulation(p, 200);
        return {
          val: v,
          oilM6: computePercentiles(r.oil, 5).median,
          foodM6: computePercentiles(r.food, 5).median,
          cpiM6: computePercentiles(r.services, 5).median,
        };
      });
      const oilRange = Math.abs(results[results.length - 1].oilM6 - results[0].oilM6);
      return { key, label, unit, results, oilRange };
    })
    .sort((a, b) => b.oilRange - a.oilRange);
}

/**
 * 2022 backtest: run with Ukraine-equivalent parameters
 */
export function run2022Backtest() {
  const params = {
    oilPrice: 95,
    conflictMonths: 5,
    hormuzReopenMonth: 4,
    euGasStorage: 30,
    reserveRelease: true,
    russiaGasCut: true,
    demandDestruction: 0.4,
    shockProb: 2,
  };
  return runSimulation(params, 800);
}

export const ACTUAL_2022 = {
  oil: [105, 120, 139, 110, 108, 100, 95, 88, 85, 82, 80, 78],
  food: [1, 2, 4, 6, 8, 9.5, 10.5, 11, 11.4, 11.2, 10.5, 10],
  services: [1, 1.5, 2, 2.5, 3.2, 3.8, 4.2, 4.8, 5.2, 5.5, 5.4, 5.2],
};

/**
 * Scenario presets
 */
export const PRESETS = {
  current: { label: 'Current', oilPrice: 100, conflictMonths: 3, hormuzReopenMonth: 0, euGasStorage: 27, reserveRelease: true, russiaGasCut: false, demandDestruction: 0.3, shockProb: 3 },
  swift: { label: 'Swift', oilPrice: 100, conflictMonths: 1, hormuzReopenMonth: 2, euGasStorage: 27, reserveRelease: true, russiaGasCut: false, demandDestruction: 0.2, shockProb: 1 },
  extended: { label: 'Extended', oilPrice: 100, conflictMonths: 6, hormuzReopenMonth: 5, euGasStorage: 27, reserveRelease: true, russiaGasCut: false, demandDestruction: 0.4, shockProb: 3 },
  prolonged: { label: 'Prolonged', oilPrice: 100, conflictMonths: 10, hormuzReopenMonth: 0, euGasStorage: 27, reserveRelease: true, russiaGasCut: true, demandDestruction: 0.5, shockProb: 5 },
  catastrophic: { label: 'Catastrophic', oilPrice: 100, conflictMonths: 18, hormuzReopenMonth: 0, euGasStorage: 27, reserveRelease: true, russiaGasCut: true, demandDestruction: 0.6, shockProb: 10 },
};
