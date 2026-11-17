import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { useOnboardingStore, StartDateOption } from './onboardingStore';
import { getLocalDateString, formatFriendlyDate } from '../../utils/date';

export interface StartDateStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const StartDateStep: React.FC<StartDateStepProps> = ({ onNext, onBack }) => {
  const { startDateOption, customStartDate, setStartDateOption, getEffectiveStartDate } =
    useOnboardingStore();

  const [dateInput, setDateInput] = useState(customStartDate);

  const todayStr = getLocalDateString();
  const firstOfMonthStr = getLocalDateString(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const effectiveDate = getEffectiveStartDate();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Step 4 of 5</Text>
          <Text style={styles.title}>Tracking Start Date</Text>
          <Text style={styles.subtitle}>
            Cashly calculates analytics and monitors transactions from this date forward. Past messages will never clutter your ledger.
          </Text>
        </View>

        {/* Selected Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions will be tracked from</Text>
          <Text style={styles.summaryDate}>
            {formatFriendlyDate(effectiveDate, { includeYear: true })}
          </Text>
          <Text style={styles.summaryHint}>
            Opening balances apply as of this starting date.
          </Text>
        </View>

        {/* Options Selection */}
        <View style={styles.optionsList}>
          {/* Option 1: Today */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setStartDateOption('TODAY')}
            style={[
              styles.optionCard,
              startDateOption === 'TODAY' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioCircle,
                  startDateOption === 'TODAY' && styles.radioCircleSelected,
                ]}
              >
                {startDateOption === 'TODAY' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Today</Text>
                <Text style={styles.optionTag}>Recommended</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Clean start ({formatFriendlyDate(todayStr, { includeYear: true })}). Your entered balances represent your exact position right now.
            </Text>
          </TouchableOpacity>

          {/* Option 2: 1st of Current Month */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setStartDateOption('FIRST_OF_MONTH')}
            style={[
              styles.optionCard,
              startDateOption === 'FIRST_OF_MONTH' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioCircle,
                  startDateOption === 'FIRST_OF_MONTH' && styles.radioCircleSelected,
                ]}
              >
                {startDateOption === 'FIRST_OF_MONTH' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>1st of this Month</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Start from {formatFriendlyDate(firstOfMonthStr, { includeYear: true })} for a full monthly view.
            </Text>
          </TouchableOpacity>

          {/* Option 3: Custom Date */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setStartDateOption('CUSTOM', dateInput)}
            style={[
              styles.optionCard,
              startDateOption === 'CUSTOM' && styles.optionCardSelected,
            ]}
          >
            <View style={styles.radioRow}>
              <View
                style={[
                  styles.radioCircle,
                  startDateOption === 'CUSTOM' && styles.radioCircleSelected,
                ]}
              >
                {startDateOption === 'CUSTOM' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Choose Custom Date</Text>
              </View>
            </View>
            <Text style={styles.optionDescription}>
              Pick any earlier date if you want to track a specific period.
            </Text>

            {startDateOption === 'CUSTOM' && (
              <View style={styles.customDateInputContainer}>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                  value={dateInput}
                  onChangeText={(val) => {
                    setDateInput(val);
                    setStartDateOption('CUSTOM', val);
                  }}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Footer */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNext}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Review & Confirm</Text>
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
  summaryCard: {
    backgroundColor: theme.colors.cardElevated,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xl,
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  summaryHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  optionsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
  customDateInputContainer: {
    marginTop: theme.spacing.md,
    paddingLeft: 36,
  },
  customDateInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
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

