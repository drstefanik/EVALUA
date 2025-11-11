import { parseJsonBody, sendError } from "../_lib/http.js";
import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") {
    return null;
  }
  const parts = header.split(" ");
  if (parts.length !== 2) return null;
  const [scheme, token] = parts;
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

function escapeFormulaValue(value) {
  return String(value ?? "").replace(/"/g, '\\"');
}

function getUserIdentifier(payload) {
  const { id, email } = payload ?? {};
  if (typeof id === "string" && id.trim()) {
    return id.trim();
  }
  if (typeof email === "string" && email.trim()) {
    return email.trim().toLowerCase();
  }
  return null;
}

async function handleGet(req, res, userId) {
  try {
    const filterByFormula = `{UserId} = "${escapeFormulaValue(userId)}"`;
    const records = await tbl.PROGRESS.select({
      filterByFormula,
    }).all();

    const progress = {};
    for (const record of records) {
      const fields = record?.fields ?? {};
      const fileId = fields.FileId;
      if (!fileId) continue;
      const secondsRaw = fields.Seconds;
      const seconds = Number(secondsRaw);
      const completed = Boolean(fields.Completed);
      progress[fileId] = {
        seconds: Number.isFinite(seconds) && seconds >= 0 ? seconds : 0,
        completed,
      };
    }

    res.status(200).json({ progress });
  } catch (error) {
    console.error("Unable to load progress", error);
    return sendError(res, 500, "Unable to load progress");
  }
}

async function handlePost(req, res, userId) {
  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body for progress", error);
    return sendError(res, 400, "Invalid payload");
  }

  const rawFileId = body?.fileId;
  const fileId = typeof rawFileId === "string" ? rawFileId.trim() : "";
  if (!fileId) {
    return sendError(res, 400, "fileId is required");
  }

  let secondsValue;
  if ("seconds" in (body || {})) {
    const parsedSeconds = Number(body.seconds);
    if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) {
      return sendError(res, 400, "seconds must be a non-negative number");
    }
    secondsValue = parsedSeconds;
  }

  let completedValue;
  if ("completed" in (body || {})) {
    const rawCompleted = body.completed;
    if (typeof rawCompleted === "boolean") {
      completedValue = rawCompleted;
    } else if (typeof rawCompleted === "string") {
      completedValue = rawCompleted.toLowerCase() === "true";
    } else if (typeof rawCompleted === "number") {
      completedValue = rawCompleted !== 0;
    } else {
      completedValue = Boolean(rawCompleted);
    }
  }

  try {
    const filterByFormula = `AND({UserId} = "${escapeFormulaValue(userId)}", {FileId} = "${escapeFormulaValue(fileId)}")`;

    const existing = await tbl.PROGRESS.select({
      filterByFormula,
      maxRecords: 1,
    }).firstPage();

    if (existing.length > 0) {
      const record = existing[0];
      const updateFields = {};
      if (secondsValue !== undefined) {
        updateFields.Seconds = secondsValue;
      }
      if (completedValue !== undefined) {
        updateFields.Completed = completedValue;
      }

      if (Object.keys(updateFields).length > 0) {
        await tbl.PROGRESS.update(record.id, updateFields);
      }
    } else {
      await tbl.PROGRESS.create({
        UserId: userId,
        FileId: fileId,
        Seconds: secondsValue ?? 0,
        Completed: completedValue ?? false,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Unable to save progress", error);
    return sendError(res, 500, "Unable to save progress");
  }
}

export default async function handler(req, res) {
  const token = extractToken(req);
  if (!token) {
    return sendError(res, 401, "Token not provided");
  }

  let payload;
  try {
    payload = verifyJWT(token);
  } catch (error) {
    console.error("Invalid JWT for progress", error);
    return sendError(res, 401, "Invalid session");
  }

  if (payload?.role !== "student") {
    return sendError(res, 403, "Access denied");
  }

  const userId = getUserIdentifier(payload);
  if (!userId) {
    return sendError(res, 401, "Unauthorized");
  }

  if (req.method === "GET") {
    return handleGet(req, res, userId);
  }

  if (req.method === "POST") {
    return handlePost(req, res, userId);
  }

  res.setHeader("Allow", "GET, POST");
  return sendError(res, 405, "Method Not Allowed");
}
