'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendEmail, escapeHtml } from '@/lib/email'
import { getEmailSettings } from '@/lib/email-settings'
import { insertNotification } from '@/app/actions/notifications'

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

  // Best-effort: notify admins by email that a new comment awaits moderation
  try {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, slug')
      .eq('id', postId)
      .single()

    const settings = await getEmailSettings(supabase)
    if (settings.adminEmails.length) {
      await sendEmail({
        to: settings.adminEmails,
        subject: `[Inua Jamii] New comment on "${post?.title ?? 'blog post'}"`,
        from: settings.fromHeader,
        replyTo: undefined,
        html: `
          <h2>New Blog Comment</h2>
          <p><strong>Post:</strong> ${escapeHtml(post?.title ?? 'Unknown')}</p>
          <p><strong>Author:</strong> ${escapeHtml(resolvedName ?? 'Anonymous')}</p>
          <hr />
          <p style="white-space: pre-wrap;">${escapeHtml(parsed.data.body)}</p>
          <hr />
          <p style="color:#888;font-size:12px;">
            Review and approve at <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/comments">Admin &rsaquo; Comments</a>
          </p>
        `,
      })
    }
  } catch (err) {
    console.error('[comments] admin notification email failed:', err)
  }

  revalidatePath('/blog')
  return { success: true }
}
