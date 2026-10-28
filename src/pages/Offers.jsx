import { useMemo, useState } from 'react';
import { useApp, DMAP, REGIONS, dname, go } from '../store.jsx';
import MapView, { OFFER_COLOR } from '../components/MapView.jsx';
import { SampleBadge, ScoreRing, RiskBadge, regionOf } from '../components/ui.jsx';
import { num, fmtDate } from '../lib/format.js';
import { SECTORS } from '../data/catalog.js';

export default function Offers({ id }) {
  const { t, lang, offers, results } = useApp();
  const [type, setType] = useState('');
  const [sec, setSec] = useState('');
  const [region, setRegion] = useState('');
  const list = useMemo(() => offers.filter((o) => (!type || o.type === type) && (!sec || o.sector === sec) && (!region || DMAP[o.district].region === region)), [offers, type, sec, region]);
  const markers = useMemo(() => list.map((o) => ({ ...o, label: `${t.n(o.title)} · ${dname(DMAP[o.district], lang)}` })), [list, t, lang]);
  const sel = id ? offers.find((o) => o.id === id) : null;
  const price = (o) => (o.priceUnit === 'musd' ? `$${num(o.price, 1, lang)} ${lang === 'en' ? 'm' : 'mln'}` : `${num(o.price, 0, lang)} ${t('mlnSum')}`);

  return (
    <div className="wrap">
      <div className="sec-h"><div><h1>{t('offersTitle')}</h1><p className="muted">{list.length} / {offers.length}</p></div><SampleBadge /></div>
      <div className="row gap wrapw filters">
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="">{t('allTypes')}</option>{['project', 'land', 'building'].map((k) => <option key={k} value={k}>{t('t_' + k)}</option>)}</select>
        <select value={sec} onChange={(e) => setSec(e.target.value)}><option value="">{t('sector')}: {t('all')}</option>{SECTORS.slice(1).map((s) => <option key={s.id} value={s.id}>{s.icon} {t.n(s)}</option>)}</select>
        <select value={region} onChange={(e) => setRegion(e.target.value)}><option value="">{t('allRegions')}</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{dname(r, lang)}</option>)}</select>
        <div className="mlegend">{['project', 'land', 'building'].map((k) => <span key={k}><i style={{ background: OFFER_COLOR[k] }} />{t('t_' + k)}</span>)}</div>
      </div>
      <div className="offers">
        <div className="card offers-map">
          <MapView height={600} colorFn={(x) => (region && DMAP[x].region !== region ? '#f8fafc' : '#e2e8f0')} markers={markers} onMarker={(o) => go('offers/' + o.id)}
            focus={sel ? [sel.district] : null} selected={sel?.district} tooltipFn={(x) => `<b>${dname(DMAP[x], lang)}</b>`} onClick={(x) => go('d/' + x)} />
        </div>
        <div className="offers-list">
          {sel && (
            <div className="card offer-detail">
              <button className="x" onClick={() => go('offers')}>×</button>
              <span className={`otype ${sel.type}`}>{t('t_' + sel.type)}</span> <small className="muted">{sel.id}</small>
              <h2>{t.n(sel.title)}</h2>
              <p><a href={`#/d/${sel.district}`}>{dname(DMAP[sel.district], lang)}</a>, {dname(regionOf(sel.district), lang)}</p>
              <div className="kv">
                <div><span>{t('area')}</span><b>{num(sel.area, 1, lang)} {sel.areaUnit === 'm2' ? 'm²' : 'ga'}</b></div>
                <div><span>{t('price')}</span><b>{price(sel)}</b></div>
                {sel.irr && <div><span>{t('irr')}</span><b>{sel.irr}%</b></div>}
                {sel.jobs && <div><span>{t('jobs')}</span><b>{sel.jobs}</b></div>}
                <div><span>{t('deadline')}</span><b>{fmtDate(sel.deadline, lang)}</b></div>
                <div><span>{t('sector')}</span><b>{t.n(SECTORS.find((s) => s.id === sel.sector))}</b></div>
              </div>
              <div className="row gap"><ScoreRing value={results[sel.district].attr} size={64} label={t('attr')} /><RiskBadge value={results[sel.district].risk} /></div>
              <div className="row gap"><button className="btn primary" onClick={() => alert(t('sampleNote'))}>✉ {t('writeMsg')}</button><button className="btn ghost" onClick={() => go('d/' + sel.district)}>{t('openCard')}</button></div>
            </div>
          )}
          {list.slice(0, 60).map((o) => (
            <a key={o.id} href={`#/offers/${o.id}`} className={`card offer ${sel?.id === o.id ? 'on' : ''}`}>
              <span className={`otype ${o.type}`}>{t('t_' + o.type)}</span>
              <b>{t.n(o.title)}</b>
              <small>{dname(DMAP[o.district], lang)} · {dname(regionOf(o.district), lang)}</small>
              <div className="offer-k"><span>{num(o.area, 1, lang)} {o.areaUnit === 'm2' ? 'm²' : 'ga'}</span><span>{price(o)}</span>{o.irr && <span>IRR {o.irr}%</span>}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
