import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { GroupedSection } from '../../src/components/GroupedSection';
import { SettingsRow } from '../../src/components/SettingsRow';
import { UsageSnapshot } from '../../src/types';
import { usageTrackingService } from '../../src/services/usageTrackingService';
import { usageSyncService, SyncStatus } from '../../src/services/usageSyncService';
import { apiRequest, getStoredDeviceId, logout } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://chronicle-backend-gvy4.onrender.com/api/v1';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [snapshot, setSnapshot] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(usageSyncService.getStatus());
  const [backendStatus, setBackendStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setSnapshot(await usageTrackingService.getSnapshot());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    getStoredDeviceId().then(setDeviceId);
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    return usageSyncService.onStatusChange(setSyncStatus);
  }, []);

  const handleSync = async () => {
    const result = await usageSyncService.syncNow();
    Alert.alert(result.ok ? 'Sync Complete' : 'Sync Failed', result.message);
  };

  const handleTestBackend = async () => {
    setBackendStatus('testing');
    const result = await apiRequest('/schema/');
    setBackendStatus(result.ok ? 'connected' : 'failed');
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); auth.refreshAuth(); router.replace('/(auth)/login'); } },
    ]);
  };

  const permission = snapshot?.capability === 'permission-required' ? 'Not Granted' : snapshot?.canReadUsage ? 'Granted' : 'Unavailable';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.largeTitle}>Settings</Text></View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GroupedSection header="Sync">
          <SettingsRow label="Sync Now" icon="cloud-upload" iconColor={colors.accent} onPress={handleSync} value={syncStatus.isSyncing ? 'Syncing...' : undefined} />
          <View style={styles.separator} />
          <SettingsRow label="Last Sync" value={syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Never'} icon="time" iconColor={colors.textSecondary} />
          {syncStatus.lastSyncResult && <><View style={styles.separator} /><Text style={styles.syncResult}>{syncStatus.lastSyncResult}</Text></>}
        </GroupedSection>
        <GroupedSection header="Data">
          <SettingsRow label="Usage Access" value={permission} icon="lock-closed" iconColor={permission === 'Granted' ? colors.success : colors.warning} onPress={permission === 'Not Granted' ? usageTrackingService.openUsageAccessSettings : undefined} />
          <View style={styles.separator} />
          <SettingsRow label="Refresh Activity Data" icon="refresh" iconColor={colors.accent} onPress={refresh} />
        </GroupedSection>
        <GroupedSection header="Backend">
          <SettingsRow label="Test Connection" icon="globe" iconColor={colors.accent} onPress={handleTestBackend} value={backendStatus === 'testing' ? 'Testing...' : backendStatus === 'connected' ? 'Connected' : backendStatus === 'failed' ? 'Failed' : undefined} />
          <View style={styles.separator} />
          <SettingsRow label="API URL" value={API_URL.replace('http://', '').replace('/api/v1', '')} icon="link" iconColor={colors.textSecondary} />
          <View style={styles.separator} />
          <SettingsRow label="Device ID" value={deviceId ? deviceId.substring(0, 8) + '...' : 'Not registered'} icon="phone-portrait" iconColor={colors.textSecondary} />
        </GroupedSection>
        <GroupedSection header="Debug">
          {loading ? <ActivityIndicator color={colors.accent} style={styles.debugLoader} /> : <>
            <SettingsRow label="Runtime Mode" value={usageTrackingService.getRuntimeMode()} icon="phone-portrait" iconColor={colors.accent} />
            <View style={styles.separator} />
            <SettingsRow label="Native Module" value={usageTrackingService.hasNativeModule() ? 'Available' : 'Unavailable'} icon="hardware-chip" iconColor={usageTrackingService.hasNativeModule() ? colors.success : colors.warning} />
            <View style={styles.separator} />
            <SettingsRow label="Usage Records Today" value={String(snapshot?.usageRecords.length ?? 0)} icon="analytics" iconColor={colors.accent} />
            <View style={styles.separator} />
            <SettingsRow label="Installed Apps Retrieved" value={String(snapshot?.installedApps.length ?? 0)} icon="grid" iconColor={colors.accent} />
            <View style={styles.separator} />
            <SettingsRow label="Last Query" value={snapshot ? new Date(snapshot.queriedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'None'} icon="time" iconColor={colors.textSecondary} />
            {snapshot?.error && <><View style={styles.separator} /><Text style={styles.errorText}>{snapshot.error}</Text></>}
          </>}
        </GroupedSection>
        <GroupedSection header="Account">
          <SettingsRow label="Sign Out" icon="log-out" iconColor={colors.danger} onPress={handleLogout} />
        </GroupedSection>
        <GroupedSection header="About">
          <SettingsRow label="Chronicle" value="Version 1.0.0" icon="information-circle" iconColor={colors.accent} />
        </GroupedSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.base, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  largeTitle: { ...typography.largeTitle, color: colors.textPrimary },
  scrollContent: { paddingBottom: spacing.section + 100 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderSubtle, marginLeft: 46 },
  debugLoader: { padding: spacing.base },
  errorText: { ...typography.caption, color: colors.danger, padding: spacing.base, lineHeight: 18 },
  syncResult: { ...typography.caption, color: colors.textSecondary, padding: spacing.base, lineHeight: 18 },
});
