// Chegaralar (geoBoundaries, CC BY 3.0 IGO) asosida tumanlar meta-ma'lumotini tayyorlaydi.
// Ishga tushirish: node scripts/build-geo.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data-raw', f), 'utf8'));
const adm0 = read('ADM0.geojson');
const adm1 = read('ADM1.geojson');
const adm2 = read('ADM2.geojson');

// Viloyatlar: SOATO kodi, nomlar, ma'muriy markaz koordinatasi
const REGIONS = {
  'Republic of Karakalpakstan': { code: '1735', uz: "Qoraqalpog'iston Respublikasi", ru: 'Республика Каракалпакстан', en: 'Republic of Karakalpakstan', center: [42.46, 59.61] },
  'Andijan Region': { code: '1703', uz: 'Andijon viloyati', ru: 'Андижанская область', en: 'Andijan Region', center: [40.78, 72.34] },
  'Bukhara Region': { code: '1706', uz: 'Buxoro viloyati', ru: 'Бухарская область', en: 'Bukhara Region', center: [39.77, 64.42] },
  'Jizzakh Region': { code: '1708', uz: 'Jizzax viloyati', ru: 'Джизакская область', en: 'Jizzakh Region', center: [40.12, 67.84] },
  'Qashqadaryo Region': { code: '1710', uz: 'Qashqadaryo viloyati', ru: 'Кашкадарьинская область', en: 'Kashkadarya Region', center: [38.86, 65.79] },
  'Navoiy Region': { code: '1712', uz: 'Navoiy viloyati', ru: 'Навоийская область', en: 'Navoi Region', center: [40.10, 65.37] },
  'Namangan Region': { code: '1714', uz: 'Namangan viloyati', ru: 'Наманганская область', en: 'Namangan Region', center: [41.00, 71.67] },
  'Samarqand Region': { code: '1718', uz: 'Samarqand viloyati', ru: 'Самаркандская область', en: 'Samarkand Region', center: [39.65, 66.96] },
  'Surxondaryo Region': { code: '1722', uz: 'Surxondaryo viloyati', ru: 'Сурхандарьинская область', en: 'Surkhandarya Region', center: [37.22, 67.28] },
  'Sirdaryo Region': { code: '1724', uz: 'Sirdaryo viloyati', ru: 'Сырдарьинская область', en: 'Syrdarya Region', center: [40.49, 68.78] },
  'Tashkent': { code: '1726', uz: 'Toshkent shahri', ru: 'город Ташкент', en: 'Tashkent City', center: [41.31, 69.28] },
  'Tashkent Region': { code: '1727', uz: 'Toshkent viloyati', ru: 'Ташкентская область', en: 'Tashkent Region', center: [41.00, 69.35] },
  'Fergana Region': { code: '1730', uz: "Farg'ona viloyati", ru: 'Ферганская область', en: 'Fergana Region', center: [40.38, 71.79] },
  'Xorazm Region': { code: '1733', uz: 'Xorazm viloyati', ru: 'Хорезмская область', en: 'Khorezm Region', center: [41.55, 60.63] },
};

