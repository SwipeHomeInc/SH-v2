/**
 * POST /api/properties/documents/add
 *
 * Saves a document record to the property.
 * File is uploaded client-side to Supabase Storage; this route just stores the metadata.
 *
 * Body: { url, title, category, mime_type?, size_bytes?, notes? }
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
    const { url, title, category, mime_type, size_bytes, notes } = body

    if (!url || !title?.trim()) {
      return Response.json({ error: 'url and title are required' }, { status: 400 })
    }

    // Resolve property
    const props = await sql`
      SELECT id FROM properties WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 1
    `
    if (!props.length) {
      return Response.json({ error: 'No property found. Claim a DIDPID first.' }, { status: 400 })
    }
    const propertyId = props[0].id

    const inserted = await sql`
      INSERT INTO property_documents (
        property_id, url, title, category, mime_type, size_bytes, notes, uploaded_by_user_id
      ) VALUES (
        ${propertyId}, ${url}, ${title.trim()}, ${category || 'General/Other'},
        ${mime_type || null}, ${size_bytes || null}, ${notes || null}, ${user.id}
      ) RETURNING id
    `

    return Response.json({ ok: true, document_id: inserted[0].id })
  } catch (error) {
    console.error('documents/add error:', error)
    return Response.json({ error: 'Failed to save document' }, { status: 500 })
  }
}
