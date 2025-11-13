import { tbl } from "../src/airtable.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof req.json === "function" ? await req.json() : req.body;
    let code = (body?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Missing code" });

    const safe = code.replace(/'/g, "''");
    const records = await tbl(process.env.AIRTABLE_TABLE_CERTIFICATES).select({
      filterByFormula: `{VerificationCode} = '${safe}'`,
      maxRecords: 1,
    }).firstPage();

    if (!records.length) return res.json({ valid: false });

    const f = records[0].fields;
    return res.json({
      valid: true,
      code: f.VerificationCode,
      name: f.CandidateName || null,
      test: f.TestName || null,
      level: f.Level || null,
      issuedAt: f.IssuedAt || null,
      status: f.Status || "Active",
      pdfUrl: f.PdfUrl || null,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: err.message || "Verify failed",
      statusCode: err.statusCode || 500,
    });
  }
}
