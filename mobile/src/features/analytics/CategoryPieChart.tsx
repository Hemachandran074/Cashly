import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { PieChart as PieChartIcon } from 'lucide-react-native';
import { theme, useAppTheme } from '../../theme';
import { formatIndianRupees } from '../../utils/money';

export interface CategorySpendSlice {
  name: string;
  amountPaise: number;
  percentage: number;
  color?: string;
}

export interface CategoryPieChartProps {
  categories: CategorySpendSlice[];
  totalExpensePaise: number;
  style?: ViewStyle;
}

// Sophisticated high-contrast monochrome & zinc palette matching Cashly aesthetic
const DARK_PALETTE = [
  '#FFFFFF', // Pure White (Top category)
  '#D4D4D8', // Silver (Zinc 300)
  '#A1A1AA', // Neutral Silver (Zinc 400)
  '#71717A', // Medium Gray (Zinc 500)
  '#52525B', // Dark Gray (Zinc 600)
  '#3F3F46', // Deep Charcoal (Zinc 700)
  '#27272A', // Dark Charcoal (Zinc 800)
];

const LIGHT_PALETTE = [
  '#000000', // Pitch Black (Top category)
  '#27272A', // Dark Charcoal (Zinc 800)
  '#3F3F46', // Deep Charcoal (Zinc 700)
  '#52525B', // Dark Gray (Zinc 600)
  '#71717A', // Medium Gray (Zinc 500)
  '#A1A1AA', // Neutral Silver (Zinc 400)
  '#D4D4D8', // Light Silver (Zinc 300)
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
  totalExpensePaise,
  style,
}) => {
  const { colors, isDark } = useAppTheme();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // Assign colors to categories
  const slicesWithColors = useMemo(() => {
    return categories.map((cat, idx) => ({
      ...cat,
      color: cat.color || palette[idx % palette.length],
    }));
  }, [categories, palette]);

  // Selected slice or fallback to overall totals
  const activeSlice = useMemo(() => {
    if (!selectedCategoryName) return null;
    return slicesWithColors.find((s) => s.name === selectedCategoryName) || null;
  }, [selectedCategoryName, slicesWithColors]);

  const size = 190;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 78;
  const rInner = 52;
  const strokeWidth = rOuter - rInner;
  const midRadius = (rOuter + rInner) / 2;

  // Geometry computation for pie arcs
  const arcPaths = useMemo(() => {
    if (slicesWithColors.length === 0 || totalExpensePaise <= 0) {
      return [];
    }

    // Special case: Single category (100%)
    if (slicesWithColors.length === 1) {
      return [
        {
          ...slicesWithColors[0],
          pathData: '',
          isSingle: true,
        },
      ];
    }

    let currentAngle = -Math.PI / 2; // Start from top 12 o'clock
    const gap = 0.04; // Small elegant gap between slices

    return slicesWithColors.map((slice) => {
      const sliceFraction = slice.amountPaise / totalExpensePaise;
      const sweepAngle = sliceFraction * 2 * Math.PI;

      const startAngle = currentAngle + (sweepAngle > gap ? gap / 2 : 0);
      const endAngle = currentAngle + sweepAngle - (sweepAngle > gap ? gap / 2 : 0);

      currentAngle += sweepAngle;

      const x1 = cx + rOuter * Math.cos(startAngle);
      const y1 = cy + rOuter * Math.sin(startAngle);
      const x2 = cx + rOuter * Math.cos(endAngle);
      const y2 = cy + rOuter * Math.sin(endAngle);

      const x3 = cx + rInner * Math.cos(endAngle);
      const y3 = cy + rInner * Math.sin(endAngle);
      const x4 = cx + rInner * Math.cos(startAngle);
      const y4 = cy + rInner * Math.sin(startAngle);

      const largeArcFlag = sweepAngle > Math.PI ? 1 : 0;

      const pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

      return {
        ...slice,
        pathData,
        isSingle: false,
      };
    });
  }, [slicesWithColors, totalExpensePaise, cx, cy, rOuter, rInner]);

  const handleToggleSelect = (name: string) => {
    setSelectedCategoryName((prev) => (prev === name ? null : name));
  };

  if (categories.length === 0 || totalExpensePaise <= 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <PieChartIcon size={16} color={colors.textSecondary} />
            <Text style={[styles.title, { color: colors.text }]}>Category Expense Distribution</Text>
          </View>
        </View>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No category expenses logged for this period.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <PieChartIcon size={16} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>Category Expense Distribution</Text>
        </View>
        <Text style={[styles.subtitleBadge, { color: colors.textMuted }]}>{categories.length} segments</Text>
      </View>

      {/* Donut Chart & Center Readout */}
      <View style={styles.chartCenterContainer}>
        <View style={styles.svgWrapper}>
          <Svg width={size} height={size}>
            <G>
              {arcPaths.map((slice) => {
                const isSelected = selectedCategoryName === slice.name;
                const isDimmed = selectedCategoryName !== null && !isSelected;

                if (slice.isSingle) {
                  return (
                    <Circle
                      key={slice.name}
                      cx={cx}
                      cy={cy}
                      r={midRadius}
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      opacity={isDimmed ? 0.35 : 1}
                    />
                  );
                }

                return (
                  <Path
                    key={slice.name}
                    d={slice.pathData}
                    fill={slice.color}
                    opacity={isDimmed ? 0.3 : 1}
                    onPress={() => handleToggleSelect(slice.name)}
                  />
                );
              })}
            </G>
          </Svg>

          {/* Centered Donut Readout */}
          <View style={[styles.centerReadout, { backgroundColor: colors.card }]} pointerEvents="none">
            <Text style={[styles.centerTitle, { color: colors.textMuted }]} numberOfLines={1}>
              {activeSlice ? activeSlice.name : 'Total Spent'}
            </Text>
            <Text style={[styles.centerAmount, { color: colors.text }]}>
              {formatIndianRupees(
                activeSlice ? activeSlice.amountPaise : totalExpensePaise,
                { showPaise: false }
              )}
            </Text>
            <Text style={[styles.centerPercentage, { color: colors.textSecondary }]}>
              {activeSlice ? `${activeSlice.percentage}%` : '100%'}
            </Text>
          </View>
        </View>
      </View>

      {/* Interactive Category Legend */}
      <View style={styles.legendContainer}>
        {slicesWithColors.map((slice) => {
          const isSelected = selectedCategoryName === slice.name;
          const isDimmed = selectedCategoryName !== null && !isSelected;

          return (
            <TouchableOpacity
              key={slice.name}
              onPress={() => handleToggleSelect(slice.name)}
              style={[
                styles.legendItem,
                { backgroundColor: colors.background, borderColor: colors.border },
                isSelected && [styles.legendItemSelected, { borderColor: colors.text, backgroundColor: colors.cardHighlight }],
                isDimmed && styles.legendItemDimmed,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.legendLeft}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: slice.color },
                    isSelected && styles.colorSwatchSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.legendName,
                    { color: colors.text },
                    isSelected && [styles.legendNameSelected, { color: colors.text }],
                  ]}
                  numberOfLines={1}
                >
                  {slice.name}
                </Text>
              </View>

              <View style={styles.legendRight}>
                <Text style={[styles.legendPercent, { color: colors.textMuted }]}>{slice.percentage}%</Text>
                <Text style={[styles.legendAmount, { color: colors.text }]}>
                  {formatIndianRupees(slice.amountPaise, { showPaise: false })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    marginBottom: 16,
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
  subtitleBadge: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#71717A',
  },
  emptyText: {
    fontSize: 13,
    color: '#71717A',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 18,
  },
  chartCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerReadout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 104,
    height: 104,
    borderRadius: 52,
    paddingHorizontal: 8,
  },
  centerTitle: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#A1A1AA',
    textAlign: 'center',
  },
  centerAmount: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.delightBold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  centerPercentage: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.delightSemiBold,
    color: '#71717A',
    marginTop: 2,
  },
  legendContainer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#222226',
    paddingTop: 14,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  legendItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendItemDimmed: {
    opacity: 0.45,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  colorSwatchSelected: {
    transform: [{ scale: 1.3 }],
  },
  legendName: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightMedium,
    color: '#D4D4D8',
    flex: 1,
  },
  legendNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendPercent: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightRegular,
    color: '#71717A',
  },
  legendAmount: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.delightBold,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

