import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { generateExercises } from '../lib/exercises'
import type { Exercise } from '../lib/exercises'
import type { Word } from '../lib/supabase'
import { getLessonProgressSummary, getLessons, recordAnswer } from '../lib/api'
import ProgressBar from '../components/ProgressBar'

type Phase = 'loading' | 'question' | 'feedback' | 'done'

export default function Practice() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('loading')
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [wrongWords, setWrongWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!lessonId) return
      try {
        const summary = await getLessonProgressSummary(lessonId)
        const allLessons = await getLessons()
        setLessonTitle(
          allLessons.find((l) => l.id === lessonId)?.title ?? '',
        )
        const words = summary.words
        if (words.length === 0) {
          setError('This lesson has no words yet.')
          setPhase('done')
          return
        }
        const exs = generateExercises(words)
        setExercises(exs)
        setPhase('question')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load lesson')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lessonId])

  const current = exercises[currentIdx]

  const handleAnswer = useCallback(
    async (option: string) => {
      if (!current || phase !== 'question') return
      setSelected(option)
      const correct = option === current.correctAnswer
      setIsCorrect(correct)
      if (correct) {
        setCorrectCount((c) => c + 1)
      } else {
        setWrongCount((c) => c + 1)
        setWrongWords((w) => [...w, current.word])
      }
      try {
        await recordAnswer(current.word.id, correct)
      } catch {
        // progress save failed silently — still proceed
      }
      setPhase('feedback')
    },
    [current, phase],
  )

  const handleContinue = useCallback(() => {
    setSelected(null)
    if (currentIdx + 1 >= exercises.length) {
      setPhase('done')
    } else {
      setCurrentIdx((i) => i + 1)
      setPhase('question')
    }
  }, [currentIdx, exercises.length])

  if (loading || phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-ink-700 border-t-gold-400 animate-spin" />
          <p className="text-ink-400 text-sm">Loading practice...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-red-400 font-medium mb-2">Something went wrong</p>
          <p className="text-ink-400 text-sm mb-4">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-gold-400 text-sm font-medium hover:text-gold-300"
          >
            ← Back to lessons
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    const total = exercises.length
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0

    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Result circle */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative h-32 w-32 mb-4">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#1c1c1f"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gold-400">{pct}%</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-ink-100">Lesson complete!</h2>
            <p className="text-ink-400 text-sm mt-1">{lessonTitle}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl bg-ink-850 border border-ink-700 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {correctCount}
              </div>
              <div className="text-xs text-ink-400 mt-1">Correct</div>
            </div>
            <div className="rounded-xl bg-ink-850 border border-ink-700 p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
              <div className="text-xs text-ink-400 mt-1">Wrong</div>
            </div>
            <div className="rounded-xl bg-ink-850 border border-ink-700 p-4 text-center">
              <div className="text-2xl font-bold text-ink-100">{total}</div>
              <div className="text-xs text-ink-400 mt-1">Total</div>
            </div>
          </div>

          {/* Wrong words review */}
          {wrongWords.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-ink-300 mb-3">
                Words to review
              </h3>
              <div className="space-y-2">
                {wrongWords.map((w, i) => (
                  <div
                    key={`${w.id}-${i}`}
                    className="flex items-center justify-between rounded-lg bg-ink-850 border border-ink-700 px-4 py-2.5"
                  >
                    <span className="text-ink-200 text-sm font-medium">
                      {w.english}
                    </span>
                    <span className="text-gold-300 font-arabic text-base">
                      {w.arabic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(0)}
              className="flex-1 rounded-xl bg-ink-800 border border-ink-700 text-ink-100 font-medium py-3.5 hover:bg-ink-700 transition-colors"
            >
              Practice again
            </button>
            <Link
              to="/"
              className="flex-1 rounded-xl bg-gold-400 text-ink-950 font-semibold py-3.5 text-center hover:bg-gold-300 transition-colors"
            >
              Back to lessons
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Question or feedback phase
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/"
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-ink-800 border border-ink-700 text-ink-300 hover:text-ink-100 hover:border-ink-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <ProgressBar current={currentIdx + 1} total={exercises.length} />
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-5 pb-8">
        <div className="w-full max-w-xl">
          {current && (
            <div key={currentIdx} className="animate-slide-up">
              {/* Prompt */}
              <div className="text-center mb-8">
                <p className="text-ink-400 text-sm font-medium mb-4 uppercase tracking-wide">
                  {current.type === 'en-to-ar' &&
                    'Choose the Arabic meaning'}
                  {current.type === 'ar-to-en' &&
                    'Choose the English meaning'}
                  {current.type === 'fill-blank' && 'Fill in the blank'}
                </p>

                {current.type === 'en-to-ar' && (
                  <h2 className="text-4xl sm:text-5xl font-bold text-ink-100">
                    {current.prompt}
                  </h2>
                )}

                {current.type === 'ar-to-en' && (
                  <div>
                    <h2 className="text-5xl sm:text-6xl font-bold text-gold-300 font-arabic mb-2">
                      {current.prompt}
                    </h2>
                    {current.promptArabic && (
                      <p className="text-ink-400 text-lg mt-3">
                        {current.promptArabic}
                      </p>
                    )}
                  </div>
                )}

                {current.type === 'fill-blank' && (
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-ink-100 leading-relaxed mb-3">
                      {current.prompt}
                    </h2>
                    {current.promptArabic && (
                      <p className="text-xl text-gold-300 font-arabic mt-2">
                        {current.promptArabic}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {current.options.map((option) => {
                  const isSelected = selected === option
                  const showCorrect =
                    phase === 'feedback' && option === current.correctAnswer
                  const showWrong =
                    phase === 'feedback' &&
                    isSelected &&
                    option !== current.correctAnswer

                  let classes =
                    'border-ink-700 bg-ink-850 hover:border-gold-500/60 hover:bg-ink-800 text-ink-100'

                  if (phase === 'feedback') {
                    if (showCorrect) {
                      classes =
                        'border-emerald-500 bg-emerald-500/15 text-emerald-100'
                    } else if (showWrong) {
                      classes = 'border-red-500 bg-red-500/15 text-red-100'
                    } else {
                      classes = 'border-ink-700 bg-ink-850 text-ink-400'
                    }
                  }

                  const isArabicOption = current.type === 'en-to-ar'

                  return (
                    <button
                      key={option}
                      disabled={phase !== 'question'}
                      onClick={() => handleAnswer(option)}
                      className={`relative rounded-xl border-2 px-5 py-5 text-center font-medium text-lg transition-all duration-200 ${classes} ${
                        phase === 'question'
                          ? 'active:scale-[0.98]'
                          : 'cursor-default'
                      }`}
                    >
                      <span
                        className={
                          isArabicOption
                            ? 'font-arabic text-2xl'
                            : ''
                        }
                      >
                        {option}
                      </span>
                      {showCorrect && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          <svg
                            className="h-6 w-6 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                      {showWrong && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          <svg
                            className="h-6 w-6 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Feedback bar */}
              {phase === 'feedback' && (
                <div className="mt-8 animate-slide-up">
                  <div
                    className={`rounded-2xl p-5 border ${
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          isCorrect
                            ? 'bg-emerald-500/20'
                            : 'bg-red-500/20'
                        }`}
                      >
                        {isCorrect ? (
                          <svg
                            className="h-6 w-6 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-6 w-6 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-semibold ${
                            isCorrect ? 'text-emerald-300' : 'text-red-300'
                          }`}
                        >
                          {isCorrect ? 'Correct!' : 'Not quite right'}
                        </p>
                        {!isCorrect && (
                          <p className="text-ink-400 text-sm">
                            Answer:{' '}
                            <span className="text-ink-100 font-medium">
                              {current.type === 'en-to-ar' ? (
                                <span className="font-arabic text-gold-300">
                                  {current.correctAnswer}
                                </span>
                              ) : (
                                current.correctAnswer
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Word detail */}
                    <div className="flex items-center justify-between rounded-lg bg-ink-900/50 px-4 py-3">
                      <div>
                        <p className="text-ink-200 font-medium">
                          {current.word.english}
                        </p>
                        <p className="text-ink-400 text-xs mt-0.5">
                          {current.word.transliteration}
                        </p>
                      </div>
                      <p className="text-gold-300 font-arabic text-xl">
                        {current.word.arabic}
                      </p>
                    </div>

                    <button
                      onClick={handleContinue}
                      className="w-full mt-4 rounded-xl bg-gold-400 text-ink-950 font-semibold py-3.5 hover:bg-gold-300 transition-colors active:scale-[0.98]"
                    >
                      {currentIdx + 1 >= exercises.length
                        ? 'See results'
                        : 'Continue'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
