import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../src/theme';
import { AppIcon } from '../../src/components/AppIcon';
import { EmptyState } from '../../src/components/EmptyState';
import { RunningApp, RunningAppsSnapshot, SystemMemoryInfo } from '../../src/types';
import { runningAppsService } from '../../src/services/runningAppsService';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  foreground: { color: colors.success, label: 'Currently Active' },
  recent: { color: colors.warning, label: 'Recent' },
  active: { color: colors.accent, label: 'Active' },
  background: { color: colors.textMuted, label: 'Background' },
};

function formatMemory(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${Math.round(mb)} MB`;
}

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function MemoryBar({ systemMemory }: { systemMemory: SystemMemoryInfo }) {
  const usedMem = systemMemory.totalMem - systemMemory.availMem;
  const usagePercent = systemMemory.totalMem > 0 ? (usedMem / systemMemory.totalMem) * 100 : 0;

  return (
    <View style={styles.memoryCard}>
      <View style={styles.memoryHeader}>
        <Ionicons name="hardware-chip-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.memoryTitle}>System Memory</Text>
      </View>
      <View style={styles.memoryBarBackground}>
        <View style={[styles.memoryBarFill, { width: `${Math.min(usagePercent, 100)}%` }]} />
      </View>
      <View style={styles.memoryStats}>
        <Text style={styles.memoryStatText}>
          {formatMemory(usedMem)} used of {formatMemory(systemMemory.totalMem)}
        </Text>
        <Text style={styles.memoryStatText}>{usagePercent.toFixed(1)}%</Text>
      </View>
      {systemMemory.lowMemory && (
        <View style={styles.lowMemoryBadge}>
          <Ionicons name="warning" size={12} color={colors.warning} />
          <Text style={styles.lowMemoryText}>Low Memory</Text>
        </View>
      )}
    </View>
  );
}

function RunningAppRow({ app }: { app: RunningApp }) {
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.background;

  return (
    <View style={styles.appRow}>
      <AppIcon uri={app.icon} size={44} />
      <View style={styles.appContent}>
        <View style={styles.appNameRow}>
          <Text style={styles.appName} numberOfLines={1} ellipsizeMode="tail">
            {app.appName}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.packageName} numberOfLines={1} ellipsizeMode="tail">
          {app.packageName}
        </Text>
        <View style={styles.appMeta}>
          <Text style={styles.metaText}>{formatTimeAgo(app.lastTimeUsed)}</Text>
          {app.standbyBucketLabel !== 'Unknown' && (
            <>
              <Text style={styles.metaSeparator}>·</Text>
              <Text style={styles.metaText}>{app.standbyBucketLabel}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RunningAppsScreen() {
  const [snapshot, setSnapshot] = useState<RunningAppsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const result = await runningAppsService.getSnapshot();
    setSnapshot(result);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    return runningAppsService.subscribeToForeground(refresh);
  }, [refresh]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
  }, [refresh]);

  const foreground = useMemo(() => {
    if (!snapshot) return null;
    if (snapshot.foregroundApp) return snapshot.foregroundApp;
    const fg = snapshot.runningApps.find(a => a.status === 'foreground');
    if (fg) return { packageName: fg.packageName, appName: fg.appName, icon: fg.icon, lastTimeUsed: fg.lastTimeUsed };
    return null;
  }, [snapshot]);

  const sortedApps = useMemo(() => {
    if (!snapshot) return [];
    const statusOrder: Record<string, number> = { foreground: 0, recent: 1, active: 2, background: 3 };
    return [...snapshot.runningApps].sort((a, b) => {
      const sa = statusOrder[a.status] ?? 4;
      const sb = statusOrder[b.status] ?? 4;
      if (sa !== sb) return sa - sb;
      return b.lastTimeUsed - a.lastTimeUsed;
    });
  }, [snapshot]);

  const foregroundCount = useMemo(() => sortedApps.filter(a => a.status === 'foreground').length, [sortedApps]);
  const recentCount = useMemo(() => sortedApps.filter(a => a.status === 'recent' || a.status === 'active').length, [sortedApps]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Running Apps</Text>
        </View>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (snapshot?.error && !snapshot.usageAccessGranted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.largeTitle}>Running Apps</Text>
        </View>
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Permission needed</Text>
          <Text style={styles.messageText}>{snapshot.error}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.actionButton}
            onPress={() => {
              const mod = NativeModules.ChronicleUsageModule;
              if (mod?.openUsageAccessSettings) mod.openUsageAccessSettings();
            }}
          >
            <Text style={styles.actionText}>Allow Usage Access</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Running Apps</Text>
      </View>

      {snapshot?.systemMemory && <MemoryBar systemMemory={snapshot.systemMemory} />}

      {foreground && (
        <View style={styles.foregroundCard}>
          <View style={styles.foregroundHeader}>
            <Ionicons name="radio" size={14} color={colors.success} />
            <Text style={styles.foregroundLabel}>Currently Active</Text>
          </View>
          <View style={styles.foregroundContent}>
            <AppIcon uri={foreground.icon} size={36} />
            <View style={styles.foregroundAppInfo}>
              <Text style={styles.foregroundAppName}>{foreground.appName}</Text>
              <Text style={styles.foregroundPackage}>{foreground.packageName}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {sortedApps.length} {sortedApps.length === 1 ? 'app' : 'apps'} detected
          {foregroundCount > 0 ? ` · ${foregroundCount} foreground` : ''}
          {recentCount > 0 ? ` · ${recentCount} recent` : ''}
        </Text>
      </View>

      <FlatList
        data={sortedApps}
        keyExtractor={item => item.packageName}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="phone-portrait-outline"
            title="No running apps"
            message="No recently active applications detected. Open some apps and return here."
          />
        }
        renderItem={({ item }) => <RunningAppRow app={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  loader: { marginTop: spacing.xl },
  messageCard: { margin: spacing.base, padding: spacing.base, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle },
  messageTitle: { ...typography.headline, color: colors.textPrimary, marginBottom: spacing.sm },
  messageText: { ...typography.bodySmall, color: colors.textSecondary },
  actionButton: { alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', marginTop: spacing.md },
  actionText: { ...typography.body, color: colors.accent, fontWeight: '600' },
  memoryCard: { marginHorizontal: spacing.base, marginTop: spacing.sm, padding: spacing.base, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  memoryTitle: { ...typography.subhead, color: colors.textSecondary, marginLeft: spacing.xs },
  memoryBarBackground: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' },
  memoryBarFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  memoryStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  memoryStatText: { ...typography.caption, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  lowMemoryBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  lowMemoryText: { ...typography.caption, color: colors.warning },
  foregroundCard: { marginHorizontal: spacing.base, marginTop: spacing.sm, padding: spacing.base, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderSubtle },
  foregroundHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.xs },
  foregroundLabel: { ...typography.subhead, color: colors.success, fontWeight: '600' },
  foregroundContent: { flexDirection: 'row', alignItems: 'center' },
  foregroundAppInfo: { flex: 1, marginLeft: spacing.md },
  foregroundAppName: { ...typography.headline, color: colors.textPrimary },
  foregroundPackage: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  summaryBar: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.sm },
  summaryText: { ...typography.subhead, color: colors.textSecondary },
  listContent: { paddingBottom: spacing.section + 100, flexGrow: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.surface, minHeight: 68, minWidth: 0 },
  appContent: { flex: 1, minWidth: 0, marginHorizontal: spacing.md },
  appNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  appName: { ...typography.body, color: colors.textPrimary, fontWeight: '500', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, marginLeft: spacing.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: spacing.xxs },
  statusText: { ...typography.caption, fontWeight: '500' },
  packageName: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  appMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.xs },
  metaText: { ...typography.caption, color: colors.textMuted },
  metaSeparator: { ...typography.caption, color: colors.textMuted },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: spacing.base + 60 },
});
