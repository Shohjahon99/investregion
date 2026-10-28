// Risk va jozibadorlik indeksi — konsepsiyadagi metodika:
// 1) har bir ko'rsatkich barcha tumanlar orasida 0–100 ga normallashtiriladi (5/95 persentilda kesiladi),
//    pasti yaxshi bo'lsa 100 − S olinadi;
// 2) guruh bali = guruh ichidagi ballarning o'rtachasi;
// 3) indeks = Σ w_g · S_g, Σ w_g = 1 (vaznlar investor tanlagan sohaga bog'liq).
// Modul alohida: metodika o'zgarsa faqat shu fayl yangilanadi.
import { INDICATORS, INDEX_GROUPS, SECTORS, YEARS, IND } from '../data/catalog.js';
import { TODAY } from '../data/generate.js';
import { SPEC } from '../data/specs.js';

export const METHOD_VERSION = '1.0 (2026-10)';
const SCORED = INDICATORS.filter((i) => i.idx && i.dir !== 0);

function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function normalizer(values, dir = 1) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const p5 = quantile(sorted, 0.05), p95 = quantile(sorted, 0.95);
  return (x) => {
    if (!Number.isFinite(x)) return null;
    const c = Math.min(p95, Math.max(p5, x));
    const s = p95 === p5 ? 50 : ((c - p5) / (p95 - p5)) * 100;
    return dir === -1 ? 100 - s : s;
  };
}

const mean = (a) => { const f = a.filter((x) => x != null); return f.length ? f.reduce((s, x) => s + x, 0) / f.length : null; };

// Ixtisoslik mosligi xom bali: investor sohasi tumanning ixtisoslashgan sohalaridan biriga
// to'g'ri kelsa (birinchi o'rindagisi kuchliroq) va shu sohada tajribali ishchi zaxirasi bo'lsa — yuqori
function specialRaw(rec, sector, exportS) {
  const specs = rec.lists.specs || [];
  const sez = rec.v.sez ? 1 : 0;
  if (!sector.match.length) {
    const heavy = specs.filter((x) => ['industry', 'mining'].includes(SPEC[x.id].cat)).length;
    return 35 * sez + 0.35 * exportS + 6 * specs.length + 8 * Math.min(2, heavy);
  }
  let m = 0, labor = 0;
  specs.forEach((x, i) => {
    const sp = SPEC[x.id];
    if (sp.sector !== sector.id && !sector.match.includes(sp.br)) return;
    const k = [1, 0.75, 0.55, 0.4][i];
    if (k > m) { m = k; labor = Math.min(1, x.reserve / 1500); }
  });
  const crops = sector.crops ? rec.lists.agri.filter((a) => sector.crops.includes(a.id)).length / 2 : 0;
  return 40 * m + 15 * labor + 15 * sez + 15 * Math.min(1, crops) + 0.15 * exportS;
}

// Bir yil kesimida barcha tumanlar uchun indekslarni hisoblaydi
export function computeYear(ids, recs, sectorId = 'general', yearIdx = YEARS.length - 1) {
  const sector = SECTORS.find((s) => s.id === sectorId) || SECTORS[0];
  const val = (rec, k) => (yearIdx === YEARS.length - 1 ? rec.v[k] : rec.s[k]?.[yearIdx]);
  const norms = {};
  for (const i of SCORED) norms[i.id] = normalizer(ids.map((id) => val(recs[id], i.id)), i.dir);
  const expN = normalizer(ids.map((id) => val(recs[id], 'export')), 1);

  // risk uchun qo'shimcha o'lchovlar
  const rentGrowth = (rec) => (rec.s.rent[4] / rec.s.rent[1]) ** (1 / 3) - 1;
  const wageGrowth = (rec) => (rec.s.wage[4] / rec.s.wage[1]) ** (1 / 3) - 1;
  const migShare = (rec) => val(rec, 'migr') / val(rec, 'pop');
  const nRent = normalizer(ids.map((id) => rentGrowth(recs[id])), 1);
  const nWage = normalizer(ids.map((id) => wageGrowth(recs[id])), 1);
  const nMig = normalizer(ids.map((id) => migShare(recs[id])), 1);
  const nChurn = normalizer(ids.map((id) => val(recs[id], 'churn')), 1);

  const specRaw = ids.map((id) => specialRaw(recs[id], sector, expN(val(recs[id], 'export'))));
  const nSpec = normalizer(specRaw, 1);

  const out = {};
  ids.forEach((id, k) => {
    const rec = recs[id];
    const ind = {};
    for (const i of SCORED) ind[i.id] = norms[i.id](val(rec, i.id));
    const g = {};
    for (const G of INDEX_GROUPS) g[G.id] = G.id === 'special' ? nSpec(specRaw[k]) : mean(SCORED.filter((i) => i.idx === G.id).map((i) => ind[i.id]));
    const risk = {
      market: 100 - g.market,
      cost: 0.6 * nRent(rentGrowth(rec)) + 0.4 * nWage(wageGrowth(rec)),
      human: 0.5 * nMig(migShare(rec)) + 0.25 * (100 - ind.edu) + 0.25 * (100 - ind.labor),
      infra: 100 - g.infra,
      business: nChurn(val(rec, 'churn')),
      special: 100 - g.special,
    };
    let A = 0, Rk = 0;
    for (const G of INDEX_GROUPS) { A += sector.w[G.id] * g[G.id]; Rk += sector.w[G.id] * risk[G.id]; }
    out[id] = { attr: A, risk: Rk, g, rg: risk, ind };
  });
  return out;
}

