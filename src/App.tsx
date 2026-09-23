import { useEffect, useState } from 'react';
import { PhoneFrame, TabBar } from '@/components/ui';
import { loadProfile, saveProfile, updateProfile, clearProfile } from '@/data/profileStore';
import { resetProgress, subscribe } from '@/data/progressStore';
import type { OnboardingState, TabKey } from '@/types';
import OnboardingScreen from '@/screens/OnboardingScreen';
import LearnScreen from '@/screens/LearnScreen';
import ReviewScreen from '@/screens/ReviewScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import SettingsScreen from '@/SettingsScreen';
import { useSettings } from '@/useSettings';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import AuthScreen from '@/screens/AuthScreen';

const AUTH_SKIP_KEY = 'words-app-auth-skipped';

function AppInner() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<OnboardingState>(() => loadProfile());
  const [activeTab, setActiveTab] = useState<TabKey>('learn');
  const [showSettings, setShowSettings] = useState(false);
  const [authSkipped, setAuthSkipped] = useState(() => localStorage.getItem(AUTH_SKIP_KEY) === 'true');
  useSettings();

  // Re-render on progress store changes (streak/XP updates, etc.)
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const handleOnboardingComplete = (level: OnboardingState['level'], dailyGoal: number) => {
    const next = { level, dailyGoal, completed: true };
    saveProfile(next);
    setProfile(next);
  };

  const handleUpdateProfile = (partial: Partial<OnboardingState>) => {
    const next = updateProfile(partial);
    setProfile(next);
  };

  const handleResetOnboarding = () => {
    clearProfile();
    resetProgress();
    setProfile({ level: null, dailyGoal: 0, completed: false });
    setActiveTab('learn');
  };

  const handleSkipAuth = () => {
    localStorage.setItem(AUTH_SKIP_KEY, 'true');
    setAuthSkipped(true);
  };

  // Show nothing while auth is loading
  if (loading) {
    return (
      <PhoneFrame>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
        </div>
      </PhoneFrame>
    );
  }

  // Show auth screen if not logged in and not skipped
  if (!user && !authSkipped) {
    return (
      <PhoneFrame>
        <AuthScreen onSkip={handleSkipAuth} />
      </PhoneFrame>
    );
  }

  // Show onboarding if not completed
  if (!profile.completed || !profile.level) {
    return (
      <PhoneFrame>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </PhoneFrame>
    );
  }

  // Settings overlay (accessible from profile tab)
  if (showSettings) {
    return (
      <PhoneFrame>
        <SettingsScreen
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onResetProgress={resetProgress}
          onBack={() => setShowSettings(false)}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      {activeTab === 'learn' && <LearnScreen profile={profile} />}
      {activeTab === 'review' && <ReviewScreen />}
      {activeTab === 'progress' && <ProgressScreen profile={profile} />}
      {activeTab === 'profile' && (
        <ProfileScreen
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onResetOnboarding={handleResetOnboarding}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
