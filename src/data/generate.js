// Namunaviy ma'lumot generatori. Prototip bosqichida barcha raqamlar shu yerda
// deterministik tarzda (tuman SOATO kodi asosida) yaratiladi; real ma'lumot kelganda
// faqat qiymatlar almashadi — tuzilma (v, s, parts, upd) o'zgarmaydi.
import geo from './geo-meta.json';
import { INDICATORS, YEARS } from './catalog.js';
import { DISTRICT_SPECS, SPEC } from './specs.js';

export const TODAY = new Date('2026-10-28');

function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Viloyat bo'yicha iqtisodiy daraja va tarmoq moyilligi
const REGION_PROFILE = {
  1726: { w: 1.0, br: ['it', 'trade', 'pharma', 'electro', 'logistics'], crops: [] },
  1727: { w: 0.72, br: ['mining', 'build', 'chem', 'agro', 'logistics', 'electro'], crops: ['veg', 'fruit', 'milk', 'potato'] },
  1712: { w: 0.70, br: ['mining', 'chem', 'build', 'textile'], crops: ['wheat', 'cotton', 'karakul'] },
  1718: { w: 0.55, br: ['tourism', 'agro', 'textile', 'build', 'auto'], crops: ['fruit', 'grape', 'veg', 'wheat'] },
  1706: { w: 0.55, br: ['tourism', 'textile', 'chem', 'agro'], crops: ['cotton', 'wheat', 'karakul', 'melon'] },
  1703: { w: 0.52, br: ['auto', 'textile', 'agro', 'electro'], crops: ['fruit', 'veg', 'cocoon', 'cotton'] },
  1730: { w: 0.50, br: ['textile', 'chem', 'build', 'agro', 'tourism'], crops: ['fruit', 'cotton', 'cocoon', 'grape'] },
  1710: { w: 0.50, br: ['chem', 'mining', 'textile', 'agro'], crops: ['cotton', 'wheat', 'meat', 'grape'] },
  1714: { w: 0.45, br: ['textile', 'agro', 'electro', 'trade'], crops: ['fruit', 'veg', 'cocoon', 'grape'] },
  1724: { w: 0.45, br: ['textile', 'build', 'agro', 'logistics'], crops: ['cotton', 'wheat', 'melon', 'rice'] },
  1733: { w: 0.44, br: ['tourism', 'textile', 'agro', 'build'], crops: ['cotton', 'rice', 'melon', 'veg'] },
  1708: { w: 0.40, br: ['build', 'agro', 'textile', 'logistics'], crops: ['wheat', 'cotton', 'meat', 'melon'] },
  1722: { w: 0.38, br: ['agro', 'build', 'logistics', 'textile'], crops: ['cotton', 'veg', 'fruit', 'wheat'] },
  1735: { w: 0.34, br: ['chem', 'build', 'agro', 'textile'], crops: ['cotton', 'rice', 'melon', 'wheat'] },
};
const VALLEY = new Set(['1703', '1714', '1730']);
const CAPITALS = new Set(['Nukus shahri', 'Andijon shahri', 'Buxoro shahri', 'Jizzax shahri', 'Qarshi shahri', 'Navoiy shahri', 'Namangan shahri',
  'Samarqand shahri', 'Termiz shahri', 'Guliston shahri', 'Nurafshon shahri', "Farg'ona shahri", 'Urganch shahri']);
const MINING = new Set(['Zarafshon shahri', 'Olmaliq shahri', 'Muborak', 'Uchquduq', 'Angren shahri', 'Navoiy shahri', 'Tomdi']);
const TOURISM = new Set(['Samarqand shahri', 'Buxoro shahri', 'Xiva shahri', 'Shahrisabz shahri', "Bo'stonliq", 'Zomin', "Qo'qon shahri", "Marg'ilon shahri", 'Rishton', 'Urgut']);

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, a, b) => a + r() * (b - a);

