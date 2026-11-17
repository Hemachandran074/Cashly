import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { formatIndianRupees } from '../../utils/money';

export type AmountVariant = 'neutral' | 'credit' | 'debit' | 'exchange' | 'muted';
export type AmountSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface AmountTextProps {
  paise: number;
  variant?: AmountVariant;
  size?: AmountSize;
  weight?: keyof typeof theme.typography.weights;
  showPaise?: boolean;
  showSymbol?: boolean;
  signDisplay?: 'never' | 'auto' | 'always';
  style?: TextStyle;
  numberOfLines?: number;
}

export const AmountText: React.FC<AmountTextProps> = ({
  paise,
  variant = 'neutral',
  size = 'md',
  weight = 'semibold',
  showPaise = true,
  showSymbol = true,
  signDisplay = 'auto',
  style,
  numberOfLines = 1,
}) => {
  const formattedText = formatIndianRupees(paise, {
    showPaise,
    showSymbol,
    signDisplay,
  });

  const getVariantColor = () => {
    switch (variant) {
      case 'credit':
        return theme.colors.credit;
      case 'debit':
        return theme.colors.debit;
      case 'exchange':
        return theme.colors.exchange;
      case 'muted':
        return theme.colors.textMuted;
      case 'neutral':
      default:
        return theme.colors.text;
    }
  };

  const getFontSize = () => {
    return theme.typography.sizes[size] || theme.typography.sizes.md;
  };

  const getLineHeight = () => {
    return theme.typography.lineHeights[size] || theme.typography.lineHeights.md;
  };

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        {
          color: getVariantColor(),
          fontSize: getFontSize(),
          lineHeight: getLineHeight(),
          fontWeight: theme.typography.weights[weight],
        },
        style,
      ]}
    >
      {formattedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    letterSpacing: -0.3,
  },
});