// O'zbekcha (lotin) nomlar — kalit: manba nomining kichik harfli ASCII ko'rinishi
const UZ = {
  'termez': 'Termiz tumani', 'termez city': 'Termiz shahri', 'nurata': 'Nurota', 'navoi city': 'Navoiy shahri', 'jondor': 'Jondor',
  'bukhara': 'Buxoro tumani', 'alat': 'Olot', 'karakul': "Qorako'l", 'kasbi': 'Kasbi', 'mirishkar': 'Mirishkor', 'nishan': 'Nishon',
  'mubarek': 'Muborak', 'karaulbazar': 'Qorovulbozor', 'nurabad': 'Nurobod', 'shafirkan': 'Shofirkon', 'rmitan': 'Romitan',
  'peshku': 'Peshku', 'kagan': 'Kogon tumani', 'kiziltepa': 'Qiziltepa', 'kagan city': 'Kogon shahri', 'bukhara city': 'Buxoro shahri',
  'pakhtachi': 'Paxtachi', 'gijduvan': "G'ijduvon", 'vabkent': 'Vobkent', 'karmana': 'Karmana', 'navbakhor': 'Navbahor', 'kitab': 'Kitob',
  'kamashi': 'Qamashi', 'karshi': 'Qarshi tumani', 'guzar': "G'uzor", 'dehkanabad': 'Dehqonobod', 'kasan': 'Koson', 'karshi city': 'Qarshi shahri',
  'chirakchi': 'Chiroqchi', 'baysun': 'Boysun', 'muzrabad': 'Muzrabot', 'sherabad': 'Sherobod', 'angor': 'Angor', 'yakkabag': "Yakkabog'",
  'shakhrisabz': 'Shahrisabz tumani', 'pastdargom': "Pastdarg'om", 'ishtikhan': 'Ishtixon', 'narpay': 'Narpay', 'kattakurgan': "Kattaqo'rg'on tumani",
  'khatirchi': 'Xatirchi', 'kattakurgan city': "Kattaqo'rg'on shahri", 'koshrabad': "Qo'shrabot", 'samarkand city': 'Samarqand shahri',
  'urgut': 'Urgut', 'samarkand': 'Samarqand tumani', 'taylak': 'Toyloq', 'dzhambay': 'Jomboy', 'payarik': 'Payariq', 'akdarya': 'Oqdaryo',
  'farish': 'Forish', 'gallyaaral': "G'allaorol", 'khiva': 'Xiva tumani', 'karauzyak': "Qorao'zak", 'kungrad': "Qo'ng'irot", 'shavat': 'Shovot',
  'koshkupir': "Qo'shko'pir", 'amudarya': 'Amudaryo', 'gurlen': 'Gurlan', 'chimbay': 'Chimboy', 'kanlikul': "Qanliko'l", 'shumanay': 'Shumanay',
  'khojeyli': "Xo'jayli", 'kegeyli': 'Kegeyli', 'muynak': "Mo'ynoq", 'nukus': 'Nukus tumani', 'takhtakupir': "Taxtako'pir", 'nukus city': 'Nukus shahri',
  'turtkul': "To'rtko'l", 'uchkuduk': 'Uchquduq', 'khazarasp': 'Hazorasp', 'kanimekh': 'Konimex', 'tamdi': 'Tomdi', 'ellikkala': "Ellikqal'a",
  'khanka': 'Xonqa', 'yangiarik': 'Yangiariq', 'bagat': "Bog'ot", 'urgench': 'Urganch tumani', 'beruniy': 'Beruniy', 'yangibazar': 'Yangibozor',
  'urgench city': 'Urganch shahri', 'zarafshan city': 'Zarafshon shahri', 'bagdad': "Bag'dod", 'yangiabad': 'Yangiobod', 'sariasiya': 'Sariosiyo',
  'dzharkurgan': "Jarqo'rg'on", 'kizirik': 'Qiziriq', 'shurchi': "Sho'rchi", 'kumkurgan': "Qumqo'rg'on", 'uzun': 'Uzun', 'altinsay': 'Oltinsoy',
  'denau': 'Denov', 'dzhizak city': 'Jizzax shahri', 'bakhmal': 'Baxmal', 'bulungur': "Bulung'ur", 'sharof rashidov': 'Sharof Rashidov',
  'zafarabad': 'Zafarobod', 'zarbdar': 'Zarbdor', 'zamin': 'Zomin', 'sardoba': 'Sardoba', 'paxtakor': 'Paxtakor', 'dustlik': "Do'stlik",
  'khavas': 'Xovos', 'mirzaabad': 'Mirzaobod', 'bekabad': 'Bekobod tumani', 'uzbekistan': "O'zbekiston tumani", 'besharik': 'Beshariq',
  'sokh': "So'x", 'fergana': "Farg'ona tumani", 'bekabad city': 'Bekobod shahri', 'bayaut': 'Boyovut', 'shirin city': 'Shirin shahri',
  'yangiyer city': 'Yangiyer shahri', 'rishtan': 'Rishton', 'altiarik': 'Oltiariq', 'uchkuprik': "Uchko'prik", 'kuvasay city': 'Quvasoy shahri',
  'fergana city': "Farg'ona shahri", 'pap': 'Pop', 'urtachirchik': "O'rtachirchiq", 'gulistan city': 'Guliston shahri', 'saykhunabad': 'Sayxunobod',
  'mirzachul': "Mirzacho'l", 'arnasay': 'Arnasoy', 'gulistan': 'Guliston tumani', 'akaltin': 'Oqoltin', 'sirdarya': 'Sirdaryo tumani',
  'kuyichirchik': 'Quyichirchiq', 'chinaz': 'Chinoz', 'akhangaran': 'Ohangaron tumani', 'buka': "Bo'ka", 'akkurgan': "Oqqo'rg'on", 'pskent': 'Piskent',
  'almalik city': 'Olmaliq shahri', 'akhangaran city': 'Ohangaron shahri', 'bektemir': 'Bektemir', 'sergeli': 'Sergeli', 'yangiyul': "Yangiyo'l tumani",
  'yangiyul city': "Yangiyo'l shahri", 'zangiata': 'Zangiota', 'chilanzar': 'Chilonzor', 'uchtepa': 'Uchtepa', 'tashkent': 'Toshkent tumani',
  'yakkasaray': 'Yakkasaroy', 'almazar': 'Olmazor', 'shaykhantokhur': 'Shayxontohur', 'yunusabad': 'Yunusobod', 'yukarichirchik': 'Yuqorichirchiq',
  'parkent': 'Parkent', 'angren city': 'Angren shahri', 'kibray': 'Qibray', 'yashnobod': 'Yashnobod', 'mirabad': 'Mirobod',
  'mirzo ulugbek': "Mirzo Ulug'bek", 'bostanlik': "Bo'stonliq", 'chirchik city': 'Chirchiq shahri', 'andijan': 'Andijon tumani', 'ulugnar': "Ulug'nor",
  'kokand city': "Qo'qon shahri", 'furkat': 'Furqat', 'kushtepa': "Qo'shtepa", 'buvayda': 'Buvayda', 'dangara': "Dang'ara", 'yazyavan': 'Yozyovon',
  'mingbulak': 'Mingbuloq', 'khadjaabad': "Xo'jaobod", 'kuva': 'Quva', 'tashlak': 'Toshloq', 'margilan city': "Marg'ilon shahri", 'markhamat': 'Marhamat',
  'asaka': 'Asaka', 'shakhrixan': 'Shahrixon', 'boz': "Bo'z", 'djalalkuduk': 'Jalaquduq', 'bulakbashi': 'Buloqboshi', 'kurgantepa': "Qo'rg'ontepa",
  'narin': 'Norin', 'chust': 'Chust', 'namangan': 'Namangan tumani', 'turakurgan': "To'raqo'rg'on", 'balikchi': 'Baliqchi', 'yangikurgan': "Yangiqo'rg'on",
  'kasansay': 'Kosonsoy', 'namangan city': 'Namangan shahri', 'uychi': 'Uychi', 'chartak': 'Chortoq', 'khanabad city': 'Xonobod shahri',
  'altinkul': "Oltinko'l", 'andijan city': 'Andijon shahri', 'uchkurgan': "Uchqo'rg'on", 'izboskan': 'Izboskan', 'paxtaabad': 'Paxtaobod',
  'khiva city': 'Xiva shahri', 'nurafshon city': 'Nurafshon shahri', 'shakhrisabz city': 'Shahrisabz shahri',
};