// Tumandagi ixtisosliklar ko'rsatkichlari. Har bir soha o'z urug'i (tuman + soha) bilan hisoblanadi,
// shuning uchun ro'yxat admin panelda o'zgartirilganda boshqa sohalar raqamlari o'zgarmaydi.
export function makeSpecs(d, list, work) {
  const workers = work * 1000 * 0.62; // band aholi
  return list.map((sid, i) => {
    const r = rng(`${d.id}:${sid}`);
    const sp = SPEC[sid];
    const w = [1, 0.62, 0.42, 0.3][i];
    const land = sp.cat === 'agro' || sp.cat === 'livestock';
    const empShare = (land ? between(r, 10, 24) : sp.cat === 'craft' ? between(r, 2.5, 7) : sp.cat === 'tourism' || sp.cat === 'services' ? between(r, 6, 15) : between(r, 4, 12)) * w;
    const employed = Math.round((workers * empShare) / 100);
    const households = Math.min(78, empShare * (land ? between(r, 1.6, 2.4) : between(r, 1.1, 1.5)));
    const premium = (land ? between(r, 8, 38) : sp.cat === 'mining' || sp.cat === 'industry' ? between(r, 15, 60) : between(r, 5, 35)) * (0.7 + 0.3 * w);
    const volume = between(r, sp.vol[0], sp.vol[1]) * (0.55 + 0.45 * w) * (land && d.city ? 0.15 : 1);
    const growth = between(r, -0.02, 0.16);
    const reserve = Math.round(employed * between(r, 0.05, 0.2));
    const schools = Math.round(between(r, 0, 3) + (w > 0.5 ? 1 : 0));
    return {
      id: sid, rank: i + 1, empShare, employed, households, premium, volume, reserve, schools,
      export: between(r, 4, 55) * (sp.cat === 'services' ? 0.3 : 1),
      series: YEARS.map((_, y) => volume / (1 + growth) ** (YEARS.length - 1 - y)),
      ease: reserve > 900 ? 'easy' : reserve > 250 ? 'mid' : 'hard',
    };
  });
}

