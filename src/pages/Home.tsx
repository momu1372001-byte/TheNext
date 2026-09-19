import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLessons, getLessonProgressSummary } from '../lib/api'
import type { Lesson } from '../lib/supabase'
import StatusBadge from '../components/StatusBadge'

interface LessonStat {
  total: number
  newCount: number
  learningCount: number
  reviewedCount: number
}

export default function Home() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [stats, setStats] = useState<Record<string, LessonStat>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const ls = await getLessons()
        setLessons(ls)
        const statMap: Record<string, LessonStat> = {}
        for (const l of ls) {
          const s = await getLessonProgressSummary(l.id)
          statMap[l.id] = {
            total: s.total,
            newCount: s.newCount,
            learningCount: s.learningCount,
            reviewedCount: s.reviewedCount,
          }
        }
        setStats(statMap)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load lessons')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-ink-700 border-t-gold-400 animate-spin" />
          <p className="text-ink-400 text-sm">Loading lessons...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-ink-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gold-400 text-ink-950 font-bold text-lg">
              ع
            </div>
            <span className="text-ink-300 text-sm font-medium tracking-wide">
              Arabic Learn
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-ink-100 leading-tight">
            Practice your Arabic
          </h1>
          <p className="text-ink-400 mt-2 text-base">
            Pick a lesson and start practicing. Your progress is saved
            automatically.
          </p>
        </header>

        {/* Lesson cards */}
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const stat = stats[lesson.id]
            const reviewedPct =
              stat && stat.total > 0
                ? Math.round((stat.reviewedCount / stat.total) * 100)
                : 0
            return (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="group block rounded-2xl bg-ink-850 border border-ink-700 hover:border-gold-500/50 transition-all duration-200 p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-ink-400">
                        Lesson {lesson.order}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-ink-100 group-hover:text-gold-300 transition-colors">
                      {lesson.title}
                    </h2>
                    <p className="text-ink-400 text-sm mt-1 line-clamp-1">
                      {lesson.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <svg
                      className="h-5 w-5 text-ink-500 group-hover:text-gold-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {stat && (
                  <div className="mt-4">
                    {/* Progress mini-bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-1.5 flex-1 rounded-full bg-ink-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gold-400 transition-all duration-500"
                          style={{ width: `${reviewedPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-ink-400">
                        {reviewedPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-ink-400">
                        {stat.total} words
                      </span>
                      <span className="text-ink-600">·</span>
                      <StatusBadge status="new" />
                      <span className="text-xs text-ink-500">{stat.newCount}</span>
                      <StatusBadge status="learning" />
                      <span className="text-xs text-ink-500">
                        {stat.learningCount}
                      </span>
                      <StatusBadge status="reviewed" />
                      <span className="text-xs text-ink-500">
                        {stat.reviewedCount}
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
