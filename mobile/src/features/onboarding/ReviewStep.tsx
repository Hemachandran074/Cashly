import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';
import { useOnboardingStore } from './onboardingStore';
import { formatIndianRupees } from '../../utils/money';
import { formatFriendlyDate } from '../../utils/date';

export interface ReviewStepProps {
  onFinish: () => void;
  onGoToStep: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ onFinish, onGoToStep }) => {
  const {
    accounts,
    smsPreference,
    getEffectiveStartDate,
    getTotalOpeningBalancePaise,
    isSubmitting,
    error,
    completeOnboarding,
  } = useOnboardingStore();

  const totalBalancePaise = getTotalOpeningBalancePaise();
  const effectiveStartDate = getEffectiveStartDate();

  const handleFinish = async () => {
    const success = await completeOnboarding();
    if (success) {
      onFinish();
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Step 5 of 5</Text>
          <Text style={styles.title}>Review & Confirm</Text>
          <Text style={styles.subtitle}>
            You're all set! Review your baseline configuration below. You can adjust these anytime in Settings.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Section 1: Accounts & Baseline */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Starting Balance</Text>
            <TouchableOpacity onPress={() => onGoToStep(2)} activeOpacity={0.7}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.totalBalanceAmount}>
            {formatIndianRupees(totalBalancePaise)}
          </Text>

          <View style={styles.accountsBreakdown}>
            {accounts.map((acc) => (
              <View key={acc.id} style={styles.accountRow}>
                <View style={styles.accountRowLeft}>
                  <Text style={styles.accountType}>{acc.type}</Text>
                  <Text style={styles.accountName}>{acc.name}</Text>
                </View>
                <Text style={styles.accountAmount}>
                  {formatIndianRupees(acc.opening_balance_paise)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: SMS Mode */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SMS Detection</Text>
            <TouchableOpacity onPress={() => onGoToStep(3)} activeOpacity={0.7}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {smsPreference === 'SMS_ALLOWED'
                ? 'Automatic Bank SMS Reading'
                : 'Manual Entry & Paste SMS'}
            </Text>
            <Text style={styles.infoNote}>
              {smsPreference === 'SMS_ALLOWED'
                ? 'Only financial SMS will draft transactions; nothing is auto-confirmed.'
                : 'No permissions requested. Paste messages or enter manually anytime.'}
            </Text>
          </View>
        </View>

        {/* Section 3: Tracking Start Date */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tracking Start Date</Text>
            <TouchableOpacity onPress={() => onGoToStep(4)} activeOpacity={0.7}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {formatFriendlyDate(effectiveStartDate, { includeYear: true })}
            </Text>
            <Text style={styles.infoNote}>
              Transactions before this date will not impact your balances.
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFinish}
          disabled={isSubmitting}
          style={styles.primaryButton}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.textInverted} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Start Tracking Money</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onGoToStep(4)}
          disabled={isSubmitting}
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
  errorBanner: {
    backgroundColor: theme.colors.debitMuted,
    borderColor: theme.colors.debitBorder,
    borderWidth: 1,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.debit,
    fontSize: theme.typography.sizes.sm,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.semibold,
  },
  totalBalanceAmount: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.md,
  },
  accountsBreakdown: {
    gap: theme.spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  accountType: {
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.cardElevated,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  accountName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  accountAmount: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  infoRow: {
    gap: 4,
  },
  infoValue: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  infoNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    lineHeight: 18,
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