export const riskLevel = (r) => (r <= 33 ? 'low' : r <= 66 ? 'mid' : 'high');

// Bahoni eng ko'p pasaytirgan 3 ta omil
export function topFactors(res, sectorId, kind = 'attr') {
  const sector = SECTORS.find((s) => s.id === sectorId) || SECTORS[0];
  return INDEX_GROUPS.map((G) => {
    const loss = kind === 'attr' ? sector.w[G.id] * (100 - res.g[G.id]) : sector.w[G.id] * res.rg[G.id];
    const inds = SCORED.filter((i) => i.idx === G.id).map((i) => ({ id: i.id, s: res.ind[i.id] })).sort((a, b) => a.s - b.s);
    return { group: G.id, loss, score: kind === 'attr' ? res.g[G.id] : res.rg[G.id], worst: inds[0]?.id };
  }).sort((a, b) => b.loss - a.loss).slice(0, 3);
}

// Ishonchlilik: 2 yildan eski yoki ekspert bahosiga tayangan ko'rsatkichlar ulushi > 30%
export function reliability(rec) {
  const two = new Date(TODAY); two.setFullYear(two.getFullYear() - 2);
  let weak = 0, stale = 0, expert = 0;
  for (const i of INDICATORS) {
    const old = new Date(rec.upd[i.id]) < two;
    if (old) stale++;
    if (i.expert) expert++;
    if (old || i.expert) weak++;
  }
  const share = weak / INDICATORS.length;
  return { share, stale, expert, low: share > 0.3 };
}

// Ko'rsatkich eskirganmi (yangilanish davriyligidan kelib chiqib)
export function isStale(indId, date) {
  const lim = { m: 62, q: 190, y: 540, c: 1095 }[IND[indId].freq];
  return (TODAY - new Date(date)) / 864e5 > lim;
}

// Yuqori darajalarga avtomatik yig'indi/o'rtacha
const SUM = new Set(['pop', 'work', 'migr', 'grp', 'output', 'export', 'inv', 'ent', 'ytt', 'bazaar', 'retail', 'schools', 'labor', 'agri']);
export function rollup(ids, recs, results) {
  const v = {};
  const popW = ids.map((id) => recs[id].v.pop);
  const tp = popW.reduce((a, b) => a + b, 0);
  for (const i of INDICATORS) {
    const xs = ids.map((id) => recs[id].v[i.id]);
    v[i.id] = SUM.has(i.id) ? xs.reduce((a, b) => a + b, 0) : xs.reduce((a, x, k) => a + x * popW[k], 0) / tp;
  }
  const s = {};
  for (const i of INDICATORS) {
    s[i.id] = YEARS.map((_, y) => {
      const xs = ids.map((id) => recs[id].s[i.id][y]);
      const pw = ids.map((id) => recs[id].s.pop[y]);
      const t = pw.reduce((a, b) => a + b, 0);
      return SUM.has(i.id) ? xs.reduce((a, b) => a + b, 0) : xs.reduce((a, x, k) => a + x * pw[k], 0) / t;
    });
  }
  v.grppc = (v.grp / v.pop) * 1000;
  const attr = results ? ids.reduce((a, id, k) => a + results[id].attr * popW[k], 0) / tp : null;
  const risk = results ? ids.reduce((a, id, k) => a + results[id].risk * popW[k], 0) / tp : null;
  return { v, s, attr, risk, n: ids.length };
}
