import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface GroupedSectionProps {
  header?: string;
  children: React.ReactNode;
  footer?: string;
}

export function GroupedSection({ header, children, footer }: GroupedSectionProps) {
  return (
    <View style={styles.container}>
      {header && <Text style={styles.header}>{header.toUpperCase()}</Text>}
      <View style={styles.group}>
        {children}
      </View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.section - spacing.base,
  },
  header: {
    ...typography.groupedHeader,
    color: colors.groupedHeader,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xxl,
  },
  group: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  footer: {
    ...typography.footnote,
    color: colors.textMuted,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    lineHeight: 18,
  },
});
