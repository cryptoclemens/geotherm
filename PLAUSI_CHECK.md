# PLAUSI_CHECK.md — Wissenschaftliche Formelvalidierung DeltaT

> **Geprüft von:** Scientist-Agent (Claude Opus 4.6)  
> **Datum:** 2026-04-11  
> **Status:** BESTANDEN MIT ANMERKUNGEN — 2 sachliche Fehler (A/B: HOCH), 3 semantische Schwächen, 1 falsch zitierte Quelle  
> **Fazit:** Deploybar als *Orientierungs-/Richtwert-Rechner* mit Disclaimer. **Nicht** als Engineering-Tool vor Fixes A+B.

---

## Kritische Befunde (Priorität)

| # | Schweregrad | Befund | Datei/Zeile | Korrektur |
|---|---|---|---|---|
| **A** | 🔴 HOCH | Tauchpumpen-Förderhöhe = Bohrtiefe — überschätzt Pumpleistung um Faktor 2–5 | system.ts:151 | Eigener Input `foerderhoehe`, Default 150 m |
| **B** | 🔴 HOCH | Jahreswärmemenge nutzt `qThGesamt` statt `qDelivered` — unterschätzt gelieferte Wärme um ~35 % | system.ts:225 | `qDelivered * laufstunden / 1000` |
| **C** | 🟡 MITTEL | Durchbruchsformel Vorfaktor **4** statt **3** (Gringarten-Sauty 1975); Wärmekapazitäts-Ratio fehlt | system.ts:154–155 | Siehe unten |
| **D** | 🟡 MITTEL | COP nutzt `T_GW` statt `T_R` als Quellen-Temperatur — überschätzt COP um 10–20 % | system.ts:163–166 | `tVL_K / (tVL_K − tR_K) × 0.5` |
| **E** | 🟡 MITTEL | Quelle "Drost 1978" falsch zitiert — korrekt: Gringarten & Sauty 1975 | system.ts Kommentar | Kommentar korrigieren |
| **F** | 🟢 NIEDRIG | LMTD auch bei aktiver WP berechnet (semantisch falsch — kein Direktanschluss) | system.ts:172–179 | Konditionalisieren: `if (!wpAktiv)` |
| **G** | 🟢 NIEDRIG | Transmissivitäts-Ampel stammt aus BHE-Kontext (VDI 4640 Bl.2), nicht Dublette | system.ts | Quelle präzisieren / Ergiebigkeit nutzen |
| **H** | 🟢 NIEDRIG | `Math.max(0.01, …)` verschleiert ungültige Eingaben | system.ts | Explizite Validierung + UI-Warnung |

---

## Formel-Details

### Fix A — Tauchpumpen-Förderhöhe
```
// AKTUELL (falsch):
P = Q × ρ × g × tiefe / η   // H = Bohrtiefe → zu hoch um Faktor 2–5

// KORREKT:
P = Q × ρ × g × foerderhoehe / η  // foerderhoehe = dynamischer Spiegel + Rohrreibung
// Typisch bei hydrothermalen Dubletten: 100–250 m (nicht 500 m!)
// Default-Empfehlung: 150 m; User-editierbar machen
```
Quellen: Stober & Bucher (2012), *Geothermie*, Kap. 7.4; VDI 4640 Bl. 2 Abschn. 5.6

### Fix B — Jahreswärmemenge
```
// AKTUELL (falsch):
jahreswaerme = qThGesamt * laufstunden / 1000   // nur Geo-Anteil ohne WP-Beitrag

// KORREKT:
jahreswaerme = qDelivered * laufstunden / 1000  // gesamte ans Netz gelieferte Wärme
// Optional zusätzlich:
jahresstrom = elLeistungWP * laufstunden / 1000  // WP-Strombedarf [MWh/a]
```

### Fix C — Thermischer Durchbruch (Gringarten & Sauty 1975)
```
// AKTUELL (falsch):
t = π·n·b·D² / (4·Q)   // Vorfaktor 4 → t 35% zu hoch

// KORREKT (Gringarten & Sauty 1975, Water Resources Research):
const rhoCpAquifer = 2.3e6  // J/(m³·K), Sandstein gesättigt (Richtwert)
const rhoCpWater   = 4.18e6 // J/(m³·K)
t = (π·n·b·D²) / (3·Q) × (rhoCpAquifer / rhoCpWater) / (365·24·3600)
// HC-Ratio ≈ 0.55–0.75 für typische Aquifere
```
Numerisch Default (D=500m, Q=15l/s, b=40m, n=0.25):
- Code-Formel: **4.15 Jahre** (zu optimistisch)
- Gringarten /3: **5.53 Jahre**  
- Gringarten mit HC-Ratio 0.7: **3.87 Jahre**

### Fix D — COP-Berechnung
```
// AKTUELL (leicht falsch — T_GW statt T_R):
cop = (tVL_K / (tVL_K − tGW_K)) × 0.5  → 2.79 bei Default

// KORREKT (Arpagaus 2018, Formel mit Source_out = Reinjektionstemperatur):
cop = (tVL_K / (tVL_K − tR_K)) × 0.5   → 2.33 bei Default (−16 %)
// T_R = Reinjektionstemperatur ≈ Verdampfer-Austrittstemperatur
```
Quelle: Arpagaus et al. (2018), *Energy* 152, 1626–1646 — Abb. 8 + Gl. 7

---

## Validierte Formeln (korrekt)

