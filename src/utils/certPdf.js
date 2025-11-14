// src/utils/certPdf.js
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
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
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
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
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    }
    return String(value)
  } catch {
    return String(value)
  }
}

/** Convert SVG to PNG (contain-fit) */
async function svgToPngDataUrl(svgUrl, maxW = 260, maxH = 70) {
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

  // canvas ad alta risoluzione (2x) per evitare sgranature
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(drawW * scale))
  canvas.height = Math.max(1, Math.round(drawH * scale))
  const ctx = canvas.getContext('2d')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, drawW, drawH)
  ctx.drawImage(img, 0, 0, drawW, drawH)

  URL.revokeObjectURL(url)
  return { dataUrl: canvas.toDataURL('image/png'), w: drawW, h: drawH }
}

async function rasterToPngDataUrl(imgUrl, maxW = 90, maxH = 90) {
  if (!imgUrl) return null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = imgUrl

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

  return {
    dataUrl: canvas.toDataURL('image/png'),
    w: canvas.width,
    h: canvas.height,
  }
}

// Badge CEFR: in alto a destra, con dimensioni e posizione bilanciate
function getBadgeFrame(doc, margin) {
  const pageW = doc.internal.pageSize.getWidth()
  const w = 120
  const h = 120
  const x = pageW - margin - w
  const y = 150 // leggermente più alto, stile "hero"
  return { x, y, w, h }
}

function drawSectionTitle(doc, text, x, y, rightLimitX) {
  doc.setTextColor(BRAND.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12) // più discreto
  doc.text(text, x, y)
  doc.setDrawColor(BRAND.line)
  doc.setLineWidth(0.5)
  const maxLineX = Math.max(x + 120, rightLimitX ?? x + 120)
  doc.line(x, y + 5, maxLineX, y + 5)
  doc.setTextColor(BRAND.text)
}

