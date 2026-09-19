import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, Check, X, RotateCcw, Star, Trophy, Volume2 } from 'lucide-react';
import { Screen, ProgressBar, Button } from '@/components/ui';
import { getLessonById, getCategoryById, getWordsByLesson } from '@/data/vocabularyRepository';
import { markLessonComplete, recordWordAnswer } from '@/data/progressStore';
import type { Word } from '@/types';

type LessonPracticeScreenProps = {
  lessonId: string;
  onBack: () => void;
};

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

function buildExercises(words: Word[]): Exercise[] {
  const arabicPool = words.map((w) => w.arabicTranslation);
  const englishPool = words.map((w) => w.word);
  const exercises: Exercise[] = [];

  for (const word of words) {
    // Type 1: English word → choose Arabic meaning
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

    // Type 2: Arabic meaning → choose English word
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

const TYPE_LABELS: Record<ExerciseType, string> = {
  'en-to-ar': 'اختر المعنى العربي الصحيح',
  'ar-to-en': 'اختر الكلمة الإنجليزية الصحيحة',
  'fill-blank': 'أكمل الفراغ بالكلمة الصحيحة',
};

export function LessonPracticeScreen({ lessonId, onBack }: LessonPracticeScreenProps) {
  const lesson = getLessonById(lessonId);
  const words = useMemo(() => (lesson ? getWordsByLesson(lessonId) : []), [lessonId]);
  const category = lesson ? getCategoryById(lesson.category) : undefined;

  const [exercises, setExercises] = useState<Exercise[]>(() => buildExercises(words));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [phase, setPhase] = useState<'practice' | 'done'>('practice');

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
      const score = Math.round((correctCount / exercises.length) * 100);
      markLessonComplete(lessonId, score, words.map((w) => w.id));
      setPhase('done');
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    }
  }, [currentIdx, exercises.length, correctCount, lessonId, words]);

  const handleRestart = useCallback(() => {
    setExercises(buildExercises(words));
    setCurrentIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
    setWrongWords([]);
    setPhase('practice');
  }, [words]);

  if (!lesson || words.length === 0 || !current) {
    return (
      <Screen>
        <div className="flex items-center justify-center flex-1 text-text-muted text-sm">
          الدرس غير متاح
        </div>
      </Screen>
    );
  }

  // --- Done phase ---
  if (phase === 'done') {
    const total = exercises.length;
    const score = Math.round((correctCount / total) * 100);
    const stars = Math.max(1, Math.round(score / 33.3));

    return (
      <Screen scroll={false}>
        <div className="flex flex-col items-center justify-center flex-1 px-6 gap-6 animate-scale-in">
          {/* Trophy */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
              <Trophy size={48} className="text-neutral-950" strokeWidth={2.2} />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-text-primary">أحسنت!</h2>
            <p className="text-sm text-text-muted mt-1">أكملت درس «{lesson.titleAr}»</p>
          </div>

          {/* Score */}
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

          {/* Stars */}
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

          {/* Wrong words review */}
          {wrongWords.length > 0 && (
            <div className="w-full max-w-sm">
              <p className="text-2xs font-semibold text-text-muted mb-2 text-center">كلمات للمراجعة</p>
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
            <Button fullWidth size="lg" icon={<RotateCcw size={18} />} onClick={handleRestart}>
              تمرين آخر
            </Button>
            <Button fullWidth size="md" variant="ghost" onClick={onBack}>
              العودة للدروس
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  // --- Practice phase ---
  const isCorrect = selected === current.correctAnswer;
  const isLast = currentIdx === exercises.length - 1;

  return (
    <Screen scroll={false}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="رجوع"
        >
          <ChevronLeft size={18} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-text-primary truncate">{lesson.titleAr}</h1>
          <p className="text-2xs text-text-muted">
            {currentIdx + 1} من {exercises.length}
          </p>
        </div>
        {category && (
          <span className="rounded-pill bg-primary-500/15 px-3 py-1 text-2xs font-semibold text-primary-500 shrink-0">
            {category.nameAr}
          </span>
        )}
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
        {/* Prompt card */}
        <div
          key={currentIdx}
          className="flex flex-col items-center text-center gap-3 pt-4 animate-fade-up"
        >
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
                <span
                  className={`font-semibold text-lg ${current.isArabicOptions ? 'text-xl' : 'ltr'}`}
                >
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
                  <p
                    className={`font-bold ${isCorrect ? 'text-success-400' : 'text-error-400'}`}
                  >
                    {isCorrect ? 'إجابة صحيحة!' : 'إجابة خاطئة'}
                  </p>
                  {!isCorrect && (
                    <p className="text-2xs text-text-muted mt-0.5">
                      الإجابة الصحيحة:{' '}
                      <span className="text-text-secondary font-medium">
                        {current.isArabicOptions ? current.correctAnswer : current.correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
                {/* Word detail */}
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

export default LessonPracticeScreen;
