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
const isRecId = (v) => typeof v === "string" && /^rec[0-9A-Za-z]{14}$/.test(v);

/** Convert a link-like value into a plain id (for reading) */
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

/** If the value is a record id, Airtable expects an array; otherwise a string. */
function linkWriteValue(v) {
  return isRecId(v) ? [v] : v;
}

async function safeFirstPage(sel) {
  try {
    const page = await sel.firstPage();
    return page || [];
  } catch {
    return [];
  }
}

/** Try to resolve a FILE record id from Files (by record id, url, or title). */
async function resolveFileRecId(fileIdOrTitleOrUrl) {
  if (isRecId(fileIdOrTitleOrUrl)) return fileIdOrTitleOrUrl;

  try {
    // try by URL or title
    const results = await tbl.FILES.select({
      maxRecords: 1,
      filterByFormula:
        `OR(` +
        `RECORD_ID() = '${fileIdOrTitleOrUrl}',` +
        `{url} = '${fileIdOrTitleOrUrl.replace(/'/g, "\\'")}',` +
        `{title} = '${fileIdOrTitleOrUrl.replace(/'/g, "\\'")}'` +
        `)`,
      fields: ["title", "url"],
    }).firstPage();
    if (results && results[0]) return results[0].id;
  } catch {}
  return null;
}

/** Try to resolve a STUDENT record id from Students (by email or id) */
async function resolveStudentRecId(userKey) {
  if (isRecId(userKey)) return userKey;
  if (!tbl.STUDENTS) return null; // se non esiste la tabella, usa solo testo

  try {
    const results = await tbl.STUDENTS.select({
      maxRecords: 1,
      filterByFormula:
        `OR(` +
        `{email} = '${userKey.replace(/'/g, "\\'")}',` +
        `{UserId} = '${userKey.replace(/'/g, "\\'")}',` + // se hai un campo UserId
        `RECORD_ID() = '${userKey}'` +
        `)`,
      fields: ["email"],
    }).firstPage();
    if (results && results[0]) return results[0].id;
  } catch {}
  return null;
}

/** Load all progress rows (optionally filter roughly by userKey) and filter in JS safely. */
async function loadUserProgressRows(userKey, userRecId) {
  // proviamo una selezione leggera (no formula fragile su link-to-record)
  const rows = await tbl.PROGRESS.select({
    // non mettiamo filterByFormula su link, filtriamo in memoria
    fields: ["UserId", "FileId", "Seconds", "Completed"],
    pageSize: 100,
  }).all();

  // filtro robusto:
  return rows.filter((r) => {
    const f = r.fields || {};
    const u = relationToId(f.UserId);
    // match se:
    // - esattamente il testo userKey
    // - oppure un record id uguale a userRecId
    return (u && (u === userKey || (userRecId && u === userRecId)));
  });
}

/* ---------------------------- handler ---------------------------- */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // allow only GET and POST
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
      // GET /content/progress  -> { progress: { [fileId]: { seconds, completed } } }
      const userRecId = await resolveStudentRecId(userKey);
      const rows = await loadUserProgressRows(userKey, userRecId);

      const out = {};
      for (const r of rows) {
        const f = r.fields || {};
        const fileKey = relationToId(f.FileId);
        if (!fileKey) continue;
        out[fileKey] = {
          seconds: Number(f.Seconds || 0),
          completed: !!f.Completed,
        };
      }
      return res.status(200).json({ progress: out });
    }

    // POST /content/progress  -> body { fileId, seconds?, completed? }
    const body = typeof req.body === "object" ? req.body : {};
    const fileIdRaw = body.fileId;
    const seconds = Number.isFinite(body.seconds) ? Number(body.seconds) : undefined;
    const completed = typeof body.completed === "boolean" ? body.completed : undefined;

    if (!fileIdRaw) return sendError(res, 400, "fileId missing");

    // resolve possible record ids (for link-to-record fields)
    const userRecId = await resolveStudentRecId(userKey);
    const fileRecId = await resolveFileRecId(fileIdRaw);

    // 1) fetch all user progress rows (safe) then find same file
    const userRows = await loadUserProgressRows(userKey, userRecId);
    const sameFileRow = userRows.find((r) => {
      const f = r.fields || {};
      const rFile = relationToId(f.FileId);
      // matches by recId if we have it, else by fileIdRaw (string)
      return (fileRecId && rFile === fileRecId) || (!fileRecId && rFile === fileIdRaw);
    });

    const writeFields = {
      UserId: linkWriteValue(userRecId || userKey),
      FileId: linkWriteValue(fileRecId || fileIdRaw),
      ...(seconds !== undefined ? { Seconds: seconds } : {}),
      ...(completed !== undefined ? { Completed: completed } : {}),
    };

    if (sameFileRow) {
      await tbl.PROGRESS.update(sameFileRow.id, writeFields);
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
    // messaggi più chiari se Airtable 422 (invalid value for link-to-record)
    if (err?.statusCode === 422) {
      return res.status(422).json({ error: "Airtable validation failed. Check field types: if UserId/FileId are 'Link to record', I must send an array of record IDs." });
    }
    return res.status(500).json({ error: "Unable to save or load progress" });
  }
}
