import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import {
  Fuel,
  Coffee,
  Utensils,
  Briefcase,
  ArrowLeftRight,
  CreditCard,
  ShoppingBag,
} from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { formatIndianRupees } from '../../utils/money';
import { Transaction } from '../../types/domain';

export interface TransactionRowProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  style?: ViewStyle;
}

function renderCategoryIcon(
  title: string,
  category?: string | null,
  color: string = '#FFFFFF',
  size: number = 20
) {
  const lower = `${title} ${category || ''}`.toLowerCase();
  if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('car')) {
    return <Fuel size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('tea') || lower.includes('coffee') || lower.includes('chai')) {
    return <Coffee size={size} color={color} strokeWidth={2} />;
  }
  if (
    lower.includes('snack') ||
    lower.includes('burger') ||
    lower.includes('bakery') ||
    lower.includes('mess') ||
    lower.includes('food') ||
    lower.includes('hotel') ||
    lower.includes('dining')
  ) {
    return <Utensils size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('salary') || lower.includes('income')) {
    return <Briefcase size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('exchange') || lower.includes('cash')) {
    return <ArrowLeftRight size={size} color={color} strokeWidth={2} />;
  }
  if (lower.includes('shop') || lower.includes('grocery') || lower.includes('mart')) {
    return <ShoppingBag size={size} color={color} strokeWidth={2} />;
  }
  return <CreditCard size={size} color={color} strokeWidth={2} />;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onPress,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  const isCredit = transaction.direction === 'CREDIT';
  const isExchange = transaction.kind === 'EXCHANGE_LEG';

  const title =
    transaction.counterparty_name ||
    (isExchange ? 'Cash Exchange' : transaction.category_name || 'Transaction');

  // Format occurred_at date into "08 April 2026 • 4:45 PM"
  const dateObj = new Date(transaction.occurred_at);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${hours}:${minutes} ${ampm}`;
  const dateDisplay = `${day} ${month} ${year} • ${timeStr}`;

  // Amount formatting matching the reference: -₹100 or +₹500
  const absAmount = formatIndianRupees(transaction.amount_paise, {
    showPaise: false,
    showSymbol: true,
  });
  const amountDisplay = isExchange
    ? absAmount
    : isCredit
    ? `+${absAmount}`
    : `-${absAmount}`;

  const amountColor = isExchange
    ? colors.exchange
    : isCredit
    ? colors.credit
    : colors.debit;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={() => onPress?.(transaction)}
      style={[styles.container, style]}
      accessibilityRole="button"
    >
      {/* Left: Circular dark avatar with Lucide icon */}
      <View style={styles.leftGroup}>
        <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E1E24' : '#181B2B', borderColor: isDark ? '#2A2A32' : '#2A2E44' }]}>
          {renderCategoryIcon(title, transaction.category_name, '#FFFFFF', 18)}
        </View>

        <View style={styles.detailsGroup}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.dateSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {dateDisplay}
          </Text>
        </View>
      </View>

      {/* Right: Amount */}
      <Text style={[styles.amountText, { color: amountColor }]}>
        {amountDisplay}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsGroup: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  dateSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#8E8E93',
  },
  amountText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
