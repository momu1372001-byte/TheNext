import { GraduationCap } from 'lucide-react';
import appConfig from '@/data/app.json';

type SplashScreenProps = {
  onFinish: () => void;
};

export function SplashScreen({ onFinish }: SplashScreenProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-bg px-6 text-center animate-fade-in"
      onClick={onFinish}
    >
      <div className="animate-scale-in flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-primary-500/30 blur-2xl animate-pulse-glow" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 shadow-glow">
            <GraduationCap size={48} className="text-neutral-950" strokeWidth={2.2} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-text-primary animate-fade-up">
          {appConfig.appNameAr}
        </h1>
        <p className="mt-2 text-sm text-text-secondary animate-fade-up ltr" style={{ animationDelay: '80ms' }}>
          {appConfig.appNameEn}
        </p>
        <p className="mt-6 text-base text-text-muted animate-fade-up" style={{ animationDelay: '160ms' }}>
          {appConfig.taglineAr}
        </p>
      </div>

      <div className="absolute bottom-12 flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-bounce" />
        </div>
        <span className="text-2xs text-text-muted">اضغط للمتابعة</span>
      </div>
    </div>
  );
}

export default SplashScreen;
