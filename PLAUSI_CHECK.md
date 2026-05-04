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
| Währung USD₂₀₀₉ → EUR₂₀₂₆ | **1.34** | US CPI 2009–2026: ×1.54 (BLS); EUR/USD: 1.39→1.15 (ECB) → 1.54/(1.15/1.39) ≈ 1.34. Nächste Prüfung: April 2027 |
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
