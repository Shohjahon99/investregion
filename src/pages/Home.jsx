import { useApp, DMAP, REGIONS, dname, go } from '../store.jsx';
import { SectorSelect, ScoreRing, RiskBadge, SampleBadge, regionOf } from '../components/ui.jsx';
import MapView from '../components/MapView.jsx';
import { colorAttr, num } from '../lib/format.js';
import { INDICATORS } from '../data/catalog.js';
import { SPECS, SPEC_CATS } from '../data/specs.js';

export default function Home() {
  const { t, lang, results, ranks, offers, regionAgg, scales, specIndex } = useApp();
  const top = ranks.sorted.slice(0, 6);
  const all = regionAgg.all;
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-txt">
            <SampleBadge />
            <h1>{t('heroTitle')}</h1>
            <p>{t('heroText')}</p>
            <div className="row gap">
              <button className="btn primary lg" onClick={() => go('map')}>{t('heroCta')} →</button>
              <button className="btn ghost lg" onClick={() => go('finder')}>{t('heroCta2')}</button>
            </div>
            <div className="stats">
              <div><b>199</b><span>{t('districts')}</span></div>
              <div><b>14</b><span>{t('regions')}</span></div>
              <div><b>{INDICATORS.length}</b><span>{t('indicators')}</span></div>
              <div><b>{offers.length}</b><span>{t('offersCount')}</span></div>
            </div>
          </div>
          <div className="hero-map card">
            <MapView height={380} colorFn={(id) => scales.attr.color(results[id].attr)} onClick={(id) => go('d/' + id)}
              tooltipFn={(id) => `<b>${dname(DMAP[id], lang)}</b><br>${t('attr')}: ${Math.round(results[id].attr)} · ${t('risk')}: ${Math.round(results[id].risk)}`} />
          </div>
        </div>
      </section>

      <section className="wrap qs">
        {[['q1', 'q1t', '📍', 'map'], ['q2', 'q2t', '💰', 'calc'], ['q3', 'q3t', '🛡️', 'method']].map(([a, b, ic, to]) => (
          <a key={a} className="card q" href={`#/${to}`}><span className="q-ic">{ic}</span><h3>{t(a)}</h3><p>{t(b)}</p><span className="more">→</span></a>
        ))}
      </section>

      <section className="wrap">
        <div className="sec-h">
          <h2>{t('topFor')}</h2>
          <SectorSelect />
        </div>
        <div className="grid3">
          {top.map((id, i) => {
            const d = DMAP[id], r = results[id];
            return (
              <a key={id} className="card dcard" href={`#/d/${id}`}>
                <div className="dcard-rank">#{i + 1}</div>
                <ScoreRing value={r.attr} size={74} />
                <div className="dcard-b">
                  <h3>{dname(d, lang)}</h3>
                  <small>{dname(regionOf(id), lang)}</small>
                  <RiskBadge value={r.risk} />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="wrap">
        <div className="sec-h"><div><h2>⭐ {t('popularSpecs')}</h2><p className="muted">{t('specsSub')}</p></div><a className="btn ghost" href="#/specs">{t('nav_specs')} →</a></div>
        <div className="spec-tiles">
          {SPECS.filter((s) => (specIndex[s.id] || []).some((e) => e.rank === 1)).sort((a, b) => specIndex[b.id].filter((e) => e.rank === 1).length - specIndex[a.id].filter((e) => e.rank === 1).length).slice(0, 12).map((s) => (
            <a key={s.id} href={`#/specs/${s.id}`} className="card spec-tile">
              <span className="spec-ic">{SPEC_CATS[s.cat].icon}</span>
              <div><b>{t.n(s)}</b><small>{specIndex[s.id].filter((e) => e.rank === 1).slice(0, 3).map((e) => dname(DMAP[e.id], lang)).join(', ')}</small></div>
            </a>
          ))}
        </div>
      </section>

      <section className="wrap">
        <h2>{t('journey')}</h2>
        <div className="journey">
          {[['j1', 'map', '🗺️'], ['j2', 'd/' + top[0], '📋'], ['j3', 'compare', '⚖️'], ['j4', 'report/' + top[0], '📄']].map(([k, to, ic], i) => (
            <a key={k} href={`#/${to}`} className="jstep"><span>{i + 1}</span><em>{ic}</em><b>{t(k)}</b></a>
          ))}
        </div>
      </section>

      <section className="wrap">
        <h2>{t('forWhom')}</h2>
        <div className="grid5">
          {[['u1', '🌍', 'compare'], ['u2', '🏪', 'finder'], ['u3', '🏦', 'api'], ['u4', '🏛️', 'admin'], ['u5', '📊', 'rating']].map(([k, ic, to]) => (
            <a key={k} className="card user" href={`#/${to}`}><span>{ic}</span><b>{t(k)}</b><p>{t(k + 't')}</p></a>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="sec-h"><h2>{t('byRegion')}</h2><a className="btn ghost" href="#/rating">{t('nav_rating')} →</a></div>
        <div className="regbars card">
          {[...REGIONS].sort((a, b) => regionAgg[b.code].attr - regionAgg[a.code].attr).map((r) => (
            <div key={r.code} className="regbar">
              <span>{dname(r, lang)}</span>
              <div className="hbar"><div style={{ width: `${regionAgg[r.code].attr}%`, background: colorAttr(regionAgg[r.code].attr + 15) }} /></div>
              <b>{Math.round(regionAgg[r.code].attr)}</b>
              <small>{num(regionAgg[r.code].v.pop / 1000, 2, lang)} {lang === 'en' ? 'm' : lang === 'ru' ? 'млн' : 'mln'}</small>
            </div>
          ))}
          <div className="regbar total"><span>{t('republic')}</span><div className="hbar"><div style={{ width: `${all.attr}%` }} /></div><b>{Math.round(all.attr)}</b><small /></div>
        </div>
      </section>
    </>
  );
}
