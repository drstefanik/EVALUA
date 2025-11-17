import { verifyJWT } from "../../src/util.js";
import { tbl } from "../../src/airtable.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const AGE_BUCKETS = [
  { label: "<=12", test: (age) => age !== null && age <= 12 },
  { label: "13-15", test: (age) => age !== null && age >= 13 && age <= 15 },
  { label: "16-18", test: (age) => age !== null && age >= 16 && age <= 18 },
  { label: "19-25", test: (age) => age !== null && age >= 19 && age <= 25 },
  { label: "26-40", test: (age) => age !== null && age >= 26 && age <= 40 },
  { label: ">40", test: (age) => age !== null && age > 40 },
];

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
  return String(value).replace(/'/g, "''");
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseDateRange(req) {
  const now = new Date();
  const toParam = req.query?.to || null;
  const fromParam = req.query?.from || null;

  const toDate = toParam ? new Date(toParam) : now;
  const fromDate = fromParam ? new Date(fromParam) : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const from = startOfDay(isNaN(fromDate) ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) : fromDate);
  const to = endOfDay(isNaN(toDate) ? now : toDate);

  return { from, to };
}

function pickField(fields, candidates = []) {
  for (const key of candidates) {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== "") {
      return fields[key];
    }
  }
  return null;
}

function computeAge(dateOfBirth, referenceDate) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob)) return null;
  const ref = new Date(referenceDate);
  if (isNaN(ref)) return null;

  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function pickAgeRange(age) {
  for (const bucket of AGE_BUCKETS) {
    if (bucket.test(age)) return bucket.label;
  }
  return null;
}

function normalizeLevel(raw) {
  if (!raw) return null;
  const value = String(raw).trim().toUpperCase();
  const matched = LEVELS.find((lvl) => value.startsWith(lvl));
  return matched || value || null;
}

function buildBucketKey(date, isMonthly) {
  const d = new Date(date);
  if (isNaN(d)) return null;
  if (isMonthly) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return d.toISOString().slice(0, 10);
}

function normalizeCountry(fields) {
  if (!fields) return null;
  const country = pickField(fields, [
    "TestCountry",
    "test_country",
    "country",
    "Country",
    "country_residence",
    "country_residency",
    "nationality",
    "Nationality",
  ]);
  return country ? String(country).trim() : null;
}

async function fetchPlacements(from, to) {
  const placementsTable = tbl(process.env.AIRTABLE_TABLE_PLACEMENTS || "Placements");
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const filterByFormula = `AND({CompletedAt} >= '${escapeFormulaValue(fromIso)}', {CompletedAt} <= '${escapeFormulaValue(toIso)}')`;

  const records = await placementsTable
    .select({
      filterByFormula,
      sort: [{ field: "CompletedAt", direction: "desc" }],
      maxRecords: 500,
    })
    .all();

  return records || [];
}