| Formel | Befund |
|---|---|
| Q_th = Q · ΔT · c_p (c_p=4.18) | ✅ Korrekt; ρ-Abweichung <0.3% vernachlässigbar |
| W_el = Q_geo / (COP − 1) | ✅ Korrekt — Energiebilanz erfüllt |
| Q_geo_benoetigt = Ziel · (COP−1)/COP | ✅ Korrekt |
| Anzahl Dubletten = ceil(Q_geo_bnöt / Q_th_pro_Dublett) | ✅ Korrekt |
| Transmissivität T = k_f · b | ✅ Korrekt (Ampel-Schwellen pragmatisch, nicht normiert) |
| LMTD = (ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂) | ✅ Korrekt; Anwendungskontext prüfen (nur ohne WP) |

---

## Offene Fragen für nächste Plausi-Runde

1. **Gütegrad 0.5** im COP — ✅ umgesetzt als User-Input `guetegradWP` (0.30–0.65) in Plausi-Check II (April 2026)
2. **Porosität n=0.25** ist hardcoded — ✅ umgesetzt als User-Input `porositaet` (0.01–0.40) in Plausi-Check II (April 2026)
3. **Wärmekapazitäts-Ratio** — fester Default 0.7 oder als Input `rhoCpRatio` exponieren? (offen)

---

---

## DeltaT + Bohrkost — Zweiter Plausi-Check & Cross-App-Dependency-Review (April 2026)

> **Geprüft von:** Scientist-Agent (Claude Opus 4.6)  
> **Datum:** 2026-04-14  
> **Status:** BESTANDEN — 8 Befunde, alle umgesetzt  
> **Scope:** DeltaT-Interna, Bohrkost-Interna, Cross-App-Abhängigkeiten

### Befunde und Umsetzung

| # | Schweregrad | Befund | Maßnahme | Status |
|---|---|---|---|---|
| 1 | 🟡 | KfW/BEG-EW 2026: Förderung für 1 oder 2 Bohrungen je Dublette? | Manuell verifizieren (kein Code) | Offen — manuell |
| 2 | 🟡 | Porosität n=0.25 hardcoded — regional stark abweichend (Malm 0.08, Molasse 0.20) | Neuer User-Input `porositaet` (0.01–0.40, Default 0.25) in DeltaT | ✅ Umgesetzt |
| 3 | 🟡 | Gütegrad WP η=0.50 hardcoded — keine Unterscheidung Standard/HT-WP | Neuer User-Input `guetegradWP` (0.30–0.65, Default 0.50) in DeltaT | ✅ Umgesetzt |
| 4 | 🟡 | Bohrkost: harter Sprung bei 500m (linear→Lukawski) — Kostensprung ~20–40 % | Blend-Zone 400–600m: `basiskosten = linear*(1-t) + lukawski*t` | ✅ Umgesetzt |
| 5 | 🟢 | Kristallin-Faktor 1.30 am unteren Rand der Literatur (1.5–2.5) | Kommentar in kosten.ts ergänzt | ✅ Umgesetzt |
| 6 | 🟢 | COP zweimal berechnet (`cop` + `_copEst`) — inkonsistenz-Risiko | DRY: cop einmal berechnen, `_copEst` entfernt | ✅ Umgesetzt |
| 7 | 🟡 | DeltaT-Dubletten-Anzahl fließt nicht in Bohrkost ein | `handleLoadBohrkost()` + `resolveOverwrite()` übertragen `anzahlDubletten` (max 8) | ✅ Umgesetzt |
| 8 | 🟢 | Old localStorage-State crasht mit `TypeError: toFixed(undefined)` | Persist `version: 1` + `migrate()` in DeltaT- und Bohrkost-Store | ✅ Umgesetzt |

### Offene Fragen (verbleibend nach diesem Review)

1. **KfW/BEG-EW 2026** — Wird die Förderung für eine oder beide Bohrungen je Dublette gewährt? Code-Annahme: 1 Bohrung. Manuell verifizieren bei BEG-Programm 2026.
2. **Wärmekapazitäts-Ratio** — rhoCpAquifer/rhoCpWater = 0.7 (fest) oder als User-Input `rhoCpRatio`?

---

## Bohrkostenrechner — Lukawski-Formel (Stand April 2026)

> **Geprüft durch:** Formel-Recherche + Quellenabgleich + Scientist-Agent (April 2026)  
> **Modul:** `src/apps/bohrkost/calc/kosten.ts`  
> **Status:** Deploybar als CAPEX-Orientierungsrechner mit Disclaimer.

### Kernformel

```
C(d) = (1.72e-7 × d² + 2.3e-3 × d − 0.62) × 10⁶   [USD 2009]
```
Quelle: **Lukawski et al. (2014)**, *J. Pet. Sci. Eng.* 118, 1–14.  
Datenbasis: **146 US-Geothermiebohrungen** (hydrothermal + EGS; Produktions- **und** Injektionsbohrungen).  
**Nicht geeignet für Erdwärmesonden (BHE/DBHE)** — diese haben grundlegend andere Bohrdurchmesser und -tiefen.  
Gültig für: Geothermale Bohrungen 500–5000 m.

**Dublette:** `Kosten_Dublette = 2 × Einzelbohrung` (konservativ; Injektionsbohrung real ~15 % günstiger,
liegt jedoch innerhalb der ±35–50 %-Bandbreite der AACE-Class-5-Schätzung).

**Angewandte Korrekturfaktoren:**

