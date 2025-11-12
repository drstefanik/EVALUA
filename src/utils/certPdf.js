// src/utils/certPdf.js
import { jsPDF } from 'jspdf'
import evaluaLogoUrl from '../assets/EVALUA.svg?url'

// ---- Brand & layout helpers ----
const BRAND = {
  primary: '#0C3C4A', // Evalua/Next Group dark teal
  text: '#111111',
  mute: '#555555',
  line: '#DADDE2',
}

function formatDate(value) {
  if (!value) return '-'
  try {
    // accetta ISO o stringa "12 nov 2025, 16:36"
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      // es: 12 Nov 2025, 16:36 (Europe/Rome)
      return d.toLocaleString('en-GB', {
        timeZone: 'Europe/Rome',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).replace(',', '')
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

/**
 * Convert an SVG to PNG dataURL preserving aspect ratio.
 * Fits INSIDE a bounding box (maxW x maxH) without distortion.
 */
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
  // calcola fit "contain"
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
  const BRAND = { primary: '#0C3C4A', line: '#DADDE2', text: '#111111' }
  doc.setTextColor(BRAND.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(text, x, y)
  doc.setDrawColor(BRAND.line)
  doc.setLineWidth(0.6)
  const maxLineX = Math.max(x + 120, rightLimitX) // non meno di 120px
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
  doc.roundedRect(x, y, w, h, r, r, 'FD') // fill + stroke
}

/**
 * Make a big CEFR badge (e.g., "B1") on the right side.
 */
function drawCefrBadge(doc, levelText = '-', margin) {
  const BRAND = { primary: '#0C3C4A', mute: '#555555', line: '#DADDE2' }
  const { x, y, w, h } = getBadgeFrame(doc, margin)
  // box badge
  doc.setFillColor('#F7F9FB'); doc.setDrawColor(BRAND.line)
  doc.roundedRect(x, y, w, h, 12, 12, 'FD')
  // testo
  doc.setTextColor(BRAND.primary); doc.setFont('helvetica', 'bold')
  doc.setFontSize(46)
  const tw = doc.getTextWidth(levelText)
  doc.text(levelText, x + w/2 - tw/2, y + 70)
  doc.setFontSize(10); doc.setTextColor(BRAND.mute)
  const sub = 'CEFR LEVEL'; const tw2 = doc.getTextWidth(sub)
  doc.text(sub, x + w/2 - tw2/2, y + 95)
}

export async function generateCertificatePDF({ user = {}, result = {} }) {
  const doc = new jsPDF({ unit: 'pt', format: 'A4' })
  const margin = 56
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Background frame
  drawRoundedRect(doc, margin - 18, margin - 18, pageW - (margin - 18) * 2, pageH - (margin - 18) * 2, 14, '#FFFFFF')

  // Header: logo + titles
  try {
    const { dataUrl, w, h } = await svgToPngDataUrl(evaluaLogoUrl, 220, 60)
    // centra verticalmente nel box header
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

  // Big CEFR badge at right
  const levelText = String(result?.level || result?.estimatedLevel || '-').toUpperCase()
  drawCefrBadge(doc, levelText, margin))
  // Limite destro riga sezione = bordo sinistro badge - 12px
  const badge = getBadgeFrame(doc, margin)
  const rightLimitX = badge.x - 12

  // Candidate
  let y = 195
  drawSectionTitle(doc, 'Candidate', margin, y, rightLimitX)
  y += 24
  
  // Candidate section
  let y = 195
  drawSectionTitle(doc, 'Candidate', margin, y)
  y += 24

  const candidateName = user?.fullName || user?.name || user?.givenName
    ? [user?.fullName || `${user?.givenName || ''} ${user?.familyName || ''}`.trim()].join(' ')
    : (user?.email || 'Candidate')

  y = drawLabelValue(doc, 'Full name', candidateName, margin, y)
  y = drawLabelValue(doc, 'Email', user?.email || '-', margin, y)
  y = drawLabelValue(doc, 'Nationality', user?.nationality || '-', margin, y)
  y = drawLabelValue(doc, 'Date of birth', formatDateOnly(user?.dateOfBirth), margin, y)

  // Result section
  y += 12
  drawSectionTitle(doc, 'Assessment Outcome', margin, y, rightLimitX)
  y += 24
  y = drawLabelValue(doc, 'Estimated level (CEFR)', levelText, margin, y)
  y = drawLabelValue(
    doc,
    'Confidence',
    (typeof result?.confidence === 'number')
      ? `${result.confidence}%`
      : (result?.confidence || '-'),
    margin, y
  )
  y = drawLabelValue(doc, 'Items administered', result?.items ?? '-', margin, y)
  if (result?.duration) {
    y = drawLabelValue(doc, 'Duration', result.duration, margin, y)
  }
  y = drawLabelValue(doc, 'Completed', formatDate(result?.completedAt), margin, y)

  // Right side summary card
  const hasTestId = !!(result?.testId || result?.id)
  const hasCandId = !!(user?.id || user?.recordId)
  if (hasTestId || hasCandId) {
    const rightX = badge.x
    const cardY = 280
    doc.setFillColor('#FFFFFF'); doc.setDrawColor('#DADDE2')
    doc.roundedRect(rightX, cardY, badge.w, 120, 10, 10, 'FD')

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#555555')
    doc.text('Test ID', rightX + 14, cardY + 24)
    doc.setFont('helvetica', 'normal'); doc.setTextColor('#111111')
    doc.text(String(result?.testId || result?.id || '-'), rightX + 14, cardY + 42)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor('#555555')
    doc.text('Candidate ID', rightX + 14, cardY + 70)
    doc.setFont('helvetica', 'normal'); doc.setTextColor('#111111')
    doc.text(String(user?.id || user?.recordId || '-'), rightX + 14, cardY + 88)
  }

  // Notes box
  const noteY = cardY + 150
  drawRoundedRect(doc, margin, noteY, pageW - margin * 2, 84, 8, '#F7F9FB')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.mute)
  doc.text(
    'This certificate reports the outcome of an adaptive placement procedure (QUAET). ' +
    'Results indicate the estimated CEFR level for placement purposes.',
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

  // Validation block (right)
  const valW = 260
  const valX = pageW - margin - valW
  drawRoundedRect(doc, valX, sigY - 28, valW, 72, 8, '#FFFFFF')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.primary)
  doc.text('Verification', valX + 12, sigY - 10 + 18)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(BRAND.text)
  const code = (result?.verificationCode || `${(user?.id || 'U')}-${(result?.testId || 'T')}-${levelText}`).toUpperCase()
  doc.text(`Code: ${code}`, valX + 12, sigY - 10 + 36)
  doc.setTextColor(BRAND.mute)
  doc.text('Verify at: evalua.education/verify', valX + 12, sigY - 10 + 54)

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(BRAND.mute)
  doc.text('Issuer: Evalua / British Institutes • www.ba72.org', margin, pageH - 56)

  // Optional diagonal watermark (subtle)
  doc.setTextColor(200, 205, 210)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(48)
  doc.text('E V A L U A', pageW / 2, pageH / 2, {
    angle: 30,
    align: 'center',
  })
  // Reset text color
  doc.setTextColor(BRAND.text)

  // Safe filename
  const safeName = String(candidateName).trim().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '')
  const safeDate = String(result?.completedAt || new Date()).replaceAll(' ', '_').replaceAll(':', '-').replaceAll('/', '-')
  const fileName = `QUAET-Certificate_${levelText}_${safeName}_${safeDate}.pdf`

  doc.save(fileName)
}
