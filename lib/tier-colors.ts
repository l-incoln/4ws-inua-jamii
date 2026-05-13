/**
 * Membership tier color palette used across the member portal.
 * Maps tier slug → Tailwind color tokens.
 */

export type MemberTier = 'basic' | 'active' | 'champion'

export interface TierStyle {
  /** Label shown in UI */
  label: string
  /** Tailwind bg class for solid background */
  bg: string
  /** Tailwind text class */
  text: string
  /** Tailwind border class */
  border: string
  /** Lighter background for badges/pills */
  lightBg: string
  /** Gradient for card backgrounds */
  gradient: string
}

export const TIER_STYLES: Record<MemberTier, TierStyle> = {
  basic: {
    label: 'Classic Member',
    bg: 'bg-slate-600',
    text: 'text-slate-700',
    border: 'border-slate-400',
    lightBg: 'bg-slate-100',
    gradient: 'from-slate-500 to-slate-700',
  },
  active: {
    label: 'Premium Member',
    bg: 'bg-sky-600',
    text: 'text-sky-700',
    border: 'border-sky-400',
    lightBg: 'bg-sky-50',
    gradient: 'from-sky-500 to-blue-700',
  },
  champion: {
    label: 'Gold Member',
    bg: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-400',
    lightBg: 'bg-amber-50',
    gradient: 'from-amber-400 to-amber-600',
  },
}

/** Returns tier styles, defaulting to basic if tier is unknown. */
export function getTierStyle(tier?: string | null): TierStyle {
  return TIER_STYLES[(tier as MemberTier) ?? 'basic'] ?? TIER_STYLES.basic
}
