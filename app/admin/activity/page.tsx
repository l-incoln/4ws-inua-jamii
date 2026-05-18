import { createClient } from '@/lib/supabase/server'
import { Activity, User, FileText, Image, Calendar, Bell, Shield, Download, Archive, CheckCircle, Settings2 } from 'lucide-react'
import ActivityLogClient from './ActivityLogClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Activity Log | Admin' }

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { action?: string; entity?: string }
}) {
  const supabase = await createClient()

  const actionFilter = searchParams.action?.trim() || null
  const entityFilter = searchParams.entity?.trim() || null

  let query = supabase
    .from('activity_logs')
    .select('id, user_id, action, entity_type, entity_id, metadata, created_at, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (actionFilter) query = query.eq('action', actionFilter)
  if (entityFilter) query = query.eq('entity_type', entityFilter)

  const { data: logs } = await query

  // Distinct action types for filter dropdown
  const { data: actionTypes } = await supabase
    .from('activity_logs')
    .select('action')
    .order('action')

  const uniqueActions = Array.from(new Set((actionTypes ?? []).map((r) => r.action))).sort()

  return (
    <ActivityLogClient
      logs={(logs as any[]) ?? []}
      uniqueActions={uniqueActions}
      currentAction={actionFilter}
      currentEntity={entityFilter}
    />
  )
}
