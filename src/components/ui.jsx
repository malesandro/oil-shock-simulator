import { C } from '../theme';
import { computePercentiles } from '../engine/simulation';

export function Badge({ children, color = C.accent }) {
  return (
    <span style={{
      background: color + '22', color, padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, unit = '', color = C.accent, note = '', hint = '', modified = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ color: C.textDim, fontSize: 12 }}>
          {label}
          {modified && <span style={{ color: C.accent, fontSize: 10, marginLeft: 6 }}>· modified</span>}
        </span>
        <span style={{ color, fontSize: 14, fontWeight: 700 }}>
          {Number.isInteger(step) ? value : value.toFixed(1)}{unit}
          {note && <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 10, marginLeft: 4 }}>{note}</span>}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color, height: 6, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted, marginTop: 2 }}>
        <span>{min}{unit}</span>
        {hint && <span style={{ color: C.textDim, fontStyle: 'italic' }}>{hint}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function Toggle({ label, value, onChange, hint = '', emphasis = false, modified = false }) {
  const size = emphasis ? { w: 44, h: 24, knob: 20, knobTop: 2, on: 22, off: 2, radius: 12 }
                        : { w: 36, h: 20, knob: 16, knobTop: 2, on: 18, off: 2, radius: 10 };
  return (
    <div onClick={() => onChange(!value)} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: emphasis ? '10px 12px' : '8px 0',
      background: emphasis ? (value ? C.accent + '11' : C.bg) : 'transparent',
      border: emphasis ? `1px solid ${value ? C.accent + '44' : C.border}` : 'none',
      borderRadius: emphasis ? 6 : 0,
      cursor: 'pointer', marginBottom: 6,
    }}>
      <div>
        <div style={{ color: emphasis ? C.text : C.textDim, fontSize: emphasis ? 13 : 12, fontWeight: emphasis ? 600 : 400 }}>
          {label}
          {modified && <span style={{ color: C.accent, fontSize: 10, marginLeft: 6, fontWeight: 400 }}>· modified</span>}
        </div>
        {hint && <div style={{ color: C.textMuted, fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{
        width: size.w, height: size.h, borderRadius: size.radius,
        background: value ? C.accent : C.border,
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <div style={{
          width: size.knob, height: size.knob, borderRadius: size.knob / 2, background: '#fff',
          position: 'absolute', top: size.knobTop, left: value ? size.on : size.off, transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

export function DistChart({ runs, monthIndex, unit = '%', color = C.accent, height = 50 }) {
  const stats = computePercentiles(runs, monthIndex);
  const vals = runs.map((r) => r[monthIndex]);
  const mn = Math.min(...vals), mx = Math.max(...vals), range = mx - mn || 1;
  const bk = 20;
  const hist = new Array(bk).fill(0);
  vals.forEach((v) => { hist[Math.min(bk - 1, Math.floor(((v - mn) / range) * bk))]++; });
  const mc = Math.max(...hist);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, marginBottom: 4 }}>
        {hist.map((c, i) => {
          const mid = mn + (i + 0.5) * (range / bk);
          const iq = mid >= stats.p25 && mid <= stats.p75;
          return (
            <div key={i} style={{
              flex: 1, height: `${(c / mc) * 100}%`,
              background: iq ? color : color + '44',
              borderRadius: '2px 2px 0 0', minHeight: c > 0 ? 2 : 0,
            }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted }}>
        <span>{mn.toFixed(1)}{unit}</span>
        <span style={{ color, fontWeight: 600 }}>median: {stats.median.toFixed(1)}{unit}</span>
        <span>{mx.toFixed(1)}{unit}</span>
      </div>
      <div style={{ fontSize: 10, color: C.textMuted, textAlign: 'center', marginTop: 2 }}>
        50% CI: {stats.p25.toFixed(1)}–{stats.p75.toFixed(1)}{unit} · 80% CI: {stats.p10.toFixed(1)}–{stats.p90.toFixed(1)}{unit}
      </div>
    </div>
  );
}

export function Sparkline({ runs, baselineRuns = null, baselineLabel = '', months = 18, unit = '%', color = C.accent, label = '', height = 60, conflictEnd = 18 }) {
  const meds = [], p10s = [], p90s = [];
  for (let m = 0; m < months; m++) {
    const s = computePercentiles(runs, m);
    meds.push(s.median); p10s.push(s.p10); p90s.push(s.p90);
  }
  const baseMeds = baselineRuns
    ? Array.from({ length: months }, (_, m) => computePercentiles(baselineRuns, m).median)
    : null;

  const peak = Math.max(...meds);
  const peakMo = meds.indexOf(peak);
  const all = [...p10s, ...p90s, ...(baseMeds || [])];
  const mn = Math.min(...all), mx = Math.max(...all), range = mx - mn || 1;
  const w = 300, h = height;
  const px = (i) => (i / (months - 1)) * w;
  const py = (v) => h - ((v - mn) / range) * h;

  const band = `M${px(0)},${py(p90s[0])} ` +
    p90s.map((v, i) => `L${px(i)},${py(v)}`).join(' ') +
    ` L${px(months - 1)},${py(p10s[months - 1])} ` +
    [...p10s].reverse().map((v, i) => `L${px(months - 1 - i)},${py(v)}`).join(' ') + ' Z';
  const line = `M${px(0)},${py(meds[0])} ` + meds.map((v, i) => `L${px(i)},${py(v)}`).join(' ');
  const baseLine = baseMeds && `M${px(0)},${py(baseMeds[0])} ` + baseMeds.map((v, i) => `L${px(i)},${py(v)}`).join(' ');
  const ceX = px(Math.min(conflictEnd - 1, months - 1));

  return (
    <div>
      {label && <div style={{ color: C.textDim, fontSize: 11, marginBottom: 4 }}>{label}</div>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', maxHeight: height }}>
        {conflictEnd < months && (
          <line x1={ceX} y1={0} x2={ceX} y2={h} stroke={C.red + '44'} strokeWidth="1" strokeDasharray="4,3" />
        )}
        <path d={band} fill={color + '22'} />
        {baseLine && <path d={baseLine} fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeDasharray="3,3" opacity="0.7" />}
        <path d={line} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={px(peakMo)} cy={py(peak)} r="3" fill={color} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.textMuted }}>
        <span>Mo 1</span>
        <span style={{ color, fontWeight: 600 }}>Peak: {peak.toFixed(1)}{unit} (month {peakMo + 1})</span>
        <span>Mo {months}</span>
      </div>
      {baseMeds && baselineLabel && (
        <div style={{ fontSize: 9, color: C.textMuted, textAlign: 'center', marginTop: 2 }}>
          <span style={{ display: 'inline-block', width: 12, borderTop: `1.5px dashed ${C.textMuted}`, verticalAlign: 'middle', marginRight: 4 }} />
          {baselineLabel} baseline
        </div>
      )}
    </div>
  );
}
