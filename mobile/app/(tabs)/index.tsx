import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Trash2, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MessageSquareQuote, Sparkles } from 'lucide-react-native';
import { theme, useAppTheme } from '../../src/theme';
import { BalanceCard, TransactionRow, LiquidPressable } from '../../src/components/primitives';
import { PasteSmsModal } from '../../src/features/transactions/PasteSmsModal.tsx';
import { NotificationStackModal } from '../../src/features/transactions/NotificationStackModal.tsx';
import { Transaction } from '../../src/types/domain';
import { useAuthStore } from '../../src/features/auth/authStore';
import { useSettingsStore } from '../../src/features/settings/settingsStore';
import { useTransactionStore } from '../../src/features/transactions/transactionStore';
import { rupeesToPaise, paiseToRupees } from '../../src/utils/money';
import { getLocalDateString } from '../../src/utils/date';

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

export default function HomeScreen() {
  const { colors, isDark } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const {
    name: settingsName,
    homeCardStyle,
    accounts,
    customCategories,
    loadSettings,
  } = useSettingsStore();

  const {
    transactions,
    pendingNotifications,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactionStore();

  useEffect(() => {
    loadSettings();
    loadTransactions();
  }, []);

  // Display Name reflects settings immediately
  const displayName = settingsName || user?.name || 'Chandru';

  // Dynamic Financial Math based on live accounts and transactions
  const baselineOpeningBalance = accounts.reduce(
    (sum, acc) => sum + (acc.opening_balance_paise ?? 0),
    0
  );

  const initialSeedExpensesPaise = 224000; // Baseline initial seed expenses across ledger

  const currentMonthStr = getLocalDateString().slice(0, 7);

  const currentMonthDebits = transactions
    .filter((t) => t.direction === 'DEBIT' && t.local_date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount_paise, 0);

  const currentMonthCredits = transactions
    .filter((t) => t.direction === 'CREDIT' && t.local_date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount_paise, 0);

  const totalDebits = transactions
    .filter((t) => t.direction === 'DEBIT')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  const totalCredits = transactions
    .filter((t) => t.direction === 'CREDIT')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // Live Current Balance
  const totalBalancePaise = Math.max(
    0,
    baselineOpeningBalance + totalCredits - totalDebits
  );

  // Live Income (Baseline ₹2,000 + any new credits this month)
  const monthlyIncomePaise = 200000 + currentMonthCredits;

  // Live Expenses (Baseline ₹1,000 + any new debits this month)
  const monthlyExpensePaise = 100000 + currentMonthDebits;

  // --- Modal States ---
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pasteSmsModalVisible, setPasteSmsModalVisible] = useState(false);
  const [notificationStackModalVisible, setNotificationStackModalVisible] = useState(false);

  // Expense form state
  const [expenseAmountRupees, setExpenseAmountRupees] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [expenseAccountId, setExpenseAccountId] = useState(accounts[0]?.id || 'acc-1');

  // Income form state
  const [incomeAmountRupees, setIncomeAmountRupees] = useState('');
  const [incomeTitle, setIncomeTitle] = useState('');
  const [incomeCategory, setIncomeCategory] = useState(DEFAULT_INCOME_CATEGORIES[0]);
  const [incomeAccountId, setIncomeAccountId] = useState(accounts[0]?.id || 'acc-1');

  // Exchange form state
  const [exchangeAmountRupees, setExchangeAmountRupees] = useState('');
  const [exchangeDirection, setExchangeDirection] = useState<'DIGITAL_TO_CASH' | 'CASH_TO_DIGITAL'>('DIGITAL_TO_CASH');
  const [exchangeNote, setExchangeNote] = useState('');

  // Selected Transaction for Edit / Delete
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmountRupees, setEditAmountRupees] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Combine default categories with user's custom categories
  const allExpenseCategories = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...customCategories.filter((c) => c.kind === 'EXPENSE').map((c) => c.name),
  ];

  const allIncomeCategories = [
    ...DEFAULT_INCOME_CATEGORIES,
    ...customCategories.filter((c) => c.kind === 'INCOME').map((c) => c.name),
  ];

  // --- Handlers ---
  const handleOpenSend = () => {
    setExpenseAmountRupees('');
    setExpenseTitle('');
    setExpenseCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
    setExpenseAccountId(accounts[0]?.id || 'acc-1');
    setExpenseModalVisible(true);
  };

  const handleOpenReceive = () => {
    setIncomeAmountRupees('');
    setIncomeTitle('');
    setIncomeCategory(DEFAULT_INCOME_CATEGORIES[0]);
    setIncomeAccountId(accounts[0]?.id || 'acc-1');
    setIncomeModalVisible(true);
  };

  const handleOpenExchange = () => {
    setExchangeAmountRupees('');
    setExchangeDirection('DIGITAL_TO_CASH');
    setExchangeNote('');
    setExchangeModalVisible(true);
  };

  const handleSaveExpense = async () => {
    const val = parseFloat(expenseAmountRupees);
    if (!val || val <= 0 || !expenseTitle.trim()) {
      Alert.alert('Required Fields', 'Please enter a valid amount and title for the expense.');
      return;
    }

    const account = accounts.find((a) => a.id === expenseAccountId);
    const paymentMethod = account?.type === 'CASH' ? 'CASH' : 'UPI';

    await addTransaction({
      accountId: expenseAccountId,
      direction: 'DEBIT',
      kind: 'EXPENSE',
      amountPaise: rupeesToPaise(val),
      counterpartyName: expenseTitle.trim(),
      categoryName: expenseCategory,
      paymentMethod,
    });

    setExpenseModalVisible(false);
  };

  const handleSaveIncome = async () => {
    const val = parseFloat(incomeAmountRupees);
    if (!val || val <= 0 || !incomeTitle.trim()) {
      Alert.alert('Required Fields', 'Please enter a valid amount and source for the income.');
      return;
    }

    const account = accounts.find((a) => a.id === incomeAccountId);
    const paymentMethod = account?.type === 'CASH' ? 'CASH' : 'UPI';

    await addTransaction({
      accountId: incomeAccountId,
      direction: 'CREDIT',
      kind: 'INCOME',
      amountPaise: rupeesToPaise(val),
      counterpartyName: incomeTitle.trim(),
      categoryName: incomeCategory,
      paymentMethod,
    });

    setIncomeModalVisible(false);
  };

  const handleSaveExchange = async () => {
    const val = parseFloat(exchangeAmountRupees);
    if (!val || val <= 0) {
      Alert.alert('Required Fields', 'Please enter a valid exchange amount.');
      return;
    }

    const note = exchangeNote.trim() || (
      exchangeDirection === 'DIGITAL_TO_CASH'
        ? 'ATM Cash Withdrawal'
        : 'Cash Deposit to Bank'
    );

    // Invariant: neutral exchange between digital and cash accounts
    await addTransaction({
      direction: exchangeDirection === 'DIGITAL_TO_CASH' ? 'DEBIT' : 'CREDIT',
      kind: 'EXCHANGE_LEG',
      amountPaise: rupeesToPaise(val),
      counterpartyName: note,
      categoryName: 'Exchange',
      paymentMethod: 'CASH',
      note,
    });

    setExchangeModalVisible(false);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditTitle(tx.counterparty_name || tx.category_name || '');
    setEditAmountRupees(paiseToRupees(tx.amount_paise).toString());
    setEditCategory(tx.category_name || 'General');
    setEditModalVisible(true);
  };

  const handleSaveEditTransaction = async () => {
    if (!selectedTx) return;
    const val = parseFloat(editAmountRupees);
    if (!val || val <= 0 || !editTitle.trim()) {
      Alert.alert('Required Fields', 'Please enter a valid title and amount.');
      return;
    }

    await updateTransaction(selectedTx.id, {
      counterparty_name: editTitle.trim(),
      amount_paise: rupeesToPaise(val),
      category_name: editCategory.trim(),
    });

    setEditModalVisible(false);
    setSelectedTx(null);
  };

  const handleDeleteTransaction = () => {
    if (!selectedTx) return;
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${selectedTx.counterparty_name || 'this item'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(selectedTx.id);
            setEditModalVisible(false);
            setSelectedTx(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.statusBar} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Balance Card (Styles and name reflect settings immediately) */}
        <BalanceCard
          userName={displayName}
          totalBalancePaise={totalBalancePaise}
          monthlyIncomePaise={monthlyIncomePaise}
          monthlyExpensePaise={monthlyExpensePaise}
          onSendPress={handleOpenSend}
          onReceivePress={handleOpenReceive}
          onExchangePress={handleOpenExchange}
          onPasteSmsPress={() => setPasteSmsModalVisible(true)}
          onNotificationStackPress={() => setNotificationStackModalVisible(true)}
          pendingNotificationsCount={pendingNotifications.length}
          inverted={homeCardStyle === 'white'}
          style={styles.balanceCard}
        />

        {/* Minimalist Horizontal Pull/Divider Bar */}
        <View style={styles.handleBarWrapper}>
          <View style={[styles.handleBar, { backgroundColor: colors.borderStrong }]} />
        </View>

        {/* Recent Transactions Section with Quick Paste SMS Action */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Tap to edit or review</Text>
          </View>

          <LiquidPressable
            motionType="pill"
            onPress={() => setPasteSmsModalVisible(true)}
            style={[styles.pasteSmsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Sparkles size={12} color={colors.text} strokeWidth={2.2} />
            <Text style={[styles.pasteSmsBtnText, { color: colors.text }]}>Paste SMS</Text>
          </LiquidPressable>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onPress={handleOpenEditTransaction}
            />
          ))}
        </View>
      </ScrollView>

      {/* 1. Modal: Record Expense ("Sended") */}
      <Modal
        visible={expenseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: colors.debitMuted }]}>
                  <ArrowUpRight size={18} color={colors.debit} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Record Expense</Text>
              </View>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (₹)</Text>
              <TextInput
                value={expenseAmountRupees}
                onChangeText={setExpenseAmountRupees}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAID TO / TITLE</Text>
              <TextInput
                value={expenseTitle}
                onChangeText={setExpenseTitle}
                placeholder="e.g. Swiggy, Uber, Supermarket"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {allExpenseCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setExpenseCategory(cat)}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      expenseCategory === cat && [styles.chipActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        expenseCategory === cat && [styles.chipTextActive, { color: colors.textInverted }],
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
              <View style={styles.accountChoiceRow}>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setExpenseAccountId(acc.id)}
                    style={[
                      styles.accountChoice,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      expenseAccountId === acc.id && [styles.accountChoiceActive, { backgroundColor: colors.cardHighlight, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountChoiceText,
                        { color: colors.textSecondary },
                        expenseAccountId === acc.id && [styles.accountChoiceTextActive, { color: colors.text }],
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setExpenseModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveExpense} style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}>
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Modal: Record Income ("Received") */}
      <Modal
        visible={incomeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIncomeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: colors.creditMuted }]}>
                  <ArrowDownLeft size={18} color={colors.credit} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Record Income</Text>
              </View>
              <TouchableOpacity onPress={() => setIncomeModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (₹)</Text>
              <TextInput
                value={incomeAmountRupees}
                onChangeText={setIncomeAmountRupees}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RECEIVED FROM / TITLE</Text>
              <TextInput
                value={incomeTitle}
                onChangeText={setIncomeTitle}
                placeholder="e.g. Salary, Client payment, Friend"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {allIncomeCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setIncomeCategory(cat)}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      incomeCategory === cat && [styles.chipActive, { backgroundColor: colors.text, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        incomeCategory === cat && [styles.chipTextActive, { color: colors.textInverted }],
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESTINATION ACCOUNT</Text>
              <View style={styles.accountChoiceRow}>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setIncomeAccountId(acc.id)}
                    style={[
                      styles.accountChoice,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      incomeAccountId === acc.id && [styles.accountChoiceActive, { backgroundColor: colors.cardHighlight, borderColor: colors.text }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.accountChoiceText,
                        { color: colors.textSecondary },
                        incomeAccountId === acc.id && [styles.accountChoiceTextActive, { color: colors.text }],
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setIncomeModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveIncome} style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}>
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Modal: Neutral Exchange ("⇄") */}
      <Modal
        visible={exchangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExchangeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconCircle, { backgroundColor: colors.exchangeMuted }]}>
                  <ArrowLeftRight size={18} color={colors.exchange} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Digital ⇄ Cash</Text>
              </View>
              <TouchableOpacity onPress={() => setExchangeModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.directionToggleContainer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                onPress={() => setExchangeDirection('DIGITAL_TO_CASH')}
                style={[
                  styles.directionBtn,
                  exchangeDirection === 'DIGITAL_TO_CASH' && [styles.directionBtnActive, { backgroundColor: colors.text }],
                ]}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    { color: colors.textSecondary },
                    exchangeDirection === 'DIGITAL_TO_CASH' && [styles.directionBtnTextActive, { color: colors.textInverted }],
                  ]}
                >
                  Bank → Cash (ATM)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExchangeDirection('CASH_TO_DIGITAL')}
                style={[
                  styles.directionBtn,
                  exchangeDirection === 'CASH_TO_DIGITAL' && [styles.directionBtnActive, { backgroundColor: colors.text }],
                ]}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    { color: colors.textSecondary },
                    exchangeDirection === 'CASH_TO_DIGITAL' && [styles.directionBtnTextActive, { color: colors.textInverted }],
                  ]}
                >
                  Cash → Bank (Deposit)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (₹)</Text>
              <TextInput
                value={exchangeAmountRupees}
                onChangeText={setExchangeAmountRupees}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTE (OPTIONAL)</Text>
              <TextInput
                value={exchangeNote}
                onChangeText={setExchangeNote}
                placeholder="e.g. ATM withdrawal for travel"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={[styles.exchangeNotice, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.exchangeNoticeText, { color: colors.textMuted }]}>
                Exchange is net-worth neutral. Cash and bank balances adjust without impacting net income or expenses.
              </Text>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setExchangeModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveExchange} style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}>
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Complete Exchange</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Modal: Edit / Delete Transaction */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Transaction</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TITLE / COUNTERPARTY</Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (₹)</Text>
              <TextInput
                value={editAmountRupees}
                onChangeText={setEditAmountRupees}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <TextInput
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.editModalButtonRow}>
              <TouchableOpacity onPress={handleDeleteTransaction} style={styles.modalDeleteBtn}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
              <View style={styles.editActionRight}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCancelBtn}>
                  <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEditTransaction} style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}>
                  <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Modal: Paste SMS Detection */}
      <PasteSmsModal
        visible={pasteSmsModalVisible}
        onClose={() => setPasteSmsModalVisible(false)}
      />

      {/* 6. Modal: Financial Alerts Stack */}
      <NotificationStackModal
        visible={notificationStackModalVisible}
        onClose={() => setNotificationStackModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // Pitch Black canvas
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // Generous padding for the floating bottom pill nav
  },
  balanceCard: {
    marginBottom: 20,
  },
  handleBarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46', // Subtle gray handle bar
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteSmsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  pasteSmsBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF', // Crisp white on black canvas
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
  },
  transactionsList: {
    gap: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#141416',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 14,
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
    letterSpacing: 0.8,
  },
  amountInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: theme.typography.fonts.delightBold,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  textInput: {
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightRegular,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },
  chipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  accountChoiceRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  accountChoice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  accountChoiceActive: {
    backgroundColor: '#2E2E38',
    borderColor: '#FFFFFF',
  },
  accountChoiceText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontFamily: theme.typography.fonts.delightMedium,
  },
  accountChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  directionToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E24',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  directionBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  directionBtnText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },
  directionBtnTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  exchangeNotice: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  exchangeNoticeText: {
    fontSize: 11,
    color: '#71717A',
    lineHeight: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editModalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editActionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
  },
  modalSubmitBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalSubmitText: {
    color: '#000000',
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
});
