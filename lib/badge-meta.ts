export const BADGE_META: Record<string, { label: string; description: string; emoji: string; color: string }> = {
  founding_member: {
    label: 'Founding Member',
    description: 'Among the first members of the foundation',
    emoji: '🌱',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  active_member: {
    label: 'Active Member',
    description: 'Consistently engaged with foundation activities',
    emoji: '⚡',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  event_hero: {
    label: 'Event Hero',
    description: 'Attended 10+ foundation events',
    emoji: '🎯',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  volunteer: {
    label: 'Volunteer',
    description: 'Completed volunteer tasks for the community',
    emoji: '🙌',
    color: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  leader: {
    label: 'Leader',
    description: 'Demonstrated leadership within the foundation',
    emoji: '🏆',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  champion_donor: {
    label: 'Champion Donor',
    description: 'Made significant contributions to the foundation',
    emoji: '💎',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  top_contributor: {
    label: 'Top Contributor',
    description: 'One of the highest impact contributors',
    emoji: '🌟',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
}
