package com.chronicle.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

    Log.d("[Orbit Tracking]", "Boot completed, rescheduling background tracking")

    try {
      if (TrackingStore.isUsageAccessGranted(context)) {
        TrackingScheduler.scheduleCollection(context)
        Log.d("[Orbit Tracking]", "Collection worker rescheduled after boot")
      }
    } catch (error: Exception) {
      Log.e("[Orbit Tracking]", "Failed to reschedule collection after boot", error)
    }

    try {
      if (!TrackingStore.getDeviceId(context).isNullOrBlank() &&
        !TrackingStore.getAccessToken(context).isNullOrBlank() &&
        !TrackingStore.getRefreshToken(context).isNullOrBlank()
      ) {
        TrackingScheduler.scheduleSync(context)
        Log.d("[Orbit Tracking]", "Sync worker rescheduled after boot")
      }
    } catch (error: Exception) {
      Log.e("[Orbit Tracking]", "Failed to reschedule sync after boot", error)
    }
  }
}
