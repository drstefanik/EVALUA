import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js"
import { verifyJWT } from "../../src/util.js"
import { tbl } from "../../src/airtable.js"
import { put } from "@vercel/blob"

const studentsTableName = process.env.AIRTABLE_TABLE_STUDENTS || "Students"
const studentsTable = tbl(studentsTableName)

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization
  if (!header || typeof header !== "string") return null
  const [scheme, token] = header.split(" ")
  return scheme === "Bearer" && token ? token : null
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : ""
}

// Upload foto studente su Vercel Blob
// Ritorna un array di attachment compatibili con Airtable: [{ url, filename }]
async function uploadStudentPhoto(upload, studentId) {
  if (!upload || typeof upload !== "object") return null

  const base64 = typeof upload.base64 === "string" ? upload.base64.trim() : ""
  if (!base64) return null

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.warn("uploadStudentPhoto: missing BLOB_READ_WRITE_TOKEN, skipping upload")
    return null
  }

  const originalName = upload.filename || "student-photo.jpg"
  const contentType = upload.contentType || "image/jpeg"

  // nome file un po' unico
  const safeStudentId = (studentId || "student").toString().replace(/[^a-zA-Z0-9_-]/g, "_")
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf(".") + 1)
    : "jpg"
  const filename = `students/${safeStudentId}/${Date.now()}.${ext}`

  const buffer = Buffer.from(base64, "base64")

  try {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      token,
    })

    // Airtable attachment compatibile
    return [
      {
        url: blob.url,
        filename: originalName,
      },
    ]
  } catch (err) {
    console.error("uploadStudentPhoto: Blob upload failed", err)
    // Non blocchiamo l'update anagrafico se la foto fallisce
    return null
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (!ensureMethod(req, res, "PATCH")) return

  const token = extractToken(req)
  if (!token) {
    return sendError(res, 401, "Authorization token missing")
  }

  let claims
  try {
    claims = verifyJWT(token)
  } catch (error) {
    console.error("update-profile invalid token", error)
    return sendError(res, 401, "Invalid session")
  }

  if (claims?.role !== "student") {
    return sendError(res, 403, "Access denied")
  }

  let body
  try {
    body = await parseJsonBody(req)
  } catch (error) {
    console.error("update-profile invalid json", error)
    return sendError(res, 400, "Invalid payload")
  }

  const payload = body && typeof body === "object" ? body : {}

  const studentId = claims.id || claims.sub || claims.recordId
  if (!studentId) {
    return sendError(res, 400, "Missing student identifier")
  }

  const fields = {}

  const hasFirstName = Object.prototype.hasOwnProperty.call(payload, "first_name")
  const hasLastName = Object.prototype.hasOwnProperty.call(payload, "last_name")

  if (hasFirstName) {
    const firstName = sanitizeString(payload.first_name)
    fields.first_name = firstName
  }

  if (hasLastName) {
    const lastName = sanitizeString(payload.last_name)
    fields.last_name = lastName
  }

  if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
    fields.phone = sanitizeString(payload.phone)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "place_birth")) {
    fields.place_birth = sanitizeString(payload.place_birth)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "country_birth")) {
    fields.country_birth = sanitizeString(payload.country_birth)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "identification_document")) {
    fields.identification_document = sanitizeString(payload.identification_document)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "document_number")) {
    fields.document_number = sanitizeString(payload.document_number)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "nationality")) {
    fields.nationality = sanitizeString(payload.nationality)
  }

  if (Object.prototype.hasOwnProperty.call(payload, "date_of_birth")) {
    const dateOfBirth = sanitizeString(payload.date_of_birth)
    if (dateOfBirth) {
      fields.date_of_birth = dateOfBirth
    } else {
      fields.date_of_birth = null
    }
  }

  try {
    if (payload?.student_photo_upload) {
      const attachments = await uploadStudentPhoto(payload.student_photo_upload, studentId)
      if (attachments) {
        fields.student_photo = attachments
      }
    }

    // NON scriviamo più full_name: in Airtable è un campo formula/computed.

    const sanitizedFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    )

    if (!Object.keys(sanitizedFields).length) {
      return res.status(200).json({ updated: false, fields: {} })
    }

    const updated = await studentsTable.update([
      {
        id: studentId,
        fields: sanitizedFields,
      },
    ])

    const updatedRecord = Array.isArray(updated) ? updated[0] : updated
    res.status(200).json({
      updated: true,
      fields: updatedRecord?.fields || sanitizedFields,
    })
  } catch (error) {
    console.error("update-profile error", error)
    if (error?.statusCode === 422) {
      return sendError(res, 422, "Airtable rejected the update")
    }
    return sendError(res, 500, "Unable to update profile")
  }
}
