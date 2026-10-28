import { useApp } from '../store.jsx';
import { SECTORS, INDEX_GROUPS, INDICATORS, SOURCES, GROUPS } from '../data/catalog.js';
import { METHOD_VERSION } from '../lib/methodology.js';

const TXT = {
  intro: ["Indeks metodikasi ochiq: har bir hudud o'z balining sababini va yaxshilash yo'lini ko'radi. Hisoblash alohida modulda bajariladi — metodika o'zgarsa, faqat shu modul yangilanadi.",
    'Методика индекса открыта: каждый регион видит причину своей оценки и путь её улучшения. Расчёт выполняется отдельным модулем — при изменении методики обновляется только он.',
    'The index methodology is open: every region can see why it scored as it did and how to improve. Scoring runs in a separate module, so a methodology change only touches that module.'],
  s1: ['1-qadam: normallashtirish', 'Шаг 1: нормализация', 'Step 1: normalisation'],
  s1t: ["Har bir ko'rsatkich barcha tumanlar orasida 0–100 shkalaga keltiriladi. Pasti yaxshi bo'lsa (ijara, ishsizlik) natija teskari olinadi: 100 − S. Toshkent shahri kabi keskin chetga chiquvchi qiymatlar 5 va 95 persentilda kesiladi.",
    'Каждый показатель приводится к шкале 0–100 среди всех районов. Если лучше меньшее значение (аренда, безработица), берётся 100 − S. Выбросы (например, г. Ташкент) отсекаются по 5-му и 95-му перцентилю.',
    'Each indicator is rescaled to 0–100 across all districts. Where lower is better (rent, unemployment) the score is inverted: 100 − S. Outliers such as Tashkent City are clipped at the 5th and 95th percentiles.'],
  s2: ['2-qadam: guruh bali', 'Шаг 2: балл группы', 'Step 2: group score'],
  s2t: ["Guruh bali = guruh ichidagi ko'rsatkichlar ballarining o'rtachasi.", 'Балл группы = среднее баллов показателей внутри группы.', 'Group score = mean of indicator scores within the group.'],
  s3: ['3-qadam: yakuniy indeks', 'Шаг 3: итоговый индекс', 'Step 3: final index'],
  s3t: ['Yakuniy indeks = guruh ballarining vaznli yig\'indisi. Vaznlar investor tanlagan sohaga qarab o\'zgaradi.', 'Итоговый индекс = взвешенная сумма баллов групп. Веса зависят от выбранной инвестором отрасли.', 'Final index = weighted sum of group scores. Weights depend on the industry the investor selects.'],
  weights: ['Soha profillari bo\'yicha vaznlar', 'Веса по отраслевым профилям', 'Weights by industry profile'],
  riskT: ['Risk indeksi va darajalar', 'Индекс риска и уровни', 'Risk index and levels'],
  riskTxt: ["Risk indeksi xuddi shu usulda hisoblanadi, lekin har bir guruh uchun risk omili olinadi: bozor (100 − bozor bali), xarajatlar (ijara va ish haqining 3 yillik o'sish sur'ati), kadrlar (migratsiya ulushi, ta'lim, ishchi zaxirasi), infratuzilma (100 − infratuzilma bali), tadbirkorlik (yopilish/ochilish nisbati), ixtisoslik (100 − moslik bali).",
    'Индекс риска считается тем же способом, но для каждой группы берётся фактор риска: рынок (100 − балл рынка), затраты (3-летний темп роста аренды и зарплат), кадры (доля миграции, образование, резерв), инфраструктура (100 − балл), деловая среда (закрытия/открытия), специализация (100 − соответствие).',
    'The risk index uses the same method with a risk factor per group: market (100 − market score), costs (3-year growth of rent and wages), talent (migration share, education, labour reserve), infrastructure (100 − score), business (closures/openings), specialisation (100 − fit).'],
  relT: ['Ishonchlilik belgisi', 'Знак надёжности', 'Reliability flag'],
  relTxt: ["Ma'lumoti 2 yildan ortiq eskirgan yoki ekspert bahosiga tayangan ko'rsatkichlar ulushi 30% dan oshsa, indeks yonida «ishonchliligi past» belgisi chiqadi. Har bir baho yonida uni eng ko'p pasaytirgan 3 ta omil ko'rsatiladi.",
    'Если доля показателей, устаревших более чем на 2 года или основанных на экспертной оценке, превышает 30%, рядом с индексом появляется знак «низкая надёжность». Рядом с каждой оценкой показываются 3 фактора, сильнее всего её снизившие.',
    'If more than 30% of indicators are over 2 years old or expert-based, the index shows a "low reliability" flag. Each score lists the 3 factors that lowered it most.'],
  catalog: ["Ko'rsatkichlar katalogi", 'Каталог показателей', 'Indicator catalogue'],
  sources: ["Ma'lumot manbalari va yangilanish", 'Источники данных и обновление', 'Data sources & update cycle'],
  srcTxt: ["Har bir ko'rsatkich uchun mas'ul idora va muddat belgilanadi. Yangilanmagan ma'lumot avtomatik «eskirgan» deb belgilanadi va mas'ulga eslatma ketadi. Har bir raqam yonida manba va sana ko'rinadi.",
    'Для каждого показателя назначаются ответственное ведомство и срок. Необновлённые данные автоматически помечаются как «устаревшие», ответственному уходит напоминание. Рядом с каждой цифрой — источник и дата.',
    'Each indicator has a responsible agency and a deadline. Data not refreshed on time is automatically flagged "outdated" and a reminder is sent. Every figure shows its source and date.'],
  freq: { m: ['oylik', 'ежемесячно', 'monthly'], q: ['choraklik', 'ежеквартально', 'quarterly'], y: ['yillik', 'ежегодно', 'annual'], c: ["o'zgarganda", 'при изменении', 'on change'] },
  grp: ['Guruh', 'Группа', 'Group'],
  ind: ["Ko'rsatkich", 'Показатель', 'Indicator'],
  unit: ['Birlik', 'Единица', 'Unit'],
  inIndex: ['Indeksdagi guruh', 'Группа в индексе', 'Index group'],
};

