import { ChartBar as BarChart3, TrendingUp, CalendarDays, Award } from 'lucide-react';
import { Screen, ScreenHeader, Card, ProgressBar } from '@/components/ui';
import { getWordsByLevel, getAppConfig, getLevelByCode } from '@/data/vocabularyRepository';
import type { OnboardingState } from '@/types';

type ProgressScreenProps = {
  profile: OnboardingState;
};

export function ProgressScreen({ profile }: ProgressScreenProps) {
  const targetTotal = getAppConfig().totalWords;
  const levelWordCount = profile.level ? getWordsByLevel(profile.level).length : 0;
  const levelMeta = profile.level ? getLevelByCode(profile.level) : undefined;
  const learnedTotal = 0;

  const stats = [
    { icon: <TrendingUp size={18} />, labelAr: 'كلمات تعلّمتها', value: String(learnedTotal), color: 'text-primary-500' },
    { icon: <CalendarDays size={18} />, labelAr: 'أيام متتالية', value: '0', color: 'text-success-400' },
    { icon: <Award size={18} />, labelAr: 'كلمات مستواك', value: String(levelWordCount), color: 'text-accent-400' },
  ];

  return (
    <Screen>
      <ScreenHeader
        titleAr="تقدّمي"
        subtitleAr="تابع رحلتك في تعلّم الإنجليزية"
        icon={<BarChart3 size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {/* Overall progress */}
        <Card raised className="p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text-primary">إجمالي التقدّم</span>
            <span className="text-sm text-text-secondary ltr">{learnedTotal} / {targetTotal}</span>
          </div>
          <ProgressBar value={learnedTotal} max={targetTotal} />
          <p className="text-2xs text-text-muted mt-2">
            المستوى الحالي: {levelMeta?.nameAr ?? profile.level ?? '—'}
          </p>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <Card
              key={s.labelAr}
              className="p-4 flex flex-col items-center gap-2 text-center animate-fade-up"
            >
              <span className={s.color}>{s.icon}</span>
              <span className="text-xl font-bold text-text-primary ltr">{s.value}</span>
              <span className="text-2xs text-text-muted leading-tight">{s.labelAr}</span>
            </Card>
          ))}
        </div>

        {/* Weekly placeholder */}
        <Card className="p-5 animate-fade-up" >
          <p className="text-sm font-semibold text-text-primary mb-3">نشاط هذا الأسبوع</p>
          <div className="flex items-end justify-between gap-2 h-24">
            {['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'].map((day, i) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="w-full rounded-md bg-white/5" style={{ height: `${10 + (i === 6 ? 30 : 0)}%` }}>
                  <div className="h-full w-full rounded-md bg-primary-500/20" />
                </div>
                <span className="text-2xs text-text-muted">{day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  );
}

export default ProgressScreen;
