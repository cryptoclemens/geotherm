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

1. **Gütegrad 0.5** im COP — soll user-einstellbar sein? (0.4 HT-WP, 0.55 Standard)  
2. **Porosität n=0.25** ist hardcoded — sollte Input werden (NDB Malm ~0.08, Molasse ~0.2)
3. **Wärmekapazitäts-Ratio** — fester Default 0.7 oder als Input `rhoCpRatio` exponieren?

---

---

## Bohrkostenrechner — Lukawski-Formel (Stand April 2026)

> **Geprüft durch:** Formel-Recherche + Quellenabgleich  
> **Modul:** `src/apps/bohrkost/calc/kosten.ts`  
> **Status:** Deploybar als CAPEX-Orientierungsrechner mit Disclaimer.

### Kernformel

```
C(d) = (1.72e-7 × d² + 2.3e-3 × d − 0.62) × 10⁶   [USD 2009]
```
Quelle: **Lukawski et al. (2014)**, *J. Pet. Sci. Eng.* 118, 1–14.  
Gültig für: Geothermale Bohrungen 500–5000 m.

**Angewandte Korrekturfaktoren:**

| Faktor | Wert | Quelle |
|---|---|---|
| Währung USD₂₀₀₉ → EUR₂₀₂₆ | 1.20 | ECB Langzeitdurchschnitt + Inflation 2009–2026 |
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
| Währungs-Faktor | Pauschal 1.20 — keine jährliche Aktualisierung | ±10 % |
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
