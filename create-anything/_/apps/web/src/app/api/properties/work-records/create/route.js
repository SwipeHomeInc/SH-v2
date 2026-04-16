/**
 * POST /api/properties/work-records/create
 *
 * Creates a new work record for the user's property.
 * Both homeowners and contractors can create records.
 *
 * Body: { category, date_completed, scope_summary, contractor_id? }
 *
 * Status flow:
 *   - homeowner creates + tags contractor → pending_verification
 *   - homeowner creates without contractor → draft (owner_entry path)
 *   - contractor creates → pending_approval (homeowner must approve)
 */
import sql from '@/app/api/utils/sql'
import { getAuthUser } from '@/app/api/utils/auth'

export async function POST(request) {
  try {
    const user = await getAuthUser(request)
    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { category, date_completed, scope_summary, contractor_id, property_id: bodyPropertyId } = body

    if (!category || !date_completed || !scope_summary?.trim()) {
      return Response.json({ error: 'category, date_completed, and scope_summary are required' }, { status: 400 })
    }

    // Resolve property
    let propertyId = bodyPropertyId || null
    if (!propertyId) {
      const props = await sql`
        SELECT id FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
      `
      if (!props.length) {
        return Response.json({ error: 'No property found. Claim a DIDPID first.' }, { status: 400 })
      }
      propertyId = props[0].id
    } else {
      // Verify ownership
      const owned = await sql`
        SELECT id FROM properties WHERE id = ${propertyId} AND user_id = ${user.id}
      `
      if (!owned.length) {
        return Response.json({ error: 'Property not found' }, { status: 404 })
      }
    }

    // Determine role + initial status
    const createdByRole = 'homeowner'
    let status = 'draft'
    if (contractor_id) {
      status = 'pending_verification' // homeowner tagged a contractor
    }

    const inserted = await sql`
      INSERT INTO work_records (
        property_id, contractor_id, created_by_user_id, created_by_role,
        category, date_completed, scope_summary, status
      ) VALUES (
        ${propertyId}, ${contractor_id || null}, ${user.id}, ${createdByRole},
        ${category}, ${date_completed}, ${scope_summary.trim()}, ${status}
      ) RETURNING id
    `

    return Response.json({ ok: true, work_record_id: inserted[0].id, status })
  } catch (error) {
    console.error('work-records/create error:', error)
    return Response.json({ error: 'Failed to create work record' }, { status: 500 })
  }
}
