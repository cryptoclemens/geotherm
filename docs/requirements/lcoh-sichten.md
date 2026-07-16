# Requirements: LCOH-Sichten (M8.0b)

## Ziel

`/lcoh` rechnet **einmal** und präsentiert dieselbe Rechnung in **drei Sichten** — Endkunde,
Auftraggeber-Gate, Bank. Die Sicht bestimmt, *was gezeigt wird* und *unter welcher Methodik-
Voreinstellung*, nie *was gerechnet wird*.

Anlass (Scope-Termin 14.07.2026, Fachplaner): *„Eine Bank möchte eine Risikokalkulation sehen und
der Auftraggeber möchte einfach den internen Gate-Prozess sehen."* Dazu der Endkunde, dem es um
den Vergleich geht — drei Adressaten, eine Rechnung.

## Kernentscheidung: Sicht = Präsentationsmodus, keine Berechtigung

Der Nutzer von `/lcoh` ist der **Fachplaner** — die Suite ist login-geschützt, weder Endkunde noch
Bank bedienen sie. Die „Endkunden-Sicht" ist das, was der Fachplaner dem Kunden **zeigt oder
exportiert**, nicht ein Account mit eingeschränkten Rechten.

Konsequenz: ein **Umschalter**, kein Rollen-/Rechtemodell. Das hält M8.2 klein und vermeidet, dass
aus einer Darstellungsfrage eine Auth-Architektur wird.

## Die drei Sichten

| Sicht | Adressat | Leitfrage | Methodik-Default | zeigt |
|---|---|---|---|---|
| **Vergleich** | Endkunde | „Was ist der Vorteil der Geothermie gegenüber den Alternativen?" | Versorger (6 % / 30 a) | LCOH aller sechs Technologien, Spanne mit Quellenangabe (M8.2b), Produktlayer (M8.1b) |
| **Gate** | Auftraggeber intern | „Besteht das Projekt den Gate-Prozess — und woran hängt es?" | Investor (10 % / 20 a) | Kostenziel-Modus (M8.2b), Tornado/Sensitivität, Break-even-Gaspreis, Gate-KPIs (**Platzhalter**, s. u.) |
| **Risiko** | Bank / Projektfinanzierung | „Wie belastbar ist die Rechnung?" | Investor (10 % / 20 a) | Monte-Carlo-Bandbreiten — **Stub bis M8.6**, sichtbar als „vorgesehen", nicht versteckt |

**Mapping auf M8.1c ist der Kern:** Die Methodik-Presets aus `src/apps/lcoh/calc/annuitaet.ts`
sind die Voreinstellung je Sicht — Vergleichslogik rechnet als Versorger, Gate und Bank mit der
Hurdle Rate. Umschaltbar bleibt die Methodik in jeder Sicht; das Label klebt an jeder Zahl
(Auflage aus M8.1c, Tasks.md).

