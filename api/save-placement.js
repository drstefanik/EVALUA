// api/save-placement.js
import { verifyJWT } from "../src/util.js";

// helpers
function toISOOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Test ID es: QAT-251112-AX7
function genTestId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // niente I/O confondenti
  const nums = "23456789";
  const pool = letters + nums;

  let suffix = "";
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    suffix += pool[idx];
  }

  return `QAT-${yy}${mm}${dd}-${suffix}`;
}

// Candidate ID es: CND-7FK2XM
function genCandidateId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return `CND-${code}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_PLACEMENTS } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_PLACEMENTS) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    const body =
      (typeof req.json === "function")
        ? await req.json()
        : (req.body || {});

    const header = (n) => req.headers[n]?.toString() || "";
    const cookie = (name) =>
      (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith(name + "="))?.split("=")[1] || "";

    let claims = null;
    const bearer = header("authorization");
    if (bearer?.toLowerCase().startsWith("bearer ")) {
      try {
        claims = verifyJWT(bearer.slice(7));
      } catch {
        // token non valido, proseguiamo senza claims
      }
    }

    const userIdHeader = header("x-user-id") || null;
    const userEmailHeader = header("x-user-email") || header("x-user") || null;
    const userIdFromBody = body.userId || null;
    const userEmailFromBody = body.userEmail || null;
    const userIdCookie = cookie("userId") || null;
    const userEmailCookie = cookie("userEmail") || null;

    const normalizedUserId =
      userIdFromBody || userIdHeader || userIdCookie || claims?.userId || null;
    const normalizedUserEmail =
      userEmailFromBody || userEmailHeader || userEmailCookie || claims?.email || null;

    const estimatedLevel = body.estimatedLevel ?? null;

    const confidence =
      typeof body.confidence === "string"
        ? Number(String(body.confidence).replace("%", "").trim()) || null
        : (typeof body.confidence === "number" ? body.confidence : null);

    const totalItems = body.totalItems ?? null;

    const startedAtISO = toISOOrNull(body.startedAt) || new Date().toISOString();
    // CompletedAt è un campo computed in Airtable, quindi NON lo inviamo

    const askedByLevel =
      typeof body.askedByLevel === "string"
        ? body.askedByLevel
        : JSON.stringify(body.askedByLevel || {});

    // ID “umani”, sempre generati qui
    const testId = genTestId();
    const candidateId = genCandidateId();

    const fields = {
      UserId: normalizedUserId,
      UserEmail: normalizedUserEmail,
      EstimatedLevel: estimatedLevel,
      Confidence: confidence,
      AskedByLevel: askedByLevel,
      TotalItems: totalItems,
      StartedAt: startedAtISO,
      DurationSec: body.durationSec ?? null,
      TestId: testId,
      CandidateId: candidateId,
    };

    if (body.studentRecordId) fields.Student = [body.studentRecordId];

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      AIRTABLE_TABLE_PLACEMENTS
    )}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Airtable error in save-placement:", resp.status, t);
      return res.status(resp.status).json({ error: "Airtable error", detail: t });
    }

    const data = await resp.json();
    const created = data?.records?.[0];

    return res.status(200).json({
      ok: true,
      id: created?.id || null,      // record Airtable (solo per uso interno)
      testId,                       // ID figo da mostrare allo studente
      candidateId,                  // ID figo da mostrare allo studente
      airtable: data,
    });
  } catch (e) {
    console.error("save-placement error:", e);
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}