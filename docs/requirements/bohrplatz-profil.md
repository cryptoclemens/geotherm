# Requirements: Bohrplatz-Profil (Bohrkost)

## Ziel

Die geologischen Gegebenheiten eines konkreten Bohrplatzes als optionale Eingabe erfassen —
Schichtenfolge statt eines Pauschal-Gesteinstyps für die ganze Bohrung — und die Bohrkosten
darüber integrieren.

## Warum das nicht aus dem Atlas kommen kann

Die feinste Geologie-Ebene des Atlas ist GÜK250 (BGR, 1:250.000). Dort entspricht 1 mm
250 m Realität; ein Bohrplatz ist darauf ein Punkt ohne Fläche. Vor allem aber zeigt GÜK250
**Oberflächengeologie**, während der Rechner die **durchbohrte Schichtenfolge** braucht — ein
Standort kann oben Lockergestein führen und bei 150 m Festgestein. Das sind verschiedene Fragen,
nicht dieselbe in verschiedener Auflösung. Die Schichtenfolge kann nur aus Schichtenverzeichnissen
der Landesämter, Nachbarbohrungen oder vom Bohrunternehmen kommen → manuelle Eingabe, optional.

## Nicht-Ziele (Out of Scope)

- **Keine Kalibrierung des linearen Zweigs an realen Angeboten.** Ohne Kostenaufschlüsselung ist
  der Scope der Vergleichszahl unbekannt (Verrohrung? Filter? Kies? Pumpe?). Bewusst
  zurückgestellt — siehe PLAUSI_CHECK.md, Befund A.
- **Kein erfundener Durchmesserfaktor jenseits 13 3/8" (340 mm).** Es gibt keine belastbare
  Stützstelle. Der Sonderausbau ist eingebbar und verlässt den Gültigkeitsbereich sichtbar.
- Keine Ableitung des Profils aus Kartendaten (siehe oben).
- Kein Schichtenprofil für DeltaT — dort beschreibt `ProjectGeologicalData` den *Aquifer*, nicht
  die durchbohrte Folge. Angrenzendes, aber anderes Konzept.

## Akzeptanzkriterien

- [ ] `profil: BohrplatzProfil | null` in `BohrkostInputs`; `null` = bisheriges Verhalten
- [ ] Eine Schicht über die volle Tiefe reproduziert den Pauschalfall **exakt** (alle 136
      bestehenden Tests bleiben grün, ohne Toleranzaufweichung)
- [ ] Lückenlose, überlappungsfreie Abdeckung 0…tiefe wird validiert; ungültige Profile fallen
      auf den Pauschaltyp zurück statt still Unsinn zu rechnen
- [ ] `quelle` je Profil ist Pflichtfeld (Schichtenverzeichnis / Nachbarbohrung /
      Bohrunternehmen / Schätzung)
- [ ] Sonderausbau > 13 3/8" eingebbar, Ergebnis klar als „außerhalb der Kalibrierung" markiert
- [ ] Blend-Zone 400–600 m bleibt stetig, keine neue Unstetigkeit
- [ ] Profil überlebt Speichern/Laden über `/projects`

## Technische Entscheidungen

### Integration je Zweig — Hybrid (bestätigt 2026-07-14)

Die beiden Zweige sind verschiedene Arten von Modell und werden verschieden integriert:

**Linearer Zweig** — echte Integration. `LINEAR_PREIS_PRO_M` ist eine €/m-Rate und lässt sich
schichtweise summieren:
```
linear = Σᵢ PREIS_PRO_M[gesteinᵢ] × mächtigkeitᵢ + MOBILISIERUNG[härtestes Gestein]
```
Mobilisierung nach dem härtesten durchbohrten Gestein: Das Bohrgerät muss die härteste Schicht
schaffen, nicht die durchschnittliche. Mit einer Schicht ist das Maximum diese Schicht →
rückwärtskompatibel.

