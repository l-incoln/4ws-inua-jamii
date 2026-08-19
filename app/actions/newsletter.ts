'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail, escapeHtml, emailLayout, emailButton, SITE_URL } from '@/lib/email'
import { getEmailSettings, senderFor } from '@/lib/email-settings'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
})

export async function subscribeNewsletter(
  data: z.infer<typeof subscribeSchema>
): Promise<{ error?: string; success?: boolean }> {
  const parsed = subscribeSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()

  // Insert or reactivate subscriber
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name || null,
        is_active: true,
        unsubscribed_at: null,
        source: 'footer',
      },
      { onConflict: 'email' }
    )

  if (error) {
    if (error.code === '23505') {
      // Already subscribed — treat as success
      return { success: true }
    }
    return { error: 'Failed to subscribe. Please try again.' }
  }

  // Send a welcome email (best-effort, don't block on failure).
  // Public communication → sent from info@ (public), reply-to info@.
  const settings = await getEmailSettings(supabase)
  const info = senderFor(settings, 'info')
  await sendEmail({
    to: parsed.data.email,
    from: info.from,
    replyTo: info.replyTo,
    subject: `Welcome to the 4W'S Inua Jamii newsletter`,
    html: newsletterWelcomeHtml(parsed.data.name, parsed.data.email),
    template: 'newsletter_welcome',
  }).catch(() => {})

  revalidatePath('/admin')
  return { success: true }
}

export async function unsubscribeNewsletter(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase())

  if (error) return { error: 'Failed to unsubscribe. Please try again.' }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Email template — uses the shared emailLayout for consistent branding
// ---------------------------------------------------------------------------
function newsletterWelcomeHtml(name: string | undefined, email: string) {
  const unsubUrl = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}`
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">
      ${name ? `Hi <strong>${escapeHtml(name)}</strong>,` : 'Hello,'}
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for subscribing to the <strong>4W'S Inua Jamii Foundation</strong> newsletter!
      You will now receive our latest impact stories, event announcements, and community updates
      straight to your inbox.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Together, we are building stronger communities across Kenya.
    </p>
    ${emailButton('Visit Our Website', SITE_URL, '#1E3A8A')}
    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      You can unsubscribe at any time by clicking
      <a href="${unsubUrl}" style="color:#1E3A8A;">this unsubscribe link</a>
      or the unsubscribe link in any of our emails.
    </p>
  `
  return emailLayout({
    headerTitle:    'Welcome to Our Newsletter',
    headerSubtitle: '4W\'S Inua Jamii Foundation',
    body,
  })
}
