export default function DatensicherheitPage() {
  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-2xl">
      <h1>Datensicherheit</h1>
      <p>
        Technische und organisatorische Maßnahmen (TOMs) gemäß Art. 32 DSGVO —
        Stand: März 2026
      </p>

      <h2>Übertragungssicherheit</h2>
      <ul>
        <li>TLS 1.3 für alle Datenübertragungen</li>
        <li>HSTS (max-age 1 Jahr, includeSubDomains)</li>
        <li>HTTPS erzwungen, HTTP-Redirect aktiv</li>
      </ul>

      <h2>Speichersicherheit</h2>
      <ul>
        <li>AES-256-GCM-Verschlüsselung für sensible Inhalte und API-Keys</li>
        <li>Authentifizierungs-Tag (AEAD) verhindert unbemerkte Manipulation</li>
        <li>Randomisierter IV pro Verschlüsselungsvorgang</li>
      </ul>

      <h2>Zugriffskontrolle &amp; Mandantentrennung</h2>
      <ul>
        <li>PostgreSQL Row-Level Security (RLS) auf allen Tabellen</li>
        <li>Vollständige Mandantentrennung auf Datenbankebene</li>
        <li>Service-Role-Client nur serverseitig, nie im Browser</li>
      </ul>

      <h2>API-Keys &amp; Token</h2>
      <ul>
        <li>API-Keys SHA-256-gehashed (kein Klartext in der Datenbank)</li>
        <li>Einladungs-Token: 256-Bit Entropie (randomBytes)</li>
        <li>Scope-Prüfung (read/write) auf allen API-Endpunkten</li>
      </ul>

      <h2>HTTP-Sicherheitsheader</h2>
      <ul>
        <li>X-Frame-Options: DENY (kein Clickjacking)</li>
        <li>X-Content-Type-Options: nosniff</li>
        <li>X-XSS-Protection: 1; mode=block</li>
        <li>Referrer-Policy: strict-origin-when-cross-origin</li>
        <li>Permissions-Policy: camera=(), microphone=()</li>
      </ul>

      <h2>Eingabevalidierung</h2>
      <ul>
        <li>Zod-Schema-Validierung auf allen API-Routen</li>
        <li>UUID-Format-Prüfung auf Query-Parametern</li>
        <li>Fehlerbehandlung ohne Stack-Trace-Exposure</li>
      </ul>

      <h2>Serverstandort &amp; Compliance</h2>
      <ul>
        <li>Datenbankserver: Frankfurt am Main, Deutschland (EU)</li>
        <li>DSGVO-konformer Betrieb</li>
        <li>Kein Tracking, keine Analyse-Cookies</li>
      </ul>

      <h2>Sicherheitsüberprüfung</h2>
      <ul>
        <li>Statisches Code-Audit durchgeführt (März 2026)</li>
        <li>Alle identifizierten Schwachstellen behoben</li>
        <li>Audit-Log für alle datenschutzrelevanten Änderungen</li>
      </ul>

      <h2>BYOK-Hinweis</h2>
      <p>
        Bei Nutzung des BYOK-Modells verlassen Inhalte die Plattform ausschließlich in
        Richtung des vom Nutzer gewählten KI-Anbieters. Die Plattform speichert diese Inhalte
        nicht dauerhaft auf eigenen Servern. Für die Sicherheit der Verarbeitung beim
        Drittanbieter gelten dessen eigene Sicherheitsrichtlinien.
      </p>

      <h2>Sicherheitslücken melden</h2>
      <p>
        Sicherheitslücken bitte verantwortungsvoll melden an:{' '}
        <strong>security@vencly.com</strong>
      </p>
      <p>
        Wir bemühen uns um eine Antwort innerhalb von 48 Stunden und behandeln alle Meldungen
        vertraulich.
      </p>

      <h2>Auftragsverarbeitungsvertrag (AVV)</h2>
      <p>
        B2B-Kunden, die personenbezogene Daten über die Plattform verarbeiten, können einen AVV
        nach Art. 28 DSGVO anfordern: datenschutz@vencly.com
      </p>
    </div>
  )
}
