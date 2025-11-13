// src/utils/certPdf.js
import { jsPDF } from 'jspdf'
import evaluaLogoUrl from '../assets/EVALUA.svg?url'

// ---- Brand & layout helpers ----
const BRAND = {
  primary: '#0C3C4A',
  text: '#111111',
  mute: '#555555',
  line: '#DADDE2',
}

function formatDate(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      return d
        .toLocaleString('en-GB', {
          timeZone: 'Europe/Rome',
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
        .replace(',', '')
    }
    return String(value)
  } catch {
    return String(value)
  }
}

function formatDateOnly(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        timeZone: 'Europe/Rome',
        day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    return String(value)
  } catch {
    return String(value)
  }
}

/** Convert SVG to PNG (contain-fit) */
async function svgToPngDataUrl(svgUrl, maxW = 220, maxH = 60) {
  const response = await fetch(svgUrl)
  const svgText = await response.text()
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  img.src = url
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const aspect = (img.width || maxW) / (img.height || maxH)
  let drawW = maxW
  let drawH = drawW / aspect
  if (drawH > maxH) {
    drawH = maxH
    drawW = drawH * aspect
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(drawW))
  canvas.height = Math.max(1, Math.round(drawH))
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)
  return { dataUrl: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height }
}

function getBadgeFrame(doc, margin) {
  const pageW = doc.internal.pageSize.getWidth()
  const w = 120, h = 120
  const x = pageW - margin - w
  const y = 130
  return { x, y, w, h }
}

