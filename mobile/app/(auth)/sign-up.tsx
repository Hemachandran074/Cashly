import React from 'react';
import { useRouter } from 'expo-router';
import { SignUpScreen } from '../../src/features/auth/SignUpScreen';

export default function SignUpRoute() {
  const router = useRouter();

  return (
    <SignUpScreen
      onNavigateToSignIn={() => router.push('/(auth)/sign-in')}
      onSuccess={() => router.replace('/(onboarding)')}
    />
  );
}

