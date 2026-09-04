import Constants from 'expo-constants';
import { AppState, NativeModules, Platform } from 'react-native';
import { AppInfo, AppUsageRecord, DailyUsageRecord, InstalledApp, UsageSnapshot } from '../types';
import { getDateKey } from '../utils/formatting';
import type { ChronicleUsageNativeModule } from './usageTracking.types';

const nativeModule = NativeModules.ChronicleUsageModule as ChronicleUsageNativeModule | undefined;

export const usageTrackingService = {
  isExpoGo(): boolean {
    return Constants.executionEnvironment === 'storeClient';
  },

  getRuntimeMode(): 'Expo Go' | 'Development Build' | 'Standalone APK' | 'Unsupported' {
    if (this.isExpoGo()) return 'Expo Go';
    if (Platform.OS !== 'android') return 'Unsupported';
    return Constants.executionEnvironment === 'standalone' ? 'Standalone APK' : 'Development Build';
  },

  hasNativeModule(): boolean {
    return Platform.OS === 'android' && !!nativeModule;
  },

  async isUsageAccessGranted(): Promise<boolean> {
    if (!this.hasNativeModule()) return false;
    return nativeModule!.isUsageAccessGranted();
  },

  async openUsageAccessSettings(): Promise<void> {
    if (this.hasNativeModule()) await nativeModule!.openUsageAccessSettings();
  },

  async getSnapshot(date = new Date()): Promise<UsageSnapshot> {
    const now = Date.now();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = date > new Date() ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime() : now;

    if (this.isExpoGo()) {
      return { capability: 'expo-go', canReadUsage: false, usageRecords: [], installedApps: [], queriedAt: now, startTime: start, endTime: end, error: 'Real Android usage tracking requires the Chronicle development build.' };
    }
    if (!this.hasNativeModule()) {
      return { capability: 'native-module-unavailable', canReadUsage: false, usageRecords: [], installedApps: [], queriedAt: now, startTime: start, endTime: end, error: 'Usage tracking module is unavailable in this build.' };
    }

    try {
      const granted = await this.isUsageAccessGranted();
      if (!granted) {
        return { capability: 'permission-required', canReadUsage: false, usageRecords: [], installedApps: [], queriedAt: now, startTime: start, endTime: end };
      }
      const [usageRecords, installedApps] = await Promise.all([
        nativeModule!.getUsageStats(start, end),
        nativeModule!.getInstalledApps(),
      ]);
      console.log('[Chronicle] CURRENT_TIME', now, 'START_OF_TODAY', start, 'END_TIME', end);
      console.log('[Chronicle] NUMBER_OF_USAGE_STATS_RETURNED', usageRecords.length);
      console.log('[Chronicle] NUMBER_OF_INSTALLED_APPS_RETURNED', installedApps.length);
      if (usageRecords[0]) {
        console.log('[Chronicle] PACKAGE_NAME', usageRecords[0].packageName, 'LAST_TIME_USED', usageRecords[0].lastTimeUsed, 'TOTAL_FOREGROUND_TIME', usageRecords[0].totalTimeInForeground);
      }
      return { capability: usageRecords.length ? 'available' : 'no-data', canReadUsage: true, usageRecords, installedApps, queriedAt: now, startTime: start, endTime: end };
    } catch (error) {
      return { capability: 'native-module-unavailable', canReadUsage: false, usageRecords: [], installedApps: [], queriedAt: now, startTime: start, endTime: end, error: error instanceof Error ? error.message : 'Unable to read Android usage data.' };
    }
  },

  async getApps(): Promise<{ apps: AppInfo[]; snapshot: UsageSnapshot }> {
    const snapshot = await this.getSnapshot();
    const usageByPackage = new Map(snapshot.usageRecords.map(record => [record.packageName, record]));
    const apps = snapshot.installedApps.map(app => {
      const record = usageByPackage.get(app.packageName);
      const dailyUsage: DailyUsageRecord[] = record ? [{ date: getDateKey(new Date()), totalTimeInForeground: record.totalTimeInForeground, lastTimeUsed: record.lastTimeUsed }] : [];
      return toAppInfo(app, dailyUsage);
    }).sort((a, b) => a.name.localeCompare(b.name));
    return { apps, snapshot };
  },

  async getAppById(id: string): Promise<{ app?: AppInfo; snapshot: UsageSnapshot }> {
    const result = await this.getApps();
    return { app: result.apps.find(app => app.id === id || app.packageName === id), snapshot: result.snapshot };
  },

  async getHistoricalUsage(packageName: string, days = 7): Promise<DailyUsageRecord[]> {
    if (!this.hasNativeModule() || this.isExpoGo() || !(await this.isUsageAccessGranted())) return [];
    const records: DailyUsageRecord[] = [];
    const now = new Date();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const start = day.getTime();
      const end = offset === 0 ? Date.now() : new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
      const usage = await nativeModule!.getUsageStats(start, end);
      const record = usage.find(item => item.packageName === packageName);
      if (record && record.totalTimeInForeground > 0) records.push({ date: getDateKey(day), totalTimeInForeground: record.totalTimeInForeground, lastTimeUsed: record.lastTimeUsed });
    }
    return records;
  },

  subscribeToForeground(callback: () => void): () => void {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') callback(); });
    return () => subscription.remove();
  },
};

function toAppInfo(app: InstalledApp, dailyUsage: DailyUsageRecord[]): AppInfo {
  const today = dailyUsage[0];
  return { id: app.packageName, name: app.appName, packageName: app.packageName, category: 'unknown', icon: app.icon, todayUsageMinutes: today ? Math.round(today.totalTimeInForeground / 60000) : 0, weeklyUsageMinutes: today ? Math.round(today.totalTimeInForeground / 60000) : 0, lastOpened: today?.lastTimeUsed ? new Date(today.lastTimeUsed) : undefined, dailyUsage };
}
