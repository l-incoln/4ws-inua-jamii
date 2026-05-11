'use client'

import React, { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, Star, Award, ExternalLink, Clock, CheckCircle, CheckCircle2,
  ImageDown, Printer, Copy, Check, Maximize2, X, Share2, QrCode,
  CreditCard, History, Info, Settings, AlertCircle, RefreshCw,
  ChevronRight, User, Calendar, Hash, BadgeCheck, Lock, RotateCcw,
  Trophy, Globe, Zap,
} from 'lucide-react'
import { formatMembershipId, isExpired } from '@/lib/membership'

interface HistoryItem {
  id: string
  tier: string
  valid_from: string
  valid_until: string
  is_active: boolean
}

interface Props {
  profile: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
    avatar_url: string | null
    bio: string | null
    location: string | null
    tier: string
    membership_status: string
    role: string
    created_at: string
  }
  activeTerm: {
    id: string
    tier: string
    valid_from: string
    valid_until: string
    is_active: boolean
  } | null
  verifyUrl: string | null
  history: HistoryItem[]
  eventsCount: number
  badgesCount: number
}

const TIER_CONFIG: Record<string, {
  label: string
  shortLabel: string
  icon: React.ElementType
  cardBg: string
  chipBg: string
  accent: string
  badge: string
  shimmer: string
  benefits: string[]
}> = {
  basic: {
    label: 'Classic Member',
    shortLabel: 'CLASSIC',
    icon: Shield,
    cardBg: 'from-[#0d1f35] via-[#1a3a5c] to-[#2c5f8a]',
    chipBg: 'from-amber-300 to-amber-500',
    accent: 'text-cyan-300',
    badge: 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30',
    shimmer: 'from-cyan-400/10 via-white/20 to-sky-300/10',
    benefits: [
      'Access to all community programs',
      'Event attendance & RSVPs',
      'Member newsletter & updates',
      'Community feed & networking',
    ],
  },
  active: {
    label: 'Premium Member',
    shortLabel: 'PREMIUM',
    icon: Star,
    cardBg: 'from-[#041a0f] via-[#0a4028] to-[#0f6b42]',
    chipBg: 'from-amber-300 to-amber-500',
    accent: 'text-emerald-300',
    badge: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
    shimmer: 'from-emerald-400/10 via-white/20 to-green-300/10',
    benefits: [
      'All Classic benefits',
      'Priority event registration',
      'Exclusive programs & workshops',
      'Dedicated member support',
      'Digital membership certificate',
    ],
  },
  champion: {
    label: 'Gold Member',
    shortLabel: 'GOLD',
    icon: Award,
    cardBg: 'from-[#1a0a00] via-[#5c2800] to-[#b45309]',
    chipBg: 'from-yellow-200 to-yellow-400',
    accent: 'text-amber-300',
    badge: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
    shimmer: 'from-amber-400/10 via-yellow-100/20 to-amber-300/10',
    benefits: [
      'All Premium benefits',
      'VIP event access',
      'Recognition in foundation publications',
      'Advisory committee eligibility',
      'Annual appreciation gift',
      'Dedicated relationship manager',
    ],
  },
}

const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  volunteer: 'Volunteer',
  admin: 'Administrator',
}

const TIER_LABELS: Record<string, string> = {
  basic: 'Classic',
  active: 'Premium',
  champion: 'Gold',
}

type Tab = 'card' | 'qr' | 'details' | 'history'