**Interne Instrumente bleiben intern:** Sensitivität/Tornado und Break-even-Gaspreis erscheinen
nur in der Gate-Sicht. Begründung steht in Tasks.md M8.0b („dem Endkunden ist das Preisrisiko
egal — internes Instrument für Preisfindung und Gate") und M8.2b (Break-even als „Benchmark, um
zur Organisation zurückzugehen" — ein Kostenziel-Werkzeug, kein Kundenargument). Bestätigt im
Design-Review 16.07.2026.

## Sicht = Daten, analog zu `Methodik`

```
Sicht {
  zielgruppe:       'Vergleich' | 'Gate' | 'Risiko'
  leitfrage:        string            // steht als Untertitel über der Ausgabe
  methodikDefault:  Methodik          // Preset aus annuitaet.ts, umschaltbar
  ausgaben:         Ausgabe[]         // welche Blöcke die ResultColumn rendert
}
```

Registry-tauglich nach dem Muster aus M8.2 (Prämissen = Daten): Wenn die Gate-Antworten kommen,
ändern sich **Daten** (die `ausgaben`-Liste der Gate-Sicht), kein Code. Kein Implementierungs-
schritt in dieser Stufe — der Typ entsteht mit der Portierung (M8.2), wenn `ResultColumn` gebaut
wird. Ihn vorher anzulegen hieße, `ausgaben` zu raten — genau das Problem, das M8.0b benennt.

## Gate-Sicht: deklarierter Platzhalter statt geratener KPIs

Welche Kennzahlen der interne Gate-Prozess prüft, ist **unbeantwortet** (Rückfrage läuft, Anhang A).
Bis die Antwort da ist, zeigt die Gate-Sicht sichtbar an: *„Gate-Kennzahlen noch nicht hinterlegt —
Rückfrage beim Auftraggeber läuft."* Ehrlicher Zustand statt plausibel aussehender Vermutung;
dieselbe Linie wie `ausserhalbKalibrierung` in Bohrkost.

## Nicht-Ziele (Out of Scope)

- **Kein Rollen-/Rechtemodell** — Sicht ist Darstellung, nicht Autorisierung.
- **Keine geratenen Gate-KPIs** — Platzhalter bis zur Antwort auf Anhang A.
- **Kein Code in dieser Stufe** — die `/lcoh`-UI existiert nicht; der Sicht-Typ entsteht mit M8.2.
- **Kein Kunden-Export-Format** (PDF o. Ä.) — eigenes Thema, erst wenn die Vergleichs-Sicht steht.

## Akzeptanzkriterien

- [ ] `ResultColumn`-Entwurf in M8.2 hat den Sichten-Umschalter von Anfang an (kein Nachrüsten)
- [ ] Methodik-Label klebt in **jeder** Sicht an **jeder** Zahl (M8.1c-Auflage)
- [ ] Tornado, Sensitivität und Break-even-Gaspreis erscheinen ausschließlich in der Gate-Sicht
- [ ] Gate-Sicht zeigt den Platzhalter-Zustand ehrlich an, solange die KPIs unbeantwortet sind
- [ ] Risiko-Sicht ist als Stub sichtbar und verweist auf M8.6 (Monte-Carlo ist eines von drei
      Kernzielen, nur zeitlich nachgelagert — Tasks.md M8.0b)
- [ ] Sichtwechsel ändert nie Rechenergebnisse, nur Auswahl und Rahmung der Ausgaben

## Anhang A: Fragenkatalog Gate-Prozess (an den Auftraggeber, namensfrei)

> Für die Ausgestaltung des LCOH-Moduls richten wir die Ergebnisdarstellung an eurem internen
> Gate-Prozess aus. Dazu sieben Fragen:
>
> 1. **Welche Kennzahlen entscheidet das Gate?** LCOH in €/MWh, NPV/IRR, Amortisationsdauer,
>    CAPEX absolut — was davon, in welcher Priorität?
> 2. **Mit welcher Methodik rechnet ihr?** Diskontsatz bzw. Hurdle Rate und Betrachtungsdauer —
>    wir haben derzeit 10 % über 20 Jahre als Investoren-Konvention hinterlegt; stimmt das?
> 3. **Welche Schwellen gelten?** Go/No-Go-Kriterien je Gate-Stufe, und wie viele Stufen
>    durchläuft ein Projekt?
> 4. **Welches Format erwartet das Gremium?** Eine Einzelzahl, Base/Best/Worst, eine Bandbreite
>    mit Quellenangabe?
> 5. **Je Produktlayer oder Gesamtprojekt?** Wird je Leistungsstufe (Brunnen-Infrastruktur bis
>    Komplett-Belieferung) einzeln bewertet oder das Projekt als Ganzes?
> 6. **Welche Risiken will das Gate quantifiziert sehen?** Fündigkeit, Bohrkosten, Strompreis,
>    Gaspreis, Absatzmenge — und in welcher Form (Sensitivität, Szenarien, Verteilungen)?
> 7. **Gibt es ein bestehendes Formblatt oder Template des Gate-Prozesses?** Ein echtes Artefakt
>    wäre für uns wertvoller als jede Beschreibung — daran richten wir die Ausgabe aus.

Antworten fließen als **Daten** in die `ausgaben`-Liste der Gate-Sicht (siehe oben), nicht als
Code-Änderung.