| Faktor | Wert | Quelle / Herleitung |
|---|---|---|
| Währung USD₂₀₀₉ → EUR₂₀₂₆ | **1.34** | US CPI 2009–2026: ×1.54 (BLS) → USD₂₀₂₆; Konversion zum Kurs 2026 EUR/USD 1.15 (ECB) → 1.54/1.15 ≈ 1.34. Nächste Prüfung: April 2027. Herleitung korrigiert 07/2026, Wert unverändert — siehe Befund C |
| Gestein Lockergestein | 0.70 | Baujard et al. (2017), Stanford SGW |
| Gestein Festgestein_sed | 1.00 | Referenz |
| Gestein Festgestein_kristallin | 1.30 | Baujard et al. (2017), Stanford SGW |
| Region NDB | 0.95 | Marktabschätzung GtV / LIAG |
| Region Molasse | 1.00 | Referenz |
| Region Oberrheingraben | 1.05 | Marktabschätzung GtV / LIAG |
| Durchmesser 7" | 0.85 | Branchenschätzung; Stober & Bucher (2012) |
| Durchmesser 9 5/8" | 1.00 | Referenz |
| Durchmesser 13 3/8" | 1.25 | Branchenschätzung; Stober & Bucher (2012) |
| Deutscher Marktaufschlag | 1.40 | GtV Bundesverband Geothermie; LIAG Broschüre Tiefe Geothermie |

### Linearer Fallback für d < 500 m

Lukawski 2014 ist für Tiefen < 500 m nicht belastbar (Extrapolation). Stattdessen lineares Modell:

```
C_linear = LINEAR_PREIS_PRO_M × tiefe + MOBILISIERUNG
```

| Gesteinstyp | EUR/m | Mobilisierung | Quelle |
|---|---|---|---|
| Lockergestein | 300 | 75.000 | GtV Bohrpreise (2024); DVGW W 115 |
| Festgestein_sed | 700 | 100.000 | GtV Bohrpreise (2024); DVGW W 115 |
| Festgestein_kristallin | 1.200 | 150.000 | GtV Bohrpreise (2024); DVGW W 115 |

### Bandbreite

```
bohrkosten_min = mid × 0.65
bohrkosten_max = mid × 1.50
```
Begründung: ±35–50 % sind für CAPEX-Schätzungen auf Machbarkeitsebene (Feasibility) üblich (AACE Class 4–5, Faktor 0.5–2.0). Gewählte Bandbreite ist konservativ-realistisch.

### MAP/KfW-Förderung

```
foerderung = min(375 EUR/m × min(tiefe, 2500 m), 2.500.000 EUR)
```
Quelle: **BEG / MAP-Programm KfW (2024)**. Gilt für Förderbohrung (eine Bohrung der Dublette).

### Bekannte Vereinfachungen (für Disclaimer)

| Punkt | Vereinfachung | Impact |
|---|---|---|
| Währungs-Faktor | 1.34 (aktualisiert April 2026) — keine automatische Jahres-Aktualisierung | ±8 % |
| Marktaufschlag | Pauschal 1.40 — regional stark variabel | ±20–30 % |
| Komplettierungskosten | Pauschal-Formeln — keine Bohrtiefenabhängigkeit bei Pumpe | ±15 % |
| Gesteins-Faktoren | Nur 3 Kategorien — heterogene Aquifere nicht abgebildet | ±25 % |

**Disclaimer (muss im UI sichtbar sein):** Diese Berechnung liefert eine CAPEX-Schätzung auf Feasibility-Niveau (AACE Class 4–5). Für Investitionsentscheidungen ist ein detailliertes Bohrangebot von einem spezialisierten Bohrunternehmen einzuholen.

---

## Primärquellen

- **Gringarten & Sauty (1975)** — A theoretical study of heat extraction from aquifers with uniform regional flow. *J. Geophys. Res.* 80(35), 4956–4962. → Durchbruchszeit-Formel
- **Arpagaus et al. (2018)** — High temperature heat pumps: Market overview, state of the art, research status. *Energy* 152, 1626–1646. → COP-Gütegrad 0.5
- **Stober & Bucher (2012)** — *Geothermie*. Springer. Kap. 7.4. → Förderhöhe Tauchpumpe; Komplettierungskosten
- **VDI 4640 Blatt 2** (2001) — Thermische Nutzung des Untergrunds. → Transmissivität, Pumpenleistung
- **DVGW W 115** — Bohrungen für Grundwassererschließung. → TDS-Grenzwerte, Material-Empfehlungen; linearer Fallback < 500 m
- **VDI Wärmeatlas (2019)** — Abschn. C1. → LMTD Gegenstrom
- **Lukawski et al. (2014)** — Estimating drilling costs of U.S. geothermal wells. *J. Pet. Sci. Eng.* 118, 1–14. → Bohrkostenformel C(d)
- **Baujard et al. (2017)** — Rock type drilling cost correction factors. Stanford Geothermal Workshop SGW-2017. → Gesteins-Korrekturfaktoren Bohrkostenrechner
- **GtV Bundesverband Geothermie (2024)** — Bohrpreise & Marktdaten (intern). → Linearer Fallback-Preis < 500 m, Marktaufschlag Deutschland
- **BEG / KfW MAP-Programm (2024)** — Bundesförderung Effiziente Gebäude. → Förderformel 375 EUR/m, max. 2.500.000 EUR
- **Agemar et al. (2014)** — Assessing the geothermal potential of Germany. *Geothermics* 53, 519–535. → Regionale Gradienten (NDB/Molasse/URG/Mittelgebirge)
- **Kruseman & de Ridder (1990)** — Analysis and Evaluation of Pumping Test Data. 2nd ed. ILRI. → Transiente Einflussradius-Formel R = 1,5·√(T·t/S)
- **Grundfos SP/A-Baureihe Leistungskurven (2024)** — Tauchmotorpumpen für Bohrlöcher. → Tiefenabhängiger Pumpenwirkungsgrad η(z)

---

## DeltaT — Dritter Plausi-Check: Usability + Physikalische Korrekturen (April 2026)

> **Geprüft von:** Scientist-Agent (Claude Opus 4.6) + Usability-Review (20 kritische Testnutzer-Personas)
> **Datum:** 2026-04-14
> **Status:** BESTANDEN — 5 Befunde, alle umgesetzt
> **Scope:** Hydraulisches Modell, Pumpensystem, regionale Gradienten, Aquifer-Warnungen