function drawSectionTitle(doc, text, x, y, rightLimitX) {
  doc.setTextColor(BRAND.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(text, x, y)
  doc.setDrawColor(BRAND.line)
  doc.setLineWidth(0.6)
  const maxLineX = Math.max(x + 120, rightLimitX ?? x + 120)
  doc.line(x, y + 6, maxLineX, y + 6)
  doc.setTextColor(BRAND.text)
}

function drawLabelValue(doc, label, value, x, y, opts = {}) {
  const { wLabel = 120, lineGap = 18 } = opts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(BRAND.mute)
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(BRAND.text)
  doc.text(String(value ?? '-'), x + wLabel, y)
  return y + lineGap
}

function drawRoundedRect(doc, x, y, w, h, r = 8, colorHex = '#FFFFFF') {
  doc.setFillColor(colorHex)
  doc.setDrawColor(BRAND.line)
  doc.roundedRect(x, y, w, h, r, r, 'FD')
}

function normalizeText(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return str.trim()
}

/** Write text with automatic wrapping inside a max width */
function textInBox(doc, text, x, y, maxWidth, {
  font = 'helvetica',
  style = 'normal',
  size = 10,
  color = BRAND.text,
  lineHeight = 12,
} = {}) {
  doc.setFont(font, style)
  doc.setFontSize(size)
  doc.setTextColor(color)
  const lines = doc.splitTextToSize(String(text ?? '-'), Math.max(10, maxWidth))
  lines.forEach((ln, i) => doc.text(ln, x, y + i * lineHeight))
  return { nextY: y + lines.length * lineHeight, lines }
}

/** Big CEFR badge (e.g., "B1") on the right side. */
function drawCefrBadge(doc, levelText = '-', margin) {
  const { x, y, w, h } = getBadgeFrame(doc, margin)
  doc.setFillColor('#F7F9FB'); doc.setDrawColor(BRAND.line)
  doc.roundedRect(x, y, w, h, 12, 12, 'FD')
  doc.setTextColor(BRAND.primary); doc.setFont('helvetica', 'bold')
  doc.setFontSize(46)
  const tw = doc.getTextWidth(levelText)
  doc.text(levelText, x + w / 2 - tw / 2, y + 70)
  doc.setFontSize(10); doc.setTextColor(BRAND.mute)
  const sub = 'CEFR LEVEL'; const tw2 = doc.getTextWidth(sub)
  doc.text(sub, x + w / 2 - tw2 / 2, y + 95)
}

export async function generateCertificatePDF({ user = {}, result = {} }) {
  if (typeof window === 'undefined') {
    throw new Error('generateCertificatePDF must be called in the browser')
  }

  // --- normalizziamo subito ID e campi che ci servono ---
  // da Airtable arrivano probabilmente come TestId / CandidateId
  const testId =
    result?.testId ||
    result?.TestId ||
    result?.id ||
    '-'

  const candidateId =
    result?.candidateId ||
    result?.CandidateId ||
    user?.candidateId ||
    user?.CandidateId ||
    user?.id ||
    user?.recordId ||
    '-'

  const completedAt =
    result?.completedAt ||
    result?.CompletedAt ||
    null

  const levelText = String(result?.level || result?.estimatedLevel || result?.EstimatedLevel || '-').toUpperCase()

  const doc = new jsPDF({ unit: 'pt', format: 'A4' })
  const margin = 56
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Background frame
  drawRoundedRect(doc, margin - 18, margin - 18, pageW - (margin - 18) * 2, pageH - (margin - 18) * 2, 14, '#FFFFFF')

  // Header: logo + titles
  try {
    const { dataUrl, w, h } = await svgToPngDataUrl(evaluaLogoUrl, 220, 60)
    doc.addImage(dataUrl, 'PNG', margin, 56, w, h)
  } catch (error) {
    console.error('Unable to load Evalua logo for certificate', error)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(BRAND.text)
  doc.text('QUAET – Adaptive English Test', margin, 135)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(BRAND.mute)
  doc.text('Official Result Certificate', margin, 156)

  // CEFR badge
  drawCefrBadge(doc, levelText, margin)

  // Limite destro riga sezione = bordo sinistro badge - 12px
  const badge = getBadgeFrame(doc, margin)
  const rightLimitX = badge.x - 12

  // Candidate
  let y = 195
  drawSectionTitle(doc, 'Candidate', margin, y, rightLimitX)
  y += 24

  const candidateName =
    user?.fullName ||
    [user?.givenName, user?.familyName].filter(Boolean).join(' ') ||
    user?.name ||
    user?.email ||
    'Candidate'

  y = drawLabelValue(doc, 'Full name', candidateName, margin, y)
  y = drawLabelValue(doc, 'Email', user?.email || '-', margin, y)
  y = drawLabelValue(doc, 'Nationality', user?.nationality || '-', margin, y)
  y = drawLabelValue(doc, 'Date of birth', formatDateOnly(user?.dateOfBirth), margin, y)

  const placeBirthParts = [
    normalizeText(
      user?.placeOfBirth ||
        user?.place_birth ||
        user?.placeBirth ||
        user?.birthPlace
    ),
    normalizeText(
      user?.countryOfBirth ||
        user?.country_birth ||
        user?.birthCountry
    ),
  ].filter(Boolean)

  const placeBirthValue = placeBirthParts.length > 0 ? placeBirthParts.join(', ') : '-'
  y = drawLabelValue(doc, 'Place of birth', placeBirthValue, margin, y)

  const idDocType = normalizeText(
    user?.identificationDocument ||
      user?.identification_document ||
      user?.identityDocument
  )
  const idDocNumber = normalizeText(
    user?.documentNumber ||
      user?.document_number ||
      user?.identificationNumber ||
      user?.idNumber
  )

  let idDocValue = 'Not provided'
  if (idDocType && idDocNumber) {
    idDocValue = `${idDocType} – ${idDocNumber}`
  } else if (idDocType) {
    idDocValue = idDocType
  } else if (idDocNumber) {
    idDocValue = idDocNumber
  }

  y = drawLabelValue(doc, 'ID document', idDocValue, margin, y)

  // Result section
  y += 12
  drawSectionTitle(doc, 'Assessment Outcome', margin, y, rightLimitX)
  y += 24
  y = drawLabelValue(doc, 'Estimated level (CEFR)', levelText, margin, y)
  y = drawLabelValue(
    doc,
    'Confidence',
    typeof result?.confidence === 'number'
      ? `${result.confidence}%`
      : (result?.confidence || result?.Confidence || '-'),
    margin, y
  )
  y = drawLabelValue(doc, 'Items administered', result?.items ?? result?.TotalItems ?? '-', margin, y)
  if (result?.duration || result?.DurationSec) {
    const dLabel = result?.duration || (result?.DurationSec ? `${result.DurationSec}s` : '-')
    y = drawLabelValue(doc, 'Duration', dLabel, margin, y)
  }
  y = drawLabelValue(doc, 'Completed', formatDate(completedAt), margin, y)

  // Right side summary card — dynamic height + wrapping
  const hasTestId = !!(testId && testId !== '-')
  const hasCandId = !!(candidateId && candidateId !== '-')
  const rightX = badge.x
  const innerPad = 14
  const innerW = badge.w - innerPad * 2
  let cardY = 280

  if (hasTestId || hasCandId) {
    // Pre-calc line counts to size the card
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    const testLines = hasTestId
      ? doc.splitTextToSize(String(testId), innerW)
      : []
    const candLines = hasCandId
      ? doc.splitTextToSize(String(candidateId), innerW)
      : []
    const lineHeight = 12

    const blockHeights =
      (hasTestId ? (24 /*label gap*/ + testLines.length * lineHeight + 6) : 0) +
      (hasCandId ? (24 /*label gap*/ + candLines.length * lineHeight + 6) : 0)

    const cardHeight = Math.max(96, blockHeights + innerPad * 2)

    // Draw card
    doc.setFillColor('#FFFFFF'); doc.setDrawColor('#DADDE2')
    doc.roundedRect(rightX, cardY, badge.w, cardHeight, 10, 10, 'FD')

    // Content
    let cy = cardY + innerPad + 10
    if (hasTestId) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#555555')
      doc.text('Test ID', rightX + innerPad, cy)
      cy += 18
      const r1 = textInBox(doc, String(testId), rightX + innerPad, cy, innerW, {
        size: 10, color: BRAND.text, lineHeight,
      })
      cy = r1.nextY + 6
    }
    if (hasCandId) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#555555')
      doc.text('Candidate ID', rightX + innerPad, cy)
      cy += 18
      const r2 = textInBox(doc, String(candidateId), rightX + innerPad, cy, innerW, {
        size: 10, color: BRAND.text, lineHeight,
      })
      cy = r2.nextY + 6
    }
  }

  // Notes box
  const noteY = cardY + 160
  drawRoundedRect(doc, margin, noteY, pageW - margin * 2, 84, 8, '#F7F9FB')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.mute)
  doc.text(
    'This certificate reports the outcome of an adaptive placement procedure (QUAET). Results indicate the estimated CEFR level for placement purposes.',
    margin + 12, noteY + 24, { maxWidth: pageW - margin * 2 - 24 }
  )

  // Signature / validation area
  const sigY = pageH - 160
  doc.setDrawColor(BRAND.line)
  doc.setLineWidth(0.8)
  doc.line(margin, sigY, margin + 220, sigY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(BRAND.text)
  doc.text('Authorized Signatory', margin, sigY + 16)

  // Verification block (right) — wrapping
  const valW = 260
  const valX = pageW - margin - valW
  drawRoundedRect(doc, valX, sigY - 28, valW, 92, 8, '#FFFFFF')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.primary)
  doc.text('Verification', valX + 12, sigY - 10 + 18)

  const verificationCode =
    (result?.verificationCode ||
      `Q-${String(testId).replaceAll(' ', '')}-${levelText}`).toUpperCase()
  const verifyPath = `evaluaeducation.org/verify?code=${verificationCode}`

  // Code (wrapped)
  textInBox(doc, `Code: ${verificationCode}`, valX + 12, sigY - 10 + 34, valW - 24, {
    size: 9, color: BRAND.text, lineHeight: 11,
  })

  // Verify URL
  textInBox(doc, `Verify at: ${result?.verificationUrl || verifyPath}`, valX + 12, sigY - 10 + 54, valW - 24, {
    size: 9, color: BRAND.mute, lineHeight: 11,
  })

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(BRAND.mute)
  doc.text('Issuer: Evalua', margin, pageH - 56)

  // Safe filename
  const safeName = String(candidateName).trim().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '')
  const safeDate = String(completedAt || new Date())
    .replaceAll(' ', '_')
    .replaceAll(':', '-')
    .replaceAll('/', '-')
  const fileName = `QUAET-Certificate_${levelText}_${safeName}_${safeDate}.pdf`

  doc.save(fileName)
}
