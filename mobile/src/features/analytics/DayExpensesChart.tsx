import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { TrendingUp, Activity, Calendar } from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { Transaction } from '../../types/domain';
import { formatIndianRupees } from '../../utils/money';
import { formatFriendlyDate } from '../../utils/date';

export interface DayData {
  dateString: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "M", "T", "W"
  dayNumber: string; // e.g. "09"
  expensePaise: number;
  incomePaise: number;
  transactionCount: number;
}

export interface DayExpensesChartProps {
  days: DayData[];
  onSelectDay?: (day: DayData) => void;
  style?: ViewStyle;
}

export const DayExpensesChart: React.FC<DayExpensesChartProps> = ({
  days,
  onSelectDay,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  // Find highest expense to scale the bars proportionally
  const maxExpensePaise = useMemo(() => {
    const max = Math.max(...days.map((d) => d.expensePaise), 0);
    return max > 0 ? max : 100000; // Minimum baseline ₹1,000 scale
  }, [days]);

  // Default to selecting the day with the highest expense or the last day
  const defaultSelectedDate = useMemo(() => {
    const withExpense = [...days].reverse().find((d) => d.expensePaise > 0);
    return withExpense ? withExpense.dateString : days[days.length - 1]?.dateString;
  }, [days]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultSelectedDate);

  // Currently inspected day
  const activeDay = useMemo(() => {
    return days.find((d) => d.dateString === selectedDate) || days[days.length - 1];
  }, [days, selectedDate]);

  const handleBarPress = (day: DayData) => {
    setSelectedDate(day.dateString);
    if (onSelectDay) {
      onSelectDay(day);
    }
  };

  const chartHeight = 110;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {/* Header with Title and Mode Indicator */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Activity size={16} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>Day Spending & Activity</Text>
        </View>
        <Text style={[styles.periodLabel, { color: colors.textMuted }]}>{days.length} Days View</Text>
      </View>

      {/* Selected Day Inspection Highlight Banner */}
      {activeDay && (
        <View style={[styles.inspectionBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.inspectionDate, { color: colors.textMuted }]}>
              {formatFriendlyDate(activeDay.dateString, { includeYear: true })}
            </Text>
            <Text style={[styles.inspectionAmount, { color: colors.text }]}>
              {formatIndianRupees(activeDay.expensePaise, { showPaise: false })}
            </Text>
          </View>
          <View style={[styles.inspectionBadge, { backgroundColor: colors.cardHighlight }]}>
            <Text style={[styles.inspectionBadgeText, { color: colors.textSecondary }]}>
              {activeDay.transactionCount}{' '}
              {activeDay.transactionCount === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>
        </View>
      )}

      {/* Chart Canvas */}
      <View style={[styles.chartCanvas, { height: chartHeight + 40 }]}>
        {/* Horizontal reference threshold lines */}
        <View style={[styles.gridLine, { top: 0, backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { top: chartHeight / 2, backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { top: chartHeight, backgroundColor: colors.border }]} />

        {/* Bars Container */}
        <View style={[styles.barsRow, { height: chartHeight }]}>
          {days.map((day) => {
            const isSelected = day.dateString === selectedDate;
            const hasActivity = day.expensePaise > 0 || day.transactionCount > 0;
            // Scale bar height between 6px minimum (for zero) and chartHeight
            const normalizedHeight =
              day.expensePaise > 0
                ? Math.max(14, (day.expensePaise / maxExpensePaise) * chartHeight)
                : day.transactionCount > 0
                ? 10
                : 4;

            return (
              <TouchableOpacity
                key={day.dateString}
                onPress={() => handleBarPress(day)}
                style={styles.barColumn}
                activeOpacity={0.7}
              >
                {/* Bar Pill */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: normalizedHeight },
                      isSelected
                        ? [styles.barFillSelected, { backgroundColor: colors.text }]
                        : hasActivity
                        ? [styles.barFillActive, { backgroundColor: isDark ? '#3F3F46' : '#71717A' }]
                        : [styles.barFillEmpty, { backgroundColor: isDark ? '#222226' : '#E4E4E7' }],
                    ]}
                  />
                </View>

                {/* Day Labels below bar */}
                <View style={styles.labelWrapper}>
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.textMuted },
                      isSelected && [styles.dayTextSelected, { color: colors.text }],
                    ]}
                  >
                    {day.dayLabel}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumText,
                      { color: colors.textMuted },
                      isSelected && [styles.dateNumTextSelected, { color: colors.text }],
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer Insight */}
      <View style={[styles.chartFooter, { borderTopColor: colors.border }]}>
        <View style={styles.insightItem}>
          <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Active Days</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>
            {days.filter((d) => d.expensePaise > 0).length} of {days.length}
          </Text>
        </View>
        <View style={[styles.insightDivider, { backgroundColor: colors.border }]} />
        <View style={styles.insightItem}>
          <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Peak Day</Text>
          <Text style={[styles.insightValue, { color: colors.text }]}>
            {formatIndianRupees(maxExpensePaise, { showPaise: false })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141416',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#26262B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  periodLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
  },
  inspectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C20',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2E36',
  },
  inspectionDate: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#A1A1AA',
  },
  inspectionAmount: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  inspectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  inspectionBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#FFFFFF',
  },
  chartCanvas: {
    position: 'relative',
    justifyContent: 'flex-start',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1F1F24',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  barTrack: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 2,
  },
  barFill: {
    width: 14,
    borderRadius: 7, // Pill shaped bars
  },
  barFillSelected: {
    backgroundColor: '#FFFFFF', // Solid bright white for selected day
    width: 18,
    borderRadius: 9,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  barFillActive: {
    backgroundColor: '#3F3F46', // Refined charcoal for days with expenses
  },
  barFillEmpty: {
    backgroundColor: '#222226', // Subtle track for 0-expense days
  },
  labelWrapper: {
    alignItems: 'center',
    marginTop: 8,
    gap: 1,
  },
  dayText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateNumText: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#52525B',
  },
  dateNumTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#222226',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
  },
  insightValue: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  insightDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#26262B',
  },
});

