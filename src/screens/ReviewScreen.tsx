import { RotateCcw, Clock } from 'lucide-react';
import { Screen, ScreenHeader, Card, Button } from '@/components/ui';

export function ReviewScreen() {
  return (
    <Screen>
      <ScreenHeader
        titleAr="مراجعة"
        subtitleAr="راجع ما تعلّمته لتثبيته في ذاكرتك"
        icon={<RotateCcw size={22} />}
      />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <Card className="p-6 flex flex-col items-center text-center gap-4 animate-fade-up">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-500/15 text-success-400">
            <Clock size={30} />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">لا مراجعات متاحة الآن</p>
            <p className="text-sm text-text-muted mt-1">
              بمجرد أن تتعلّم كلمات، ستظهر هنا للمراجعة الذكية
            </p>
          </div>
          <Button variant="secondary" size="md" disabled>
            ابدأ المراجعة
          </Button>
        </Card>
      </div>
    </Screen>
  );
}

export default ReviewScreen;
