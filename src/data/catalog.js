// Ko'rsatkichlar katalogi — konsepsiyadagi 8 guruh, 30 ko'rsatkich.
// dir: 1 — yuqorisi yaxshi, -1 — pasti yaxshi, 0 — indeksga kirmaydi (ma'lumot uchun)
// idx: jozibadorlik indeksidagi guruh (market | cost | human | infra | business | special)

export const GROUPS = [
  { id: 'demo', icon: '👥', uz: 'Demografiya', ru: 'Демография', en: 'Demographics' },
  { id: 'econ', icon: '📈', uz: 'Iqtisodiyot', ru: 'Экономика', en: 'Economy' },
  { id: 'spec', icon: '🏭', uz: 'Hudud ixtisosligi', ru: 'Специализация', en: 'Specialization' },
  { id: 'biz', icon: '💼', uz: 'Tadbirkorlik', ru: 'Предпринимательство', en: 'Entrepreneurship' },
  { id: 'mkt', icon: '🛒', uz: 'Bozor va savdo', ru: 'Рынки и торговля', en: 'Markets & trade' },
  { id: 'cost', icon: '💰', uz: 'Xarajatlar', ru: 'Затраты', en: 'Costs' },
  { id: 'infra', icon: '⚡', uz: 'Infratuzilma', ru: 'Инфраструктура', en: 'Infrastructure' },
  { id: 'human', icon: '🎓', uz: 'Inson salohiyati', ru: 'Человеческий капитал', en: 'Human capital' },
];

export const INDEX_GROUPS = [
  { id: 'market', w: 0.25, uz: 'Bozor hajmi', ru: 'Объём рынка', en: 'Market size',
    risk: { uz: 'Talab past, xarid qobiliyati past', ru: 'Низкий спрос и покупательная способность', en: 'Weak demand and purchasing power' } },
  { id: 'cost', w: 0.20, uz: 'Xarajatlar', ru: 'Затраты', en: 'Costs',
    risk: { uz: "Narxlarning tez o'sishi", ru: 'Быстрый рост цен', en: 'Rapid price growth' } },
  { id: 'human', w: 0.20, uz: 'Inson salohiyati', ru: 'Человеческий капитал', en: 'Human capital',
    risk: { uz: 'Malakali kadr yetishmasligi, migratsiya', ru: 'Дефицит кадров, миграция', en: 'Skills shortage, out-migration' } },
  { id: 'infra', w: 0.15, uz: 'Infratuzilma', ru: 'Инфраструктура', en: 'Infrastructure',
    risk: { uz: 'Ulanish muddati, quvvat taqchilligi', ru: 'Сроки подключения, дефицит мощностей', en: 'Connection delays, capacity deficit' } },
  { id: 'business', w: 0.10, uz: 'Tadbirkorlik muhiti', ru: 'Деловая среда', en: 'Business environment',
    risk: { uz: 'Korxonalarning yuqori yopilish ulushi', ru: 'Высокая доля закрытий', en: 'High business closure rate' } },
  { id: 'special', w: 0.10, uz: 'Ixtisoslik mosligi', ru: 'Соответствие специализации', en: 'Specialization fit',
    risk: { uz: "Soha uchun xomashyo va ta'minotchi yo'qligi", ru: 'Нет сырья и поставщиков', en: 'No raw materials or suppliers' } },
];

