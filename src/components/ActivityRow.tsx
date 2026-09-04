import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography } from '../theme';``
import { formatTime } from '../utils/formatting';
import { AppIcon } from './AppIcon';

interface ActivityRowProps { appName: string; appIcon?: string; lastTimeUsed: number; totalTimeInForeground: number; onPress?: () => void }

export function ActivityRow({ appName, appIcon, lastTimeUsed, totalTimeInForeground, onPress }: ActivityRowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open details for ${appName}`} style={({ pressed }) => [styles.container, pressed && styles.pressed]} onPress={onPress}>
      <AppIcon uri={appIcon} size={40} />
      <View style={styles.content}>
        <Text style={styles.appName} numberOfLines={1} ellipsizeMode="tail">{appName}</Text>
        <Text style={styles.timeRange} numberOfLines={1}>Last opened {formatTime(new Date(lastTimeUsed))}</Text>
      </View>
      <Text style={styles.duration}>{Math.round(totalTimeInForeground / 60000)} min</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, minHeight: 52, minWidth: 0 },
  pressed: { backgroundColor: colors.surfaceSecondary },
  content: { flex: 1, minWidth: 0, marginHorizontal: spacing.md },
  appName: { ...typography.body, color: colors.textPrimary, fontWeight: '500', marginBottom: 2 },
  timeRange: { ...typography.subhead, color: colors.textSecondary },
  duration: { ...typography.subhead, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
});
