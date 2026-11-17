import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  X,
  Layers,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Sparkles,
  Tag,
  Building2,
  Clock,
} from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { formatIndianRupees } from '../../utils/money.ts';
import { formatFriendlyDate } from '../../utils/date.ts';
import { LiquidPressable } from '../../components/primitives/LiquidPressable';
import { useTransactionStore } from './transactionStore.ts';
import { useSettingsStore } from '../settings/settingsStore.ts';

export interface NotificationStackModalProps {
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Groceries',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Other',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other',
];

export const NotificationStackModal: React.FC<NotificationStackModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useAppTheme();
  const {
    pendingNotifications,
    confirmPendingNotification,
    dismissPendingNotification,
    addPendingNotification,
  } = useTransactionStore();
  const { accounts, customCategories } = useSettingsStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('Food & Dining');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || 'acc-1'
  );

  // Keep index within valid bounds
  const totalCount = pendingNotifications.length;
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, totalCount - 1));
  const currentNotif = totalCount > 0 ? pendingNotifications[safeIndex] : null;

  // Sync state whenever the current notification changes
  useEffect(() => {
    if (currentNotif) {
      setSelectedCategory(currentNotif.suggestedCategory || 'Other');
      setSelectedAccountId(currentNotif.accountId || accounts[0]?.id || 'acc-1');
    }
  }, [currentNotif?.id]);

  // Directional categories
  const categoryOptions =
    currentNotif?.direction === 'CREDIT'
      ? [
          ...DEFAULT_INCOME_CATEGORIES,
          ...customCategories.filter((c) => c.kind === 'INCOME').map((c) => c.name),
        ]
      : [
          ...DEFAULT_EXPENSE_CATEGORIES,
          ...customCategories.filter((c) => c.kind === 'EXPENSE').map((c) => c.name),
        ];

  // Actions
  const handleConfirm = async () => {
    if (!currentNotif) return;
    const notifId = currentNotif.id;
    await confirmPendingNotification(notifId, selectedCategory, selectedAccountId);

    if (totalCount <= 1) {
      setCurrentIndex(0);
    } else if (safeIndex >= totalCount - 1) {
      setCurrentIndex(Math.max(0, totalCount - 2));
    }
  };

  const handleDismiss = () => {
    if (!currentNotif) return;
    dismissPendingNotification(currentNotif.id);

    if (totalCount <= 1) {
      setCurrentIndex(0);
    } else if (safeIndex >= totalCount - 1) {
      setCurrentIndex(Math.max(0, totalCount - 2));
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const handleNext = () => {
    if (safeIndex < totalCount - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  // Simulate a live transaction notification for quick testing
  const handleSimulateAlert = () => {
    const demoItems = [
      {
        sender: 'HDFC-BANK',
        rawText:
          'Rs 350.00 debited from A/C XX4092 on 11-Apr-2026 via UPI to Blue Tokai Coffee. UPI Ref: 610294829102.',
        amountPaise: 35000,
        direction: 'DEBIT' as const,
        counterpartyName: 'Blue Tokai Coffee',
        suggestedCategory: 'Food & Dining',
        paymentMethod: 'UPI' as const,
        referenceId: 'UPI-610294829102',
      },
      {
        sender: 'SBI-UPI',
        rawText:
          'Dear UPI user A/C 9812 debited by Rs 2,400.00 on 11-Apr-2026 to Reliance Digital ref 610293817492.',
        amountPaise: 240000,
        direction: 'DEBIT' as const,
        counterpartyName: 'Reliance Digital',
        suggestedCategory: 'Shopping',
        paymentMethod: 'UPI' as const,
        referenceId: 'UPI-610293817492',
      },
      {
        sender: 'AXIS-BANK',
        rawText:
          'Account XX7891 credited with INR 12,000.00 on 11-Apr-2026 by Design Sprint Client. Ref: AXS-091283.',
        amountPaise: 1200000,
        direction: 'CREDIT' as const,
        counterpartyName: 'Design Sprint Client',
        suggestedCategory: 'Freelance',
        paymentMethod: 'BANK_TRANSFER' as const,
        referenceId: 'AXS-091283',
      },
    ];

    const pick = demoItems[Math.floor(Math.random() * demoItems.length)];
    addPendingNotification(pick);
    setCurrentIndex(0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.containerCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconCircle,
                  { backgroundColor: colors.cardHighlight, borderColor: colors.border },
                ]}
              >
                <Layers size={18} color={colors.text} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  Financial Alerts
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {totalCount === 0
                    ? 'No pending notifications'
                    : `${safeIndex + 1} of ${totalCount} stacked`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={[styles.closeButton, { borderColor: colors.border }]}
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {totalCount === 0 || !currentNotif ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.cardHighlight, borderColor: colors.border },
                ]}
              >
                <Layers size={32} color={colors.textMuted} strokeWidth={1.8} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                All Caught Up
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                No incoming bank or UPI notifications waiting in your stack.
              </Text>

              <LiquidPressable
                motionType="pill"
                onPress={handleSimulateAlert}
                style={[styles.simulateButton, { backgroundColor: colors.text }]}
              >
                <Sparkles size={16} color={colors.textInverted} strokeWidth={2.2} />
                <Text style={[styles.simulateButtonText, { color: colors.textInverted }]}>
                  Simulate Bank Alert
                </Text>
              </LiquidPressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Stack Card Preview */}
              <View
                style={[
                  styles.notifCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Top Row: Sender Badge & Direction */}
                <View style={styles.notifCardTop}>
                  <View style={styles.senderPill}>
                    <Building2 size={12} color={colors.textMuted} />
                    <Text style={[styles.senderText, { color: colors.textSecondary }]}>
                      {currentNotif.sender}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.directionPill,
                      {
                        backgroundColor:
                          currentNotif.direction === 'CREDIT'
                            ? colors.creditMuted
                            : colors.debitMuted,
                      },
                    ]}
                  >
                    {currentNotif.direction === 'CREDIT' ? (
                      <ArrowDownLeft size={13} color={colors.credit} strokeWidth={2.5} />
                    ) : (
                      <ArrowUpRight size={13} color={colors.debit} strokeWidth={2.5} />
                    )}
                    <Text
                      style={[
                        styles.directionText,
                        {
                          color:
                            currentNotif.direction === 'CREDIT'
                              ? colors.credit
                              : colors.debit,
                        },
                      ]}
                    >
                      {currentNotif.direction === 'CREDIT' ? 'Credit' : 'Debit'}
                    </Text>
                  </View>
                </View>

                {/* Amount */}
                <Text style={[styles.notifAmount, { color: colors.text }]}>
                  {currentNotif.direction === 'CREDIT' ? '+' : '-'}
                  {formatIndianRupees(currentNotif.amountPaise)}
                </Text>

                {/* Counterparty / Payee */}
                <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentNotif.counterpartyName}
                </Text>

                {/* Raw SMS Snippet */}
                <View
                  style={[
                    styles.rawTextContainer,
                    {
                      backgroundColor: colors.cardHighlight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.rawText, { color: colors.textMuted }]} numberOfLines={2}>
                    {currentNotif.rawText}
                  </Text>
                </View>

                {/* Timestamp & Stack Navigation */}
                <View style={styles.notifFooter}>
                  <View style={styles.timeRow}>
                    <Clock size={12} color={colors.textMuted} />
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                      {formatFriendlyDate(currentNotif.receivedAt)}
                    </Text>
                  </View>

                  {/* Previous / Next buttons if multiple */}
                  {totalCount > 1 && (
                    <View style={styles.navRow}>
                      <LiquidPressable
                        motionType="bubble"
                        onPress={handlePrev}
                        disabled={safeIndex === 0}
                        style={[
                          styles.navButton,
                          {
                            borderColor: colors.border,
                            opacity: safeIndex === 0 ? 0.4 : 1,
                          },
                        ]}
                      >
                        <ChevronLeft size={16} color={colors.text} strokeWidth={2.2} />
                      </LiquidPressable>

                      <Text style={[styles.navCounter, { color: colors.textSecondary }]}>
                        {safeIndex + 1}/{totalCount}
                      </Text>

                      <LiquidPressable
                        motionType="bubble"
                        onPress={handleNext}
                        disabled={safeIndex === totalCount - 1}
                        style={[
                          styles.navButton,
                          {
                            borderColor: colors.border,
                            opacity: safeIndex === totalCount - 1 ? 0.4 : 1,
                          },
                        ]}
                      >
                        <ChevronRight size={16} color={colors.text} strokeWidth={2.2} />
                      </LiquidPressable>
                    </View>
                  )}
                </View>
              </View>

              {/* Section: Choose Category */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Tag size={13} color={colors.textMuted} />
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                    CONFIRM CATEGORY
                  </Text>
                </View>

                <View style={styles.categoryPillsWrapper}>
                  {categoryOptions.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <LiquidPressable
                        key={cat}
                        motionType="pill"
                        onPress={() => setSelectedCategory(cat)}
                        style={[
                          styles.categoryPill,
                          {
                            backgroundColor: isSelected ? colors.text : colors.background,
                            borderColor: isSelected ? colors.text : colors.border,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={cat}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            {
                              color: isSelected ? colors.textInverted : colors.textSecondary,
                              fontFamily: isSelected
                                ? theme.typography.fonts.delightSemiBold
                                : theme.typography.fonts.delightRegular,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </LiquidPressable>
                    );
                  })}
                </View>
              </View>

              {/* Section: Select Account */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Wallet size={13} color={colors.textMuted} />
                  <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                    ASSIGN TO ACCOUNT
                  </Text>
                </View>

                <View style={styles.accountRow}>
                  {accounts.map((acc) => {
                    const isSelected = selectedAccountId === acc.id;
                    return (
                      <LiquidPressable
                        key={acc.id}
                        motionType="pill"
                        onPress={() => setSelectedAccountId(acc.id)}
                        style={[
                          styles.accountPill,
                          {
                            backgroundColor: isSelected
                              ? colors.cardHighlight
                              : colors.background,
                            borderColor: isSelected ? colors.text : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.accountPillText,
                            {
                              color: isSelected ? colors.text : colors.textSecondary,
                              fontFamily: isSelected
                                ? theme.typography.fonts.delightSemiBold
                                : theme.typography.fonts.delightRegular,
                            },
                          ]}
                        >
                          {acc.name}
                        </Text>
                      </LiquidPressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {/* Dismiss Button */}
                <LiquidPressable
                  motionType="subtle"
                  onPress={handleDismiss}
                  style={[
                    styles.dismissButton,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss alert"
                >
                  <Trash2 size={16} color={colors.textMuted} strokeWidth={2} />
                  <Text style={[styles.dismissButtonText, { color: colors.textMuted }]}>
                    Dismiss
                  </Text>
                </LiquidPressable>

                {/* Confirm Button */}
                <LiquidPressable
                  motionType="pill"
                  onPress={handleConfirm}
                  style={[
                    styles.confirmButton,
                    { backgroundColor: colors.text },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm and add to ledger"
                >
                  <CheckCircle2
                    size={17}
                    color={colors.textInverted}
                    strokeWidth={2.4}
                  />
                  <Text
                    style={[
                      styles.confirmButtonText,
                      { color: colors.textInverted },
                    ]}
                  >
                    Confirm & Add
                  </Text>
                </LiquidPressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  containerCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.18)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  notifCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  notifCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  directionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  directionText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
  },
  notifAmount: {
    fontSize: 34,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -1,
  },
  notifTitle: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
  },
  rawTextContainer: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rawText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    lineHeight: 17,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCounter: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  categoryPillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.2,
  },
  categoryPillText: {
    fontSize: 13,
  },
  accountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1.2,
  },
  accountPillText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dismissButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1.2,
  },
  dismissButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 19,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 12,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 9999,
  },
  simulateButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightSemiBold,
    fontWeight: '600',
  },
});
