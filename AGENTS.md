# 4W'S Inua Jamii — Project Notes

## Email routing (four-role model)

All outbound email is routed through four canonical inboxes on `4wsinuajamii.org`.
The single source of truth is `lib/email-settings.ts` (`getEmailSettings` +
`senderFor(settings, role)`). Each role address is CMS-configurable in
Admin › Email & Notifications (`site_settings` keys `email_role_*`).

| Role | Default address | Sends | Receives | Reply-to |
|------|-----------------|-------|----------|----------|
| `no-reply` | `no-reply@4wsinuajamii.org` | Receipts, confirmations, verification, resets, automated alerts | — (nothing) | none |
| `info` | `info@4wsinuajamii.org` | Public/general responses (newsletter welcome) | General enquiries, partnerships, media | `info@` |
| `membership` | `membership@4wsinuajamii.org` | Member support, reminders, membership comms (status, renewal, birthday greetings, expiry/event reminders) | Membership questions, birthday reminders | `membership@` |
| `admin` | `admin@4wsinuajamii.org` | Administrative responses | Payments, approvals, system alerts | `admin@` |

### How to send email with the correct role

```ts
import { getEmailSettings, senderFor } from '@/lib/email-settings'

const settings = await getEmailSettings(supabase)
const membership = senderFor(settings, 'membership') // { address, from, replyTo }
await sendEmail({ to, from: membership.from, replyTo: membership.replyTo, subject, html })
```

- Member-facing membership/event/birthday emails → `membership` role.
- Receipts (donation/membership payment) and confirmations (application received,
  comment approved) → `no-reply` role (no reply-to).
- Public communication (newsletter) → `info` role.
- Admin alerts (payments, approvals, system alerts) → sent FROM `no-reply` TO
  `settings.adminEmails` (the `admin` role recipients, comma-separated). Reply-to
  is the triggering member/submitter where an admin response is expected.
- Contact-form enquiries → sent FROM `no-reply` TO `settings.roles.info.address`,
  reply-to the submitter.

### Legacy compatibility

`from_email` (legacy single sender) still overrides the `no-reply` role address,
and `admin_notify_email` still overrides the `admin` recipient list, so existing
deployments keep working until an admin sets the role keys. `fromHeader` on
`EmailSettings` is kept as a deprecated alias of `senderFor(settings, 'no-reply').from`.

### Migration

`supabase/phase12-email-roles.sql` seeds the four role defaults and normalises
the legacy hyphenated `contact_email` (`info@4ws-inuajamii.org`) to the canonical
`info@4wsinuajamii.org`. `privacy@` and `finance@` were folded into `info@` and
`admin@` respectively.

## Achievement System

Four connected elements, all driven by `lib/achievements.ts`:

- **Points** — activity-weighted total from the `member_impact_scores` DB view
  (events × 10, tasks × 15, comments × 2, donations × 20). Pure activity count.
- **Impact Score** — distinct from points: `points + floor(donation_amount_total / 1000) + badges_earned × 10`.
  Reflects the *level* of giving (a KES 50k donor outscores five KES 100 donors)
  and the *breadth* of contribution (each badge adds 10).
- **Rank** — 5 tiers based on Impact Score: Starter (0), Bronze (100), Silver
  (250), Gold (500), Platinum (1000). `computeRank()` returns current tier,
  next tier, progress fraction, and points-to-next.
- **Badges** — auto-unlocked by `syncMemberBadges()` (called on every dashboard
  / achievements page load). NOT all point-based:
  - `founding_member` — join date ≤ `founding_member_cutoff` setting
  - `leader` — `role = 'admin'` (verified leadership)
  - `champion_donor` — total donation amount ≥ `champion_donor_threshold` (KES)
  - `active_member` — points ≥ `active_member_threshold`
  - `event_hero` — events attended ≥ `event_hero_threshold`
  - `volunteer` — ≥ 1 completed volunteer task
  - `top_contributor` — impact score ≥ `top_contributor_threshold`

All thresholds are CMS-editable in Admin › Membership › Achievement Thresholds.
Admins can still manually award/revoke badges via `app/actions/achievements.ts`
(`awardBadge` / `revokeBadge`); `syncMemberBadges` only adds, never removes.

### Migration

`supabase/phase13-achievements.sql` extends the `member_impact_scores` view with
`donation_amount_total` and seeds the five threshold settings.
