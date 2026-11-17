import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingScreen } from '../../src/features/onboarding/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}

