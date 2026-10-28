import { IND, BRANCHES, CROPS } from '../data/catalog.js';

const LOC = { uz: 'uz-UZ', ru: 'ru-RU', en: 'en-US' };
export function num(x, d = 0, lang = 'uz') {
  if (x == null || !Number.isFinite(x)) return '—';
  return new Intl.NumberFormat(LOC[lang] || 'en-US', { maximumFractionDigits: d, minimumFractionDigits: d }).format(x).replace(/[\u00a0\u202f]/g, ' ');
}

export function fmtInd(id, x, t) {
  const i = IND[id];
  if (i.fmt === 'bool') return x ? t('yes') : t('no');
  if (i.fmt === 'pct') return num(x, 1, t.lang);
  if (i.fmt === 'score') return num(x, 1, t.lang);
  if (i.fmt === 'dec1') return num(x, 1, t.lang);
  return num(x, x < 10 && !Number.isInteger(x) ? 1 : 0, t.lang);
}

export const unit = (id, t) => t.n(IND[id].unit);
export const branch = (b, t) => t.n(BRANCHES[b]);
export const crop = (c, t) => t.n(CROPS[c]);

export function fmtDate(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

// Indeks rang shkalasi (0–100): past → yuqori
const STOPS_ATTR = ['#f1f5f9', '#c7e8e2', '#86cfc1', '#3fae9b', '#1a8a78', '#0b6457'];
const STOPS_RISK = ['#fff7ed', '#fed7aa', '#fdba74', '#f97316', '#c2410c', '#7c2d12'];
const STOPS_VAL = ['#eef2ff', '#c7d2fe', '#a5b4fc', '#6366f1', '#4338ca', '#312e81'];
function lerp(stops, t) {
  const p = Math.max(0, Math.min(0.9999, t)) * (stops.length - 1);
  const i = Math.floor(p), f = p - i;
  const a = parseInt(stops[i].slice(1), 16), b = parseInt(stops[i + 1].slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
export const colorAttr = (s) => lerp(STOPS_ATTR, s / 100);
export const colorRisk = (s) => lerp(STOPS_RISK, s / 100);
export const colorVal = (s) => lerp(STOPS_VAL, s / 100);
export const RAMPS = { attr: STOPS_ATTR, risk: STOPS_RISK, val: STOPS_VAL };

export const riskColor = { low: '#16a34a', mid: '#d97706', high: '#dc2626' };
