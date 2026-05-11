import { createClient } from '@/lib/supabase/server'
import { markContactMessageRead, deleteContactMessage } from '@/app/actions/admin'
import MessagesClient from './MessagesClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Contact Messages | Admin' }

export default async function AdminMessagesPage() {
  const supabase = await createClient()

  const { data: messages } = await supabase
    .from('contact_messages')
    .select('id, name, email, subject, message, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = messages ?? []
  const unreadCount = rows.filter((m) => !m.is_read).length

  return (
    <MessagesClient
      messages={rows}
      unreadCount={unreadCount}
      markRead={markContactMessageRead}
      deleteMessage={deleteContactMessage}
    />
  )
}
