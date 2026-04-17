/**
 * POST /api/buyer-swipecheck/submit
 *
 * Saves a Buyer SwipeCheck Lite risk profile.
 * No auth required — anonymous buyers can use this tool.
 * Inputs are validated server-side against allowed enum values.
 */
import sql from '@/app/api/utils/sql'
import { getAuthUser } from '@/app/api/utils/auth'

const ROOF_OPTIONS     = ['Looks New', 'Aging', 'Needs Replacement']
const HVAC_OPTIONS     = ['Looks New', 'Aging', 'Needs Replacement']
const WATER_HTR_OPTIONS= ['Looks New', 'Aging', 'Needs Replacement']
const WINDOWS_OPTIONS  = ['Original', 'Updated', 'Broken Seals']

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))

    const {
      property_address,
      roof_condition,
      hvac_condition,
      water_heater_condition,
      windows_condition,
      water_intrusion_flag,
      foundation_issues_flag,
      estimated_capex,
    } = body

    // Validate required field
    if (!property_address?.trim()) {
      return Response.json({ error: 'property_address is required' }, { status: 400 })
    }

    // Validate enum fields
    if (roof_condition      && !ROOF_OPTIONS.includes(roof_condition))
      return Response.json({ error: 'Invalid roof_condition value' }, { status: 400 })
    if (hvac_condition      && !HVAC_OPTIONS.includes(hvac_condition))
      return Response.json({ error: 'Invalid hvac_condition value' }, { status: 400 })
    if (water_heater_condition && !WATER_HTR_OPTIONS.includes(water_heater_condition))
      return Response.json({ error: 'Invalid water_heater_condition value' }, { status: 400 })
    if (windows_condition   && !WINDOWS_OPTIONS.includes(windows_condition))
      return Response.json({ error: 'Invalid windows_condition value' }, { status: 400 })

    // Validate capex is a non-negative number
    const capex = estimated_capex !== undefined && estimated_capex !== null && estimated_capex !== ''
      ? parseFloat(estimated_capex)
      : null
    if (capex !== null && (isNaN(capex) || capex < 0)) {
      return Response.json({ error: 'estimated_capex must be a non-negative number' }, { status: 400 })
    }

    // Optional: link to logged-in user if present
    let userId = null
    try {
      const user = await getAuthUser(request)
      if (user?.id) userId = user.id
    } catch {}

    const inserted = await sql`
      INSERT INTO buyer_swipecheck_logs (
        property_address,
        roof_condition,
        hvac_condition,
        water_heater_condition,
        windows_condition,
        water_intrusion_flag,
        foundation_issues_flag,
        estimated_capex,
        submitted_by_user_id
      ) VALUES (
        ${property_address.trim()},
        ${roof_condition || null},
        ${hvac_condition || null},
        ${water_heater_condition || null},
        ${windows_condition || null},
        ${!!water_intrusion_flag},
        ${!!foundation_issues_flag},
        ${capex},
        ${userId}
      ) RETURNING id
    `

    return Response.json({ ok: true, id: inserted[0].id })
  } catch (error) {
    console.error('buyer-swipecheck/submit error:', error)
    return Response.json({ error: 'Failed to save risk profile' }, { status: 500 })
  }
}
