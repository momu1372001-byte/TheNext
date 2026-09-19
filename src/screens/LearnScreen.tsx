import { useState } from 'react';
import { BookOpen, Flame, ChevronLeft, Lock, Trophy, ArrowLeft } from 'lucide-react';
import {
  Screen,
  ScreenHeader,
  Card,
  ProgressBar,
  Button,
  CategoryIcon,
  WordCard,
  LessonPathNode,
  type LessonStatus,
} from '@/components/ui';
import {
  getLessonsByLevel,
  getWordsByLesson,
  getLessonById,
  getCategoryById,
  getLevelByCode,
} from '@/data/vocabularyRepository';
import type { Lesson, OnboardingState } from '@/types';

type LearnScreenProps = {
  profile: OnboardingState;
};

/**
 * Determines the status of each lesson in the path.
 * The first lesson is active, the rest are locked until the previous is completed.
 * (Learning progress is not yet persisted — all lessons start as locked/active.)
 */
function getLessonStatuses(lessons: Lesson[]): LessonStatus[] {
  return lessons.map((_, i) => {
    if (i === 0) return 'active';
    return 'locked';
  });
}

export function LearnScreen({ profile }: LearnScreenProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  const dailyGoal = profile.dailyGoal;
  const learnedToday = 0;
  const level = profile.level ? getLevelByCode(profile.level) : undefined;
  const lessons = profile.level ? getLessonsByLevel(profile.level) : [];
  const statuses = getLessonStatuses(lessons);
  const completedCount = statuses.filter((s) => s === 'completed').length;
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // --- Lesson detail view (unchanged behavior) ---
  if (openLessonId) {
    const lesson = getLessonById(openLessonId);
    if (!lesson) {
      setOpenLessonId(null);
      return null;
    }
    const category = getCategoryById(lesson.category);
    const lessonWords = getWordsByLesson(lesson.id);

    return (
      <Screen>
        <div className="flex items-center gap-3 px-5 pt-6 pb-3 shrink-0">
          <button
            onClick={() => setOpenLessonId(null)}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary"
            aria-label="رجوع"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">{lesson.titleAr}</h1>
            <p className="text-2xs text-text-muted truncate ltr">{lesson.titleEn}</p>
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 text-2xs text-text-muted">
            {category && <CategoryIcon name={category.icon} size={14} className="text-primary-500" />}
            <span>{category?.nameAr ?? ''}</span>
            <span>·</span>
            <span className="ltr">{lessonWords.length} كلمات</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-8">
          {lessonWords.map((w, i) => (
            <WordCard key={w.id} word={w} index={i} />
          ))}
        </div>
      </Screen>
    );
  }

  // --- Path / map view ---
  return (
    <Screen>
      {/* Header with unit name + overall progress */}
      <ScreenHeader
        titleAr="تعلّم"
        subtitleAr={level ? `${level.nameAr} · ${level.code}` : 'اختر مستواك أولاً'}
        icon={<BookOpen size={22} />}
      />

      {lessons.length === 0 ? (
        <div className="flex flex-col gap-4 px-5 pb-8">
          <Card className="p-6 flex flex-col items-center text-center gap-4 animate-fade-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15 text-primary-500">
              <BookOpen size={30} />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">ابدأ رحلتك</p>
              <p className="text-sm text-text-muted mt-1">
                اختر مستواك من شاشة الحساب لعرض الدروس
              </p>
            </div>
            <Button fullWidth size="lg" className="mt-1">
              ابدأ الآن
              <ArrowLeft size={18} className="rotate-180" />
            </Button>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-5 pb-8">
          {/* Unit progress banner */}
          <Card raised className="p-5 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-primary-500" />
                <span className="text-sm font-semibold text-text-primary">تقدّم الوحدة</span>
              </div>
              <span className="text-sm text-text-secondary ltr">{overallProgress}%</span>
            </div>
            <ProgressBar value={completedCount} max={lessons.length} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xs text-text-muted">
                {completedCount} من {lessons.length} دروس مكتملة
              </span>
              <span className="flex items-center gap-1 text-2xs text-text-muted">
                <Flame size={12} className="text-primary-500" />
                <span className="ltr">{learnedToday}/{dailyGoal}</span>
                <span>اليوم</span>
              </span>
            </div>
          </Card>

          {/* Section label */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-2xs font-semibold text-text-muted">مسار التعلّم</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Vertical path */}
          <div className="flex flex-col">
            {lessons.map((lesson, i) => {
              const category = getCategoryById(lesson.category);
              const status = statuses[i];
              const wordCount = lesson.wordIds.length;
              const progressText =
                status === 'completed'
                  ? `مكتمل · ${wordCount} كلمات`
                  : status === 'active'
                  ? `ابدأ الآن · ${wordCount} كلمات`
                  : `مقفل · ${wordCount} كلمات`;
              const stars = status === 'completed' ? 3 : 0;

              return (
                <LessonPathNode
                  key={lesson.id}
                  lesson={lesson}
                  category={category}
                  status={status}
                  progressText={progressText}
                  stars={stars}
                  index={i}
                  isLast={i === lessons.length - 1}
                  onTap={() => setOpenLessonId(lesson.id)}
                />
              );
            })}
          </div>

          {/* Locked next-unit teaser */}
          <div className="flex items-center justify-center gap-2 text-2xs text-text-muted pt-2">
            <Lock size={12} />
            <span>وحدات أكثر قادمة بعد إكمال هذه الدروس</span>
          </div>
        </div>
      )}
    </Screen>
  );
}

export default LearnScreen;
