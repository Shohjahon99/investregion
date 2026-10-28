import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, REGIONS, dname, go } from '../store.jsx';
import MapView, { OFFER_COLOR } from '../components/MapView.jsx';
import { SectorSelect, ScoreRing, RiskBadge, DistrictSearch, regionOf, SampleBadge } from '../components/ui.jsx';
import { colorVal, RAMPS, fmtInd, unit, num } from '../lib/format.js';
import { INDICATORS, GROUPS, IND } from '../data/catalog.js';
import { normalizer, topFactors, reliability } from '../lib/methodology.js';
import { INDEX_GROUPS } from '../data/catalog.js';
import { SPECS, SPEC_CATS, SPEC as SPEC_BY } from '../data/specs.js';
import { SpecChip } from '../components/Specs.jsx';

const NUMERIC = INDICATORS.filter((i) => !['list', 'bool'].includes(i.fmt));

export default function MapPage() {
  const { t, lang, results, recs, sector, ranks, offers, compare, toggleCompare, scales, specIndex } = useApp();
  const [metric, setMetric] = useState('attr');
  const [region, setRegion] = useState('');
  const [sel, setSel] = useState(null);
  const [showOffers, setShowOffers] = useState(false);
  const [focus, setFocus] = useState(null);
  const [spec, setSpec] = useState('');

  const ids = useMemo(() => DISTRICTS.map((d) => d.id), []);
  const scale = useMemo(() => {
    if (metric === 'attr') return { f: (id) => results[id].attr, c: scales.attr.color, ramp: RAMPS.attr, lo: scales.attr.lo, hi: scales.attr.hi };
    if (metric === 'risk') return { f: (id) => results[id].risk, c: scales.risk.color, ramp: RAMPS.risk, lo: scales.risk.lo, hi: scales.risk.hi };
    const n = normalizer(ids.map((id) => recs[id].v[metric]), 1);
    const vals = ids.map((id) => recs[id].v[metric]).sort((a, b) => a - b);
    return { f: (id) => n(recs[id].v[metric]), c: colorVal, ramp: RAMPS.val, lo: vals[Math.floor(vals.length * 0.05)], hi: vals[Math.floor(vals.length * 0.95)], raw: true };
  }, [metric, results, recs, ids, scales]);

  const specOf = useMemo(() => (spec ? Object.fromEntries((specIndex[spec] || []).map((e) => [e.id, e])) : null), [spec, specIndex]);
  const highlight = useMemo(() => {
    const ids = DISTRICTS.filter((d) => (!region || d.region === region) && (!specOf || specOf[d.id])).map((d) => d.id);
    return region || specOf ? new Set(ids) : null;
  }, [region, specOf]);
  const markers = useMemo(() => (showOffers ? offers.filter((o) => !region || DMAP[o.district].region === region).map((o) => ({ ...o, label: `${t.n(o.title)} · ${dname(DMAP[o.district], lang)}` })) : null), [showOffers, offers, region, lang, t]);

  const pick = (id) => { setSel(id); };
  const tip = (id) => {
    const d = DMAP[id];
    const v = metric === 'attr' || metric === 'risk' ? Math.round(results[id][metric]) : `${fmtInd(metric, recs[id].v[metric], t)} ${unit(metric, t)}`;
    const sp = recs[id].lists.specs.map((x) => t.n(SPEC_BY[x.id])).join(', ');
    return `<b>${dname(d, lang)}</b><br><span>${dname(regionOf(id), lang)}</span><br>${metricLabel()}: <b>${v}</b><br><span>⭐ ${sp}</span>`;
  };
  function metricLabel() { return metric === 'attr' ? t('attrIdx') : metric === 'risk' ? t('riskIdx') : t.n(IND[metric]); }

  const r = sel ? results[sel] : null;
  const rel = sel ? reliability(recs[sel]) : null;

  return (
    <div className="mappage">
      <aside className="mp-side">
        <div className="mp-ctrl">
          <DistrictSearch onPick={(id) => { setSel(id); setFocus([id]); }} />
          <SectorSelect />
          <label className="field"><span>{t('colorBy')}</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="attr">{t('attrIdx')}</option>
              <option value="risk">{t('riskIdx')}</option>
              {GROUPS.map((g) => (
                <optgroup key={g.id} label={t.n(g)}>
                  {NUMERIC.filter((i) => i.g === g.id).map((i) => <option key={i.id} value={i.id}>{t.n(i)}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="field"><span>{t('region')}</span>
            <select value={region} onChange={(e) => { setRegion(e.target.value); setFocus(e.target.value ? DISTRICTS.filter((d) => d.region === e.target.value).map((d) => d.id) : ids); }}>
              <option value="">{t('allRegions')}</option>
              {REGIONS.map((x) => <option key={x.code} value={x.code}>{dname(x, lang)}</option>)}
            </select>
          </label>
          <label className="field"><span>⭐ {t('specFilter')}</span>
            <select value={spec} onChange={(e) => setSpec(e.target.value)}>
              <option value="">{t('anySpec')}</option>
              {Object.entries(SPEC_CATS).map(([cid, c]) => (
                <optgroup key={cid} label={`${c.icon} ${t.n(c)}`}>
                  {SPECS.filter((s) => s.cat === cid).map((s) => <option key={s.id} value={s.id}>{t.n(s)} ({(specIndex[s.id] || []).length})</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={showOffers} onChange={(e) => setShowOffers(e.target.checked)} /> {t('showOffers')}</label>
          {showOffers && <div className="mlegend">{['project', 'land', 'building'].map((k) => <span key={k}><i style={{ background: OFFER_COLOR[k] }} />{t('t_' + k)}</span>)}</div>}
          <div className="ramp">
            <div className="ramp-bar" style={{ background: `linear-gradient(90deg, ${scale.ramp.join(',')})` }} />
            <div className="ramp-l"><span>{scale.raw ? fmtInd(metric, scale.lo, t) : Math.round(scale.lo)}</span><span>{metricLabel()}{scale.raw ? `, ${unit(metric, t)}` : ''}</span><span>{scale.raw ? fmtInd(metric, scale.hi, t) : Math.round(scale.hi)}</span></div>
          </div>
        </div>

        {sel ? (
          <div className="mp-card">
            <button className="x" onClick={() => setSel(null)}>×</button>
            <small className="muted">{dname(regionOf(sel), lang)} · SOATO {sel}</small>
            <h2>{dname(DMAP[sel], lang)}</h2>
            <div className="row gap">
              <ScoreRing value={r.attr} size={84} label={t('attr')} />
              <ScoreRing value={r.risk} size={84} kind="risk" label={t('risk')} />
              <div className="mp-rank">
                <b>#{ranks.rep[sel]}</b><small>{t('of')} 199 {t('inRepublic')}</small>
                <b>#{ranks.reg[sel]}</b><small>{t('inRegion')}</small>
              </div>
            </div>
            <div className="chips">{recs[sel].lists.specs.map((x) => <SpecChip key={x.id} id={x.id} rank={x.rank} small />)}</div>
            {rel.low && <div className="warn" title={t('lowRelT')}>⚠ {t('lowRel')}</div>}
            <RiskBadge value={r.risk} />
            <h4>{t('why')}</h4>
            <ul className="factors">
              {topFactors(r, sector).map((f) => (
                <li key={f.group}><b>{t.n(INDEX_GROUPS.find((g) => g.id === f.group))}</b> — {Math.round(f.score)}/100<small>{t.n(IND[f.worst])}</small></li>
              ))}
            </ul>
            <div className="kv">
              {['pop', 'grppc', 'rent', 'wage', 'unemp'].map((k) => <div key={k}><span>{t.n(IND[k])}</span><b>{fmtInd(k, recs[sel].v[k], t)} <small>{unit(k, t)}</small></b></div>)}
            </div>
            <div className="row gap">
              <button className="btn primary" onClick={() => go('d/' + sel)}>{t('openCard')}</button>
              <button className="btn ghost" onClick={() => toggleCompare(sel)}>{compare.includes(sel) ? '✓ ' + t('inCompare') : '+ ' + t('addCompare')}</button>
            </div>
          </div>
        ) : (
          <div className="mp-list">
            <div className="row between"><b>{t('rank')} · {metricLabel()}</b><SampleBadge /></div>
            <small className="muted">{t('map_hint')}</small>
            <ol>
              {[...ids].filter((id) => (!region || DMAP[id].region === region) && (!specOf || specOf[id])).sort((a, b) => scale.f(b) - scale.f(a)).slice(0, 40).map((id) => (
                <li key={id} onClick={() => { pick(id); setFocus([id]); }}>
                  <span>{dname(DMAP[id], lang)}</span>
                  <b>{metric === 'attr' || metric === 'risk' ? Math.round(results[id][metric]) : fmtInd(metric, recs[id].v[metric], t)}</b>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
      <div className="mp-map">
        <MapView height="100%" colorFn={(id) => scale.c(scale.f(id))} tooltipFn={tip} onClick={pick} selected={sel} markers={markers} focus={focus} highlight={highlight}
          onMarker={(o) => go('offers/' + o.id)} />
        <div className="mp-note">{num(199)} · {t('sampleNote')}</div>
      </div>
    </div>
  );
}
