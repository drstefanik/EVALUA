import { ensureMethod, parseJsonBody, sendError } from "./_lib/http.js";
import { tbl } from "../src/airtable.js";

function escapeFormulaValue(value) {
  return String(value).replace(/'/g, "''");
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  try {
    const body = await parseJsonBody(req);
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return sendError(res, 400, "Missing verification code.");
    }

    const records = await tbl.CERTIFICATES.select({
      maxRecords: 1,
      filterByFormula: `{VerificationCode} = '${escapeFormulaValue(code)}'`,
    }).firstPage();

    if (!records || records.length === 0) {
      return res.json({ valid: false });
    }

    const fields = records[0].fields || {};

    res.json({
      valid: true,
      name: fields.Name || "",
      test: fields.TestName || "",
      level: fields.Level || "",
      date: fields.Date || "",
      certificateId: fields.VerificationCode || code,
    });
  } catch (error) {
    console.error("/api/verify error", error);
    sendError(res, 500, "Failed to verify certificate.");
  }
}
