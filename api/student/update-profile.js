import { ensureMethod, parseJsonBody, sendError } from "../_lib/http.js"
import { verifyJWT } from "../../src/util.js"
import { tbl } from "../../src/airtable.js"

const studentsTableName = process.env.AIRTABLE_TABLE_STUDENTS || "Students"
const studentsTable = tbl(studentsTableName)
const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env

function extractToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization
  if (!header || typeof header !== "string") return null
  const [scheme, token] = header.split(" ")
  return scheme === "Bearer" && token ? token : null
}

function sanitizeString(value) {
  return typeof value === "string" ? value.trim() : ""
}

function buildFullName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(" ")
}

// 🔧 aggiornata: ora NON lancia errore se Airtable ritorna NOT_FOUND
async function uploadStudentPhoto(upload) {
  if (!upload || typeof upload !== "object") return null
  const base64 = typeof upload.base64 === "string" ? upload.base64.trim() : ""
  if (!base64) return null
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Missing Airtable configuration for attachments")
  }

  const filename = upload.filename || "student-photo.jpg"
  const contentType = upload.contentType || "application/octet-stream"
  const buffer = Buffer.from(base64, "base64")
  const blob = new Blob([buffer], { type: contentType })
  const form = new FormData()
  form.append("file", blob, filename)

  let response
  try {
    response = await fetch(
      `https://content.airtable.com/v0/bases/${AIRTABLE_BASE_ID}/tables/${encodeURIComponent(
        studentsTableName
      )}/attachments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
        body: form,
      }
    )
  } catch (networkError) {
    console.error("uploadStudentPhoto network error", networkError)
    // se c'è un problema di rete, non blocchiamo l'update anagrafica
    return null
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    // se Airtable risponde con {"error":"NOT_FOUND"} non blocchiamo tutto
    if (text && text.includes('"NOT_FOUND"')) {
      console.warn("uploadStudentPhoto: Airtable returned NOT_FOUND, skipping attachment upload", text)
      return null
    }
    console.error("uploadStudentPhoto: unexpected Airtable error", text)
    throw new Error(text || "Unable to upload attachment to Airtable")
  }

  const json = await response.json().catch(() => null)
  if (!json) {
    throw new Error("Empty response from Airtable attachment upload")
  }

  if (Array.isArray(json)) {
    const mapped = json
      .map((item) => (item?.url ? { url: item.url, filename: item.filename || filename } : null))
      .filter(Boolean)
    if (mapped.length) return mapped
  }

  if (Array.isArray(json?.attachments)) {
    const mapped = json.attachments
      .map((item) => (item?.url ? { url: item.url, filename: item.filename || filename } : null))
      .filter(Boolean)
    if (mapped.length) return mapped
  }

  if (json?.url) {
    return [
      {
        url: json.url,
        filename: json.filename || filename,
      },
    ]
  }

  throw new Error("Unexpected Airtable attachment response")
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

  let firstName
  let lastName

  if (hasFirstName) {
    firstName = sanitizeString(payload.first_name)
    fields.first_name = firstName
  }

  if (hasLastName) {
    lastName = sanitizeString(payload.last_name)
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
      const attachments = await uploadStudentPhoto(payload.student_photo_upload)
      if (attachments) {
        fields.student_photo = attachments
      }
    }

    if (hasFirstName || hasLastName) {
      let existingFirstName
      let existingLastName

      if (!(hasFirstName && hasLastName)) {
        try {
          const existingRecord = await studentsTable.find(studentId)
          existingFirstName = existingRecord?.fields?.first_name
          existingLastName = existingRecord?.fields?.last_name
        } catch (fetchError) {
          console.error("update-profile existing name lookup failed", fetchError)
        }
      }

      const computedFullName = buildFullName(
        hasFirstName ? firstName : existingFirstName,
        hasLastName ? lastName : existingLastName
      )
      fields.full_name = computedFullName
    }

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
