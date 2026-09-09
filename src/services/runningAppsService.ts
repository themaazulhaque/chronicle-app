import Constants from 'expo-constants';
import { AppState, NativeModules, Platform } from 'react-native';
import {
  CurrentForegroundApp,
  OrbitProcessInfo,
  RunningApp,
  RunningAppsSnapshot,
  SystemMemoryInfo,
} from '../types';

const nativeModule = NativeModules.RunningAppsModule as {
  getRunningApps(): Promise<RunningApp[]>;
  getCurrentForegroundApp(): Promise<CurrentForegroundApp | null>;
  getSystemMemoryInfo(): Promise<SystemMemoryInfo>;
  getOrbitProcessInfo(): Promise<OrbitProcessInfo>;
  getInstalledAppsForRunning(): Promise<{ packageName: string; appName: string; icon?: string; isSystemApp: boolean }[]>;
} | undefined;

const chronicleModule = NativeModules.ChronicleUsageModule as {
  isUsageAccessGranted(): Promise<boolean>;
} | undefined;

function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

function hasNativeModule(): boolean {
  return Platform.OS === 'android' && !!nativeModule;
}

export const runningAppsService = {
  async getSnapshot(): Promise<RunningAppsSnapshot> {
    const now = Date.now();

    if (isExpoGo() || !hasNativeModule()) {
      return {
        runningApps: [],
        foregroundApp: null,
        systemMemory: null,
        orbitProcess: null,
        queriedAt: now,
        usageAccessGranted: false,
        error: 'Running apps detection requires the Orbit development build or standalone APK.',
      };
    }

    try {
      let usageAccessGranted = false;
      try {
        usageAccessGranted = await chronicleModule!.isUsageAccessGranted();
      } catch {
        // ignore
      }

      if (!usageAccessGranted) {
        return {
          runningApps: [],
          foregroundApp: null,
          systemMemory: null,
          orbitProcess: null,
          queriedAt: now,
          usageAccessGranted: false,
          error: 'Usage Access permission is required to detect running apps.',
        };
      }

      const [runningApps, foregroundApp, systemMemory, orbitProcess] = await Promise.all([
        nativeModule!.getRunningApps().catch(() => [] as RunningApp[]),
        nativeModule!.getCurrentForegroundApp().catch(() => null),
        nativeModule!.getSystemMemoryInfo().catch(() => null),
        nativeModule!.getOrbitProcessInfo().catch(() => null),
      ]);

      return {
        runningApps,
        foregroundApp,
        systemMemory,
        orbitProcess,
        queriedAt: now,
        usageAccessGranted: true,
      };
    } catch (error) {
      return {
        runningApps: [],
        foregroundApp: null,
        systemMemory: null,
        orbitProcess: null,
        queriedAt: now,
        usageAccessGranted: false,
        error: error instanceof Error ? error.message : 'Unable to detect running apps.',
      };
    }
  },

  subscribeToForeground(callback: () => void): () => void {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') callback();
    });
    return () => subscription.remove();
  },
};
