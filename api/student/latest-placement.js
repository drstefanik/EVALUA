// api/student/latest-placement.js
import { verifyJWT } from '../../src/util.js';
import { tbl } from '../../src/airtable.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_PLACEMENTS } = process.env;
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_PLACEMENTS) {
    return res.status(500).json({ error: 'Missing Airtable env vars' });
  }

  // --- recupero JWT dallo stesso schema del resto dell’app ---
  let claims = null;
  try {
    const rawToken =
      req.headers.authorization?.replace('Bearer ', '') ||
      (req.headers.cookie || '')
        .split(';')
        .map((s) => s.trim())
        .find((c) => c.startsWith('token='))?.split('=')[1] ||
      '';

    if (!rawToken) {
      return res.status(401).json({ error: 'Missing auth token' });
    }

    claims = await verifyJWT(rawToken);
    if (!claims) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    console.error('latest-placement: JWT verification failed', err);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = claims.id || claims.userId || '';
  const email = claims.email || claims.userEmail || '';

  if (!userId && !email) {
    return res.status(400).json({ error: 'Missing user identity' });
  }

  const table = tbl(AIRTABLE_TABLE_PLACEMENTS);

  try {
    // filtro per UserId o per email, così prendiamo tutti i tentativi dell’utente
    const filter = userId
      ? `OR({UserId} = '${userId}', {UserEmail} = '${email}')`
      : `{UserEmail} = '${email}'`;

    const records = await table
      .select({
        filterByFormula: filter,
        sort: [
          { field: 'CompletedAt', direction: 'desc' },
          { field: 'StartedAt', direction: 'desc' },
        ],
        maxRecords: 1,
      })
      .firstPage();

    if (!records || records.length === 0) {
      return res.status(200).json({ ok: true, placement: null });
    }

    const record = records[0];
    const f = record.fields;

    const placement = {
      id: record.id, // solo interno, NON usato come Test ID nel PDF
      level: f.EstimatedLevel || null,
      estimatedLevel: f.EstimatedLevel || null,
      confidence:
        typeof f.Confidence === 'number'
          ? f.Confidence
          : f.ConfidencePct ?? null,
      testId: f.TestId || null,          // 👈 QAT-...
      TestId: f.TestId || null,
      candidateId: f.CandidateId || null, // 👈 CND-...
      CandidateId: f.CandidateId || null,
      totalItems: f.TotalItems ?? null,
      durationSec: f.DurationSec ?? null,
      startedAt: f.StartedAt || null,
      completedAt: f.CompletedAt || null,
    };

    return res.status(200).json({ ok: true, placement });
  } catch (err) {
    console.error('latest-placement Airtable error', err);
    return res.status(500).json({ error: 'Unable to fetch latest placement' });
  }
}
