import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface SettingsRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export function SettingsRow({ label, value, icon, iconColor, onPress, destructive }: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconContainer, iconColor ? { backgroundColor: iconColor } : null]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
      <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
      <View style={styles.trailing}>
        {value && <Text style={styles.value}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    minHeight: 44,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  destructive: {
    color: colors.danger,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