function makeDistrict(d) {
  const r = rng(d.id);
  const P = REGION_PROFILE[d.region];
  const cap = CAPITALS.has(d.uz);
  const tash = d.region === '1726';
  let wealth = P.w * between(r, 0.82, 1.15) * (d.city ? 1.25 : 1) * (cap ? 1.15 : 1);
  if (MINING.has(d.uz)) wealth *= 1.35;
  wealth = Math.min(1.15, wealth);

  // Aholi (ming kishi)
  let pop;
  if (tash) pop = between(r, 210, 420);
  else if (cap) pop = between(r, 220, 620);
  else if (d.city) pop = between(r, 45, 210);
  else {
    pop = between(r, 90, 190) * (VALLEY.has(d.region) ? 1.45 : 1);
    if (d.area > 8000) pop *= 0.45; else if (d.area > 3000) pop *= 0.8;
  }
  const v = {}, parts = {}, lists = {};
  v.pop = pop;
  v.youth = between(r, 27, 34.5) - (tash ? 2 : 0);
  v.work = pop * between(r, 0.57, 0.63);
  v.dens = (pop * 1000) / d.area;
  v.migr = pop * between(r, 0.025, 0.085) * (1.15 - wealth * 0.7);
  v.grppc = (13000 + 72000 * wealth ** 1.6) * between(r, 0.85, 1.2) * (MINING.has(d.uz) ? 1.8 : 1);
  v.grp = (pop * v.grppc) / 1000;
  const ind = d.city || MINING.has(d.uz) ? between(r, 0.3, 0.5) : between(r, 0.12, 0.32);
  const agr = d.city ? between(r, 0.01, 0.06) : between(r, 0.25, 0.45);
  parts.output = { ind: v.grp * ind, agr: v.grp * agr, srv: v.grp * Math.max(0.15, 0.92 - ind - agr) };
  v.output = parts.output.ind + parts.output.agr + parts.output.srv;
  v.export = (v.grp / 12.7) * between(r, 0.04, 0.22) * (d.city ? 1.2 : 1);
  v.inv = (v.grp / 12.7) * between(r, 0.12, 0.3);
  parts.inv = { foreign: between(r, 0.08, 0.48) };

  // Ixtisoslashgan sohalar (tumanning o'ziga xos 1–4 sohasi) va ulardagi bandlik, daromad, ishchi kuchi
  lists.specs = makeSpecs(d, DISTRICT_SPECS[d.uz] || [], v.work);
  // Yetakchi tarmoqlar ixtisosliklardan kelib chiqadi, yetishmasa viloyat moyilligidan to'ldiriladi
  const lead = [];
  for (const x of lists.specs) if (!lead.includes(SPEC[x.id].br)) lead.push(SPEC[x.id].br);
  const pool = [...P.br, d.city ? 'trade' : 'agro'];
  for (const b of pool) if (lead.length < 3 && !lead.includes(b)) lead.push(b);
  lists.lead = lead.slice(0, 3).map((b, i) => ({ id: b, share: [between(r, 28, 42), between(r, 14, 24), between(r, 8, 13)][i] }));
  const specCrops = lists.specs.filter((x) => SPEC[x.id].crop && SPEC[x.id].unit.uz === 'ming t').map((x) => ({ id: SPEC[x.id].crop, t: x.volume }));
  const crops = [];
  for (const c of [...specCrops, ...(d.city || tash ? [] : [...P.crops].sort(() => r() - 0.5).map((id) => ({ id, t: between(r, 6, 40) })))]) {
    if (crops.length < 3 && !crops.some((x) => x.id === c.id)) crops.push(c);
  }
  lists.agri = crops;
  v.sez = r() < (d.city ? 0.55 : 0.32) || MINING.has(d.uz) ? 1 : 0;
  v.lead = lead.length;
  v.agri = lists.agri.reduce((s, a) => s + a.t, 0);

  // Tadbirkorlik
  v.ent = pop * between(r, 4.5, 9) * (0.6 + wealth);
  v.ytt = pop * between(r, 14, 30);
  v.sme = (v.ent + v.ytt) / pop;
  const opened = v.ent * between(r, 0.1, 0.18);
  const closed = opened * between(r, 0.22, 0.75) * (1.2 - wealth * 0.4);
  parts.churn = { opened, closed };
  v.churn = (closed / opened) * 100;

  // Bozor
  v.bazaar = Math.round(between(r, 2, 7) + pop / 70);
  v.retail = v.grp * between(r, 0.32, 0.55);

  // Xarajatlar
  const shop = (22 + 160 * wealth ** 1.4) * between(r, 0.85, 1.2) * (d.city ? 1.3 : 1);
  parts.rent = { shop, office: shop * between(r, 0.7, 0.9), wh: shop * between(r, 0.28, 0.4) };
  parts.rent.n = Math.round(between(r, 6, 140) * (d.city ? 2 : 0.6));
  v.rent = (parts.rent.shop + parts.rent.office + parts.rent.wh) / 3;
  v.wage = (3100 + 6200 * wealth) * between(r, 0.92, 1.1);
  v.land = (45 + 2400 * wealth ** 2.4) * between(r, 0.7, 1.35) * (d.city ? 2.2 : 1) * (tash ? 2.5 : 1);

  // Infratuzilma
  const q = (base) => Math.max(1, Math.min(5, Math.round((base + between(r, -0.9, 0.9)) * 10) / 10));
  parts.util = { el: q(2.4 + wealth * 2.2), gas: q(2 + wealth * 2.4), water: q(2.3 + wealth * 2.1) };
  v.util = (parts.util.el + parts.util.gas + parts.util.water) / 3;
  parts.dist = { center: d.dCenter, rail: d.dRail, air: d.dAirport, border: d.dBorder };
  v.dist = (d.dCenter + d.dRail + d.dAirport) / 3;
  v.net = Math.min(99.5, between(r, 58, 82) + wealth * 18 + (d.city ? 6 : 0));

  // Inson salohiyati
  v.edu = Math.min(62, between(r, 16, 28) + wealth * 20 + (d.city ? 6 : 0));
  v.schools = Math.round(between(r, 3, 9) + pop / 40 + (cap ? 8 : 0));
  v.unemp = between(r, 4.5, 11.5) - wealth * 2.5;
  v.lang = Math.max(1, Math.min(5, Math.round((1.6 + wealth * 2.6 + between(r, -0.6, 0.6)) * 10) / 10));
  v.labor = Math.round(pop * 1000 * between(r, 0.012, 0.04));

  // 5 yillik dinamika (2021–2025)
  const growth = {
    pop: 0.019, youth: -0.004, work: 0.017, dens: 0.019, migr: -0.03, grp: 0.17, grppc: 0.15, output: 0.17, export: 0.12, inv: 0.16,
    ent: 0.09, ytt: 0.11, sme: 0.08, churn: -0.02, bazaar: 0.03, retail: 0.18, rent: between(r, 0.06, 0.24), wage: 0.15, land: between(r, 0.08, 0.22),
    util: 0.03, dist: 0, net: 0.05, edu: 0.025, schools: 0.03, unemp: -0.04, lang: 0.03, labor: -0.02, sez: 0, lead: 0, agri: 0.03,
  };
  const s = {};
  for (const k of Object.keys(v)) {
    const g = growth[k] ?? 0;
    s[k] = YEARS.map((y) => {
      const back = 2025 - y;
      const noise = k === 'sez' || k === 'dist' || k === 'lead' ? 1 : 1 + between(r, -0.035, 0.035) * (back ? 1 : 0);
      let x = (v[k] / (1 + g) ** back) * noise;
      if (k === 'sez' && back >= 3 && v.sez && r() < 0.3) x = 0;
      return x;
    });
  }

  // Yangilangan sana: ~13% tumanlarda ko'p ko'rsatkichlar eskirgan
  const lagging = r() < 0.13;
  const upd = {};
  for (const i of INDICATORS) {
    let days;
    if (i.freq === 'm') days = between(r, 3, 35);
    else if (i.freq === 'q') days = between(r, 20, 110);
    else if (i.freq === 'c') days = between(r, 60, 700);
    else days = between(r, 120, 300);
    if (lagging && i.freq !== 'm' && r() < 0.62) days = between(r, 760, 1100);
    else if (!lagging && r() < 0.03) days = between(r, 400, 650);
    const dt = new Date(TODAY.getTime() - days * 864e5);
    upd[i.id] = dt.toISOString().slice(0, 10);
  }

  const contact = {
    person: pick(r, ['A. Karimov', 'D. Rahimova', 'B. Tursunov', 'N. Yusupova', 'S. Ergashev', 'M. Qodirova', 'J. Normatov', 'Z. Aliyeva']),
  };
  return { v, s, parts, lists, upd, contact };
}

