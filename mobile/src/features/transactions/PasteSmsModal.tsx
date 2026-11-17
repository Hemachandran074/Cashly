import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  X,
  MessageSquareQuote,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Store,
  Wallet,
  Trash2,
} from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { parseFinancialSms, ParsedSmsResult } from '../../utils/smsParser.ts';
import { formatIndianRupees } from '../../utils/money.ts';
import { formatFriendlyDate } from '../../utils/date.ts';
import { LiquidPressable } from '../../components/primitives/LiquidPressable';
import { useTransactionStore } from './transactionStore.ts';
import { useSettingsStore } from '../settings/settingsStore.ts';

export interface PasteSmsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SAMPLE_SMS_LIST = [
  {
    label: 'HDFC ₹1,500 Debit',
    text: 'HDFC Bank: Rs 1,500.00 debited from A/c **4321 on 03-11-26 to VPA swiggy@icici (UPI Ref 631245678901). Avl Bal: Rs 42,350.50.',
  },
  {
    label: 'SBI ₹25,000 Salary',
    text: 'Dear SBI User, your A/c ending 5678 is credited by INR 25,000.00 on 01Nov26 at 11:30 AM by UPI/CR/630987/Salary. Avl Bal: INR 65,400.00.',
  },
  {
    label: 'Mess ₹85.50 Debit',
    text: 'Acct XX123 debited with INR 85.50 on 03-Nov-26 at 04:45 PM. Info: UPI*Kumaraguru Mess*5678. Avl Bal: INR 12,400.00.',
  },
  {
    label: 'OTP Security (Ignored)',
    text: '482910 is your secret OTP for transaction of INR 1,299.00 at Flipkart. Valid for 10 minutes. Do not share OTP with anyone.',
  },
  {
    label: 'Telecom Alert (Ignored)',
    text: 'Your daily 1.5 GB high-speed data quota is 100% exhausted. Recharge now to continue high speed internet.',
  },
];

