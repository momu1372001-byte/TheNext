import { useState, useMemo, useCallback } from 'react';
import { RotateCcw, Clock, Check, X, Star, Trophy, Volume2, ChevronLeft, Sparkles } from 'lucide-react';
import { Screen, ScreenHeader, Card, ProgressBar, Button } from '@/components/ui';
import { getWordById, getAllWords } from '@/data/vocabularyRepository';
import { getReviewWords, recordWordAnswer, type ReviewEntry } from '@/data/progressStore';
import type { Word } from '@/types';

// ---------------------------------------------------------------------------
// Exercise types (shared shape with LessonPracticeScreen)
// ---------------------------------------------------------------------------

type ExerciseType = 'en-to-ar' | 'ar-to-en' | 'fill-blank';

type Exercise = {
  type: ExerciseType;
  word: Word;
  prompt: string;
  promptSub?: string;
  options: string[];
  correctAnswer: string;
  isArabicOptions: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool: string[], correct: string, count: number): string[] {
  return shuffle(pool.filter((w) => w !== correct)).slice(0, count);
}

const TYPE_LABELS: Record<ExerciseType, string> = {
  'en-to-ar': 'اختر المعنى العربي الصحيح',
  'ar-to-en': 'اختر الكلمة الإنجليزية الصحيحة',
  'fill-blank': 'أكمل الفراغ بالكلمة الصحيحة',
};

function buildExercisesForWords(words: Word[]): Exercise[] {
  if (words.length === 0) return [];

  const arabicPool = words.map((w) => w.arabicTranslation);
  const englishPool = words.map((w) => w.word);
  const exercises: Exercise[] = [];

  for (const word of words) {
    // Type 1: English → Arabic
    const arDistractors = pickDistractors(arabicPool, word.arabicTranslation, 3);
    exercises.push({
      type: 'en-to-ar',
      word,
      prompt: word.word,
      promptSub: word.pronunciation,
      options: shuffle([word.arabicTranslation, ...arDistractors]),
      correctAnswer: word.arabicTranslation,
      isArabicOptions: true,
    });

    // Type 2: Arabic → English
    const enDistractors = pickDistractors(englishPool, word.word, 3);
    exercises.push({
      type: 'ar-to-en',
      word,
      prompt: word.arabicTranslation,
      options: shuffle([word.word, ...enDistractors]),
      correctAnswer: word.word,
      isArabicOptions: false,
    });

    // Type 3: Fill in the blank
    if (word.exampleSentence && word.exampleSentence.includes(word.word)) {
      const blanked = word.exampleSentence.replace(
        new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        '_____',
      );
      if (blanked !== word.exampleSentence) {
        const fillDistractors = pickDistractors(englishPool, word.word, 3);
        exercises.push({
          type: 'fill-blank',
          word,
          prompt: blanked,
          promptSub: word.arabicExampleTranslation,
          options: shuffle([word.word, ...fillDistractors]),
          correctAnswer: word.word,
          isArabicOptions: false,
        });
      }
    }
  }

  return shuffle(exercises);
}

/**
 * Build a weighted review set. Words with more wrong answers appear more
 * frequently — we duplicate entries by their weight so the shuffled pool
 * naturally surfaces harder words more often.
 */
