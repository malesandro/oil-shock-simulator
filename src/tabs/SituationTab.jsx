import { C } from '../theme';

export default function SituationTab() {
  return (
    <div>
      <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ color: C.red, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚡ AS OF MARCH 12, 2026</div>
        <div style={{ color: C.text, fontSize: 14, lineHeight: 1.7 }}>
          Day 12 of US-Israeli war on Iran. Hormuz effectively closed — 20% of global oil+LNG blocked.
          Iran launched "most intense operation since the beginning of the war" — ballistic missiles at Tel Aviv and Haifa.
          3 more ships attacked near Hormuz this morning. IEA released record 400M barrels from strategic reserves — Brent still above $100.
          US contributing 172M barrels from SPR starting next week. Analysts say the release equals ~4 days of global production.
          EU gas storage at ~27%. Qatar LNG still offline. Putin offering to resupply Europe conditionally.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { l: 'Brent today', v: '~$100', s: 'back above $100' },
          { l: 'IEA release', v: '400M bbl', s: 'largest in history' },
          { l: 'US SPR', v: '172M bbl', s: 'starts next week' },
          { l: 'Hormuz', v: 'Closed', s: 'ships still attacked' },
          { l: 'EU gas storage', v: '~27%', s: 'vs 41% avg' },
          { l: 'War day', v: '12', s: 'escalating' },
        ].map((d, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.l}</div>
            <div style={{ color: C.accent, fontSize: 20, fontWeight: 700, marginTop: 4 }}>{d.v}</div>
            <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{d.s}</div>
          </div>
        ))}
      </div>
      <div style={{ color: C.text, fontSize: 14, lineHeight: 1.8 }}>
        <p style={{ marginBottom: 12 }}>
          The IEA's record 400M barrel release — more than double the 2022 Ukraine response — failed to hold prices down.
          Macquarie: it equals ~4 days of global production. Brent bounced from $90 back above $100 within hours.
          This validates the simulator's model: reserve releases dampen by $5-12/bbl but fade fast when the physical disruption continues.
        </p>
        <p style={{ marginBottom: 12 }}>
          <strong style={{ color: C.red }}>Escalation signal:</strong> Iran is intensifying, not winding down. The "Swift Resolution" probability has dropped.
          Both sides are expanding targets to infrastructure (refineries, desalination, shipping).
        </p>
        <p>
          <strong style={{ color: C.accent }}>Revised probabilities:</strong> Swift 15% (↓), Extended 35-40%, Prolonged 30% (↑), Catastrophic 15-20% (↑). The tail is fattening.
        </p>
      </div>
    </div>
  );
}