**Lukawski-Zweig** — tiefengewichteter Mittelwert auf die unveränderte Ganzbohrungs-Formel:
```
f_gestein_eff = Σᵢ (mächtigkeitᵢ / tiefe) × GESTEINS_FAKTOR[gesteinᵢ]
lukawski = C(tiefe) × f_waehrung × f_gestein_eff × f_region × f_durchmesser × f_markt
```

**Warum Lukawski NICHT schichtweise zerlegt wird** (verifiziert 2026-07-14):
`C(d) = (1.72e-7 d² + 2.3e-3 d − 0.62) × 10⁶` ist eine Regression über **ganze Bohrungen**, keine
€/m-Rate. Sie liefert unterhalb **264,3 m negative Kosten** (bei 100 m: −388.000 USD) — deshalb
existiert der lineare Zweig. Zerlegbar wäre sie nur über die Grenzkosten `dC/dd`; das reproduziert
`C(d)` exakt (numerisch geprüft bei 600/1000/2000 m). Aber der Term **−0,62 Mio.** ist ein
Fit-Artefakt ohne physikalische Bedeutung. Ihn einer Schicht zuzuordnen verschiebt das Ergebnis um
**829 T€** (Lockergestein 0,70 vs. Kristallin 1,30, bei f_währung × f_region × f_durchmesser ×
f_markt = 2,228) — eine Zahl aus einer Willkür. Der Zugewinn an Realismus (tiefe Hartschicht ist
teurer als flache) liegt zudem unter der AACE-Class-5-Bandbreite von ±35–50 %.

Lukawski et al. (2014) kalibrieren auf 146 ganzen Bohrungen. Die Formel schichtweise anzuwenden
ist eine Extrapolation, die die Quelle nicht hergibt — CLAUDE.md verbietet Formeländerungen ohne
vorherige PLAUSI-Prüfung.

### Sonderausbau > 13 3/8"

`DURCHMESSER_FAKTOR` endet bei 13 3/8" (340 mm); reale Projektdaten nennen deutlich größere
Ausbauten. Kein erfundener Faktor: Der Sonderausbau rechnet mit dem letzten kalibrierten Faktor
(1,25) und setzt `ausserhalbKalibrierung = true`. Das Ergebnis ist damit ausdrücklich **kein
Schätzwert für diesen Ausbau**, sondern der Wert für 13 3/8" — die Mehrkosten des größeren Ausbaus
fehlen vollständig.

**Darstellungsstufe:** hier bewusst die amber-Stufe („Formel nicht anwendbar", wie
`kluftaquiferWarnung`), nicht die blaue Hinweis-Stufe des Kalibrierungshinweises. Der Unterschied
ist gewollt: Unter 400 m ist der Rechner innerhalb seiner Kalibrierung und liefert einen
belastbaren Wert (blau, Hinweis). Beim Sonderausbau ist er es nicht (amber, Warnung).

### Persistenz

`/projects` speichert `bohrkost_input: BohrkostInputs` als JSONB (`src/core/api/projects.ts`).
Das Profil ist Teil von `BohrkostInputs` → Persistenz ohne Schema-Change.

**Kein `version`-Bump im Store nötig** (verifiziert 2026-07-14): `useBohrkostStore` normalisiert
in `merge` bereits gegen die Defaults (`{ ...current.inputs, ...p.inputs }`). Alter
localStorage-State enthält keinen `profil`-Key — JSON serialisiert kein `undefined` —, der Spread
lässt daher den Default `null` stehen. Zusätzlich ist `profilIstGueltig()` gegen fehlende Werte
robust (`!profil` fängt null und undefined), sodass `berechneBohrkosten` auch ohne das Feld nicht
crasht. Beides mit einem Wegwerf-Test gegen echten v1-JSON geprüft.

## Architekturprinzip (aus dem Termin, gilt über dieses Feature hinaus)

Jeder Rechner ist ein **Modell**, jede reale Projekt-Kostentabelle eine **Messung**. Modelle werden
von Messungen kalibriert, nicht umgekehrt. Der Datenfluss läuft hier also rückwärts
(Projekt → Rechner), nicht vorwärts. Vergleiche die Quellen-Hierarchie in Tasks.md M8.2b.
