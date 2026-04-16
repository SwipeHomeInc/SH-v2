/**
 * GET /api/properties/record
 * Returns all data needed for the Proof Pack:
 *  - property + DIDPID
 *  - work_records with before/after photos
 *  - property_documents
 *  - last swipecheck date + count of checks
 *  - aggregate stats
 */
import sql from '@/app/api/utils/sql'
import { getAuthUser } from '@/app/api/utils/auth'

export async function GET(request) {
  try {
    const user = await getAuthUser(request)
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Most recent property for this user
    const props = await sql`
      SELECT p.*, d.didpid_code, d.status as didpid_status, d.id as didpid_id
      FROM properties p
      LEFT JOIN didpids d ON d.property_id = p.id
      WHERE p.user_id = ${user.id}
      ORDER BY p.created_at DESC
      LIMIT 1
    `

    if (!props.length) {
      return Response.json({ property: null, work_records: [], documents: [], stats: null })
    }

    const property = props[0]
    const propertyId = property.id

    // Work records with their photos
    const workRows = await sql`
      SELECT
        wr.*,
        c.name as contractor_name,
        c.trade as contractor_trade,
        c.phone as contractor_phone,
        c.email as contractor_email
      FROM work_records wr
      LEFT JOIN contractors c ON c.id = wr.contractor_id
      WHERE wr.property_id = ${propertyId}
      ORDER BY wr.date_completed DESC
    `

    // Photos for all work records
    const workIds = workRows.map(r => r.id)
    let photoRows = []
    if (workIds.length) {
      photoRows = await sql`
        SELECT * FROM work_record_photos
        WHERE work_record_id = ANY(${workIds})
        ORDER BY created_at ASC
      `
    }

    // Attach photos to each record
    const photosByRecord = {}
    for (const p of photoRows) {
      if (!photosByRecord[p.work_record_id]) photosByRecord[p.work_record_id] = []
      photosByRecord[p.work_record_id].push(p)
    }
    const workRecords = workRows.map(r => ({
      ...r,
      photos: photosByRecord[r.id] || [],
    }))

    // Property documents
    const documents = await sql`
      SELECT * FROM property_documents
      WHERE property_id = ${propertyId}
      ORDER BY uploaded_at DESC
    `

    // Stats
    const lastCheck = await sql`
      SELECT created_at FROM swipe_checks
      WHERE property_id = ${propertyId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    const verifiedCount = workRecords.filter(r => r.status === 'finalized').length
    const lastVerified = workRecords.find(r => r.status === 'finalized')?.finalized_at || null

    const stats = {
      verified_jobs: verifiedCount,
      documents: documents.length,
      last_verified: lastVerified,
      last_swipecheck: lastCheck[0]?.created_at || null,
    }

    return Response.json({ property, work_records: workRecords, documents, stats })
  } catch (error) {
    console.error('properties/record error:', error)
    return Response.json({ error: 'Failed to load property record' }, { status: 500 })
  }
}
