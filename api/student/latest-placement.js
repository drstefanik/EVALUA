// api/student/latest-placement.js
import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  const cookieHeader = req.headers.cookie || "";
  const tokenCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((cookie) => cookie.startsWith("token="));

  if (tokenCookie) {
    return tokenCookie.split("=")[1] || "";
  }

  return "";
}

function escapeFormulaValue(value) {
  return value.replace(/'/g, "''");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawToken = extractToken(req);
  if (!rawToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let claims;
  try {
    claims = await verifyJWT(rawToken);
  } catch (err) {
    console.warn("latest-placement invalid token", err);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = claims?.id || claims?.userId || claims?.sub || null;
  const userEmail = claims?.email || claims?.userEmail || null;

  if (!userId && !userEmail) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const table = tbl(process.env.AIRTABLE_TABLE_PLACEMENTS);

    const filterByFormula = userId
      ? `{UserId} = '${escapeFormulaValue(String(userId))}'`
      : `{UserEmail} = '${escapeFormulaValue(String(userEmail))}'`;

    const records = await table
      .select({
        filterByFormula,
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
