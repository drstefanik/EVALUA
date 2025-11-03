import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Missing code' })

  try {
    const records = await base('Schools')
      .select({
        filterByFormula: `{Code} = '${code}'`,
        maxRecords: 1,
      })
      .all()

    if (records.length === 0) return res.status(404).json({ error: 'School not found' })

    const r = records[0]
    const school = {
      id: r.id,
      name: r.get('Name'),
      email: r.get('Email'),
      code: r.get('Code'),
    }

    res.status(200).json({ record: school })
  } catch (err) {
    console.error('Error fetching school:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