async function fetchStudentsByIds(ids = []) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return {};

  const studentsTable = tbl(process.env.AIRTABLE_TABLE_STUDENTS || "Students");
  const chunks = [];
  const results = {};

  const chunkSize = 50;
  for (let i = 0; i < unique.length; i += chunkSize) {
    chunks.push(unique.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    const formula = `OR(${chunk.map((id) => `RECORD_ID() = '${escapeFormulaValue(id)}'`).join(",")})`;
    const records = await studentsTable
      .select({
        filterByFormula: formula,
        maxRecords: chunk.length,
      })
      .all();

    records.forEach((rec) => {
      results[rec.id] = rec.fields || {};
    });
  }

  return results;
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
    console.warn("admin analytics invalid token", err);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = claims?.role || claims?.userRole || claims?.user?.role;
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { from, to } = parseDateRange(req);
  const dateRange = {
    from: from.toISOString(),
    to: to.toISOString(),
  };

  try {
    const placementRecords = await fetchPlacements(from, to);
    const studentIds = placementRecords.flatMap((rec) => rec.fields?.Student || rec.fields?.student || []);
    const studentsById = await fetchStudentsByIds(studentIds);

    const summary = {
      totalTests: placementRecords.length,
      uniqueStudents: new Set(studentIds.filter(Boolean)).size,
      dateRange,
    };

    const levelsDistribution = {};
    const levelAgeMatrixMap = new Map();
    const worldMapMap = new Map();
    const levelsOverTimeMap = new Map();
    const details = [];

    const useMonthlyBuckets = to.getTime() - from.getTime() > 90 * 24 * 60 * 60 * 1000;

    placementRecords.forEach((record) => {
      const fields = record.fields || {};
      const completedAt = fields.CompletedAt || fields.completed_at || null;
      if (!completedAt) return;
      const level = normalizeLevel(fields.Level || fields.level || fields.EstimatedLevel);
      const studentId = Array.isArray(fields.Student) ? fields.Student[0] : fields.Student || fields.student;
      const student = studentId ? studentsById[studentId] || {} : {};

      const country = normalizeCountry({ ...fields, ...student });
      const city = pickField({ ...fields, ...student }, ["city", "City", "CityTown", "Town"]);

      if (level) {
        levelsDistribution[level] = (levelsDistribution[level] || 0) + 1;
      }

      const ageFromDob = computeAge(
        pickField(student, [
          "date_of_birth",
          "Date of birth",
          "Date Of Birth",
          "DOB",
          "dob",
          "birthdate",
        ]),
        completedAt
      );
      const fallbackAge = pickField(student, ["age", "Age", "student_age"]);
      const age = ageFromDob ?? (fallbackAge !== null ? Number(fallbackAge) : null);
      const ageRange = pickAgeRange(typeof age === "number" && !isNaN(age) ? age : null);

      if (level && ageRange) {
        const key = `${level}__${ageRange}`;
        levelAgeMatrixMap.set(key, (levelAgeMatrixMap.get(key) || 0) + 1);
      }

      const countryKey = (country || "Unknown").toLowerCase();
      if (!worldMapMap.has(countryKey)) {
        worldMapMap.set(countryKey, {
          country: country || "Unknown",
          code: null,
          count: 0,
          byLevel: {},
        });
      }
      const countryEntry = worldMapMap.get(countryKey);
      countryEntry.count += 1;
      if (level) {
        countryEntry.byLevel[level] = (countryEntry.byLevel[level] || 0) + 1;
      }

      const bucket = buildBucketKey(completedAt, useMonthlyBuckets);
      if (bucket) {
        if (!levelsOverTimeMap.has(bucket)) {
          const base = { bucket };
          LEVELS.forEach((lvl) => {
            base[lvl] = 0;
          });
          levelsOverTimeMap.set(bucket, base);
        }
        const bucketEntry = levelsOverTimeMap.get(bucket);
        if (level && bucketEntry[level] !== undefined) {
          bucketEntry[level] += 1;
        }
      }

      if (details.length < 100) {
        details.push({
          date: new Date(completedAt).toISOString(),
          studentName:
            pickField(student, ["full_name", "Full Name", "fullName", "name", "Name"]) ||
            pickField(fields, ["StudentName", "student_name"]) ||
            "",
          city: city || "",
          country: country || "",
          level: level || "",
          duration: fields.DurationSec || fields.duration || null,
          testId: fields.TestId || fields.test_id || null,
        });
      }
    });

    const levelsDistributionOrdered = {};
    LEVELS.forEach((lvl) => {
      if (levelsDistribution[lvl]) {
        levelsDistributionOrdered[lvl] = levelsDistribution[lvl];
      }
    });

    const levelAgeMatrix = Array.from(levelAgeMatrixMap.entries()).map(([key, count]) => {
      const [level, ageRange] = key.split("__");
      return { level, ageRange, count };
    });

    const worldMap = Array.from(worldMapMap.values()).sort((a, b) => b.count - a.count);

    const levelsOverTime = Array.from(levelsOverTimeMap.values()).sort((a, b) =>
      a.bucket.localeCompare(b.bucket)
    );

    const topCountries = worldMap.slice(0, 10).map((item) => ({
      country: item.country,
      count: item.count,
    }));

    return res.status(200).json({
      summary,
      levelsDistribution: levelsDistributionOrdered,
      levelAgeMatrix,
      worldMap,
      levelsOverTime,
      details,
      topCountries,
    });
  } catch (error) {
    console.error("admin analytics error", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
