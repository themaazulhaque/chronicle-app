import { Platform } from 'react-native';
import * as Application from 'expo-application';

const CONFIG_URL = 'https://raw.githubusercontent.com/themaazulhaque/chronicle-app/master/update-config.json';
const RELEASES_URL = 'https://github.com/themaazulhaque/chronicle-app/releases';

export interface UpdateInfo {
  latestVersionCode: number;
  latestVersionName: string;
  updateRequired: boolean;
  downloadUrl: string;
  releaseNotes: string[];
}

let cachedUpdate: UpdateInfo | null = null;

async function fetchUpdateConfig(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function getInstalledVersionCode(): number {
  try {
    const nativeVersion = Application.nativeApplicationVersion;
    const nativeBuildVersion = Application.nativeBuildVersion;
    if (nativeBuildVersion && !isNaN(Number(nativeBuildVersion))) {
      return Number(nativeBuildVersion);
    }
    return 1;
  } catch {
    return 1;
  }
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (Platform.OS !== 'android') return null;

  const config = await fetchUpdateConfig();
  if (!config) return null;

  const installedCode = getInstalledVersionCode();

  if (installedCode < config.latestVersionCode) {
    cachedUpdate = config;
    return config;
  }

  return null;
}

export function getCachedUpdate(): UpdateInfo | null {
  return cachedUpdate;
}

export function dismissUpdate(): void {
  cachedUpdate = null;
}

export function getDownloadUrl(): string {
  return cachedUpdate?.downloadUrl || RELEASES_URL;
}

export function getReleasesUrl(): string {
  return RELEASES_URL;
}

export function getInstalledVersionName(): string {
  try {
    return Application.nativeApplicationVersion || '1.0.0';
  } catch {
    return '1.0.0';
  }
}
