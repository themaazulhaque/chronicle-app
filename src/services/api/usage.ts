import { apiRequest, getStoredDeviceId } from './client';

export interface SyncSession {
  package_name: string;
  app_name: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
}

export interface SyncResult {
  created: number;
  duplicates: number;
  invalid: number;
}

export interface ActivitySession {
  id: string;
  app_name: string;
  package_name: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
}

export interface ActivityResponse {
  date: string;
  sessions: ActivitySession[];
}

export async function syncUsage(sessions: SyncSession[]): Promise<{ ok: boolean; result?: SyncResult; error?: string }> {
  const deviceId = await getStoredDeviceId();
  if (!deviceId) return { ok: false, error: 'Device not registered' };
  if (sessions.length === 0) return { ok: true, result: { created: 0, duplicates: 0, invalid: 0 } };

  console.log(`[Sync] Starting sync: ${sessions.length} sessions for device ${deviceId}`);

  const result = await apiRequest<SyncResult>('/usage/sync/', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, sessions }),
  });

  if (!result.ok) {
    console.log(`[Sync] Failed: ${result.error}`);
    return { ok: false, error: result.error || 'Sync failed' };
  }

  console.log(`[Sync] Success: created=${result.data?.created}, duplicates=${result.data?.duplicates}`);
  return { ok: true, result: result.data || undefined };
}

export async function getActivity(date: string): Promise<{ ok: boolean; sessions?: ActivitySession[]; error?: string }> {
  const result = await apiRequest<ActivityResponse>(`/usage/activity/?date=${date}`);
  if (!result.ok) return { ok: false, error: result.error || 'Failed to fetch activity' };
  return { ok: true, sessions: result.data?.sessions || [] };
}
