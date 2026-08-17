'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendEmail, escapeHtml, emailLayout, emailButton, SITE_URL, ORG_NAME } from '@/lib/email'
import { getEmailSettings } from '@/lib/email-settings'

const applicationSchema = z.object({
  motivation:   z.string().min(20, 'Please tell us more about why you want to join (min 20 characters)').max(1000),
  availability: z.string().max(200).optional(),
})

export async function applyToProgram(
  programId: string,
  motivation: string,
  availability?: string
): Promise<{ error?: string; success?: boolean; alreadyApplied?: boolean }> {
  const parsed = applicationSchema.safeParse({ motivation, availability })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to apply.' }

  // Check if already applied
  const { data: existing } = await supabase
    .from('program_applications')
    .select('id, status')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { alreadyApplied: true, error: `You have already applied — current status: ${existing.status}` }

  const { error } = await supabase.from('program_applications').insert({
    program_id:   programId,
    user_id:      user.id,
    motivation:   parsed.data.motivation,
    availability: parsed.data.availability ?? null,
  })

  if (error) return { error: 'Failed to submit application. Please try again.' }

  // Notify admins about the new program application
  try {
    const [{ data: program }, { data: profile }, settings] = await Promise.all([
      supabase.from('programs').select('title').eq('id', programId).single(),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      getEmailSettings(supabase),
    ])
    if (settings.adminEmails.length && program) {
      await sendEmail({
        to: settings.adminEmails,
        subject: `[Program Application] ${profile?.full_name ?? 'Member'} applied to "${program.title}"`,
        html: adminProgramAlertHtml({
          type: 'New Program Application',
          name: profile?.full_name ?? 'Member',
          programTitle: program.title,
          motivation: parsed.data.motivation,
          availability: parsed.data.availability ?? null,
          programId,
        }),
      }).catch(() => {})
    }
  } catch {}

  revalidatePath(`/programs`)
  return { success: true }
}

export async function cancelApplication(
  applicationId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('program_applications')
    .delete()
    .eq('id', applicationId)
    .eq('user_id', user.id) // ensure ownership

  if (error) return { error: error.message }
  revalidatePath('/programs')
  return { success: true }
}

// ---------------------------------------------------------------------------
// Admin program application alert email template
// ---------------------------------------------------------------------------
function adminProgramAlertHtml(opts: {
  type: string
  name: string
  programTitle: string
  motivation: string
  availability: string | null
  programId: string
}) {
  const body = `
    <p style="color:#334155;font-size:15px;margin-top:0;">Hello Admin,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(opts.name)}</strong> has submitted a program application:
    </p>
    <div style="background:#f8fafc;border-left:4px solid #1E3A8A;border-radius:6px;padding:16px 20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Program:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.programTitle)}</td></tr>
        <tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Applicant:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.name)}</td></tr>
        ${opts.availability ? `<tr><td style="padding:4px 0;font-size:14px;color:#64748b;font-weight:600;">Availability:</td><td style="padding:4px 0;font-size:14px;color:#334155;">${escapeHtml(opts.availability)}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;">Motivation:</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${escapeHtml(opts.motivation)}</p>
    </div>
    ${emailButton('Review Application', `${SITE_URL}/admin/applications`, '#1E3A8A')}
    <p style="color:#64748b;font-size:13px;margin-top:20px;">
      This is an automated notification from the ${ORG_NAME} programs system.
    </p>
  `
  return emailLayout({
    headerTitle:    opts.type,
    headerSubtitle: 'Admin Notification',
    headerColor:    '#1E3A8A',
    body,
  })
}
