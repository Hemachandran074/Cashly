import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react-native';
import { theme } from '../../theme';
import { useOnboardingStore, SmsPreference } from './onboardingStore';

export interface SmsPermissionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const SmsPermissionStep: React.FC<SmsPermissionStepProps> = ({
  onNext,
  onBack,
}) => {
  const { smsPreference, setSmsPreference } = useOnboardingStore();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Step 3 of 5</Text>
          <Text style={styles.title}>Automatic SMS Detection</Text>
          <Text style={styles.subtitle}>
            Cashly can read bank & UPI debit/credit notifications to auto-draft transactions for you.
          </Text>
        </View>

        {/* Permission Options */}
        <View style={styles.optionsList}>
          {/* Option 1: Auto-Read */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSmsPreference('SMS_ALLOWED')}
            style={[
              styles.optionCard,
              smsPreference === 'SMS_ALLOWED' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioCircle,
                  smsPreference === 'SMS_ALLOWED' && styles.radioCircleSelected,
                ]}
              >
                {smsPreference === 'SMS_ALLOWED' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Enable SMS Reading</Text>
                <Text style={styles.optionTag}>Fastest</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Transaction drafts are prepared automatically when you receive bank SMS. Confirm with a single tap.
            </Text>
          </TouchableOpacity>

          {/* Option 2: Paste / Manual */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSmsPreference('PASTE_OR_MANUAL')}
            style={[
              styles.optionCard,
              smsPreference === 'PASTE_OR_MANUAL' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioCircle,
                  smsPreference === 'PASTE_OR_MANUAL' && styles.radioCircleSelected,
                ]}
              >
                {smsPreference === 'PASTE_OR_MANUAL' && (
                  <View style={styles.radioDot} />
                )}
              </View>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Paste or Enter Manually</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              No SMS permissions requested. You can copy & paste SMS messages or add entries manually at any time.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy & Safety Guarantees */}
        <View style={styles.privacySection}>
          <Text style={styles.privacySectionTitle}>Our Privacy Guarantees</Text>

          <View style={styles.guaranteeRow}>
            <ShieldCheck size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.guaranteeText}>
              <Text style={styles.guaranteeStrong}>Financial SMS Only:</Text> Personal chats, OTPs, and authentication codes are filtered out immediately.
            </Text>
          </View>

          <View style={styles.guaranteeRow}>
            <CheckCircle2 size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.guaranteeText}>
              <Text style={styles.guaranteeStrong}>No Auto-Confirmation:</Text> Detected messages create drafts that require your review before updating balances.
            </Text>
          </View>

          <View style={styles.guaranteeRow}>
            <Lock size={18} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text style={styles.guaranteeText}>
              <Text style={styles.guaranteeStrong}>Zero Payment Power:</Text> Cashly cannot initiate transfers, request money, or modify bank accounts.
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation Footer */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNext}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing['3xl'],
    paddingBottom: theme.spacing['4xl'],
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: theme.spacing['2xl'],
  },
  stepIndicator: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.sm,
  },
  optionsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  optionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  optionCardSelected: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.cardElevated,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: theme.colors.text,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.text,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  optionTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  optionTag: {
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.credit,
    backgroundColor: theme.colors.creditMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.radii.xs,
  },
  optionDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.sm,
    paddingLeft: 36,
  },
  privacySection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  privacySectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  guaranteeText: {
    flex: 1,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  guaranteeStrong: {
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold,
  },
  actions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radii.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.textInverted,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
});
