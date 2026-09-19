import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export type WordStatus = 'new' | 'learning' | 'reviewed'

export interface Lesson {
  id: string
  title: string
  description: string
  order: number
}

export interface Word {
  id: string
  lesson_id: string
  english: string
  arabic: string
  transliteration: string
  example_en: string
  example_ar: string
  order: number
}

export interface WordProgress {
  id: string
  word_id: string
  status: WordStatus
  correct_count: number
  wrong_count: number
  last_practiced_at: string | null
}
