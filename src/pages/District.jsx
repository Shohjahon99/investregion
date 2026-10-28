import { Fragment, useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, dname, go } from '../store.jsx';
import { ScoreRing, RiskBadge, SampleBadge, Sparkline, LineChart, HBar, SectorSelect, regionOf, PALETTE } from '../components/ui.jsx';
import { MiniMap } from '../components/MapView.jsx';
import { SpecCard, SpecChip } from '../components/Specs.jsx';
import { GROUPS, INDICATORS, INDEX_GROUPS, IND, SOURCES, SECTORS, YEARS } from '../data/catalog.js';
import { topFactors, reliability, isStale, riskLevel } from '../lib/methodology.js';
import { fmtInd, unit, branch, crop, fmtDate, num, colorAttr, riskColor } from '../lib/format.js';

export function useAverages() {
  const { recs } = useApp();
  return useMemo(() => {
    const ids = DISTRICTS.map((d) => d.id);
    const avg = (list) => {
      const v = {}, s = {};
      for (const i of INDICATORS) {
        v[i.id] = list.reduce((a, id) => a + recs[id].v[i.id], 0) / list.length;
        s[i.id] = YEARS.map((_, y) => list.reduce((a, id) => a + recs[id].s[i.id][y], 0) / list.length);
      }
      return { v, s };
    };
    const byRegion = {};
    for (const code of new Set(ids.map((id) => DMAP[id].region))) byRegion[code] = avg(ids.filter((id) => DMAP[id].region === code));
    return { rep: avg(ids), byRegion };
  }, [recs]);
}

function Parts({ id, rec, t }) {
  const p = rec.parts[id];
  if (id === 'output') return <div className="parts">{['ind', 'agr', 'srv'].map((k) => <span key={k}>{t('parts_' + k)}: <b>{num(p[k], 0, t.lang)}</b></span>)}</div>;
  if (id === 'inv') return <div className="parts"><span>{t('foreignShare')}: <b>{num(p.foreign * 100, 0)}%</b></span></div>;
  if (id === 'churn') return <div className="parts"><span>{t('opened')}: <b>{num(p.opened)}</b></span><span>{t('closed')}: <b>{num(p.closed)}</b></span></div>;
  if (id === 'rent') return <div className="parts">{['shop', 'office', 'wh'].map((k) => <span key={k}>{t(k)}: <b>{num(p[k])}</b></span>)}<span className="muted">{t('listings')} · n={p.n}{p.n < 10 ? ' ⚠' : ''}</span></div>;
  if (id === 'util') return <div className="parts">{['el', 'gas', 'water'].map((k) => <span key={k}>{t(k)}: <b>{num(p[k], 1)}</b></span>)}</div>;
  if (id === 'dist') return <div className="parts">{[['center', 'd_center'], ['rail', 'd_rail'], ['air', 'd_air'], ['border', 'd_border']].map(([k, l]) => <span key={k}>{t(l)}: <b>{p[k]} km</b></span>)}</div>;
  if (id === 'lead') return <div className="parts">{rec.lists.lead.map((l) => <span key={l.id}>{branch(l.id, t)} <b>{num(l.share, 0)}%</b></span>)}</div>;
  if (id === 'agri') return <div className="parts">{rec.lists.agri.length ? rec.lists.agri.map((a) => <span key={a.id}>{crop(a.id, t)} <b>{num(a.t, 1)}</b></span>) : <span className="muted">—</span>}</div>;
  return null;
}

