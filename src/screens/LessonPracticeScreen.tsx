import { useState, useMemo } from 'react';
import { ChevronLeft, Volume2, Check, X, RotateCcw, Star, Trophy } from 'lucide-react';
import { Screen, Card, ProgressBar, Button } from '@/components/ui';
import { getLessonById, getCategoryById, getWordsByLesson } from '@/data/vocabularyRepository';
import { markLessonComplete } from '@/data/progressStore';
import type { Word } from '@/types';

type LessonPracticeScreenProps = {
  lessonId: string;
  onBack: () => void;
};

type Phase = 'study' | 'quiz' | 'done';

type QuizQuestion = {
  word: Word;
  options: string[]; // arabic translations
  correctAnswer: string;
};

const POS_LABELS: Record<string, string> = {
  noun: 'اسم',
  verb: 'فعل',
  adjective: 'صفة',
  adverb: 'ظرف',
  preposition: 'حرف جر',
  conjunction: 'أداة ربط',
  pronoun: 'ضمير',
  phrase: 'عبارة',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(words: Word[]): QuizQuestion[] {
  const allTranslations = shuffle(words).map((w) => w.arabicTranslation);

  return shuffle(words).map((word) => {
    const distractors = shuffle(allTranslations.filter((t) => t !== word.arabicTranslation)).slice(0, 3);
    return {
      word,
      options: shuffle([word.arabicTranslation, ...distractors]),
      correctAnswer: word.arabicTranslation,
    };
  });
}

export function LessonPracticeScreen({ lessonId, onBack }: LessonPracticeScreenProps) {
  const lesson = getLessonById(lessonId);
  const words = useMemo(() => lesson ? getWordsByLesson(lessonId) : [], [lessonId]);
  const category = lesson ? getCategoryById(lesson.category) : undefined;

  const [phase, setPhase] = useState<Phase>('study');
  const [studyIndex, setStudyIndex] = useState(0);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!lesson || words.length === 0) {
    return (
      <Screen>
        <div className="flex items-center justify-center flex-1 text-text-muted text-sm">
          الدرس غير متاح
        </div>
      </Screen>
    );
  }

  // --- Study phase: flashcard review ---
  if (phase === 'study') {
    const word = words[studyIndex];
    const isLast = studyIndex === words.length - 1;

    const handleNext = () => {
      if (isLast) {
        setQuiz(buildQuiz(words));
        setQuizIndex(0);
        setPhase('quiz');
      } else {
        setStudyIndex((i) => i + 1);
      }
    };

    return (
      <Screen>
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
              عرض الكلمات · {studyIndex + 1} من {words.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 pb-4">
          <ProgressBar value={studyIndex + 1} max={words.length} />
        </div>

        {/* Flashcard */}
        <div className="flex flex-col gap-4 px-5 pb-8 flex-1">
          <Card
            raised
            className="p-6 flex flex-col items-center text-center gap-4 animate-scale-in flex-1 justify-center"
            key={word.id}
          >
            {/* Category badge */}
            {category && (
              <span className="rounded-pill bg-primary-500/15 px-3 py-1 text-2xs font-semibold text-primary-500">
                {category.nameAr}
              </span>
            )}

            {/* Word */}
            <div>
              <h2 className="text-3xl font-bold text-text-primary ltr mb-2">{word.word}</h2>
              <p className="text-2xs text-text-muted ltr">{word.pronunciation}</p>
            </div>

            {/* Arabic translation */}
            <div className="w-full rounded-lg bg-white/5 p-4">
              <p className="text-xl font-bold text-primary-500 mb-1">{word.arabicTranslation}</p>
              <p className="text-2xs text-text-muted">{POS_LABELS[word.partOfSpeech] ?? word.partOfSpeech}</p>
            </div>

            {/* Definition */}
            <p className="text-sm text-text-secondary leading-relaxed">{word.englishDefinition}</p>

            {/* Example */}
            <div className="w-full rounded-md bg-white/5 p-3 text-right">
              <p className="text-sm text-text-primary ltr mb-1">{word.exampleSentence}</p>
              <p className="text-2xs text-text-muted">{word.arabicExampleTranslation}</p>
            </div>

            {/* Pronounce button */}
            <button
              className="flex items-center gap-2 text-2xs text-text-muted hover:text-primary-500 transition-colors"
              onClick={() => {
                try {
                  const utterance = new SpeechSynthesisUtterance(word.word);
                  utterance.lang = 'en-US';
                  window.speechSynthesis.speak(utterance);
                } catch {
                  // speech not available
                }
              }}
            >
              <Volume2 size={14} />
              <span>استمع للنطق</span>
            </button>
          </Card>

          <Button fullWidth size="lg" onClick={handleNext}>
            {isLast ? 'ابدأ الاختبار' : 'الكلمة التالية'}
          </Button>
        </div>
      </Screen>
    );
  }

  // --- Quiz phase ---
  if (phase === 'quiz') {
    const question = quiz[quizIndex];
    const isLast = quizIndex === quiz.length - 1;
    const isCorrect = selected === question.correctAnswer;

    const handleSelect = (option: string) => {
      if (answered) return;
      setSelected(option);
      setAnswered(true);
      if (option === question.correctAnswer) {
        setCorrectCount((c) => c + 1);
      }
    };

    const handleNext = () => {
      if (isLast) {
        const score = Math.round((correctCount / quiz.length) * 100);
        markLessonComplete(lessonId, score, words.map((w) => w.id));
        setPhase('done');
      } else {
        setQuizIndex((i) => i + 1);
        setSelected(null);
        setAnswered(false);
      }
    };

    return (
      <Screen>
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
              اختبار · {quizIndex + 1} من {quiz.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 pb-4">
          <ProgressBar value={quizIndex + (answered ? 1 : 0)} max={quiz.length} color={answered && !isCorrect ? 'bg-error-500' : 'bg-primary-500'} />
        </div>

        {/* Question */}
        <div className="flex flex-col gap-4 px-5 pb-8 flex-1">
          <Card className="p-6 flex flex-col items-center text-center gap-2 animate-fade-up" key={quizIndex}>
            <p className="text-2xs text-text-muted">ما معنى هذه الكلمة؟</p>
            <h2 className="text-3xl font-bold text-text-primary ltr">{question.word.word}</h2>
            <p className="text-2xs text-text-muted ltr">{question.word.pronunciation}</p>
          </Card>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {question.options.map((option) => {
              const isThisCorrect = option === question.correctAnswer;
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
                  onClick={() => handleSelect(option)}
                  disabled={answered}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-4 text-right transition-all duration-200 ${stateClass} ${
                    !answered ? 'cursor-pointer active:scale-[0.98]' : ''
                  }`}
                >
                  <span className="font-semibold">{option}</span>
                  {answered && isThisCorrect && <Check size={18} className="text-success-400 shrink-0" />}
                  {answered && isThisSelected && !isThisCorrect && <X size={18} className="text-error-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <Button fullWidth size="lg" onClick={handleNext} className="animate-fade-up">
              {isLast ? 'إنهاء الدرس' : 'السؤال التالي'}
            </Button>
          )}
        </div>
      </Screen>
    );
  }

  // --- Done phase ---
  const score = Math.round((correctCount / quiz.length) * 100);
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
            <span className="text-3xl font-bold text-success-400 ltr">{correctCount}/{quiz.length}</span>
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

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            fullWidth
            size="lg"
            icon={<RotateCcw size={18} />}
            onClick={() => {
              setStudyIndex(0);
              setQuizIndex(0);
              setSelected(null);
              setAnswered(false);
              setCorrectCount(0);
              setPhase('study');
            }}
          >
            إعادة الدرس
          </Button>
          <Button fullWidth size="md" variant="ghost" onClick={onBack}>
            العودة للدروس
          </Button>
        </div>
      </div>
    </Screen>
  );
}

export default LessonPracticeScreen;
