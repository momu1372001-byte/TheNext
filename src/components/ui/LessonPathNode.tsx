import { Lock, Star, Check } from 'lucide-react';
import { CategoryIcon } from '@/components/ui';
import type { Category, Lesson } from '@/types';

export type LessonStatus = 'completed' | 'active' | 'locked';

type LessonPathNodeProps = {
  lesson: Lesson;
  category?: Category;
  status: LessonStatus;
  progressText: string;
  stars: number;
  index: number;
  isLast: boolean;
  onTap: () => void;
};

/**
 * A single node in the vertical zigzag learning path.
 * Circular nodes alternate left/right, connected by an SVG-free
 * CSS dashed line. Active/completed nodes show a lesson card beside them.
 */
export function LessonPathNode({
  lesson,
  category,
  status,
  progressText,
  stars,
  index,
  isLast,
  onTap,
}: LessonPathNodeProps) {
  const side = index % 2 === 0 ? 'right' : 'left';

  const nodeStyles: Record<LessonStatus, string> = {
    completed:
      'bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow',
    active:
      'bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950 shadow-glow ring-4 ring-primary-500/25 animate-pulse-glow',
    locked: 'bg-surface-raised text-text-muted border-2 border-border',
  };

  const cardStyles: Record<LessonStatus, string> = {
    completed: 'border-primary-500/40 bg-surface',
    active: 'border-primary-500/60 bg-surface shadow-glow',
    locked: 'border-border/50 bg-surface/50 opacity-60',
  };

  const showCard = status !== 'locked';

  return (
    <div
      className="relative flex items-start gap-4 animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Connecting dashed line — sits behind the node */}
      {!isLast && (
        <div
          className={`absolute top-12 bottom-[-2px] w-px border-l-2 border-dashed ${
            status === 'completed' ? 'border-primary-500/50' : 'border-border/60'
          } ${side === 'right' ? 'right-[27px]' : 'left-[27px]'}`}
          aria-hidden
        />
      )}

      {/* Spacer for alternating layout */}
      {side === 'left' && <div className="flex-1" />}

      {/* Node circle */}
      <div className="relative z-10 shrink-0 flex flex-col items-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ${nodeStyles[status]}`}
        >
          {status === 'completed' ? (
            <Check size={24} strokeWidth={3} />
          ) : status === 'active' ? (
            <span className="text-xl font-bold ltr">{index + 1}</span>
          ) : (
            <Lock size={20} />
          )}
        </div>
      </div>

      {/* Lesson card beside the node */}
      {showCard ? (
        <button
          onClick={onTap}
          className={`flex flex-1 min-w-0 flex-col gap-1.5 rounded-2xl border p-4 text-right transition-all duration-200 ${cardStyles[status]} cursor-pointer hover:border-primary-500/60 hover:-translate-y-0.5 active:translate-y-0`}
        >
          {/* Title + category icon */}
          <div className="flex items-center gap-2">
            {category && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-500">
                <CategoryIcon name={category.icon} size={16} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate text-text-primary">{lesson.titleAr}</p>
              <p className="text-2xs text-text-muted truncate ltr">{lesson.titleEn}</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-2xs text-text-muted truncate">{lesson.descriptionAr}</p>

          {/* Bottom row: progress + stars */}
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-2xs font-semibold ${
                status === 'completed'
                  ? 'text-success-400'
                  : 'text-primary-500'
              }`}
            >
              {progressText}
            </span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((s) => (
                <Star
                  key={s}
                  size={12}
                  className={s < stars ? 'text-primary-500' : 'text-white/15'}
                  fill={s < stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
        </button>
      ) : (
        <div className={`flex flex-1 min-w-0 flex-col gap-1 rounded-2xl border p-4 ${cardStyles[status]}`}>
          <div className="flex items-center gap-2">
            {category && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-text-muted">
                <CategoryIcon name={category.icon} size={16} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate text-text-muted">{lesson.titleAr}</p>
              <p className="text-2xs text-text-muted truncate ltr">{lesson.titleEn}</p>
            </div>
          </div>
          <p className="text-2xs text-text-muted truncate">{lesson.descriptionAr}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xs font-semibold text-text-muted">{progressText}</span>
            <div className="flex gap-0.5">
              {[0, 1, 2].map((s) => (
                <Star key={s} size={12} className="text-white/10" fill="none" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for alternating layout */}
      {side === 'right' && <div className="flex-1" />}
    </div>
  );
}

export default LessonPathNode;
