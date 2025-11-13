import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js";
import { generateVerificationCode, upsertCertificate } from "../../src/services/certificates.js";

function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "POST")) return;

  let body = {};
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON for certificate issue", error);
    return sendError(res, 400, "Invalid payload");
  }

  const studentId = normalizeString(body.studentId) || null;
  const name = normalizeString(body.name) || null;
  const testName = normalizeString(body.testName) || null;
  const level = normalizeString(body.level) || null;
  const issuedAt = normalizeString(body.issuedAt) || new Date().toISOString();
  const pdfUrl = normalizeString(body.pdfUrl) || null;
  const status = normalizeString(body.status) || "Active";

  let code = normalizeString(body.code);
  if (code) {
    code = code.toUpperCase();
  } else {
    code = generateVerificationCode();
  }

  try {
    await upsertCertificate({
      code,
      studentId: studentId || undefined,
      name,
      testName,
      level,
      issuedAt,
      pdfUrl,
      status,
    });

    return res.status(200).json({
      code,
      name,
      testName,
      level,
      issuedAt,
      status,
      pdfUrl,
      verificationUrl: `evalua.education/verify?code=${code}`,
    });
  } catch (error) {
    console.error("Certificate issue error", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Unable to issue certificate",
      statusCode: error.statusCode || 500,
    });
  }
}
