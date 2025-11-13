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

  const response = await fetch(
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

  if (!response.ok) {
    const text = await response.text().catch(() => "")
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

  const firstName = sanitizeString(body?.first_name)
  const lastName = sanitizeString(body?.last_name)
  const phone = sanitizeString(body?.phone)
  const placeOfBirth = sanitizeString(body?.place_birth)
  const countryOfBirth = sanitizeString(body?.country_birth)
  const identificationDocument = sanitizeString(body?.identification_document)
  const documentNumber = sanitizeString(body?.document_number)
  const nationality = sanitizeString(body?.nationality)
  const dateOfBirth = sanitizeString(body?.date_of_birth)

  const fields = {
    first_name: firstName,
    last_name: lastName,
    phone,
    place_birth: placeOfBirth,
    country_birth: countryOfBirth,
    identification_document: identificationDocument,
    document_number: documentNumber,
    nationality,
    full_name: buildFullName(firstName, lastName),
  }

  if (dateOfBirth) {
    fields.date_of_birth = dateOfBirth
  } else {
    fields.date_of_birth = null
  }

  try {
    if (body?.student_photo_upload) {
      const attachments = await uploadStudentPhoto(body.student_photo_upload)
      if (attachments) {
        fields.student_photo = attachments
      }
    }

    const sanitizedFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined)
    )

    const studentId = claims.id || claims.sub || claims.recordId
    if (!studentId) {
      return sendError(res, 400, "Missing student identifier")
    }

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