export const SOURCES = {
  stat: { uz: 'Milliy statistika qo\'mitasi', ru: 'Национальный комитет по статистике', en: 'National Statistics Committee', short: 'stat.uz', agency: 'Statistika qo\'mitasi' },
  tax: { uz: 'Soliq qo\'mitasi', ru: 'Налоговый комитет', en: 'Tax Committee', short: 'soliq.uz', agency: 'Soliq qo\'mitasi' },
  invest: { uz: 'Investitsiyalar, sanoat va savdo vazirligi', ru: 'Министерство инвестиций, промышленности и торговли', en: 'Ministry of Investment, Industry and Trade', short: 'miit.uz', agency: 'MIIT' },
  cadastre: { uz: 'Kadastr agentligi, E-auksion', ru: 'Агентство кадастра, E-auksion', en: 'Cadastre Agency, E-auksion', short: 'e-auksion.uz', agency: 'Kadastr agentligi' },
  ads: { uz: "E'lon saytlari (mediana)", ru: 'Сайты объявлений (медиана)', en: 'Listing sites (median)', short: 'olx.uz · uybor.uz', agency: 'Platforma (avtomatik)' },
  labor: { uz: 'Bandlik va kambag\'allikni qisqartirish vazirligi', ru: 'Министерство занятости и сокращения бедности', en: 'Ministry of Employment and Poverty Reduction', short: 'mehnat.uz', agency: 'Bandlik vazirligi' },
  edu: { uz: 'Oliy va kasbiy ta\'lim tizimi', ru: 'Система высшего и профобразования', en: 'Higher & vocational education', short: 'edu.uz', agency: 'Ta\'lim vazirligi' },
  util: { uz: 'Energetika, suv va aloqa korxonalari', ru: 'Энергетика, вода и связь', en: 'Energy, water & telecom utilities', short: 'so\'rov', agency: 'Energetika vazirligi' },
  khokim: { uz: 'Viloyat va tuman hokimiyatlari', ru: 'Хокимияты', en: 'Regional & district khokimiyats', short: 'admin panel', agency: 'Hokimiyat' },
  geo: { uz: 'Platforma GIS hisobi', ru: 'ГИС-расчёт платформы', en: 'Platform GIS calculation', short: 'GIS', agency: 'Platforma' },
};

