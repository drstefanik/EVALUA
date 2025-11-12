// api/save-placement.js
import { verifyJWT } from "../../src/util.js";

// helpers
function toISOOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// TestId leggibile tipo: TST-251112-483
function genTestId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 900) + 100; // 100–999
  return `TST-${yy}${mm}${dd}-${suffix}`;
}

// CandidateId leggibile tipo: CAND-SC72 oppure CAND-4821
function genCandidateId(userId, userEmail) {
  let base = null;

  if (userId) {
    base = String(userId);
  } else if (userEmail) {
    base = String(userEmail).split("@")[0]; // parte prima della @
  }

  if (!base) {
    const rnd = Math.floor(Math.random() * 9000) + 1000;
    return `CAND-${rnd}`;
  }

  const cleaned = base.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || base.toUpperCase();
  const short = cleaned.slice(-4) || cleaned.slice(0, 4);
  return `CAND-${short}`;
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
    // Supporto edge (req.json) e node (req.body)
    const body =
      typeof req.json === "function" ? await req.json() : (req.body || {});

    const header = (n) => req.headers[n]?.toString() || "";
    const cookie = (name) =>
      (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith(name + "="))
        ?.split("=")[1] || "";

    // JWT opzionale
    let claims = null;
    const bearer = header("authorization");
    if (bearer?.toLowerCase().startsWith("bearer ")) {
      try {
        claims = verifyJWT(bearer.slice(7));
      } catch {
        // ignore invalid token
      }
    }

    // Identità: header → body → cookie → JWT
    const userIdHeader = header("x-user-id") || null;
    const userEmailHeader = header("x-user-email") || header("x-user") || null;

    const userIdFromBody = body.userId || null;
    const userEmailFromBody = body.userEmail || null;

    const userIdCookie = cookie("userId") || null;
    const userEmailCookie = cookie("userEmail") || null;

    const normalizedUserId =
      userIdFromBody || userIdHeader || userIdCookie || claims?.userId || null;

    const normalizedUserEmail =
      userEmailFromBody ||
      userEmailHeader ||
      userEmailCookie ||
      claims?.email ||
      null;

    // Payload normalizzato
    const estimatedLevel = body.estimatedLevel ?? null;

    const confidence =
      typeof body.confidence === "string"
        ? Number(String(body.confidence).replace("%", "").trim()) || null
        : typeof body.confidence === "number"
        ? body.confidence
        : null;

    const totalItems = body.totalItems ?? null;

    // Date in ISO (Airtable preferisce ISO)
    const startedAtISO = toISOOrNull(body.startedAt) || new Date().toISOString();
    const completedAtISO =
      toISOOrNull(body.completedAt) || new Date().toISOString();

    // Serializza oggetti in stringa (campi di testo in Airtable)
    const askedByLevel =
      typeof body.askedByLevel === "string"
        ? body.askedByLevel
        : JSON.stringify(body.askedByLevel || {});

    const askedBySkill =
      typeof body.askedBySkill === "string"
        ? body.askedBySkill
        : body.askedBySkill
        ? JSON.stringify(body.askedBySkill)
        : undefined;

    // IDs “belli”
    const testId = body.testId || genTestId();
    const candidateId =
      body.candidateId || genCandidateId(normalizedUserId, normalizedUserEmail);

    // Campi Airtable
    const fields = {
      UserId: normalizedUserId,
      UserEmail: normalizedUserEmail,
      EstimatedLevel: estimatedLevel,
      Confidence: confidence,
      AskedByLevel: askedByLevel,
      TotalItems: totalItems,
      StartedAt: startedAtISO,
      DurationSec: body.durationSec ?? null,

      // NEW / ID leggibili
      TestId: testId,
      CandidateId: candidateId,
      CompletedAt: completedAtISO,
    };

    if (askedBySkill !== undefined) {
      fields.AskedBySkill = askedBySkill;
    }

    // Link opzionale allo studente (campo Airtable "Student" → link to Students)
    if (body.studentRecordId) {
      fields.Student = [body.studentRecordId];
    }

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
      return res.status(resp.status).json({ error: "Airtable error", detail: t });
    }

    const data = await resp.json();
    const created = data?.records?.[0];

    return res.status(200).json({
      ok: true,
      id: created?.id || null,
      testId,
      candidateId,
      airtable: data,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}