/**
 * Africa's Talking SMS integration.
 *
 * Set these env vars in .env.local (and Vercel/Supabase environment):
 *   AT_API_KEY=your_api_key
 *   AT_USERNAME=your_username         (use "sandbox" for testing)
 *   AT_SENDER_ID=YourSenderId         (optional short-code, e.g. "InuaJamii")
 *
 * Docs: https://developers.africastalking.com/docs/sms/sending
 */

const AT_BASE_URL = 'https://api.africastalking.com/version1'
const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1'

function getBaseUrl() {
  return process.env.AT_USERNAME === 'sandbox' ? AT_SANDBOX_URL : AT_BASE_URL
}

interface SMSResult {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Send a single SMS message to one or more recipients.
 * Recipients should be in international format: +254712345678
 */
export async function sendSMS(
  to: string | string[],
  message: string
): Promise<SMSResult> {
  const apiKey    = process.env.AT_API_KEY
  const username  = process.env.AT_USERNAME
  const senderId  = process.env.AT_SENDER_ID

  // Gracefully skip SMS if not configured — do not fail the calling action
  if (!apiKey || !username) {
    console.warn('[SMS] Africa\'s Talking credentials not configured — skipping SMS.')
    return { success: false, error: 'SMS not configured' }
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map((n) => n.replace(/\s/g, ''))
    .filter((n) => n.length > 0)
    .join(',')

  if (!recipients) return { success: false, error: 'No valid recipients' }

  try {
    const body = new URLSearchParams({
      username,
      to: recipients,
      message,
      ...(senderId ? { from: senderId } : {}),
    })

    const res = await fetch(`${getBaseUrl()}/messaging`, {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[SMS] Africa\'s Talking error:', text)
      return { success: false, error: `HTTP ${res.status}` }
    }

    const json = await res.json()
    const recipient = json?.SMSMessageData?.Recipients?.[0]

    if (recipient?.statusCode === 101) {
      return { success: true, messageId: recipient.messageId }
    }

    return { success: false, error: recipient?.status ?? 'Unknown error' }
  } catch (err) {
    console.error('[SMS] send failed:', err)
    return { success: false, error: String(err) }
  }
}

// ─── Pre-built message helpers ────────────────────────────────────────────────

export async function smsMemberApproved(phone: string, name: string, tier: string) {
  return sendSMS(phone, `Hi ${name}, your 4W'S Inua Jamii Foundation membership has been approved! Tier: ${tier}. Log in at inuajamii.org to access member benefits.`)
}

export async function smsDonationConfirmed(phone: string, name: string, amount: string, reference: string) {
  return sendSMS(phone, `Dear ${name}, your donation of ${amount} to 4W'S Inua Jamii Foundation has been received. Reference: ${reference}. Thank you for your generosity!`)
}

export async function smsEventReminder(phone: string, name: string, eventTitle: string, eventDate: string) {
  return sendSMS(phone, `Hi ${name}, reminder: "${eventTitle}" is on ${eventDate}. We look forward to seeing you! - 4W'S Inua Jamii Foundation`)
}

export async function smsApplicationUpdate(phone: string, name: string, programTitle: string, status: 'accepted' | 'rejected') {
  const msg = status === 'accepted'
    ? `Congratulations ${name}! Your application to the ${programTitle} program has been accepted. Log in to view next steps.`
    : `Hi ${name}, thank you for applying to the ${programTitle} program. Unfortunately we are unable to accept your application at this time.`
  return sendSMS(phone, `${msg} - 4W'S Inua Jamii Foundation`)
}
