// ─── USER / AUTH ──────────────────────────────────────────────────────────────
export type UserRole = 'public' | 'member' | 'admin'

export type MembershipTier = 'basic' | 'active' | 'champion' | 'pioneer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  role: UserRole
  membership_tier: MembershipTier
  bio?: string
  location?: string
  joined_at: string
  is_verified: boolean
}

// ─── MEMBERSHIP APPLICATION ────────────────────────────────────────────────────
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface MemberApplication {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  occupation: string
  motivation: string
  expected_contribution: string
  status: ApplicationStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  user?: UserProfile
}

// ─── PROGRAMS ─────────────────────────────────────────────────────────────────
export interface Program {
  id: string
  slug: string
  title: string
  description: string
  full_description?: string
  icon?: string
  image_url?: string
  impact_stats?: Record<string, string | number>
  gallery?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface Event {
  id: string
  title: string
  description: string
  full_description?: string
  location: string
  event_date: string
  end_date?: string
  image_url?: string
  gallery?: string[]
  max_attendees?: number
  status: EventStatus
  program_id?: string
  created_by: string
  created_at: string
  updated_at: string
  rsvp_count?: number
  program?: Program
}

// ─── RSVPs ────────────────────────────────────────────────────────────────────
export type RSVPStatus = 'confirmed' | 'waitlisted' | 'cancelled'

export interface RSVP {
  id: string
  event_id: string
  user_id: string
  status: RSVPStatus
  created_at: string
  event?: Event
  user?: UserProfile
}

// ─── BLOG / CONTENT ───────────────────────────────────────────────────────────
export type PostCategory = 'impact' | 'stories' | 'updates' | 'announcements'
export type PostStatus = 'draft' | 'published' | 'archived'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image?: string
  category: PostCategory
  status: PostStatus
  author_id: string
  published_at?: string
  created_at: string
  updated_at: string
  author?: UserProfile
  tags?: string[]
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  author_id: string
  created_at: string
  author?: UserProfile
}

// ─── DONATIONS ────────────────────────────────────────────────────────────────
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'mpesa' | 'card' | 'bank_transfer' | 'cash'

export interface DonationCampaign {
  id: string
  title: string
  description: string
  goal_amount: number
  current_amount: number
  image_url?: string
  is_active: boolean
  end_date?: string
  created_at: string
}

export interface Donation {
  id: string
  campaign_id?: string
  donor_id?: string
  donor_name?: string
  donor_email?: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  transaction_ref?: string
  status: DonationStatus
  message?: string
  is_anonymous: boolean
  created_at: string
  campaign?: DonationCampaign
}

// ─── IMPACT METRICS ───────────────────────────────────────────────────────────
export interface ImpactMetric {
  id: string
  metric_key: string
  metric_label: string
  metric_value: number
  unit?: string
  icon?: string
  updated_at: string
}

// ─── API RESPONSES ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
