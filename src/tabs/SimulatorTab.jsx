import { useMemo, useCallback } from 'react';
import { C } from '../theme';
import { runSimulation, computePercentiles, runSensitivity, PRESETS } from '../engine/simulation';
import { Slider, Toggle, Sparkline, DistChart } from '../components/ui';

export default function SimulatorTab({ params, setParams, priceInfo }) {
  const set = useCallback((k, v) => setParams((p) => ({ ...p, [k]: v })), [setParams]);
  const results = useMemo(() => runSimulation(params), [params]);
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
      </div>

      {/* Presets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(PRESETS).map(([k, pr]) => {
          const active = Object.keys(pr).every((key) => key === 'label' || key === 'oilPrice' || params[key] === pr[key]);
          return (
            <button key={k} onClick={() => setParams((p) => ({ ...pr, oilPrice: p.oilPrice }))} style={{
              background: active ? C.accent + '22' : C.card,
              color: active ? C.accent : C.textDim,
              border: `1px solid ${active ? C.accent + '44' : C.border}`,
              borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
              fontWeight: active ? 600 : 400, transition: 'all 0.15s',
            }}>{pr.label}</button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
          <Slider label="Oil Price (Brent)" value={params.oilPrice} onChange={(v) => set('oilPrice', v)} min={70} max={300} unit=" $/bbl" />
              {priceInfo && priceInfo.source !== 'fallback' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 4 }}>
                  <span style={{ color: '#22c55e', fontSize: 10 }}>Live: ${priceInfo.price}/bbl from {priceInfo.source}</span>
                  {params.oilPrice !== Math.round(priceInfo.price) && (
                    <button onClick={() => set('oilPrice', Math.round(priceInfo.price))} style={{
                      background: 'transparent', border: '1px solid #22c55e44', borderRadius: 3,
                      color: '#22c55e', fontSize: 9, padding: '1px 6px', cursor: 'pointer',
                    }}>Reset to live</button>
                  )}
                </div>
              )}
          <Slider label="Conflict Duration" value={params.conflictMonths} onChange={(v) => set('conflictMonths', v)} min={1} max={18} unit=" mo" color={C.red} />
          <Slider label="Hormuz Reopens" value={params.hormuzReopenMonth} onChange={(v) => set('hormuzReopenMonth', v)} min={0} max={18} color={C.blue} note={params.hormuzReopenMonth === 0 ? '(closed)' : ''} />
          <Slider label="EU Gas Storage" value={params.euGasStorage} onChange={(v) => set('euGasStorage', v)} min={10} max={60} unit="%" color={C.green} />
          <Slider label="Demand Destruction" value={params.demandDestruction} onChange={(v) => set('demandDestruction', v)} min={0} max={1} step={0.1} color={C.purple} />
          <Slider label="Monthly Shock Prob" value={params.shockProb} onChange={(v) => set('shockProb', v)} min={0} max={20} unit="%" color={C.red} />
          <Toggle label="G7 Reserve Release" value={params.reserveRelease} onChange={(v) => set('reserveRelease', v)} />
          <Toggle label="Russia Cuts EU Gas" value={params.russiaGasCut} onChange={(v) => set('russiaGasCut', v)} />
        </div>
      </div>

      {/* Sparklines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: '🛢️ Oil ($/bbl)', runs: results.oil, unit: '$', color: C.accent },
          { label: '⛽ Gas (€/MWh)', runs: results.gasEU, unit: '€', color: C.blue },
          { label: '✈️ Flights (%↑)', runs: results.flights, unit: '%', color: C.red },
          { label: '🛒 Food (%↑)', runs: results.food, unit: '%', color: C.green },
        ].map((cfg, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            <Sparkline {...cfg} conflictEnd={params.conflictMonths} />
          </div>
        ))}
      </div>

      {/* Snapshot table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Median (50% CI)
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
              {snaps.map((s) => (
                <tr key={s.month} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: '6px 4px', color: C.text, fontWeight: 600 }}>{s.month}</td>
                  {[[s.oil, C.accent], [s.gas, C.blue], [s.flights, C.red], [s.food, C.green], [s.services, C.purple]].map(([d, c], j) => (
                    <td key={j} style={{ textAlign: 'center', padding: '6px 4px' }}>
                      <span style={{ color: c, fontWeight: 600 }}>{d.median.toFixed(1)}</span>
                      <span style={{ color: C.textMuted, fontSize: 10 }}> ({d.p25.toFixed(0)}–{d.p75.toFixed(0)})</span>
                    </td>
                  ))}
                </tr>
              ))}
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
