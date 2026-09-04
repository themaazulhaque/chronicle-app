import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface DateNavigatorProps {
  currentDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function DateNavigator({ currentDate, onPrevious, onNext, onToday }: DateNavigatorProps) {
  const isToday = formatDateLabel(currentDate) === 'Today';

  return (
    <View style={styles.container}>
      <Pressable style={styles.arrowButton} onPress={onPrevious}>
        <Ionicons name="chevron-back" size={20} color={colors.accent} />
      </Pressable>
      <Pressable style={styles.labelContainer} onPress={onToday}>
        <Text style={styles.label}>{formatDateLabel(currentDate)}</Text>
      </Pressable>
      <Pressable
        style={[styles.arrowButton, isToday && styles.arrowDisabled]}
        onPress={isToday ? undefined : onNext}
      >
        <Ionicons name="chevron-forward" size={20} color={isToday ? colors.textMuted : colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.xxl,
  },
  arrowButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  labelContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: 220,
    alignItems: 'center',
  },
  label: {
    ...typography.headline,
    color: colors.textPrimary,
  },
});
