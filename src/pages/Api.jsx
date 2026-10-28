import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, REGIONS } from '../store.jsx';
import { INDICATORS, SECTORS } from '../data/catalog.js';
import { riskLevel, reliability, topFactors, computeYear, METHOD_VERSION } from '../lib/methodology.js';
import { SampleBadge } from '../components/ui.jsx';
import { SPEC } from '../data/specs.js';

const BASE = 'https://api.investregion.uz/v1';

const TXT = {
  intro: ["Banklar, lizing kompaniyalari va tahlilchilar uchun ko'rsatkichlar va indekslarni avtomatik olish. REST + JSON, API kalit orqali (X-API-Key). Javoblarda har bir qiymat manba va sana bilan keladi.",
    'Автоматическое получение показателей и индексов для банков, лизинговых компаний и аналитиков. REST + JSON, ключ API (X-API-Key). Каждое значение возвращается с источником и датой.',
    'Automated access to indicators and indices for banks, leasing companies and analysts. REST + JSON with an API key (X-API-Key). Every value is returned with its source and date.'],
  try: ["Sinab ko'rish (prototip ma'lumotlari bilan, brauzer ichida)", 'Попробовать (на данных прототипа, в браузере)', 'Try it (prototype data, runs in the browser)'],
  run: ['Yuborish', 'Отправить', 'Send'],
  limits: ['Limitlar: 60 so\'rov/daqiqa (bepul), 1000 so\'rov/daqiqa (bank tarifi). Javoblar keshlanadi, ETag qo\'llab-quvvatlanadi.', 'Лимиты: 60 запросов/мин (бесплатно), 1000/мин (банковский тариф). Ответы кешируются, поддерживается ETag.', 'Limits: 60 requests/min (free), 1,000/min (bank tier). Responses are cached; ETag supported.'],
};

const ENDPOINTS = [
  { m: 'GET', p: '/regions', d: ['Viloyatlar ro\'yxati va agregat indekslar', 'Регионы и агрегированные индексы', 'Regions with aggregated indices'] },
  { m: 'GET', p: '/districts?region={code}', d: ['Tumanlar ro\'yxati (SOATO)', 'Список районов (СОАТО)', 'District list (SOATO)'] },
  { m: 'GET', p: '/districts/{soato}', d: ["Tuman kartochkasi: 30 ko'rsatkich, manba, sana", 'Карточка района: 30 показателей, источник, дата', 'District profile: 30 indicators with source and date'] },
  { m: 'GET', p: '/districts/{soato}/index?sector={sector}', d: ['Jozibadorlik va risk indeksi, top-3 omil', 'Индексы привлекательности и риска, топ-3 фактора', 'Attractiveness & risk index, top-3 factors'] },
  { m: 'GET', p: '/districts/{soato}/series/{indicator}', d: ['5 yillik dinamika', 'Динамика за 5 лет', '5-year time series'] },
  { m: 'GET', p: '/districts/{soato}/specializations', d: ['Tuman ixtisosliklari: bandlik, daromad, ishchi kuchi', 'Специализация района: занятость, доходы, кадры', 'District specialisations: jobs, income, labour'] },
  { m: 'GET', p: '/specializations/{spec}', d: ['Soha rivojlangan tumanlar reytingi', 'Рейтинг районов по отрасли', 'Districts ranked for a specialisation'] },
  { m: 'GET', p: '/scoring/risk?soato={soato}', d: ['Kredit skoringi uchun ixcham risk javobi', 'Компактный ответ для кредитного скоринга', 'Compact risk payload for credit scoring'] },
  { m: 'GET', p: '/offers?type={type}&region={code}', d: ['Investitsion takliflar va bo\'sh maydonlar', 'Инвестпредложения и свободные площади', 'Investment offers & vacant sites'] },
];

