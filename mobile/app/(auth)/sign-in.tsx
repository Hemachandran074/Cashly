import React from 'react';
import { useRouter } from 'expo-router';
import { SignInScreen } from '../../src/features/auth/SignInScreen';

export default function SignInRoute() {
  const router = useRouter();

  return (
    <SignInScreen
      onNavigateToSignUp={() => router.push('/(auth)/sign-up')}
      onSuccess={() => router.replace('/(tabs)')}
    />
  );
}

