import type { LevelCode } from '@/types';

const STORAGE_KEY = 'words-app-progress-v1';

export type WordStatus = 'new' | 'learning' | 'reviewed';

export type LessonProgress = {
  completed: boolean;
  bestScore: number; // 0-100
  completedAt: string | null;
};

export type WordProgress = {
  status: WordStatus;
  correctCount: number;
  wrongCount: number;
};

export type ProgressState = {
  lessons: Record<string, LessonProgress>;
  learnedWordIds: string[];
  streak: number;
  lastActiveDate: string | null;
  words: Record<string, WordProgress>;
};

const INITIAL_STATE: ProgressState = {
  lessons: {},
  learnedWordIds: [],
  streak: 0,
  lastActiveDate: null,
  words: {},
};

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_STATE };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      lessons: parsed.lessons ?? {},
      learnedWordIds: parsed.learnedWordIds ?? [],
      streak: parsed.streak ?? 0,
      lastActiveDate: parsed.lastActiveDate ?? null,
      words: parsed.words ?? {},
    };
  } catch {
    return { ...INITIAL_STATE };
  }
}

function save(state: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

const listeners = new Set<() => void>();
let currentState: ProgressState = load();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getProgress(): ProgressState {
  return currentState;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isLessonCompleted(lessonId: string): boolean {
  return Boolean(currentState.lessons[lessonId]?.completed);
}

export function getLessonProgress(lessonId: string): LessonProgress | undefined {
  return currentState.lessons[lessonId];
}

export function getCompletedLessonsForLevel(_level: LevelCode, lessonIds: string[]): number {
  return lessonIds.filter((id) => currentState.lessons[id]?.completed).length;
}

export function getLearnedWordCount(): number {
  return currentState.learnedWordIds.length;
}

export function getWordStatus(wordId: string): WordStatus {
  return currentState.words[wordId]?.status ?? 'new';
}

export function getWordProgress(wordId: string): WordProgress | undefined {
  return currentState.words[wordId];
}

export function recordWordAnswer(wordId: string, correct: boolean): void {
  const existing = currentState.words[wordId];
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const wrongCount = (existing?.wrongCount ?? 0) + (correct ? 0 : 1);
  let status: WordStatus = 'learning';
  if (correctCount >= 2) {
    status = 'reviewed';
  } else {
    status = 'learning';
  }

  currentState = {
    ...currentState,
    words: {
      ...currentState.words,
      [wordId]: { status, correctCount, wrongCount },
    },
  };
  save(currentState);
  notify();
}

export function markLessonComplete(lessonId: string, score: number, wordIds: string[]): void {
  const existing = currentState.lessons[lessonId];
  const today = new Date().toISOString().slice(0, 10);

  const newLearned = new Set(currentState.learnedWordIds);
  wordIds.forEach((id) => newLearned.add(id));

  const streak = currentState.lastActiveDate === today
    ? currentState.streak
    : currentState.lastActiveDate
      ? currentState.streak + 1
      : 1;

  currentState = {
    ...currentState,
    lessons: {
      ...currentState.lessons,
      [lessonId]: {
        completed: true,
        bestScore: Math.max(existing?.bestScore ?? 0, score),
        completedAt: today,
      },
    },
    learnedWordIds: [...newLearned],
    streak,
    lastActiveDate: today,
  };
  save(currentState);
  notify();
}

export type ReviewEntry = {
  wordId: string;
  wrongCount: number;
  correctCount: number;
  status: WordStatus;
  weight: number;
};

/**
 * Returns words that are due for review, sorted by priority:
 * - Words with wrong answers appear first (more wrongs = higher priority)
 * - Words still in "learning" status are next
 * - "reviewed" words with zero wrongs are excluded (they're mastered)
 */
export function getReviewWords(): ReviewEntry[] {
  const entries: ReviewEntry[] = [];

  for (const [wordId, progress] of Object.entries(currentState.words)) {
    const hasWrong = progress.wrongCount > 0;
    const isLearning = progress.status === 'learning';

    if (!hasWrong && !isLearning) continue;

    // Weight: words with more wrongs appear more frequently.
    // Each wrong answer doubles the weight (exponential), so a word
    // answered wrong 3x is 8x more likely to appear than one wrong 1x.
    const weight = Math.max(1, (progress.wrongCount + 1) * (isLearning ? 2 : 1));

    entries.push({
      wordId,
      wrongCount: progress.wrongCount,
      correctCount: progress.correctCount,
      status: progress.status,
      weight,
    });
  }

  // Sort by wrongCount desc, then by status (learning before reviewed)
  entries.sort((a, b) => {
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount;
    if (a.status === 'learning' && b.status !== 'learning') return -1;
    if (b.status === 'learning' && a.status !== 'learning') return 1;
    return 0;
  });

  return entries;
}

export function resetProgress(): void {
  currentState = { ...INITIAL_STATE };
  save(currentState);
  notify();
}