export default function MembershipCardClient({ profile, activeTerm, verifyUrl, history, eventsCount, badgesCount }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [qrSmall, setQrSmall] = useState<string | null>(null)
  const [qrLarge, setQrLarge] = useState<string | null>(null)
  const [qrBack, setQrBack] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [qrModal, setQrModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('card')
  const [flipped, setFlipped] = useState(false)

  const tier = activeTerm?.tier ?? profile.tier
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.basic
  const TierIcon = config.icon

  const expired = activeTerm ? isExpired(activeTerm.valid_until) : false
  const isActive = !!activeTerm && activeTerm.is_active && !expired
  const isApproved = profile.membership_status === 'approved'

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric',
  })
  const yearsActive = Math.max(1, Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) / 31_536_000_000
  ))
  const memberId = activeTerm
    ? formatMembershipId(activeTerm.id)
    : `4WS-${profile.id.slice(0, 8).toUpperCase()}`

  const validFrom = activeTerm
    ? new Date(activeTerm.valid_from).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const validUntil = activeTerm
    ? new Date(activeTerm.valid_until).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  useEffect(() => {
    if (!verifyUrl || expired) return
    QRCode.toDataURL(verifyUrl, {
      width: 180, margin: 0,
      color: { dark: '#ffffff', light: '#00000000' },
      errorCorrectionLevel: 'H',
    }).then(setQrSmall).catch(console.error)
    QRCode.toDataURL(verifyUrl, {
      width: 420, margin: 2,
      color: { dark: '#1E3A8A', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrLarge).catch(console.error)
    QRCode.toDataURL(verifyUrl, {
      width: 240, margin: 1,
      color: { dark: '#1E3A8A', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    }).then(setQrBack).catch(console.error)
  }, [verifyUrl, expired])

  async function downloadPng() {
    if (!cardRef.current) return
    const wasFlipped = flipped
    if (wasFlipped) setFlipped(false)
    setDownloading(true)
    await new Promise((r) => setTimeout(r, 350))
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 })
      const a = document.createElement('a')
      a.download = `${memberId}-membership-card.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.error('Download failed:', e)
    } finally {
      setDownloading(false)
      if (wasFlipped) setFlipped(true)
    }
  }

  async function copyLink() {
    if (!verifyUrl) return
    await navigator.clipboard.writeText(verifyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'card',    label: 'Card',    icon: CreditCard },
    { id: 'qr',     label: 'QR Code', icon: QrCode },
    { id: 'details', label: 'Details', icon: Info },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
            Membership Card
          </h1>
          <p className="text-slate-500 text-sm mt-1">Your official digital membership identity</p>
        </div>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary-600 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Card Settings
        </Link>
      </div>

      {/* Status banners */}
      {!isApproved && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Membership pending approval</p>
            <p className="text-amber-700 mt-0.5 text-xs">
              Status: <strong className="capitalize">{profile.membership_status}</strong>. An admin must approve and issue your membership to activate the card and QR system.
            </p>
          </div>
        </div>
      )}
      {isApproved && activeTerm && expired && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Membership expired</p>
            <p className="text-xs mt-0.5 text-red-600">Expired on <strong>{validUntil}</strong>. Contact the foundation to renew.</p>
          </div>
        </div>
      )}
      {isActive && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-sm">
          <BadgeCheck className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold">Active &amp; verified membership</p>
            <p className="text-xs mt-0.5 text-emerald-700">Valid until <strong>{validUntil}</strong>. QR verification is live.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
              activeTab === id ? 'text-primary-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeTab === id && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-white rounded-xl shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── CARD TAB ── */}
        {activeTab === 'card' && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            {/* Card flip container */}
            <div className="flex justify-center">
              <div className="w-full max-w-[440px] relative" style={{ aspectRatio: '1.586', perspective: '1200px' }}>

                {/* ── FRONT FACE ── */}
                <motion.div
                  ref={cardRef}
                  className={`w-full rounded-[22px] bg-gradient-to-br ${config.cardBg} overflow-hidden select-none`}
                  style={{ aspectRatio: '1.586', boxShadow: '0 32px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)' }}
                  animate={{ opacity: flipped ? 0 : 1, rotateY: flipped ? -90 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeIn' }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.shimmer} opacity-60`} />
                  <div className="absolute -inset-4 opacity-[0.12]" style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)', transform: 'rotate(15deg) scaleY(3)' }} />
                  <div className="absolute bottom-0 left-0 w-40 h-40 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
                  <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/10" />

                  <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6">
                    {/* Row 1: org identity + tier badge + profile photo stacked right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                            <TierIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-white font-bold text-[12px] sm:text-[13px] tracking-wider truncate">4W&apos;S INUA JAMII</span>
                        </div>
                        <p className="text-white/45 text-[9px] tracking-[0.2em] uppercase mt-0.5 ml-9">Foundation · Kenya</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${config.badge} tracking-[0.15em] uppercase`}>
                          {config.shortLabel}
                        </span>
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" crossOrigin="anonymous" className="w-11 h-11 rounded-full object-cover border-2 border-white/30 shadow-md" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-white/50" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: EMV chip */}
                    <div>
                      <div className={`w-9 h-7 rounded-[5px] bg-gradient-to-br ${config.chipBg} opacity-90 relative overflow-hidden`}>
                        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: '6px 5px' }} />
                        <div className="absolute inset-y-0 left-[30%] right-[30%] bg-black/10 rounded-sm" />
                      </div>
                    </div>

                    {/* Row 3: Member info + QR */}
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[9px] font-semibold tracking-[0.18em] uppercase ${config.accent} mb-0.5`}>{config.label}</p>
                        <p className="text-white font-bold text-[19px] sm:text-[22px] leading-tight tracking-tight truncate">
                          {profile.full_name ?? 'Unnamed Member'}
                        </p>
                        <p className="text-white/55 text-[10px] mt-0.5 tracking-wide">{ROLE_LABELS[profile.role] ?? 'Member'}</p>
                        <div className="mt-2 flex gap-5">
                          <div>
                            <p className={`text-[8px] uppercase tracking-[0.15em] ${config.accent} mb-0.5`}>{activeTerm ? 'Valid From' : 'Member Since'}</p>
                            <p className="text-white text-[10px] font-semibold">{activeTerm ? validFrom : memberSince}</p>
                          </div>
                          {activeTerm && (
                            <div>
                              <p className={`text-[8px] uppercase tracking-[0.15em] ${config.accent} mb-0.5`}>Expires</p>
                              <p className={`text-[10px] font-semibold ${expired ? 'text-red-300' : 'text-white'}`}>{validUntil}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* QR corner */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        {qrSmall && isActive ? (
                          <button onClick={() => setQrModal(true)} className="group relative w-[64px] h-[64px] rounded-xl overflow-hidden bg-white/10 p-1.5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all hover:scale-105 cursor-zoom-in" title="Click to enlarge">
                            <img src={qrSmall} alt="QR Code" className="w-full h-full" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-[64px] h-[64px] rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-white/25" />
                          </div>
                        )}
                        {qrSmall && isActive && <p className="text-white/35 text-[7px] tracking-[0.15em] uppercase">Scan to verify</p>}
                      </div>
                    </div>

                    {/* Row 4: Member ID + status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[8px] uppercase tracking-[0.15em] ${config.accent} mb-0.5`}>Member ID</p>
                        <p className="text-white font-mono text-[13px] font-bold tracking-[0.18em]">{memberId}</p>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1 bg-emerald-400/20 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
                        </span>
                      )}
                      {activeTerm && expired && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-400/20 text-red-300 border border-red-400/30 font-bold tracking-wider">EXPIRED</span>
                      )}
                      {!activeTerm && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10 font-bold tracking-wider">PENDING</span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ── BACK FACE ── */}
                <motion.div
                  className={`absolute inset-0 rounded-[22px] bg-gradient-to-br ${config.cardBg} overflow-hidden select-none`}
                  style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)' }}
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: flipped ? 1 : 0, rotateY: flipped ? 0 : 90 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: flipped ? 0.3 : 0 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.shimmer} opacity-60`} />
                  <div className="absolute -inset-4 opacity-[0.12]" style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.9) 50%, transparent 70%)', transform: 'rotate(15deg) scaleY(3)' }} />
                  <div className="absolute bottom-0 left-0 w-40 h-40 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
                  <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full border border-white/10" />

                  <div className="relative z-10 h-full flex flex-col items-center justify-between p-5 sm:p-6">
                    <div className="text-center">
                      <p className="text-white/80 font-bold text-[11px] tracking-[0.18em] uppercase">4W&apos;S Inua Jamii Foundation</p>
                      <p className="text-white/40 text-[9px] tracking-[0.12em] mt-0.5">Kenya · Member Verification</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {qrBack && isActive ? (
                        <>
                          <div className="bg-white/95 rounded-2xl p-2.5 shadow-lg">
                            <img src={qrBack} alt="Verification QR" className="w-28 h-28 rounded-lg" />
                          </div>
                          <p className="text-white/60 text-[9px] tracking-[0.18em] uppercase">Scan to Verify Membership</p>
                        </>
                      ) : (
                        <>
                          <div className="w-28 h-28 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center">
                            <QrCode className="w-10 h-10 text-white/25" />
                          </div>
                          <p className="text-white/40 text-[9px] uppercase tracking-wider">
                            {!isApproved ? 'Pending Approval' : expired ? 'Membership Expired' : 'No Active Term'}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="text-center space-y-1 w-full">
                      <p className={`font-mono text-[11px] font-bold tracking-[0.18em] ${config.accent}`}>{memberId}</p>
                      {verifyUrl && (
                        <p className="text-white/30 text-[8px] truncate px-2">
                          {verifyUrl.length > 52 ? verifyUrl.slice(0, 52) + '…' : verifyUrl}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <p className="text-white/25 text-[8px]">www.4wsinuajamii.org</p>
                        <span className="text-white/15 text-[8px]">·</span>
                        <p className="text-white/25 text-[8px]">© 4W&apos;S Inua Jamii Foundation</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center">
              <button
                onClick={() => setFlipped((f) => !f)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-primary-600 transition-colors px-4 py-2 rounded-full border border-slate-200 hover:border-primary-200 hover:bg-primary-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {flipped ? 'Show Front' : 'Flip to Back'}
              </button>
            </div>

            {/* Action grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: downloading ? 'Saving…' : 'Download', icon: downloading ? RefreshCw : ImageDown, onClick: downloadPng, disabled: downloading, hoverCls: 'hover:border-primary-200 hover:bg-primary-50', iconCls: 'group-hover:text-primary-600', labelCls: 'group-hover:text-primary-700' },
                { label: copied ? 'Copied!' : 'Share', icon: copied ? Check : Share2, onClick: copyLink, disabled: !verifyUrl, hoverCls: 'hover:border-green-200 hover:bg-green-50', iconCls: `group-hover:text-green-600 ${copied ? 'text-green-500' : ''}`, labelCls: 'group-hover:text-green-700' },
                { label: 'View QR', icon: QrCode, onClick: () => setActiveTab('qr'), disabled: !qrLarge, hoverCls: 'hover:border-sky-200 hover:bg-sky-50', iconCls: 'group-hover:text-sky-600', labelCls: 'group-hover:text-sky-700' },
                { label: 'Print', icon: Printer, onClick: () => window.print(), disabled: false, hoverCls: 'hover:border-amber-200 hover:bg-amber-50', iconCls: 'group-hover:text-amber-600', labelCls: 'group-hover:text-amber-700' },
              ].map(({ label, icon: Icon, onClick, disabled, hoverCls, iconCls, labelCls }) => (
                <button
                  key={label}
                  onClick={onClick}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 transition-all group shadow-sm disabled:opacity-40 ${hoverCls}`}
                >
                  <Icon className={`w-5 h-5 text-slate-500 transition-colors ${iconCls} ${label === 'Saving…' ? 'animate-spin' : ''}`} />
                  <span className={`text-xs font-semibold text-slate-600 transition-colors ${labelCls} hidden sm:block`}>{label}</span>
                </button>
              ))}
            </div>

            {/* Tier benefits */}
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <TierIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{config.label} Benefits</h3>
                  <p className="text-xs text-slate-500">Your membership perks</p>
                </div>
              </div>
              <ul className="space-y-2">
                {config.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              {tier !== 'champion' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Upgrade to <strong>{tier === 'basic' ? 'Premium' : 'Gold'}</strong> for more exclusive benefits. Contact the foundation office.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── QR CODE TAB ── */}
        {activeTab === 'qr' && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-5"
          >
            {qrLarge && isActive ? (
              <>
                <div className="flex justify-center">
                  <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 inline-flex flex-col items-center gap-4">
                    <div className="text-center">
                      <h3 className="font-bold text-slate-900">Verification QR Code</h3>
                      <p className="text-xs text-slate-500 mt-1">Scan to verify this membership is authentic</p>
                    </div>
                    <div className="relative">
                      <img src={qrLarge} alt="Membership verification QR" className="w-64 h-64 rounded-xl" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center border border-gray-100">
                          <TierIcon className="w-5 h-5 text-primary-600" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Member ID</p>
                      <p className="font-mono font-bold text-slate-900 text-lg tracking-widest">{memberId}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" /> Valid until {validUntil}
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lock className="w-3 h-3" /> Signed Verification URL
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 truncate font-mono">
                      {verifyUrl}
                    </code>
                    <button
                      onClick={copyLink}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Cryptographically signed with HMAC-SHA256. Any tampering will fail verification automatically.
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <a
                    href={verifyUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Verification Page
                  </a>
                  <Link
                    href={`/members/${profile.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <Globe className="w-4 h-4" /> Public Profile
                  </Link>
                  <button
                    onClick={() => setQrModal(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Maximize2 className="w-4 h-4" /> Fullscreen QR
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700">QR Code Unavailable</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    {!isApproved
                      ? 'Membership must be approved before a QR code is issued.'
                      : expired
                      ? 'This membership has expired. Renew to re-activate the QR code.'
                      : 'No active membership term found. Contact the foundation.'}
                  </p>
                </div>
                <Link href="/contact" className="btn-primary text-sm">Contact Foundation</Link>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DETAILS TAB ── */}
        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Impact stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Events Attended', value: eventsCount, icon: Zap,      color: 'text-primary-600', bg: 'bg-primary-50' },
                { label: 'Years Active',    value: yearsActive, icon: Calendar,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Achievements',   value: badgesCount, icon: Trophy,    color: 'text-amber-600',   bg: 'bg-amber-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="card p-4 text-center">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary-500" /> Member Profile
              </h3>
              <div className="space-y-0">
                {[
                  { label: 'Full Name',    value: profile.full_name ?? '—' },
                  { label: 'Email',        value: profile.email },
                  { label: 'Phone',        value: profile.phone ?? '—' },
                  { label: 'Role',         value: ROLE_LABELS[profile.role] ?? 'Member' },
                  { label: 'Member Since', value: memberSince },
                  ...(profile.location ? [{ label: 'Location', value: profile.location }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 font-medium w-28 flex-shrink-0">{label}</span>
                    <span className="text-sm text-slate-800 font-medium text-right truncate max-w-[220px]">{value}</span>
                  </div>
                ))}
              </div>
              {profile.bio && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <p className="text-xs text-slate-400 font-medium mb-1">Bio</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-primary-500" /> Card Details
              </h3>
              <div className="space-y-0">
                {[
                  { label: 'Member ID',   value: memberId },
                  { label: 'Tier',        value: config.label },
                  { label: 'Status',      value: profile.membership_status.charAt(0).toUpperCase() + profile.membership_status.slice(1) },
                  ...(activeTerm ? [
                    { label: 'Valid From',  value: validFrom! },
                    { label: 'Expires',     value: validUntil! },
                  ] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-400 font-medium w-28 flex-shrink-0">{label}</span>
                    <span className="text-sm text-slate-800 font-semibold font-mono text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4 text-primary-500" /> Verification Status
              </h3>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">QR Code</span>
                  {isActive ? (
                    <span className="badge-green text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                    </span>
                  ) : (
                    <span className="badge badge-gray text-xs">Inactive</span>
                  )}
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                  <span className="text-xs text-slate-400 font-medium">Signature</span>
                  <span className="badge badge-sky text-xs">HMAC-SHA256</span>
                </div>
                {verifyUrl && (
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full py-2.5 text-sm text-primary-600 hover:text-primary-800 transition-colors font-semibold border-b border-slate-50"
                  >
                    Open public verification page
                    <ChevronRight className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/members/${profile.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full py-2.5 text-sm text-primary-600 hover:text-primary-800 transition-colors font-semibold"
                >
                  View your public profile
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {history.length > 0 ? (
              <div className="card p-5 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <History className="w-4 h-4 text-primary-500" /> Membership History
                </h3>
                <div className="space-y-1">
                  {history.map((term) => {
                    const exp = isExpired(term.valid_until)
                    const tc = TIER_CONFIG[term.tier] ?? TIER_CONFIG.basic
                    const TI = tc.icon
                    return (
                      <div key={term.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tc.cardBg} flex items-center justify-center flex-shrink-0`}>
                          <TI className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {TIER_LABELS[term.tier] ?? term.tier} Member
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(term.valid_from).toLocaleDateString('en-KE')} &rarr;{' '}
                            {new Date(term.valid_until).toLocaleDateString('en-KE')}
                          </p>
                        </div>
                        {term.is_active && !exp ? (
                          <span className="badge-green text-xs flex items-center gap-1 flex-shrink-0">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : exp ? (
                          <span className="badge badge-red text-xs flex-shrink-0">Expired</span>
                        ) : (
                          <span className="badge badge-gray text-xs flex-shrink-0">Superseded</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <History className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No membership history yet</p>
                <p className="text-sm text-slate-500 text-center">Membership terms will appear here once issued by an admin.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Fullscreen Modal */}
      <AnimatePresence>
        {qrModal && qrLarge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-900">Scan to Verify</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Present to a foundation official</p>
                </div>
                <button
                  onClick={() => setQrModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="relative flex justify-center mb-5">
                <img src={qrLarge} alt="Verification QR" className="w-full max-w-[280px] rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center border border-gray-100">
                    <TierIcon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1 mb-5">
                <p className="font-mono font-bold text-slate-900 text-xl tracking-widest">{memberId}</p>
                <p className="text-xs text-slate-500">{profile.full_name} · {config.label}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={verifyUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Open
                </a>
              </div>
              <Link
                href={`/members/${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors"
              >
                <Globe className="w-4 h-4" /> View Public Profile
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

