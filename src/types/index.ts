export type AppCategory = 'social' | 'entertainment' | 'productivity' | 'communication' | 'system' | 'utilities' | 'unknown';

export type TrackingCapability =
  | 'expo-go'
  | 'native-module-unavailable'
  | 'permission-required'
  | 'available'
  | 'no-data';

export interface AppUsageRecord {
  packageName: string;
  lastTimeUsed: number;
  totalTimeInForeground: number;
}

export interface InstalledApp {
  packageName: string;
  appName: string;
  icon?: string;
  isSystemApp: boolean;
}

export interface DailyUsageRecord {
  date: string;
  totalTimeInForeground: number;
  lastTimeUsed: number;
}

export interface AppInfo {
  id: string;
  name: string;
  packageName: string;
  category: AppCategory;
  icon?: string;
  todayUsageMinutes: number;
  weeklyUsageMinutes: number;
  lastOpened?: Date;
  dailyUsage: DailyUsageRecord[];
}

export interface DailyUsage {
  date: string;
  totalMinutes: number;
  screenOnMinutes: number;
  appSessions: number;
}

export interface UsageSnapshot {
  capability: TrackingCapability;
  canReadUsage: boolean;
  usageRecords: AppUsageRecord[];
  installedApps: InstalledApp[];
  queriedAt: number;
  startTime: number;
  endTime: number;
  error?: string;
}

export interface TrackingStatus {
  usageAccessGranted: boolean;
  collectionScheduled: boolean;
  syncScheduled: boolean;
  trackingActive: boolean;
  networkAvailable: boolean;
  authenticated: boolean;
  deviceId: string | null;
  lastCollectionAt: number | null;
  lastSyncAt: number | null;
  pendingSyncCount: number;
}

export interface TrackingOperationResult {
  ok: boolean;
  message: string;
  collected?: number;
  inserted?: number;
  updated?: number;
  synced?: number;
  duplicates?: number;
  invalid?: number;
}

export interface WeeklyUsage {
  days: DailyUsage[];
  totalMinutes: number;
  averageMinutes: number;
  comparisonPercent: number;
}

export interface CategoryBreakdown {
  category: AppCategory;
  minutes: number;
  percentage: number;
}

export interface BehaviorInsight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'trend' | 'comparison' | 'highlight';
}

export interface UserProfile {
  name: string;
  dailyGoalMinutes: number;
  theme: 'dark' | 'light';
  notificationsEnabled: boolean;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export type RunningAppStatus = 'foreground' | 'recent' | 'active' | 'background';

export type RunningAppProcessState = 'foreground' | 'background' | 'foreground-service' | 'unknown';

export interface RunningApp {
  packageName: string;
  appName: string;
  icon?: string;
  status: RunningAppStatus;
  lastTimeUsed: number;
  standbyBucket: number;
  standbyBucketLabel: string;
  processImportance: number;
  processState: RunningAppProcessState;
}

export interface CurrentForegroundApp {
  packageName: string;
  appName: string;
  icon?: string;
  lastTimeUsed: number;
}

export interface SystemMemoryInfo {
  totalMem: number;
  availMem: number;
  threshold: number;
  lowMemory: boolean;
}

export interface OrbitProcessInfo {
  totalPss: number;
  dalvikPss: number;
  nativePss: number;
  otherPss: number;
  dalvikPrivateDirty: number;
  nativePrivateDirty: number;
  otherPrivateDirty: number;
  summary: {
    javaHeap: string;
    nativeHeap: string;
    code: string;
    stack: string;
    graphics: string;
    privateOther: string;
    system: string;
    totalPss: string;
    totalSwap: string;
    totalSwapPss: string;
  };
}

export interface RunningAppsSnapshot {
  runningApps: RunningApp[];
  foregroundApp: CurrentForegroundApp | null;
  systemMemory: SystemMemoryInfo | null;
  orbitProcess: OrbitProcessInfo | null;
  queriedAt: number;
  usageAccessGranted: boolean;
  error?: string;
}