export default function Method() {
  const { t, lang } = useApp();
  const L = { uz: 0, ru: 1, en: 2 }[lang];
  const x = (k) => TXT[k][L];
  return (
    <div className="wrap method">
      <h1>{t('methodTitle')} <small className="muted">v{METHOD_VERSION}</small></h1>
      <p className="lead">{x('intro')}</p>
      <div className="grid3">
        <div className="card step"><span>1</span><h3>{x('s1')}</h3><div className="formula">S<sub>i</sub> = (x<sub>i</sub> − x<sub>p5</sub>) / (x<sub>p95</sub> − x<sub>p5</sub>) × 100</div><p>{x('s1t')}</p></div>
        <div className="card step"><span>2</span><h3>{x('s2')}</h3><div className="formula">S<sub>g</sub> = (1/n) · Σ S<sub>i</sub></div><p>{x('s2t')}</p></div>
        <div className="card step"><span>3</span><h3>{x('s3')}</h3><div className="formula">I = Σ<sub>g</sub> w<sub>g</sub> · S<sub>g</sub>, &nbsp;Σ w<sub>g</sub> = 1</div><p>{x('s3t')}</p></div>
      </div>

      <h2>{x('weights')}</h2>
      <div className="card table-scroll">
        <table className="rtable wtable">
          <thead><tr><th>{t('sector')}</th>{INDEX_GROUPS.map((g) => <th key={g.id}>{t.n(g)}</th>)}</tr></thead>
          <tbody>{SECTORS.map((s) => (
            <tr key={s.id} className={s.id === 'general' ? 'hl' : ''}><td>{s.icon} {t.n(s)}</td>{INDEX_GROUPS.map((g) => <td key={g.id}><div className="wcell"><i style={{ width: `${s.w[g.id] * 220}%` }} /><span>{Math.round(s.w[g.id] * 100)}%</span></div></td>)}</tr>
          ))}</tbody>
        </table>
      </div>

      <div className="grid2">
        <div className="card"><h3>{x('riskT')}</h3><p>{x('riskTxt')}</p>
          <div className="levels"><span className="badge risk-low">0–33 {t('low')}</span><span className="badge risk-mid">34–66 {t('mid')}</span><span className="badge risk-high">67–100 {t('high')}</span></div>
          <table className="rtable small"><tbody>{INDEX_GROUPS.map((g) => <tr key={g.id}><td>{t.n(g)}</td><td className="muted">{t.n(g.risk)}</td></tr>)}</tbody></table>
        </div>
        <div className="card"><h3>{x('relT')}</h3><p>{x('relTxt')}</p><div className="warn">⚠ {t('lowRel')} — {t('lowRelT')}</div></div>
      </div>

      <h2>{x('catalog')} <small className="muted">({INDICATORS.length})</small></h2>
      <div className="card table-scroll">
        <table className="rtable small">
          <thead><tr><th>#</th><th>{x('grp')}</th><th>{x('ind')}</th><th>{x('unit')}</th><th>{x('inIndex')}</th><th>{t('source')}</th><th>⟳</th></tr></thead>
          <tbody>{INDICATORS.map((i, k) => (
            <tr key={i.id}>
              <td>{k + 1}</td><td>{t.n(GROUPS.find((g) => g.id === i.g))}</td><td><b>{t.n(i)}</b>{i.expert && <span className="tag exp">{t('expert')}</span>}</td>
              <td>{t.n(i.unit)}</td>
              <td>{i.idx ? <>{t.n(INDEX_GROUPS.find((g) => g.id === i.idx))} <small className="muted">{i.dir === 1 ? '↑' : i.dir === -1 ? '↓' : ''}</small></> : <span className="muted">—</span>}</td>
              <td>{t.n(SOURCES[i.src])}</td><td>{TXT.freq[i.freq][L]}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <h2>{x('sources')}</h2>
      <p>{x('srcTxt')}</p>
      <div className="grid3">
        {Object.entries(SOURCES).map(([k, s]) => (
          <div key={k} className="card src"><b>{t.n(s)}</b><small className="muted">{s.short}</small>
            <div className="chips">{INDICATORS.filter((i) => i.src === k).map((i) => <span key={i.id} className="chip">{t.n(i)}</span>)}</div></div>
        ))}
      </div>
    </div>
  );
}
