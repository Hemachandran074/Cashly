import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  Smartphone,
  Utensils,
  Fuel,
  Coffee,
  ShoppingBag,
  CreditCard,
  Briefcase,
  Layers,
} from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { useTransactionStore } from '../transactions/transactionStore';
import { Transaction } from '../../types/domain';
import { formatIndianRupees } from '../../utils/money';
import { getLocalDateString } from '../../utils/date';
import { DayExpensesChart, DayData } from './DayExpensesChart';
import { CategoryPieChart } from './CategoryPieChart';
import { LiquidSegmentedControl } from '../../components/primitives';

type PeriodMode = '7D' | '30D' | 'ALL';

function renderCategoryIcon(categoryName: string, size = 16, color = '#FFFFFF') {
  const lower = categoryName.toLowerCase();
  if (lower.includes('food') || lower.includes('dining') || lower.includes('mess')) {
    return <Utensils size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('transport')) {
    return <Fuel size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('snack') || lower.includes('coffee') || lower.includes('tea')) {
    return <Coffee size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('shop') || lower.includes('grocer') || lower.includes('mart')) {
    return <ShoppingBag size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('salary') || lower.includes('income')) {
    return <Briefcase size={size} color={color} strokeWidth={2} />;
  }
  return <CreditCard size={size} color={color} strokeWidth={2} />;
}

