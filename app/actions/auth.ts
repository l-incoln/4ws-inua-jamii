'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail, applicationReceivedHtml, adminNewMemberHtml } from '@/lib/email'

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

    // At this point, data.user exists.
  // Supabase handles account email confirmation separately.
  // We send our own "Application Received" email to the member,
  // and a "New Member" notification to the admin — regardless of session state.
  if (data?.user) {
    // Fetch email-related settings from CMS (non-blocking; don't let failure break signup)
    const { data: emailSettings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['welcome_email_enabled', 'admin_notify_new_member', 'admin_notify_email'])

    const es = Object.fromEntries((emailSettings ?? []).map((r) => [r.key, r.value ?? '']))

    // Send "Application Received" email to the new member
    if (es.welcome_email_enabled !== 'false') {
      sendEmail({
        to:      parsed.data.email,
        subject: `Application Received — 4W'S Inua Jamii Foundation`,
        html:    applicationReceivedHtml({
          name: parsed.data.full_name,
          tier: parsed.data.tier,
        }),
      }).catch((err) => console.error('[email] application received email failed:', err))
    }

    // Notify admin(s) of the new member application
    const adminEmail = es.admin_notify_email
    if (es.admin_notify_new_member !== 'false' && adminEmail) {
      sendEmail({
        to:      adminEmail,
        subject: `New Member Application — ${parsed.data.full_name}`,
        html:    adminNewMemberHtml({
          memberName:  parsed.data.full_name,
          memberEmail: parsed.data.email,
          tier:        parsed.data.tier,
          phone:       parsed.data.phone ?? null,
        }),
      }).catch((err) => console.error('[email] admin new member notification failed:', err))
    }
  }

  // If email confirmation is required (no session yet), tell the user to check their email.
  // This is Supabase's confirmation email — distinct from our application-received email above.
  if (data?.user && !data?.session) {
    return {
      success: true,
      message: 'Your application has been received! Please check your email to confirm your account. Once confirmed, our team will review and approve your membership.',
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

