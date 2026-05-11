'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const commentSchema = z.object({
  body:        z.string().min(2, 'Comment must be at least 2 characters').max(2000, 'Comment too long'),
  author_name: z.string().min(1, 'Name is required').max(100).optional(),
})

export async function submitComment(
  postId: string,
  body: string,
  authorName?: string,
  parentId?: string
): Promise<{ error?: string; success?: boolean }> {
  const parsed = commentSchema.safeParse({ body, author_name: authorName })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let resolvedName = authorName ?? null

  if (user) {
    // Get profile name for authenticated users
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    resolvedName = profile?.full_name ?? user.email ?? 'Member'
  } else if (!authorName) {
    return { error: 'Please provide your name' }
  }

  const { error } = await supabase.from('blog_comments').insert({
    post_id:     postId,
    author_id:   user?.id ?? null,
    author_name: resolvedName,
    body:        parsed.data.body,
    parent_id:   parentId ?? null,
    is_approved: false, // all comments start unapproved
  })

  if (error) return { error: 'Failed to submit comment. Please try again.' }

  revalidatePath('/blog')
  return { success: true }
}
