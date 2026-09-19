import { useEffect, useState } from 'react';
import { PhoneFrame, TabBar } from '@/components/ui';
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LearnScreen } from '@/screens/LearnScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { ProgressScreen } from '@/screens/ProgressScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import type { OnboardingState, TabKey } from '@/types';
import { loadProfile, saveProfile, clearProfile } from '@/data/profileStore';

type Phase = 'splash' | 'onboarding' | 'app';

const INITIAL_PROFILE: OnboardingState = {
  level: null,
  dailyGoal: 0,
  completed: false,
};

function App() {
  const [phase, setPhase] = useState<Phase>('splash');
  const [profile, setProfile] = useState<OnboardingState>(INITIAL_PROFILE);
  const [tab, setTab] = useState<TabKey>('learn');

  // Load saved profile on mount — returning users skip onboarding.
  useEffect(() => {
    const saved = loadProfile();
    if (saved.completed) {
      setProfile(saved);
      setPhase('app');
    }
  }, []);

  // Auto-advance splash after a short delay even if user doesn't tap.
  useEffect(() => {
    if (phase !== 'splash') return;
    const t = setTimeout(() => setPhase('onboarding'), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleOnboardingComplete = (level: OnboardingState['level'], dailyGoal: number) => {
    const next = { level, dailyGoal, completed: true };
    saveProfile(next);
    setProfile(next);
    setPhase('app');
    setTab('learn');
  };

  const handleUpdateProfile = (partial: Partial<OnboardingState>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial };
      saveProfile(next);
      return next;
    });
  };

  const handleResetOnboarding = () => {
    clearProfile();
    setProfile(INITIAL_PROFILE);
    setPhase('onboarding');
  };

  const renderTab = () => {
    switch (tab) {
      case 'learn':
        return <LearnScreen profile={profile} />;
      case 'review':
        return <ReviewScreen />;
      case 'progress':
        return <ProgressScreen profile={profile} />;
      case 'profile':
        return (
          <ProfileScreen
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetOnboarding={handleResetOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PhoneFrame>
      {phase === 'splash' && <SplashScreen onFinish={() => setPhase('onboarding')} />}

      {phase === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}

      {phase === 'app' && (
        <>
          <main className="flex flex-1 min-h-0 flex-col">{renderTab()}</main>
          <TabBar active={tab} onChange={setTab} />
        </>
      )}
    </PhoneFrame>
  );
}

export default App;
