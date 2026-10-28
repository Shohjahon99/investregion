import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, REGIONS, dname } from '../store.jsx';
import { SectorSelect, ScoreRing, RiskBadge, SampleBadge, regionOf } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
import { fmtInd, unit } from '../lib/format.js';
import { riskLevel } from '../lib/methodology.js';
import { SECTORS } from '../data/catalog.js';
import { SPECS, SPEC, SPEC_CATS } from '../data/specs.js';
import { SpecChip } from '../components/Specs.jsx';

const LBL = { rent: 'maxRent', rail: 'maxRail', air: 'maxAir', wage: 'maxWage' };
// Ixtisosliklar uchun kalit so'zlar (uz/ru/en)
const SPEC_KW = {
  pomegranate: /(anor|гранат|pomegranate)/, cotton: /(paxta|хлоп|cotton)/, grain: /(g'all|bug'doy|зерн|пшен|grain|wheat)/, grape: /(uzum|виноград|grape)/,
  cherry: /(gilos|черешн|cherr)/, apricot: /(o'rik|урюк|абрикос|apricot|quritilgan|сухофрукт|dried)/, citrus: /(limon|лимон|lemon|citrus)/,
  greenhouse: /(issiqxona|теплиц|greenhouse)/, vegetable: /(sabzavot|овощ|vegetable)/, melon: /(qovun|tarvuz|дын|арбуз|melon)/, rice: /(sholi|guruch|рис\b|rice)/,
  potato: /(kartosh|картоф|potato)/, nuts: /(yong'oq|bodom|pista|орех|миндал|фисташ|walnut|almond|pistach)/, silk: /(pilla|шелкопряд|кокон|cocoon|sericult)/,
  flowers: /(gulchilik|цветов|flower)/, herbs: /(dorivor|qizilmiya|солодк|licorice|herb)/, cattle: /(qoramol|go'sht|молочн|cattle|dairy)/,
  sheep: /(qo'y|echki|овц|коз|sheep|goat)/, karakul: /(qorako'l|каракул|karakul)/, poultry: /(parranda|tovuq|tuxum|птиц|poultry)/,
  fish: /(baliq|рыб|fish)/, bees: /(asal|мёд|honey|bee)/, ceramics: /(kulol|sopol|керами|ceramic|pottery)/, carpet: /(gilam|so'zana|ковр|сюзане|carpet)/,
  atlas: /(atlas|adras|ikat)/, marble: /(marmar|мрамор|marble)/, gold: /(oltin|золот|gold)/, coal: /(ko'mir|угол|уголь|coal)/, cement: /(sement|цемент|cement)/,
  oil: /(neft|нефт|oil and gas)/, chem: /(kimyo|o'g'it|хими|удобр|chemic|fertili)/, auto: /(avtomobil|автом|automo)/, knife: /(pichoq|нож|knife)/,
};
const DEF = { rent: 200, rail: 200, air: 400, wage: 12000, pop: 0, labor: 0, risk: 'any', sez: false, util: 1, region: '', spec: '', easy: false };

// "Qaysi tuman menga mos?" — so'rovni oddiy qoidalar bilan shartlarga aylantiradi
function parseQuery(q) {
  const s = q.toLowerCase();
  const out = {};
  const numAfter = (re) => { const m = s.match(re); return m ? +m[1].replace(',', '.') : null; };
  const rent = numAfter(/(?:ijara|аренд\S*|rent)\D{0,25}?(\d+[.,]?\d*)/);
  if (rent) out.rent = rent;
  const rail = numAfter(/(?:temir|ж\/?д|желез\S*|rail\S*)\D{0,25}?(\d+)/);
  if (rail) out.rail = rail;
  const air = numAfter(/(?:aeroport|аэропорт\S*|airport)\D{0,25}?(\d+)/);
  if (air) out.air = air;
  const wage = numAfter(/(?:ish haqi|maosh|зарплат\S*|wage|salary)\D{0,25}?(\d+)/);
  if (wage) out.wage = wage < 100 ? wage * 1000 : wage;
  if (/(eiz|sez|сэз|zona|зон|industrial zone)/.test(s)) out.sez = true;
  for (const [k, re] of Object.entries(SPEC_KW)) if (re.test(s)) { out.spec = k; break; }
  if (out.spec && /(ishchi\S* topish oson|oson topil|легко найти|easy (to )?hir)/.test(s)) out.easy = true;
  if (/(past risk|low risk|низк\S* риск|xavfsiz|safe)/.test(s)) out.risk = 'low';
  const keys = { textile: /(to'qim|тексти|textile|tikuv|garment)/, mall: /(savdo markaz|торгов|mall|shopping)/, logistics: /(logist|логист|ombor|склад|warehouse)/,
    agro: /(oziq|пищев|food|agro|meva|fruit)/, it: /(\bit\b|айти|bpo|software|dastur)/, build: /(qurilish|строй|building|cement|sement)/, tourism: /(turiz|тури|touris|hotel|mehmonxona|гостин)/ };
  for (const [k, re] of Object.entries(keys)) if (re.test(s)) { out.sector = k; break; }
  for (const r of REGIONS) if ([r.uz, r.ru, r.en].some((n) => s.includes(n.toLowerCase().split(' ')[0].slice(0, 6)))) { out.region = r.code; break; }
  return out;
}

export default function Finder() {
  const { t, lang, recs, results, sector, setSector, scales } = useApp();
  const [c, setC] = useState(DEF);
  const [q, setQ] = useState('');
  const [parsed, setParsed] = useState(null);
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));

  const matches = useMemo(() => DISTRICTS.filter((d) => {
    const r = recs[d.id], res = results[d.id];
    if (c.region && d.region !== c.region) return false;
    if (r.v.rent > c.rent || d.dRail > c.rail || d.dAirport > c.air || r.v.wage > c.wage) return false;
    if (r.v.pop < c.pop || r.v.labor < c.labor || r.v.util < c.util) return false;
    if (c.sez && !r.v.sez) return false;
    const sx = c.spec && r.lists.specs.find((x) => x.id === c.spec);
    if (c.spec && !sx) return false;
    if (c.spec && c.easy && sx.ease !== 'easy') return false;
    const lvl = riskLevel(res.risk);
    if (c.risk === 'low' && lvl !== 'low') return false;
    if (c.risk === 'lowmid' && lvl === 'high') return false;
    return true;
  }).map((d) => d.id).sort((a, b) => {
    // ixtisoslik tanlangan bo'lsa — avval shu soha asosiy bo'lgan tumanlar
    const rk = (id) => (c.spec ? recs[id].lists.specs.find((x) => x.id === c.spec).rank : 0);
    return rk(a) - rk(b) || results[b].attr - results[a].attr;
  }), [c, recs, results]);

  const hl = useMemo(() => new Set(matches), [matches]);
  const apply = () => {
    const p = parseQuery(q);
    setParsed(p);
    const { sector: s, ...rest } = p;
    if (s) setSector(s);
    setC({ ...DEF, ...rest });
  };

  const slider = ({ k, label, min, max, step, u }) => (
    <label className="field"><span>{label}: <b>{c[k]}{u}</b></span><input type="range" min={min} max={max} step={step} value={c[k]} onChange={(e) => set(k, +e.target.value)} /></label>
  );

  return (
    <div className="wrap">
      <div className="sec-h"><div><h1>{t('finderTitle')}</h1><p className="muted">{t('finderText')}</p></div><SampleBadge /></div>
      <div className="card ai">
        <span className="ai-ic">✦</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder={t('aiAsk')} />
        <button className="btn primary" onClick={apply}>{t('aiBtn')}</button>
      </div>
      {parsed && (
        <div className="chips parsed">
          {Object.entries(parsed).map(([k, v]) => <span key={k} className="chip">{k === 'sector' ? t.n(SECTORS.find((s) => s.id === v)) : k === 'region' ? dname(REGIONS.find((r) => r.code === v), lang) : k === 'spec' ? '⭐ ' + t.n(SPEC[v]) : k === 'easy' ? '👷 ' + t('laborAvail') + ': ' + t('ease_easy') : k === 'sez' ? t('needSez') : k === 'risk' ? t('onlyLow') : `${t(LBL[k])}: ${v}`}</span>)}
          {!Object.keys(parsed).length && <span className="muted">—</span>}
        </div>
      )}
      <div className="finder">
        <div className="card finder-form">
          <SectorSelect />
          <label className="field"><span>⭐ {t('specFilter')}</span>
            <select value={c.spec} onChange={(e) => set('spec', e.target.value)}>
              <option value="">{t('anySpec')}</option>
              {Object.entries(SPEC_CATS).map(([cid, g]) => <optgroup key={cid} label={`${g.icon} ${t.n(g)}`}>{SPECS.filter((s) => s.cat === cid).map((s) => <option key={s.id} value={s.id}>{t.n(s)}</option>)}</optgroup>)}
            </select>
          </label>
          {c.spec && <label className="check"><input type="checkbox" checked={c.easy} onChange={(e) => set('easy', e.target.checked)} /> 👷 {t('laborAvail')}: {t('ease_easy')}</label>}
          <label className="field"><span>{t('region')}</span>
            <select value={c.region} onChange={(e) => set('region', e.target.value)}><option value="">{t('allRegions')}</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{dname(r, lang)}</option>)}</select>
          </label>
          {slider({ k: "rent", label: t('maxRent'), min: 10, max: 200, step: 5 })}
          {slider({ k: "rail", label: t('maxRail'), min: 5, max: 200, step: 5, u: " km" })}
          {slider({ k: "air", label: t('maxAir'), min: 10, max: 400, step: 10, u: " km" })}
          {slider({ k: "wage", label: t('maxWage'), min: 3000, max: 12000, step: 250 })}
          {slider({ k: "pop", label: t('minPop'), min: 0, max: 400, step: 10 })}
          {slider({ k: "labor", label: t('minLabor'), min: 0, max: 15000, step: 500 })}
          {slider({ k: "util", label: t('minUtil'), min: 1, max: 5, step: 0.5 })}
          <label className="field"><span>{t('maxRisk')}</span>
            <select value={c.risk} onChange={(e) => set('risk', e.target.value)}><option value="any">{t('anyRisk')}</option><option value="lowmid">{t('onlyLowMid')}</option><option value="low">{t('onlyLow')}</option></select>
          </label>
          <label className="check"><input type="checkbox" checked={c.sez} onChange={(e) => set('sez', e.target.checked)} /> {t('needSez')}</label>
          <button className="btn ghost" onClick={() => { setC(DEF); setParsed(null); }}>{t('clear')}</button>
        </div>
        <div>
          <div className="card"><MapView height={330} highlight={hl} colorFn={(id) => (hl.has(id) ? scales.attr.color(results[id].attr) : '#e2e8f0')} onClick={(id) => (location.hash = '#/d/' + id)}
            tooltipFn={(id) => `<b>${dname(DMAP[id], lang)}</b><br>${t('attr')}: ${Math.round(results[id].attr)}`} /></div>
          <h3>{t('results')}: {matches.length} {t('found')} <small className="muted">· {t.n(SECTORS.find((s) => s.id === sector))}</small></h3>
          <div className="flist">
            {matches.slice(0, 30).map((id, i) => {
              const r = recs[id];
              return (
                <a key={id} className="card frow" href={`#/d/${id}`}>
                  <span className="fnum">{i + 1}</span>
                  <ScoreRing value={results[id].attr} size={54} />
                  <div className="frow-b"><b>{dname(DMAP[id], lang)}</b><small>{dname(regionOf(id), lang)}</small><div className="chips">{r.lists.specs.map((x) => <SpecChip key={x.id} id={x.id} rank={x.rank} small />)}</div></div>
                  <div className="frow-k"><span>{fmtInd('rent', r.v.rent, t)}<small> {unit('rent', t)}</small></span><span>🚆 {DMAP[id].dRail} km</span><span>{fmtInd('wage', r.v.wage, t)}<small> {unit('wage', t)}</small></span></div>
                  <RiskBadge value={results[id].risk} />
                </a>
              );
            })}
            {!matches.length && <p className="muted">{t('notFound')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
