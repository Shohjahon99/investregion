import { useApp, DMAP, dname } from '../store.jsx';
import { ScoreRing, HBar, Radar, PALETTE, regionOf } from '../components/ui.jsx';
import { GROUPS, INDICATORS, INDEX_GROUPS, IND, SOURCES, SECTORS } from '../data/catalog.js';
import { topFactors, reliability, riskLevel, METHOD_VERSION } from '../lib/methodology.js';
import { fmtInd, unit, branch, fmtDate, num, colorAttr } from '../lib/format.js';
import { costOf } from './Calculator.jsx';
import { TODAY } from '../data/generate.js';
import { SPEC } from '../data/specs.js';
import { LANGS } from '../i18n.js';

export default function Report({ ids: raw }) {
  const { t, lang, setLang, results, recs, sector, ranks } = useApp();
  const ids = (raw || '').split(',').filter((id) => DMAP[id]).slice(0, 5);
  if (!ids.length) return <div className="wrap"><h2>{t('notFound')}</h2></div>;
  const sec = SECTORS.find((s) => s.id === sector);
  const scen = { emp: 100, space: 2000, kind: 'wh', land: 0, mult: 1 };

  return (
    <div className="report-page">
      <div className="report-bar noprint">
        <button className="btn ghost" onClick={() => history.back()}>← {t('back')}</button>
        <div className="lang">{LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.id.toUpperCase()}</button>)}</div>
        <button className="btn primary" onClick={() => window.print()}>⬇ {t('print')}</button>
      </div>
      <article className="sheet">
        <header className="sh-head">
          <div><b className="sh-brand">{t('brand')}</b><small>{t('brandSub')}</small></div>
          <div className="sh-meta">{t('generated')}: {fmtDate(TODAY.toISOString(), lang)}<br />{t('sector')}: {t.n(sec)} · v{METHOD_VERSION}</div>
        </header>
        <h1>{t('reportTitle')}</h1>
        <h2 className="sh-title">{ids.map((id) => dname(DMAP[id], lang)).join(' · ')}</h2>
        <div className="sh-sample">◔ {t('sampleNote')}</div>

        {ids.length === 1 ? <Single id={ids[0]} scen={scen} /> : (
          <>
            <div className="sh-cmp">
              {ids.map((id, k) => (
                <div key={id} className="sh-cmpc" style={{ borderTop: `3px solid ${PALETTE[k]}` }}>
                  <b>{dname(DMAP[id], lang)}</b><small>{dname(regionOf(id), lang)}</small>
                  <div className="row gap center"><ScoreRing value={results[id].attr} size={64} label={t('attr')} /><ScoreRing value={results[id].risk} size={64} kind="risk" label={t('risk')} /></div>
                  <small>#{ranks.rep[id]} / 199 · {t(riskLevel(results[id].risk))}</small>
                  <small>⭐ {recs[id].lists.specs.map((x) => t.n(SPEC[x.id])).join(', ')}</small>
                </div>
              ))}
            </div>
            <div className="sh-two">
              <Radar axes={INDEX_GROUPS.map((g) => t.n(g))} series={ids.map((id, k) => ({ color: PALETTE[k], data: INDEX_GROUPS.map((g) => results[id].g[g.id]) }))} size={300} />
              <table className="sh-table">
                <thead><tr><th>{t('costs')}</th>{ids.map((id, k) => <th key={id} style={{ color: PALETTE[k] }}>{dname(DMAP[id], lang)}</th>)}</tr></thead>
                <tbody>
                  {[['annualRent', 'rent'], ['payroll', 'payroll'], ['totalYear', 'total']].map(([lbl, k]) => (
                    <tr key={k}><td>{t(lbl)}, {t('mlnSum')}</td>{ids.map((id) => <td key={id}>{num(costOf(recs[id], scen)[k], 0, lang)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <table className="sh-table">
              <thead><tr><th /><th />{ids.map((id, k) => <th key={id} style={{ color: PALETTE[k] }}>{dname(DMAP[id], lang)}</th>)}</tr></thead>
              <tbody>
                {GROUPS.map((G) => [
                  <tr key={G.id} className="gh"><td colSpan={ids.length + 2}>{t.n(G)}</td></tr>,
                  ...INDICATORS.filter((i) => i.g === G.id && i.fmt !== 'list').map((i) => (
                    <tr key={i.id}><td>{t.n(i)}</td><td className="u">{unit(i.id, t)}</td>{ids.map((id) => <td key={id}>{fmtInd(i.id, recs[id].v[i.id], t)}</td>)}</tr>
                  )),
                ])}
              </tbody>
            </table>
          </>
        )}
        <footer className="sh-foot">{t('footerData')} · {t('nav_method')}: {location.origin}{location.pathname}#/method</footer>
      </article>
    </div>
  );
}

function Single({ id, scen }) {
  const { t, lang, results, recs, sector, ranks } = useApp();
  const r = results[id], rec = recs[id], rel = reliability(rec), c = costOf(rec, scen);
  return (
    <>
      <p className="sh-sub">{dname(regionOf(id), lang)} · SOATO {id} · {num(rec.v.pop, 1, lang)} {unit('pop', t)} · {num(DMAP[id].area, 0, lang)} km²</p>
      <div className="sh-kpis">
        <div><ScoreRing value={r.attr} size={92} label={t('attr')} /></div>
        <div><ScoreRing value={r.risk} size={92} kind="risk" label={t('risk')} /></div>
        <div className="sh-k"><b>#{ranks.rep[id]}</b><small>{t('of')} 199</small><b>#{ranks.reg[id]}</b><small>{t('inRegion')}</small></div>
        <div className="sh-k"><b className={`risk-t-${riskLevel(r.risk)}`}>{t(riskLevel(r.risk))}</b><small>{t('riskIdx')}</small>{rel.low && <b className="risk-t-high">⚠ {t('lowRel')}</b>}</div>
      </div>
      <div className="sh-two">
        <div>
          <h3>{t('why')}</h3>
          <ol className="sh-list">{topFactors(r, sector).map((f) => <li key={f.group}><b>{t.n(INDEX_GROUPS.find((g) => g.id === f.group))}</b> ({Math.round(f.score)}/100) — {t.n(IND[f.worst])}: {fmtInd(f.worst, rec.v[f.worst], t)} {unit(f.worst, t)}</li>)}</ol>
          <h3>{t('whyRisk')}</h3>
          <ol className="sh-list">{topFactors(r, sector, 'risk').map((f) => <li key={f.group}>{t.n(INDEX_GROUPS.find((g) => g.id === f.group).risk)} ({Math.round(f.score)})</li>)}</ol>
          <h3>{t('leading')}</h3>
          <p>{rec.lists.lead.map((l) => `${branch(l.id, t)} ${num(l.share, 0)}%`).join(' · ')}</p>
        </div>
        <div>
          <h3>{t('groupScores')}</h3>
          {INDEX_GROUPS.map((G) => <div key={G.id} className="gscore"><span>{t.n(G)}</span><HBar value={r.g[G.id]} color={colorAttr(Math.max(40, r.g[G.id]))} /><b>{Math.round(r.g[G.id])}</b></div>)}
          <h3>{t('costs')} <small>({scen.emp} × {scen.space} m²)</small></h3>
          <table className="sh-table"><tbody>
            <tr><td>{t('annualRent')}</td><td>{num(c.rent, 0, lang)} {t('mlnSum')}</td></tr>
            <tr><td>{t('payroll')}</td><td>{num(c.payroll, 0, lang)} {t('mlnSum')}</td></tr>
            <tr><td>{t('social')}</td><td>{num(c.social, 0, lang)} {t('mlnSum')}</td></tr>
            <tr className="gh"><td>{t('totalYear')}</td><td>{num(c.total, 0, lang)} {t('mlnSum')}</td></tr>
          </tbody></table>
        </div>
      </div>
      <h3>⭐ {t('specsTitle')}</h3>
      <table className="sh-table">
        <thead><tr><th>{t('specFilter')}</th><th>{t('volume')}</th><th>{t('employedIn')}</th><th>{t('households')}</th><th>{t('incomeHere')}</th><th>{t('laborAvail')}</th></tr></thead>
        <tbody>{rec.lists.specs.map((x) => (
          <tr key={x.id}><td><b>{t.n(SPEC[x.id])}</b>{x.rank === 1 ? ` (${t('mainSpec')})` : ''}</td>
            <td>{num(x.volume, x.volume < 100 ? 1 : 0, lang)} {t.n(SPEC[x.id].unit)}</td><td>{num(x.employed, 0, lang)}</td><td>{num(x.households, 0)}%</td>
            <td>{num(rec.v.wage * (1 + x.premium / 100), 0, lang)} (+{num(x.premium, 0)}%)</td><td>{t('ease_' + x.ease)} · {num(x.reserve, 0, lang)}</td></tr>
        ))}</tbody>
      </table>
      <h3>{t('allIndicators')}</h3>
      <table className="sh-table">
        <thead><tr><th>{t('indicators')}</th><th>{t('value')}</th><th>{t('source')}</th><th>{t('updated')}</th></tr></thead>
        <tbody>
          {GROUPS.map((G) => [
            <tr key={G.id} className="gh"><td colSpan={4}>{t.n(G)}</td></tr>,
            ...INDICATORS.filter((i) => i.g === G.id).map((i) => (
              <tr key={i.id}><td>{t.n(i)}{i.expert ? ' *' : ''}</td>
                <td>{i.fmt === 'list' ? (i.id === 'lead' ? rec.lists.lead.map((l) => branch(l.id, t)).join(', ') : rec.lists.agri.length || '—') : `${fmtInd(i.id, rec.v[i.id], t)} ${unit(i.id, t)}`}</td>
                <td>{SOURCES[i.src].short}</td><td>{fmtDate(rec.upd[i.id], lang)}</td></tr>
            )),
          ])}
        </tbody>
      </table>
      <p className="sh-note">* {t('expert')}</p>
    </>
  );
}