// fmt: 'int' | 'dec1' | 'pct' | 'score' | 'bool' | 'list' | 'money'
export const INDICATORS = [
  // Demografiya
  { id: 'pop', g: 'demo', idx: 'market', dir: 1, fmt: 'dec1', freq: 'y', src: 'stat',
    uz: 'Doimiy aholi soni', ru: 'Постоянное население', en: 'Resident population', unit: { uz: 'ming kishi', ru: 'тыс. чел.', en: 'thousand' } },
  { id: 'youth', g: 'demo', idx: 'human', dir: 1, fmt: 'pct', freq: 'y', src: 'stat',
    uz: 'Yoshlar (14–30 yosh) ulushi', ru: 'Доля молодёжи (14–30 лет)', en: 'Youth share (14–30)', unit: { uz: '%', ru: '%', en: '%' } },
  { id: 'work', g: 'demo', idx: 'market', dir: 1, fmt: 'dec1', freq: 'y', src: 'stat',
    uz: 'Mehnatga layoqatli aholi', ru: 'Трудоспособное население', en: 'Working-age population', unit: { uz: 'ming kishi', ru: 'тыс. чел.', en: 'thousand' } },
  { id: 'dens', g: 'demo', idx: null, dir: 0, fmt: 'int', freq: 'y', src: 'stat',
    uz: 'Aholi zichligi', ru: 'Плотность населения', en: 'Population density', unit: { uz: 'kishi/km²', ru: 'чел./км²', en: 'per km²' } },
  { id: 'migr', g: 'demo', idx: 'human', dir: -1, fmt: 'dec1', freq: 'y', src: 'labor',
    uz: 'Mehnat migratsiyasi (chetga ketganlar)', ru: 'Трудовая миграция (выехавшие)', en: 'Labour out-migration', unit: { uz: 'ming kishi', ru: 'тыс. чел.', en: 'thousand' } },
  // Iqtisodiyot
  { id: 'grp', g: 'econ', idx: 'market', dir: 1, fmt: 'int', freq: 'y', src: 'stat',
    uz: 'Yalpi hududiy mahsulot (YaHM)', ru: 'Валовой региональный продукт', en: 'Gross regional product', unit: { uz: "mlrd so'm", ru: 'млрд сум', en: 'bn UZS' } },
  { id: 'grppc', g: 'econ', idx: 'market', dir: 1, fmt: 'int', freq: 'y', src: 'stat',
    uz: 'Aholi jon boshiga YaHM', ru: 'ВРП на душу населения', en: 'GRP per capita', unit: { uz: "ming so'm", ru: 'тыс. сум', en: 'thousand UZS' } },
  { id: 'output', g: 'econ', idx: null, dir: 0, fmt: 'int', freq: 'q', src: 'stat', parts: true,
    uz: 'Sanoat, qishloq xo\'jaligi, xizmatlar hajmi', ru: 'Промышленность, с/х, услуги', en: 'Industry, agriculture, services output', unit: { uz: "mlrd so'm", ru: 'млрд сум', en: 'bn UZS' } },
  { id: 'export', g: 'econ', idx: 'business', dir: 1, fmt: 'dec1', freq: 'q', src: 'invest',
    uz: 'Eksport hajmi', ru: 'Объём экспорта', en: 'Exports', unit: { uz: 'mln $', ru: 'млн $', en: 'USD m' } },
  { id: 'inv', g: 'econ', idx: 'business', dir: 1, fmt: 'dec1', freq: 'q', src: 'invest',
    uz: "O'zlashtirilgan investitsiyalar", ru: 'Освоенные инвестиции', en: 'Investment utilised', unit: { uz: 'mln $', ru: 'млн $', en: 'USD m' } },
  // Ixtisoslik
  { id: 'lead', g: 'spec', idx: 'special', dir: 0, fmt: 'list', freq: 'y', src: 'stat',
    uz: 'Yetakchi tarmoqlar (3 ta)', ru: 'Ведущие отрасли (3)', en: 'Leading industries (top 3)', unit: { uz: "ro'yxat", ru: 'список', en: 'list' } },
  { id: 'agri', g: 'spec', idx: 'special', dir: 0, fmt: 'list', freq: 'y', src: 'stat',
    uz: "Asosiy qishloq xo'jaligi mahsulotlari", ru: 'Основная с/х продукция', en: 'Main agricultural products', unit: { uz: 'ming t', ru: 'тыс. т', en: 'thousand t' } },
  { id: 'sez', g: 'spec', idx: 'special', dir: 1, fmt: 'bool', freq: 'c', src: 'invest',
    uz: 'Erkin iqtisodiy / kichik sanoat zonasi', ru: 'СЭЗ / малая промзона', en: 'Free economic / small industrial zone', unit: { uz: "ha/yo'q", ru: 'да/нет', en: 'yes/no' } },
  // Tadbirkorlik
  { id: 'ent', g: 'biz', idx: 'business', dir: 1, fmt: 'int', freq: 'q', src: 'tax',
    uz: 'Faoliyat yuritayotgan korxonalar', ru: 'Действующие предприятия', en: 'Active enterprises', unit: { uz: 'dona', ru: 'ед.', en: 'units' } },
  { id: 'ytt', g: 'biz', idx: null, dir: 0, fmt: 'int', freq: 'q', src: 'tax',
    uz: 'Yakka tartibdagi tadbirkorlar', ru: 'Индивидуальные предприниматели', en: 'Sole proprietors', unit: { uz: 'dona', ru: 'ед.', en: 'units' } },
  { id: 'sme', g: 'biz', idx: 'business', dir: 1, fmt: 'dec1', freq: 'q', src: 'tax',
    uz: '1000 aholiga kichik biznes subyektlari', ru: 'МСБ на 1000 жителей', en: 'SMEs per 1,000 residents', unit: { uz: 'dona', ru: 'ед.', en: 'units' } },
  { id: 'churn', g: 'biz', idx: 'business', dir: -1, fmt: 'pct', freq: 'q', src: 'tax', parts: true,
    uz: 'Yopilganlar / ochilganlar nisbati', ru: 'Закрытые / открытые', en: 'Closed / opened ratio', unit: { uz: '%', ru: '%', en: '%' } },
  // Bozor va savdo
  { id: 'bazaar', g: 'mkt', idx: 'market', dir: 1, fmt: 'int', freq: 'y', src: 'khokim',
    uz: 'Dehqon bozorlari va savdo komplekslari', ru: 'Дехканские рынки и ТЦ', en: 'Farmers markets & malls', unit: { uz: 'dona', ru: 'ед.', en: 'units' } },
  { id: 'retail', g: 'mkt', idx: 'market', dir: 1, fmt: 'int', freq: 'q', src: 'stat',
    uz: 'Chakana savdo aylanmasi', ru: 'Розничный товарооборот', en: 'Retail turnover', unit: { uz: "mlrd so'm", ru: 'млрд сум', en: 'bn UZS' } },
  // Xarajatlar
  { id: 'rent', g: 'cost', idx: 'cost', dir: -1, fmt: 'int', freq: 'm', src: 'ads', parts: true,
    uz: 'Tijorat ijarasi (do\'kon, ofis, ombor)', ru: 'Коммерческая аренда (магазин, офис, склад)', en: 'Commercial rent (retail, office, warehouse)', unit: { uz: "ming so'm/m² oy", ru: 'тыс. сум/м² мес.', en: 'k UZS/m²/mo' } },
  { id: 'wage', g: 'cost', idx: 'cost', dir: -1, fmt: 'int', freq: 'q', src: 'stat',
    uz: "O'rtacha oylik ish haqi", ru: 'Средняя зарплата', en: 'Average monthly wage', unit: { uz: "ming so'm", ru: 'тыс. сум', en: 'k UZS' } },
  { id: 'land', g: 'cost', idx: 'cost', dir: -1, fmt: 'int', freq: 'm', src: 'cadastre',
    uz: "Yer uchastkasi (auksion boshlang'ich narxi)", ru: 'Земельный участок (стартовая цена)', en: 'Land plot (auction start price)', unit: { uz: "mln so'm/ga", ru: 'млн сум/га', en: 'm UZS/ha' } },
  // Infratuzilma
  { id: 'util', g: 'infra', idx: 'infra', dir: 1, fmt: 'score', freq: 'y', src: 'util', expert: true, parts: true,
    uz: 'Elektr, gaz, suv ulanish imkoniyati', ru: 'Подключение к электричеству, газу, воде', en: 'Power, gas & water connectivity', unit: { uz: 'baho 1–5', ru: 'балл 1–5', en: 'score 1–5' } },
  { id: 'dist', g: 'infra', idx: 'infra', dir: -1, fmt: 'int', freq: 'c', src: 'geo', parts: true,
    uz: "Markaz, temir yo'l, aeroport, chegaragacha masofa", ru: 'Расстояние до центра, ж/д, аэропорта, границы', en: 'Distance to centre, rail, airport, border', unit: { uz: 'km', ru: 'км', en: 'km' } },
  { id: 'net', g: 'infra', idx: 'infra', dir: 1, fmt: 'pct', freq: 'y', src: 'util',
    uz: 'Internet qamrovi (4G, optik tola)', ru: 'Покрытие интернетом (4G, оптика)', en: 'Internet coverage (4G, fibre)', unit: { uz: '%', ru: '%', en: '%' } },
  // Inson salohiyati
  { id: 'edu', g: 'human', idx: 'human', dir: 1, fmt: 'pct', freq: 'y', src: 'stat',
    uz: "Oliy va o'rta maxsus ma'lumotlilar", ru: 'С высшим и средним спец. образованием', en: 'Tertiary & vocational educated', unit: { uz: '%', ru: '%', en: '%' } },
  { id: 'schools', g: 'human', idx: 'human', dir: 1, fmt: 'int', freq: 'y', src: 'edu',
    uz: 'OTM, texnikum va kasb-hunar markazlari', ru: 'Вузы, техникумы, профцентры', en: 'Universities, colleges, vocational centres', unit: { uz: 'dona', ru: 'ед.', en: 'units' } },
  { id: 'unemp', g: 'human', idx: 'human', dir: -1, fmt: 'pct', freq: 'q', src: 'labor',
    uz: 'Ishsizlik darajasi', ru: 'Уровень безработицы', en: 'Unemployment rate', unit: { uz: '%', ru: '%', en: '%' } },
  { id: 'lang', g: 'human', idx: 'human', dir: 1, fmt: 'score', freq: 'y', src: 'khokim', expert: true,
    uz: 'Til bilish (rus, ingliz)', ru: 'Знание языков (рус., англ.)', en: 'Language skills (RU, EN)', unit: { uz: 'baho 1–5', ru: 'балл 1–5', en: 'score 1–5' } },
  { id: 'labor', g: 'human', idx: 'human', dir: 1, fmt: 'int', freq: 'y', src: 'labor',
    uz: 'Kasblar bo\'yicha ishchi kuchi zaxirasi', ru: 'Резерв рабочей силы по профессиям', en: 'Labour reserve by occupation', unit: { uz: 'kishi', ru: 'чел.', en: 'people' } },
];

