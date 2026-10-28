import { useState } from 'react';
import { useApp, DMAP, dname } from '../store.jsx';
import { DistrictSelect } from './ui.jsx';
import { SpecChip } from './Specs.jsx';
import { SPECS, SPEC, SPEC_CATS } from '../data/specs.js';
import { fmtDate } from '../lib/format.js';
import { TODAY } from '../data/generate.js';

const MAX = 4;
const X = {
  title: ['Tuman ixtisosliklari', 'Специализация района', 'District specialisations'],
  hint: ["Tumaningizning o'ziga xos sohalarini muhimlik tartibida kiriting (1 tadan 4 tagacha). Birinchisi — asosiy soha. O'zgarish vazirlik tasdig'idan keyin platformada chiqadi va indeks qayta hisoblanadi.",
    'Укажите профильные отрасли района по важности (от 1 до 4). Первая — основная. Изменение появится после утверждения министерством, индекс будет пересчитан.',
    'List the district’s signature industries by importance (1 to 4). The first is the main one. Changes go live after ministry approval and the index is recalculated.'],
  current: ['Hozir platformada', 'Сейчас на платформе', 'Currently published'],
  draft: ['Yangi ro\'yxat', 'Новый список', 'New list'],
  add: ["Soha qo'shish…", 'Добавить отрасль…', 'Add an industry…'],
  max: ['Ko\'pi bilan 4 ta soha', 'Не более 4 отраслей', 'At most 4 industries'],
  min: ['Kamida 1 ta soha bo\'lishi shart', 'Нужна хотя бы 1 отрасль', 'At least 1 industry is required'],
  added: ["qo'shildi", 'добавлено', 'added'], removed: ['olib tashlandi', 'удалено', 'removed'], reordered: ['tartib o\'zgardi', 'изменён порядок', 'order changed'],
  noChange: ["O'zgarish yo'q", 'Изменений нет', 'No changes'],
  note: ["Asos (majburiy): masalan, 2025 yil hosil hajmi, band aholi soni", 'Обоснование (обязательно): напр. урожай 2025 г., число занятых', 'Justification (required): e.g. 2025 harvest, number employed'],
  submit: ['Tasdiqlashga yuborish', 'Отправить на утверждение', 'Submit for approval'],
  sent: ["Yuborildi — vazirlik tasdig'ini kutmoqda", 'Отправлено — ожидает утверждения', 'Submitted — awaiting approval'],
  pendingHere: ['Bu tuman bo\'yicha kutilayotgan so\'rov bor', 'По району есть ожидающий запрос', 'A request for this district is pending'],
  reviewTitle: ["Ixtisoslik o'zgarishlari", 'Изменения специализации', 'Specialisation changes'],
  before: ['Avval', 'Было', 'Before'], after: ['Keyin', 'Стало', 'After'],
  approve: ['Tasdiqlash', 'Утвердить', 'Approve'], reject: ['Rad etish', 'Отклонить', 'Reject'],
  pending: ['kutilmoqda', 'на проверке', 'pending'], approved: ['tasdiqlangan', 'утверждено', 'approved'], rejected: ['rad etilgan', 'отклонено', 'rejected'],
  khokimOnly: ['Ixtisosliklarni hokimiyat kiritadi, vazirlik tasdiqlaydi', 'Специализацию вносит хокимият, утверждает министерство', 'Khokimiyats submit, the ministry approves'],
  edited: ['Hokimiyat tomonidan yangilangan', 'Обновлено хокимиятом', 'Updated by khokimiyat'],
  restore: ['Asl ro\'yxatga qaytarish', 'Вернуть исходный список', 'Restore original list'],
};

function useX() {
  const { lang } = useApp();
  const i = { uz: 0, ru: 1, en: 2 }[lang];
  return (k) => X[k][i];
}

export function diffSpecs(prev, next) {
  return {
    added: next.filter((s) => !prev.includes(s)),
    removed: prev.filter((s) => !next.includes(s)),
    reordered: prev.filter((s) => next.includes(s)).join() !== next.filter((s) => prev.includes(s)).join(),
  };
}

function Diff({ prev, next }) {
  const { t } = useApp();
  const x = useX();
  const d = diffSpecs(prev, next);
  if (!d.added.length && !d.removed.length && !d.reordered) return <span className="muted small">{x('noChange')}</span>;
  return (
    <div className="spec-diff">
      {d.added.map((s) => <span key={s} className="tag ok">+ {t.n(SPEC[s])}</span>)}
      {d.removed.map((s) => <span key={s} className="tag stale">− {t.n(SPEC[s])}</span>)}
      {d.reordered && <span className="tag">↕ {x('reordered')}</span>}
    </div>
  );
}

