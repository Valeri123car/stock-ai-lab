# 07 – Pregled prevzetega projekta

Pregled projekta **StockLab** ob prevzemu (fork `TilenBrunec/stock-ai-lab`, stanje na `main`, commit `eae477e`).
Pregledali smo dokumentacijo (`docs/01`–`06`, ADR), kodo backenda in frontenda ter aplikacijo zagnali lokalno
(Spring Boot s profilom `local` proti obstoječi Supabase bazi, Vite dev strežnik).

## 1. Uspešno implementirane funkcionalnosti (MVP)

| Funkcionalnost | Zgodba | Stanje | Opomba |
|---|---|---|---|
| F1 – Pregled instrumentov in graf cene | US-16 | ✅ | Seznam z iskanjem, graf (ECharts) z obdobji 1 leto / 5 let / vse. |
| F2 – Uvoz cenovnih serij | US-12 | ✅ (poenostavljeno) | Python skripte `fetch_prices` → `clean_data` → `import_db`; v bazi je ~220 instrumentov. |
| F3 – Prijava z Google | US-01 | ✅ | Supabase Auth, backend preverja JWT (ES256, JWKS). |
| F4 – Shranjevanje OpenRouter ključa | US-02 | ✅ | Šifriranje AES-256-GCM, prikaz samo zadnjih 4 znakov. |
| F5 – Konfiguracija eksperimenta in izbira modelov | US-03, US-04 | ✅ | Ročna ali naključna izbira, validacija na backendu z napakami po poljih. |
| F6 – Zaprt in anonimiziran posnetek | US-05 | ✅ | Tedenske cene, normalizirane na 100, samo do odločitvenega datuma, anonimne oznake. |
| F7 – Odločitev in utemeljitev agenta | US-06 | ✅ | Asinhroni zagon, validacija JSON odgovora, do 2 ponovitvi. |
| F8 – Vrednotenje | US-07 | ✅ | Končna vrednost, zaslužek, donos, CAGR, delež pravilnih odločitev. |
| F9 – Rezultati in primerjava modelov | US-08, US-09 | ❌ ni implementirano | Stran eksperimenta prikaže status in metrike zagonov, ne pa odločitev z utemeljitvami, grafa portfelja in lestvice modelov. |

Razširitve (US-10, US-11, US-13, US-14, US-15) po načrtu niso del MVP in niso implementirane.

## 2. Ali implementacija zadošča uporabniškim zgodbam

Pregledali smo 5 zgodb in vsak pogoj sprejemljivosti preverili v kodi (ne samo po kljukicah v README).

### US-01 – Prijava z Google računom → **zadošča**

| Pogoj | Stanje | Kje |
|---|---|---|
| Gumb „Prijava z Google“ na vsaki strani | ✅ | `Header.tsx` (glava je na vseh straneh) |
| Po prijavi JWT, prikaz imena in slike | ✅ | `useAuth.tsx`, `Header.tsx` |
| Prvi `GET /api/me` ustvari uporabnika z vlogo raziskovalec | ✅ | `UporabnikService`, `MeController` |
| Zaščiten endpoint brez žetona vrne 401 | ✅ | `SecurityConfig`; pokrito s testi `*_brezZetona_vrne401` |
| Po odjavi žeton izbrisan | ✅ | `supabase.auth.signOut()` v `useAuth.tsx` |

### US-02 – Shranjevanje OpenRouter API ključa → **zadošča**

| Pogoj | Stanje | Kje |
|---|---|---|
| Ob shranjevanju testni klic na OpenRouter, neveljaven ključ → napaka | ✅ | `UporabnikService.shraniKljuc` (400 „OpenRouter ključa ni sprejel“) |
| Ključ šifriran, ključ za šifriranje v okoljski spremenljivki | ✅ | `CryptoService` (AES-256-GCM, `APP_ENCRYPTION_KEY`) |
| API vrne samo zadnje 4 znake | ✅ | `MeDto.kljucZadnji4`, test `me_neVraCaCelotnegaKljuca` |
| Zamenjava in brisanje ključa | ✅ | `PUT/DELETE /api/me/openrouter-key`, `SettingsPage.tsx` |
| Brez ključa je gumb onemogočen z napotkom | ✅ | `NewExperimentPage.tsx` (`brezKljuca`), backend dodatno vrne napako `kljuc` |

