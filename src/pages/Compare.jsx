import { useApp, DMAP, dname, go } from '../store.jsx';
import { ScoreRing, RiskBadge, Radar, DistrictSearch, SectorSelect, LineChart, PALETTE, regionOf, SampleBadge } from '../components/ui.jsx';
import { GROUPS, INDICATORS, INDEX_GROUPS } from '../data/catalog.js';
import { fmtInd, unit, branch, num } from '../lib/format.js';
import { SpecChip } from '../components/Specs.jsx';
import { reliability } from '../lib/methodology.js';
import { Fragment, useState } from 'react';

export default function Compare() {
  const { t, lang, compare, setCompare, toggleCompare, results, recs, ranks, ranks: { sorted } } = useApp();
  const [chartInd, setChartInd] = useState('grppc');
  const ids = compare.filter((id) => DMAP[id]);
  const suggest = () => setCompare(sorted.slice(0, 3));

  return (
    <div className="wrap">
      <div className="sec-h">
        <div><h1>{t('compareTitle')}</h1><p className="muted">{t('compareHint')} · {ids.length}/5</p></div>
        <div className="row gap wrapw">
          <SectorSelect />
          {ids.length < 5 && <DistrictSearch onPick={toggleCompare} exclude={ids} placeholder={'+ ' + t('add')} />}
          {ids.length > 0 && <button className="btn ghost" onClick={() => setCompare([])}>{t('clear')}</button>}
          {ids.length >= 2 && <button className="btn primary" onClick={() => go('report/' + ids.join(','))}>📄 {t('pdf')}</button>}
        </div>
      </div>

      {ids.length < 2 ? (
        <div className="card empty">
          <p>{t('compareHint')}</p>
          <button className="btn primary" onClick={suggest}>⚡ {t('topFor')} (3)</button>
        </div>
      ) : (
        <>
          <div className="cmp-cards" style={{ gridTemplateColumns: `repeat(${ids.length}, minmax(0,1fr))` }}>
            {ids.map((id, k) => (
              <div key={id} className="card cmp-card" style={{ borderTop: `4px solid ${PALETTE[k]}` }}>
                <button className="x" onClick={() => toggleCompare(id)}>×</button>
                <a href={`#/d/${id}`}><h3>{dname(DMAP[id], lang)}</h3></a>
                <small className="muted">{dname(regionOf(id), lang)}</small>
                <div className="row gap center"><ScoreRing value={results[id].attr} size={78} label={t('attr')} /><ScoreRing value={results[id].risk} size={78} kind="risk" label={t('risk')} /></div>
                <div>#{ranks.rep[id]} / 199</div>
                <RiskBadge value={results[id].risk} />
                {reliability(recs[id]).low && <div className="warn">⚠ {t('lowRel')}</div>}
              </div>
            ))}
          </div>

          <div className="cmp-charts">
            <div className="card">
              <h3>{t('groupScores')}</h3>
              <Radar axes={INDEX_GROUPS.map((g) => t.n(g))} series={ids.map((id, k) => ({ color: PALETTE[k], data: INDEX_GROUPS.map((g) => results[id].g[g.id]) }))} size={340} />
              <div className="legend">{ids.map((id, k) => <span key={id}><i style={{ background: PALETTE[k] }} />{dname(DMAP[id], lang)}</span>)}</div>
            </div>
            <div className="card">
              <div className="row between"><h3>{t('dynamics')}</h3>
                <select value={chartInd} onChange={(e) => setChartInd(e.target.value)}>
                  {INDICATORS.filter((i) => !['list', 'bool'].includes(i.fmt)).map((i) => <option key={i.id} value={i.id}>{t.n(i)}</option>)}
                </select>
              </div>
              <LineChart fmt={(v) => fmtInd(chartInd, v, t)} series={ids.map((id, k) => ({ name: dname(DMAP[id], lang), data: recs[id].s[chartInd], color: PALETTE[k] }))} />
              <small className="muted">{unit(chartInd, t)}</small>
            </div>
          </div>

          <div className="card table-scroll">
            <table className="ctable">
              <thead><tr><th /><SampleBadgeTh />{ids.map((id, k) => <th key={id} style={{ color: PALETTE[k] }}>{dname(DMAP[id], lang)}</th>)}</tr></thead>
              <tbody>
                <tr className="grow"><td colSpan={ids.length + 2}>⭐ {t('specsTitle')}</td></tr>
                <tr><td>{t('specsTitle')}</td><td />{ids.map((id) => <td key={id}><div className="chips">{recs[id].lists.specs.map((x) => <SpecChip key={x.id} id={x.id} rank={x.rank} small />)}</div></td>)}</tr>
                <Row label={`${t('employedIn')} (${t('mainSpec')})`} vals={ids.map((id) => recs[id].lists.specs[0].employed)} fmt={(v) => num(v, 0, lang)} dir={1} />
                <tr className="grow"><td colSpan={ids.length + 2}>{t('attrIdx')} / {t('riskIdx')}</td></tr>
                <Row label={t('attrIdx')} vals={ids.map((id) => results[id].attr)} fmt={(v) => Math.round(v)} dir={1} />
                <Row label={t('riskIdx')} vals={ids.map((id) => results[id].risk)} fmt={(v) => Math.round(v)} dir={-1} />
                {INDEX_GROUPS.map((g) => <Row key={g.id} label={t.n(g)} vals={ids.map((id) => results[id].g[g.id])} fmt={(v) => Math.round(v)} dir={1} sub />)}
                {GROUPS.map((G) => (
                  <Fragment key={G.id}>
                    <tr className="grow"><td colSpan={ids.length + 2}>{G.icon} {t.n(G)}</td></tr>
                    {INDICATORS.filter((i) => i.g === G.id).map((i) => (
                      i.fmt === 'list'
                        ? <tr key={i.id}><td>{t.n(i)}</td><td />{ids.map((id) => <td key={id} className="small">{i.id === 'lead' ? recs[id].lists.lead.map((l) => branch(l.id, t)).join(', ') : recs[id].lists.agri.length}</td>)}</tr>
                        : <Row key={i.id} label={t.n(i)} unit={unit(i.id, t)} vals={ids.map((id) => recs[id].v[i.id])} fmt={(v) => fmtInd(i.id, v, t)} dir={i.dir} />
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SampleBadgeTh() { return <th><SampleBadge /></th>; }

function Row({ label, unit: u, vals, fmt, dir, sub }) {
  const best = dir === 1 ? Math.max(...vals) : dir === -1 ? Math.min(...vals) : null;
  return (
    <tr className={sub ? 'sub' : ''}>
      <td>{label}</td><td className="muted small">{u}</td>
      {vals.map((v, k) => <td key={k} className={best != null && v === best ? 'best' : ''}>{fmt(v)}</td>)}
    </tr>
  );
}
