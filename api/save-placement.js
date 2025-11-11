// api/save-placement.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_PLACEMENTS } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_PLACEMENTS) {
    return res.status(500).json({ error: "Missing Airtable env vars" });
  }

  try {
    // Supporto sia a edge (req.json) che a node (req.body)
    const body = (typeof req.json === "function") ? await req.json() : (req.body || {});
    const header = (n) => req.headers[n]?.toString() || "";
    const cookie = (name) =>
      (req.headers.cookie || "")
        .split(";").map(s => s.trim())
        .find(c => c.startsWith(name + "="))?.split("=")[1] || "";

    // 🔹 Sorgenti identità (no JWT): header → body → cookie
    const userIdRaw =
      header("x-user-id") || body.userId || cookie("userId") || "";
    const userEmailRaw =
      header("x-user-email") || header("x-user") || body.userEmail || cookie("userEmail") || "";

    const userId = userIdRaw || null;
    const userEmail = userEmailRaw || null;

    // 🔹 Normalizza campi payload
    const estimatedLevel = body.estimatedLevel || null;
    const confidence = (body.confidence ?? null);
    const totalItems = (body.totalItems ?? null);
    const startedAt = body.startedAt || new Date().toISOString();
    const durationSec = (body.durationSec ?? null);

    // Serializza in modo sicuro gli oggetti
    const askedByLevel =
      typeof body.askedByLevel === "string"
        ? body.askedByLevel
        : JSON.stringify(body.askedByLevel || {});
    const askedBySkill =
      typeof body.askedBySkill === "string"
        ? body.askedBySkill
        : (body.askedBySkill ? JSON.stringify(body.askedBySkill) : undefined);

    const fields = {
      UserId: userId,
      UserEmail: userEmail,
      EstimatedLevel: estimatedLevel,
      Confidence: confidence,
      AskedByLevel: askedByLevel,
      TotalItems: totalItems,
      StartedAt: startedAt,
      DurationSec: durationSec,
    };
    if (askedBySkill !== undefined) fields.AskedBySkill = askedBySkill;

    const rec = { fields };

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_PLACEMENTS)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [rec] }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(resp.status).json({ error: "Airtable error", detail: t });
    }

    const data = await resp.json();
    return res.status(200).json({ ok: true, airtable: data });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
