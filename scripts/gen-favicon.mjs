/**
 * Favicon-Generator für Geotherm
 * Erzeugt: favicon.ico (16+32), icon.svg, icon-192.png, icon-512.png
 * Löscht sich danach selbst nicht — manuell entfernen oder in .gitignore
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root     = path.resolve(__dirname, '..')
const appDir   = path.join(root, 'src/app')
const iconsDir = path.join(root, 'public/icons')

// ── Brand-Farben ──────────────────────────────────────────────────────────────
const C = {
  bg:       '#07101e',   // tiefstes Navy
  layer1:   '#0c1e36',   // erste Erdschicht
  layer2:   '#0e2540',   // zweite Erdschicht
  layer3:   '#112c4a',   // dritte Erdschicht
  teal:     '#0ab5c8',   // Primär-Teal (oklch 0.62 0.14 195)
  tealMid:  '#06a0b3',
  tealGlow: '#22d3ee',   // helles Glow-Teal
  surface:  '#1a4a72',   // Erdoberflächenlinie
}

// ── SVG-Templates ─────────────────────────────────────────────────────────────

/** Favicon-SVG für 32×32 und 16×16: Bohr-Chevron + Wärmequelle */
function makeFaviconSvg(size = 32) {

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${C.tealGlow}" stop-opacity="1"/>
      <stop offset="60%"  stop-color="${C.teal}"     stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${C.teal}"     stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bgGrad" cx="50%" cy="80%" r="70%">
      <stop offset="0%"   stop-color="${C.layer2}"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </radialGradient>
  </defs>

  <!-- Hintergrund -->
  <rect width="32" height="32" rx="7" fill="url(#bgGrad)"/>

  <!-- Geologische Schichten (Wellenlinien) -->
  <path d="M3 15 Q10 12.5 16 15 Q22 17.5 29 15" fill="none" stroke="${C.surface}" stroke-width="0.8" opacity="0.7"/>
  <path d="M3 19 Q10 16.5 16 19 Q22 21.5 29 19" fill="none" stroke="${C.layer2}" stroke-width="0.8" opacity="0.5"/>
  <path d="M3 23 Q10 20.5 16 23 Q22 25.5 29 23" fill="none" stroke="${C.layer3}" stroke-width="0.8" opacity="0.4"/>

  <!-- Bohr-Chevron (zeigt Richtung: runter = in die Erde) -->
  <path d="M9 5 L16 14 L23 5" fill="none" stroke="${C.teal}" stroke-width="2.6"
        stroke-linejoin="round" stroke-linecap="round"/>

  <!-- Verbindungslinie Chevron → Wärmequelle -->
  <line x1="16" y1="14" x2="16" y2="18.5" stroke="${C.teal}" stroke-width="1.6"
        stroke-linecap="round" opacity="0.8"/>

  <!-- Wärmequellen-Glow -->
  <circle cx="16" cy="24" r="5.5" fill="url(#glow)" opacity="0.5"/>
  <circle cx="16" cy="24" r="3"   fill="${C.tealMid}" opacity="0.7"/>
  <circle cx="16" cy="24" r="1.6" fill="${C.tealGlow}"/>
</svg>`
}

/** App-Icon SVG für 192× und 512×: detaillierter, mit Wordmark */
function makeAppIconSvg(size = 512) {

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>
    <radialGradient id="bgG" cx="50%" cy="75%" r="65%">
      <stop offset="0%"   stop-color="#0d2241"/>
      <stop offset="100%" stop-color="${C.bg}"/>
    </radialGradient>
    <radialGradient id="heatG" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${C.tealGlow}" stop-opacity="1"/>
      <stop offset="55%"  stop-color="${C.teal}"     stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${C.teal}"     stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="chevG" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${C.tealGlow}"/>
      <stop offset="100%" stop-color="${C.teal}"/>
    </linearGradient>
    <filter id="blur4">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>

  <!-- Hintergrund - gerundetes Quadrat -->
  <rect width="512" height="512" rx="96" fill="url(#bgG)"/>

  <!-- Geologische Schichten — ausdrucksstarke Bögen -->
  <path d="M48 230 Q160 195 256 230 Q352 265 464 230" fill="none"
        stroke="${C.surface}" stroke-width="12" opacity="0.55" stroke-linecap="round"/>
  <path d="M48 280 Q160 245 256 280 Q352 315 464 280" fill="none"
        stroke="${C.surface}" stroke-width="10" opacity="0.4" stroke-linecap="round"/>
  <path d="M48 330 Q160 295 256 330 Q352 365 464 330" fill="none"
        stroke="${C.layer2}" stroke-width="8" opacity="0.3" stroke-linecap="round"/>

  <!-- Hintergrundglow für Wärmequelle (weich, blur) -->
  <circle cx="256" cy="390" r="100" fill="${C.teal}" opacity="0.12" filter="url(#blur4)"/>

  <!-- Bohr-Chevron — großes, klares Symbol -->
  <path d="M128 90 L256 260 L384 90"
        fill="none" stroke="url(#chevG)"
        stroke-width="42" stroke-linejoin="round" stroke-linecap="round"/>

  <!-- Bohrschaft -->
  <line x1="256" y1="260" x2="256" y2="330"
        stroke="${C.teal}" stroke-width="28" stroke-linecap="round" opacity="0.85"/>

  <!-- Wärmequelle — dreifaches Glow -->
  <circle cx="256" cy="395" r="80" fill="url(#heatG)" opacity="0.45"/>
  <circle cx="256" cy="395" r="46" fill="${C.tealMid}" opacity="0.75"/>
  <circle cx="256" cy="395" r="24" fill="${C.tealGlow}"/>

  <!-- Wordmark "G T" — dezent, unterhalb des Symbols -->
  <!-- Kein Text im Icon da bei kleinen Größen unleserlich -->
</svg>`
}

