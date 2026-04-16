import { getAuthUser } from '@/app/api/utils/auth'
import { getSupabaseAdminClient } from '@/lib/supabase'
import sql from '@/app/api/utils/sql'

export async function DELETE(request) {
  try {
    const user = await getAuthUser(request)

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileId = user.id
    const authUid = user.auth_uid

    // Delete application data first (Supabase cascades handle children)
    await sql`DELETE FROM properties WHERE user_id = ${profileId}`

    // Supabase admin.deleteUser removes the auth.users row and triggers any
    // ON DELETE CASCADE set up in the schema. The profiles row is deleted via
    // the FK cascade from auth.users → profiles(auth_uid).
    const admin = getSupabaseAdminClient()
    const { error } = await admin.auth.admin.deleteUser(authUid)

    if (error) {
      console.error('deleteUser error:', error)
      return Response.json({ error: 'Failed to delete auth user' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Account and all associated data have been deleted',
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return Response.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
