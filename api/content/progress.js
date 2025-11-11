// POST /content/progress
router.post('/content/progress', async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.email
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const { fileId, seconds, completed } = req.body
    if (!fileId) return res.status(400).json({ error: 'fileId missing' })

    // Se Progress.UserId è Link-to-record verso "Students"
    // e Progress.FileId è Link-to-record verso "Files",
    // risolvi i record ids:
    let userFieldValue = userId
    let fileFieldValue = fileId

    const progressTable = base('Progress')
    const filesTable = base('Files')
    const studentsTable = base('Students') // se non esiste, lascia com'è e usa testo

    // tenta di risolvere FILE come record id (se fileId non è già recXXXX)
    if (!/^rec[a-zA-Z0-9]{14}$/.test(fileId)) {
      const fileRec = await filesTable.select({
        maxRecords: 1,
        filterByFormula: `OR(RECORD_ID() = '${fileId}', {id} = '${fileId}', {title} = '${fileId}')`
      }).firstPage().catch(() => [])
      if (fileRec && fileRec[0]) fileFieldValue = fileRec[0].id
    }

    // risolvi USER come record id se hai tabella Students che contiene email/id
    if (!/^rec[a-zA-Z0-9]{14}$/.test(userId)) {
      const userRec = await studentsTable.select({
        maxRecords: 1,
        filterByFormula: `OR({email} = '${userId}', {UserId} = '${userId}')`
      }).firstPage().catch(() => [])
      if (userRec && userRec[0]) userFieldValue = userRec[0].id
    }

    // prepara i valori gestendo sia testo sia link-to-record
    const toValue = (v) => (/^rec[a-zA-Z0-9]{14}$/.test(String(v)) ? [String(v)] : String(v))

    const findExisting = await progressTable.select({
      maxRecords: 1,
      filterByFormula: `AND(
        OR({UserId} = '${userId}', {UserId} = '${toValue(userFieldValue)}'),
        OR({FileId} = '${fileId}', {FileId} = '${toValue(fileFieldValue)}')
      )`
    }).firstPage().catch(() => [])

    if (findExisting && findExisting[0]) {
      const rec = findExisting[0]
      await progressTable.update(rec.id, {
        UserId: toValue(userFieldValue),
        FileId: toValue(fileFieldValue),
        ...(Number.isFinite(seconds) ? { Seconds: seconds } : {}),
        ...(typeof completed === 'boolean' ? { Completed: completed } : {})
      })
    } else {
      await progressTable.create({
        UserId: toValue(userFieldValue),
        FileId: toValue(fileFieldValue),
        Seconds: Number.isFinite(seconds) ? seconds : 0,
        Completed: !!completed
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('save progress error', err)
    res.status(500).json({ error: 'Unable to save progress' })
  }
})
