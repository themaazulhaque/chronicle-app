import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../theme';

const SHIMMER_COLORS = [colors.borderSubtle, '#EDEDF0', colors.borderSubtle];
const SHIMMER_DURATION = 1200;

function ShimmerBlock({ style }: { style?: object }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: SHIMMER_DURATION, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(animatedValue, { toValue: 0, duration: SHIMMER_DURATION, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const interpolatedColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: SHIMMER_COLORS,
  });

  return <Animated.View style={[styles.shimmerBase, style, { backgroundColor: interpolatedColor }]} />;
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <ShimmerBlock style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <ShimmerBlock style={styles.rowTitle} />
        <ShimmerBlock style={styles.rowSubtitle} />
      </View>
      <ShimmerBlock style={styles.rowDuration} />
    </View>
  );
}

export function AppSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Activity</Text>
      </View>

      <View style={styles.dateNav}>
        <ShimmerBlock style={styles.dateArrow} />
        <ShimmerBlock style={styles.dateLabel} />
        <ShimmerBlock style={styles.dateArrow} />
      </View>

      <View style={styles.summaryBar}>
        <ShimmerBlock style={styles.summaryText} />
      </View>

      <View style={styles.dayHeader}>
        <ShimmerBlock style={styles.dayHeaderText} />
      </View>

      <View style={styles.listArea}>
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <ShimmerBlock style={styles.tabIcon} />
          <ShimmerBlock style={styles.tabLabel} />
        </View>
        <View style={styles.tabItem}>
          <ShimmerBlock style={styles.tabIcon} />
          <ShimmerBlock style={styles.tabLabel} />
        </View>
        <View style={styles.tabItem}>
          <ShimmerBlock style={styles.tabIcon} />
          <ShimmerBlock style={styles.tabLabel} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  shimmerBase: { borderRadius: radius.sm },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.xxl },
  dateArrow: { width: 48, height: 48, borderRadius: 18 },
  dateLabel: { width: 120, height: 20, borderRadius: radius.sm },
  summaryBar: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  summaryText: { width: 140, height: 14, borderRadius: radius.sm },
  dayHeader: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  dayHeaderText: { width: 60, height: 12, borderRadius: radius.sm },
  listArea: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, minHeight: 52 },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm },
  rowContent: { flex: 1, marginHorizontal: spacing.md, gap: 6 },
  rowTitle: { width: '70%', height: 16, borderRadius: radius.sm },
  rowSubtitle: { width: '45%', height: 12, borderRadius: radius.sm },
  rowDuration: { width: 44, height: 12, borderRadius: radius.sm },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: spacing.base + 56 },
  tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle, backgroundColor: colors.surface, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { width: 24, height: 24, borderRadius: 12 },
  tabLabel: { width: 40, height: 8, borderRadius: radius.sm },
});
