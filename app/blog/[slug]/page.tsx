import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, User, ArrowLeft, Tag } from 'lucide-react'
import type { Metadata } from 'next'

const posts = [
  {
    slug: 'community-health-initiatives-transforming-nairobi',
    title: 'How Community Health Initiatives Are Transforming Nairobi',
    category: 'Health',
    author: 'Dr. Amina Hassan',
    authorTitle: 'Health Program Lead',
    authorImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80',
    date: '2026-04-10',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
    excerpt: 'Our Community Health Initiative has reached over 1,200 beneficiaries with free screenings, maternal care, and chronic disease management.',
    body: `Access to quality healthcare remains one of the biggest challenges in many Nairobi neighborhoods. The 4W'S Inua Jamii Foundation's Community Health Initiative is changing that narrative, one family at a time.

## What We Do

Since launching in 2023, our health program has been on the ground, running free medical camps, mobile clinics, and chronic disease management programs. In the past year alone, we have:

- Screened over 1,200 people for hypertension and diabetes
- Provided maternal and child healthcare to 350 mothers
- Distributed essential medicines to 500+ households
- Trained 45 Community Health Volunteers (CHVs)

## Impact in Numbers

Our CHVs are the backbone of this work. They visit homes, follow up on medication adherence, and ensure families don't fall through the cracks in the healthcare system. With just a motorbike and a CHV kit, our volunteers cover an average of 15 households per day.

## Looking Ahead

The April 25th Community Health Fair will be our biggest event yet. We are expecting over 500 participants and will offer free eye tests, dental checkups, blood pressure screening, and HIV testing alongside HIV counseling.

"Healthcare should not be a privilege," says Dr. Amina Hassan, our Health Program Lead. "Every person in our community deserves access to quality care, regardless of income."

Join us on April 25th at Nairobi Community Center. It's free, open to all, and could save your life.`,
    tags: ['Health', 'Community', 'Impact'],
  },
  {
    slug: 'youth-empowerment-stories-of-change',
    title: 'Youth Empowerment: Stories of Change',
    category: 'Community',
    author: 'James Otieno',
    authorTitle: 'Programs Director',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    date: '2026-04-08',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=80',
    excerpt: 'Three graduates of our Youth Economic Empowerment Program share their journeys from unemployment to thriving entrepreneurs.',
    body: `When Kevin Muthomi first came to the 4W'S Inua Jamii Foundation, he was 22 years old, had just dropped out of university due to lack of fees, and had no income. Today, at 24, he runs a profitable electronics repair business that employs two other young people.

Kevin is one of 400 young people who have gone through our Youth Economic Empowerment Program. Their stories are a testament to what is possible when young people are given not just skills, but mentorship, support, and opportunity.

## The Program

Our 12-week program combines:

- **Digital skills training** – from basic computer literacy to web development and graphic design
- **Financial literacy** – budgeting, saving, micro-investment, and credit management
- **Business development** – ideation, planning, and starting a micro-enterprise
- **Mentorship** – each participant is paired with a business mentor for 6 months
- **Seed funding** – top graduates receive startup grants of up to KES 30,000

## Three Stories

**Kevin Muthomi** – Electronics repair, Eastleigh. Employs 2 people. Monthly revenue: KES 45,000.

**Wanjiru Kamau** – Runs a tailoring business from Kibera. Has trained 3 neighborhood women. Monthly revenue: KES 28,000.

**Hassan Ali** – Mobile money agent and mobile phone accessories seller. Expanded to second location. Monthly revenue: KES 60,000.

## Your Support Matters

The next cohort begins in May 2026. We have 80 spots available and 200 applications already received. Your donation helps us fund more spots and larger grants.

[Donate now](/donate) or [learn more about the program](/programs/economic-empowerment).`,
    tags: ['Youth', 'Economic', 'Empowerment', 'Stories'],
  },
  {
    slug: 'education-fund-100-students',
    title: 'Education Fund: 100 Students Changed',
    category: 'Education',
    author: 'Sarah Njoki',
    authorTitle: 'Education Program Manager',
    authorImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80',
    date: '2026-04-06',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
    excerpt: 'This year\'s Education Support Program has helped 100 students stay in school through scholarships, supplies, and mentorship.',
    body: `Education is the foundation of everything we do. This year, the 4W'S Inua Jamii Foundation's Education Support Program reached a historic milestone — 100 students supported through full scholarships, supplies, and structured mentorship.

## What the Scholarship Covers

Each scholarship recipient receives:

- Full secondary school or university fee payment (up to KES 80,000 per year)
- A complete school supply kit (books, stationery, uniform where needed)
- Monthly mentorship sessions
- Psychosocial support from our counselors

## Application Process

We run an annual scholarship drive every December. Applications are reviewed by a panel who assess financial need, academic potential, and community service.

## 2025 Cohort Results

Of the 100 students supported this year:

- 98 completed their academic year
- 15 achieved top performance in national exams
- 7 received additional university scholarships from third parties
- 3 joined the foundation as youth volunteers

## A Note From a Recipient

"I had given up on school. My mother couldn't afford the fees and I was about to drop out. The foundation's scholarship didn't just pay my fees — they gave me hope. Now I want to study medicine and come back to serve my community," says Amara, a Form 3 student from Kayole.

The 2026 scholarship round is now open. [Apply here](/programs/education) or [donate to fund a student](/donate).`,
    tags: ['Education', 'Scholarships', 'Youth'],
  },
]

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = posts.find((p) => p.slug === params.slug)
  if (!post) return { title: 'Post Not Found' }
  return { title: post.title, description: post.excerpt }
}

export default function BlogPostPage({ params }: Props) {
  const post = posts.find((p) => p.slug === params.slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-80 sm:h-96 lg:h-[28rem]">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <span className="badge-green mb-3">{post.category}</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Article */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <Image src={post.authorImage} alt={post.author} fill className="object-cover" />
            </div>
            <div>
              <div className="font-semibold text-slate-700">{post.author}</div>
              <div className="text-xs">{post.authorTitle}</div>
            </div>
          </div>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(post.date).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</span>
        </div>

        {/* Excerpt */}
        <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">{post.excerpt}</p>

        {/* Body — rendered as simple paragraphs */}
        <div className="prose prose-lg max-w-none text-slate-700">
          {post.body.split('\n\n').map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-bold text-slate-900 mt-8 mb-3">{para.slice(3)}</h2>
            }
            if (para.startsWith('- ')) {
              const items = para.split('\n').filter((line) => line.startsWith('- '))
              return (
                <ul key={i} className="list-disc list-inside space-y-1.5 my-4 text-slate-600">
                  {items.map((item, j) => <li key={j}>{item.slice(2)}</li>)}
                </ul>
              )
            }
            return <p key={i} className="mb-4 leading-relaxed">{para}</p>
          })}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-gray-100">
          <Tag className="w-4 h-4 text-slate-400" />
          {post.tags.map((tag) => (
            <span key={tag} className="badge-gray">{tag}</span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 p-6 bg-primary-50 rounded-2xl border border-primary-100">
          <h3 className="font-bold text-primary-800 mb-2">Support our work</h3>
          <p className="text-sm text-primary-700 mb-4">Stories like these are made possible by our donors and volunteers. Your support means more lives changed.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/donate" className="btn-primary text-sm">Donate Now</Link>
            <Link href="/auth/signup" className="btn-secondary text-sm">Join as Member</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