// Lotin (rus transliteratsiyasi) -> kirill
function toCyr(s) {
  const pairs = [['shch', 'щ'], ['dzh', 'дж'], ['dj', 'дж'], ['kh', 'х'], ['zh', 'ж'], ['ch', 'ч'], ['sh', 'ш'], ['ts', 'ц'],
    ['ya', 'я'], ['yu', 'ю'], ['yo', 'ё'], ['ye', 'е'], ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'е'], ['z', 'з'],
    ['i', 'и'], ['y', 'й'], ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'],
    ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['x', 'х'], ['q', 'к'], ['c', 'к'], ['w', 'в'], ['j', 'дж']];
  return s.split(' ').map((w) => {
    let lw = w.toLowerCase(), out = '';
    for (let i = 0; i < lw.length;) {
      if (i === 0 && lw[0] === 'e') { out += 'э'; i++; continue; }
      const p = pairs.find(([l]) => lw.startsWith(l, i));
      if (p) { out += p[1]; i += p[0].length; } else i++;
    }
    return out.charAt(0).toUpperCase() + out.slice(1);
  }).join(' ');
}

const ascii = (s) => s.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').toLowerCase().trim();

// Geometriya yordamchilari
const ringArea = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return a / 2; };
const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
function centroid(g) {
  let best = null, ba = 0;
  for (const p of polys(g)) { const a = Math.abs(ringArea(p[0])); if (a > ba) { ba = a; best = p[0]; } }
  let x = 0, y = 0, A = 0;
  for (let i = 0, j = best.length - 1; i < best.length; j = i++) {
    const f = best[j][0] * best[i][1] - best[i][0] * best[j][1];
    x += (best[j][0] + best[i][0]) * f; y += (best[j][1] + best[i][1]) * f; A += f;
  }
  return [y / (3 * A), x / (3 * A)]; // [lat, lng]
}
function inRing(pt, r) {
  let c = false; const [x, y] = pt;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > y) !== (r[j][1] > y) && x < ((r[j][0] - r[i][0]) * (y - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) c = !c;
  }
  return c;
}
const inGeom = (pt, g) => polys(g).some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h)));
const R = 6371;
function km(a, b) {
  const t = Math.PI / 180, dLat = (b[0] - a[0]) * t, dLng = (b[1] - a[1]) * t;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function segKm(p, a, b) {
  // tekis yaqinlashuv (kichik masofalar uchun yetarli)
  const kx = Math.cos((p[0] * Math.PI) / 180);
  const ax = a[1] * kx, ay = a[0], bx = b[1] * kx, by = b[0], px = p[1] * kx, py = p[0];
  const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return km(p, [ay + t * dy, (ax + t * dx) / kx]);
}
function geomAreaKm2(g) {
  let a = 0;
  for (const p of polys(g)) {
    const lat = p[0].reduce((s, c) => s + c[1], 0) / p[0].length;
    const k = 111.32 * 110.57 * Math.cos((lat * Math.PI) / 180);
    a += Math.abs(ringArea(p[0])) * k - p.slice(1).reduce((s, h) => s + Math.abs(ringArea(h)) * k, 0);
  }
  return a;
}

const AIRPORTS = [[41.257, 69.281], [39.700, 66.984], [39.775, 64.483], [40.117, 65.171], [41.584, 60.642], [42.488, 59.623],
  [37.287, 67.310], [38.833, 65.922], [40.359, 71.745], [40.985, 71.557], [40.728, 72.294]];
// Asosiy temir yo'l yo'nalishlari (taxminiy tugun nuqtalari)
const RAIL = [
  [[41.31, 69.28], [40.49, 68.78], [40.12, 67.84], [39.65, 66.96], [40.10, 65.37], [39.77, 64.42], [39.08, 63.60]],
  [[40.10, 65.37], [42.12, 63.58], [42.46, 59.61], [43.05, 58.90]],
  [[39.77, 64.42], [38.86, 65.79], [38.62, 66.25], [38.27, 67.89], [37.22, 67.28]],
  [[41.31, 69.28], [41.02, 70.14], [40.87, 71.11], [41.00, 71.67], [40.78, 72.34]],
  [[40.53, 70.94], [40.38, 71.79], [40.78, 72.34]],
  [[42.46, 59.61], [41.55, 60.63], [41.38, 60.36]],
  [[41.31, 69.28], [41.50, 69.58], [41.11, 70.07]],
  [[40.49, 68.78], [40.22, 69.27]],
];
const border = adm0.features[0].geometry;
const borderRings = polys(border).map((p) => p[0]);

const TASHKENT_CITY = new Set(['bektemir', 'sergeli', 'chilanzar', 'uchtepa', 'yakkasaray', 'almazar', 'shaykhantokhur', 'yunusabad', 'yashnobod', 'mirabad', 'mirzo ulugbek']);
// Chegara soddalashtirilgani sabab markaz nuqtasi qo'shni viloyatga tushadigan tumanlar
const REGION_FIX = { bulungur: 'Samarqand Region', yazyavan: 'Fergana Region' };
const regionFeatures = adm1.features.map((f) => ({ key: f.properties.shapeName, geom: f.geometry }));
const counters = {};
const meta = [];
const outFeatures = [];

for (const f of adm2.features) {
  const raw = f.properties.shapeName;
  const key = ascii(raw);
  const c = centroid(f.geometry);
  const forced = TASHKENT_CITY.has(key) ? 'Tashkent' : REGION_FIX[key];
  let reg = forced ? regionFeatures.find((r) => r.key === forced) : regionFeatures.find((r) => inGeom([c[1], c[0]], r.geom));
  if (!reg) reg = regionFeatures.map((r) => ({ r, d: km(c, centroid(r.geom)) })).sort((a, b) => a.d - b.d)[0].r;
  const R0 = REGIONS[reg.key];
  const isCity = /city$/.test(key) || R0.code === '1726';
  counters[R0.code] = (counters[R0.code] || 0) + 1;
  const id = `${R0.code}${String(counters[R0.code] * 3 + (isCity ? 400 : 200)).padStart(3, '0')}`;
  const uz = UZ[key] || raw;
  const enBase = raw.replace(/ city$/i, '').replace(/[^\x20-\x7e]/g, 'o');
  const en = isCity && /city$/i.test(raw) ? `${enBase} City` : R0.code === '1726' ? `${enBase} district` : `${enBase} district`;
  const ruBase = toCyr(enBase);
  const ru = /city$/i.test(raw) ? `г. ${ruBase}` : `${ruBase} район`;
  let minBorder = Infinity;
  for (const ring of borderRings) for (let i = 1; i < ring.length; i += 2) minBorder = Math.min(minBorder, segKm(c, [ring[i - 1][1], ring[i - 1][0]], [ring[i][1], ring[i][0]]));
  let minRail = Infinity;
  for (const line of RAIL) for (let i = 1; i < line.length; i++) minRail = Math.min(minRail, segKm(c, line[i - 1], line[i]));
  const d = {
    id, region: R0.code, uz, ru, en, city: isCity,
    lat: +c[0].toFixed(4), lng: +c[1].toFixed(4),
    area: Math.max(1, Math.round(geomAreaKm2(f.geometry))),
    dCenter: Math.round(km(c, R0.center)),
    dRail: Math.round(minRail),
    dAirport: Math.round(Math.min(...AIRPORTS.map((a) => km(c, a)))),
    dBorder: Math.round(minBorder),
  };
  meta.push(d);
  const round = (x) => (Array.isArray(x[0]) ? x.map(round) : [+x[0].toFixed(4), +x[1].toFixed(4)]);
  outFeatures.push({ type: 'Feature', properties: { id }, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) } });
}

