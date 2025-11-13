import { tbl } from "../airtable.js";

export function generateVerificationCode() {
  // UUID v4 corto + checksum base36 a 2 char
  const u = crypto.randomUUID(); // Node 18+ / browser
  const core = u.toUpperCase();
  const sum = [...core.replace(/-/g,'')].reduce((a,c)=>a + c.charCodeAt(0), 0) % 1296;
  const chk = sum.toString(36).toUpperCase().padStart(2,'0');
  return `Q-${core}-${chk}`;
}

export async function upsertCertificate({ code, studentId, name, testName, level, issuedAt, pdfUrl, status='Active' }) {
  const safe = code.replace(/'/g, "''");
  const table = tbl(process.env.AIRTABLE_TABLE_CERTIFICATES);
  const existing = await table.select({
    filterByFormula: `{VerificationCode} = '${safe}'`,
    maxRecords: 1,
  }).firstPage();

  const fields = {
    VerificationCode: code,
    CandidateName: name,
    TestName: testName,
    Level: level,
    IssuedAt: issuedAt,
    Status: status,
    PdfUrl: pdfUrl || null,
    ...(studentId ? { Student: [studentId] } : {}),
  };

  if (existing.length) {
    await table.update(existing[0].id, fields);
  } else {
    await table.create(fields);
  }
}
