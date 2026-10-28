import { useApp } from '../store.jsx';
import { SPEC, SPEC_CATS } from '../data/specs.js';
import { num } from '../lib/format.js';
import { Sparkline } from './ui.jsx';

export const EASE_COLOR = { easy: '#16a34a', mid: '#d97706', hard: '#dc2626' };

export function SpecChip({ id, rank, small }) {
  const { t } = useApp();
  const sp = SPEC[id];
  return (
    <a href={`#/specs/${id}`} className={`spec-chip ${rank === 1 ? 'main' : ''} ${small ? 'sm' : ''}`} title={t.n(sp.desc)}>
      <span>{SPEC_CATS[sp.cat].icon}</span>{t.n(sp)}
    </a>
  );
}

// Tuman kartochkasidagi bitta ixtisoslik kartasi
export function SpecCard({ x, districtId }) {
  const { t, lang, recs, specIndex } = useApp();
  const sp = SPEC[x.id], cat = SPEC_CATS[sp.cat];
  const list = specIndex[x.id] || [];
  const repRank = list.findIndex((e) => e.id === districtId) + 1;
  const wage = recs[districtId].v.wage;
  return (
    <div className={`card spec-card ${x.rank === 1 ? 'main' : ''}`}>
      <div className="spec-h">
        <span className="spec-ic">{cat.icon}</span>
        <div>
          <span className="spec-rank">{x.rank === 1 ? t('mainSpec') : `${x.rank}${t('nthSpec')}`} · {t.n(cat)}</span>
          <h3>{t.n(sp)}</h3>
        </div>
      </div>
      <p className="spec-desc">{t.n(sp.desc)}</p>
      <div className="spec-kpis">
        <div><span>{t('employedIn')}</span><b>{num(x.employed, 0, lang)}</b><small>{num(x.empShare, 1, lang)}% {t('ofWorkers')}</small></div>
        <div><span>{t('households')}</span><b>{num(x.households, 0, lang)}%</b></div>
        <div><span>{t('incomeHere')}</span><b>{num(wage * (1 + x.premium / 100), 0, lang)}</b><small>{t.n({ uz: "ming so'm", ru: 'тыс. сум', en: 'k UZS' })} · +{num(x.premium, 0)}% {t('vsAvg')}</small></div>
        <div><span>{t('volume')}</span><b>{num(x.volume, x.volume < 100 ? 1 : 0, lang)}</b><small>{t.n(sp.unit)}</small><Sparkline data={x.series} w={90} h={22} /></div>
      </div>
      <div className="spec-foot">
        <span className="ease" style={{ background: EASE_COLOR[x.ease] + '1a', color: EASE_COLOR[x.ease] }}>
          👷 {t('laborAvail')}: <b>{t('ease_' + x.ease)}</b> · {num(x.reserve, 0, lang)} {t('reserveSkilled')}
        </span>
        <span className="muted small">{t('exportSh')}: {num(x.export, 0)}% · {t('specRepRank')}: #{repRank}/{list.length}{x.schools > 0 && <> · {t('trainCourses')}: {x.schools}</>}</span>
      </div>
      <div className="spec-opp"><b>💡 {t('opportunity')}:</b> {t.n(cat.opp)}</div>
      <a className="more-link" href={`#/specs/${x.id}`}>{t('whereElse')} →</a>
    </div>
  );
}
