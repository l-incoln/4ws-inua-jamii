// â”€â”€â”€ USER / AUTH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type UserRole = 'member' | 'volunteer' | 'admin'
export type MembershipTier = 'basic' | 'active' | 'champion'
export type MembershipStatus = 'pending' | 'approved' | 'rejected'

/** Map DB tier values to display labels (Classic / Premium / Gold) */
export const TIER_LABELS: Record<MembershipTier, string> = {
  basic: 'Classic',
  active: 'Premium',
  champion: 'Gold',
}

/** Tailwind badge classes per tier */
export const TIER_COLORS: Record<MembershipTier, string> = {
  basic: 'badge-gray',
  active: 'badge-green',
  champion: 'bg-yellow-100 text-yellow-800 badge',
}

export interface Profile {
  id: string               // auth.users FK
  full_name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  role: UserRole
  tier: MembershipTier
  membership_status: MembershipStatus
  created_at: string
  updated_at: string
}

// â”€â”€â”€ PROGRAMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Program {
  id: string
  slug: string
  title: string
  description: string | null
  icon: string | null
  image_url: string | null
  beneficiaries: number
  is_active: boolean
  created_at: string
}

// â”€â”€â”€ EVENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export interface Event {
  id: string
  title: string
  description: string | null
  location: string
  event_date: string
  end_date: string | null
  image_url: string | null
  max_attendees: number | null
  status: EventStatus
  program_id: string | null
  created_by: string
  created_at: string
}

// â”€â”€â”€ RSVPs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface RSVP {
  id: string
  event_id: string
  user_id: string
  created_at: string
}

// â”€â”€â”€ BLOG / CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type BlogStatus = 'draft' | 'published' | 'scheduled'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string | null          // NOT "content" â€” the column is "body"
  image_url: string | null
  category: string | null
  tags: string[] | null
  status: BlogStatus
  author_id: string
  read_time: string | null
  views: number
  published_at: string | null
  created_at: string
}

// â”€â”€â”€ ANNOUNCEMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Announcement {
  id: string
  title: string
  body: string
  is_pinned: boolean
  expires_at: string | null
  author_id: string
  created_at: string
}

// â”€â”€â”€ DONATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface DonationCampaign {
  id: string
  title: string
  description: string | null
  goal: number               // column is "goal", not "goal_amount"
  raised: number
  image_url: string | null
  is_active: boolean
  end_date: string | null
  created_at: string
}

export interface Donation {
  id: string
  campaign_id: string | null
  donor_name: string | null
  donor_email: string | null
  amount: number
  currency: string
  payment_method: string | null
  transaction_ref: string | null
  status: DonationStatus
  message: string | null
  is_anonymous: boolean
  created_at: string
}

// â”€â”€â”€ IMPACT METRICS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ImpactMetric {
  id: string
  label: string
  value: number
  unit: string | null
  icon: string | null
  sort_order: number
}

// â”€â”€â”€ CONTACT MESSAGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}

// â”€â”€â”€ SITE SETTINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

// â”€â”€â”€ API HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// ─── DOCUMENTS ─────────────────────────────────────────────────────────────────
export type DocumentCategory = 'constitution' | 'report' | 'policy' | 'guide' | 'general'

export interface Document {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string | null
  file_size: number | null
  category: DocumentCategory
  version: string | null
  is_public: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

// ─── BLOG COMMENTS ─────────────────────────────────────────────────────────────
export interface BlogComment {
  id: string
  post_id: string
  author_id: string | null
  author_name: string | null
  body: string
  is_approved: boolean
  parent_id: string | null
  created_at: string
  profiles?: { full_name: string; avatar_url: string | null } | null
}

// ─── PROGRAM APPLICATIONS ──────────────────────────────────────────────────────
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface ProgramApplication {
  id: string
  program_id: string
  user_id: string
  motivation: string
  availability: string | null
  status: ApplicationStatus
  admin_note: string | null
  created_at: string
  updated_at: string
  programs?: { title: string; slug: string } | null
  profiles?: { full_name: string; email: string | null } | null
}

// ─── VOLUNTEER TASKS ───────────────────────────────────────────────────────────
export type TaskStatus = 'open' | 'claimed' | 'completed' | 'cancelled'

export interface VolunteerTask {
  id: string
  title: string
  description: string | null
  skills_required: string[] | null
  deadline: string | null
  status: TaskStatus
  claimed_by: string | null
  claimed_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  claimer?: { full_name: string } | null
}

// ─── MEMBERSHIP IDENTITY ──────────────────────────────────────────────────────
export interface MembershipTerm {
  id: string
  user_id: string
  tier: MembershipTier
  issued_at: string
  valid_from: string
  valid_until: string
  is_active: boolean
  issued_by: string | null
  notes: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>
  membership_tokens?: MembershipToken[]
}

export interface MembershipToken {
  id: string
  term_id: string
  user_id: string
  token: string
  created_at: string
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
export type BadgeType =
  | 'founding_member'
  | 'active_member'
  | 'event_hero'
  | 'volunteer'
  | 'leader'
  | 'champion_donor'
  | 'top_contributor'

export interface MemberBadge {
  id: string
  user_id: string
  badge_type: BadgeType
  awarded_at: string
  awarded_by: string | null
  notes: string | null
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'membership_expiry'
  | 'event_invite'
  | 'announcement'
  | 'badge_awarded'
  | 'general'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  link: string | null
  created_at: string
}

// ─── IMPACT SCORE ─────────────────────────────────────────────────────────────
export interface ImpactScore {
  user_id: string
  full_name: string | null
  events_attended: number
  tasks_completed: number
  comments_made: number
  donations_made: number
  total_score: number
}
