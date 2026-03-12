import { useMemo } from 'react';
import { C } from '../theme';
import { runSimulation, computePercentiles } from '../engine/simulation';

export default function HouseholdTab({ params }) {
  const r = useMemo(() => runSimulation(params, 400), [params]);
  const months = params.conflictMonths;
  const mo = Math.min(months, 18) - 1;
  const oil = computePercentiles(r.oil, mo);
  const gas = computePercentiles(r.gasEU, mo);
  const food = computePercentiles(r.food, mo);
  const flights = computePercentiles(r.flights, mo);

  const base = { fuel: 1800, heating: 1200, groceries: 3500, electricity: 800 };
  const oilPct = (oil.median - 65) / 65;
  const gasPct = (gas.median - 35) / 35;
  const fuelNow = Math.round(base.fuel * (1 + oilPct * 0.7));
  const heatNow = Math.round(base.heating * (1 + gasPct * 0.5));
  const grocNow = Math.round(base.groceries * (1 + food.median / 100));
  const elecNow = Math.round(base.electricity * (1 + gasPct * 0.15));
  const totalBase = base.fuel + base.heating + base.groceries + base.electricity;
  const totalNow = fuelNow + heatNow + grocNow + elecNow;
  const diff = totalNow - totalBase;

  return (
    <div>
      <div style={{ color: C.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        Estimated monthly cost impact for a Danish household. Settings are shared with the Simulator tab — change them there.
      </div>

      {/* Current scenario summary */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Scenario</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{ color: C.accent }}>Oil: ${params.oilPrice}/bbl</span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ color: C.red }}>Conflict: {params.conflictMonths} mo</span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ color: C.blue }}>Hormuz: {params.hormuzReopenMonth === 0 ? 'closed' : 'reopens mo ' + params.hormuzReopenMonth}</span>
          <span style={{ color: C.textMuted }}>·</span>
          <span style={{ color: C.green }}>Storage: {params.euGasStorage}%</span>
          {params.russiaGasCut && <><span style={{ color: C.textMuted }}>·</span><span style={{ color: C.red }}>Russia cuts gas</span></>}
          {params.reserveRelease && <><span style={{ color: C.textMuted }}>·</span><span style={{ color: C.green }}>G7 reserves</span></>}
        </div>
      </div>

      {/* Cost cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: '⛽ Fuel (car)', pre: base.fuel, now: fuelNow, color: C.accent, note: 'Gasoline/diesel' },
          { label: '🔥 Heating (gas)', pre: base.heating, now: heatNow, color: C.blue, note: 'Natural gas heating' },
          { label: '🛒 Groceries', pre: base.groceries, now: grocNow, color: C.green, note: 'Food & household' },
          { label: '💡 Electricity', pre: base.electricity, now: elecNow, color: C.purple, note: 'Partly buffered by renewables' },
        ].map((item, i) => {
          const pct = ((item.now - item.pre) / item.pre * 100).toFixed(0);
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                <span style={{ color: C.textDim, fontSize: 13, textDecoration: 'line-through' }}>{item.pre.toLocaleString()} kr</span>
                <span style={{ color: item.color, fontSize: 20, fontWeight: 700 }}>{item.now.toLocaleString()} kr</span>
              </div>
              <div style={{ color: C.red, fontSize: 12, marginTop: 2 }}>+{pct}% (+{(item.now - item.pre).toLocaleString()} kr/mo)</div>
              <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>{item.note}</div>
            </div>
          );
        })}
      </div>

      {/* Total impact */}
      <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Total Monthly Extra Cost</div>
            <div style={{ color: C.red, fontSize: 28, fontWeight: 700 }}>+{diff.toLocaleString()} kr/mo</div>
            <div style={{ color: C.textDim, fontSize: 12 }}>{totalBase.toLocaleString()} kr → {totalNow.toLocaleString()} kr (+{((diff / totalBase) * 100).toFixed(0)}%)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: C.textMuted, fontSize: 11, textTransform: 'uppercase' }}>Annual Impact</div>
            <div style={{ color: C.red, fontSize: 22, fontWeight: 700 }}>+{(diff * 12).toLocaleString()} kr/yr</div>
          </div>
        </div>
      </div>

      {/* Flight prices */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 15, fontWeight: 600, marginBottom: 10 }}>CPH Flight Impact</div>
        <div style={{ color: C.textDim, fontSize: 12, marginBottom: 8 }}>
          Median flight increase: +{flights.median.toFixed(0)}% at month {months}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Route', 'Pre-war', 'Now', 'Extra'].map((h, i) => (
                <th key={i} style={{ textAlign: i ? 'center' : 'left', padding: '6px 4px', color: C.textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[['CPH→London', 800], ['CPH→Barcelona', 1200], ['CPH→New York', 4500], ['CPH→Bangkok', 5000]].map(([route, pre], i) => {
              const now = Math.round(pre * (1 + flights.median / 100));
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}22` }}>
                  <td style={{ padding: '6px 4px', color: C.text }}>{route}</td>
                  <td style={{ textAlign: 'center', color: C.textDim }}>{pre.toLocaleString()} kr</td>
                  <td style={{ textAlign: 'center', color: C.red, fontWeight: 600 }}>{now.toLocaleString()} kr</td>
                  <td style={{ textAlign: 'center', color: C.red }}>+{(now - pre).toLocaleString()} kr</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ color: C.textMuted, fontSize: 11, lineHeight: 1.6, fontStyle: 'italic' }}>
        Baselines: fuel 1,800 kr/mo (car commuter), gas heating 1,200 kr/mo, groceries 3,500 kr/mo, electricity 800 kr/mo.
        Fuel pass-through at 70% of oil increase. Heating at 50% of gas increase. Electricity buffered by ~80% renewable share.
        Single-adult estimates — families scale roughly 1.5-2×.
      </div>
    </div>
  );
}
