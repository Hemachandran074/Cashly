import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useOnboardingStore } from './onboardingStore';
import { WelcomeStep } from './WelcomeStep';
import { AccountsStep } from './AccountsStep';
import { SmsPermissionStep } from './SmsPermissionStep';
import { StartDateStep } from './StartDateStep';
import { ReviewStep } from './ReviewStep';

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { step, setStep, nextStep, prevStep } = useOnboardingStore();

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header with Segmented Progress Bar & Skip */}
      <View style={styles.topBar}>
        <View style={styles.progressBar}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i <= step && styles.progressSegmentActive,
              ]}
            />
          ))}
        </View>

        {step < 5 && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step Views */}
      <View style={styles.stepContainer}>
        {step === 1 && (
          <WelcomeStep onNext={nextStep} onSkip={handleSkip} />
        )}
        {step === 2 && (
          <AccountsStep onNext={nextStep} onBack={prevStep} />
        )}
        {step === 3 && (
          <SmsPermissionStep onNext={nextStep} onBack={prevStep} />
        )}
        {step === 4 && (
          <StartDateStep onNext={nextStep} onBack={prevStep} />
        )}
        {step === 5 && (
          <ReviewStep onFinish={onComplete} onGoToStep={(s) => setStep(s)} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.borderSubtle,
  },
  progressSegmentActive: {
    backgroundColor: theme.colors.text,
  },
  skipButton: {
    paddingLeft: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.typography.sizes.xs + 1,
    color: theme.colors.textMuted,
    fontWeight: theme.typography.weights.medium,
  },
  stepContainer: {
    flex: 1,
  },
});