export const IND = Object.fromEntries(INDICATORS.map((i) => [i.id, i]));

export const BRANCHES = {
  textile: { uz: "To'qimachilik", ru: 'Текстиль', en: 'Textiles' },
  agro: { uz: 'Oziq-ovqat va agro', ru: 'Пищевая и агро', en: 'Food & agro' },
  build: { uz: 'Qurilish materiallari', ru: 'Стройматериалы', en: 'Building materials' },
  mining: { uz: 'Kon-metallurgiya', ru: 'Горно-металлургия', en: 'Mining & metals' },
  chem: { uz: 'Kimyo', ru: 'Химия', en: 'Chemicals' },
  tourism: { uz: 'Turizm', ru: 'Туризм', en: 'Tourism' },
  logistics: { uz: 'Logistika', ru: 'Логистика', en: 'Logistics' },
  it: { uz: 'IT va xizmatlar', ru: 'IT и услуги', en: 'IT & services' },
  trade: { uz: 'Savdo', ru: 'Торговля', en: 'Retail & trade' },
  electro: { uz: 'Elektrotexnika', ru: 'Электротехника', en: 'Electrical equipment' },
  auto: { uz: 'Avtomobil butlovchi', ru: 'Автокомпоненты', en: 'Auto components' },
  pharma: { uz: 'Farmatsevtika', ru: 'Фармацевтика', en: 'Pharmaceuticals' },
};

