'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
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

  // Send a welcome email (best-effort, don't block on failure)
  await sendEmail({
    to: parsed.data.email,
    subject: `Welcome to the 4W'S Inua Jamii newsletter`,
    html: newsletterWelcomeHtml(parsed.data.name),
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
// Email template
// ---------------------------------------------------------------------------
function newsletterWelcomeHtml(name?: string) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">
      ${name ? `Hi <strong>${name}</strong>,` : 'Hello,'}
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Thank you for subscribing to the <strong>4W'S Inua Jamii Foundation</strong> newsletter!
      You will now receive our latest impact stories, event announcements, and community updates
      straight to your inbox.
    </p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      Together, we are building stronger communities across Kenya.
    </p>
    <p style="color:#64748b;font-size:13px;margin-top:28px;">
      You can unsubscribe at any time by clicking the unsubscribe link in any of our emails.
    </p>
  `
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Newsletter Subscription — 4W'S Inua Jamii</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
  <div style="max-width:580px;margin:0 auto;">
    <div style="background:#1E3A8A;border-radius:12px 12px 0 0;padding:32px 40px;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">4W'S Inua Jamii Foundation</p>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Welcome to Our Newsletter</h1>
    </div>
    <div style="background:#ffffff;padding:36px 40px;">
      ${body}
    </div>
    <div style="background:#e2e8f0;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">
        You received this email because you subscribed on our website.
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/unsubscribe?email=${encodeURIComponent('')}" style="color:#1E3A8A;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