function buildReviewExercises(reviewEntries: ReviewEntry[]): Exercise[] {
  if (reviewEntries.length === 0) return [];

  const allWords = getAllWords();
  const wordMap = new Map(allWords.map((w) => [w.id, w]));

  // Collect unique words (a word may appear in multiple entries if practiced
  // across different lessons, but we only want it once in the pool).
  const uniqueWords: Word[] = [];
  const seen = new Set<string>();
  for (const entry of reviewEntries) {
    if (seen.has(entry.wordId)) continue;
    const word = wordMap.get(entry.wordId);
    if (word) {
      uniqueWords.push(word);
      seen.add(entry.wordId);
    }
  }

  if (uniqueWords.length === 0) return [];

  // Build the full exercise set, then weight by repeating harder words.
  const baseExercises = buildExercisesForWords(uniqueWords);
  const weightMap = new Map<string, number>();
  for (const entry of reviewEntries) {
    weightMap.set(entry.wordId, entry.weight);
  }

  // Repeat each exercise based on weight (capped at 3x to keep the session
  // reasonable), then shuffle and cap the total at 30 exercises.
  const weighted: Exercise[] = [];
  for (const ex of baseExercises) {
    const w = Math.min(3, weightMap.get(ex.word.id) ?? 1);
    for (let i = 0; i < w; i++) weighted.push(ex);
  }

  return shuffle(weighted).slice(0, 30);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewScreen() {
  const [phase, setPhase] = useState<'overview' | 'practice' | 'done'>('overview');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);

  const reviewEntries = useMemo(() => getReviewWords(), []);
  const dueCount = reviewEntries.length;
  const estimatedMinutes = Math.max(1, Math.ceil((dueCount * 2) / 5));

  const handleStartReview = useCallback(() => {
    const exs = buildReviewExercises(reviewEntries);
    if (exs.length === 0) return;
    setExercises(exs);
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setWrongWords([]);
    setPhase('practice');
  }, [reviewEntries]);

  const current = exercises[currentIdx];

  const handleAnswer = useCallback(
    (option: string) => {
      if (answered || !current) return;
      setSelected(option);
      setAnswered(true);
      const correct = option === current.correctAnswer;
      if (correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setWrongWords((w) => [...w, current.word]);
      }
      recordWordAnswer(current.word.id, correct);
    },
    [answered, current],
  );

  const handleContinue = useCallback(() => {
    if (currentIdx + 1 >= exercises.length) {
      setPhase('done');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [currentIdx, exercises.length]);

  const handleBackToOverview = useCallback(() => {
    setPhase('overview');
    setExercises([]);
    setSelected(null);
    setAnswered(false);
    setCurrentIdx(0);
    setCorrectCount(0);
    setWrongWords([]);
  }, []);

  // --- Done phase ---
  if (phase === 'done') {
    const total = exercises.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const stars = Math.max(1, Math.round(score / 33.3));

    return (
      <Screen scroll={false}>
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 animate-scale-in">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <Trophy size={48} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">أحسنت!</h2>
            <p className="text-sm text-text-muted mt-1">أكملت مراجعتك</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-primary-500 ltr">{score}%</span>
              <span className="text-2xs text-text-muted">النتيجة</span>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-success-400 ltr">{correctCount}/{total}</span>
              <span className="text-2xs text-text-muted">إجابات صحيحة</span>
            </div>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2].map((s) => (
              <Star
                key={s}
                size={28}
                className={s < stars ? 'text-primary-500' : 'text-white/15'}
                fill={s < stars ? 'currentColor' : 'none'}
              />
            ))}
          </div>

          {wrongWords.length > 0 && (
            <div className="w-full max-w-sm">
              <p className="text-2xs font-semibold text-text-muted mb-2 text-center">كلمات تحتاج مراجعة</p>
              <div className="flex flex-col gap-1.5">
                {wrongWords.map((w, i) => (
                  <div
                    key={`${w.id}-${i}`}
                    className="flex items-center justify-between rounded-md bg-surface border border-border/50 px-4 py-2"
                  >
                    <span className="text-sm font-medium text-text-secondary ltr">{w.word}</span>
                    <span className="text-sm text-primary-500">{w.arabicTranslation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button fullWidth size="lg" icon={<RotateCcw size={18} />} onClick={handleStartReview}>
              مراجعة أخرى
            </Button>
            <Button fullWidth size="md" variant="ghost" onClick={handleBackToOverview}>
              العودة للمراجعة
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  // --- Practice phase ---
  if (phase === 'practice' && current) {
    const isCorrect = selected === current.correctAnswer;
    const isLast = currentIdx === exercises.length - 1;

    return (
      <Screen scroll={false}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
          <button
            onClick={handleBackToOverview}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-text-primary truncate">مراجعة ذكية</h1>
            <p className="text-2xs text-text-muted">
              {currentIdx + 1} من {exercises.length}
            </p>
          </div>
          <span className="rounded-pill bg-primary-500/15 px-3 py-1 text-2xs font-semibold text-primary-500 shrink-0">
            مراجعة
          </span>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-4 shrink-0">
          <ProgressBar
            value={currentIdx + (answered ? 1 : 0)}
            max={exercises.length}
            color={answered && !isCorrect ? 'bg-error-500' : 'bg-primary-500'}
          />
        </div>

        {/* Question + options */}
        <div className="flex flex-col gap-5 px-5 pb-8 flex-1 overflow-y-auto no-scrollbar">
          <div key={currentIdx} className="flex flex-col items-center text-center gap-3 pt-4 animate-fade-up">
            <p className="text-2xs text-text-muted">{TYPE_LABELS[current.type]}</p>

            {current.type === 'ar-to-en' ? (
              <h2 className="text-4xl font-bold text-primary-500">{current.prompt}</h2>
            ) : (
              <h2 className="text-3xl font-bold text-text-primary ltr leading-relaxed">
                {current.prompt}
              </h2>
            )}

            {current.promptSub && (
              current.type === 'fill-blank' ? (
                <p className="text-sm text-text-muted">{current.promptSub}</p>
              ) : (
                <p className="text-2xs text-text-muted ltr">{current.promptSub}</p>
              )
            )}

            {current.type === 'en-to-ar' && (
              <button
                className="flex items-center gap-1.5 text-2xs text-text-muted hover:text-primary-500 transition-colors mt-1"
                onClick={() => {
                  try {
                    const utterance = new SpeechSynthesisUtterance(current.word.word);
                    utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                  } catch {
                    // speech not available
                  }
                }}
              >
                <Volume2 size={14} />
                <span>استمع</span>
              </button>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {current.options.map((option) => {
              const isThisCorrect = option === current.correctAnswer;
              const isThisSelected = option === selected;

              let stateClass = 'border-border bg-surface text-text-primary hover:border-primary-500/50';
              if (answered) {
                if (isThisCorrect) {
                  stateClass = 'border-success-500 bg-success-500/10 text-success-400';
                } else if (isThisSelected) {
                  stateClass = 'border-error-500 bg-error-500/10 text-error-400';
                } else {
                  stateClass = 'border-border/50 bg-surface/50 text-text-muted';
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={`flex items-center justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${stateClass} ${
                    !answered ? 'cursor-pointer active:scale-[0.98]' : ''
                  }`}
                >
                  <span className={`font-semibold text-lg ${current.isArabicOptions ? 'text-xl' : 'ltr'}`}>
                    {option}
                  </span>
                  {answered && isThisCorrect && <Check size={20} className="text-success-400 shrink-0" />}
                  {answered && isThisSelected && !isThisCorrect && <X size={20} className="text-error-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback + Continue */}
          {answered && (
            <div className="flex flex-col gap-3 animate-fade-up">
              <div
                className={`rounded-lg p-4 border ${
                  isCorrect
                    ? 'bg-success-500/10 border-success-500/30'
                    : 'bg-error-500/10 border-error-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${
                      isCorrect ? 'bg-success-500/20' : 'bg-error-500/20'
                    }`}
                  >
                    {isCorrect ? (
                      <Check size={22} className="text-success-400" strokeWidth={2.5} />
                    ) : (
                      <X size={22} className="text-error-400" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${isCorrect ? 'text-success-400' : 'text-error-400'}`}>
                      {isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
                    </p>
                    {!isCorrect && (
                      <p className="text-2xs text-text-muted mt-0.5">
                        الإجابة الصحيحة:{' '}
                        <span className="text-text-secondary font-medium">{current.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-semibold text-text-primary ltr">{current.word.word}</p>
                    <p className="text-2xs text-primary-500">{current.word.arabicTranslation}</p>
                  </div>
                </div>
              </div>

              <Button fullWidth size="lg" onClick={handleContinue}>
                {isLast ? 'إنهاء وعرض النتيجة' : 'متابعة'}
              </Button>
            </div>
          )}
        </div>
      </Screen>
    );
  }

  // --- Overview phase ---
  const hasWords = dueCount > 0;

  // Build a small preview of the hardest words
  const previewWords = reviewEntries
    .slice(0, 5)
    .map((e) => getWordById(e.wordId))
    .filter((w): w is Word => Boolean(w));

  return (
    <Screen>
      <ScreenHeader
        titleAr="مراجعة"
        subtitleAr="راجع ما تعلّمته لتثبيته في ذاكرتك"
        icon={<RotateCcw size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {hasWords ? (
          <>
            {/* Due count hero card */}
            <Card raised className="p-6 flex flex-col items-center text-center gap-3 animate-fade-up">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary-500/20 blur-xl animate-pulse-glow" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
                  <span className="text-3xl font-bold text-neutral-950 ltr">{dueCount}</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">كلمات للمراجعة</p>
                <p className="text-sm text-text-muted mt-1">
                  {dueCount === 1 ? 'كلمة واحدة تحتاج مراجعة' : `${dueCount} كلمات تحتاج مراجعة`}
                </p>
              </div>

              {/* Estimated time */}
              <div className="flex items-center gap-1.5 text-2xs text-text-muted">
                <Clock size={13} />
                <span className="ltr">~{estimatedMinutes} دقيقة</span>
              </div>
            </Card>

            {/* Start button */}
            <Button
              fullWidth
              size="lg"
              icon={<Sparkles size={20} />}
              onClick={handleStartReview}
              className="animate-fade-up"
            >
              ابدأ المراجعة
            </Button>

            {/* Word preview */}
            {previewWords.length > 0 && (
              <div className="animate-fade-up">
                <p className="text-2xs font-semibold text-text-muted mb-2 px-1">كلمات تحتاج اهتمامك</p>
                <div className="flex flex-col gap-1.5">
                  {previewWords.map((w) => {
                    const entry = reviewEntries.find((e) => e.wordId === w.id);
                    return (
                      <div
                        key={w.id}
                        className="flex items-center justify-between rounded-md bg-surface border border-border/50 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-text-secondary ltr">{w.word}</span>
                          {entry && entry.wrongCount > 0 && (
                            <span className="text-2xs text-error-400 mr-2 ltr"> · {entry.wrongCount}x خطأ</span>
                          )}
                        </div>
                        <span className="text-sm text-primary-500 shrink-0">{w.arabicTranslation}</span>
                      </div>
                    );
                  })}
                </div>
                {dueCount > 5 && (
                  <p className="text-2xs text-text-muted text-center mt-2">
                    +{dueCount - 5} كلمات أخرى
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <Card className="p-8 flex flex-col items-center text-center gap-5 animate-fade-up">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-success-500/15 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-success-500/15 text-success-400">
                <Check size={40} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">لا مراجعات متاحة</p>
              <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                أحسنت! لا توجد كلمات تحتاج مراجعة الآن.
                <br />
                تابع التعلّم وستظهر كلمات جديدة هنا تلقائياً.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-2xs text-text-muted">
              <Sparkles size={13} className="text-primary-500" />
              <span>المراجعة الذكية تظهر بعد كل درس</span>
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}

export default ReviewScreen;
