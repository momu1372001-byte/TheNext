import { ChevronLeft, Play, RefreshCw, Check, Lock, Star } from 'lucide-react';
import { Screen, Card, ProgressBar, CategoryIcon } from '@/components/ui';
import { getLessonsByLevel, getCategoryById, getWordsByLesson, getLevelByCode } from '@/data/vocabularyRepository';
import { isLessonCompleted, getLessonProgress } from '@/data/progressStore';
import type { Lesson, LevelCode } from '@/types';

type LessonListScreenProps = {
  levelCode: LevelCode;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
};

export function LessonListScreen({ levelCode, onBack, onOpenLesson }: LessonListScreenProps) {
  const level = getLevelByCode(levelCode);
  const lessons = getLessonsByLevel(levelCode);
  const completedCount = lessons.filter((l: Lesson) => isLessonCompleted(l.id)).length;
  const overallPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <Screen>
      {/* Dark header with unit title */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 shrink-0 border-b border-border/40">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="رجوع"
        >
          <ChevronLeft size={18} className="rotate-180" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {level && (
              <span
                className="flex h-7 w-9 items-center justify-center rounded-md text-2xs font-bold ltr"
                style={{ backgroundColor: `${level.color}22`, color: level.color }}
              >
                {level.code}
              </span>
            )}
            <h1 className="text-lg font-bold text-text-primary truncate">{level?.nameAr ?? levelCode}</h1>
          </div>
          <p className="text-2xs text-text-muted truncate">{level?.descriptionAr}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-8 pt-4">
        {/* Unit progress banner */}
        <Card raised className="p-4 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary">تقدّم المستوى</span>
            <span className="text-sm text-text-secondary ltr">{overallPct}%</span>
          </div>
          <ProgressBar value={completedCount} max={lessons.length} />
          <span className="text-2xs text-text-muted mt-2 block">
            {completedCount} من {lessons.length} دروس مكتملة
          </span>
        </Card>

        {/* Lesson cards */}
        <div className="flex flex-col gap-3">
          {lessons.map((lesson: Lesson, i: number) => {
            const category = getCategoryById(lesson.category);
            const words = getWordsByLesson(lesson.id);
            const completed = isLessonCompleted(lesson.id);
            const progress = getLessonProgress(lesson.id);
            const prevCompleted = i === 0 || isLessonCompleted(lessons[i - 1].id);
            const isLocked = !prevCompleted && !completed;
            const isActive = prevCompleted && !completed;

            const wordPreview = words.slice(0, 3).map((w) => w.word).join(' · ');
            const stars = progress ? Math.round(progress.bestScore / 33.3) : 0;

            return (
              <Card
                key={lesson.id}
                className={`p-4 animate-fade-up transition-all duration-200 ${
                  isLocked ? 'opacity-50' : 'hover:border-primary-500/50 hover:-translate-y-0.5'
                }`}
                onClick={isLocked ? undefined : () => onOpenLesson(lesson.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Lesson number / status icon */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all ${
                      completed
                        ? 'bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow'
                        : isActive
                        ? 'bg-primary-500/15 text-primary-500 ring-2 ring-primary-500/30'
                        : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    {completed ? (
                      <Check size={22} strokeWidth={3} />
                    ) : isActive ? (
                      <Play size={20} fill="currentColor" className="ltr:ml-0.5" />
                    ) : isLocked ? (
                      <Lock size={18} />
                    ) : (
                      <span className="text-base font-bold ltr">{i + 1}</span>
                    )}
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {category && (
                        <CategoryIcon name={category.icon} size={14} className="text-primary-500 shrink-0" />
                      )}
                      <p className={`font-bold text-sm truncate ${isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
                        {lesson.titleAr}
                      </p>
                    </div>
                    <p className="text-2xs text-text-muted truncate ltr mb-1">{wordPreview} · {words.length} كلمات</p>

                    {/* Stars or action label */}
                    <div className="flex items-center gap-2">
                      {completed ? (
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={s < stars ? 'text-primary-500' : 'text-white/15'}
                              fill={s < stars ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                      ) : isActive ? (
                        <span className="text-2xs font-semibold text-primary-500">ابدأ الآن</span>
                      ) : isLocked ? (
                        <span className="text-2xs text-text-muted">مقفل</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Play / restart icon */}
                  <div className="shrink-0">
                    {completed ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-white/5 text-text-muted">
                        <RefreshCw size={16} />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-primary-500 text-neutral-950">
                        <Play size={16} fill="currentColor" className="ltr:ml-0.5" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

export default LessonListScreen;
