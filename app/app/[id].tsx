import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../src/theme';
import { usageTrackingService } from '../../src/services/usageTrackingService';
import { AppInfo, DailyUsageRecord, UsageSnapshot } from '../../src/types';
import { AppIcon } from '../../src/components/AppIcon';
import { GroupedSection } from '../../src/components/GroupedSection';
import { formatTime } from '../../src/utils/formatting';

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<AppInfo | null>(null);
  const [history, setHistory] = useState<DailyUsageRecord[]>([]);
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await usageTrackingService.getAppById(id);
    setApp(result.app ?? null);
    setSnapshot(result.snapshot);
    if (result.app) setHistory(await usageTrackingService.getHistoricalUsage(result.app.packageName));
    setLoading(false);
  }, [id]);

  useEffect(() => { refresh(); return usageTrackingService.subscribeToForeground(refresh); }, [refresh]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Application information is unavailable.</Text>
      </SafeAreaView>
    );
  }

  const latest = app.lastOpened;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.navBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.accent} />
          </Pressable>
          <Text style={styles.navTitle} numberOfLines={1}>{app.name}</Text>
          <View style={styles.navSpacer} />
        </View>

        <View style={styles.appHeader}>
          <AppIcon uri={app.icon} size={72} />
          <Text style={styles.appName} numberOfLines={2}>{app.name}</Text>
          <Text style={styles.packageName} numberOfLines={1}>{app.packageName}</Text>
        </View>

        <GroupedSection header="Last Opened">
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {latest ? latest.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : 'No usage reported'}
            </Text>
            {latest && <Text style={styles.infoValue}>{formatTime(latest)}</Text>}
          </View>
        </GroupedSection>

        <GroupedSection header="Today's Usage">
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>Foreground time</Text>
            <Text style={styles.infoValue}>{app.todayUsageMinutes} min</Text>
          </View>
        </GroupedSection>

        <GroupedSection header="Usage History">
          {snapshot?.capability === 'expo-go' || snapshot?.capability === 'native-module-unavailable' ? (
            <Text style={styles.explanation}>Install the Orbit app to see detailed usage history.</Text>
          ) : history.length ? (
            history.map(day => (
              <View key={day.date} style={styles.infoRow}>
                <Text style={styles.infoText}>{formatDate(day.date)}</Text>
                <Text style={styles.infoValue}>{Math.round(day.totalTimeInForeground / 60000)} min</Text>
              </View>
            ))
          ) : (
            <Text style={styles.explanation}>No usage data available for this period.</Text>
          )}
        </GroupedSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxl },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', margin: spacing.xxl },
  scrollContent: { paddingBottom: spacing.section + 100 },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  navTitle: { ...typography.headline, color: colors.textPrimary, flex: 1, minWidth: 0, textAlign: 'center', marginHorizontal: spacing.sm },
  navSpacer: { width: 24 },
  appHeader: { alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.xl },
  appName: { ...typography.title2, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md },
  packageName: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, minWidth: 0 },
  infoText: { ...typography.bodySmall, color: colors.textPrimary, flex: 1, minWidth: 0 },
  infoValue: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: spacing.sm },
  explanation: { ...typography.bodySmall, color: colors.textSecondary, padding: spacing.base, lineHeight: 22 },
});
