import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import geo from './data/geo-meta.json';
import { generateAll, generateOffers, makeSpecs } from './data/generate.js';
import { computeYear, rollup } from './lib/methodology.js';
import { YEARS } from './data/catalog.js';
import { makeT } from './i18n.js';
import { colorAttr, colorRisk } from './lib/format.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const BASE = generateAll();
const BASE_OFFERS = generateOffers();
export const DISTRICTS = geo.districts;
export const REGIONS = geo.regions;
export const DMAP = Object.fromEntries(DISTRICTS.map((d) => [d.id, d]));
export const RMAP = Object.fromEntries(REGIONS.map((r) => [r.code, r]));
const IDS = DISTRICTS.map((d) => d.id);

function load(key, def) {
  try { const v = localStorage.getItem('hip:' + key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, v) { try { localStorage.setItem('hip:' + key, JSON.stringify(v)); } catch { /* storage mavjud emas */ } }
function usePersist(key, def) {
  const [v, setV] = useState(() => load(key, def));
  useEffect(() => save(key, v), [key, v]);
  return [v, setV];
}

// Hash-router: #/path/arg
export function useRoute() {
  const parse = () => { const h = location.hash.replace(/^#\/?/, ''); const [path, ...rest] = h.split('/'); return { path: path || '', args: rest.map(decodeURIComponent) }; };
  const [r, setR] = useState(parse);
  useEffect(() => { const f = () => { setR(parse()); window.scrollTo(0, 0); }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []);
  return r;
}
export const go = (p) => { location.hash = '#/' + p; };

export function AppProvider({ children }) {
  const [lang, setLang] = usePersist('lang', 'uz');
  const [sector, setSector] = usePersist('sector', 'general');
  const [compare, setCompare] = usePersist('compare', []);
  const [overrides, setOverrides] = usePersist('overrides', {}); // { id: { ind: {value, date} } }
  const [extraOffers, setExtraOffers] = usePersist('offers', []);
  const [queue, setQueue] = usePersist('queue', []);
  const [log, setLog] = usePersist('log', []);
  const [specOverrides, setSpecOverrides] = usePersist('specOverrides', {}); // { id: { list: [specId], date, by } }

  // Tasdiqlangan admin o'zgarishlari asosiy ma'lumot ustiga qo'yiladi
  const recs = useMemo(() => {
    const out = {};
    for (const id of IDS) {
      const o = overrides[id], so = specOverrides[id];
      if (!o && !so) { out[id] = BASE[id]; continue; }
      const b = BASE[id];
      const v = { ...b.v }, s = { ...b.s }, upd = { ...b.upd };
      for (const [k, x] of Object.entries(o || {})) { v[k] = x.value; s[k] = [...b.s[k].slice(0, 4), x.value]; upd[k] = x.date; }
      const lists = so ? { ...b.lists, specs: makeSpecs(DMAP[id], so.list, v.work), specsUpdated: so.date } : b.lists;
      out[id] = { ...b, v, s, upd, lists };
    }
    return out;
  }, [overrides, specOverrides]);

  const results = useMemo(() => computeYear(IDS, recs, sector), [recs, sector]);
  const prevResults = useMemo(() => computeYear(IDS, recs, sector, YEARS.length - 2), [recs, sector]);

  const ranks = useMemo(() => {
    const sorted = [...IDS].sort((a, b) => results[b].attr - results[a].attr);
    const rep = Object.fromEntries(sorted.map((id, i) => [id, i + 1]));
    const reg = {};
    for (const r of REGIONS) sorted.filter((id) => DMAP[id].region === r.code).forEach((id, i) => { reg[id] = i + 1; });
    const prevSorted = [...IDS].sort((a, b) => prevResults[b].attr - prevResults[a].attr);
    const prev = Object.fromEntries(prevSorted.map((id, i) => [id, i + 1]));
    return { sorted, rep, reg, prev };
  }, [results, prevResults]);

  const regionAgg = useMemo(() => {
    const o = {};
    for (const r of REGIONS) o[r.code] = rollup(IDS.filter((id) => DMAP[id].region === r.code), recs, results);
    o.all = rollup(IDS, recs, results);
    return o;
  }, [recs, results]);

  // Rang shkalasi joriy taqsimotga moslanadi (aks holda ranglar farqlanmaydi)
  const scales = useMemo(() => {
    const a = IDS.map((id) => results[id].attr), r = IDS.map((id) => results[id].risk);
    const mk = (xs, fn) => { const lo = Math.min(...xs), hi = Math.max(...xs); return { lo, hi, color: (v) => fn(((v - lo) / (hi - lo || 1)) * 100) }; };
    return { attr: mk(a, colorAttr), risk: mk(r, colorRisk) };
  }, [results]);

  // Ixtisoslik → shu soha rivojlangan tumanlar (hajm bo'yicha tartiblangan)
  const specIndex = useMemo(() => {
    const o = {};
    for (const id of IDS) for (const x of recs[id].lists.specs) (o[x.id] ||= []).push({ ...x, spec: x.id, id });
    for (const k of Object.keys(o)) o[k].sort((a, b) => b.volume - a.volume);
    return o;
  }, [recs]);

  const offers = useMemo(() => [...extraOffers.filter((o) => o.status === 'approved'), ...BASE_OFFERS], [extraOffers]);

  const toggleCompare = useCallback((id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 5 ? c : [...c, id])), [setCompare]);
  const t = useMemo(() => makeT(lang), [lang]);

  const value = {
    lang, setLang, t, sector, setSector, compare, setCompare, toggleCompare,
    recs, results, prevResults, ranks, scales, specIndex, regionAgg, offers, extraOffers, setExtraOffers,
    overrides, setOverrides, specOverrides, setSpecOverrides, queue, setQueue, log, setLog, base: BASE,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const dname = (d, lang) => (d ? d[lang] || d.uz : '');
