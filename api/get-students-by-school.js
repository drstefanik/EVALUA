import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.status(400).json({ error: 'Missing school code' })

  try {
    const records = await base('Students')
      .select({
        filterByFormula: `{SchoolCode} = '${code}'`,
        sort: [{ field: 'CreatedAt', direction: 'desc' }],
      })
      .all()

    const data = records.map((r) => ({
      id: r.id,
      name: r.get('Full Name'),
      email: r.get('Email'),
      createdAt: r.get('CreatedAt'),
    }))

    res.status(200).json({ records: data })
  } catch (err) {
    console.error('Error fetching students:', err)
    res.status(500).json({ error: 'Server error' })
  }
}
