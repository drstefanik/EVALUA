// api/save-placement.js
import { verifyJWT } from "../src/util.js";
import { tbl } from "../src/airtable.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_PLACEMENTS } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_PLACEMENTS) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  // ---- Parse body ----
  let body = {};
  try {
    body = typeof req.json === "function" ? await req.json() : req.body || {};
  } catch (err) {
    console.error("save-placement: invalid JSON body", err);
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  // ---- User identity (body + JWT) ----
  let userId = body.userId || body.userID || body.studentId || "";
  let email = body.email || body.userEmail || "";

  try {
    const rawToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith("token="))
        ?.split("=")[1] ||
      "";

    if (rawToken) {
      const claims = await verifyJWT(rawToken);
      if (claims) {
        userId = userId || claims.id || claims.userId || "";
        email = email || claims.email || claims.userEmail || "";
      }
    }
  } catch (e) {
    console.error("save-placement: JWT verification failed", e);
  }

  if (!userId || !email) {
    return res
      .status(400)
      .json({ error: "Missing userId or email for placement save" });
  }

  const table = tbl(AIRTABLE_TABLE_PLACEMENTS);

  const {
    // NB: questi possono NON arrivare dal client se sono campi formula in Airtable
    testId,
    candidateId,
    estimatedLevel,
    confidence,
    askedByLevel,
    totalItems,
    startedAt,
    durationSec,
    // completedAt: è computed in Airtable, non lo inviamo
  } = body;

  try {
    // ---- Creazione record su Airtable ----
    const fieldsToCreate = {
      UserId: userId,
      UserEmail: email,
      EstimatedLevel: estimatedLevel || "",
      Confidence: typeof confidence === "number" ? confidence : null,
      AskedByLevel: askedByLevel ? String(askedByLevel) : "",
      TotalItems: typeof totalItems === "number" ? totalItems : null,
      StartedAt: startedAt || new Date().toISOString(),
      DurationSec: typeof durationSec === "number" ? durationSec : null,
    };

    // Se vuoi comunque permettere override manuale da client:
    if (testId) fieldsToCreate.TestId = testId;
    if (candidateId) fieldsToCreate.CandidateId = candidateId;

    const record = await table.create(fieldsToCreate);

    // Qui leggiamo i valori "belli" (QAT-… / CND-…) dai campi Airtable
    const savedFields = record.fields || {};
    const finalTestId = savedFields.TestId || testId || "";
    const finalCandidateId = savedFields.CandidateId || candidateId || "";

    // ---- Response verso il front-end ----
    return res.status(200).json({
      ok: true,
      id: record.id,              // recordId Airtable (se ti serve)
      testId: finalTestId,        // <-- usa questo nel PDF
      candidateId: finalCandidateId, // <-- e questo
    });
  } catch (err) {
    console.error("save-placement Airtable error", err);
    return res.status(500).json({ error: "Unable to save placement" });
  }
}
