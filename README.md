# InvestRegion — Hududiy investitsiya platformasi (prototip)

"Hududiy investitsiya platformasi — konsepsiya" hujjati asosidagi ishlaydigan prototip.
Barcha raqamlar **namunaviy** (har bir sahifada belgilangan); real ma'lumot kelganda faqat qiymatlar almashadi, tuzilma o'zgarmaydi.

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ — statik fayllar
```

## Nima bor

| Konsepsiyadagi funksiya | Sahifa |
|---|---|
| 1. Interaktiv xarita (199 tuman, istalgan ko'rsatkich/indeks bo'yicha bo'yash) | `#/map` |
| 2. Tuman kartochkasi (30 ko'rsatkich, 5 yillik dinamika, respublika/viloyat o'rtachasi, manba va sana, hokimiyat bilan aloqa) | `#/d/{SOATO}` |
| 3. Solishtirish (2–5 tuman, jadval, radar, dinamika) | `#/compare` |
| 4. Investor kalkulyatori (ijara, ish haqi fondi, risk, muqobillar) | `#/calc` |
| 5. Hudud tanlash yordamchisi (shartlar + matnli so'rovni tushunish) | `#/finder` |
| 6. Investitsion takliflar va bo'sh maydonlar | `#/offers` |
| 7. PDF hisobot (3 tilda, A4) | `#/report/{SOATO[,SOATO…]}` |
| 8. Ochiq API (hujjat + brauzer ichida sinash) | `#/api` |
| 9. Admin panel (yuklash → rasmiy manba bilan solishtirish → tasdiqlash, hokimiyat tuman ixtisosliklarini tahrirlaydi → vazirlik tasdiqlaydi, eskirgan ma'lumot eslatmalari, takliflar, audit) | `#/admin` |
| **Hududlar ixtisosligi** — har bir tumanning 1–4 ta o'ziga xos sohasi (masalan, Sherobod — anorchilik): bandlik, oilalar daromadi, ish haqi, ishchi topish osonligi, soha bo'yicha tumanlar reytingi | `#/specs`, `#/specs/{soha}`, tuman kartochkasi |
| Reyting va monitoring (viloyat/tuman, yillik o'zgarish) | `#/rating` |
| Ochiq metodika | `#/method` |

## Tuzilma

- `src/data/catalog.js` — 8 guruh, 30 ko'rsatkich, manbalar, soha vazn profillari
- `src/lib/methodology.js` — indeks moduli: 5/95 persentil bilan normallashtirish, guruh bali, vaznli yig'indi, risk, top-3 omil, ishonchlilik belgisi, viloyat/respublika yig'indisi. Metodika o'zgarsa faqat shu fayl yangilanadi.
- `src/data/specs.js` — 50 ta ixtisoslik katalogi va 199 tumanning har biriga biriktirilgan ixtisosliklar (ekspert bahosi, pilotda hokimiyatlar tasdiqlaydi)
- `src/data/generate.js` — namunaviy ma'lumot generatori (real manbalar ulanganda shu qatlam almashtiriladi)
- `scripts/build-geo.mjs` — `data-raw/` dagi chegaralardan tuman meta-ma'lumoti (SOATO kod, 3 tildagi nom, masofalar) va GeoJSON yaratadi (`npm run geo`)
- Admin o'zgarishlari, takliflar va sozlamalar brauzerning `localStorage`ida saqlanadi (prototip).

Chegaralar: geoBoundaries (CC BY 3.0 IGO). SOATO kodlari: viloyat kodlari haqiqiy, tuman kodlari prototip uchun shartli.
