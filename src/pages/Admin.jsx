import { useMemo, useState } from 'react';
import { useApp, DMAP, DISTRICTS, REGIONS, dname } from '../store.jsx';
import { DistrictSelect } from '../components/ui.jsx';
import { INDICATORS, IND, SOURCES, SECTORS } from '../data/catalog.js';
import { isStale } from '../lib/methodology.js';
import { fmtInd, unit, fmtDate, num } from '../lib/format.js';
import { TODAY } from '../data/generate.js';
import { SpecEditor, SpecReview } from '../components/AdminSpecs.jsx';
import { SPEC } from '../data/specs.js';

const A = {
  role: ['Rol', 'Роль', 'Role'],
  ministry: ['Vazirlik (tasdiqlovchi)', 'Министерство (утверждает)', 'Ministry (approver)'],
  khokim: ['Hokimiyat (ma\'lumot kirituvchi)', 'Хокимият (вносит данные)', 'Khokimiyat (data entry)'],
  upload: ["Ma'lumot yuklash", 'Загрузка данных', 'Upload data'],
  review: ['Tekshirish va tasdiqlash', 'Проверка и утверждение', 'Review & approve'],
  monitor: ['Eskirgan ma\'lumotlar', 'Устаревшие данные', 'Outdated data'],
  specs: ['Ixtisosliklar', 'Специализация', 'Specialisations'],
  offers: ['Takliflar joylash', 'Размещение предложений', 'Post offers'],
  log: ['Audit jurnali', 'Журнал аудита', 'Audit log'],
  indicator: ["Ko'rsatkich", 'Показатель', 'Indicator'],
  newVal: ['Yangi qiymat', 'Новое значение', 'New value'],
  current: ['Joriy', 'Текущее', 'Current'],
  official: ['Rasmiy manba', 'Офиц. источник', 'Official source'],
  date: ['Sana', 'Дата', 'Date'],
  submit: ['Tekshiruvga yuborish', 'Отправить на проверку', 'Submit for review'],
  csv: ['yoki CSV joylang: soato,ko\'rsatkich,qiymat,sana', 'или вставьте CSV: soato,показатель,значение,дата', 'or paste CSV: soato,indicator,value,date'],
  csvBtn: ['CSV ni tekshirish', 'Проверить CSV', 'Validate CSV'],
  dev: ['Rasmiy manbadan farq', 'Отклонение от офиц. источника', 'Deviation from official source'],
  bigDev: ["Farq katta (>15%) — qo'shimcha asos talab qilinadi", 'Большое отклонение (>15%) — требуется обоснование', 'Large deviation (>15%) — justification required'],
  approve: ['Tasdiqlash', 'Утвердить', 'Approve'],
  reject: ['Rad etish', 'Отклонить', 'Reject'],
  pending: ['kutilmoqda', 'на проверке', 'pending'],
  approved: ['tasdiqlangan', 'утверждено', 'approved'],
  rejected: ['rad etilgan', 'отклонено', 'rejected'],
  empty: ["Navbat bo'sh", 'Очередь пуста', 'Queue is empty'],
  remind: ['Eslatma yuborish', 'Отправить напоминание', 'Send reminder'],
  reminded: ['Eslatma yuborildi', 'Напоминание отправлено', 'Reminder sent'],
  agency: ["Mas'ul idora", 'Ответственное ведомство', 'Responsible agency'],
  staleCnt: ['eskirgan qiymat', 'устаревших значений', 'outdated values'],
  title: ['Nomi', 'Название', 'Title'],
  addOffer: ["Taklifni yuborish", 'Отправить предложение', 'Submit offer'],
  reset: ["Barcha o'zgarishlarni bekor qilish", 'Сбросить все изменения', 'Reset all changes'],
  onlyMinistry: ['Faqat vazirlik tasdiqlay oladi', 'Утверждать может только министерство', 'Only the ministry can approve'],
  note: ['Izoh / asos', 'Комментарий / обоснование', 'Comment / justification'],
  applied: ["Indekslar qayta hisoblandi", 'Индексы пересчитаны', 'Indices recalculated'],
  demo: ["Prototip: kirish rol tanlash orqali; real tizimda OneID orqali avtorizatsiya va rollar bo'yicha huquqlar.", 'Прототип: вход через выбор роли; в реальной системе — авторизация OneID и права по ролям.', 'Prototype: sign-in by picking a role; production uses OneID with role-based permissions.'],
};

