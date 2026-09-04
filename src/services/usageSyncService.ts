import { usageTrackingService } from './usageTrackingService';
import { syncUsage, SyncSession } from './api/usage';
import { getStoredDeviceId } from './api/client';
import { AppUsageRecord, InstalledApp } from '../types';

export interface SyncStatus {
  lastSyncAt: string | null;
  isSyncing: boolean;
  lastSyncResult: string | null;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentStatus: SyncStatus = { lastSyncAt: null, isSyncing: false, lastSyncResult: null };

function notifyListeners() {
  syncStatusListeners.forEach(cb => cb({ ...currentStatus }));
}

export const usageSyncService = {
  getStatus(): SyncStatus {
    return { ...currentStatus };
  },

  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    syncStatusListeners.push(callback);
    return () => {
      syncStatusListeners = syncStatusListeners.filter(cb => cb !== callback);
    };
  },

  async syncNow(): Promise<{ ok: boolean; message: string }> {
    const deviceId = await getStoredDeviceId();
    if (!deviceId) return { ok: false, message: 'Device not registered' };

    if (usageTrackingService.isExpoGo()) {
      return { ok: false, message: 'Sync requires development build' };
    }

    if (!usageTrackingService.hasNativeModule()) {
      return { ok: false, message: 'Native module unavailable' };
    }

    const hasPermission = await usageTrackingService.isUsageAccessGranted();
    if (!hasPermission) {
      return { ok: false, message: 'Usage Access permission not granted' };
    }

    currentStatus = { ...currentStatus, isSyncing: true, lastSyncResult: null };
    notifyListeners();

    try {
      const snapshot = await usageTrackingService.getSnapshot();
      const sessions = this.convertToSyncSessions(snapshot.usageRecords, snapshot.installedApps, snapshot.startTime, snapshot.endTime);

      console.log(`[SyncService] Converting ${snapshot.usageRecords.length} records to ${sessions.length} sessions`);

      const result = await syncUsage(sessions);

      if (result.ok) {
        const now = new Date().toISOString();
        currentStatus = { lastSyncAt: now, isSyncing: false, lastSyncResult: `Synced ${result.result?.created || 0} sessions` };
        notifyListeners();
        console.log(`[SyncService] Success: ${result.result?.created} created, ${result.result?.duplicates} duplicates`);
        return { ok: true, message: `Synced ${result.result?.created || 0} sessions` };
      } else {
        currentStatus = { ...currentStatus, isSyncing: false, lastSyncResult: `Failed: ${result.error}` };
        notifyListeners();
        return { ok: false, message: result.error || 'Sync failed' };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sync error';
      currentStatus = { ...currentStatus, isSyncing: false, lastSyncResult: `Error: ${msg}` };
      notifyListeners();
      return { ok: false, message: msg };
    }
  },

  convertToSyncSessions(
    usageRecords: AppUsageRecord[],
    installedApps: InstalledApp[],
    startTime: number,
    endTime: number
  ): SyncSession[] {
    const appMap = new Map(installedApps.map(app => [app.packageName, app]));
    const sessions: SyncSession[] = [];

    for (const record of usageRecords) {
      if (record.totalTimeInForeground <= 0) continue;

      const app = appMap.get(record.packageName);
      const lastUsed = record.lastTimeUsed;
      const durationMs = record.totalTimeInForeground;
      const sessionStart = new Date(Math.max(lastUsed - durationMs, startTime));
      const sessionEnd = new Date(lastUsed);

      sessions.push({
        package_name: record.packageName,
        app_name: app?.appName || record.packageName,
        start_time: sessionStart.toISOString(),
        end_time: sessionEnd.toISOString(),
        duration_seconds: Math.round(durationMs / 1000),
      });
    }

    return sessions;
  },
};
