// api/student/latest-placement.js
import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rawToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((c) => c.startsWith("token="))
        ?.split("=")[1] ||
      "";

    const claims = await verifyJWT(rawToken);
    const userId = claims?.id || claims?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const table = tbl(process.env.AIRTABLE_TABLE_PLACEMENTS);

    const records = await table
      .select({
        filterByFormula: `{UserId} = '${userId.replace(/'/g, "''")}'`,
        sort: [{ field: "CompletedAt", direction: "desc" }],
        maxRecords: 1,
      })
      .firstPage();

    if (!records || records.length === 0) {
      return res.status(200).json({ hasResult: false });
    }

    const f = records[0].fields;

    return res.status(200).json({
      hasResult: true,
      level: f.EstimatedLevel || null,
      confidence: f.Confidence ?? null,
      date: f.CompletedAt || f.StartedAt || null,
      testId: f.TestId || null,
      totalItems: f.TotalItems ?? null,
    });
  } catch (err) {
    console.error("latest-placement error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
