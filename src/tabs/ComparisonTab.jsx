import { useState } from 'react';
import { C } from '../theme';
import { Badge } from '../components/ui';

const compData = [
  {
    cat: 'Flights', icon: '✈️',
    s70: { oilShare: '30-40% of cost', hedging: 'None', speed: '6-12mo', result: '+40-60%/18mo' },
    s26: { oilShare: '25-35%', hedging: 'Majors 6-18mo; LCCs exposed', speed: 'Surcharges 2-4wk', result: 'Immediate surcharges' },
    verdict: 'Airlines pass costs faster but are margin-thin. LCCs hit within days. Bernstein already cut European airline targets.',
  },
  {
    cat: 'Food', icon: '🛒',
    s70: { oilShare: 'Moderate, local chains', hedging: 'None', speed: 'Slow, price controls', result: '+30-50%/2yr' },
    s26: { oilShare: 'High, globalized', hedging: 'Grain futures only', speed: 'Dynamic pricing', result: 'Visible 4-8wk' },
    verdict: 'Food is MORE vulnerable now. Oil touches the chain 4-5×. 1/3 of fertilizer transits Hormuz. 400K tons of rice stuck at Indian ports.',
  },
  {
    cat: 'Services/CPI', icon: '🏢',
    s70: { oilShare: 'Lower', hedging: 'N/A', speed: 'Spiral 12-18mo', result: 'CPI 3→12%' },
    s26: { oilShare: 'High indirect', hedging: 'Some hedged', speed: 'Stickier wages', result: 'CPI +2-4% in 6mo' },
    verdict: 'Wage-price spiral is the wildcard. Mechanical in \'70s (unions), psychological now. CBs crash demand faster but may overshoot.',
  },
];

export default function ComparisonTab() {
  const [exp, setExp] = useState(null);
  return (
    <div>
      <div style={{ color: C.textDim, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
        How fast do oil shocks hit consumers: 1970s vs 2026?
      </div>
      {compData.map((item, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
          <div onClick={() => setExp(exp === i ? null : i)} style={{
            padding: '16px 20px', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <span style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>{item.cat}</span>
            </div>
            <span style={{ color: C.textMuted, fontSize: 20, transform: exp === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
          </div>
          {exp === i && (
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[['1973-74', item.s70, C.textMuted], ['2026', item.s26, C.accent]].map(([era, data, col], j) => (
                  <div key={j}>
                    <Badge color={col}>{era}</Badge>
                    <div style={{ marginTop: 10 }}>
                      {Object.entries(data).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 8 }}>
                          <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase' }}>{k.replace(/([A-Z])/g, ' $1')}</div>
                          <div style={{ color: j === 0 ? C.textDim : C.text, fontSize: 13 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.accent + '11', border: `1px solid ${C.accent}33`, borderRadius: 6, padding: 14 }}>
                <div style={{ color: C.accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Key Difference</div>
                <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>{item.verdict}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