### Befunde und Umsetzung

| # | Schweregrad | Befund | Maßnahme | Status |
|---|---|---|---|---|
| 1 | 🔴 KRITISCH | Geothermischer Gradient fest auf 0,03 K/m — ignoriert regionale Extremwerte (URG: 0,045; NDB: 0,028) um bis zu 50 % | Neues Input-Feld `region` (NDB/Molasse/URG/Mittelgebirge/custom); T_GW-Kopplung nutzt regionalen Gradienten nach Agemar et al. 2014 | ✅ Umgesetzt |
| 2 | 🔴 KRITISCH | Q_max mit fixem R=500 m — nicht physikalisch hergeleitet, unterschätzt/überschätzt je nach T | R = 1,5 × √(T × 25a / S), S=1e-4 (Kruseman & de Ridder 1990); konservativer bei hoher Transmissivität (Default: 23 statt 41 l/s) | ✅ Umgesetzt |
| 3 | 🔴 KRITISCH | Injektionspumpe nicht separat modelliert — SPF-Berechnung unterschätzt Eigenverbrauch | Neues Input-Feld `injektionsdruck [bar]`; P_inj = Q × ΔP / η_inj (η_inj=0,55, Grundfos); SPF-Optimierer nutzt P_Förder + P_Reinjekt | ✅ Umgesetzt |
| 4 | 🟡 HINWEIS | Gringarten & Sauty (1975) nur für poröse Medien gültig — bei n < 0,05 (Kluftaquifer) liefert die Formel stark falsche Durchbruchszeiten | Neue Output-Warnung `kluftaquiferWarnung` + amber UI-Hinweis in InputColumn | ✅ Umgesetzt |
| 5 | 🟡 HINWEIS | Pumpenwirkungsgrad η=0,60 fest — ignoriert Tiefenabhängigkeit (onshore/offshore, Wellenlänge) | η(z) = 0,72 − 0,08 × (z/2000), clamped [0,45; 0,72] nach Grundfos SP/A-Katalogen; z=500m: η=0,70; z=3000m: η=0,60 | ✅ Umgesetzt |

### Numerische Auswirkungen (Default-Inputs: tiefe=500m, kf=1e-4, b=40m, Q=15 l/s)

| Größe | Vor Korrekturen | Nach Korrekturen | Änderung |
|-------|-----------------|------------------|----------|
| Q_max hydraulisch | 41,2 l/s | 23,2 l/s | −44 % (konservativer) |
| Tauchpumpenleistung (Q=15, H=265m) | 65,1 kW (η=0,60) | 56,2 kW (η=0,70) | −14 % |
| Injektionspumpenleistung | nicht modelliert | 27,3 kW (10 bar) | + |
| T_GW bei 500m (URG) | 25,0 °C (0,03 K/m) | 33,5 °C (0,045 K/m) | +8,5 K |

### Offene Fragen (verbleibend nach diesem Review)

1. **Speicherkoeffizient S=1e-4** (gespannter Aquifer, fest) — für ungespannte Aquifere wäre S=0,05–0,20 realistisch. User-Input `speicherkoeffizient` oder ein "Aquifer-Typ"-Dropdown (gespannt/ungespannt) könnte Abhilfe schaffen.
2. **Injektionsdruck-Default 10 bar** — für artesische oder stark unter Druck stehende Aquifere (Molasse >1000 m) kann der Gegendruck 0–5 bar betragen. Ggf. regionalen Default koppeln.

---

## Bohrkost ↔ LCOH-Modell — Cross-Check gegen reales Bohrangebot (Juli 2026)

> **Geprüft durch:** Scientist-Agent (Claude Opus 4.8), im Rahmen der LCOH-Modul-Vorbereitung
> **Datum:** 2026-07-16
> **Module:** `src/apps/bohrkost/calc/kosten.ts` (bestehend) ↔ externes LCOH-Modell Referenzprojekt
> **Status:** Befund B ✅ behoben (M8.1, 2026-07-14) · Befund A 🟡 Gültigkeitsbereich deklariert,
> Kalibrierung bewusst offen bis die Kostenaufschlüsselung vorliegt
> **Anlass:** Für das geplante LCOH-Modul (Tasks.md, Backlog M8+) liegt erstmals ein **reales
> Bohrangebot** vor (Referenzprojekt eines Kunden; > Angebot des Bohrunternehmens, 03/2026). Damit lässt sich Bohrkost erstmals gegen einen echten
> Marktpreis prüfen statt nur gegen Literatur.

### Referenzfall

