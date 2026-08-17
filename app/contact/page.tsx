import Navbar from '@/components/layout/NavbarWrapper'
import Footer from '@/components/layout/Footer'
import ContactContent from './ContactContent'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const supabase = await createClient()

  // Fetch contact settings (fall back to defaults if not set)
  const keys = ['contact_email', 'contact_phone', 'address']
  const { data: settingsRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', keys)

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) {
    if (row.value) settings[row.key] = row.value
  }

  const contactInfo = {
    email:   settings.contact_email   || 'info@4wsinuajamii.org',
    phone:   settings.contact_phone   || '+254 700 000 000',
    address: settings.address         || 'Nairobi, Kenya',
  }

  return (
    <>
      <Navbar />
      <ContactContent contactInfo={contactInfo} />
      <Footer />
    </>
  )
}
