'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { Search, X, Loader2, BookOpen, Calendar, Globe, Users, Image } from 'lucide-react'
import { globalSearch, type SearchResult } from '@/app/actions/search'

const TYPE_META: Record<SearchResult['type'], { label: string; icon: React.ElementType; color: string }> = {
  blog:    { label: 'Blog',    icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
  event:   { label: 'Event',   icon: Calendar, color: 'text-purple-500 bg-purple-50' },
  program: { label: 'Program', icon: Globe,    color: 'text-green-500 bg-green-50' },
  member:  { label: 'Member',  icon: Users,    color: 'text-amber-500 bg-amber-50' },
  gallery: { label: 'Gallery', icon: Image,    color: 'text-pink-500 bg-pink-50' },
}

export default function GlobalSearch({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearch(query)
        setResults(res)
      })
    }, 320)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (⌘K)"
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
        />
        {(query || isPending) && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" /> : <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />}
          </button>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-2 left-0 w-full min-w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {results.length === 0 && !isPending && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.length === 0 && isPending && (
            <div className="px-4 py-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary-500 mx-auto" />
            </div>
          )}
          {results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {results.map((r) => {
                const meta = TYPE_META[r.type]
                const Icon = meta.icon
                return (
                  <li key={`${r.type}-${r.id}`}>
                    <Link
                      href={r.href}
                      onClick={() => { setOpen(false); setQuery('') }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                        {r.excerpt && <p className="text-xs text-slate-400 truncate">{r.excerpt}</p>}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${meta.color} flex-shrink-0`}>
                        {meta.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
