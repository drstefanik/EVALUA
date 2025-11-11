import { sendError } from "../_lib/http.js";
import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

/* ---------------------------- helpers ---------------------------- */
function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function relationToId(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.id || first.value || null;
    return null;
  }
  if (typeof value === "object" && value !== null) return value.id || value.value || null;
  if (typeof value === "string") return value;
  return null;
}

function esc(str = "") {
  return String(str).replace(/'/g, "\\'");
}

/* ---------------------------- handler ---------------------------- */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendError(res, 405, "Method not allowed");
  }

  // auth
  const token = extractToken(req);
  if (!token) return sendError(res, 401, "Token not provided");
  let payload;
  try {
    payload = verifyJWT(token);
  } catch (err) {
    console.error("Invalid JWT for progress", err);
    return sendError(res, 401, "Invalid session");
  }
  if (payload?.role !== "student") return sendError(res, 403, "Access denied");

  const userKey = payload.id || payload.email || payload.sub || payload.userId || "";

  try {
    if (req.method === "GET") {
      // GET /content/progress
      const rows = await tbl.PROGRESS.select({
        // niente formula fragile: prendiamo tutto e filtriamo in memoria
        fields: ["UserId", "FileId", "Seconds", "Completed"],
        pageSize: 100,
      }).all();

      const out = {};
      for (const r of rows) {
        const f = r.fields || {};
        const u = relationToId(f.UserId);
        if (!u || u !== userKey) continue; // nel tuo schema è testo
        const fileKey = relationToId(f.FileId);
        if (!fileKey) continue;
        out[fileKey] = {
          seconds: Number(f.Seconds || 0),
          completed: !!f.Completed,
        };
      }
      return res.status(200).json({ progress: out });
    }

    // POST /content/progress  body { fileId, seconds?, completed? }
    const body = typeof req.body === "object" ? req.body : {};
    const fileId = String(body.fileId || "");
    if (!fileId) return sendError(res, 400, "fileId missing");
    const seconds = Number.isFinite(body.seconds) ? Number(body.seconds) : undefined;
    const completed = typeof body.completed === "boolean" ? body.completed : undefined;

    // cerca un record esistente (per il tuo schema: entrambi testo)
    const existing = await tbl.PROGRESS.select({
      maxRecords: 1,
      filterByFormula: `AND({UserId}='${esc(userKey)}',{FileId}='${esc(fileId)}')`,
      fields: ["UserId", "FileId"],
    }).firstPage().catch(() => []);

    const writeFields = {
      UserId: String(userKey),   // ✅ sempre stringa (Single line text)
      FileId: String(fileId),    // ✅ sempre stringa (Single line text)
      ...(seconds !== undefined ? { Seconds: seconds } : {}),
      ...(completed !== undefined ? { Completed: completed } : {}),
    };

    if (existing && existing[0]) {
      await tbl.PROGRESS.update(existing[0].id, writeFields);
    } else {
      await tbl.PROGRESS.create({
        Seconds: 0,
        Completed: false,
        ...writeFields,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("content/progress error", err);
    if (err?.statusCode === 422) {
      return res.status(422).json({ error: "Airtable validation failed. Check field types in Progress (UserId, FileId should be Single line text in this setup)." });
    }
    return res.status(500).json({ error: "Unable to save or load progress" });
  }
}
