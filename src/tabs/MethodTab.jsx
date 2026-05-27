import { C } from '../theme';
import snapshot from '../data/snapshot.json' with { type: 'json' };

const COLOR_MAP = { green: C.green, accent: C.accent, orange: '#f97316', red: C.red };
const niceDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function MethodTab() {
  return (
    <div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: C.accent, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Simulation Architecture</h3>
        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.blue }}>Monte Carlo.</strong> 800 runs, seeded PRNG (Mulberry32). 18-month horizon. 5 linked variables: oil, EU gas, flights, food, services/CPI. Gaussian noise per step.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.blue }}>Oil.</strong> Supply pressure +$6-9/mo (Hormuz closed) with early-month crisis boost (+$8-12 in months 1-3). Reserve dampening delayed 1-2 months. Demand destruction ramps over 4 months above $110. Random infrastructure shocks. Floor $52, ceiling $220.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.blue }}>Flights.</strong> Fuel ~30% of cost × oil change × exposure (55% hedged, decaying exponentially). Volume elasticity above +50% oil.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.blue }}>Food.</strong> Multi-stage: transport (8%, fast) + fertilizer (12%, 3-6mo lag, gas-driven) + processing (6%, 2-3mo lag) × retail markup 1.15-1.30.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: C.blue }}>Services/CPI.</strong> Direct energy 5% + logistics 3% + wage-price spiral (EMA, ~60% weaker than '70s). Central bank dampening above 4%.</p>
          <p><strong style={{ color: C.blue }}>EU Gas.</strong> TTF scaled by storage level. LNG disruption, Russia cut premium, winter seasonal, random shocks. Floor €25, ceiling €250.</p>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ color: C.accent, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Calibration</h3>
        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 10 }}><strong style={{ color: C.accent }}>Anchors:</strong> IEA May 2026 OMR (~14 mb/d shut in, Brent $110, Hormuz reopens from June), World Bank Apr 2026 (baseline $86/bbl 2026 avg, upside $115), IMF Apr 2026 WEO ($82 baseline, recession risk if Hormuz stays closed), OPEC MOMR. Bank anchors: Rystad ($135/4mo), Goldman (17× vs 2022), Capital Economics, Kpler.</p>
          <p style={{ marginBottom: 10 }}><strong style={{ color: C.accent }}>Historical:</strong> 1973 (food +30-50%/24mo, CPI 3→12%/18mo), 1979 (oil doubled/12mo), 1990 Gulf War (spike+crash), 2022 Ukraine (~18mo to peak CPI).</p>
          <p><strong style={{ color: C.accent }}>2022 backtest:</strong> Model captures structural dynamics. Trust relative signals over absolutes.</p>
        </div>
      </div>

      <div style={{ background: C.red + '0a', border: `1px solid ${C.red}22`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <div style={{ color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>LIMITATIONS</div>
        <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.7 }}>
          Parameters from analyst reports, not regression on tick data. No speculative overshooting, geopolitical feedback loops,
          cascading financial effects, or non-linear infrastructure damage. Reality has fatter tails. DKK estimates use stylized baselines.
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
        <h3 style={{ color: C.accent, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Scenario Probabilities (updated {niceDate(snapshot.asOf)})</h3>
        {snapshot.methodScenarios.map((sc) => ({ n: sc.name, p: sc.p, c: COLOR_MAP[sc.color] || C.accent, w: sc.rationale })).map((s, i) => (
          <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ background: s.c + '22', color: s.c, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, minWidth: 60, textAlign: 'center', marginTop: 2 }}>{s.p}</div>
            <div>
              <div style={{ color: s.c, fontWeight: 600, fontSize: 13 }}>{s.n}</div>
              <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.6 }}>{s.w}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