| Größe | Wert | Quelle |
|---|---|---|
| Standort |  (NRW) | Machbarkeitsstudie das Referenzprojekt V2 |
| Bohrtiefe | 280 m | LCOH-Modell v13, Blatt `10_LCOH_Vergleich` („280m Tiefe") |
| Gestein | Lockergestein | LCOH-Modell v13, Blatt `02_Inputs`, Block D1 |
| Konfiguration | Dublette (Entnahme + Infiltration) | ebd. |
| **Angebotspreis** | **Faktor ~3,4 über dem Rechner (Dublette)** | Datenblatt V2 (Bohrunternehmen, 03/2026), mit dem Kunden abgestimmt |

### Befund A — 🔴 HOCH: Linearer Zweig unterschätzt reales Angebot um Faktor 2,6–3,4

`berechneBohrkosten({ tiefe: 280, gesteinstyp: 'Lockergestein', zweck: 'Dublette' })` liefert:

| Vergleichsebene | Bohrkost | das Referenzprojekt-Angebot | Faktor |
|---|---|---|---|
| Nur Bohrung (Dublette) | Rechner | Angebot | **3,4×** |
| Bohrung + Komplettierung vs. Bohrung + „Ausrüstung" (253 T€) | 518 T€ | 1.327 T€ | **2,6×** |

Beide Abgrenzungen liegen deutlich außerhalb der dokumentierten AACE-Class-5-Bandbreite
(`min = mid × 0.65`, `max = mid × 1.50`) — das Angebot ist rund **2,3× über `bohrkosten_max`**.

**Mögliche Ursachen (zu prüfen):**
1. `LINEAR_PREIS_PRO_M.Lockergestein = 300 EUR/m` + `LINEAR_MOBILISIERUNG = 75.000 EUR` stammen
   aus GtV Bohrpreise (2024) / DVGW W 115 und beschreiben vermutlich **kleinkalibrige Brunnen-
   bohrungen**, nicht eine Geothermie-Produktionsbohrung mit Verrohrung, Filterstrecke und
   Kiesschüttung.
2. Der Angebotspreis könnte Verrohrung/Komplettierung enthalten, die Bohrkost separat führt
   (die Excel führt „Ausrüstung" mit 253 T€ allerdings **zusätzlich** — spricht dagegen).
3. Realpreise DE 2026 > Listenpreise GtV 2024 (Bohrmarkt angespannt).
4. Der deutsche Marktaufschlag `f_markt = 1.40` wird auf den linearen Zweig **nicht** angewendet
   (siehe Befund B) — erklärt aber selbst dann nur rund 40 % der Lücke, nicht die ganze.

**Empfehlung:** Kostenaufschlüsselung beim Bohrunternehmen anfordern. Danach entweder
`LINEAR_PREIS_PRO_M`/`LINEAR_MOBILISIERUNG` für Lockergestein neu kalibrieren, oder im
Formelwerk-Tab explizit dokumentieren, dass der lineare Zweig nur kleinkalibrige Bohrungen
abbildet und für Geothermie-Produktionsbohrungen < 400 m untauglich ist.

**Umsetzung 2026-07-14 (M8.1) — 🟡 Gültigkeitsbereich deklariert, NICHT kalibriert.**
Bewusst die zweite Option. Solange die Kostenaufschlüsselung der Angebote fehlt, ist unbekannt,
welchen Umfang die Vergleichszahl überhaupt hat (Verrohrung? Filter? Kies? Pumpe?). Eine
Kalibrierung von €/m gegen eine Zahl unbekannten Scopes wäre kein Fix, sondern eine Annahme mit
Nachkommastellen — und sie landete in einem Produkt, das auch andere Kunden nutzen. Stattdessen:

- `kleinkaliberWarnung: boolean` in `BohrkostOutputs` (true bei `tiefe ≤ 400 m`), gerendert als
  Hinweis am Bohrtiefe-Slider — Muster wie `kluftaquiferWarnung` in DeltaT.
- Neue Formelwerk-Zeile `linear-gueltigkeit` mit Grund, Faktorbereich und Nicht-Kalibrierungs-
  Entscheidung; die Karte `linear-fallback` sagte zudem fälschlich „d < 500 m" statt ≤ 400 m
  (+ Blend bis 600 m) — korrigiert.

**Befund A bleibt offen.** Der Befund-B-Fix behebt ihn nicht und verschiebt die Vergleichsebene
leicht: Die Dublette bei 280 m liegt mit dem Default NDB (0,95) nun bei **302 T€** statt 318 T€
(Faktor 3,4 → **3,6**). Auch der größte wählbare Ausbau schließt die Lücke nicht — 13 3/8" ergibt
378 T€ und damit immer noch Faktor **2,8**. Das stützt die Diagnose: Der reale Ausbau (also klar jenseits des größten Faktor-Eintrags)
liegt außerhalb des Wertebereichs von `DURCHMESSER_FAKTOR`, die Lücke ist keine Faktor-Frage.
**Nächster Schritt unverändert:** Kostenaufschlüsselung anfordern, dann kalibrieren.

**Relevanz:** Blocker für `/lcoh`. Sobald LCOH-Modul und Bohrkost in derselben Suite laufen,
sieht jeder Nutzer den Widerspruch — Bohrkost würde für das Referenzprojekt rund 750 T€ CAPEX „einsparen",
was den LCOH der Geothermie um grob 8–10 EUR/MWh drückt und die Technologieentscheidung kippt.

### Befund B — 🟡 MITTEL: `durchmesser` und `region` sind unterhalb 400 m wirkungslos

In `berechneBohrkostenEine()` (kosten.ts:165–201) wird `f_gesamt` (Währung × Gestein × Region ×
Durchmesser × Markt) ausschließlich auf den **Lukawski-Zweig** angewendet. Der lineare Zweig
nutzt nur `LINEAR_PREIS_PRO_M[gesteinstyp]` — Durchmesser, Region und Marktaufschlag fallen
ersatzlos weg.

Nachgerechnet bei 280 m / Lockergestein:

| Variation | Ergebnis |
|---|---|
| Durchmesser 7" / 9 5/8" / 13 3/8" | 159,0 T€ / 159,0 T€ / 159,0 T€ (identisch) |
| Region NDB / Oberrheingraben | 159,0 T€ / 159,0 T€ (identisch) |
| *Zum Vergleich bei 800 m:* 7" vs. 13 3/8" | 1.485 T€ vs. 2.183 T€ (Faktor wirkt) |

Die UI bietet beide Eingaben an; unterhalb 400 m sind es **stille No-Ops**. Der Nutzer bekommt
keinen Hinweis, dass seine Auswahl folgenlos bleibt. Im Blend-Bereich 400–600 m wirken die
Faktoren zudem nur anteilig — bei 401 m praktisch gar nicht, bei 599 m fast voll.

**Empfehlung:** Entweder `f_durchmesser` und `f_region` auch auf den linearen Zweig anwenden
(Marktaufschlag bewusst **nicht** — die GtV-Preise sind bereits deutsche Marktpreise), oder
die betroffenen Felder unterhalb 400 m im UI deaktivieren und den Grund anzeigen.

**Umsetzung 2026-07-14 (M8.1) — ✅ behoben.** Erste Option: `f_region × f_durchmesser` wirken nun
auch im linearen Zweig (`kosten.ts`, `f_linear`). Bewusst **nicht** angewendet: `f_markt` (GtV-/
DVGW-Preise sind bereits deutsche Marktpreise), `f_waehrung` (Preise stehen in EUR) und
`f_gestein` (steckt bereits in `LINEAR_PREIS_PRO_M`).

Nachgerechnet bei flaches Lockergestein, eine Bohrung (vorher durchgängig 159,0 T€):

| Variation | vorher | nachher |
|---|---|---|
| 7" / 9 5/8" / 13 3/8" (NDB) | 159,0 / 159,0 / 159,0 T€ | **128,4 / 151,1 / 188,8 T€** |
| NDB / Molasse / Oberrheingraben (9 5/8") | 159,0 / 159,0 / 159,0 T€ | **151,1 / 159,0 / 166,9 T€** |

Der Faktor greift an der `linear`-Variablen selbst, nicht nur am `≤ 400 m`-Ast — dadurch nimmt der
Blend 400–600 m ihn anteilig mit und die Naht bleibt stetig. Verifiziert an den Rändern
(Lockergestein, 13 3/8", Oberrheingraben): 399→401 m = 0,92 %, 599→601 m = 1,00 %, direkt an der
Naht 400→400,1 m = 0,08 % und 599,9→600 m = 0,07 %. Das ist der bekannte Knick der Blend-Steigung,
kein Sprung. Regressionstests in `kosten.test.ts` (Stetigkeit + Monotonie über die Blend-Zone).

> **Hinweis:** Drei bestehende Tests (`kosten.test.ts`, Lineare-Fallback-Block) hatten den No-Op
> als Erwartungswert fixiert (165.000 / 310.000 / 510.000 EUR bei 300 m). Da `DEFAULT_INPUTS.region
> = 'NDB'` (0,95) ist, sind sie auf 156.750 / 294.500 / 484.500 EUR angepasst — die alten Werte
> waren die Beschreibung des Bugs, nicht der Sollzustand.

### Befund C — 🟡 MITTEL: Währungsfaktor — Doku/Code-Drift und zwei nicht nachrechenbare Herleitungen

Der Währungsfaktor ist an drei Stellen dokumentiert, mit **zwei unterschiedlichen Herleitungen und
zwei unterschiedlichen Werten**:

| Stelle | Wert | genannte Herleitung |
|---|---|---|
| `kosten.ts:178` (gerechnet) + Header + PLAUSI-Tabelle | **1.34** | US CPI ×1.54 (BLS); EUR/USD 1.39 (2009) → 1.15 (2026, ECB); notiert als `1.54 / (1.15/1.39)` |
| `BohrkostFormelTab.tsx`, Eintrag `waehrung` (nutzersichtbar) | **1,20** | EUR/USD-Langzeitdurchschnitt ≈ 1,10 + kumulierte Baupreisinflation 2009–2026 ≈ 45 % |

Die Ergebnisdifferenz beträgt ~12 % und wirkt auf den gesamten Lukawski-Zweig, also auf alle
Ergebnisse ≥ 400 m — die Mehrheit der Nutzungsfälle. Beim Nachrechnen ergibt sich: **keine der
beiden notierten Herleitungen liefert den Wert, den sie behauptet.**

| Herleitung wörtlich gerechnet | Ergebnis | behauptet |
|---|---|---|
| `1.54 / (1.15/1.39)` (Code-Kommentar, PLAUSI-Tabelle) | **1,86** | 1.34 |
| `(1/1,10) × 1,45` (FormelTab) | **1,32** | 1,20 |

**Der gerechnete Wert 1.34 ist dennoch korrekt** — er entspricht dem methodisch sauberen Weg
`1.54 / 1.15 = 1,339`: US-CPI inflationiert USD₂₀₀₉ → USD₂₀₂₆, anschließend **eine** Konversion zum
Kurs des Zieljahres. Ein Preisindex gilt nur in seiner eigenen Währung; der 2009er-Kurs 1.39 gehört
in diesen Rechenweg nicht hinein. Die Notation `/(1.15/1.39)` zieht ihn zusätzlich ein und zählt den
Wechselkurs damit doppelt — daher die 1,86. Es ist ein **Notationsfehler in der Doku, kein
Rechenfehler im Code**: `kosten.ts` rechnet mit der Konstanten 1.34, nicht mit dem Kommentar.

Der FormelTab-Wert **1,20 ist aus keiner Angabe rekonstruierbar** — auch nicht aus seinen eigenen
Eingangswerten, die 1,32 ergäben. Bemerkenswert: Mit dem Kurs 1,15 statt des „Langzeitdurchschnitts"
1,10 liefert der FormelTab-Ansatz `(1/1,15) × 1,45 = 1,26`, also dieselbe Größenordnung wie 1.34. Die
Divergenz entsteht also nicht durch die Methode, sondern durch die nicht abgeleitete Zahl 1,20 und den
veralteten Kurs.

**Bewertung:** Code = ✅ korrekt, FormelTab = ❌ falsch. Damit ist es eine **reine Doku-Korrektur**;
keine Berechnung ändert sich, die Lukawski-Tests in `kosten.test.ts` bleiben unverändert gültig.

**Umsetzung 2026-07-14 (M8.1) — ✅ behoben.** Drei Stellen auf eine Herleitung vereinheitlicht:

- `BohrkostFormelTab.tsx`, Eintrag `waehrung`: Formel `× 1,20` → `× 1,34`, Erläuterung auf den
  CPI-Weg umgestellt, Quelle auf BLS + ECB präzisiert.
- `kosten.ts:174–177` und Datei-Header: Notation `1.54 / (1.15/1.39)` → `1.54 / 1.15`; der Kurs 1.39
  (2009) entfällt, da im Rechenweg nicht benötigt.
- PLAUSI-Tabelle „Angewandte Korrekturfaktoren": dieselbe Korrektur.

Der Zahlenwert **1.34 bleibt unverändert** — verifiziert, dass `npm test` ohne Anpassung eines
einzigen Erwartungswerts grün bleibt.

### Nachtrag 14.07.2026 — Bohrplatz-Profil: warum Lukawski nicht schichtweise gerechnet wird

Mit dem optionalen Schichtenprofil (`docs/requirements/bohrplatz-profil.md`) stellte sich die
Frage, wie über Schichten integriert wird. Ergebnis: **je Zweig verschieden**, weil es zwei
verschiedene Arten von Modell sind.

**Linearer Zweig — echte Integration.** `LINEAR_PREIS_PRO_M` ist eine EUR/m-Rate und summiert
sich schichtweise. Mobilisierung nach dem **härtesten** durchbohrten Gestein: Das Bohrgerät muss
die härteste Schicht schaffen, nicht die durchschnittliche.

**Lukawski-Zweig — tiefengewichtetes Mittel von `f_gestein`** auf die unveränderte
Ganzbohrungs-Formel. **Nicht** schichtweise zerlegt, aus drei Gründen:

1. `C(d)` ist eine Regression über **146 ganze Bohrungen**, keine EUR/m-Rate. Sie liefert
   unterhalb **264,3 m negative Kosten** (bei 100 m: −388.000 USD₂₀₀₉) — genau deshalb existiert
   der lineare Zweig überhaupt.
2. Zerlegbar wäre sie nur über die Grenzkosten `dC/dd = (2 × 1.72e-7 · d + 2.3e-3) × 10⁶`. Das
   reproduziert `C(d)` exakt (numerisch geprüft bei 600/1000/2000 m). Aber der Term **−0,62 Mio.**
   ist ein **Fit-Artefakt ohne physikalische Bedeutung**. Ihn einer Schicht zuzuordnen verschiebt
   das Ergebnis um rund **829 T€** (Lockergestein 0,70 vs. Kristallin 1,30, bei f_währung ×
   f_region × f_durchmesser × f_markt = 2,228) — eine Zahl aus einer Willkür.
3. Der Realismusgewinn (eine Hartschicht bei 2000 m ist teurer als dieselbe bei 100 m) liegt
   **unter der AACE-Class-5-Bandbreite von ±35–50 %**, die der Rechner ohnehin ausweist.

Lukawski et al. (2014) kalibrieren auf ganzen Bohrungen; die Formel schichtweise anzuwenden wäre
eine Extrapolation, die die Quelle nicht hergibt.

**Rückwärtskompatibilität ist Teil der Aussage:** Eine Schicht über die volle Tiefe reproduziert
den Pauschalfall auf 6 Nachkommastellen exakt — belegt für 8 Tiefen × 3 Gesteinstypen. Ungültige
Profile (Lücke, Überlappung, zu kurz) rechnen nicht teilweise mit, sondern fallen ganz auf den
Pauschaltyp zurück; das UI benennt den Grund, statt still zurückzufallen.

**Sonderausbau > 13 3/8" (340 mm):** eingebbar, aber **ohne erfundenen Faktor**. `DURCHMESSER_FAKTOR`
endet bei 340 mm, jenseits davon gibt es keine Stützstelle. Gerechnet wird mit dem letzten
kalibrierten Wert (1,25), `ausserhalbKalibrierung` markiert das Ergebnis als **Wert für 13 3/8" —
keine Schätzung für den realen Ausbau**. Der eingegebene mm-Wert ist reine Dokumentation und geht
nicht in die Rechnung ein (ein Test hält genau das fest).

### Nachtrag 15.07.2026 — Annuitätenmethode (M8.1c): die Konvention ist kein Detail

`src/apps/lcoh/calc/annuitaet.ts`, Quelle **VDI 2067 Bl. 1**:

```
CRF = i · (1 + i)^n / ((1 + i)^n − 1)        Annuität = CAPEX × CRF
```

Nachgerechnet und als Test festgehalten:

| Konvention | CRF |
|---|---|
| Versorger — 6 % WACC / 30 a (**Default**) | 0,07265 |
| Investor — 10 % Hurdle Rate / 20 a | 0,11746 |
| **Verhältnis** | **1,617** |

**Die Konvention allein verschiebt jeden kapitalgetriebenen LCOH um Faktor 1,617** — ohne dass sich
am Projekt etwas ändert. Zerlegt man den Faktor, kommen **1,46 vom Zinssatz** und nur 1,20 von der
Laufzeit: Der Zins ist der dominante Hebel, nicht die Nutzungsdauer.

**Konsequenz für den Technologievergleich:** Der CRF verschiebt nicht nur das Niveau, sondern die
**Rangfolge**. Geothermie ist kapitalintensiv, ein Gaskessel opex-lastig — ein hoher CRF trifft die
Geothermie härter. Innerhalb eines Vergleichs muss die Methodik daher über alle Technologien
identisch sein; gemischt erzeugt sie eine Reihenfolge, die es in keiner Welt gibt.

**Grenzfall `zins = 0`:** Die Formel ist dort 0/0 und liefert still `NaN`. Der Grenzwert für i → 0
ist `1/n` (ohne Zins wird das Kapital linear verteilt) — im Code abgefangen, sonst zeigte eine
0-%-Annahme „NaN €/MWh".

**Offengelegte Befangenheit:** Der Default (6 %/30 a) begünstigt die Geothermie. Fachlich ist er
begründet — 30 a bilden die Brunnen-Lebensdauer realistischer ab als 20 a —, aber Geotherm ist eine
Geothermie-Suite, und ein Default, der die eigene Technologie besserstellt, ist angreifbar. Deshalb
ist die Prämisse Teil des Datentyps (`Methodik { zins, jahre, label, quelle }`) statt einer
Konstante: Eine Zahl ohne ihre Prämisse ist im Modell nicht darstellbar. Die Auflage, dass das
Label im UI an der Zahl klebt und nicht nur im FormelTab steht, ist in Tasks.md M8.1c als offener
Punkt für M8.2 vermerkt.

**Keine Methodenbereinigung ohne Komponenten:** `LCOH = (CAPEX × CRF + OPEX) / Wärmemenge` — nur der
CAPEX-Teil skaliert mit dem CRF. Eine nackte LCOH-Zahl lässt sich deshalb **nicht** in eine andere
Konvention umrechnen; das setzt die CAPEX/OPEX-Aufteilung aus der Registry (M8.2) voraus.

### Ergänzende Beobachtung (kein Befund)

Der COP-Cross-Check ist **konsistent**: Die DeltaT-Formel `COP = (T_VL/(T_VL − T_R)) × Gütegrad`
liefert für das Referenzprojekt (Vorlauf 65 °C, Reservoir 16,5 °C) bei einem Gütegrad von 0,43 exakt den
COP 3,0 aus dem Datenblatt V2 — mitten im zulässigen Band 0,30–0,65. Die Modelle widersprechen
sich also nur bei den Bohrkosten, nicht bei der Thermodynamik.

### Offene Fragen für die nächste Runde

1. Ist die Blend-Zone 400–600 m haltbar, wenn linearer Zweig (255 T€ bei 600 m) und Lukawski
   (1.079 T€ bei 600 m) an der Nahtstelle um **Faktor 4,2** auseinanderliegen? Der Blend glättet
   die Unstetigkeit, löst die Modelldivergenz aber nicht auf — er mittelt zwei Modelle, von denen
   an dieser Stelle höchstens eines stimmt.
2. Das Referenzprojekt (280 m) liegt genau im am schwächsten verankerten Bereich des Rechners. Gibt es weitere
   reale Angebote < 500 m zur Kalibrierung?
3. Ist **US-CPI** der richtige Index für `f_waehrung` (Befund C)? CPI misst Verbraucherpreise;
   Bohrkosten folgen eher Bau-/Bohrmarktpreisen (BLS PPI „Drilling Oil and Gas Wells", IHS UCCI),
   die im selben Zeitraum deutlich anders verlaufen sind. Der FormelTab nannte bis 07/2026 eine
   „Baupreisinflation ≈ 45 %" — eine Zahl ohne belegte Quelle, deren Ansatz aber fachlich näher
   liegt als CPI. Die Wahl ist materiell: CPI-Weg 1.34 vs. EUR-Baupreis-Weg (Kurs 2009 + 45 %) 1,04
   — Spanne ~29 %. Vor einer Änderung Indexquelle belegen; `f_markt` (1.40) könnte einen Teil des
   Effekts bereits verdeckt mit abdecken (Doppelzählungs-Risiko).

### Nachtrag 16.07.2026 — zweite Projektquelle bestätigt Befund A und erklärt ihn

Eine zweite, unabhängige Projektquelle (Wirtschaftlichkeitsmatrix des Betreibers, v4) nennt für
denselben Fall einen nochmals höheren Wert (Quelle: dasselbe Bohrunternehmen). Damit sagen zwei
Projektquellen Werte, die um Faktor 3,4 bzw. 5,0 über der Formel liegen, der Rechner 140–159 T€ — **Faktor 3,4 bis 5,0**.

**Die wahrscheinliche Ursache steht in derselben Quelle:** ein Ausbau-Durchmesser **oberhalb 400 mm**
(also klar jenseits des größten Faktor-Eintrags), Filterrohr Wickeldraht, dazu Kiesschüttung. `DURCHMESSER_FAKTOR` kennt als größten Wert
13 3/8" (340 mm) — und im linearen Zweig wirkt der Durchmesser ohnehin nicht (Befund B). Der lineare
GtV-/DVGW-Zweig (300 EUR/m Lockergestein) bildet damit **flache Brunnen kleinen Kalibers** ab, nicht
groß-kalibrige Förderbrunnen. Das erklärt beide Befunde in einem.

Ebenfalls neu: Die Referenzquelle nennt eine nochmals geringere Bohrtiefe — dort läge der
Rechner bei 140 T€, also Faktor 5,0.

**Konkrete Korrekturoptionen (Priorität):**
1. `DURCHMESSER_FAKTOR` um groß-kalibrige Ausbauten (> 400 mm) erweitern **und** die Faktoren auch
   auf den linearen Zweig anwenden (Marktaufschlag weiterhin nicht — GtV-Preise sind deutsche Preise).
2. `LINEAR_PREIS_PRO_M` / `LINEAR_MOBILISIERUNG` für Lockergestein an den beiden realen Stützstellen
   (zwei reale Angebote im Bereich ~200–300 m) kalibrieren — **vorher die Kostenaufschlüsselung anfordern**, damit
   klar ist, was in den Angeboten enthalten ist (Verrohrung? Filter? Kies? Pumpe?).
3. Bis dahin im `BohrkostFormelTab` offenlegen, dass der lineare Zweig für Geothermie-Produktions-
   brunnen < 400 m nicht belastbar ist.
