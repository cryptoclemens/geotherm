export default function ImpressumPage() {
  return (
    <div className="container mx-auto px-4 py-8 prose dark:prose-invert max-w-2xl">
      <h1>Impressum</h1>
      <p>Angaben gemäß § 5 TMG</p>

      <table>
        <tbody>
          <tr><td><strong>Firma</strong></td><td>vencly GmbH</td></tr>
          <tr><td><strong>Anschrift</strong></td><td>Leopoldstraße 31, 80802 München, Deutschland</td></tr>
          <tr><td><strong>Geschäftsführer</strong></td><td>Clemens Eugen Theodor Pompeÿ</td></tr>
          <tr><td><strong>Handelsregister</strong></td><td>HRB 290524, Amtsgericht München</td></tr>
          <tr><td><strong>USt-IdNr.</strong></td><td>DE367131457 (gemäß § 27a UStG)</td></tr>
          <tr><td><strong>E-Mail</strong></td><td>hello@vencly.com</td></tr>
          <tr><td><strong>Website</strong></td><td>www.vencly.com</td></tr>
        </tbody>
      </table>

      <p>
        <strong>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</strong><br />
        Clemens Eugen Theodor Pompeÿ, Leopoldstraße 31, 80802 München
      </p>

      <p>
        <strong>Streitschlichtung:</strong><br />
        Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
          https://ec.europa.eu/consumers/odr
        </a>
      </p>
      <p>
        Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <p>
        <strong>Haftungsausschluss:</strong><br />
        Die Inhalte dieser Plattform wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte kann die vencly GmbH jedoch keine Gewähr
        übernehmen. Als Diensteanbieter ist die vencly GmbH gemäß § 7 Abs. 1 TMG für eigene
        Inhalte nach den allgemeinen Gesetzen verantwortlich.
      </p>
    </div>
  )
}
