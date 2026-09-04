import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface SessionDayHeaderProps {
  label: string;
}

export function SessionDayHeader({ label }: SessionDayHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  label: {
    ...typography.groupedHeader,
    color: colors.groupedHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