export const AnalyticsScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const transactions = useTransactionStore((s) => s.transactions);
  const [period, setPeriod] = useState<PeriodMode>('7D');

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    if (period === 'ALL') {
      return transactions;
    }

    const today = new Date();
    const daysAgo = period === '7D' ? 7 : 30;
    const cutoffDate = new Date(today);
    cutoffDate.setDate(today.getDate() - daysAgo);
    const cutoffStr = getLocalDateString(cutoffDate);

    // If transactions are in historical reference months (e.g. October 2026),
    // and there are items in October, ensure the 7D / 30D window considers available activity:
    const hasRecentItems = transactions.some((t) => t.local_date >= cutoffStr);
    if (!hasRecentItems && transactions.length > 0) {
      // Find the latest transaction date in store to anchor the 7D/30D view
      const sorted = [...transactions].sort((a, b) =>
        b.local_date.localeCompare(a.local_date)
      );
      const latestDate = new Date(sorted[0].local_date);
      const anchorCutoff = new Date(latestDate);
      anchorCutoff.setDate(latestDate.getDate() - daysAgo);
      const anchorStr = getLocalDateString(anchorCutoff);
      return transactions.filter((t) => t.local_date >= anchorStr);
    }

    return transactions.filter((t) => t.local_date >= cutoffStr);
  }, [transactions, period]);

  // Totals calculations
  const totalExpensePaise = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [filteredTransactions]);

  const totalIncomePaise = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.direction === 'CREDIT' && t.kind !== 'EXCHANGE_LEG')
      .reduce((sum, t) => sum + t.amount_paise, 0);
  }, [filteredTransactions]);

  const netSavingsPaise = totalIncomePaise - totalExpensePaise;

  // Digital vs Cash spend breakdown
  const channelBreakdown = useMemo(() => {
    let digitalPaise = 0;
    let cashPaise = 0;
    let exchangePaise = 0;

    for (const t of filteredTransactions) {
      if (t.kind === 'EXCHANGE_LEG') {
        exchangePaise += t.amount_paise;
      } else if (t.direction === 'DEBIT') {
        if (t.payment_method === 'CASH') {
          cashPaise += t.amount_paise;
        } else {
          digitalPaise += t.amount_paise;
        }
      }
    }

    const totalSpend = digitalPaise + cashPaise;
    const digitalPct = totalSpend > 0 ? Math.round((digitalPaise / totalSpend) * 100) : 0;
    const cashPct = totalSpend > 0 ? 100 - digitalPct : 0;

    return {
      digitalPaise,
      cashPaise,
      exchangePaise,
      digitalPct,
      cashPct,
    };
  }, [filteredTransactions]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    for (const t of filteredTransactions) {
      if (t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG') {
        const cat = t.category_name || 'General';
        map.set(cat, (map.get(cat) || 0) + t.amount_paise);
      }
    }

    const items = Array.from(map.entries())
      .map(([name, amountPaise]) => ({
        name,
        amountPaise,
        percentage:
          totalExpensePaise > 0
            ? Math.round((amountPaise / totalExpensePaise) * 100)
            : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    return items;
  }, [filteredTransactions, totalExpensePaise]);

  // Compute 7 days series for DayExpensesChart
  const chartDaysData: DayData[] = useMemo(() => {
    const numDays = 7;
    const weekdaysShort = ['SU', 'M', 'T', 'W', 'TH', 'F', 'S'];

    // Anchor around latest transaction or today
    let anchorDate = new Date();
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) =>
        b.local_date.localeCompare(a.local_date)
      );
      const latestDateStr = sorted[0].local_date;
      if (latestDateStr > getLocalDateString()) {
        anchorDate = new Date(latestDateStr);
      }
    }

    const result: DayData[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayTxs = transactions.filter((t) => t.local_date === dateStr);

      const expense = dayTxs
        .filter((t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG')
        .reduce((sum, t) => sum + t.amount_paise, 0);

      const income = dayTxs
        .filter((t) => t.direction === 'CREDIT' && t.kind !== 'EXCHANGE_LEG')
        .reduce((sum, t) => sum + t.amount_paise, 0);

      result.push({
        dateString: dateStr,
        dayLabel: weekdaysShort[d.getDay()],
        dayNumber: d.getDate().toString().padStart(2, '0'),
        expensePaise: expense,
        incomePaise: income,
        transactionCount: dayTxs.length,
      });
    }

    return result;
  }, [transactions]);

  // Average transaction amount
  const averageTxPaise = useMemo(() => {
    const debitTxs = filteredTransactions.filter(
      (t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG'
    );
    if (debitTxs.length === 0) return 0;
    return Math.round(totalExpensePaise / debitTxs.length);
  }, [filteredTransactions, totalExpensePaise]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={colors.statusBar} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Cash flow insights and daily spending patterns</Text>
        </View>

        {/* Period Selector Toggle with Liquid Motion */}
        <LiquidSegmentedControl<PeriodMode>
          options={[
            { id: '7D', label: '7 Days' },
            { id: '30D', label: '30 Days' },
            { id: 'ALL', label: 'All Time' },
          ]}
          selectedId={period}
          onSelect={(val) => setPeriod(val)}
          style={styles.periodToggleRow}
          activeBackgroundColor={isDark ? '#FFFFFF' : '#000000'}
          inactiveBackgroundColor={colors.card}
          activeTextColor={isDark ? '#000000' : '#FFFFFF'}
          inactiveTextColor={colors.textSecondary}
          accessibilityLabel="Select Analytics Period"
        />

        {/* 1. Hero Flow Metrics Card */}
        <View style={[styles.flowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.flowRow}>
            <View style={styles.flowItem}>
              <View style={styles.flowLabelRow}>
                <ArrowUpRight size={14} color={colors.debit} />
                <Text style={[styles.flowLabel, { color: colors.textMuted }]}>Total Expenses</Text>
              </View>
              <Text style={[styles.flowExpenseAmount, { color: colors.text }]}>
                {formatIndianRupees(totalExpensePaise, { showPaise: false })}
              </Text>
            </View>

            <View style={[styles.flowDivider, { backgroundColor: colors.border }]} />

            <View style={styles.flowItem}>
              <View style={styles.flowLabelRow}>
                <ArrowDownLeft size={14} color={colors.credit} />
                <Text style={[styles.flowLabel, { color: colors.textMuted }]}>Total Inflow</Text>
              </View>
              <Text style={[styles.flowIncomeAmount, { color: colors.credit }]}>
                {formatIndianRupees(totalIncomePaise, { showPaise: false })}
              </Text>
            </View>
          </View>

          {/* Net Flow Tag */}
          <View style={[styles.netSavingsBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.netSavingsLabel, { color: colors.textSecondary }]}>Net Cash Flow</Text>
            <Text
              style={[
                styles.netSavingsValue,
                netSavingsPaise >= 0 ? styles.savingsPositive : styles.savingsNegative,
              ]}
            >
              {netSavingsPaise >= 0 ? '+' : ''}
              {formatIndianRupees(netSavingsPaise, { showPaise: false })}
            </Text>
          </View>
        </View>

        {/* 2. Minimalist Day Expenses & Transactions Chart */}
        <DayExpensesChart days={chartDaysData} style={styles.chartWrapper} />

        {/* 3. Category Expenses Pie Chart */}
        <CategoryPieChart
          categories={categoryBreakdown}
          totalExpensePaise={totalExpensePaise}
          style={styles.chartWrapper}
        />

        {/* 4. Category Breakdown List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending by Category</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            {categoryBreakdown.length} {categoryBreakdown.length === 1 ? 'category' : 'categories'}
          </Text>
        </View>

        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {categoryBreakdown.length === 0 ? (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>No categorized expenses in this period.</Text>
          ) : (
            categoryBreakdown.map((cat, idx) => (
              <View key={cat.name} style={styles.categoryRow}>
                {idx > 0 && <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />}
                <View style={styles.categoryItemTop}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIconCircle, { backgroundColor: isDark ? '#1E1E24' : '#181B2B' }]}>
                      {renderCategoryIcon(cat.name, 14, '#FFFFFF')}
                    </View>
                    <View>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                      <Text style={[styles.categoryShare, { color: colors.textMuted }]}>{cat.percentage}% of total</Text>
                    </View>
                  </View>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    {formatIndianRupees(cat.amountPaise, { showPaise: false })}
                  </Text>
                </View>

                {/* Minimalist Proportion Bar */}
                <View style={[styles.progressBarTrack, { backgroundColor: colors.cardHighlight }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.max(4, cat.percentage)}%`, backgroundColor: colors.text },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* 4. Payment Channels (Digital vs Cash) */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Channels</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Digital vs Cash Liquidity</Text>
        </View>

        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.channelRow}>
            <View style={styles.channelLeft}>
              <Smartphone size={16} color={colors.text} />
              <View>
                <Text style={[styles.channelTitle, { color: colors.text }]}>Digital (UPI & Bank)</Text>
                <Text style={[styles.channelSubtitle, { color: colors.textMuted }]}>{channelBreakdown.digitalPct}% of spend</Text>
              </View>
            </View>
            <Text style={[styles.channelAmount, { color: colors.text }]}>
              {formatIndianRupees(channelBreakdown.digitalPaise, { showPaise: false })}
            </Text>
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

          <View style={styles.channelRow}>
            <View style={styles.channelLeft}>
              <Wallet size={16} color={colors.text} />
              <View>
                <Text style={[styles.channelTitle, { color: colors.text }]}>Physical Cash</Text>
                <Text style={[styles.channelSubtitle, { color: colors.textMuted }]}>{channelBreakdown.cashPct}% of spend</Text>
              </View>
            </View>
            <Text style={[styles.channelAmount, { color: colors.text }]}>
              {formatIndianRupees(channelBreakdown.cashPaise, { showPaise: false })}
            </Text>
          </View>

          {channelBreakdown.exchangePaise > 0 && (
            <>
              <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />
              <View style={styles.channelRow}>
                <View style={styles.channelLeft}>
                  <ArrowLeftRight size={16} color={colors.textMuted} />
                  <View>
                    <Text style={[styles.channelTitle, { color: colors.text }]}>Money Exchanged</Text>
                    <Text style={[styles.channelSubtitle, { color: colors.textMuted }]}>Net-worth neutral ATM swaps</Text>
                  </View>
                </View>
                <Text style={[styles.channelAmountNeutral, { color: colors.exchange }]}>
                  {formatIndianRupees(channelBreakdown.exchangePaise, { showPaise: false })}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* 5. Period Insights */}
        <View style={[styles.insightsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.insightStat}>
            <Text style={[styles.insightStatLabel, { color: colors.textMuted }]}>Avg Transaction</Text>
            <Text style={[styles.insightStatValue, { color: colors.text }]}>
              {formatIndianRupees(averageTxPaise, { showPaise: false })}
            </Text>
          </View>
          <View style={[styles.flowDivider, { backgroundColor: colors.border }]} />
          <View style={styles.insightStat}>
            <Text style={[styles.insightStatLabel, { color: colors.textMuted }]}>Total Volume</Text>
            <Text style={[styles.insightStatValue, { color: colors.text }]}>
              {filteredTransactions.length}{' '}
              {filteredTransactions.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110, // Margin for floating squircle pill bottom navigation
  },
  header: {
    marginBottom: 16,
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
  },
  periodToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#141416',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  periodPillActive: {
    backgroundColor: '#FFFFFF',
  },
  periodPillText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
    fontWeight: '600',
  },
  periodPillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // 1. Hero Flow Card
  flowCard: {
    backgroundColor: '#141416',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#26262B',
    marginBottom: 20,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowItem: {
    flex: 1,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  flowLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  flowExpenseAmount: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  flowIncomeAmount: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  flowDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#26262B',
    marginHorizontal: 16,
  },
  netSavingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C20',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  netSavingsLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },
  netSavingsValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
  },
  savingsPositive: {
    color: '#10B981',
  },
  savingsNegative: {
    color: '#EF4444',
  },

  // 2. Chart
  chartWrapper: {
    marginBottom: 24,
  },

  // 3. Section Headers & Cards
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
  },
  cardContainer: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26262B',
    marginBottom: 24,
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#222226',
    marginVertical: 14,
  },
  emptyNote: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },

  // Category Rows
  categoryRow: {
    gap: 8,
  },
  categoryItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#222226',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F2F36',
  },
  categoryName: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryShare: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#222226',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Channels
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  channelSubtitle: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
    marginTop: 1,
  },
  channelAmount: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  channelAmountNeutral: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
  },

  // Insights
  insightsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  insightStat: {
    alignItems: 'center',
  },
  insightStatLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
  },
  insightStatValue: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
});