export default function Api() {
  const { t, lang, recs, results, offers, regionAgg, sector, specIndex } = useApp();
  const L = { uz: 0, ru: 1, en: 2 }[lang];
  const [ep, setEp] = useState(3);
  const [soato, setSoato] = useState('1718427');
  const [sec, setSec] = useState(sector);
  const [out, setOut] = useState(null);

  const run = useMemo(() => () => {
    const id = DMAP[soato] ? soato : DISTRICTS[0].id;
    const rec = recs[id], d = DMAP[id];
    const r3 = (x) => Math.round(x * 100) / 100;
    const payloads = [
      () => ({ data: REGIONS.map((r) => ({ code: r.code, name: { uz: r.uz, ru: r.ru, en: r.en }, attractiveness: r3(regionAgg[r.code].attr), risk: r3(regionAgg[r.code].risk), districts: regionAgg[r.code].n })) }),
      () => ({ data: DISTRICTS.filter((x) => x.region === d.region).map((x) => ({ soato: x.id, name: { uz: x.uz, ru: x.ru, en: x.en } })) }),
      () => ({ soato: id, name: { uz: d.uz, ru: d.ru, en: d.en }, region: d.region, sample: true,
        indicators: Object.fromEntries(INDICATORS.filter((i) => i.fmt !== 'list').slice(0, 8).map((i) => [i.id, { value: r3(rec.v[i.id]), unit: i.unit.en, source: i.src, updated: rec.upd[i.id] }])), '…': `${INDICATORS.length} indicators` }),
      () => {
        const res = sec === sector ? results[id] : computeYear(DISTRICTS.map((x) => x.id), recs, sec)[id];
        return { soato: id, sector: sec, method: METHOD_VERSION, attractiveness: r3(res.attr), risk: r3(res.risk), risk_level: riskLevel(res.risk),
          reliability: { low: reliability(rec).low, weak_share: r3(reliability(rec).share) },
          groups: Object.fromEntries(Object.entries(res.g).map(([k, v]) => [k, r3(v)])),
          top_factors: topFactors(res, sec).map((f) => ({ group: f.group, score: r3(f.score), worst_indicator: f.worst })) };
      },
      () => ({ soato: id, sample: true, specializations: rec.lists.specs.map((x) => ({ id: x.id, rank: x.rank, name: SPEC[x.id].en, volume: r3(x.volume), unit: SPEC[x.id].unit.en, employed: x.employed, households_pct: r3(x.households), income_premium_pct: r3(x.premium), hiring: x.ease, skilled_reserve: x.reserve })) }),
      () => { const sid = rec.lists.specs[0].id; return { specialization: sid, name: SPEC[sid].en, districts: (specIndex[sid] || []).slice(0, 5).map((e) => ({ soato: e.id, rank_in_district: e.rank, volume: r3(e.volume), employed: e.employed, hiring: e.ease })) }; },
      () => ({ soato: id, indicator: 'grppc', unit: 'thousand UZS', series: rec.s.grppc.map((v, i) => ({ year: 2021 + i, value: Math.round(v) })) }),
      () => ({ soato: id, risk: Math.round(results[id].risk), level: riskLevel(results[id].risk), reliability_low: reliability(rec).low, as_of: '2026-10-28' }),
      () => ({ total: offers.filter((o) => DMAP[o.district].region === d.region).length, data: offers.filter((o) => DMAP[o.district].region === d.region).slice(0, 3).map((o) => ({ id: o.id, type: o.type, soato: o.district, title: o.title.en, area: o.area, price: o.price, price_unit: o.priceUnit })) }),
    ];
    setOut(JSON.stringify(payloads[ep](), null, 2));
  }, [ep, soato, sec, sector, recs, results, offers, regionAgg, specIndex]);

  const path = ENDPOINTS[ep].p.replace('{soato}', soato).replace('{sector}', sec).replace('{code}', DMAP[soato]?.region || '1718').replace('{indicator}', 'grppc').replace('{type}', 'land').replace('{spec}', recs[soato]?.lists.specs[0].id || 'cotton');

  return (
    <div className="wrap api">
      <div className="sec-h"><div><h1>{t('apiTitle')} <small className="muted">v1</small></h1><p className="lead">{TXT.intro[L]}</p></div><SampleBadge /></div>
      <div className="grid2">
        <div className="card">
          {ENDPOINTS.map((e, i) => (
            <button key={i} className={`ep ${ep === i ? 'on' : ''}`} onClick={() => { setEp(i); setOut(null); }}>
              <span className="m">{e.m}</span><code>{e.p}</code><small>{e.d[L]}</small>
            </button>
          ))}
          <p className="muted small">{TXT.limits[L]}</p>
        </div>
        <div className="card">
          <h3>{TXT.try[L]}</h3>
          <div className="row gap wrapw">
            <label className="field"><span>SOATO</span><input value={soato} onChange={(e) => setSoato(e.target.value)} /></label>
            <label className="field"><span>{t('sector')}</span><select value={sec} onChange={(e) => setSec(e.target.value)}>{SECTORS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}</select></label>
          </div>
          <pre className="code">curl -H "X-API-Key: $KEY" \{'\n'}  "{BASE}{path}"</pre>
          <button className="btn primary" onClick={run}>▶ {TXT.run[L]}</button>
          {out && <pre className="code json">{out}</pre>}
        </div>
      </div>
    </div>
  );
}
