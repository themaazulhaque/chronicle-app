package com.chronicle.app

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class UsageSyncWorker(
  context: Context,
  params: WorkerParameters
) : Worker(context, params) {
  override fun doWork(): Result {
    return try {
      val result = TrackingStore.syncPendingUsage(applicationContext)
      if (result.ok) {
        Log.d("[Orbit Sync]", "Periodic sync complete: ${result.synced}")
        Result.success()
      } else if (result.message.contains("Network is unavailable", ignoreCase = true)) {
        Result.success()
      } else if (result.message.contains("Sign in", ignoreCase = true) ||
        result.message.contains("Device is not registered", ignoreCase = true)
      ) {
        Log.d("[Orbit Sync]", "Sync paused: ${result.message}")
        Result.success()
      } else {
        Log.e("[Orbit Sync]", "Sync failed: ${result.message}")
        Result.retry()
      }
    } catch (error: Exception) {
      Log.e("[Orbit Sync]", "Periodic sync failed", error)
      Result.retry()
    }
  }
}