export const PasteSmsModal: React.FC<PasteSmsModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useAppTheme();
  const { addTransaction } = useTransactionStore();
  const { accounts, customCategories } = useSettingsStore();

  const [smsText, setSmsText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'acc-1');

  // Parse SMS text in real-time
  const parseResult: ParsedSmsResult = useMemo(() => {
    return parseFinancialSms(smsText);
  }, [smsText]);

  // Handle Saving the detected transaction into ledger
  const handleConfirmTransaction = async () => {
    if (parseResult.status !== 'SUCCESS' || !parseResult.amountPaise) {
      return;
    }

    const direction = parseResult.direction || 'DEBIT';
    const kind = direction === 'DEBIT' ? 'EXPENSE' : 'INCOME';
    const title = parseResult.counterpartyName || (direction === 'DEBIT' ? 'Expense' : 'Income');
    const category = parseResult.categoryName || 'Other';
    const occurredAt = parseResult.occurredAt || new Date().toISOString();

    const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
    const paymentMethod = selectedAccount?.type === 'CASH' ? 'CASH' : 'UPI';

    await addTransaction({
      accountId: selectedAccountId,
      direction,
      kind,
      amountPaise: parseResult.amountPaise,
      counterpartyName: title,
      categoryName: category,
      paymentMethod,
      occurredAt,
    });

    Alert.alert(
      'Transaction Logged',
      `${direction === 'DEBIT' ? 'Debit' : 'Credit'} of ${formatIndianRupees(
        parseResult.amountPaise
      )} for "${title}" has been saved to your ledger.`,
      [{ text: 'Done', onPress: () => handleClose() }]
    );

    if (onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setSmsText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconCircle, { backgroundColor: colors.cardHighlight }]}>
                <MessageSquareQuote size={18} color={colors.text} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Paste Financial SMS</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Auto-detect amount, type, date, and merchant
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Input Box */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SMS MESSAGE TEXT</Text>
                {smsText.length > 0 && (
                  <TouchableOpacity onPress={() => setSmsText('')} style={styles.clearBtn}>
                    <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                value={smsText}
                onChangeText={setSmsText}
                placeholder="Paste your bank or UPI transaction SMS here (e.g., from HDFC, SBI, ICICI, Axis, Paytm)..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Quick Test Sample Pills */}
            <View style={styles.samplesSection}>
              <Text style={[styles.samplesLabel, { color: colors.textMuted }]}>Tap to test samples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleChipsRow}>
                {SAMPLE_SMS_LIST.map((sample, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSmsText(sample.text)}
                    style={[
                      styles.sampleChip,
                      { backgroundColor: colors.cardHighlight, borderColor: colors.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Sparkles size={11} color={colors.textSecondary} />
                    <Text style={[styles.sampleChipText, { color: colors.textSecondary }]}>
                      {sample.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Detection Analysis Result Area */}
            {smsText.trim().length > 0 && (
              <View style={styles.analysisContainer}>
                {/* 1. SUCCESS STATE */}
                {parseResult.status === 'SUCCESS' && parseResult.amountPaise && (
                  <View
                    style={[
                      styles.resultCard,
                      {
                        backgroundColor: colors.background,
                        borderColor: parseResult.direction === 'DEBIT' ? colors.debitBorder : colors.creditBorder,
                      },
                    ]}
                  >
                    {/* Direction & Status Tag */}
                    <View style={styles.resultTopRow}>
                      <View
                        style={[
                          styles.directionTag,
                          {
                            backgroundColor:
                              parseResult.direction === 'DEBIT'
                                ? colors.debitMuted
                                : colors.creditMuted,
                          },
                        ]}
                      >
                        {parseResult.direction === 'DEBIT' ? (
                          <ArrowUpRight size={14} color={colors.debit} strokeWidth={2.5} />
                        ) : (
                          <ArrowDownLeft size={14} color={colors.credit} strokeWidth={2.5} />
                        )}
                        <Text
                          style={[
                            styles.directionTagText,
                            {
                              color:
                                parseResult.direction === 'DEBIT'
                                  ? colors.debit
                                  : colors.credit,
                            },
                          ]}
                        >
                          {parseResult.direction === 'DEBIT' ? 'DEBIT DETECTED' : 'CREDIT DETECTED'}
                        </Text>
                      </View>

                      {parseResult.accountRef && (
                        <Text style={[styles.accountBadge, { color: colors.textMuted, borderColor: colors.border }]}>
                          {parseResult.accountRef}
                        </Text>
                      )}
                    </View>

                    {/* Detected Big Amount */}
                    <View style={styles.amountDisplayRow}>
                      <Text
                        style={[
                          styles.detectedAmount,
                          {
                            color:
                              parseResult.direction === 'DEBIT'
                                ? colors.debit
                                : colors.credit,
                          },
                        ]}
                      >
                        {parseResult.direction === 'DEBIT' ? '-' : '+'}
                        {formatIndianRupees(parseResult.amountPaise)}
                      </Text>
                    </View>

                    {/* Details Breakdown */}
                    <View style={[styles.detailsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {/* Counterparty / Title */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <Store size={14} color={colors.textMuted} />
                          <Text style={[styles.detailKey, { color: colors.textMuted }]}>
                            {parseResult.direction === 'DEBIT' ? 'Paid to' : 'From'}
                          </Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {parseResult.counterpartyName}
                        </Text>
                      </View>

                      {/* Date & Time */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <Calendar size={14} color={colors.textMuted} />
                          <Text style={[styles.detailKey, { color: colors.textMuted }]}>Date & Time</Text>
                        </View>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {formatFriendlyDate(parseResult.localDate || '', { includeYear: true })} • {parseResult.timeStr}
                        </Text>
                      </View>

                      {/* Category */}
                      <View style={styles.detailRow}>
                        <View style={styles.detailLeft}>
                          <Sparkles size={14} color={colors.textMuted} />
                          <Text style={[styles.detailKey, { color: colors.textMuted }]}>Category</Text>
                        </View>
                        <Text style={[styles.detailValueHighlight, { color: colors.text }]}>
                          {parseResult.categoryName}
                        </Text>
                      </View>

                      {/* Remaining Balance if detected */}
                      {parseResult.balancePaise !== undefined && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailLeft}>
                            <Wallet size={14} color={colors.textMuted} />
                            <Text style={[styles.detailKey, { color: colors.textMuted }]}>Remaining Balance</Text>
                          </View>
                          <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                            {formatIndianRupees(parseResult.balancePaise)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Account Assignment */}
                    <View style={styles.accountSelectRow}>
                      <Text style={[styles.accountSelectLabel, { color: colors.textSecondary }]}>
                        Record to Account:
                      </Text>
                      <View style={styles.accountChips}>
                        {accounts.map((acc) => (
                          <TouchableOpacity
                            key={acc.id}
                            onPress={() => setSelectedAccountId(acc.id)}
                            style={[
                              styles.accountChip,
                              { backgroundColor: colors.card, borderColor: colors.border },
                              selectedAccountId === acc.id && [
                                styles.accountChipActive,
                                { backgroundColor: colors.text, borderColor: colors.text },
                              ],
                            ]}
                          >
                            <Text
                              style={[
                                styles.accountChipText,
                                { color: colors.textSecondary },
                                selectedAccountId === acc.id && [
                                  styles.accountChipTextActive,
                                  { color: colors.textInverted },
                                ],
                              ]}
                            >
                              {acc.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Confirm Button with Liquid Motion */}
                    <LiquidPressable
                      motionType="pill"
                      onPress={handleConfirmTransaction}
                      style={[styles.confirmBtn, { backgroundColor: colors.text }]}
                    >
                      <CheckCircle2 size={16} color={colors.textInverted} strokeWidth={2.2} />
                      <Text style={[styles.confirmBtnText, { color: colors.textInverted }]}>
                        Add to Transactions Ledger
                      </Text>
                    </LiquidPressable>
                  </View>
                )}

                {/* 2. SECURITY OTP IGNORED STATE */}
                {parseResult.status === 'SECURITY_OTP_IGNORED' && (
                  <View style={[styles.warningBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
                    <View style={styles.warningHeaderRow}>
                      <ShieldAlert size={18} color="#EF4444" strokeWidth={2.2} />
                      <Text style={[styles.warningTitle, { color: '#EF4444' }]}>
                        Security Code Ignored
                      </Text>
                    </View>
                    <Text style={[styles.warningDesc, { color: colors.textSecondary }]}>
                      This message contains an OTP, passcode, or authentication challenge. For your security and privacy, Cashly never records security codes.
                    </Text>
                  </View>
                )}

                {/* 3. NON FINANCIAL IGNORED STATE */}
                {parseResult.status === 'NON_FINANCIAL_IGNORED' && (
                  <View style={[styles.infoBox, { backgroundColor: 'rgba(148, 163, 184, 0.08)', borderColor: colors.border }]}>
                    <View style={styles.warningHeaderRow}>
                      <AlertCircle size={18} color="#94A3B8" strokeWidth={2.2} />
                      <Text style={[styles.warningTitle, { color: colors.textSecondary }]}>
                        Non-Financial Message Ignored
                      </Text>
                    </View>
                    <Text style={[styles.warningDesc, { color: colors.textMuted }]}>
                      {parseResult.ignoreReason || 'No financial debit or credit transaction found in this message.'}
                    </Text>
                  </View>
                )}

                {/* 4. UNRECOGNIZED FORMAT */}
                {parseResult.status === 'UNRECOGNIZED_FORMAT' && (
                  <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.warningDesc, { color: colors.textMuted }]}>
                      {parseResult.ignoreReason || 'Please enter a valid bank transaction SMS.'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {smsText.trim().length === 0 && (
              <View style={styles.emptyPrompt}>
                <Text style={[styles.emptyPromptText, { color: colors.textMuted }]}>
                  Copy any SMS from your bank or UPI app and paste it above to automatically detect the amount, debit/credit direction, date, and time.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    maxHeight: '82%',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    letterSpacing: 0.8,
  },
  clearBtn: {
    paddingHorizontal: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  textArea: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    borderWidth: 1,
    textAlignVertical: 'top',
    minHeight: 74,
  },
  samplesSection: {
    marginBottom: 12,
  },
  samplesLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    marginBottom: 8,
  },
  sampleChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  sampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
  },
  sampleChipText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  analysisContainer: {
    marginTop: 4,
  },
  resultCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  directionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directionTagText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  accountBadge: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  amountDisplayRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detectedAmount: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  detailsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailKey: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '600',
  },
  detailValueHighlight: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  accountSelectRow: {
    marginBottom: 14,
    gap: 6,
  },
  accountSelectLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  accountChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  accountChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  accountChipActive: {},
  accountChipText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  accountChipTextActive: {
    fontWeight: '700',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  warningBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  warningDesc: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    lineHeight: 18,
  },
  infoBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  emptyPrompt: {
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  emptyPromptText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});

