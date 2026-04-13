export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-2xl">
      <h1>Datenschutzerklärung</h1>
      <p>
        Gemäß Art. 13/14 DSGVO, TTDSG und anwendbarem deutschen Datenschutzrecht —
        Stand: März 2026
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        <strong>vencly GmbH</strong><br />
        Leopoldstraße 31, 80802 München<br />
        E-Mail: datenschutz@vencly.com<br />
        Geschäftsführer: Clemens Eugen Theodor Pompeÿ<br />
        HRB 290524, Amtsgericht München
      </p>

      <h2>2. Verarbeitete Datenkategorien &amp; Zwecke</h2>
      <p>
        <strong>a) Account-Daten</strong> (Name, E-Mail-Adresse, Passwort-Hash)<br />
        Zweck: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)
      </p>
      <p>
        <strong>b) Nutzerinhalte</strong> (z. B. Meeting-Transkripte, Aufgaben, Notizen)<br />
        Zweck: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)<br />
        Hinweis: Bei BYOK werden Inhalte direkt an den gewählten KI-Anbieter übermittelt
        (keine dauerhafte Speicherung auf eigenen Servern).
      </p>
      <p>
        <strong>c) Nutzungs- und Logdaten</strong> (IP-Adresse, Zugriffszeiten, Fehlermeldungen)<br />
        Zweck: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) – IT-Sicherheit,
        Missbrauchsprävention
      </p>
      <p>
        <strong>d) LLM-API-Keys</strong><br />
        Zweck: Vertragserfüllung (lit. b). Keys werden AES-256-GCM-verschlüsselt gespeichert.
        Nur der jeweilige Workspace-Inhaber hat Zugang.
      </p>
      <p>
        <strong>e) Zahlungsdaten</strong><br />
        Zweck: Vertragserfüllung (lit. b); Verarbeitung durch externen Zahlungsdienstleister.
      </p>
      <p>
        <strong>f) Feedback</strong><br />
        Zweck: Freiwillig eingereichte Nachrichten. Rechtsgrundlage: Art. 6 Abs. 1 lit. a
        DSGVO (Einwilligung durch Absenden).
      </p>

      <h2>3. BYOK – KI-Drittanbieter</h2>
      <p>
        Bei Nutzung des BYOK-Modells werden Inhalte direkt an den vom Nutzer gewählten Anbieter
        übermittelt. Der Workspace-Betreiber agiert als eigener Verantwortlicher gegenüber dem
        KI-Anbieter.
      </p>
      <p>Es gelten jeweils die Datenschutzrichtlinien des gewählten Anbieters:</p>
      <ul>
        <li>Anthropic: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noreferrer">https://www.anthropic.com/privacy</a></li>
        <li>OpenAI: <a href="https://openai.com/privacy" target="_blank" rel="noreferrer">https://openai.com/privacy</a></li>
        <li>Microsoft Azure OpenAI: <a href="https://privacy.microsoft.com" target="_blank" rel="noreferrer">https://privacy.microsoft.com</a></li>
        <li>Perplexity AI: <a href="https://www.perplexity.ai/privacy" target="_blank" rel="noreferrer">https://www.perplexity.ai/privacy</a></li>
      </ul>
      <p>
        Die US-amerikanischen Anbieter haben Standardvertragsklauseln mit der EU abgeschlossen.
        Die Datenübermittlung erfolgt auf Grundlage von Art. 46 Abs. 2 lit. c DSGVO.
      </p>

      <h2>4. Auftragsverarbeiter</h2>
      <p>
        <strong>Vercel Inc.</strong>, 340 Pine Street, Suite 701, San Francisco, CA 94104, USA<br />
        Zweck: Hosting, CDN. Grundlage: Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO)<br />
        Datenschutzrichtlinie: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">https://vercel.com/legal/privacy-policy</a>
      </p>
      <p>
        <strong>Supabase Inc.</strong><br />
        Zweck: Datenbank, Authentifizierung, Storage. Serverstandort: EU (Frankfurt am Main).<br />
        Datenschutzrichtlinie: <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">https://supabase.com/privacy</a>
      </p>
      <p>
        <strong>Zahlungsanbieter:</strong> Mollie B.V., Keizersgracht 126, 1015 CW Amsterdam, Niederlande<br />
        Datenschutzrichtlinie: <a href="https://www.mollie.com/de/privacy" target="_blank" rel="noreferrer">https://www.mollie.com/de/privacy</a>
      </p>

      <h2>5. Speicherdauer</h2>
      <ul>
        <li>Account-Daten: bis zur Kündigung + 30 Tage Kulanzfrist</li>
        <li>Nutzerinhalte: bis zur manuellen Löschung, spätestens 90 Tage nach Vertragsende</li>
        <li>Logdaten (Server-Logs): maximal 30 Tage rollierend</li>
        <li>Feedback-Daten: anonymisiert nach 12 Monaten</li>
        <li>Steuerrelevante Daten: 10 Jahre (§ 147 AO)</li>
      </ul>

      <h2>6. Betroffenenrechte (Art. 15–22 DSGVO)</h2>
      <p>Sie haben das Recht auf:</p>
      <ul>
        <li><strong>Auskunft</strong> (Art. 15) über gespeicherte Daten</li>
        <li><strong>Berichtigung</strong> (Art. 16) unrichtiger Daten</li>
        <li><strong>Löschung</strong> (Art. 17) &ndash; &bdquo;Recht auf Vergessenwerden&ldquo;</li>
        <li><strong>Einschränkung</strong> (Art. 18) der Verarbeitung</li>
        <li><strong>Datenübertragbarkeit</strong> (Art. 20) – Export als XLSX oder JSON auf Anfrage</li>
        <li><strong>Widerspruch</strong> (Art. 21) gegen Verarbeitungen auf Basis berechtigter Interessen</li>
        <li><strong>Widerruf</strong> einer Einwilligung jederzeit mit Wirkung für die Zukunft</li>
      </ul>
      <p>Zur Ausübung dieser Rechte: datenschutz@vencly.com</p>

      <h2>7. Beschwerderecht</h2>
      <p>
        Zuständige Aufsichtsbehörde:<br />
        <strong>Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</strong><br />
        Promenade 18, 91522 Ansbach<br />
        <a href="https://www.lda.bayern.de" target="_blank" rel="noreferrer">https://www.lda.bayern.de</a>
      </p>

      <h2>8. Cookies &amp; Tracking</h2>
      <p>
        Es werden ausschließlich funktional notwendige Cookies für die Sitzungsverwaltung
        (Supabase Auth) verwendet. Keine Analyse-, Werbe- oder Tracking-Cookies.
        Technisch notwendige Session-Cookies werden ohne Einwilligung gesetzt
        (§ 25 Abs. 2 Nr. 2 TTDSG). Eine Cookie-Einwilligung ist daher nicht erforderlich.
      </p>

      <h2>9. Datensicherheit (Art. 32 DSGVO)</h2>
      <p>
        Technische und organisatorische Maßnahmen (TOMs) — siehe{' '}
        <a href="/datensicherheit">Datensicherheit</a>.
      </p>

      <h2>10. Auftragsverarbeitungsvertrag (AVV)</h2>
      <p>
        B2B-Kunden, die personenbezogene Daten über die Plattform verarbeiten, können einen AVV
        nach Art. 28 DSGVO anfordern: datenschutz@vencly.com
      </p>

      <h2>11. Änderungen dieser Datenschutzerklärung</h2>
      <p>
        Diese Datenschutzerklärung wird bei wesentlichen Änderungen der Datenverarbeitung
        aktualisiert. Nutzer werden über wesentliche Änderungen per E-Mail informiert.
      </p>

      <blockquote>
        <p>
          Diese Datenschutzerklärung wurde nach bestem Wissen gemäß DSGVO erstellt.
          Für eine rechtsverbindliche Prüfung wird die Konsultation eines
          Datenschutzbeauftragten empfohlen.
        </p>
      </blockquote>
    </div>
  )
}
