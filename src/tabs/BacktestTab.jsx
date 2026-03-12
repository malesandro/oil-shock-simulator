import { useMemo } from 'react';
import { C } from '../theme';
import { run2022Backtest, computePercentiles, ACTUAL_2022 } from '../engine/simulation';

export default function BacktestTab() {
  const bt = useMemo(() => run2022Backtest(), []);

  const renderTable = (label, actual, runs, unit = '') => {
    const prefix = unit === '$' ? '$' : '+';
    const suffix = unit === '$' ? '' : '%';
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
          Model vs Actual: {label}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Month', 'Actual 2022', 'Model Median', 'Model 50% CI', 'Hit?'].map((h, i) => (
                <th key={i} style={{ textAlign: i ? 'center' : 'left', padding: '6px 4px', color: [C.textMuted, C.blue, C.accent, C.textMuted, C.green][i] }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 3, 6, 9, 12].map((m) => {
              const act = actual[m - 1];
              const mod = computePercentiles(runs, m - 1);
              const hit = act >= mod.p25 && act <= mod.p75;
              const near = act >= mod.p10 && act <= mod.p90;
              return (
                <tr key={m} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: '6px 4px', color: C.text, fontWeight: 600 }}>{m}</td>
                  <td style={{ textAlign: 'center', color: C.blue, fontWeight: 600 }}>{prefix}{act}{suffix}</td>
                  <td style={{ textAlign: 'center', color: C.accent, fontWeight: 600 }}>{prefix}{mod.median.toFixed(unit === '$' ? 0 : 1)}{suffix}</td>
                  <td style={{ textAlign: 'center', color: C.textMuted }}>{prefix}{mod.p25.toFixed(0)}–{mod.p75.toFixed(0)}{suffix}</td>
                  <td style={{ textAlign: 'center', color: hit ? C.green : near ? '#f59e0b' : C.red }}>
                    {hit ? '✓ in 50%' : near ? '~ in 80%' : '✗ miss'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        Can this model have predicted the 2022 Russia/Ukraine shock? Run with equivalent starting conditions, compared against actual outcomes.
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>2022 Backtest Parameters</div>
        <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.7 }}>
          Oil $95 (late Feb 2022). Conflict 5 months. Hormuz-equivalent reopens month 4 (Russia found Asian buyers).
          Russia cuts EU gas: yes. Reserves: yes. Demand destruction: 0.4. Shock prob: 2%.
        </div>
      </div>

      {renderTable('Oil ($/bbl)', ACTUAL_2022.oil, bt.oil, '$')}
      {renderTable('Food Inflation (%)', ACTUAL_2022.food, bt.food)}

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: C.accent, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Backtest Verdict</div>
        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 10 }}>
            The structural dynamics — fast oil spike, lagged food, gas staying elevated — match the 2022 pattern. The <strong>shape</strong> is right.
          </p>
          <p style={{ marginBottom: 10 }}>
            Where it diverges: likely overshoots early oil peaks and undershoots late food inflation. Can't model Russia finding Asian buyers (a supply-side response).
          </p>
          <p>
            <strong style={{ color: C.accent }}>Trust relative signals (what moves first, what lags, which parameters matter) more than absolute numbers.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
