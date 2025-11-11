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
  return String(value).replace(/"/g, '\\"');
}

function parseSeconds(input) {
  const value = Number(input);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function coerceBoolean(value) {
  return Boolean(value);
}

function ensureStudentSession(req, res) {
  const token = extractToken(req);
  if (!token) {
    sendError(res, 401, "Token not provided");
    return null;
  }

  let payload;
  try {
    payload = verifyJWT(token);
  } catch (error) {
    console.error("Invalid JWT for content progress", error);
    sendError(res, 401, "Invalid session");
    return null;
  }

  if (payload?.role !== "student") {
    sendError(res, 403, "Access denied");
    return null;
  }

  const userId = payload?.id || payload?.email;
  if (!userId) {
    sendError(res, 401, "Invalid user session");
    return null;
  }

  return { payload, userId };
}

async function handleGet(req, res) {
  const session = ensureStudentSession(req, res);
  if (!session) return;
  const { userId } = session;

  try {
    const filter = `{UserId} = "${escapeFormulaValue(userId)}"`;
    const records = await tbl.PROGRESS.select({
      filterByFormula: filter,
    }).all();

    const progress = {};
    for (const record of records) {
      const fields = record?.fields ?? {};
      const fileId = fields.FileId;
      if (!fileId) continue;

      const parsedSeconds = parseSeconds(fields.Seconds);
      const seconds = parsedSeconds ?? 0;
      const completed = coerceBoolean(fields.Completed);

      progress[fileId] = { seconds, completed };
    }

    res.status(200).json({ progress });
  } catch (error) {
    console.error("Unable to load progress", error);
    sendError(res, 500, "Unable to load progress");
  }
}

async function handlePost(req, res) {
  const session = ensureStudentSession(req, res);
  if (!session) return;
  const { userId } = session;

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (error) {
    console.error("Invalid JSON body for progress", error);
    sendError(res, 400, "Invalid payload");
    return;
  }

  const fileIdRaw = typeof body?.fileId === "string" ? body.fileId.trim() : "";
  if (!fileIdRaw) {
    sendError(res, 400, "fileId is required");
    return;
  }

  const secondsProvided = Object.prototype.hasOwnProperty.call(body, "seconds");
  const completedProvided = Object.prototype.hasOwnProperty.call(body, "completed");

  if (!secondsProvided && !completedProvided) {
    sendError(res, 400, "No progress fields provided");
    return;
  }

  let secondsValue = null;
  if (secondsProvided) {
    secondsValue = parseSeconds(body.seconds);
    if (secondsValue === null) {
      sendError(res, 400, "Invalid seconds value");
      return;
    }
  }

  const completedValue = completedProvided ? coerceBoolean(body.completed) : null;

  try {
    const filter = `AND({UserId} = "${escapeFormulaValue(userId)}", {FileId} = "${escapeFormulaValue(fileIdRaw)}")`;
    const existingRecords = await tbl.PROGRESS.select({
      filterByFormula: filter,
      maxRecords: 1,
    }).firstPage();

    if (existingRecords.length > 0) {
      const record = existingRecords[0];
      const updateFields = {};
      if (secondsProvided) {
        updateFields.Seconds = secondsValue;
      }
      if (completedProvided) {
        updateFields.Completed = completedValue;
      }

      if (Object.keys(updateFields).length > 0) {
        await tbl.PROGRESS.update(record.id, updateFields);
      }
    } else {
      const createFields = {
        UserId: userId,
        FileId: fileIdRaw,
        Seconds: secondsProvided ? secondsValue : 0,
        Completed: completedProvided ? completedValue : false,
      };
      await tbl.PROGRESS.create(createFields);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Unable to save progress", error);
    sendError(res, 500, "Unable to save progress");
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    await handleGet(req, res);
    return;
  }

  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  sendError(res, 405, "Method Not Allowed");
}

