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
    const body = await req.json?.() || req.body; // Vercel edge/node compat
    const {
      userId, userEmail,
      estimatedLevel, confidence,
      askedByLevel, totalItems,
      startedAt, durationSec
    } = body || {};

    const rec = {
      fields: {
        UserId: userId || "",
        UserEmail: userEmail || "",
        EstimatedLevel: estimatedLevel || "",
        Confidence: confidence ?? null,
        AskedByLevel: JSON.stringify(askedByLevel || {}),
        TotalItems: totalItems ?? null,
        StartedAt: startedAt || new Date().toISOString(),
        DurationSec: durationSec ?? null,
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