export default function Admin() {
  const { t, lang, recs, base, queue, setQueue, overrides, setOverrides, setSpecOverrides, log, setLog, extraOffers, setExtraOffers } = useApp();
  const L = { uz: 0, ru: 1, en: 2 }[lang];
  const a = (k) => A[k][L];
  const [role, setRole] = useState('khokim');
  const [tab, setTab] = useState('upload');
  const [f, setF] = useState({ id: '1718427', ind: 'rent', value: '', date: TODAY.toISOString().slice(0, 10), note: '' });
  const [csv, setCsv] = useState('');
  const [csvRes, setCsvRes] = useState(null);
  const [reminded, setReminded] = useState({});
  const [of, setOf] = useState({ id: '1718427', type: 'project', sector: 'agro', title: '', area: 5, price: 10 });

  const addLog = (msg) => setLog((l) => [{ at: new Date().toISOString(), role, msg }, ...l].slice(0, 200));
  const official = (id, ind) => base[id].v[ind];
  const check = (id, ind, value) => {
    const o = official(id, ind);
    const dev = o ? ((value - o) / o) * 100 : 0;
    return { dev, big: Math.abs(dev) > 15 };
  };
  const numericInds = INDICATORS.filter((i) => !['list'].includes(i.fmt));

  const submit = (items) => {
    const now = new Date().toISOString();
    setQueue((q) => [...items.map((x, k) => ({ ...x, qid: `${Date.now()}-${k}`, at: now, status: 'pending', by: role })), ...q]);
    addLog(`${items.length} × ${a('submit')}`);
  };
  const decide = (qid, ok) => {
    const item = queue.find((x) => x.qid === qid);
    setQueue((q) => q.map((x) => (x.qid === qid ? { ...x, status: ok ? 'approved' : 'rejected' } : x)));
    if (ok) setOverrides((o) => ({ ...o, [item.id]: { ...(o[item.id] || {}), [item.ind]: { value: item.value, date: item.date } } }));
    addLog(`${ok ? a('approve') : a('reject')}: ${dname(DMAP[item.id], lang)} · ${t.n(IND[item.ind])} = ${item.value}`);
  };

  const parseCsv = () => {
    const rows = csv.trim().split(/\r?\n/).filter(Boolean).map((line, n) => {
      const [id, ind, value, date] = line.split(/[,;\t]/).map((s) => s.trim());
      const errs = [];
      if (!DMAP[id]) errs.push('SOATO');
      if (!IND[ind] || IND[ind].fmt === 'list') errs.push('indicator');
      if (!Number.isFinite(+value)) errs.push('value');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) errs.push('date');
      return { n: n + 1, id, ind, value: +value, date, errs, ...(errs.length ? {} : check(id, ind, +value)) };
    });
    setCsvRes(rows);
  };

  const staleList = useMemo(() => {
    const byAgency = {};
    for (const d of DISTRICTS) for (const i of INDICATORS) {
      if (!isStale(i.id, recs[d.id].upd[i.id])) continue;
      const ag = SOURCES[i.src].agency;
      (byAgency[ag] ||= []).push({ id: d.id, ind: i.id, date: recs[d.id].upd[i.id] });
    }
    return Object.entries(byAgency).sort((x, y) => y[1].length - x[1].length);
  }, [recs]);

  const indQueue = queue.filter((x) => !x.kind);
  const specQueue = queue.filter((x) => x.kind === 'specs');
  const pending = queue.filter((x) => x.status === 'pending');
  const decideSpecs = (q, ok) => {
    setQueue((l) => l.map((x) => (x.qid === q.qid ? { ...x, status: ok ? 'approved' : 'rejected' } : x)));
    if (ok) setSpecOverrides((o) => ({ ...o, [q.id]: { list: q.list, date: q.date, by: 'khokim' } }));
    addLog(`${ok ? a('approve') : a('reject')}: ${dname(DMAP[q.id], lang)} · ⭐ ${q.list.map((s) => t.n(SPEC[s])).join(', ')}`);
  };
  const pendingOffers = extraOffers.filter((o) => o.status === 'pending');
  const fv = +f.value;
  const fc = f.value !== '' && Number.isFinite(fv) ? check(f.id, f.ind, fv) : null;

  return (
    <div className="wrap admin">
      <div className="sec-h">
        <div><h1>{t('adminTitle')}</h1><p className="muted small">{a('demo')}</p></div>
        <label className="field"><span>{a('role')}</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}><option value="khokim">🏛️ {a('khokim')}</option><option value="ministry">🏢 {a('ministry')}</option></select>
        </label>
      </div>
      <div className="tabs">
        {['upload', 'specs', 'review', 'monitor', 'offers', 'log'].map((k) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{a(k)}
            {k === 'review' && pending.length + pendingOffers.length > 0 && <span className="pill">{pending.length + pendingOffers.length}</span>}
            {k === 'monitor' && <span className="pill warnp">{staleList.reduce((s, x) => s + x[1].length, 0)}</span>}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div className="grid2">
          <div className="card">
            <h3>{a('upload')}</h3>
            <label className="field"><span>{t('district')}</span><DistrictSelect value={f.id} onChange={(id) => setF({ ...f, id })} /></label>
            <label className="field"><span>{a('indicator')}</span>
              <select value={f.ind} onChange={(e) => setF({ ...f, ind: e.target.value })}>{numericInds.map((i) => <option key={i.id} value={i.id}>{t.n(i)} ({unit(i.id, t)})</option>)}</select>
            </label>
            <div className="kv">
              <div><span>{a('current')}</span><b>{fmtInd(f.ind, recs[f.id].v[f.ind], t)}</b></div>
              <div><span>{a('official')}</span><b>{fmtInd(f.ind, official(f.id, f.ind), t)}</b></div>
              <div><span>{t('updated')}</span><b>{fmtDate(recs[f.id].upd[f.ind], lang)}</b></div>
            </div>
            <div className="row gap">
              <label className="field"><span>{a('newVal')}</span><input type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
              <label className="field"><span>{a('date')}</span><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>
            </div>
            {fc && <div className={fc.big ? 'warn' : 'okbox'}>{a('dev')}: <b>{fc.dev > 0 ? '+' : ''}{num(fc.dev, 1)}%</b>{fc.big && <> — {a('bigDev')}</>}</div>}
            <label className="field"><span>{a('note')}</span><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
            <button className="btn primary" disabled={!fc || (fc.big && !f.note)} onClick={() => { submit([{ id: f.id, ind: f.ind, value: fv, date: f.date, note: f.note, ...fc }]); setF({ ...f, value: '', note: '' }); }}>{a('submit')}</button>
          </div>
          <div className="card">
            <h3>CSV</h3>
            <p className="muted small">{a('csv')}</p>
            <textarea rows={7} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'1718427,rent,95,2026-10-20\n1718230,unemp,6.1,2026-09-30'} />
            <div className="row gap"><button className="btn ghost" onClick={parseCsv}>{a('csvBtn')}</button>
              {csvRes && csvRes.some((r) => !r.errs.length) && <button className="btn primary" onClick={() => { submit(csvRes.filter((r) => !r.errs.length).map(({ id, ind, value, date, dev, big }) => ({ id, ind, value, date, dev, big, note: 'CSV' }))); setCsvRes(null); setCsv(''); }}>{a('submit')} ({csvRes.filter((r) => !r.errs.length).length})</button>}
            </div>
            {csvRes && (
              <table className="rtable small">
                <tbody>{csvRes.map((r) => (
                  <tr key={r.n} className={r.errs.length ? 'bad' : r.big ? 'warnrow' : ''}>
                    <td>{r.n}</td><td>{DMAP[r.id] ? dname(DMAP[r.id], lang) : r.id}</td><td>{IND[r.ind] ? t.n(IND[r.ind]) : r.ind}</td><td>{r.value}</td>
                    <td>{r.errs.length ? '✗ ' + r.errs.join(', ') : `${r.dev > 0 ? '+' : ''}${num(r.dev, 1)}%${r.big ? ' ⚠' : ' ✓'}`}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'specs' && <SpecEditor role={role} onSubmit={(item) => submit([item])} />}

      {tab === 'review' && (
        <div className="card">
          <SpecReview role={role} items={specQueue} onDecide={decideSpecs} />
          {role !== 'ministry' && <div className="warn">{a('onlyMinistry')}</div>}
          {!queue.length && !pendingOffers.length && <p className="muted">{a('empty')}</p>}
          {pendingOffers.map((o) => (
            <div key={o.id} className="qrow">
              <span className={`otype ${o.type}`}>{t('t_' + o.type)}</span>
              <div><b>{t.n(o.title)}</b><small>{dname(DMAP[o.district], lang)}</small></div>
              <span className="tag">{a('pending')}</span>
              {role === 'ministry' && <div className="row gap">
                <button className="btn primary sm" onClick={() => { setExtraOffers((l) => l.map((x) => (x.id === o.id ? { ...x, status: 'approved' } : x))); addLog(`${a('approve')}: ${o.id}`); }}>{a('approve')}</button>
                <button className="btn ghost sm" onClick={() => { setExtraOffers((l) => l.map((x) => (x.id === o.id ? { ...x, status: 'rejected' } : x))); addLog(`${a('reject')}: ${o.id}`); }}>{a('reject')}</button>
              </div>}
            </div>
          ))}
          {indQueue.length > 0 && (
            <table className="rtable">
              <thead><tr><th>{t('district')}</th><th>{a('indicator')}</th><th>{a('official')}</th><th>{a('newVal')}</th><th>{a('dev')}</th><th>{a('note')}</th><th /></tr></thead>
              <tbody>{indQueue.map((x) => (
                <tr key={x.qid} className={x.big ? 'warnrow' : ''}>
                  <td>{dname(DMAP[x.id], lang)}</td><td>{t.n(IND[x.ind])}</td><td>{fmtInd(x.ind, official(x.id, x.ind), t)}</td><td><b>{fmtInd(x.ind, x.value, t)}</b></td>
                  <td>{x.dev > 0 ? '+' : ''}{num(x.dev, 1)}% {x.big && '⚠'}</td><td className="small">{x.note}</td>
                  <td>{x.status === 'pending' ? (role === 'ministry' ? <div className="row gap"><button className="btn primary sm" onClick={() => decide(x.qid, true)}>{a('approve')}</button><button className="btn ghost sm" onClick={() => decide(x.qid, false)}>{a('reject')}</button></div> : <span className="tag">{a('pending')}</span>)
                    : <span className={`tag ${x.status === 'approved' ? 'ok' : 'stale'}`}>{a(x.status)}</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {Object.keys(overrides).length > 0 && <div className="row between"><span className="okbox">✓ {a('applied')} ({Object.values(overrides).reduce((s, o) => s + Object.keys(o).length, 0)})</span>
            <button className="btn ghost sm" onClick={() => { setOverrides({}); setQueue((l) => l.filter((x) => x.kind)); addLog(a('reset')); }}>{a('reset')}</button></div>}
        </div>
      )}

      {tab === 'monitor' && (
        <div className="grid2">
          {staleList.map(([ag, items]) => (
            <div key={ag} className="card">
              <div className="row between"><h3>{ag}</h3><span className="pill warnp">{items.length} {a('staleCnt')}</span></div>
              <table className="rtable small">
                <tbody>{items.slice(0, 6).map((x, k) => <tr key={k}><td>{dname(DMAP[x.id], lang)}</td><td>{t.n(IND[x.ind])}</td><td className="bad">{fmtDate(x.date, lang)}</td></tr>)}</tbody>
              </table>
              {items.length > 6 && <small className="muted">+{items.length - 6}</small>}
              <button className="btn ghost sm" disabled={reminded[ag]} onClick={() => { setReminded({ ...reminded, [ag]: true }); addLog(`${a('remind')}: ${ag} (${items.length})`); }}>{reminded[ag] ? '✓ ' + a('reminded') : '🔔 ' + a('remind')}</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'offers' && (
        <div className="card narrow">
          <h3>{a('offers')}</h3>
          <label className="field"><span>{t('district')}</span><DistrictSelect value={of.id} onChange={(id) => setOf({ ...of, id })} /></label>
          <div className="row gap">
            <label className="field"><span>{t('type')}</span><select value={of.type} onChange={(e) => setOf({ ...of, type: e.target.value })}>{['project', 'land', 'building'].map((k) => <option key={k} value={k}>{t('t_' + k)}</option>)}</select></label>
            <label className="field"><span>{t('sector')}</span><select value={of.sector} onChange={(e) => setOf({ ...of, sector: e.target.value })}>{SECTORS.slice(1).map((s) => <option key={s.id} value={s.id}>{t.n(s)}</option>)}</select></label>
          </div>
          <label className="field"><span>{a('title')}</span><input value={of.title} onChange={(e) => setOf({ ...of, title: e.target.value })} /></label>
          <div className="row gap">
            <label className="field"><span>{t('area')} ({of.type === 'building' ? 'm²' : 'ga'})</span><input type="number" value={of.area} onChange={(e) => setOf({ ...of, area: +e.target.value })} /></label>
            <label className="field"><span>{t('price')} ({of.type === 'project' ? 'mln $' : t('mlnSum')})</span><input type="number" value={of.price} onChange={(e) => setOf({ ...of, price: +e.target.value })} /></label>
          </div>
          <button className="btn primary" disabled={!of.title} onClick={() => {
            const d = DMAP[of.id];
            const o = { id: `OF-N${Date.now().toString().slice(-5)}`, district: of.id, type: of.type, sector: of.sector, title: { uz: of.title, ru: of.title, en: of.title },
              lat: d.lat, lng: d.lng, area: of.area, areaUnit: of.type === 'building' ? 'm2' : 'ga', price: of.price, priceUnit: of.type === 'project' ? 'musd' : 'msum',
              irr: null, jobs: null, deadline: new Date(TODAY.getTime() + 90 * 864e5).toISOString().slice(0, 10), status: role === 'ministry' ? 'approved' : 'pending' };
            setExtraOffers((l) => [o, ...l]); addLog(`${a('addOffer')}: ${o.id}`); setOf({ ...of, title: '' });
          }}>{a('addOffer')}</button>
        </div>
      )}

      {tab === 'log' && (
        <div className="card">
          {!log.length && <p className="muted">—</p>}
          <table className="rtable small"><tbody>{log.map((l, k) => <tr key={k}><td className="muted">{new Date(l.at).toLocaleString()}</td><td>{l.role === 'ministry' ? '🏢' : '🏛️'}</td><td>{l.msg}</td></tr>)}</tbody></table>
        </div>
      )}
      <p className="muted small">{REGIONS.length} · {DISTRICTS.length} · {INDICATORS.length}</p>
    </div>
  );
}
