import { useState, useEffect } from 'react';
import { C } from './theme';
import { PRESETS } from './engine/simulation';
import { fetchOilPrice } from './data/oilPrice';
import SimulatorTab from './tabs/SimulatorTab';
import HouseholdTab from './tabs/HouseholdTab';
import BacktestTab from './tabs/BacktestTab';
import SituationTab from './tabs/SituationTab';
import ComparisonTab from './tabs/ComparisonTab';
import MethodTab from './tabs/MethodTab';

const TABS = ['simulator', 'household', 'backtest', 'comparison', 'situation', 'method'];
const TAB_LABELS = {
  simulator: 'Simulator',
  household: 'DKK Impact',
  backtest: 'Backtest',
  comparison: '1970s vs 2026',
  situation: 'Situation',
  method: 'Methodology',
};

export default function App() {
  const [tab, setTab] = useState('simulator');
  const [params, setParams] = useState(PRESETS.extended);
  const [priceInfo, setPriceInfo] = useState(null);

  // Fetch live oil price on mount
  useEffect(() => {
    fetchOilPrice().then((info) => {
      setPriceInfo(info);
      // Update starting oil price if we got a live feed
      if (info.source !== 'fallback') {
        setParams((p) => ({ ...p, oilPrice: Math.round(info.price) }));
      }
    });
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: C.text }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: C.red, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            CRISIS ANALYSIS · MARCH 2026
          </div>
          <h1 style={{ color: C.text, fontSize: 24, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.2 }}>
            Oil Shock Simulator
          </h1>
          <div style={{ color: C.textDim, fontSize: 13 }}>
            Monte Carlo simulation modeling the 2026 Iran war impact on energy, food, flights & household costs
          </div>
          {priceInfo && priceInfo.source !== 'fallback' && (
            <div style={{ color: C.green, fontSize: 11, marginTop: 4 }}>
              Live Brent: ${priceInfo.price}/bbl ({priceInfo.source})
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? C.accent + '22' : 'transparent',
                color: tab === t ? C.accent : C.textMuted,
                border: `1px solid ${tab === t ? C.accent + '44' : C.border}`,
                borderRadius: 6, padding: '8px 14px', fontSize: 13,
                fontWeight: tab === t ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'simulator' && <SimulatorTab params={params} setParams={setParams} />}
        {tab === 'household' && <HouseholdTab params={params} />}
        {tab === 'backtest' && <BacktestTab />}
        {tab === 'comparison' && <ComparisonTab />}
        {tab === 'situation' && <SituationTab />}
        {tab === 'method' && <MethodTab />}

        {/* Footer */}
        <div style={{ marginTop: 32, padding: '16px 0', borderTop: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, lineHeight: 1.6 }}>
          <strong>Sources:</strong> Guardian, Fortune/Yergin, Reuters, CNN, Al Jazeera, CNBC, NBC News, Euronews,
          Bruegel, Chatham House, Morningstar, EY, Goldman Sachs, Rystad Energy, Capital Economics, Deutsche Bank.
          800-run Monte Carlo calibrated on analyst forecasts + historical pass-through data. Not financial advice.
          <br /><br />
          Built by <a href="https://github.com/malesandro" style={{ color: C.accent, textDecoration: 'none' }}>MAAD</a> · ·
          Engine: Claude AI · March 2026
        </div>
      </div>
    </div>
  );
}
