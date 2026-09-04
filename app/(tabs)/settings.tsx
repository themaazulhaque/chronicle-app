import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme';
import { GroupedSection } from '../../src/components/GroupedSection';
import { SettingsRow } from '../../src/components/SettingsRow';
import { usageTrackingService } from '../../src/services/usageTrackingService';
import { usageSyncService, SyncStatus } from '../../src/services/usageSyncService';
import { getStoredDeviceId, logout } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { TrackingStatus } from '../../src/types';

const HEALTH_URL = 'https://chronicle-backend-gvy4.onrender.com/health';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(usageSyncService.getStatus());
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    usageAccessGranted: false,
    collectionScheduled: false,
    syncScheduled: false,
    trackingActive: false,
    networkAvailable: false,
    authenticated: false,
    deviceId: null,
    lastCollectionAt: null,
    lastSyncAt: null,
    pendingSyncCount: 0,
  });
  const [backendStatus, setBackendStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const refreshTrackingStatus = useCallback(async () => {
    const status = await usageTrackingService.getTrackingStatus();
    setTrackingStatus(status);
  }, []);

  useEffect(() => {
    getStoredDeviceId().then(setDeviceId);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        usageTrackingService.ensureBackgroundTrackingScheduled();
        refreshTrackingStatus();
      }
    });
    refreshTrackingStatus();
    return () => sub.remove();
  }, [refreshTrackingStatus]);

  useEffect(() => {
    return usageSyncService.onStatusChange(setSyncStatus);
  }, []);

  const handleSync = async () => {
    setSyncLoading(true);
    const result = await usageSyncService.syncNow();
    setSyncLoading(false);
    await refreshTrackingStatus();
    Alert.alert(result.ok ? 'Sync Complete' : 'Sync Failed', result.message);
  };

  const handleRefreshData = async () => {
    setRefreshLoading(true);
    const result = await usageTrackingService.forceCollectUsage();
    setRefreshLoading(false);
    await refreshTrackingStatus();
    Alert.alert(result.ok ? 'Activity Updated' : 'Update Failed', result.message || 'Your activity data has been updated.');
  };

  const handleTestBackend = async () => {
    setBackendStatus('testing');
    try {
      const response = await fetch(HEALTH_URL);
      setBackendStatus(response.ok ? 'connected' : 'failed');
    } catch {
      setBackendStatus('failed');
    }
  };

  const handleUsageAccess = () => {
    usageTrackingService.openUsageAccessSettings();
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); auth.refreshAuth(); router.replace('/(auth)/login'); } },
    ]);
  };

  const permission = usageTrackingService.isExpoGo()
    ? 'Unavailable'
    : trackingStatus.usageAccessGranted
      ? 'Granted'
      : 'Needed';

  const trackingLabel = trackingStatus.trackingActive ? 'Active' : 'Paused';
  const pendingUploadsLabel = `${trackingStatus.pendingSyncCount} ${trackingStatus.pendingSyncCount === 1 ? 'record' : 'records'}`;
  const lastCollectionLabel = formatRelativeTimestamp(trackingStatus.lastCollectionAt);
  const lastSyncTimestamp = trackingStatus.lastSyncAt ?? (syncStatus.lastSyncAt ? Date.parse(syncStatus.lastSyncAt) : null);
  const lastSyncLabel = formatRelativeTimestamp(lastSyncTimestamp);
  const networkLabel = trackingStatus.networkAvailable ? 'Online' : 'Offline';

  const connectionLabel = backendStatus === 'testing'
    ? 'Checking...'
    : backendStatus === 'connected'
      ? 'Connected'
      : backendStatus === 'failed'
        ? 'Unable to connect'
        : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GroupedSection header="Activity Tracking">
          <SettingsRow
            label="Tracking"
            value={trackingLabel}
            description={trackingStatus.trackingActive ? 'Orbit is collecting app activity in the background.' : 'Turn on usage access to start tracking.'}
            icon="pulse"
            iconColor={trackingStatus.trackingActive ? colors.success : colors.warning}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Usage Access"
            description="Allows Orbit to read your app activity."
            value={permission}
            icon="lock-closed"
            iconColor={trackingStatus.usageAccessGranted ? colors.success : colors.warning}
            onPress={permission !== 'Granted' ? handleUsageAccess : undefined}
            showChevron={permission !== 'Granted'}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Background collection"
            value={trackingStatus.collectionScheduled ? 'Active' : 'Inactive'}
            description="Collects app activity every 15 minutes."
            icon="time"
            iconColor={trackingStatus.collectionScheduled ? colors.success : colors.textSecondary}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Background sync"
            value={trackingStatus.syncScheduled ? 'Active' : 'Inactive'}
            description="Uploads activity to the cloud when connected."
            icon="cloud"
            iconColor={trackingStatus.syncScheduled ? colors.success : colors.textSecondary}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Last activity collection"
            value={lastCollectionLabel}
            icon="calendar"
            iconColor={colors.textSecondary}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Last cloud sync"
            value={lastSyncLabel}
            icon="cloud-done"
            iconColor={colors.accent}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Pending uploads"
            value={pendingUploadsLabel}
            icon="cloud-upload"
            iconColor={trackingStatus.pendingSyncCount > 0 ? colors.warning : colors.success}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Network"
            value={networkLabel}
            icon="wifi"
            iconColor={trackingStatus.networkAvailable ? colors.success : colors.warning}
          />
        </GroupedSection>

        <GroupedSection header="Manual Actions">
          <SettingsRow
            label="Refresh Activity"
            description="Collect the latest activity from this device now."
            icon="refresh"
            iconColor={colors.accent}
            onPress={handleRefreshData}
            loading={refreshLoading}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Sync Now"
            description="Upload all pending activity to your account."
            icon="cloud-upload"
            iconColor={colors.accent}
            onPress={handleSync}
            loading={syncLoading}
          />
        </GroupedSection>

        <GroupedSection header="Cloud">
          <SettingsRow
            label="Server connection"
            description="Check if Orbit can reach the server."
            icon="globe"
            iconColor={colors.accent}
            onPress={handleTestBackend}
            value={connectionLabel}
            loading={backendStatus === 'testing'}
          />
          <SettingsRow
            label="Device"
            value={deviceId ? deviceId.substring(0, 8) + '...' : 'Not registered'}
            icon="phone-portrait"
            iconColor={colors.textSecondary}
          />
        </GroupedSection>

        <GroupedSection header="Account">
          <SettingsRow
            label="Sign Out"
            icon="log-out"
            iconColor={colors.danger}
            onPress={handleLogout}
            destructive
          />
        </GroupedSection>

        <GroupedSection header="About">
          <SettingsRow
            label="Orbit"
            value="Version 1.0.0"
            icon="information-circle"
            iconColor={colors.accent}
          />
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
});

function formatRelativeTimestamp(value: number | null): string {
  if (!value || Number.isNaN(value)) return 'Never';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - value) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
