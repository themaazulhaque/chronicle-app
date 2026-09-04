import { apiRequest, getStoredDeviceId, storeDeviceId } from './client';
import * as Device from 'expo-device';

export interface BackendDevice {
  id: string;
  device_name: string;
  device_identifier: string;
  android_version: string;
  app_version: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function registerDevice(): Promise<{ ok: boolean; deviceId?: string; error?: string }> {
  const existingDeviceId = await getStoredDeviceId();
  if (existingDeviceId) {
    console.log(`[Device] Already registered: ${existingDeviceId}`);
    return { ok: true, deviceId: existingDeviceId };
  }

  const brand = Device.brand || 'unknown';
  const model = Device.modelName || Device.modelId || 'android';
  const deviceIdentifier = `chronicle-${brand}-${model}-${Date.now()}`;

  const result = await apiRequest<BackendDevice>('/devices/', {
    method: 'POST',
    body: JSON.stringify({
      device_name: `${brand} ${model}`,
      device_identifier: deviceIdentifier,
      android_version: Device.osVersion || '',
      app_version: '1.0.0',
    }),
  });

  if (!result.ok) return { ok: false, error: result.error || 'Device registration failed' };
  if (result.data) {
    await storeDeviceId(result.data.id);
    console.log(`[Device] Registered: ${result.data.id}`);
    return { ok: true, deviceId: result.data.id };
  }
  return { ok: false, error: 'No data returned' };
}
