import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, dname, go } from '../store.jsx';
import { DistrictSelect, SectorSelect, RiskBadge, ScoreRing, HBar, SampleBadge, regionOf } from '../components/ui.jsx';
import { num } from '../lib/format.js';
import { riskLevel } from '../lib/methodology.js';

// Yillik xarajat: ijara (ming so'm/m²/oy), ish haqi (ming so'm/oy), yer (mln so'm/ga)
export function costOf(rec, { emp, space, kind, land, mult }) {
  const rent = (rec.parts.rent[kind] * space * 12) / 1000; // mln so'm
  const payroll = (rec.v.wage * mult * emp * 12) / 1000;
  const social = payroll * 0.12;
  const landC = land ? rec.v.land * land : 0;
  return { rent, payroll, social, land: landC, total: rent + payroll + social };
}

export default function Calculator({ id: initial }) {
  const { t, lang, recs, results, ranks } = useApp();
  const [id, setId] = useState(initial || ranks.sorted[0]);
  const [p, setP] = useState({ emp: 120, space: 2500, kind: 'wh', land: 0, mult: 1 });
  const set = (k) => (e) => setP({ ...p, [k]: k === 'kind' ? e.target.value : +e.target.value });
  const c = id ? costOf(recs[id], p) : null;
  const usd = (x) => `$${num((x * 1e6) / 12700 / 1000, 0, lang)}k`;

  const alts = useMemo(() => {
    if (!id) return [];
    const d = DMAP[id];
    return DISTRICTS.filter((x) => x.id !== id && (x.region === d.region || results[x.id].attr > results[id].attr - 5))
      .map((x) => ({ id: x.id, c: costOf(recs[x.id], p), r: results[x.id] }))
      .sort((a, b) => a.c.total - b.c.total).slice(0, 6);
  }, [id, p, recs, results]);
  const maxT = Math.max(c?.total || 0, ...alts.map((a) => a.c.total));

  return (
    <div className="wrap">
      <div className="sec-h"><div><h1>{t('calcTitle')}</h1><p className="muted">{t('calcText')}</p></div><SampleBadge /></div>
      <div className="calc">
        <div className="card calc-form">
          <SectorSelect />
          <label className="field"><span>{t('district')}</span><DistrictSelect value={id} onChange={setId} /></label>
          <label className="field"><span>{t('employees')}: <b>{p.emp}</b></span><input type="range" min="5" max="2000" step="5" value={p.emp} onChange={set('emp')} /></label>
          <label className="field"><span>{t('space')}</span><input type="number" min="10" value={p.space} onChange={set('space')} /></label>
          <label className="field"><span>{t('spaceType')}</span>
            <select value={p.kind} onChange={set('kind')}><option value="shop">{t('shop')}</option><option value="office">{t('office')}</option><option value="wh">{t('wh')}</option></select>
          </label>
          <label className="field"><span>{t('landHa')}</span><input type="number" min="0" step="0.5" value={p.land} onChange={set('land')} /></label>
          <label className="field"><span>{t('wageMult')}: <b>×{p.mult}</b></span><input type="range" min="0.7" max="2.5" step="0.1" value={p.mult} onChange={set('mult')} /></label>
        </div>
        {c && (
          <div className="card calc-res">
            <div className="row between wrapw">
              <div><h2><a href={`#/d/${id}`}>{dname(DMAP[id], lang)}</a></h2><small className="muted">{dname(regionOf(id), lang)}</small></div>
              <div className="row gap"><ScoreRing value={results[id].attr} size={70} label={t('attr')} /><ScoreRing value={results[id].risk} size={70} kind="risk" label={t('risk')} /></div>
            </div>
            <div className="calc-lines">
              {[['annualRent', c.rent], ['payroll', c.payroll], ['social', c.social]].map(([k, v]) => (
                <div key={k}><span>{t(k)}</span><b>{num(v, 0, lang)} {t('mlnSum')}</b><small>{usd(v)}</small></div>
              ))}
              <div className="total"><span>{t('totalYear')}</span><b>{num(c.total, 0, lang)} {t('mlnSum')}</b><small>{usd(c.total)}</small></div>
              {p.land > 0 && <div><span>{t('landCost')}</span><b>{num(c.land, 0, lang)} {t('mlnSum')}</b><small>{usd(c.land)}</small></div>}
            </div>
            <RiskBadge value={results[id].risk} />
            <h3>{t('compareAlt')}</h3>
            <div className="alts">
              <div className="alt me"><span>{dname(DMAP[id], lang)}</span><HBar value={c.total} max={maxT} color="var(--brand)" /><b>{num(c.total, 0, lang)}</b><i /></div>
              {alts.map((a) => (
                <div key={a.id} className="alt" onClick={() => setId(a.id)}>
                  <span>{dname(DMAP[a.id], lang)}</span>
                  <HBar value={a.c.total} max={maxT} color="#94a3b8" />
                  <b>{num(a.c.total, 0, lang)}</b>
                  <i className={`dot risk-${riskLevel(a.r.risk)}`} title={t('risk')}>{a.c.total < c.total ? `−${num((1 - a.c.total / c.total) * 100, 0)}%` : ''}</i>
                </div>
              ))}
            </div>
            <div className="row gap"><button className="btn ghost" onClick={() => go('d/' + id)}>{t('openCard')}</button><button className="btn primary" onClick={() => go('report/' + id)}>📄 {t('pdf')}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
