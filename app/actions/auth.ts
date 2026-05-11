'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { sendEmail, welcomeEmailHtml } from '@/lib/email'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
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
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone:     parsed.data.phone,
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

  if (data?.user && !data?.session) {
    return { success: true, message: 'Check your email to confirm your account.' }
  }

  // Send welcome email if enabled in CMS
  if (data?.user) {
    const { data: emailSettings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['welcome_email_enabled', 'welcome_email_body', 'from_email', 'from_name'])

    const es = Object.fromEntries((emailSettings ?? []).map((r) => [r.key, r.value ?? '']))
    if (es.welcome_email_enabled !== 'false') {
      await sendEmail({
        to:      parsed.data.email,
        subject: 'Welcome to ' + (es.from_name || '4W\'S Inua Jamii'),
        html:    es.welcome_email_body
          ? `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">${es.welcome_email_body.replace(/\n/g, '<br/>')}</div>`
          : welcomeEmailHtml({ name: parsed.data.full_name }),
      })
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

