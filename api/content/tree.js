import { ensureMethod, sendError } from "../_lib/http.js";
import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

const foldersTable = tbl("Folders");
const filesTable = tbl("Files");

// ---- helpers ---------------------------------------------------------------
function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

function extractRelationId(value) {
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

function sanitizeFolder(record) {
  const f = record?.fields ?? {};
  const parentId = extractRelationId(f.parent || f.parent_folder || f.folder_parent);
  const order = Number(f.order ?? f.sort_order);
  const name = f.name ?? f.title ?? "";
  return {
    id: record.id,
    // 🔑 alias per compatibilità col frontend
    name,
    title: name,
    slug: f.slug ?? f.identifier ?? null,
    parent: typeof parentId === "string" ? parentId : null,
    visibility: f.visibility ?? "student",
    order: Number.isFinite(order) ? order : 999,
  };
}

function sanitizeFile(record) {
  const f = record?.fields ?? {};
  const folderId = extractRelationId(f.folder || f.folders || f.parent_folder);
  const prereqId = extractRelationId(f.prereq || f.prerequisite || f.prerequisites);
  const order = Number(f.order ?? f.sort_order);
  const size = Number(f.size ?? f.file_size);
  const duration = Number(f.duration);

  const out = {
    id: record.id,
    title: f.title ?? f.name ?? "",
    type: f.type ?? f.format ?? "",
    url: f.url ?? f.link ?? f.href ?? null,
    folder: typeof folderId === "string" ? folderId : null,
  };
  if (Number.isFinite(order)) out.order = order;
  if (Number.isFinite(size) && size > 0) out.size = size;
  if (Number.isFinite(duration) && duration > 0) out.duration = duration;
  if (f.thumb) out.thumb = f.thumb;
  if (typeof prereqId === "string") out.prereq = prereqId;
  return out;
}

function extractFolderId(record) {
  const f = record?.fields ?? {};
  const folderId = extractRelationId(f.folder || f.folders || f.parent_folder);
  return typeof folderId === "string" ? folderId : null;
}
async function fetchVimeoThumb(url) {
  try {
    // accetta sia player.vimeo.com/video/ID che vimeo.com/ID
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500) // 3.5s safety
    const r = await fetch(oembedUrl, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return null
    const data = await r.json()
    return data?.thumbnail_url || null
  } catch {
    return null
  }
}

// ---- handler ---------------------------------------------------------------
export default async function handler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;
  res.setHeader("Cache-Control", "no-store");

  const token = extractToken(req);
  if (!token) return sendError(res, 401, "Token not provided");

  let payload;
  try {
    payload = verifyJWT(token);
  } catch (err) {
    console.error("Invalid JWT for content tree", err);
    return sendError(res, 401, "Invalid session");
  }
  if (payload?.role !== "student") return sendError(res, 403, "Access denied");

  try {
    // Folders (visibility esiste qui)
    const folderRecords = await foldersTable.select({
      filterByFormula: '{visibility} = "student"',
      sort: [{ field: "order", direction: "asc" }],
      fields: ["name", "slug", "visibility", "parent", "order"],
    }).all();

    const folders = folderRecords
      .map(sanitizeFolder)
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          (a.title || "").localeCompare(b.title || "")
      );

    const folderIds = folders.map((f) => f.id);
    const folderIdSet = new Set(folderIds);

    // Files (niente filtro Airtable: filtriamo in memoria sugli ID cartella)
    let files = [];
    if (folderIdSet.size > 0) {
      const fileRecords = await filesTable.select({
        fields: ["title", "type", "url", "size", "folder", "order", "duration", "thumb", "prereq"],
        sort: [{ field: "order", direction: "asc" }],
      }).all();

      files = fileRecords
        .map((record) => ({ record, folderId: extractFolderId(record) }))
        .filter(({ folderId }) => folderId && folderIdSet.has(folderId))
        .map(({ record }) => sanitizeFile(record))
        .sort(
          (a, b) =>
            (a.order ?? 999) - (b.order ?? 999) ||
            (a.title || "").localeCompare(b.title || "")
        );
    }
// dopo .map(({ record }) => sanitizeFile(record))
files = await Promise.all(
  files.map(async (f) => {
    if (f.type === 'video' && !f.thumb && f.url) {
      const thumb = await fetchVimeoThumb(f.url)
      if (thumb) f.thumb = thumb
      // opzionale: salva in Airtable per cache
      // try { await filesTable.update(f.id, { thumb }) } catch {}
    }
    return f
  })
)

    console.log("student tree folders", folders.length);
    console.log("student tree files", files.length);

    return res.status(200).json({ folders, files });
  } catch (error) {
    console.error("student tree error", error);
    return res.status(500).json({ error: "Error retrieving content" });
  }
}