// Hokimiyat: tuman ixtisosliklarini tahrirlash va tasdiqlashga yuborish
export function SpecEditor({ role, onSubmit }) {
  const { t, lang, recs, queue, specOverrides } = useApp();
  const x = useX();
  const [id, setId] = useState('1722212');
  const current = recs[id].lists.specs.map((s) => s.id);
  const [draft, setDraft] = useState(current);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const pickDistrict = (v) => { if (!v) return; setId(v); setDraft(recs[v].lists.specs.map((s) => s.id)); setNote(''); setSent(false); };
  const move = (i, dir) => setDraft((l) => { const n = [...l]; [n[i], n[i + dir]] = [n[i + dir], n[i]]; return n; });
  const d = diffSpecs(current, draft);
  const changed = d.added.length || d.removed.length || d.reordered;
  const hasPending = queue.some((q) => q.kind === 'specs' && q.id === id && q.status === 'pending');

  return (
    <div className="grid2">
      <div className="card">
        <h3>⭐ {x('title')}</h3>
        <p className="muted small">{x('hint')}</p>
        {role !== 'khokim' && <div className="warn">{x('khokimOnly')}</div>}
        <label className="field"><span>{t('district')}</span><DistrictSelect value={id} onChange={pickDistrict} /></label>
        <h4>{x('draft')} · {draft.length}/{MAX}</h4>
        <ol className="spec-edit">
          {draft.map((s, i) => (
            <li key={s}>
              <span className="spec-ic sm">{SPEC_CATS[SPEC[s].cat].icon}</span>
              <div><b>{t.n(SPEC[s])}</b><small>{i === 0 ? t('mainSpec') : `${i + 1}${t('nthSpec')}`} · {t.n(SPEC_CATS[SPEC[s].cat])}</small></div>
              <div className="row gap">
                <button className="btn ghost sm" disabled={i === 0} onClick={() => move(i, -1)} title="↑">↑</button>
                <button className="btn ghost sm" disabled={i === draft.length - 1} onClick={() => move(i, 1)} title="↓">↓</button>
                <button className="btn ghost sm" disabled={draft.length <= 1} onClick={() => setDraft((l) => l.filter((y) => y !== s))} title={t('remove')}>×</button>
              </div>
            </li>
          ))}
        </ol>
        {draft.length < MAX ? (
          <select value="" onChange={(e) => e.target.value && setDraft((l) => [...l, e.target.value])}>
            <option value="">+ {x('add')}</option>
            {Object.entries(SPEC_CATS).map(([cid, c]) => (
              <optgroup key={cid} label={`${c.icon} ${t.n(c)}`}>
                {SPECS.filter((s) => s.cat === cid && !draft.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{t.n(s)}</option>)}
              </optgroup>
            ))}
          </select>
        ) : <small className="muted">{x('max')}</small>}
        <div className="spec-diff-box"><Diff prev={current} next={draft} /></div>
        <label className="field"><span>{x('note')}</span><input value={note} onChange={(e) => setNote(e.target.value)} /></label>
        {hasPending && <div className="warn">{x('pendingHere')}</div>}
        {sent ? <div className="okbox">✓ {x('sent')}</div> : (
          <button className="btn primary" disabled={role !== 'khokim' || !changed || !note.trim() || !draft.length}
            onClick={() => { onSubmit({ kind: 'specs', id, prev: current, list: draft, note, date: TODAY.toISOString().slice(0, 10) }); setSent(true); }}>
            {x('submit')}
          </button>
        )}
      </div>
      <div className="card">
        <h3>{x('current')}: {dname(DMAP[id], lang)}</h3>
        {specOverrides[id] && <p className="small"><span className="tag ok">{x('edited')}</span> {fmtDate(specOverrides[id].date)}</p>}
        <div className="chips">{recs[id].lists.specs.map((s) => <SpecChip key={s.id} id={s.id} rank={s.rank} />)}</div>
        <ul className="spec-cur">
          {recs[id].lists.specs.map((s) => <li key={s.id}><b>{t.n(SPEC[s.id])}</b> — <span className="muted">{t.n(SPEC[s.id].desc)}</span></li>)}
        </ul>
        <a className="more-link" href={`#/d/${id}`}>{t('openCard')} →</a>
      </div>
    </div>
  );
}

// Vazirlik: ixtisoslik so'rovlarini ko'rib chiqish
export function SpecReview({ role, items, onDecide }) {
  const { lang, specOverrides, setSpecOverrides } = useApp();
  const x = useX();
  if (!items.length && !Object.keys(specOverrides).length) return null;
  return (
    <div className="spec-review">
      <h3>⭐ {x('reviewTitle')}</h3>
      {items.map((q) => (
        <div key={q.qid} className="qrow spec-q">
          <div><b>{dname(DMAP[q.id], lang)}</b><small>{fmtDate(q.date)} · {q.note}</small></div>
          <div className="spec-ba">
            <div><small>{x('before')}</small><div className="chips">{q.prev.map((s, i) => <SpecChip key={s} id={s} rank={i + 1} small />)}</div></div>
            <div><small>{x('after')}</small><div className="chips">{q.list.map((s, i) => <SpecChip key={s} id={s} rank={i + 1} small />)}</div></div>
            <Diff prev={q.prev} next={q.list} />
          </div>
          {q.status === 'pending'
            ? (role === 'ministry'
              ? <div className="row gap"><button className="btn primary sm" onClick={() => onDecide(q, true)}>{x('approve')}</button><button className="btn ghost sm" onClick={() => onDecide(q, false)}>{x('reject')}</button></div>
              : <span className="tag">{x('pending')}</span>)
            : <span className={`tag ${q.status === 'approved' ? 'ok' : 'stale'}`}>{x(q.status)}</span>}
        </div>
      ))}
      {role === 'ministry' && Object.keys(specOverrides).length > 0 && (
        <div className="row gap wrapw">
          {Object.keys(specOverrides).map((id) => (
            <button key={id} className="btn ghost sm" onClick={() => setSpecOverrides((o) => { const n = { ...o }; delete n[id]; return n; })}>
              ↺ {x('restore')}: {dname(DMAP[id], lang)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