### US-03 – Izbira instrumentov in obdobja → **zadošča**

| Pogoj | Stanje | Kje |
|---|---|---|
| Ročna ali naključna izbira | ✅ | iskanje + `GET /api/stocks/random` |
| 1 do 20 instrumentov | ✅ | `ExperimentValidator.MAX_INSTRUMENTOV = 20` |
| Najmanj 1 leto zgodovine pred in 1 leto podatkov po odločitvenem datumu, razpon izpisan | ✅ | `ExperimentValidator`, `GET /api/stocks/range` |
| Konec vrednotenja po odločitvenem datumu in ne po zadnji ceni | ✅ (strožje) | zahteva celo vsaj 1 leto po odločitvenem datumu |
| Kapital > 0 € | ✅ | `ExperimentValidator` (+ zgornja meja) |
| Shrani se s statusom „čaka na zagon“, napake ob poljih | ✅ | status `CAKA`, 400 z `napake` po poljih; 15 testov v `ExperimentValidatorTest` |

### US-05 – Zaprt in anonimiziran posnetek podatkov → **zadošča**

| Pogoj | Stanje | Kje |
|---|---|---|
| Nobena cena v posnetku ni po odločitvenem datumu (avtomatski test) | ✅ | filter v `SnapshotService`, `SnapshotServiceTest` |
| Zahtevek ne vsebuje tickerjev ali imen | ✅ | `PromptBuilder` uporablja samo oznake `Sxxx` |
| Cene normalizirane (100) in tedenske | ✅ | zadnja cena v ISO tednu, deljeno s prvo × 100 |
| Ista oznaka znotraj eksperimenta | ✅ | oznaka je trajno shranjena pri instrumentu (`stock.anon_oznaka`) |

### US-07 – Vrednotenje uspešnosti odločitev → **zadošča**

| Pogoj | Stanje | Kje |
|---|---|---|
| Enakomerna razdelitev med KUPI, brez nakupa kapital nespremenjen | ✅ | `Vrednotenje` |
| Končna vrednost, zaslužek, donos, CAGR | ✅ | `Vrednotenje.Rezultat` |
| Donos po instrumentu in delež pravilnih odločitev | ✅ | `pravilna = kupi ? donos > 0 : donos <= 0` |
| Če ni cene na dan, zadnja znana cena | ✅ | `findFirstBy…DatumLessThanEqualOrderByIdDatumDesc` |
| Unit test za preprost primer | ✅ | `VrednotenjeTest` |

### Povzetek

Implementirane zgodbe (US-01 do US-07, US-12, US-16) v celoti zadoščajo svojim pogojem sprejemljivosti.
Za **celoten MVP pa implementacija še ne zadošča**: manjkata US-08 (prikaz odločitev z utemeljitvami,
razkritje tickerjev, graf rasti portfelja) in US-09 (primerjava modelov). Raziskovalec sicer vidi končne
metrike vsakega modela, ne more pa preveriti razmišljanja modela, kar je osrednji namen aplikacije.

## 3. Ugotovitve ob prevzemu

- **Testi na `main` niso bili zeleni.** Brez lokalne konfiguracije je padlo 20 od 64 backend testov:
  `${supabase.url}` je bil definiran samo v `application-local.properties`, v Spring Boot 4 pa `@WebMvcTest`
  brez `@EnableWebSecurity` ne najde `HttpSecurity`. Odpravljeno v okviru CI/CD (privzeti `supabase.url`,
  `@EnableWebSecurity`); integracijski `StocklabApplicationTests` potrebuje pravo bazo, zato se v CI preskoči.
- **Ni bilo frontend testov.** Dodan je Vitest (pomožne funkcije za prikaz, API klient).
- `docs/05-uporabniske-zgodbe.md` v preglednici še navaja „načrtovano“ za zgodbe, ki so že implementirane (US-01 – US-07).
- Ni bilo CI/CD in ne namestitve; aplikacija je tekla samo lokalno.
