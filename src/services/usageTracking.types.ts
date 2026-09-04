export type { AppUsageRecord, DailyUsageRecord, InstalledApp, UsageSnapshot, TrackingCapability } from '../types';

export interface ChronicleUsageNativeModule {
  isUsageAccessGranted(): Promise<boolean>;
  openUsageAccessSettings(): Promise<void>;
  getInstalledApps(): Promise<import('../types').InstalledApp[]>;
  getUsageStats(startTime: number, endTime: number): Promise<import('../types').AppUsageRecord[]>;
}
