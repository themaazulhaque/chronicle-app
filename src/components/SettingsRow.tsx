import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';

interface SettingsRowProps {
  label: string;
  description?: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  loading?: boolean;
}

export function SettingsRow({ label, description, value, icon, iconColor, onPress, destructive, showChevron, loading }: SettingsRowProps) {
  const hasChevron = showChevron === true || (showChevron === undefined && false);

  const content = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.iconContainer, iconColor ? { backgroundColor: iconColor } : null]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={styles.trailing}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <>
            {value && <Text style={styles.value}>{value}</Text>}
            {hasChevron && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [pressed && styles.pressed]} onPress={onPress} disabled={loading}>
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
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
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
