'use client'

import dynamic from 'next/dynamic'

const MembershipCardClient = dynamic(() => import('./MembershipCardClient'), { ssr: false })

export default MembershipCardClient
