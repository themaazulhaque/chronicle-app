import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { AppInfo } from '../types';
import { AppIcon } from './AppIcon';

interface AppRowProps { app: AppInfo; onPress?: () => void }

function formatLastOpened(date?: Date): string {
  if (!date) return 'No usage reported';
  const diffHours = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (diffHours < 24) return `Last opened today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return `Last opened ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

export function AppRow({ app, onPress }: AppRowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open details for ${app.name}`} style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <AppIcon uri={app.icon} />
      <View style={styles.content}>
        <Text style={styles.appName} numberOfLines={1} ellipsizeMode="tail">{app.name}</Text>
        <Text style={styles.lastOpened} numberOfLines={1} ellipsizeMode="tail">{formatLastOpened(app.lastOpened)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, minHeight: 60, minWidth: 0 },
  pressed: { backgroundColor: colors.surfaceSecondary },
  content: { flex: 1, minWidth: 0, marginHorizontal: spacing.md },
  appName: { ...typography.body, color: colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  lastOpened: { ...typography.subhead, color: colors.textSecondary },
});
