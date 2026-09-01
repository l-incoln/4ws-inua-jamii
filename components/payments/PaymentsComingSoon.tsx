import { Clock } from 'lucide-react'

interface Props {
  /** Headline shown to the user. */
  title?: string
  /** Supporting copy explaining the temporary state. */
  message?: string
  /** Extra classes for the outer card. */
  className?: string
}

/**
 * Temporary "Coming Soon" notice shown in place of any payment UI while online
 * payments are paused (site_settings.payments_enabled !== 'true'). The payment
 * architecture is left fully intact behind this — flipping the setting back on
 * restores the real forms without any code changes.
 */
export default function PaymentsComingSoon({
  title = 'Coming Soon',
  message = 'Our online payment system is being finalised and will be available very soon. Thank you for your interest — please check back shortly.',
  className = '',
}: Props) {
  return (
    <div className={`card p-8 max-w-2xl mx-auto text-center ${className}`}>
      <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-primary-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-3 leading-relaxed text-sm">{message}</p>
    </div>
  )
}