// ── Hilfsfunktion: ICO-Datei aus PNG-Buffern erstellen ────────────────────────
function packIco(images) {
  const headerSize  = 6
  const entrySize   = 16
  const count       = images.length
  const dirSize     = headerSize + entrySize * count

  let offset = dirSize
  const offsets = images.map(img => {
    const o = offset
    offset += img.data.length
    return o
  })

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // Reserved
  header.writeUInt16LE(1, 2)     // Type: 1 = icon
  header.writeUInt16LE(count, 4) // Count

  const entries = images.map((img, i) => {
    const e = Buffer.alloc(entrySize)
    e.writeUInt8(img.width  === 256 ? 0 : img.width,  0)
    e.writeUInt8(img.height === 256 ? 0 : img.height, 1)
    e.writeUInt8(0, 2)  // Color count
    e.writeUInt8(0, 3)  // Reserved
    e.writeUInt16LE(1,  4)  // Planes
    e.writeUInt16LE(32, 6)  // Bit depth
    e.writeUInt32LE(img.data.length, 8)
    e.writeUInt32LE(offsets[i],      12)
    return e
  })

  return Buffer.concat([header, ...entries, ...images.map(img => img.data)])
}

// ── Generierung ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🎨 Generiere Favicon-Set für Geotherm…\n')

  // 1. favicon.svg — browsernatives SVG-Favicon (src/app/icon.svg)
  const faviconSvg = makeFaviconSvg(32)
  fs.writeFileSync(path.join(appDir, 'icon.svg'), faviconSvg, 'utf8')
  console.log('✅  src/app/icon.svg')

  // 2. public/icons/icon.svg — für PWA-Manifest
  const appIconSvg = makeAppIconSvg(512)
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), appIconSvg, 'utf8')
  console.log('✅  public/icons/icon.svg')

  // 3. icon-192.png (PWA homescreen icon, maskable)
  const png192 = await sharp(Buffer.from(makeAppIconSvg(192)))
    .resize(192, 192)
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192)
  console.log('✅  public/icons/icon-192.png  (%d KB)', Math.round(png192.length / 1024))

  // 4. icon-512.png (PWA splash icon)
  const png512 = await sharp(Buffer.from(makeAppIconSvg(512)))
    .resize(512, 512)
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512)
  console.log('✅  public/icons/icon-512.png  (%d KB)', Math.round(png512.length / 1024))

  // 5. favicon.ico (16×16 + 32×32 embedded PNGs)
  const png16 = await sharp(Buffer.from(makeFaviconSvg(16)))
    .resize(16, 16)
    .png()
    .toBuffer()

  const png32 = await sharp(Buffer.from(makeFaviconSvg(32)))
    .resize(32, 32)
    .png()
    .toBuffer()

  const ico = packIco([
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
  ])
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), ico)
  console.log('✅  src/app/favicon.ico        (%d KB)', Math.round(ico.length / 1024))

  // 6. apple-touch-icon.png (180×180)
  const png180 = await sharp(Buffer.from(makeAppIconSvg(180)))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer()
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180)
  console.log('✅  src/app/apple-icon.png     (%d KB)', Math.round(png180.length / 1024))

  console.log('\n🚀 Favicon-Set komplett. Commit & push!')
}

main().catch(err => { console.error('❌', err); process.exit(1) })
