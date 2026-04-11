export default function DatenschutzPage() {
  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-2xl">
      <h1>Datenschutzerklärung</h1>
      <p><strong>Stand:</strong> April 2026 · vencly GmbH, Leopoldstraße 31, 80802 München</p>

      <h2>1. Verantwortlicher</h2>
      <p>vencly GmbH, Leopoldstraße 31, 80802 München · hello@vencly.com</p>

      <h2>2. Erhobene Daten</h2>
      <ul>
        <li><strong>E-Mail-Adresse</strong> (Pflichtfeld für die Anmeldung)</li>
        <li><strong>Nutzungsdaten</strong> (App-Version, Browser/OS bei Feedback-Einsendungen)</li>
        <li><strong>Projekt-Daten</strong> (von Ihnen eingegebene Standort- und Berechnungsparameter)</li>
      </ul>

      <h2>3. Zweck der Verarbeitung</h2>
      <ul>
        <li>Bereitstellung des Dienstleistungsangebots (Art. 6 Abs. 1 lit. b DSGVO)</li>
        <li>Produkt-Verbesserung auf Basis von Feedback (Art. 6 Abs. 1 lit. a DSGVO)</li>
      </ul>

      <h2>4. Speicherung & Hosting</h2>
      <p>Daten werden auf Servern in der EU gespeichert (Supabase EU-Frankfurt).</p>

      <h2>5. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch. Anfragen an: hello@vencly.com
      </p>

      <h2>6. Löschung</h2>
      <p>Auf Anfrage werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht.</p>
    </div>
  )
}
