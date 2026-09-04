import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { ActivityRow } from '../../src/components/ActivityRow';
import { DateNavigator } from '../../src/components/DateNavigator';
import { EmptyState } from '../../src/components/EmptyState';
import { AppUsageRecord, InstalledApp, UsageSnapshot } from '../../src/types';
import { formatDateGroupHeader, getDateKey } from '../../src/utils/formatting';
import { usageTrackingService } from '../../src/services/usageTrackingService';
import { usageSyncService } from '../../src/services/usageSyncService';
import { getActivity, ActivitySession } from '../../src/services/api/usage';

export default function ActivityScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [backendSessions, setBackendSessions] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const isToday = getDateKey(selectedDate) === getDateKey(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    const snap = await usageTrackingService.getSnapshot(selectedDate);
    setSnapshot(snap);

    if (isToday && snap.canReadUsage && snap.usageRecords.length > 0 && !syncing) {
      setSyncing(true);
      usageSyncService.syncNow().finally(() => setSyncing(false));
    }

    if (!isToday) {
      const dateStr = getDateKey(selectedDate);
      const result = await getActivity(dateStr);
      if (result.ok) setBackendSessions(result.sessions || []);
    } else {
      setBackendSessions([]);
    }

    setLoading(false);
  }, [selectedDate, isToday]);

  useEffect(() => { refresh(); return usageTrackingService.subscribeToForeground(refresh); }, [refresh]);

  const appByPackage = useMemo(() => new Map((snapshot?.installedApps ?? []).map(app => [app.packageName, app])), [snapshot]);
  const records = useMemo(() => (snapshot?.usageRecords ?? []).filter(record => record.totalTimeInForeground > 0).sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground), [snapshot]);
  const totalMinutes = Math.round(records.reduce((total, record) => total + record.totalTimeInForeground, 0) / 60000);
  const dayHeader = formatDateGroupHeader(selectedDate);

  const capabilityMessage = snapshot?.capability === 'expo-go'
    ? { title: 'Real usage tracking unavailable', message: 'Real app usage tracking requires the Chronicle Android build. Expo Go is running the app interface, but Android usage access requires the native Chronicle module.' }
    : snapshot?.capability === 'native-module-unavailable' ? { title: 'Usage tracking unavailable', message: 'Usage tracking module is unavailable in this build.' }
      : snapshot?.capability === 'permission-required' ? { title: 'Usage Access required', message: 'Chronicle needs Usage Access to show your app activity.' } : null;

  const handleDateChange = (change: number) => setSelectedDate(current => { const next = new Date(current); next.setDate(next.getDate() + change); return next; });

  const displayRecords = isToday ? records : [];
  const displayBackendSessions = !isToday ? backendSessions : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.largeTitle}>Activity</Text></View>
      <DateNavigator currentDate={selectedDate} onPrevious={() => handleDateChange(-1)} onNext={() => handleDateChange(1)} onToday={() => setSelectedDate(new Date())} />
      {loading && <ActivityIndicator color={colors.accent} style={styles.loader} />}
      {!loading && capabilityMessage && isToday ? <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>{capabilityMessage.title}</Text><Text style={styles.messageText}>{capabilityMessage.message}</Text>
        {snapshot?.capability === 'permission-required' && <Pressable accessibilityRole="button" style={styles.actionButton} onPress={() => usageTrackingService.openUsageAccessSettings()}><Text style={styles.actionText}>Allow Usage Access</Text></Pressable>}
      </View> : !loading && <>
        {displayRecords.length > 0 && <View style={styles.summaryBar}><Text style={styles.summaryText}>{displayRecords.length} {displayRecords.length === 1 ? 'app' : 'apps'} · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</Text></View>}
        {syncing && <View style={styles.syncBar}><ActivityIndicator size="small" color={colors.accent} /><Text style={styles.syncText}>Syncing with backend...</Text></View>}
        <FlatList
          data={isToday ? displayRecords : []}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={displayRecords.length > 0 ? <Text style={styles.dayHeader}>{isToday ? 'TODAY' : dayHeader}</Text> : null}
          ListEmptyComponent={isToday ? (
            <EmptyState icon="time-outline" title="No activity" message="No usage data was returned by Android for this period." />
          ) : null}
          renderItem={({ item }) => <ActivityRecordRow record={item} app={appByPackage.get(item.packageName)} onPress={() => router.push(`/app/${item.packageName}`)} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        {!isToday && displayBackendSessions.length > 0 && (
          <FlatList
            data={displayBackendSessions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<Text style={styles.dayHeader}>{dayHeader}</Text>}
            renderItem={({ item }) => (
              <ActivityRow
                appName={item.app_name}
                lastTimeUsed={new Date(item.end_time).getTime()}
                totalTimeInForeground={item.duration_seconds * 1000}
                onPress={() => router.push(`/app/${item.package_name}`)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        {!isToday && displayBackendSessions.length === 0 && !loading && (
          <EmptyState icon="time-outline" title="No activity" message="No synced usage data available for this date." />
        )}
      </>}
    </SafeAreaView>
  );
}

function ActivityRecordRow({ record, app, onPress }: { record: AppUsageRecord; app?: InstalledApp; onPress: () => void }) {
  return <ActivityRow appName={app?.appName ?? record.packageName} appIcon={app?.icon} lastTimeUsed={record.lastTimeUsed} totalTimeInForeground={record.totalTimeInForeground} onPress={onPress} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  loader: { marginTop: spacing.xl },
  summaryBar: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  summaryText: { ...typography.subhead, color: colors.textSecondary },
  dayHeader: { ...typography.groupedHeader, color: colors.groupedHeader, letterSpacing: 0.5, paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  listContent: { paddingBottom: spacing.section + 100, flexGrow: 1 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: spacing.base + 56 },
  messageCard: { margin: spacing.base, padding: spacing.base, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle },
  messageTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  messageText: { ...typography.bodySmall, color: colors.textSecondary },
  actionButton: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', marginTop: spacing.md },
  actionText: { ...typography.body, color: colors.accent, fontWeight: '600' },
  syncBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  syncText: { ...typography.caption, color: colors.textSecondary },
});
