import { ensureMethod, sendError } from "../_lib/http.js";
import { tbl } from "../../src/airtable.js";
import { verifyJWT } from "../../src/util.js";

function extractToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return value || null;
}

export default async function handler(req, res) {
  if (!ensureMethod(req, res, "GET")) return;

  const token = extractToken(req);
  if (!token) {
    return sendError(res, 401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyJWT(token);
  } catch (error) {
    console.error("Invalid token", error);
    return sendError(res, 401, "Invalid token");
  }

  if (payload?.role !== "school" || !payload?.id) {
    return sendError(res, 403, "Unauthorized access");
  }

  try {
    const record = await tbl.SCHOOLS.find(payload.id);
    const schoolCode = record?.fields?.school_code;
    const schoolName = record?.fields?.name;
    if (!schoolCode) {
      return sendError(res, 404, "School code not available");
    }

    res.status(200).json({ schoolCode, schoolName, id: payload.id });
  } catch (error) {
    console.error("Unable to retrieve school code", error);
    if (error?.statusCode === 404) {
      return sendError(res, 404, "School not found");
    }
    return sendError(res, 500, "Server error");
  }
}