function drawLabelValue(doc, label, value, x, y, opts = {}) {
  const { wLabel = 120, lineGap = 16 } = opts
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.mute)
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
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
function textInBox(
  doc,
  text,
  x,
  y,
  maxWidth,
  {
    font = 'helvetica',
    style = 'normal',
    size = 9,
    color = BRAND.text,
    lineHeight = 11,
  } = {},
) {
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
  doc.setFillColor('#F7F9FB')
  doc.setDrawColor(BRAND.line)
  doc.roundedRect(x, y, w, h, 12, 12, 'FD')

  doc.setTextColor(BRAND.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(40) // un filo più piccolo, più elegante
  const tw = doc.getTextWidth(levelText)
  doc.text(levelText, x + w / 2 - tw / 2, y + 64)

  doc.setFontSize(9)
  doc.setTextColor(BRAND.mute)
  const sub = 'CEFR LEVEL'
  const tw2 = doc.getTextWidth(sub)
  doc.text(sub, x + w / 2 - tw2 / 2, y + 88)
}

export async function generateCertificatePDF({ user = {}, result = {} }) {
  if (typeof window === 'undefined') {
    throw new Error('generateCertificatePDF must be called in the browser')
  }

  // --- Foto studente: proviamo tutte le varianti possibili ---
  const studentAttachment = Array.isArray(user?.student_photo)
    ? user.student_photo[0]
    : null

  const studentPhotoUrl =
    user?.photoUrl ||
    user?.studentPhotoUrl ||
    user?.profilePhotoUrl ||
    user?.avatarUrl ||
    (typeof user?.studentPhoto === 'string' ? user.studentPhoto : null) ||
    (Array.isArray(user?.studentPhoto) ? user.studentPhoto[0]?.url : null) ||
    user?.student_photo_url ||
    (studentAttachment?.thumbnails?.large?.url || studentAttachment?.url) ||
    (Array.isArray(user?.photo)
      ? user.photo[0]?.thumbnails?.large?.url || user.photo[0]?.url
      : null) ||
    null

  // --- normalizziamo subito ID e campi che ci servono ---
  // Qui vogliamo SOLO i codici "belli" (QAT-..., CND-...), mai gli ID record Airtable
  const testId =
    result?.testId ||
    result?.TestId ||
    result?.testCode ||
    result?.TestCode ||
    '-'

  const candidateId =
    result?.candidateId ||
    result?.CandidateId ||
    user?.candidateId ||
    user?.CandidateId ||
    '-'

  const completedAt = result?.completedAt || result?.CompletedAt || null

  const levelText = String(
    result?.level || result?.estimatedLevel || result?.EstimatedLevel || '-',
  ).toUpperCase()

  const doc = new jsPDF({ unit: 'pt', format: 'A4' })
  const margin = 56
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Background frame
  drawRoundedRect(
    doc,
    margin - 18,
    margin - 18,
    pageW - (margin - 18) * 2,
    pageH - (margin - 18) * 2,
    14,
    '#FFFFFF',
  )

  // --- Header: foto studente (sinistra) + logo Evalua (destra) + titoli ---
  const headerTop = margin
  const headerInnerTop = headerTop + 10

  // Foto studente + placeholder
  const photoBoxSize = 90
  const photoX = margin
  const photoY = headerInnerTop

  if (studentPhotoUrl) {
    try {
      const photo = await rasterToPngDataUrl(
        studentPhotoUrl,
        photoBoxSize,
        photoBoxSize,
      )
      if (photo?.dataUrl) {
        const offsetX = photoX + (photoBoxSize - photo.w) / 2
        const offsetY = photoY + (photoBoxSize - photo.h) / 2
        doc.addImage(photo.dataUrl, 'PNG', offsetX, offsetY, photo.w, photo.h)
      }
    } catch (err) {
      console.error('Unable to load student photo for certificate', err)
      doc.setFillColor('#F7F9FB')
      doc.setDrawColor(BRAND.line)
      doc.roundedRect(
        photoX - 4,
        photoY - 4,
        photoBoxSize + 8,
        photoBoxSize + 8,
        50,
        50,
        'FD',
      )
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(BRAND.mute)
    }
  } else {
    doc.setFillColor('#F7F9FB')
    doc.setDrawColor(BRAND.line)
    doc.roundedRect(
      photoX - 4,
      photoY - 4,
      photoBoxSize + 8,
      photoBoxSize + 8,
      50,
      50,
      'FD',
    )
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(BRAND.mute)
  }

  // Logo Evalua in alto a destra
  try {
    const { dataUrl, w, h } = await svgToPngDataUrl(evaluaLogoUrl, 210, 60)
    const logoX = pageW - margin - w
    const logoY = headerInnerTop + 4
    doc.addImage(dataUrl, 'PNG', logoX, logoY, w, h)
  } catch (error) {
    console.error('Unable to load Evalua logo for certificate', error)
  }

  // Titoli (un filo più grandi ma non urlanti)
  const titleY = headerInnerTop + photoBoxSize + 26

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(BRAND.text)
  doc.text('QUAET – Adaptive English Test', margin, titleY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(BRAND.mute)
  doc.text('Official Result Certificate', margin, titleY + 16)

  // CEFR badge
  drawCefrBadge(doc, levelText, margin)

  // Limite destro riga sezione = bordo sinistro badge - 12px
  const badge = getBadgeFrame(doc, margin)
  const rightLimitX = badge.x - 12

  // Candidate
  let y = 230
  drawSectionTitle(doc, 'Candidate', margin, y, rightLimitX)
  y += 22

  const candidateName =
    user?.fullName ||
    [user?.givenName, user?.familyName].filter(Boolean).join(' ') ||
    user?.name ||
    user?.email ||
    'Candidate'

  y = drawLabelValue(doc, 'Full name', candidateName, margin, y)
  y = drawLabelValue(doc, 'Email', user?.email || '-', margin, y)
  y = drawLabelValue(doc, 'Nationality', user?.nationality || '-', margin, y)
  y = drawLabelValue(
    doc,
    'Date of birth',
    formatDateOnly(user?.dateOfBirth),
    margin,
    y,
  )

  const placeBirthParts = [
    normalizeText(
      user?.placeOfBirth ||
        user?.place_birth ||
        user?.placeBirth ||
        user?.birthPlace,
    ),
    normalizeText(
      user?.countryOfBirth || user?.country_birth || user?.birthCountry,
    ),
  ].filter(Boolean)

  const placeBirthValue =
    placeBirthParts.length > 0 ? placeBirthParts.join(', ') : '-'
  y = drawLabelValue(doc, 'Place of birth', placeBirthValue, margin, y)

  const idDocType = normalizeText(
    user?.identificationDocument ||
      user?.identification_document ||
      user?.identityDocument,
  )
  const idDocNumber = normalizeText(
    user?.documentNumber ||
      user?.document_number ||
      user?.identificationNumber ||
      user?.idNumber,
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
  y += 10
  drawSectionTitle(doc, 'Assessment Outcome', margin, y, rightLimitX)
  y += 22
  y = drawLabelValue(
    doc,
    'Level (CEFR)',
    levelText,
    margin,
    y,
  )
  y = drawLabelValue(
    doc,
    'Confidence',
    typeof result?.confidence === 'number'
      ? `${result.confidence}%`
      : result?.confidence || result?.Confidence || '-',
    margin,
    y,
  )
  y = drawLabelValue(
    doc,
    'Items administered',
    result?.items ?? result?.TotalItems ?? '-',
    margin,
    y,
  )
  if (result?.duration || result?.DurationSec) {
    const dLabel =
      result?.duration || (result?.DurationSec ? `${result.DurationSec}s` : '-')
    y = drawLabelValue(doc, 'Duration', dLabel, margin, y)
  }
  y = drawLabelValue(doc, 'Completed', formatDate(completedAt), margin, y)

  // Right side summary card — dynamic height + wrapping
  const hasTestId = !!(testId && testId !== '-')
  const hasCandId = !!(candidateId && candidateId !== '-')
  const rightX = badge.x
  const innerPad = 14
  const innerW = badge.w - innerPad * 2

  // ✅ card Test ID sempre sotto il badge
  let cardY = badge.y + badge.h + 24
  let rightCardBottom = cardY

  if (hasTestId || hasCandId) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const testLines = hasTestId
      ? doc.splitTextToSize(String(testId), innerW)
      : []
    const candLines = hasCandId
      ? doc.splitTextToSize(String(candidateId), innerW)
      : []
    const lineHeight = 11

    const blockHeights =
      (hasTestId ? 22 + testLines.length * lineHeight + 4 : 0) +
      (hasCandId ? 22 + candLines.length * lineHeight + 4 : 0)

    const cardHeight = Math.max(90, blockHeights + innerPad * 2)
    rightCardBottom = cardY + cardHeight

    doc.setFillColor('#FFFFFF')
    doc.setDrawColor('#DADDE2')
    doc.roundedRect(rightX, cardY, badge.w, cardHeight, 10, 10, 'FD')

    let cy = cardY + innerPad + 8
    if (hasTestId) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor('#555555')
      doc.text('Test ID', rightX + innerPad, cy)
      cy += 16
      const r1 = textInBox(doc, String(testId), rightX + innerPad, cy, innerW, {
        size: 9,
        color: BRAND.text,
        lineHeight,
      })
      cy = r1.nextY + 4
    }
    if (hasCandId) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor('#555555')
      doc.text('Candidate ID', rightX + innerPad, cy)
      cy += 16
      const r2 = textInBox(
        doc,
        String(candidateId),
        rightX + innerPad,
        cy,
        innerW,
        {
          size: 9,
          color: BRAND.text,
          lineHeight,
        },
      )
      cy = r2.nextY + 4
    }
  }

  // Notes box: sempre sotto a sezione outcome e card destra
  const noteTop = Math.max(y + 14, rightCardBottom + 20)
  const noteHeight = 72
  drawRoundedRect(
    doc,
    margin,
    noteTop,
    pageW - margin * 2,
    noteHeight,
    8,
    '#F7F9FB',
  )
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(BRAND.mute)
  doc.text(
    'This certificate officially records the result of the QUAET adaptive English assessment and certifies the candidate’s CEFR level of English proficiency. The QUAET assessment is developed in accordance with CEFR guidelines and psychometric quality standards.',
    margin + 12,
    noteTop + 22,
    { maxWidth: pageW - margin * 2 - 24 },
  )

  // Signature / validation area
  const sigY = pageH - 160
  doc.setDrawColor(BRAND.line)
  doc.setLineWidth(0.7)
  doc.line(margin, sigY, margin + 220, sigY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(BRAND.text)
  doc.text('Authorized Signatory', margin, sigY + 14)

  // --- Online verification card (code + URL + QR) ---
  const verificationCode = (
    result?.verificationCode ||
    `Q-${String(testId).replaceAll(' ', '')}-${levelText}`
  ).toUpperCase()

  const verifyUrl = `https://evaluaeducation.org/verify?code=${verificationCode}`

  let qrDataUrl = null
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 0,
      scale: 4,
    })
  } catch (error) {
    console.error('QR generation failed', error)
  }

    // Card in basso a destra
  const vCardW = 280
  const vCardH = 148 // un filo più alta per dare aria al QR
  const vCardX = pageW - margin - vCardW
  const vCardY = sigY - 30

  doc.setFillColor('#F7F9FB')
  doc.setDrawColor(BRAND.line)
  doc.roundedRect(vCardX, vCardY, vCardW, vCardH, 10, 10, 'FD')

  const vCardPad = 14

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(BRAND.primary)
  doc.text('Online verification', vCardX + vCardPad, vCardY + 18)

  // ora il testo usa tutta la larghezza della card
  const textMaxW = vCardW - vCardPad * 2
  let tvY = vCardY + 34

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(BRAND.text)

  // codice tutto su una riga (senza riservare spazio al QR)
  const rCode = textInBox(
    doc,
    `Code: ${verificationCode}`,
    vCardX + vCardPad,
    tvY,
    textMaxW,
    { size: 9, color: BRAND.text, lineHeight: 11 },
  )
  tvY = rCode.nextY + 4

  doc.setTextColor(BRAND.mute)
  const rVerify = textInBox(
    doc,
    'Verify at: www.evaluaeducation.org/verify',
    vCardX + vCardPad,
    tvY,
    textMaxW,
    { size: 9, color: BRAND.mute, lineHeight: 11 },
  )
  tvY = rVerify.nextY

  if (qrDataUrl) {
    const qrSize = 80
    const qrX = vCardX + vCardW - vCardPad - qrSize
    // mettiamo il QR sotto il testo, con un piccolo margine
    const minQrY = tvY + 10
    const maxQrY = vCardY + vCardH - vCardPad - qrSize
    const qrY = Math.min(maxQrY, minQrY)

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    // Testo sotto il QR
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(BRAND.mute)

    const caption = "Scan the QR code to verify"
    const captionX = qrX + qrSize / 2  // centro del QR
    const captionY = qrY + qrSize + 10 // un po' sotto

    doc.text(caption, captionX, captionY, { align: 'center' })
  
  }

  // Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(BRAND.mute)
  doc.text('Issuer: Evalua', margin, pageH - 52)

  // Safe filename
  const safeName = String(candidateName)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
  const safeDate = String(completedAt || new Date())
    .replaceAll(' ', '_')
    .replaceAll(':', '-')
    .replaceAll('/', '-')
  const fileName = `QUAET-Certificate_${levelText}_${safeName}_${safeDate}.pdf`

  doc.save(fileName)
}
