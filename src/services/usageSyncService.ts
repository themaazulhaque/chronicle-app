import { usageTrackingService } from './usageTrackingService';
import { TrackingOperationResult } from '../types';

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

function toMessage(result: TrackingOperationResult, fallback: string): string {
  return result.message || fallback;
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
    if (usageTrackingService.isExpoGo()) {
      return { ok: false, message: 'Sync requires a development build.' };
    }

    if (!usageTrackingService.hasNativeModule()) {
      return { ok: false, message: 'Native tracking module unavailable.' };
    }

    const hasPermission = await usageTrackingService.isUsageAccessGranted();
    if (!hasPermission) {
      return { ok: false, message: 'Usage access permission is not granted.' };
    }

    currentStatus = { ...currentStatus, isSyncing: true, lastSyncResult: null };
    notifyListeners();

    try {
      const collectResult = await usageTrackingService.forceCollectUsage();
      if (!collectResult.ok) {
        currentStatus = { ...currentStatus, isSyncing: false, lastSyncResult: collectResult.message };
        notifyListeners();
        return { ok: false, message: collectResult.message };
      }

      const syncResult = await usageTrackingService.forceSyncUsage();
      if (syncResult.ok) {
        const now = new Date().toISOString();
        currentStatus = {
          lastSyncAt: now,
          isSyncing: false,
          lastSyncResult: toMessage(syncResult, `Synced ${syncResult.synced || 0} records`),
        };
        notifyListeners();
        return { ok: true, message: syncResult.message || `Synced ${syncResult.synced || 0} records` };
      }

      currentStatus = { ...currentStatus, isSyncing: false, lastSyncResult: syncResult.message };
      notifyListeners();
      return { ok: false, message: syncResult.message };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sync error';
      currentStatus = { ...currentStatus, isSyncing: false, lastSyncResult: msg };
      notifyListeners();
      return { ok: false, message: msg };
    }
  },
};
