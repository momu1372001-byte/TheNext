import type { Word } from './supabase'

export type ExerciseType = 'en-to-ar' | 'ar-to-en' | 'fill-blank'

export interface Exercise {
  type: ExerciseType
  word: Word
  prompt: string
  promptArabic?: string
  options: string[]
  correctAnswer: string
  blankSentenceEn?: string
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickDistractors(pool: string[], correct: string, count: number): string[] {
  const filtered = pool.filter((w) => w !== correct)
  return shuffle(filtered).slice(0, count)
}

export function generateExercises(words: Word[]): Exercise[] {
  const exercises: Exercise[] = []
  const arabicPool = words.map((w) => w.arabic)
  const englishPool = words.map((w) => w.english)

  for (const word of words) {
    // Type 1: English → choose Arabic
    const enToArDistractors = pickDistractors(arabicPool, word.arabic, 3)
    exercises.push({
      type: 'en-to-ar',
      word,
      prompt: word.english,
      options: shuffle([word.arabic, ...enToArDistractors]),
      correctAnswer: word.arabic,
    })

    // Type 2: Arabic → choose English
    const arToEnDistractors = pickDistractors(englishPool, word.english, 3)
    exercises.push({
      type: 'ar-to-en',
      word,
      prompt: word.arabic,
      promptArabic: word.transliteration,
      options: shuffle([word.english, ...arToEnDistractors]),
      correctAnswer: word.english,
    })

    // Type 3: Fill in the blank (English sentence)
    if (word.example_en && word.example_ar) {
      const blanked = word.example_en.replace(
        new RegExp(word.english, 'i'),
        '_____',
      )
      if (blanked !== word.example_en) {
        const fillDistractors = pickDistractors(englishPool, word.english, 3)
        exercises.push({
          type: 'fill-blank',
          word,
          prompt: blanked,
          promptArabic: word.example_ar,
          options: shuffle([word.english, ...fillDistractors]),
          correctAnswer: word.english,
          blankSentenceEn: blanked,
        })
      }
    }
  }

  return shuffle(exercises)
}
