import { useState, useEffect } from 'react';
import { C } from '../theme';
import { fetchOilPrice } from '../data/oilPrice';

const THRESHOLDS = [
  {
    min: 140, label: 'EXTREME', color: '#dc2626',
    headline: 'Oil crisis at historic levels',
    analysis: 'Brent above $140 puts this beyond the 2008 peak ($145) and into uncharted territory. At these levels, demand destruction is accelerating — airlines canceling routes, factories shutting down, consumer spending collapsing. This is the scenario where government intervention (price caps, rationing, emergency subsidies) becomes likely. The Strait of Hormuz disruption has overwhelmed all mitigation attempts including strategic reserve releases.',
    implications: [
      'Expect emergency government energy packages across EU within weeks',
      'ECB almost certainly raising rates despite recession risk',
      'Food inflation will compound over the next 3-6 months via fertilizer channel',
      'Airline bankruptcies likely among LCCs within 2-3 months',
      'EU gas storage refill for winter 2026-27 is now critical risk',
    ],
    comparison: 'This exceeds the 1979 Iranian Revolution shock in real terms. The closest parallel is a combination of 1973 and 1979 happening simultaneously.',
  },
  {
    min: 120, label: 'SEVERE', color: '#ef4444',
    headline: 'Severe supply disruption — reserve releases failing to contain prices',
    analysis: 'Brent above $120 means the market has concluded that strategic reserve releases and diplomatic efforts are insufficient. The Hormuz closure is being priced as a sustained disruption, not a temporary spike. At this level, the 400M barrel IEA release (equivalent to ~4 days of global production) provides only brief relief before prices reassert. Iran\'s attacks on shipping and Gulf infrastructure are driving a structural risk premium.',
    implications: [
      'Fuel surcharges already hitting consumers — expect €0.30-0.50/L increase at the pump',
      'Food prices beginning to rise as transport costs feed through (4-8 week lag)',
      'ECB likely pausing rate cuts; rate hike discussions beginning',
      'European industrial sectors (chemicals, autos) facing margin pressure',
      'Russian energy leverage over EU increasing significantly',
    ],
    comparison: 'Comparable to early weeks of the 2022 Ukraine shock, but the physical disruption is 17× larger per Goldman Sachs. The key difference: in 2022, Russian oil found Asian buyers. Hormuz-blocked oil has nowhere to go.',
  },
  {
    min: 100, label: 'ELEVATED', color: '#f59e0b',
    headline: 'Hormuz disruption sustaining triple-digit oil',
    analysis: 'Brent above $100 reflects a significant geopolitical risk premium from the Iran conflict. The Strait of Hormuz remains effectively closed or severely disrupted, and market participants are pricing in weeks to months of elevated supply risk. Strategic reserve releases and diplomatic signals are providing a floor against further spikes, but the physical disruption to 20% of global oil transit is keeping prices elevated.',
    implications: [
      'Fuel prices rising but manageable — most consumers absorb a 10-20% increase',
      'Airlines adding fuel surcharges; long-haul routes most affected',
      'Food price increases not yet visible to consumers (1-3 month lag)',
      'EU gas market under pressure — TTF likely elevated above €50/MWh',
      'Central banks in watch-and-wait mode, delaying planned rate cuts',
    ],
    comparison: 'This is where oil sat for much of early 2022 after the Ukraine invasion. Uncomfortable but not crisis-level for most economies. The question is whether it stays here or escalates.',
  },
  {
    min: 85, label: 'TENSION', color: '#3b82f6',
    headline: 'Geopolitical risk premium holding',
    analysis: 'Brent in the $85-100 range suggests markets believe the conflict will resolve within weeks to months. A risk premium is priced in, but the market is not yet pricing sustained Hormuz closure. Reserve releases and diplomatic efforts may be providing confidence. This level is elevated relative to pre-crisis (~$60-70) but within the range the global economy can absorb without severe disruption.',
    implications: [
      'Consumer impact limited — pump prices up but not dramatically',
      'Airlines absorbing costs via hedging; minimal fare increases yet',
      'EU energy security not immediately threatened at this level',
      'Central bank rate paths largely unchanged',
      'Market watching for escalation signals or ceasefire progress',
    ],
    comparison: 'Similar to the tension premium during US-Iran negotiations in early 2026 before the war, or during the 2019 Aramco drone attacks — elevated but not crisis.',
  },
  {
    min: 0, label: 'NORMALIZING', color: '#22c55e',
    headline: 'Markets pricing in resolution',
    analysis: 'Brent below $85 suggests the market believes the worst of the crisis is over. Either Hormuz is reopening, a diplomatic resolution is in sight, or alternative supply routes are proving effective. Pre-crisis oil was trading around $60-70 in an oversupplied market, so prices in this range still carry a residual risk premium but are trending toward normalization.',
    implications: [
      'Consumer relief — fuel prices stabilizing or declining',
      'Food price increases from the spike period still working through (lagging indicator)',
      'Central banks may resume planned rate cuts',
      'EU gas storage refill becomes more feasible',
      'Residual risk premium may persist for months even after resolution',
    ],
    comparison: 'This is the post-crisis normalization pattern seen after the 1990 Gulf War (oil spiked then crashed within 3 months) and the 2019 Aramco attacks (normalized within weeks).',
  },
];

