import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../theme';

export interface CategoryChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  label,
  icon,
  selected = false,
  onPress,
  style,
  textStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon && <span style={styles.iconContainer as any}>{icon}</span>}
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    gap: theme.spacing.xs + 2,
  },
  chipUnselected: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  iconContainer: {
    marginRight: 2,
  },
  text: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  textUnselected: {
    color: theme.colors.textSecondary,
  },
  textSelected: {
    color: theme.colors.textInverted,
  },
});

