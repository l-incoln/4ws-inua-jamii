'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Upload an ID document for verification.
 * The file is stored in Supabase Storage and the URL is saved to the member's profile.
 */
export async function uploadIdDocument(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Please select a file to upload.' }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPG, PNG, WebP, or PDF files are accepted.' }
  }

  // Validate file size (5MB max for ID documents)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'File size must be under 5MB.' }
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `id-documents/${user.id}-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, { contentType: file.type })

  if (uploadError) {
    return { error: 'Failed to upload document. Please try again.' }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName)
  const fileUrl = urlData.publicUrl

  // Update the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      id_document_url: fileUrl,
      id_document_name: file.name,
      id_verified: false, // reset verification status on new upload
      id_verified_at: null,
      id_verified_by: null,
    })
    .eq('id', user.id)

  if (updateError) {
    return { error: 'Failed to save document reference. Please try again.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Admin: verify or reject a member's ID document.
 */
export async function verifyIdDocument(
  profileId: string,
  verified: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'You must be signed in.' }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Unauthorized.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      id_verified: verified,
      id_verified_at: verified ? new Date().toISOString() : null,
      id_verified_by: verified ? user.id : null,
    })
    .eq('id', profileId)

  if (error) return { error: error.message }

  // Notify the member
  await supabase.from('notifications').insert({
    user_id: profileId,
    type: 'general',
    title: verified ? 'ID Document Verified' : 'ID Document Rejected',
    body: verified
      ? 'Your ID document has been verified by an administrator.'
      : 'Your ID document could not be verified. Please upload a clearer copy or contact support.',
    link: '/dashboard/settings',
  }).then(() => {})

  revalidatePath('/admin/members')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
