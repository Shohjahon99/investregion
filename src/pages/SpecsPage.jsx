import { useMemo, useState } from 'react';
import { useApp, DMAP, REGIONS, dname, go } from '../store.jsx';
import MapView from '../components/MapView.jsx';
import { SampleBadge, RiskBadge, regionOf } from '../components/ui.jsx';
import { EASE_COLOR } from '../components/Specs.jsx';
import { SPECS, SPEC, SPEC_CATS } from '../data/specs.js';
import { num } from '../lib/format.js';

const RANK_COLOR = ['#0b6457', '#3fae9b', '#86cfc1', '#c7e8e2'];

export default function SpecsPage({ id }) {
  const { t, lang, specIndex, recs, results } = useApp();
  const [region, setRegion] = useState('');
  const [q, setQ] = useState('');
  const sel = SPEC[id] ? id : null;
  const sp = sel && SPEC[sel];

  const rows = useMemo(() => (sel ? (specIndex[sel] || []).filter((e) => !region || DMAP[e.id].region === region) : []), [sel, specIndex, region]);
  const byId = useMemo(() => Object.fromEntries(rows.map((e) => [e.id, e])), [rows]);
  const totals = rows.reduce((a, e) => ({ emp: a.emp + e.employed, vol: a.vol + e.volume, main: a.main + (e.rank === 1 ? 1 : 0) }), { emp: 0, vol: 0, main: 0 });
  const filtered = SPECS.filter((s) => !q || [s.uz, s.ru, s.en].some((n) => n.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="wrap">
      <div className="sec-h"><div><h1>{t('specsPageTitle')}</h1><p className="lead">{t('specsPageSub')}</p></div><SampleBadge /></div>
      <div className="specs-layout">
        <aside className="card specs-cat">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={'🔎 ' + t('specFilter')} />
          {Object.entries(SPEC_CATS).map(([cid, c]) => {
            const items = filtered.filter((s) => s.cat === cid);
            if (!items.length) return null;
            return (
              <div key={cid} className="specs-group">
                <h4>{c.icon} {t.n(c)}</h4>
                {items.map((s) => (
                  <a key={s.id} href={`#/specs/${s.id}`} className={`spec-item ${sel === s.id ? 'on' : ''}`}>
                    <span>{t.n(s)}</span><small>{(specIndex[s.id] || []).length}</small>
                  </a>
                ))}
              </div>
            );
          })}
        </aside>

        <div>
          {!sp ? (
            <div className="spec-tiles">
              {[...SPECS].sort((a, b) => (specIndex[b.id]?.length || 0) - (specIndex[a.id]?.length || 0)).map((s) => (
                <a key={s.id} href={`#/specs/${s.id}`} className="card spec-tile">
                  <span className="spec-ic">{SPEC_CATS[s.cat].icon}</span>
                  <div><b>{t.n(s)}</b><small>{(specIndex[s.id] || []).length} {t('districtsWith')} · {(specIndex[s.id] || []).filter((e) => e.rank === 1).length} {t('asMain')}</small></div>
                </a>
              ))}
            </div>
          ) : (
            <>
              <div className="card spec-hero">
                <div className="spec-h">
                  <span className="spec-ic">{SPEC_CATS[sp.cat].icon}</span>
                  <div><span className="spec-rank">{t.n(SPEC_CATS[sp.cat])}</span><h2>{t.n(sp)}</h2></div>
                  <button className="btn ghost x-btn" onClick={() => go('specs')}>× </button>
                </div>
                <p className="spec-desc">{t.n(sp.desc)}</p>
                <div className="spec-kpis four">
                  <div><span>{t('districts')}</span><b>{rows.length}</b><small>{totals.main} {t('asMain')}</small></div>
                  <div><span>{t('totalEmployed')}</span><b>{num(totals.emp, 0, lang)}</b><small>{t('people')}</small></div>
                  <div><span>{t('totalVolume')}</span><b>{num(totals.vol, totals.vol < 100 ? 1 : 0, lang)}</b><small>{t.n(sp.unit)}</small></div>
                  <div><span>{t('laborAvail')}: {t('ease_easy')}</span><b>{rows.filter((e) => e.ease === 'easy').length}</b><small>{t('districts')}</small></div>
                </div>
                <div className="spec-opp"><b>💡 {t('opportunity')}:</b> {t.n(SPEC_CATS[sp.cat].opp)}</div>
              </div>
              <div className="card">
                <div className="row between wrapw">
                  <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">{t('allRegions')}</option>
                    {REGIONS.map((r) => <option key={r.code} value={r.code}>{dname(r, lang)}</option>)}
                  </select>
                  <small className="muted">{t('specMapHint')}</small>
                </div>
                <MapView height={380} colorFn={(x) => (byId[x] ? RANK_COLOR[byId[x].rank - 1] : '#eef2f6')} onClick={(x) => go('d/' + x)}
                  highlight={region ? new Set(rows.map((e) => e.id)) : null}
                  tooltipFn={(x) => `<b>${dname(DMAP[x], lang)}</b>${byId[x] ? `<br>${t.n(sp)}: ${byId[x].rank === 1 ? t('mainSpec') : byId[x].rank + t('nthSpec')}<br>${t('employedIn')}: ${num(byId[x].employed, 0, lang)}` : ''}`} />
              </div>
              <div className="card table-scroll">
                <table className="rtable">
                  <thead><tr><th>#</th><th>{t('district')}</th><th>{t('region')}</th><th>{t('volume')}, {t.n(sp.unit)}</th><th>{t('employedIn')}</th><th>{t('households')}</th><th>{t('incomeHere')}</th><th>{t('laborAvail')}</th><th>{t('riskIdx')}</th></tr></thead>
                  <tbody>{rows.map((e, i) => (
                    <tr key={e.id} onClick={() => go('d/' + e.id)}>
                      <td>{i + 1}</td>
                      <td><b>{dname(DMAP[e.id], lang)}</b> {e.rank === 1 && <span className="tag ok">{t('mainSpec')}</span>}</td>
                      <td className="muted">{dname(regionOf(e.id), lang)}</td>
                      <td>{num(e.volume, e.volume < 100 ? 1 : 0, lang)}</td>
                      <td>{num(e.employed, 0, lang)}</td>
                      <td>{num(e.households, 0)}%</td>
                      <td>{num(recs[e.id].v.wage * (1 + e.premium / 100), 0, lang)} <small className="muted">+{num(e.premium, 0)}%</small></td>
                      <td><span style={{ color: EASE_COLOR[e.ease], fontWeight: 600 }}>● {t('ease_' + e.ease)}</span> <small className="muted">{num(e.reserve, 0, lang)}</small></td>
                      <td><RiskBadge value={results[e.id].risk} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <small className="muted">{t('specSource')}</small>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