const STATIC_DATA = {
  ieaRelease: '400M bbl',
  ieaNote: 'largest ever',
  euGasStorage: '~27%',
  euGasNote: 'vs 41% avg',
};

const WAR_START = new Date('2026-02-28');
const PRE_WAR_PRICE = 65;

function getThreshold(price) {
  return THRESHOLDS.find((t) => price >= t.min) || THRESHOLDS[THRESHOLDS.length - 1];
}

function getHormuzStatus(price) {
  if (price > 110) return { v: 'Closed', s: 'ships still attacked', color: C.red };
  if (price > 95) return { v: 'Disrupted', s: 'transit under threat', color: C.red };
  return { v: 'Reopening?', s: 'signals improving', color: '#3b82f6' };
}

export default function SituationTab() {
  const [priceInfo, setPriceInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOilPrice().then((info) => {
      setPriceInfo(info);
      setLoading(false);
    });
  }, []);

  const price = priceInfo?.price || 100;
  const t = getThreshold(price);
  const changeDollar = (price - PRE_WAR_PRICE).toFixed(0);
  const changePct = ((price - PRE_WAR_PRICE) / PRE_WAR_PRICE * 100).toFixed(0);
  const warDays = Math.floor((Date.now() - WAR_START.getTime()) / 86400000);
  const hormuz = getHormuzStatus(price);

  return (
    <div>
      {/* Live price header */}
      <div style={{ background: t.color + '15', border: `1px solid ${t.color}33`, borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: t.color, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              {t.label} · BRENT CRUDE
            </div>
            <div style={{ color: C.text, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
              ${price.toFixed(2)}
              <span style={{ fontSize: 16, color: C.textDim, fontWeight: 400, marginLeft: 8 }}>/bbl</span>
            </div>
            <div style={{ color: t.color, fontSize: 13, marginTop: 4 }}>
              +{changePct}% from pre-war (~${PRE_WAR_PRICE})
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase' }}>Source</div>
            <div style={{ color: C.textDim, fontSize: 12 }}>{priceInfo?.source || 'loading...'}</div>
            {priceInfo?.source === 'fallback' && (
              <div style={{ color: C.textMuted, fontSize: 10, marginTop: 2 }}>
                Add VITE_EIA_API_KEY for live data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic headline */}
      <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
        {t.headline}
      </h2>

      {/* Analysis */}
      <div style={{ color: C.text, fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
        {t.analysis}
      </div>

      {/* Implications */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: t.color, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          What this price level means
        </div>
        {t.implications.map((imp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <span style={{ color: t.color, fontSize: 12, marginTop: 2 }}>→</span>
            <span style={{ color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>{imp}</span>
          </div>
        ))}
      </div>

      {/* Historical comparison */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Historical parallel
        </div>
        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>
          {t.comparison}
        </div>
      </div>

      {/* Key numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'Brent today', v: `$${price.toFixed(0)}`, s: priceInfo?.source !== 'fallback' ? `live · ${priceInfo?.source}` : 'estimate', color: t.color },
          { l: 'Change', v: `+$${changeDollar}`, s: `+${changePct}% from $${PRE_WAR_PRICE}`, color: C.red },
          { l: 'War day', v: `${warDays}`, s: 'since Feb 28', color: C.accent },
          { l: 'Hormuz', v: hormuz.v, s: hormuz.s, color: hormuz.color },
          { l: 'IEA release', v: STATIC_DATA.ieaRelease, s: STATIC_DATA.ieaNote, color: C.blue },
          { l: 'EU gas storage', v: STATIC_DATA.euGasStorage, s: STATIC_DATA.euGasNote, color: C.green },
        ].map((d, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.l}</div>
            <div style={{ color: d.color, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{d.v}</div>
            <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{d.s}</div>
          </div>
        ))}
      </div>

      {/* Probability update */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: C.accent, fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
          Scenario probabilities (based on current price level)
        </div>
        {[
          { n: 'Swift Resolution', p: price < 85 ? '35-45%' : price < 100 ? '20-25%' : price < 120 ? '15-20%' : '10-15%', c: C.green },
          { n: 'Extended Disruption', p: '35-40%', c: C.accent },
          { n: 'Prolonged War', p: price > 120 ? '30-35%' : price > 100 ? '25-30%' : '20-25%', c: '#f97316' },
          { n: 'Catastrophic', p: price > 140 ? '20-25%' : price > 120 ? '15-20%' : '10-15%', c: C.red },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? `1px solid ${C.border}22` : 'none' }}>
            <span style={{ color: s.c, fontSize: 13, fontWeight: 600 }}>{s.n}</span>
            <span style={{ color: s.c, fontSize: 13, fontWeight: 700 }}>{s.p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
