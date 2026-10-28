import { useMemo, useState } from 'react';
import { useApp, DISTRICTS, REGIONS, DMAP, dname } from '../store.jsx';
import { riskLevel } from '../lib/methodology.js';
import { riskColor, colorAttr, num } from '../lib/format.js';
import { SECTORS, YEARS } from '../data/catalog.js';

export function ScoreRing({ value, size = 92, kind = 'attr', label }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  const color = kind === 'risk' ? riskColor[riskLevel(value)] : colorAttr(Math.max(45, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth="7" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="7" fill="none" strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-v" title={label}><b>{Math.round(value)}</b>{label && size >= 84 && <small>{label}</small>}</div>
    </div>
  );
}

export function RiskBadge({ value }) {
  const { t } = useApp();
  const l = riskLevel(value);
  return <span className={`badge risk-${l}`}>{t('risk')}: {t(l)} · {Math.round(value)}</span>;
}

export function SampleBadge() {
  const { t } = useApp();
  return <span className="badge sample" title={t('sampleNote')}>◔ {t('sample')}</span>;
}

export function Sparkline({ data, w = 110, h = 30, color = 'var(--brand)', refLine }) {
  const all = refLine ? [...data, ...refLine] : data;
  const min = Math.min(...all), max = Math.max(...all), span = max - min || 1;
  const pts = (arr) => arr.map((v, i) => `${(i / (arr.length - 1)) * (w - 4) + 2},${h - 3 - ((v - min) / span) * (h - 6)}`).join(' ');
  return (
    <svg width={w} height={h} className="spark">
      {refLine && <polyline points={pts(refLine)} fill="none" stroke="var(--muted)" strokeDasharray="3 3" strokeWidth="1.2" />}
      <polyline points={pts(data)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={w - 2} cy={h - 3 - ((data[data.length - 1] - min) / span) * (h - 6)} r="2.6" fill={color} />
    </svg>
  );
}

export function LineChart({ series, h = 220, fmt = (x) => num(x), labels = YEARS }) {
  const [hover, setHover] = useState(null);
  const W = 640, pad = { l: 56, r: 16, t: 14, b: 28 };
  const all = series.flatMap((s) => s.data);
  let min = Math.min(...all), max = Math.max(...all);
  const span = max - min || 1; min -= span * 0.08; max += span * 0.08;
  const x = (i) => pad.l + (i / (labels.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${h}`} className="chart" onMouseLeave={() => setHover(null)}>
        {ticks.map((tv, i) => (
          <g key={i}><line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--line)" />
            <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" className="axis">{fmt(tv)}</text></g>
        ))}
        {labels.map((l, i) => <text key={l} x={x(i)} y={h - 8} textAnchor="middle" className="axis">{l}</text>)}
        {series.map((s, k) => (
          <g key={k}>
            <polyline points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={s.dash ? 1.6 : 2.4} strokeDasharray={s.dash ? '5 4' : ''} />
            {!s.dash && s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill={s.color} />)}
          </g>
        ))}
        {labels.map((_, i) => <rect key={i} x={x(i) - 30} y={0} width={60} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />)}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke="var(--muted)" strokeDasharray="2 3" />}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <b>{labels[hover]}</b>
          {series.map((s, k) => <div key={k}><i style={{ background: s.color }} />{s.name}: <b>{fmt(s.data[hover])}</b></div>)}
        </div>
      )}
      <div className="legend">{series.map((s, k) => <span key={k}><i style={{ background: s.color, opacity: s.dash ? 0.6 : 1 }} />{s.name}</span>)}</div>
    </div>
  );
}

export function Radar({ axes, series, size = 300 }) {
  const c = size / 2, R = size / 2 - 46;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2; return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)]; };
  return (
    <svg viewBox={`-60 -6 ${size + 120} ${size + 12}`} className="radar">
      {[25, 50, 75, 100].map((l) => <polygon key={l} points={axes.map((_, i) => pt(i, l).join(',')).join(' ')} fill="none" stroke="var(--line)" />)}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 100); const [lx, ly] = pt(i, 122);
        return <g key={i}><line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" /><text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="axis">{a}</text></g>;
      })}
      {series.map((s, k) => <polygon key={k} points={s.data.map((v, i) => pt(i, v).join(',')).join(' ')} fill={s.color} fillOpacity="0.14" stroke={s.color} strokeWidth="2" />)}
    </svg>
  );
}

export function HBar({ value, max = 100, color = 'var(--brand)', mark }) {
  return (
    <div className="hbar">
      <div style={{ width: `${Math.max(2, (value / max) * 100)}%`, background: color }} />
      {mark != null && <span className="hbar-mark" style={{ left: `${(mark / max) * 100}%` }} />}
    </div>
  );
}

export function SectorSelect({ compact }) {
  const { t, sector, setSector } = useApp();
  return (
    <label className={compact ? 'field compact' : 'field'}>
      {!compact && <span>{t('sector')}</span>}
      <select value={sector} onChange={(e) => setSector(e.target.value)}>
        {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.icon} {t.n(s)}</option>)}
      </select>
    </label>
  );
}

export function DistrictSearch({ onPick, placeholder, exclude = [] }) {
  const { t, lang } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return DISTRICTS.filter((d) => !exclude.includes(d.id) && [d.uz, d.ru, d.en, d.id].some((n) => n.toLowerCase().includes(s))).slice(0, 8);
  }, [q, exclude]);
  return (
    <div className="dsearch">
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || t('search')} />
      {open && res.length > 0 && (
        <div className="dsearch-list">
          {res.map((d) => (
            <button key={d.id} onMouseDown={() => { onPick(d.id); setQ(''); setOpen(false); }}>
              <b>{dname(d, lang)}</b><small>{dname(REGIONS.find((r) => r.code === d.region), lang)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DistrictSelect({ value, onChange }) {
  const { lang, t } = useApp();
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{t('chooseDistrict')}</option>
      {REGIONS.map((r) => (
        <optgroup key={r.code} label={dname(r, lang)}>
          {DISTRICTS.filter((d) => d.region === r.code).sort((a, b) => a.uz.localeCompare(b.uz)).map((d) => <option key={d.id} value={d.id}>{dname(d, lang)}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export const PALETTE = ['#0f766e', '#2563eb', '#d97706', '#9333ea', '#dc2626'];
export const regionOf = (id) => REGIONS.find((r) => r.code === DMAP[id].region);
