'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FaqItem {
  id: string
  question: string
  answer: string
  category: string | null
}

interface FaqGroup {
  category: string
  label: string
  items: FaqItem[]
}

interface Props {
  groups: FaqGroup[]
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-800 text-sm md:text-base pr-4 leading-snug">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FaqAccordion({ groups }: Props) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.category}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3 px-1">
            {group.label}
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 divide-y-0">
            {group.items.map((faq) => (
              <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
