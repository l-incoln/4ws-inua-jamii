'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitEventRegistration } from '@/app/actions/admin'
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

type FormField = {
  id: string
  field_name: string
  field_label: string
  field_type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date'
  field_options: string[] | null
  is_required: boolean
  sort_order: number
  section_title?: string
  section_sort_order?: number
}

export default function RegistrationForm({
  eventId,
  fields,
  rsvpMode,
  externalUrl,
  externalLabel,
  requiresLogin,
  isLoggedIn,
  prefillName,
  prefillEmail,
}: {
  eventId: string
  fields: FormField[]
  rsvpMode: string
  externalUrl: string | null
  externalLabel: string
  requiresLogin: boolean
  isLoggedIn: boolean
  prefillName?: string
  prefillEmail?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (requiresLogin && !isLoggedIn) {
      router.push(`/auth/login?redirect=/events/${eventId}/register`)
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.set('event_id', eventId)

    startTransition(async () => {
      const result = await submitEventRegistration(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(true)
        if (rsvpMode === 'hybrid' && externalUrl) {
          setRedirectUrl(externalUrl)
        }
      }
    })
  }

  // Success state
  if (success) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Registration Received!</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          We&apos;ve recorded your registration. A confirmation email has been sent to your inbox.
        </p>

        {redirectUrl && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              One more step — complete the external form
            </p>
            <p className="text-xs text-amber-700 mb-3">
              This event requires additional information. Please complete the external form to finalize your registration.
            </p>
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm inline-flex"
            >
              {externalLabel}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {!redirectUrl && (
          <a href={`/events/${eventId}`} className="btn-secondary text-sm inline-flex mt-4">
            Back to Event
          </a>
        )}
      </div>
    )
  }

  // Login required state
  if (requiresLogin && !isLoggedIn) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Login Required</h3>
        <p className="text-slate-500 text-sm">
          Please sign in to register for this event.
        </p>
        <a
          href={`/auth/login?redirect=/events/${eventId}/register`}
          className="btn-primary text-sm inline-flex"
        >
          Sign In to Register
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-5">
      {/* Basic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="full_name">Full Name <span className="text-red-500">*</span></label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={prefillName || ''}
            className="input mt-1"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">Email <span className="text-red-500">*</span></label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={prefillEmail || ''}
            className="input mt-1"
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="input mt-1"
          placeholder="+254 7XX XXX XXX"
        />
      </div>

      {/* Custom fields grouped by section */}
      {(() => {
        if (fields.length === 0) return null
        // Group fields by section_title, preserving order
        const sectionNames: string[] = []
        fields.forEach((f) => {
          const s = f.section_title || 'Additional Information'
          if (!sectionNames.includes(s)) sectionNames.push(s)
        })
        return sectionNames.map((sectionName) => {
          const sectionFields = fields.filter(
            (f) => (f.section_title || 'Additional Information') === sectionName
          )
          return (
            <div key={sectionName} className="space-y-4">
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                  {sectionName}
                </h4>
                <div className="space-y-4">
                  {sectionFields.map((field) => (
                    <div key={field.id}>
                      <label className="label" htmlFor={field.field_name}>
                        {field.field_label}
                        {field.is_required && <span className="text-red-500"> *</span>}
                      </label>
                      {field.field_type === 'textarea' ? (
                        <textarea
                          id={field.field_name}
                          name={field.field_name}
                          required={field.is_required}
                          className="input mt-1 resize-none"
                          rows={3}
                        />
                      ) : field.field_type === 'select' && field.field_options ? (
                        <select
                          id={field.field_name}
                          name={field.field_name}
                          required={field.is_required}
                          className="input mt-1"
                          defaultValue=""
                        >
                          <option value="" disabled>Select an option...</option>
                          {field.field_options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.field_type === 'checkbox' ? (
                        <div className="mt-2">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              name={field.field_name}
                              value="yes"
                              required={field.is_required}
                              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                            />
                            {field.field_label}
                          </label>
                        </div>
                      ) : (
                        <input
                          id={field.field_name}
                          name={field.field_name}
                          type={field.field_type === 'phone' ? 'tel' : field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          required={field.is_required}
                          className="input mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })
      })()}

      {/* Hybrid mode notice */}
      {rsvpMode === 'hybrid' && externalUrl && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          After submitting this form, you&apos;ll be directed to complete an additional external registration form.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full text-base py-3.5 disabled:opacity-60"
      >
        {pending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Registering…</>
        ) : (
          'Complete Registration'
        )}
      </button>
    </form>
  )
}
