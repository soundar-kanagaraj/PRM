import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export async function logActivity(params: {
  user: User | null
  entityType: string
  entityId?: string | null
  action: string
  description?: string | null
  partnerId?: string | null
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
}) {
  try {
    await supabase.from('activities').insert({
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      action: params.action,
      description: params.description ?? null,
      partner_id: params.partnerId ?? null,
      user_id: params.user?.id ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
    })
  } catch {
    // non-blocking
  }
}

export async function notifyManagers(params: {
  title: string
  message?: string | null
  type?: 'info' | 'warning' | 'error' | 'success'
  link?: string | null
  partnerId?: string | null
}) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['super_admin', 'partnership_manager'])
      .eq('is_active', true)
    if (!data || data.length === 0) return
    await supabase.from('notifications').insert(
      data.map((u) => ({
        user_id: u.id,
        title: params.title,
        message: params.message ?? null,
        type: params.type ?? 'info',
        link: params.link ?? null,
        partner_id: params.partnerId ?? null,
      }))
    )
  } catch {
    // non-blocking
  }
}
