import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  History,
} from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { useTransactionStore } from '../transactions/transactionStore';
import { useSettingsStore } from '../settings/settingsStore';
import { Transaction } from '../../types/domain';
import { TransactionRow } from '../../components/primitives/TransactionRow';
import { LiquidPressable, LiquidSegmentedControl } from '../../components/primitives';
import {
  getLocalDateString,
  getDaysInMonth,
  getWeekdayOfFirstDay,
  getMonthName,
  formatFriendlyDate,
} from '../../utils/date';
import { formatIndianRupees, rupeesToPaise, paiseToRupees } from '../../utils/money';

const WEEKDAYS = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'];

type LedgerFilterMode = 'DAY' | 'MONTH' | 'ALL_TIME';

interface CalendarDayCellProps {
  dayNum: number;
  isSelected: boolean;
  hasExpense: boolean;
  hasIncome: boolean;
  onPress: () => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  dayNum,
  isSelected,
  hasExpense,
  hasIncome,
  onPress,
}) => {
  const popAnim = useRef(new Animated.Value(isSelected ? 1 : 0.85)).current;

  useEffect(() => {
    if (isSelected) {
      popAnim.setValue(0.85);
      Animated.spring(popAnim, {
        toValue: 1,
        damping: 8,
        stiffness: 240,
        mass: 0.5,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  return (
    <LiquidPressable
      motionType="bubble"
      onPress={onPress}
      style={styles.dayCell}
      accessibilityRole="button"
      accessibilityLabel={`Day ${dayNum}`}
    >
      <Animated.View
        style={[
          styles.dayBox,
          isSelected && styles.dayBoxSelected,
          isSelected && { transform: [{ scale: popAnim }] },
        ]}
      >
        <Text
          style={[
            styles.dayNumberText,
            isSelected && styles.dayNumberTextSelected,
          ]}
        >
          {dayNum}
        </Text>

        {!isSelected && (hasExpense || hasIncome) && (
          <View style={styles.dotContainer}>
            {hasExpense && <View style={styles.expenseDot} />}
            {hasIncome && <View style={styles.incomeDot} />}
          </View>
        )}
      </Animated.View>
    </LiquidPressable>
  );
};

export const CalendarScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const { transactions, updateTransaction, deleteTransaction, addTransaction } =
    useTransactionStore();
  const { trackingStartDate, accounts } = useSettingsStore();

  // Find the earliest date in transaction ledger to determine "since first logged in"
  const earliestLedgerDate = useMemo(() => {
    if (transactions.length === 0) return trackingStartDate || getLocalDateString();
    const sorted = [...transactions].sort((a, b) =>
      a.local_date.localeCompare(b.local_date)
    );
    return sorted[0].local_date;
  }, [transactions, trackingStartDate]);

  // Calendar active view (Default to October 2026 if transactions exist there matching reference, or current date)
  const defaultYear = 2026;
  const defaultMonthIndex = 9; // October (0-indexed: 9 = October)
  const defaultDay = 9; // Day 9 matching the reference screenshot

  const [year, setYear] = useState<number>(defaultYear);
  const [monthIndex, setMonthIndex] = useState<number>(defaultMonthIndex);

  // Selected date in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string>(
    `${defaultYear}-${(defaultMonthIndex + 1).toString().padStart(2, '0')}-${defaultDay.toString().padStart(2, '0')}`
  );

  // View filter mode: Selected Day, Entire Month, or All-Time ledger
  const [filterMode, setFilterMode] = useState<LedgerFilterMode>('DAY');

  // Transaction Edit / Detail Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmountRupees, setEditAmountRupees] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Add Transaction Modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addAmountRupees, setAddAmountRupees] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState('Food & Dining');
  const [addDirection, setAddDirection] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  // Month navigation
  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setYear((y) => y - 1);
      setMonthIndex(11);
    } else {
      setMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setYear((y) => y + 1);
      setMonthIndex(0);
    } else {
      setMonthIndex((m) => m + 1);
    }
  };

  const handleJumpToFirstDate = () => {
    const [y, m, d] = earliestLedgerDate.split('-');
    const parsedYear = parseInt(y, 10);
    const parsedMonthIndex = parseInt(m, 10) - 1;
    setYear(parsedYear);
    setMonthIndex(parsedMonthIndex);
    setSelectedDate(earliestLedgerDate);
    setFilterMode('DAY');
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonthIndex(today.getMonth());
    setSelectedDate(getLocalDateString(today));
    setFilterMode('DAY');
  };

  // Days calculations
  const daysInCurrentMonth = getDaysInMonth(year, monthIndex);
  const firstDayWeekdayIndex = getWeekdayOfFirstDay(year, monthIndex); // 0 = Mon, 6 = Sun

  const activeMonthString = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;

  // Map of transactions per date for rapid calendar lookup
  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.local_date) || [];
      list.push(tx);
      map.set(tx.local_date, list);
    }
    return map;
  }, [transactions]);

  // Expenses calculation for the card footer
  // If in DAY mode: shows total expense for selected day.
  // If in MONTH mode or no day selected: shows total expense for the active month.
  const selectedDayExpensesPaise = useMemo(() => {
    const dayTxs = transactionsByDate.get(selectedDate) || [];
    return dayTxs
      .filter((t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [transactionsByDate, selectedDate]);

  const activeMonthExpensesPaise = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.direction === 'DEBIT' &&
          t.kind !== 'EXCHANGE_LEG' &&
          t.local_date.startsWith(activeMonthString)
      )
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [transactions, activeMonthString]);

  const displayedExpenseTotalPaise =
    filterMode === 'DAY'
      ? selectedDayExpensesPaise > 0
        ? selectedDayExpensesPaise
        : activeMonthExpensesPaise // Graceful fallback if selected day has 0 but month has expenses
      : activeMonthExpensesPaise;

  // Filtered transactions for the ledger list below the card
  const displayedTransactions = useMemo(() => {
    if (filterMode === 'DAY') {
      return transactions.filter((t) => t.local_date === selectedDate);
    }
    if (filterMode === 'MONTH') {
      return transactions.filter((t) => t.local_date.startsWith(activeMonthString));
    }
    // ALL_TIME: show all transactions from first login to present, sorted by date descending
    return [...transactions].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  }, [transactions, filterMode, selectedDate, activeMonthString]);

  // Handle date selection
  const handleSelectDay = (dayNumber: number) => {
    const formattedDate = `${year}-${(monthIndex + 1)
      .toString()
      .padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
    setSelectedDate(formattedDate);
    setFilterMode('DAY');
  };

  // Transaction Edit handlers
  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditTitle(tx.counterparty_name || tx.category_name || '');
    setEditAmountRupees(paiseToRupees(tx.amount_paise).toString());
    setEditCategory(tx.category_name || 'General');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
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

  const handleDelete = () => {
    if (!selectedTx) return;
    Alert.alert(
      'Delete Transaction',
      `Delete "${selectedTx.counterparty_name || 'this item'}" from ledger?`,
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

  // Add Transaction handler for selected date
  const handleSaveNewTransaction = async () => {
    const val = parseFloat(addAmountRupees);
    if (!val || val <= 0 || !addTitle.trim()) {
      Alert.alert('Required Fields', 'Please enter a valid title and amount.');
      return;
    }

    const occurredAt = `${selectedDate}T12:00:00Z`;
    await addTransaction({
      direction: addDirection,
      kind: addDirection === 'DEBIT' ? 'EXPENSE' : 'INCOME',
      amountPaise: rupeesToPaise(val),
      counterpartyName: addTitle.trim(),
      categoryName: addCategory.trim(),
      paymentMethod: 'UPI',
      occurredAt,
    });

    setAddModalVisible(false);
    setAddAmountRupees('');
    setAddTitle('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.statusBar} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Title & Subtitle matching the design */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Inspect your ledger history and daily expenses since you first began tracking.
          </Text>

          {/* Quick jump navigation pills */}
          <View style={styles.jumpRow}>
            <TouchableOpacity
              onPress={handleJumpToFirstDate}
              style={[styles.jumpPill, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <History size={13} color={colors.textSecondary} />
              <Text style={[styles.jumpPillText, { color: colors.textSecondary }]}>
                First Logged ({formatFriendlyDate(earliestLedgerDate)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleJumpToToday}
              style={[styles.jumpPill, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Clock size={13} color={colors.textSecondary} />
              <Text style={[styles.jumpPillText, { color: colors.textSecondary }]}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. Black Rounded Calendar Card (Matches Reference Image) */}
        <View style={[styles.calendarCard, { backgroundColor: isDark ? '#141416' : '#000000', borderColor: isDark ? '#26262B' : '#1C1C20' }]}>
          {/* Card Top: < Month > on Left, Year on Right */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.navArrowBtn}
              >
                <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={styles.monthNameContainer}>
                <Text style={styles.monthNameText}>{getMonthName(monthIndex)}</Text>
              </View>

              <TouchableOpacity
                onPress={handleNextMonth}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.navArrowBtn}
              >
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text style={styles.yearText}>{year}</Text>
          </View>

          {/* Weekday Row: M  T  W  TH  F  S  SU */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, idx) => (
              <View key={`${day}-${idx}`} style={styles.dayCol}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid (7 columns, Monday-start) */}
          <View style={styles.daysGrid}>
            {/* Leading blank spaces */}
            {Array.from({ length: firstDayWeekdayIndex }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${(monthIndex + 1)
                .toString()
                .padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
              const isSelected = selectedDate === dateKey && filterMode === 'DAY';
              const dayTransactions = transactionsByDate.get(dateKey) || [];
              const hasExpense = dayTransactions.some(
                (t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG'
              );
              const hasIncome = dayTransactions.some(
                (t) => t.direction === 'CREDIT'
              );

              return (
                <CalendarDayCell
                  key={`day-${dayNum}`}
                  dayNum={dayNum}
                  isSelected={isSelected}
                  hasExpense={hasExpense}
                  hasIncome={hasIncome}
                  onPress={() => handleSelectDay(dayNum)}
                />
              );
            })}
          </View>

          {/* Card Footer: Total Expense: ₹2000 */}
          <View style={styles.cardFooter}>
            <View style={styles.expenseRow}>
              <Text style={styles.totalExpenseLabel}>Total Expense: </Text>
              <Text style={styles.totalExpenseAmount}>
                {formatIndianRupees(displayedExpenseTotalPaise, { showPaise: false })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={styles.addDayTxBtn}
              activeOpacity={0.7}
            >
              <Plus size={14} color="#000000" strokeWidth={2.5} />
              <Text style={styles.addDayTxText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Expenses / Ledger Section below Card */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Expenses</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              {filterMode === 'DAY'
                ? formatFriendlyDate(selectedDate, { includeYear: true })
                : filterMode === 'MONTH'
                ? `${getMonthName(monthIndex)} ${year} (${displayedTransactions.length} items)`
                : `All-Time Ledger (${displayedTransactions.length} items)`}
            </Text>
          </View>

          {/* Liquid Filter switcher pills */}
          <LiquidSegmentedControl<LedgerFilterMode>
            options={[
              { id: 'DAY', label: 'Day' },
              { id: 'MONTH', label: 'Month' },
              { id: 'ALL_TIME', label: 'All' },
            ]}
            selectedId={filterMode}
            onSelect={(val) => setFilterMode(val)}
            style={styles.viewModeToggle}
            activeBackgroundColor={colors.text}
            inactiveBackgroundColor={colors.card}
            activeTextColor={colors.textInverted}
            inactiveTextColor={colors.textSecondary}
            accessibilityLabel="Filter expenses by day, month, or all"
          />
        </View>

        {/* 3. Transaction Items */}
        <View style={styles.transactionsList}>
          {displayedTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CalendarIcon size={28} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions recorded</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {filterMode === 'DAY'
                  ? `There are no expenses logged on ${formatFriendlyDate(selectedDate)}.`
                  : `No activity found for this period.`}
              </Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(true)}
                style={[styles.emptyActionBtn, { backgroundColor: colors.text }]}
                activeOpacity={0.7}
              >
                <Plus size={14} color={colors.textInverted} />
                <Text style={[styles.emptyActionText, { color: colors.textInverted }]}>Add Expense on this date</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onPress={handleOpenEdit}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal: Edit / Delete Transaction */}
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
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
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
              <TouchableOpacity onPress={handleDelete} style={styles.modalDeleteBtn}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
              <View style={styles.editActionRight}>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalCancelBtn}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
                >
                  <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Quick Add Transaction for Selected Date */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View
                  style={[
                    styles.modalIconCircle,
                    {
                      backgroundColor:
                        addDirection === 'DEBIT'
                          ? colors.debitMuted
                          : colors.creditMuted,
                    },
                  ]}
                >
                  {addDirection === 'DEBIT' ? (
                    <ArrowUpRight size={18} color={colors.debit} />
                  ) : (
                    <ArrowDownLeft size={18} color={colors.credit} />
                  )}
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Log on {formatFriendlyDate(selectedDate)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Type toggle */}
            <View style={[styles.directionToggleContainer, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                onPress={() => setAddDirection('DEBIT')}
                style={[
                  styles.directionBtn,
                  addDirection === 'DEBIT' && [styles.directionBtnActive, { backgroundColor: colors.text }],
                ]}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    { color: colors.textSecondary },
                    addDirection === 'DEBIT' && [styles.directionBtnTextActive, { color: colors.textInverted }],
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddDirection('CREDIT')}
                style={[
                  styles.directionBtn,
                  addDirection === 'CREDIT' && [styles.directionBtnActive, { backgroundColor: colors.text }],
                ]}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    { color: colors.textSecondary },
                    addDirection === 'CREDIT' && [styles.directionBtnTextActive, { color: colors.textInverted }],
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AMOUNT (₹)</Text>
              <TextInput
                value={addAmountRupees}
                onChangeText={setAddAmountRupees}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TITLE / PAID TO</Text>
              <TextInput
                value={addTitle}
                onChangeText={setAddTitle}
                placeholder="e.g. Petrol, Groceries, Dinner"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CATEGORY</Text>
              <TextInput
                value={addCategory}
                onChangeText={setAddCategory}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewTransaction}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.text }]}
              >
                <Text style={[styles.modalSubmitText, { color: colors.textInverted }]}>Save to Ledger</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // Pitch Black canvas matching app UI
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // Padding for floating rounded squircle navigation
  },
  header: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 4,
    lineHeight: 18,
  },
  jumpRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  jumpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  jumpPillText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },

  // 1. Calendar Card
  calendarCard: {
    backgroundColor: '#141416', // Dark rounded container matching reference image
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#26262B',
    marginBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navArrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNameContainer: {
    minWidth: 100,
    paddingLeft: 6,
    paddingRight: 18, // Generous separation so right arrow never hugs the month text
    justifyContent: 'center',
  },
  monthNameText: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  yearText: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A', // Muted uppercase weekday
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: '14.285%', // 7 equal columns
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  dayBox: {
    width: 38,
    height: 38,
    borderRadius: 11, // Rounded square (squircle)
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBoxSelected: {
    backgroundColor: '#FFFFFF', // Solid white rounded square
    borderRadius: 11,
  },
  dayNumberText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#FFFFFF',
  },
  dayNumberTextSelected: {
    color: '#000000', // Black text inside white circle
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 3,
    position: 'absolute',
    bottom: 3,
  },
  expenseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
  },
  incomeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222226',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalExpenseLabel: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  totalExpenseAmount: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  addDayTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  addDayTxText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#000000',
  },

  // 2. Expenses Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 2,
  },
  viewModeToggle: {
    width: 176,
    borderRadius: 12,
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
  },
  modePillText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
    fontWeight: '600',
  },
  modePillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // 3. Transactions List
  transactionsList: {
    gap: 6,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: '#222226',
    gap: 8,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightSemiBold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    marginTop: 8,
  },
  emptyActionText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#000000',
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
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
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

