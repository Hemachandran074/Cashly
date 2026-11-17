import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ArrowUp, ArrowDown, ArrowLeftRight, Sparkles, Plus, Layers } from 'lucide-react-native';
import { theme } from '../../theme';
import { formatIndianRupees } from '../../utils/money';
import { LiquidPressable } from './LiquidPressable';

export interface BalanceCardProps {
  userName?: string;
  totalBalancePaise: number;
  monthlyIncomePaise: number;
  monthlyExpensePaise: number;
  onSendPress?: () => void;
  onReceivePress?: () => void;
  onExchangePress?: () => void;
  onPasteSmsPress?: () => void;
  onNotificationStackPress?: () => void;
  pendingNotificationsCount?: number;
  style?: ViewStyle;
  // Inverted: White card with black typography (vice versa of reference image)
  inverted?: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  userName = 'Chandru',
  totalBalancePaise,
  monthlyIncomePaise,
  monthlyExpensePaise,
  onSendPress,
  onReceivePress,
  onExchangePress,
  onPasteSmsPress,
  onNotificationStackPress,
  pendingNotificationsCount = 0,
  style,
  inverted = true, // Default to true as user requested vice-versa
}) => {
  const isWhiteCard = inverted;

  const cardBg = isWhiteCard ? '#FFFFFF' : '#000000';
  const textPrimary = isWhiteCard ? '#000000' : '#FFFFFF';
  const textSecondary = isWhiteCard ? '#52525B' : '#A1A1AA';
  const textMuted = isWhiteCard ? '#71717A' : '#71717A';
  const pillBorder = isWhiteCard ? '#000000' : '#FFFFFF';
  const arrowColor = textPrimary;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }, style]}>
      {/* 1. Centered User Name Header with Right Stack Button */}
      <View style={styles.cardHeader}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.userName, { color: textPrimary }]} numberOfLines={1}>
          {userName}
        </Text>
        <LiquidPressable
          motionType="subtle"
          onPress={onNotificationStackPress}
          style={styles.stackButton}
          accessibilityRole="button"
          accessibilityLabel={`Financial alerts stack (${pendingNotificationsCount} pending)`}
        >
          <Layers size={22} color={textPrimary} strokeWidth={2} />
          {pendingNotificationsCount > 0 && (
            <View style={[styles.stackBadgeDot, { borderColor: cardBg }]} />
          )}
        </LiquidPressable>
      </View>

      {/* 2. Current Balance Label & Big Amount */}
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceLabel, { color: textSecondary }]}>
          Current Balance
        </Text>
        <Text style={[styles.balanceAmount, { color: textPrimary }]}>
          {formatIndianRupees(totalBalancePaise, { showPaise: false })}
        </Text>
      </View>

      {/* 3. Income & Expenses Row with Thin Directional Arrows */}
      <View style={styles.statsRow}>
        {/* Income Column */}
        <View style={styles.statCol}>
          <ArrowUp size={20} color={arrowColor} strokeWidth={2.2} />
          <View style={styles.statTextGroup}>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Income</Text>
            <Text style={[styles.statAmount, { color: textPrimary }]}>
              {formatIndianRupees(monthlyIncomePaise, { showPaise: false })}
            </Text>
          </View>
        </View>

        {/* Expenses Column */}
        <View style={styles.statCol}>
          <ArrowDown size={20} color={arrowColor} strokeWidth={2.2} />
          <View style={styles.statTextGroup}>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Expenses</Text>
            <Text style={[styles.statAmount, { color: textPrimary }]}>
              {formatIndianRupees(monthlyExpensePaise, { showPaise: false })}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Manual Section with Action Buttons */}
      <View style={styles.manualSection}>
        <Text style={[styles.manualLabel, { color: textMuted }]}>Manual</Text>

        <View style={styles.buttonsRow}>
          {/* Sent Pill with Liquid Squash & Rebound Motion */}
          <LiquidPressable
            motionType="pill"
            onPress={onSendPress}
            style={[styles.pillButton, { borderColor: pillBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Sent"
          >
            <Text
              style={[styles.pillButtonText, { color: textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Sended
            </Text>
          </LiquidPressable>

          {/* Received Pill with Liquid Squash & Rebound Motion */}
          <LiquidPressable
            motionType="pill"
            onPress={onReceivePress}
            style={[styles.pillButton, { borderColor: pillBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Received"
          >
            <Text
              style={[styles.pillButtonText, { color: textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Received
            </Text>
          </LiquidPressable>

          {/* Exchange Circular Button with Liquid Radial Bubble Motion */}
          <LiquidPressable
            motionType="bubble"
            onPress={onExchangePress}
            style={[styles.circleButton, { borderColor: pillBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Money Exchange"
          >
            <ArrowLeftRight size={17} color={textPrimary} strokeWidth={2.2} />
          </LiquidPressable>

          {/* Paste SMS Circular Button with Liquid Radial Bubble Motion */}
          {onPasteSmsPress && (
            <LiquidPressable
              motionType="bubble"
              onPress={onPasteSmsPress}
              style={[styles.circleButton, { borderColor: pillBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Paste SMS"
            >
              <Plus size={16} color={textPrimary} strokeWidth={2.2} />
            </LiquidPressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 36,
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    width: '100%',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  userName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  stackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  balanceLabel: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightRegular,
    fontWeight: '400',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 12,
  },
  statCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statTextGroup: {
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightRegular,
    fontWeight: '400',
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  manualSection: {
    alignItems: 'center',
    width: '100%',
  },
  manualLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  pillButton: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1.5,
    borderRadius: 9999,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    textAlign: 'center',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
