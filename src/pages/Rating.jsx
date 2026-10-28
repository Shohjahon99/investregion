import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, REGIONS, dname } from '../store.jsx';
import { SectorSelect, SampleBadge, HBar, Sparkline, LineChart, PALETTE } from '../components/ui.jsx';
import { colorAttr, num, riskColor } from '../lib/format.js';
import { riskLevel, computeYear, reliability } from '../lib/methodology.js';
import { YEARS } from '../data/catalog.js';

export default function Rating() {
  const { t, lang, results, prevResults, ranks, regionAgg, recs, sector } = useApp();
  const [tab, setTab] = useState('district');
  const [region, setRegion] = useState('');
  const [sort, setSort] = useState('attr');

  // Indekslarning 5 yillik dinamikasi (har yil o'z kesimida hisoblanadi)
  const hist = useMemo(() => {
    const ids = DISTRICTS.map((d) => d.id);
    return YEARS.map((_, y) => computeYear(ids, recs, sector, y));
  }, [recs, sector]);
  const regHist = useMemo(() => Object.fromEntries(REGIONS.map((r) => {
    const ids = DISTRICTS.filter((d) => d.region === r.code).map((d) => d.id);
    return [r.code, hist.map((h) => ids.reduce((a, id) => a + h[id].attr * recs[id].v.pop, 0) / ids.reduce((a, id) => a + recs[id].v.pop, 0))];
  })), [hist, recs]);

  const rows = useMemo(() => {
    let ids = DISTRICTS.map((d) => d.id).filter((id) => !region || DMAP[id].region === region);
    const key = { attr: (id) => -results[id].attr, risk: (id) => results[id].risk, change: (id) => -(results[id].attr - prevResults[id].attr) }[sort];
    return ids.sort((a, b) => key(a) - key(b));
  }, [region, results, prevResults, sort]);

  const regs = [...REGIONS].sort((a, b) => regionAgg[b.code].attr - regionAgg[a.code].attr);
  const top5 = regs.slice(0, 5);

  return (
    <div className="wrap">
      <div className="sec-h"><div><h1>{t('ratingTitle')}</h1><SampleBadge /></div><SectorSelect /></div>
      <div className="tabs">
        <button className={tab === 'district' ? 'on' : ''} onClick={() => setTab('district')}>{t('byDistrict')}</button>
        <button className={tab === 'region' ? 'on' : ''} onClick={() => setTab('region')}>{t('byRegion')}</button>
      </div>

      {tab === 'region' ? (
        <>
          <div className="card">
            <h3>{t('dynamics')} · {t('attrIdx')}</h3>
            <LineChart fmt={(v) => num(v, 0)} series={top5.map((r, k) => ({ name: dname(r, lang), data: regHist[r.code], color: PALETTE[k] }))} />
          </div>
          <div className="card table-scroll">
            <table className="rtable">
              <thead><tr><th>#</th><th>{t('region')}</th><th>{t('attrIdx')}</th><th>{t('riskIdx')}</th><th>{t('dynamics')}</th><th>{t('population')}</th><th>YaHM</th><th>{t('districts')}</th></tr></thead>
              <tbody>
                {regs.map((r, i) => {
                  const a = regionAgg[r.code];
                  return (
                    <tr key={r.code} onClick={() => { setRegion(r.code); setTab('district'); }}>
                      <td>{i + 1}</td><td><b>{dname(r, lang)}</b></td>
                      <td><div className="cellbar"><HBar value={a.attr} color={colorAttr(a.attr + 15)} /><b>{num(a.attr, 1)}</b></div></td>
                      <td><span style={{ color: riskColor[riskLevel(a.risk)] }}>● </span>{num(a.risk, 1)}</td>
                      <td><Sparkline data={regHist[r.code]} /></td>
                      <td>{num(a.v.pop / 1000, 2, lang)} {lang === 'en' ? 'm' : 'mln'}</td>
                      <td>{num(a.v.grp / 1000, 1, lang)} trln</td>
                      <td>{a.n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card table-scroll">
          <div className="row gap wrapw filters">
            <select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">{t('allRegions')}</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{dname(r, lang)}</option>)}</select>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="attr">↓ {t('attrIdx')}</option><option value="risk">↑ {t('riskIdx')}</option><option value="change">↓ {t('change')}</option>
            </select>
            <span className="muted">{rows.length}</span>
          </div>
          <table className="rtable">
            <thead><tr><th>#</th><th>{t('district')}</th><th>{t('region')}</th><th>{t('attrIdx')}</th><th>{t('riskIdx')}</th><th>{t('change')}</th><th>{t('dynamics')}</th><th /></tr></thead>
            <tbody>
              {rows.map((id, i) => {
                const ch = results[id].attr - prevResults[id].attr;
                const rk = ranks.prev[id] - ranks.rep[id];
                return (
                  <tr key={id} onClick={() => (location.hash = '#/d/' + id)}>
                    <td>{i + 1}</td>
                    <td><b>{dname(DMAP[id], lang)}</b></td>
                    <td className="muted">{dname(REGIONS.find((r) => r.code === DMAP[id].region), lang)}</td>
                    <td><div className="cellbar"><HBar value={results[id].attr} color={colorAttr(results[id].attr + 10)} /><b>{num(results[id].attr, 1)}</b></div></td>
                    <td><span className={`badge risk-${riskLevel(results[id].risk)}`}>{num(results[id].risk, 0)}</span></td>
                    <td className={ch >= 0 ? 'good' : 'bad'}>{ch >= 0 ? '▲' : '▼'} {num(Math.abs(ch), 1)} <small className="muted">({rk >= 0 ? '+' : ''}{rk})</small></td>
                    <td><Sparkline data={hist.map((h) => h[id].attr)} w={90} h={24} /></td>
                    <td>{reliability(recs[id]).low && <span className="tag stale" title={t('lowRelT')}>⚠</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
