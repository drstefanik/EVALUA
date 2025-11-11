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
    // Edge (req.json) o Node (req.body)
    const body = (typeof req.json === "function") ? await req.json() : req.body || {};

    // Fallback multipli: body -> header -> cookie
    const header = (name) => req.headers[name]?.toString() || "";
    const cookie = (name) =>
      (req.headers.cookie || "")
        .split(";")
        .map(s => s.trim())
        .find(c => c.startsWith(name + "="))
        ?.split("=")[1] || "";

    let userId = body.userId || header("x-user-id") || cookie("userId") || null;
    let userEmail = body.userEmail || header("x-user-email") || header("x-user") || cookie("userEmail") || null;

    const rec = {
      fields: {
        UserId: userId || null,
        UserEmail: userEmail || null,
        EstimatedLevel: body.estimatedLevel || null,
        Confidence: body.confidence ?? null,
        AskedByLevel: JSON.stringify(body.askedByLevel || {}),
        TotalItems: body.totalItems ?? null,
        StartedAt: body.startedAt || new Date().toISOString(),
        DurationSec: body.durationSec ?? null,
      }
    };

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_PLACEMENTS)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ records: [rec] })
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
