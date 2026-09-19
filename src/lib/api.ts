import { supabase, type Word, type WordProgress, type WordStatus } from './supabase'

export async function getLessons() {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('order', { ascending: true })
  if (error) throw error
  return data
}

export async function getLessonWords(lessonId: string): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order', { ascending: true })
  if (error) throw error
  return data as Word[]
}

export async function getAllWords(): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('order', { ascending: true })
  if (error) throw error
  return data as Word[]
}

export async function getProgressForWords(wordIds: string[]): Promise<Map<string, WordProgress>> {
  if (wordIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('word_progress')
    .select('*')
    .in('word_id', wordIds)
  if (error) throw error
  const map = new Map<string, WordProgress>()
  for (const row of data ?? []) {
    map.set(row.word_id, row as WordProgress)
  }
  return map
}

export async function getLessonProgressSummary(lessonId: string) {
  const words = await getLessonWords(lessonId)
  const wordIds = words.map((w) => w.id)
  const progressMap = await getProgressForWords(wordIds)

  let newCount = 0
  let learningCount = 0
  let reviewedCount = 0
  for (const w of words) {
    const p = progressMap.get(w.id)
    if (!p || p.status === 'new') newCount++
    else if (p.status === 'learning') learningCount++
    else reviewedCount++
  }
  return {
    total: words.length,
    newCount,
    learningCount,
    reviewedCount,
    words,
    progressMap,
  }
}

export async function recordAnswer(wordId: string, correct: boolean) {
  const { data: existing, error: fetchError } = await supabase
    .from('word_progress')
    .select('*')
    .eq('word_id', wordId)
    .maybeSingle()

  if (fetchError) throw fetchError

  const now = new Date().toISOString()
  let newStatus: WordStatus = 'learning'
  let correctCount = 0
  let wrongCount = 0

  if (existing) {
    correctCount = (existing as WordProgress).correct_count + (correct ? 1 : 0)
    wrongCount = (existing as WordProgress).wrong_count + (correct ? 0 : 1)
    // Promote to "reviewed" after 2 correct answers, keep "learning" otherwise
    if (correctCount >= 2) {
      newStatus = 'reviewed'
    } else {
      newStatus = 'learning'
    }
  } else {
    correctCount = correct ? 1 : 0
    wrongCount = correct ? 0 : 1
    newStatus = correct ? 'learning' : 'learning'
  }

  const { error } = await supabase
    .from('word_progress')
    .upsert(
      {
        word_id: wordId,
        status: newStatus,
        correct_count: correctCount,
        wrong_count: wrongCount,
        last_practiced_at: now,
      },
      { onConflict: 'word_id' },
    )
  if (error) throw error
}
