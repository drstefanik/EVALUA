import { jsPDF } from 'jspdf'
import evaluaLogoUrl from '../assets/EVALUA.svg?url'

async function svgToPngDataUrl(svgUrl, width = 220, height = 60) {
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

  const aspect = img.width && img.height ? img.width / img.height : width / height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = Math.round(width / aspect)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)
  return canvas.toDataURL('image/png')
}

export async function generateCertificatePDF({ user, result }) {
  const doc = new jsPDF({ unit: 'pt', format: 'A4' })
  const margin = 56

  try {
    const logoDataUrl = await svgToPngDataUrl(evaluaLogoUrl, 180, 48)
    doc.addImage(logoDataUrl, 'PNG', margin, 56, 180, 48)
  } catch (error) {
    console.error('Unable to load Evalua logo for certificate', error)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('QUAET – Adaptive English Test', margin, 130)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text('Official Result Certificate', margin, 155)

  doc.setDrawColor(40)
  doc.line(margin, 170, 539, 170)

  let y = 210
  const candidateName = user?.fullName || user?.name || user?.email || 'Candidate'
  doc.setFontSize(12)
  doc.text(`Candidate: ${candidateName}`, margin, y)
  y += 22
  doc.text(`Email: ${user?.email || '-'}`, margin, y)
  y += 22
  doc.text(`Completed: ${result?.completedAt || '-'}`, margin, y)
  y += 28

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Assessment Outcome', margin, y)
  y += 18
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(`Estimated level (CEFR): ${result?.level || '-'}`, margin, y)
  y += 18
  doc.text(`Confidence: ${result?.confidence ?? '-'}${typeof result?.confidence === 'number' ? '%' : ''}`, margin, y)
  y += 18
  doc.text(`Items administered: ${result?.items ?? '-'}`, margin, y)
  y += 18
  if (result?.duration) {
    doc.text(`Duration: ${result.duration}`, margin, y)
    y += 18
  }

  doc.setFontSize(10)
  doc.text('This certificate reports the outcome of an adaptive placement procedure (QUAET).', margin, 760)
  doc.text('Issuer: Evalua / British Institutes • www.ba72.org', margin, 776)

  const safeDate = String(result?.completedAt || '')
    .replaceAll(' ', '_')
    .replaceAll(':', '-')
    .replaceAll('/', '-')

  doc.save(`QUAET-Certificate_${result?.level || 'Result'}_${safeDate || 'date'}.pdf`)
}
