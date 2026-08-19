'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail, applicationReceivedHtml, adminNewMemberHtml, membershipApprovedHtml, ORG_NAME } from '@/lib/email'
import { getEmailSettings, senderFor } from '@/lib/email-settings'
import { insertNotification } from '@/app/actions/notifications'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  tier: z.enum(['basic', 'active', 'champion']).default('basic'),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Invalid email or password. Please try again.' }
  }

  const next = (formData.get('next') as string) || '/dashboard'
  // Validate next is a relative path to prevent open redirect
  const safePath = next.startsWith('/') ? next : '/dashboard'
  redirect(safePath)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Check if signups are enabled in site settings
  const { data: signupSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'new_signups_enabled')
    .single()

  if (signupSetting?.value === 'false') {
    return { error: 'New member registrations are currently closed. Please check back later or contact us.' }
  }

  // Check auto-approve setting
  const { data: autoApproveSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'auto_approve_members')
    .single()
  const autoApprove = autoApproveSetting?.value === 'true'

  const raw = {
    full_name: formData.get('full_name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    phone: (formData.get('phone') as string) || undefined,
    tier: ((formData.get('tier') as string) || 'basic') as 'basic' | 'active' | 'champion',
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const consentAgreed = formData.get('consent_agreed') === 'true'
  if (!consentAgreed) {
    return { error: 'You must agree to the Privacy Policy to create an account.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone:     parsed.data.phone,
        tier:      parsed.data.tier,
        consent_agreed: 'true',
        membership_status: autoApprove ? 'approved' : 'pending',
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: error.message }
  }

  // Supabase returns an obfuscated user with no identities when the email is
  // already registered — emailing then would spam the existing account holder.
  const isNewAccount = (data?.user?.identities?.length ?? 0) > 0

  // Sends are awaited: an unawaited promise can be discarded when the
  // serverless invocation ends. Failures are logged, never surfaced.
  if (data?.user && isNewAccount) {
    const userId = data.user.id

    // 1️⃣ Insert in-app notification for the new member (visible in /dashboard/notifications)
    //    This is separate from the email — both channels should fire.
    void insertNotification({
      supabase,
      userId,
      type:  'system',
      title: '🏠 Application received — welcome!',
      body:  `Thank you for applying to ${ORG_NAME}. Your application is under review. You will be notified once approved.`,
      link:  '/dashboard',
    })

    // 2️⃣ Send emails (awaited via Promise.allSettled so they survive serverless lifecycle)
    const settings = await getEmailSettings(supabase)
    const sends: Array<Promise<unknown>> = []

    if (autoApprove) {
      // Auto-approved members skip review entirely, so the approval email is the
      // right one to send. The membership term (and card ID) is issued later.
      // Confirmation → sent from no-reply@ (automation, no reply-to).
      const noReply = senderFor(settings, 'no-reply')
      sends.push(sendEmail({
        to:      parsed.data.email,
        subject: `Your Membership Has Been Approved — 4W'S Inua Jamii Foundation`,
        from:    noReply.from,
        html:    membershipApprovedHtml({ name: parsed.data.full_name, tier: parsed.data.tier }),
      }))
    } else if (settings.applicationEmailEnabled) {
      // Application-received confirmation → sent from no-reply@ (automation).
      const noReply = senderFor(settings, 'no-reply')
      sends.push(sendEmail({
        to:      parsed.data.email,
        subject: `Application Received — 4W'S Inua Jamii Foundation`,
        from:    noReply.from,
        html:    applicationReceivedHtml({
          name:          parsed.data.full_name,
          tier:          parsed.data.tier,
          customMessage: settings.applicationEmailBody,
          requiresEmailConfirmation: !data.session,
          contactEmail:  settings.contactEmail,
        }),
      }))
    }

    if (settings.notifyAdminOnNewMember && settings.adminEmails.length) {
      // Admin approval alert → sent from no-reply@ to admin@, reply-to the
      // applicant so an admin can respond directly.
      const noReply = senderFor(settings, 'no-reply')
      sends.push(sendEmail({
        to:      settings.adminEmails,
        subject: `New Member Application — ${parsed.data.full_name}`,
        from:    noReply.from,
        replyTo: parsed.data.email,
        html:    adminNewMemberHtml({
          memberName:  parsed.data.full_name,
          memberEmail: parsed.data.email,
          tier:        parsed.data.tier,
          phone:       parsed.data.phone ?? null,
        }),
      }))
    }

    for (const result of await Promise.allSettled(sends)) {
      if (result.status === 'rejected') console.error('[email] signup notification failed:', result.reason)
    }
  }

  // If email confirmation is required (no session yet), tell the user to check
  // their email. This is Supabase's confirmation email — distinct from the
  // application-received email above.
  if (data?.user && !data?.session) {
    return {
      success: true,
      message:
        'Your membership application has been received! ✅\n\n' +
        'Please check your email for a confirmation link to verify your account. ' +
        'Once confirmed, our team will review your application and notify you of the outcome.',
    }
  }

    const next = (formData.get('next') as string) || '/dashboard'
    const safePath = next.startsWith('/') ? next : '/dashboard'
    redirect(safePath)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Please enter a valid email address.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password reset link sent. Check your inbox.' }
}

