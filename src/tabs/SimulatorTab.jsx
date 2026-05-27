import { useMemo, useCallback, useState } from 'react';
import { C } from '../theme';
import { runSimulation, computePercentiles, runSensitivity, PRESETS } from '../engine/simulation';
import { Slider, Toggle, Sparkline, DistChart } from '../components/ui';
import { WAR_START } from '../constants';

// Human-readable interpretation of each parameter value
function describeDemandDestruction(v) {
  if (v < 0.25) return 'light — consumers absorb most price hikes';
  if (v < 0.5) return 'moderate — visible cuts in driving / heating';
  if (v < 0.75) return 'strong — recession-style demand pullback';
  return 'severe — 1970s-scale rationing behavior';
}
function describeShockProb(v) {
  if (v === 0) return 'no infrastructure surprises';
  return `~1 shock every ${Math.round(100 / v)} months`;
}
function describeGasStorage(v) {
  if (v < 25) return 'critically low — winter risk';
  if (v < 40) return `below 55% seasonal norm`;
  if (v < 55) return 'approaching seasonal norm';
  return 'healthy — at or above norm';
}
function describeConflict(v) {
  if (v <= 3) return 'short — March-May 2026';
  if (v <= 6) return 'medium — ends summer 2026';
  if (v <= 12) return 'long — drags into 2027';
  return 'extreme — through mid-2027';
}
function monthLabel(m) {
  if (m === 0) return null;
  const d = new Date(WAR_START);
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Preset match — true if every key (except cosmetic) equals preset value
function matchesPreset(params, preset) {
  return Object.keys(preset).every((k) => k === 'label' || k === 'oilPrice' || params[k] === preset[k]);
}

export default function SimulatorTab({ params, setParams, priceInfo }) {
  const set = useCallback((k, v) => setParams((p) => ({ ...p, [k]: v })), [setParams]);
  const [baselineKey, setBaselineKey] = useState('current');
  const baseline = PRESETS[baselineKey];
  const isOnBaseline = matchesPreset(params, baseline);

  const applyPreset = useCallback((k) => {
    setBaselineKey(k);
    setParams((p) => ({ ...PRESETS[k], oilPrice: p.oilPrice }));
  }, [setParams]);

  const results = useMemo(() => runSimulation(params), [params]);
  const baselineResults = useMemo(
    () => (isOnBaseline ? null : runSimulation({ ...baseline, oilPrice: params.oilPrice }, 400)),
    [baseline, params.oilPrice, isOnBaseline]
  );
  const sensitivity = useMemo(() => runSensitivity(params), [params]);

  const snaps = [3, 6, 9, 12].map((m) => ({
    month: m,
    oil: computePercentiles(results.oil, m - 1),
    flights: computePercentiles(results.flights, m - 1),
    food: computePercentiles(results.food, m - 1),
    services: computePercentiles(results.services, m - 1),
    gas: computePercentiles(results.gasEU, m - 1),
  }));
  const endMo = Math.min(params.conflictMonths, 18) - 1;

  return (
    <div>
      <div style={{ color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        800-run Monte Carlo with random infrastructure shocks. Dashed red line = conflict end. Dot = peak value.
        <span style={{ color: C.textMuted, fontSize: 11, display: 'block', marginTop: 4 }}>
          Months are counted from war start (Feb 28, 2026): month 1 = March, month 3 = May, month 12 = Feb 2027.
        </span>
      </div>

      {/* Presets + modified indicator */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(PRESETS).map(([k, pr]) => {
          const isBaseline = k === baselineKey;
          const exact = isBaseline && isOnBaseline;
          return (
            <button key={k} onClick={() => applyPreset(k)} style={{
              background: exact ? C.accent + '22' : isBaseline ? C.accent + '11' : C.card,
              color: exact ? C.accent : isBaseline ? C.accent : C.textDim,
              border: `1px solid ${exact ? C.accent + '44' : isBaseline ? C.accent + '33' : C.border}`,
              borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
              fontWeight: exact || isBaseline ? 600 : 400, transition: 'all 0.15s',
            }}>{pr.label}</button>
          );
        })}
        {!isOnBaseline && (
          <button onClick={() => applyPreset(baselineKey)} style={{
            background: 'transparent', border: `1px solid ${C.accent}44`, borderRadius: 4,
            color: C.accent, fontSize: 11, padding: '4px 10px', cursor: 'pointer', marginLeft: 'auto',
          }}>
            ↺ Reset to {baseline.label}
          </button>
        )}
      </div>

      {/* Live oil price anchor — promoted */}
      <div style={{
        background: priceInfo?.source && priceInfo.source !== 'fallback' ? '#22c55e0d' : C.card,
        border: `1px solid ${priceInfo?.source && priceInfo.source !== 'fallback' ? '#22c55e33' : C.border}`,
        borderRadius: 8, padding: 14, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Starting Brent Price
            </div>
            {priceInfo?.source && priceInfo.source !== 'fallback' ? (
              <div style={{ color: '#22c55e', fontSize: 11, marginTop: 2 }}>
                ● Live ${priceInfo.price.toFixed(2)}/bbl from {priceInfo.source}
                {params.oilPrice !== Math.round(priceInfo.price) && (
                  <button onClick={() => set('oilPrice', Math.round(priceInfo.price))} style={{
                    background: 'transparent', border: '1px solid #22c55e44', borderRadius: 3,
                    color: '#22c55e', fontSize: 10, padding: '2px 8px', cursor: 'pointer', marginLeft: 8,
                  }}>Snap to live</button>
                )}
              </div>
            ) : (
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>
                Indicative price — live feed unavailable
              </div>
            )}
          </div>
        </div>
        <Slider label="Adjust manually" value={params.oilPrice} onChange={(v) => set('oilPrice', v)}
          min={60} max={300} unit=" $/bbl" color={C.accent}
          hint={params.oilPrice < 70 ? 'pre-war' : params.oilPrice < 100 ? 'tension premium'
            : params.oilPrice < 140 ? 'severe disruption' : 'historic crisis'} />
      </div>

      {/* High-impact structural controls */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ color: C.accent, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          High-impact levers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 12 }}>
          <Toggle label="G7 Reserve Release" value={params.reserveRelease} onChange={(v) => set('reserveRelease', v)}
            emphasis hint={params.reserveRelease ? '400M bbl deploying' : 'no reserve buffer'}
            modified={baseline.reserveRelease !== params.reserveRelease} />
          <Toggle label="Russia Cuts EU Gas" value={params.russiaGasCut} onChange={(v) => set('russiaGasCut', v)}
            emphasis hint={params.russiaGasCut ? 'remaining EU flow shut' : 'Russia flow continues'}
            modified={baseline.russiaGasCut !== params.russiaGasCut} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Slider label="Conflict Duration" value={params.conflictMonths} onChange={(v) => set('conflictMonths', v)}
            min={1} max={18} unit=" mo" color={C.red} hint={describeConflict(params.conflictMonths)}
            modified={baseline.conflictMonths !== params.conflictMonths} />
          <div>
            <Toggle label="Hormuz Reopens?" value={params.hormuzReopenMonth > 0}
              onChange={(v) => set('hormuzReopenMonth', v ? Math.max(1, params.conflictMonths) : 0)}
              hint={params.hormuzReopenMonth === 0 ? 'stays closed' : `transit resumes ${monthLabel(params.hormuzReopenMonth)}`}
              modified={(baseline.hormuzReopenMonth > 0) !== (params.hormuzReopenMonth > 0)} />
            {params.hormuzReopenMonth > 0 && (
              <Slider label="When?" value={params.hormuzReopenMonth} onChange={(v) => set('hormuzReopenMonth', v)}
                min={1} max={18} unit=" mo" color={C.blue}
                hint={monthLabel(params.hormuzReopenMonth)}
                modified={baseline.hormuzReopenMonth > 0 && baseline.hormuzReopenMonth !== params.hormuzReopenMonth} />
            )}
          </div>
        </div>
      </div>

      {/* Calibration controls */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ color: C.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Calibration
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Slider label="EU Gas Storage" value={params.euGasStorage} onChange={(v) => set('euGasStorage', v)}
            min={10} max={60} unit="%" color={C.green} hint={describeGasStorage(params.euGasStorage)}
            modified={baseline.euGasStorage !== params.euGasStorage} />
          <Slider label="Demand Destruction" value={params.demandDestruction} onChange={(v) => set('demandDestruction', v)}
            min={0} max={1} step={0.1} color={C.purple} hint={describeDemandDestruction(params.demandDestruction)}
            modified={baseline.demandDestruction !== params.demandDestruction} />
          <Slider label="Monthly Shock Prob" value={params.shockProb} onChange={(v) => set('shockProb', v)}
            min={0} max={20} unit="%" color={C.red} hint={describeShockProb(params.shockProb)}
            modified={baseline.shockProb !== params.shockProb} />
        </div>
      </div>

      {/* Sparklines (overlay baseline preset when params have been modified) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: '🛢️ Oil ($/bbl)', runs: results.oil, baselineRuns: baselineResults?.oil, unit: '$', color: C.accent },
          { label: '⛽ Gas (€/MWh)', runs: results.gasEU, baselineRuns: baselineResults?.gasEU, unit: '€', color: C.blue },
          { label: '✈️ Flights (%↑)', runs: results.flights, baselineRuns: baselineResults?.flights, unit: '%', color: C.red },
          { label: '🛒 Food (%↑)', runs: results.food, baselineRuns: baselineResults?.food, unit: '%', color: C.green },
        ].map((cfg, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            <Sparkline {...cfg} baselineLabel={baseline.label} conflictEnd={params.conflictMonths} />
          </div>
        ))}
      </div>

      {/* Snapshot table — with delta vs baseline when params modified */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Median (50% CI)
          </div>
          {baselineResults && (
            <div style={{ color: C.textMuted, fontSize: 10 }}>
              Δ vs <span style={{ color: C.accent }}>{baseline.label}</span> baseline
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Mo', 'Oil $', 'Gas €', 'Flights', 'Food', 'CPI'].map((h, i) => (
                  <th key={i} style={{ textAlign: i ? 'center' : 'left', padding: '6px 4px', color: [C.textMuted, C.accent, C.blue, C.red, C.green, C.purple][i] }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {snaps.map((s) => {
                const baseRow = baselineResults && {
                  oil: computePercentiles(baselineResults.oil, s.month - 1).median,
                  gas: computePercentiles(baselineResults.gasEU, s.month - 1).median,
                  flights: computePercentiles(baselineResults.flights, s.month - 1).median,
                  food: computePercentiles(baselineResults.food, s.month - 1).median,
                  services: computePercentiles(baselineResults.services, s.month - 1).median,
                };
                const cells = [
                  [s.oil, C.accent, baseRow?.oil],
                  [s.gas, C.blue, baseRow?.gas],
                  [s.flights, C.red, baseRow?.flights],
                  [s.food, C.green, baseRow?.food],
                  [s.services, C.purple, baseRow?.services],
                ];
                return (
                  <tr key={s.month} style={{ borderBottom: `1px solid ${C.border}22` }}>
                    <td style={{ padding: '6px 4px', color: C.text, fontWeight: 600 }}>{s.month}</td>
                    {cells.map(([d, c, base], j) => {
                      const delta = base != null ? d.median - base : null;
                      const deltaSign = delta == null || Math.abs(delta) < 0.5 ? null : delta > 0 ? '+' : '';
                      return (
                        <td key={j} style={{ textAlign: 'center', padding: '6px 4px' }}>
                          <span style={{ color: c, fontWeight: 600 }}>{d.median.toFixed(1)}</span>
                          <span style={{ color: C.textMuted, fontSize: 10 }}> ({d.p25.toFixed(0)}–{d.p75.toFixed(0)})</span>
                          {deltaSign != null && (
                            <div style={{ color: delta > 0 ? C.red : C.green, fontSize: 9, marginTop: 1 }}>
                              {deltaSign}{delta.toFixed(1)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distributions */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>
          Distribution at Month {Math.min(params.conflictMonths, 18)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { l: '✈️ Flights', r: results.flights, c: C.red },
            { l: '🛒 Food', r: results.food, c: C.green },
            { l: '🛢️ Oil', r: results.oil, u: '$', c: C.accent },
            { l: '🏢 CPI', r: results.services, c: C.purple },
          ].map((x, i) => (
            <div key={i}>
              <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4, fontWeight: 600 }}>{x.l}</div>
              <DistChart runs={x.r} monthIndex={endMo} unit={x.u || '%'} color={x.c} />
            </div>
          ))}
        </div>
      </div>

      {/* Sensitivity */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
          Sensitivity Analysis (oil at month 6)
        </div>
        <div style={{ color: C.textMuted, fontSize: 10, marginBottom: 10 }}>Ranked by impact. 200 runs per variation.</div>
        {sensitivity.map((s, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ color: C.text, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {i + 1}. {s.label} <span style={{ color: C.accent, fontWeight: 700 }}>Δ${s.oilRange.toFixed(0)}/bbl</span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
              {s.results.map((r, j) => (
                <div key={j} style={{ background: C.bg, borderRadius: 4, padding: '4px 8px', flex: 1, textAlign: 'center' }}>
                  <div style={{ color: C.textMuted }}>{String(r.val)}{s.unit}</div>
                  <div style={{ color: C.accent, fontWeight: 600 }}>${r.oilM6.toFixed(0)}</div>
                  <div style={{ color: C.green, fontSize: 10 }}>food +{r.foodM6.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
