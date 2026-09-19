import { User, GraduationCap, Target, Bell, HelpCircle, Star } from 'lucide-react';
import { Screen, ScreenHeader, Card, Button } from '@/components/ui';
import type { OnboardingState } from '@/types';
import levels from '@/data/levels.json';
import goals from '@/data/goals.json';
import type { DailyGoal, Level } from '@/types';

type ProfileScreenProps = {
  profile: OnboardingState;
  onResetOnboarding: () => void;
};

export function ProfileScreen({ profile, onResetOnboarding }: ProfileScreenProps) {
  const typedLevels = levels as Level[];
  const typedGoals = goals as DailyGoal[];
  const currentLevel = typedLevels.find((l) => l.code === profile.level);
  const currentGoal = typedGoals.find((g) => g.value === profile.dailyGoal);

  const settings = [
    { icon: <Bell size={18} />, labelAr: 'الإشعارات', hintAr: 'تذكير يومي' },
    { icon: <Star size={18} />, labelAr: 'تقييم التطبيق', hintAr: 'شاركنا رأيك' },
    { icon: <HelpCircle size={18} />, labelAr: 'المساعدة والدعم', hintAr: 'الأسئلة الشائعة' },
  ];

  return (
    <Screen>
      <ScreenHeader
        titleAr="حسابي"
        subtitleAr="إعداداتك وتفضيلاتك"
        icon={<User size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {/* User card */}
        <Card raised className="p-5 flex items-center gap-4 animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-neutral-950">
            <GraduationCap size={32} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-text-primary">متعلم جديد</p>
            <p className="text-sm text-text-muted">
              {currentLevel?.nameAr ?? '—'} · {currentLevel?.code}
            </p>
          </div>
        </Card>

        {/* Current preferences */}
        <div className="flex flex-col gap-3">
          <p className="text-2xs font-semibold text-text-muted px-1">تفضيلاتك الحالية</p>

          <Card className="p-4 flex items-center gap-3 animate-fade-up">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500">
              <GraduationCap size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">المستوى</p>
              <p className="text-2xs text-text-muted">{currentLevel?.nameAr} — {currentLevel?.descriptionAr}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3 animate-fade-up">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500/15 text-success-400">
              <Target size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">الهدف اليومي</p>
              <p className="text-2xs text-text-muted">{currentGoal?.labelAr} — {currentGoal?.hintAr}</p>
            </div>
          </Card>
        </div>

        {/* Settings list */}
        <div className="flex flex-col gap-3">
          <p className="text-2xs font-semibold text-text-muted px-1">الإعدادات</p>
          {settings.map((s) => (
            <Card key={s.labelAr} className="p-4 flex items-center gap-3 animate-fade-up">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-text-secondary">
                {s.icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{s.labelAr}</p>
                <p className="text-2xs text-text-muted">{s.hintAr}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-2">
          <Button variant="ghost" fullWidth onClick={onResetOnboarding}>
            إعادة ضبط المستوى والهدف
          </Button>
        </div>
      </div>
    </Screen>
  );
}

export default ProfileScreen;
