import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/home/Hero'
import ImpactStats from '@/components/home/ImpactStats'
import ProgramsOverview from '@/components/home/ProgramsOverview'
import EventsPreview from '@/components/home/EventsPreview'
import CallToAction from '@/components/home/CallToAction'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '4W\'S Inua Jamii Foundation — Empowering Communities Across Kenya',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ImpactStats />
        <ProgramsOverview />
        <EventsPreview />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}