const regions = Object.values(REGIONS).map(({ code, uz, ru, en, center }) => ({ code, uz, ru, en, center }));
fs.mkdirSync(path.join(root, 'public', 'geo'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'geo', 'districts.geojson'), JSON.stringify({ type: 'FeatureCollection', features: outFeatures }));
const roundGeom = (x) => (Array.isArray(x[0]) ? x.map(roundGeom) : [+x[0].toFixed(3), +x[1].toFixed(3)]);
fs.writeFileSync(path.join(root, 'public', 'geo', 'regions.geojson'), JSON.stringify({
  type: 'FeatureCollection',
  features: adm1.features.map((f) => ({ type: 'Feature', properties: { code: REGIONS[f.properties.shapeName].code }, geometry: { type: f.geometry.type, coordinates: roundGeom(f.geometry.coordinates) } })),
}));
fs.writeFileSync(path.join(root, 'src', 'data', 'geo-meta.json'), JSON.stringify({ regions, districts: meta }, null, 0));
const missing = meta.filter((m) => !UZ[ascii(m.en.replace(/ (district|City)$/, '') + (m.city && m.en.endsWith('City') ? ' city' : ''))]);
console.log('tumanlar:', meta.length, 'viloyat bo\'yicha:', counters, 'nomsiz:', missing.map((m) => m.uz));