export default function District({ id }) {
  const { t, lang, results, recs, sector, ranks, offers, compare, toggleCompare, prevResults, scales } = useApp();
  const [open, setOpen] = useState(null);
  const avgs = useAverages();
  const d = DMAP[id];
  if (!d) return <div className="wrap"><h2>{t('notFound')}</h2></div>;
  const rec = recs[id], r = results[id], rel = reliability(rec);
  const reg = regionOf(id);
  const rAvg = avgs.byRegion[d.region];
  const sec = SECTORS.find((s) => s.id === sector);
  const here = offers.filter((o) => o.district === id);
  const repA = DISTRICTS.reduce((a, x) => a + results[x.id].attr, 0) / DISTRICTS.length;
  const dRank = ranks.prev[id] - ranks.rep[id];

  return (
    <div className="wrap district">
      <div className="crumbs"><a href="#/map">{t('nav_map')}</a> / <span>{dname(reg, lang)}</span> / <b>{dname(d, lang)}</b></div>
      <div className="d-head">
        <div>
          <div className="row gap wrapw"><SampleBadge /><span className="badge">SOATO {id}</span>{rel.low && <span className="badge warnb" title={t('lowRelT')}>⚠ {t('lowRel')}</span>}</div>
          <h1>{dname(d, lang)}</h1>
          <p className="muted">{dname(reg, lang)} · {num(rec.v.pop, 1, lang)} {unit('pop', t)} · {num(d.area, 0, lang)} km²</p>
          <div className="chips spec-chips">{rec.lists.specs.map((x) => <SpecChip key={x.id} id={x.id} rank={x.rank} />)}</div>
        </div>
        <div className="row gap wrapw">
          <SectorSelect />
          <button className="btn ghost" onClick={() => toggleCompare(id)}>{compare.includes(id) ? '✓ ' + t('inCompare') : '+ ' + t('addCompare')}</button>
          <button className="btn ghost" onClick={() => go('calc/' + id)}>🧮 {t('nav_calc')}</button>
          <button className="btn primary" onClick={() => go('report/' + id)}>📄 {t('pdf')}</button>
        </div>
      </div>

      <div className="d-top">
        <div className="card d-index">
          <div className="row gap center">
            <ScoreRing value={r.attr} size={120} label={t('attr')} />
            <ScoreRing value={r.risk} size={120} kind="risk" label={t('risk')} />
            <div className="d-rankbox">
              <div><b>#{ranks.rep[id]}</b> <small>{t('of')} 199 · {t('inRepublic')}</small></div>
              <div><b>#{ranks.reg[id]}</b> <small>{t('inRegion')}</small></div>
              <div className={dRank >= 0 ? 'up' : 'down'}>{dRank >= 0 ? '▲' : '▼'} {Math.abs(dRank)} <small>{t('change')}</small></div>
              <RiskBadge value={r.risk} />
            </div>
          </div>
          <small className="muted">{sec.icon} {t.n(sec)} · {t('repAvg')}: {Math.round(repA)} · {YEARS.at(-2)}: {Math.round(prevResults[id].attr)}</small>
        </div>
        <div className="card">
          <h4>{t('why')}</h4>
          <ul className="factors big">
            {topFactors(r, sector).map((f, i) => (
              <li key={f.group}><span className="fnum">{i + 1}</span><div><b>{t.n(INDEX_GROUPS.find((g) => g.id === f.group))}</b> · {Math.round(f.score)}/100
                <small>{t.n(IND[f.worst])}: {fmtInd(f.worst, rec.v[f.worst], t)} {unit(f.worst, t)} ({t('repAvg').toLowerCase()}: {fmtInd(f.worst, avgs.rep.v[f.worst], t)})</small></div></li>
            ))}
          </ul>
          <h4>{t('whyRisk')}</h4>
          <ul className="factors">
            {topFactors(r, sector, 'risk').map((f) => {
              const G = INDEX_GROUPS.find((g) => g.id === f.group);
              return <li key={f.group}><i style={{ background: riskColor[riskLevel(f.score)] }} /><b>{t.n(G.risk)}</b> <small>{Math.round(f.score)}/100</small></li>;
            })}
          </ul>
        </div>
        <div className="card">
          <h4>{t('groupScores')}</h4>
          {INDEX_GROUPS.map((G) => (
            <div key={G.id} className="gscore">
              <span>{t.n(G)} <small>{Math.round(sec.w[G.id] * 100)}%</small></span>
              <HBar value={r.g[G.id]} color={colorAttr(Math.max(40, r.g[G.id]))} />
              <b>{Math.round(r.g[G.id])}</b>
            </div>
          ))}
          <div className="dmini"><MiniMap region={d.region} selected={id} colorFn={(x) => (x === id ? '#0f766e' : scales.attr.color(results[x].attr))} onClick={(x) => go('d/' + x)} titleFn={(x) => `${dname(DMAP[x], lang)} · ${Math.round(results[x].attr)}`} /></div>
        </div>
      </div>

      <section className="d-specs">
        <div className="sec-h"><div><h2>⭐ {t('specsTitle')} <small className="muted">· {rec.lists.specs.length}</small></h2>{rec.lists.specsUpdated && <span className="tag ok">✓ {t('specEdited')} · {fmtDate(rec.lists.specsUpdated)}</span>}<p className="muted">{t('specsSub')}</p></div></div>
        <div className={`spec-grid n${rec.lists.specs.length}`}>
          {rec.lists.specs.map((x) => <SpecCard key={x.id} x={x} districtId={id} />)}
        </div>
        <small className="muted">{t('specSource')}</small>
      </section>

      <div className="d-lead card">
        <div><h4>{t('leading')}</h4><div className="chips">{rec.lists.lead.map((l, i) => <span key={l.id} className="chip" style={{ borderColor: PALETTE[i] }}>{branch(l.id, t)} <b>{num(l.share, 0)}%</b></span>)}</div></div>
        <div><h4>{t.n(IND.agri)}</h4><div className="chips">{rec.lists.agri.length ? rec.lists.agri.map((a) => <span key={a.id} className="chip">{crop(a.id, t)} <b>{num(a.t, 0)} {unit('agri', t)}</b></span>) : <span className="muted">—</span>}</div></div>
        <div><h4>{t.n(IND.sez)}</h4><span className={rec.v.sez ? 'badge risk-low' : 'badge'}>{rec.v.sez ? '✓ ' + t('yes') : t('no')}</span></div>
      </div>

      <h2>{t('allIndicators')} <small className="muted">· 8 / {INDICATORS.length}</small></h2>
      <div className="ind-groups">
        {GROUPS.map((G) => (
          <div key={G.id} className="card ind-group">
            <h3>{G.icon} {t.n(G)}</h3>
            <table className="itable">
              <tbody>
                {INDICATORS.filter((i) => i.g === G.id).map((i) => {
                  const x = rec.v[i.id], a = avgs.rep.v[i.id];
                  const diff = i.fmt !== 'list' && i.fmt !== 'bool' && a ? ((x - a) / a) * 100 : null;
                  const good = diff == null || i.dir === 0 ? null : diff * i.dir >= 0;
                  const stale = isStale(i.id, rec.upd[i.id]);
                  const isOpen = open === i.id;
                  return (
                    <Fragment key={i.id}>
                      <tr className={isOpen ? 'open' : ''} onClick={() => setOpen(isOpen ? null : i.id)}>
                        <td className="iname">{t.n(i)}
                          <div className="imeta">
                            <span title={t.n(SOURCES[i.src])}>{SOURCES[i.src].short}</span> · <span>{fmtDate(rec.upd[i.id], lang)}</span>
                            {stale && <span className="tag stale">{t('stale')}</span>}{i.expert && <span className="tag exp">{t('expert')}</span>}
                          </div>
                        </td>
                        <td className="ival">{i.fmt === 'list' ? (i.id === 'lead' ? rec.lists.lead.map((l) => branch(l.id, t)).join(', ') : rec.lists.agri.map((c) => crop(c.id, t)).join(', ') || '—') : <><b>{fmtInd(i.id, x, t)}</b> {i.fmt !== 'bool' && <small>{unit(i.id, t)}</small>}</>}</td>
                        <td className="ispark">{i.fmt !== 'list' && i.fmt !== 'bool' && <Sparkline data={rec.s[i.id]} refLine={avgs.rep.s[i.id]} />}</td>
                        <td className={`idiff ${good == null ? '' : good ? 'good' : 'bad'}`}>{diff != null && i.fmt !== 'bool' ? `${diff > 0 ? '+' : ''}${num(diff, 0)}%` : ''}</td>
                      </tr>
                      {isOpen && (
                        <tr className="iexp"><td colSpan={4}>
                          <Parts id={i.id} rec={rec} t={t} />
                          {i.fmt !== 'list' && i.fmt !== 'bool' && (
                            <LineChart fmt={(v) => fmtInd(i.id, v, t)} series={[
                              { name: dname(d, lang), data: rec.s[i.id], color: '#0f766e' },
                              { name: t('regAvg'), data: rAvg.s[i.id], color: '#2563eb', dash: true },
                              { name: t('repAvg'), data: avgs.rep.s[i.id], color: '#94a3b8', dash: true },
                            ]} />
                          )}
                          <small className="muted">{t('source')}: {t.n(SOURCES[i.src])} · {t('updated')}: {fmtDate(rec.upd[i.id], lang)} · {i.dir === 1 ? t('higherBetter') : i.dir === -1 ? t('lowerBetter') : ''}</small>
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="d-bottom">
        <div className="card">
          <h3>{t('offersHere')} <span className="pill">{here.length}</span></h3>
          {here.length ? here.map((o) => (
            <a key={o.id} className="offer-row" href={`#/offers/${o.id}`}>
              <span className={`otype ${o.type}`}>{t('t_' + o.type)}</span><b>{t.n(o.title)}</b>
              <small>{o.area} {o.areaUnit === 'm2' ? 'm²' : 'ga'} · {o.priceUnit === 'musd' ? `$${o.price}m` : `${num(o.price)} ${t('mlnSum')}`}</small>
            </a>
          )) : <p className="muted">{t('none')}</p>}
        </div>
        <div className="card contact">
          <h3>{t('contact')}</h3>
          <p><b>{t('contactDept')}</b><br />{dname(d, lang)} {lang === 'uz' ? 'hokimligi' : lang === 'ru' ? '— хокимият' : 'khokimiyat'}</p>
          <p>{rec.contact.person}<br /><span className="muted">+998 (xx) xxx-xx-xx · {t('sample').toLowerCase()}</span></p>
          <button className="btn primary" onClick={() => alert(t('sampleNote'))}>✉ {t('writeMsg')}</button>
        </div>
      </div>
    </div>
  );
}