export function generateAll() {
  const out = {};
  for (const d of geo.districts) out[d.id] = makeDistrict(d);
  return out;
}

// Investitsion takliflar, auksiondagi yer va bo'sh binolar
export function generateOffers() {
  const r = rng('offers-v1');
  const types = ['project', 'land', 'building'];
  const sectors = ['textile', 'agro', 'logistics', 'build', 'tourism', 'it', 'mall'];
  const titles = {
    project: {
      textile: ["Tikuv-trikotaj fabrikasi", 'Швейно-трикотажная фабрика', 'Knitwear & garment factory'],
      agro: ['Meva-sabzavotni qayta ishlash va muzlatkich', 'Переработка плодоовощной продукции и холодильник', 'Fruit & vegetable processing with cold storage'],
      logistics: ['Ko\'p funksiyali logistika markazi', 'Многофункциональный логистический центр', 'Multimodal logistics hub'],
      build: ['Gazoblok va quruq qorishmalar zavodi', 'Завод газоблоков и сухих смесей', 'Aerated block & dry-mix plant'],
      tourism: ['4* mehmonxona va etno-majmua', 'Гостиница 4* и этно-комплекс', '4-star hotel & ethno complex'],
      it: ['IT-park filiali va BPO markazi', 'Филиал IT-парка и BPO-центр', 'IT Park branch & BPO centre'],
      mall: ['Savdo-ko\'ngilochar markazi', 'Торгово-развлекательный центр', 'Retail & entertainment centre'],
    },
    land: ['Auksiondagi yer uchastkasi', 'Земельный участок на аукционе', 'Land plot at auction'],
    building: ["Bo'sh ishlab chiqarish binosi", 'Свободное производственное здание', 'Vacant industrial building'],
  };
  const list = [];
  let n = 1;
  for (const d of geo.districts) {
    const k = r() < 0.25 ? 2 : r() < 0.55 ? 1 : 0;
    for (let j = 0; j < k; j++) {
      const type = pick(r, types);
      const sector = pick(r, sectors);
      const t = type === 'project' ? titles.project[sector] : titles[type];
      const area = type === 'land' ? +between(r, 0.5, 25).toFixed(1) : type === 'building' ? Math.round(between(r, 400, 9000)) : +between(r, 1, 12).toFixed(1);
      list.push({
        id: `OF-${String(n++).padStart(4, '0')}`,
        district: d.id, type, sector,
        title: { uz: t[0], ru: t[1], en: t[2] },
        lat: d.lat + between(r, -0.06, 0.06) * (d.city ? 0.2 : 1),
        lng: d.lng + between(r, -0.08, 0.08) * (d.city ? 0.2 : 1),
        area, areaUnit: type === 'building' ? 'm2' : 'ga',
        price: type === 'project' ? +between(r, 1.5, 45).toFixed(1) : type === 'land' ? Math.round(between(r, 80, 4000)) : Math.round(between(r, 900, 18000)),
        priceUnit: type === 'project' ? 'musd' : 'msum',
        irr: type === 'project' ? +between(r, 14, 31).toFixed(1) : null,
        jobs: type === 'project' ? Math.round(between(r, 30, 450)) : null,
        deadline: new Date(TODAY.getTime() + between(r, 10, 160) * 864e5).toISOString().slice(0, 10),
        status: 'approved',
      });
    }
  }
  return list;
}