export const CROPS = {
  cotton: { uz: 'Paxta', ru: 'Хлопок', en: 'Cotton' }, wheat: { uz: "Bug'doy", ru: 'Пшеница', en: 'Wheat' },
  fruit: { uz: 'Meva', ru: 'Фрукты', en: 'Fruit' }, veg: { uz: 'Sabzavot', ru: 'Овощи', en: 'Vegetables' },
  grape: { uz: 'Uzum', ru: 'Виноград', en: 'Grapes' }, melon: { uz: 'Poliz', ru: 'Бахчевые', en: 'Melons' },
  rice: { uz: 'Sholi', ru: 'Рис', en: 'Rice' }, meat: { uz: "Go'sht", ru: 'Мясо', en: 'Meat' },
  milk: { uz: 'Sut', ru: 'Молоко', en: 'Milk' }, potato: { uz: 'Kartoshka', ru: 'Картофель', en: 'Potatoes' },
  cocoon: { uz: 'Pilla', ru: 'Шелкококон', en: 'Silk cocoons' }, karakul: { uz: "Qorako'l teri", ru: 'Каракуль', en: 'Karakul pelts' },
};

// Soha profillari: jozibadorlik vaznlari (yig'indi = 1) va mos tarmoqlar
export const SECTORS = [
  { id: 'general', uz: 'Umumiy (vaznlar konsepsiya bo\'yicha)', ru: 'Общий профиль', en: 'General profile', icon: '⚖️',
    w: { market: 0.25, cost: 0.20, human: 0.20, infra: 0.15, business: 0.10, special: 0.10 }, match: [] },
  { id: 'textile', uz: "To'qimachilik", ru: 'Текстиль', en: 'Textiles', icon: '🧵',
    w: { market: 0.10, cost: 0.30, human: 0.30, infra: 0.10, business: 0.05, special: 0.15 }, match: ['textile'], crops: ['cotton', 'cocoon'] },
  { id: 'mall', uz: 'Savdo markazi', ru: 'Торговый центр', en: 'Shopping centre', icon: '🏬',
    w: { market: 0.45, cost: 0.15, human: 0.10, infra: 0.10, business: 0.15, special: 0.05 }, match: ['trade'] },
  { id: 'logistics', uz: 'Logistika', ru: 'Логистика', en: 'Logistics', icon: '🚚',
    w: { market: 0.15, cost: 0.20, human: 0.10, infra: 0.40, business: 0.05, special: 0.10 }, match: ['logistics', 'trade'] },
  { id: 'agro', uz: 'Oziq-ovqat sanoati', ru: 'Пищевая промышленность', en: 'Food processing', icon: '🍇',
    w: { market: 0.15, cost: 0.20, human: 0.15, infra: 0.15, business: 0.05, special: 0.30 }, match: ['agro'], crops: ['fruit', 'veg', 'grape', 'milk', 'meat'] },
  { id: 'it', uz: 'IT va BPO', ru: 'IT и BPO', en: 'IT & BPO', icon: '💻',
    w: { market: 0.15, cost: 0.10, human: 0.40, infra: 0.20, business: 0.10, special: 0.05 }, match: ['it'] },
  { id: 'build', uz: 'Qurilish materiallari', ru: 'Стройматериалы', en: 'Building materials', icon: '🧱',
    w: { market: 0.15, cost: 0.20, human: 0.10, infra: 0.25, business: 0.05, special: 0.25 }, match: ['build', 'mining'] },
  { id: 'tourism', uz: 'Turizm va mehmonxona', ru: 'Туризм и гостиницы', en: 'Tourism & hospitality', icon: '🏨',
    w: { market: 0.20, cost: 0.15, human: 0.20, infra: 0.15, business: 0.05, special: 0.25 }, match: ['tourism'] },
];

export const YEARS = [2021, 2022, 2023, 2024, 2025];
