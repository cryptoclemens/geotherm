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

## Primärquellen

- **Gringarten & Sauty (1975)** — A theoretical study of heat extraction from aquifers with uniform regional flow. *J. Geophys. Res.* 80(35), 4956–4962. → Durchbruchszeit-Formel
- **Arpagaus et al. (2018)** — High temperature heat pumps: Market overview, state of the art, research status. *Energy* 152, 1626–1646. → COP-Gütegrad 0.5
- **Stober & Bucher (2012)** — *Geothermie*. Springer. Kap. 7.4. → Förderhöhe Tauchpumpe
- **VDI 4640 Blatt 2** (2001) — Thermische Nutzung des Untergrunds. → Transmissivität, Pumpenleistung
- **DVGW W 115** — Bohrungen für Grundwassererschließung. → TDS-Grenzwerte, Material-Empfehlungen
- **VDI Wärmeatlas (2019)** — Abschn. C1. → LMTD Gegenstrom
