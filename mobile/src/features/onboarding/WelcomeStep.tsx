import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Mail, Users, ArrowLeftRight } from 'lucide-react-native';
import { theme } from '../../theme';

export interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext, onSkip }) => {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Eyebrow */}
      <View style={styles.header}>
        <Text style={styles.brand}>Cashly</Text>
        <Text style={styles.title}>Money clarity,{'\n'}without the noise.</Text>
        <Text style={styles.subtitle}>
          A private, Android-first ledger tailored for how money moves in India—across UPI, bank transfers, and cash swaps.
        </Text>
      </View>

      {/* 3 Core Pillars */}
      <View style={styles.pillarsList}>
        <View style={styles.pillarCard}>
          <View style={styles.pillarIconCircle}>
            <Mail size={18} color={theme.colors.text} strokeWidth={2} />
          </View>
          <View style={styles.pillarContent}>
            <Text style={styles.pillarTitle}>SMS to Ledger in One Tap</Text>
            <Text style={styles.pillarBody}>
              Payment alerts are pre-parsed into drafts. Nothing is ever auto-confirmed without your explicit review.
            </Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <View style={styles.pillarIconCircle}>
            <Users size={18} color={theme.colors.text} strokeWidth={2} />
          </View>
          <View style={styles.pillarContent}>
            <Text style={styles.pillarTitle}>People & Informal Lending</Text>
            <Text style={styles.pillarBody}>
              Track money sent to or received from people. Keep a transparent record of who owes whom.
            </Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <View style={styles.pillarIconCircle}>
            <ArrowLeftRight size={18} color={theme.colors.text} strokeWidth={2} />
          </View>
          <View style={styles.pillarContent}>
            <Text style={styles.pillarTitle}>Neutral Digital ↔ Cash Swaps</Text>
            <Text style={styles.pillarBody}>
              Exchanging UPI for cash with a friend moves balances between your accounts without falsely inflating spending.
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onNext}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSkip}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Set up later</Text>
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
    marginBottom: theme.spacing['3xl'],
  },
  brand: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes['3xl'],
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    letterSpacing: -1,
    lineHeight: theme.typography.lineHeights['3xl'],
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.base,
  },
  pillarsList: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing['3xl'],
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: theme.spacing.md,
  },
  pillarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillarContent: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  pillarBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    lineHeight: theme.typography.lineHeights.sm,
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
