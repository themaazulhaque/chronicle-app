package com.chronicle.app

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters

class UsageCollectionWorker(
  context: Context,
  params: WorkerParameters
) : Worker(context, params) {
  override fun doWork(): Result {
    return try {
      val result = TrackingStore.collectUsageSinceLastTimestamp(applicationContext)
      if (result.ok) {
        Log.d("[Orbit Tracking]", "Periodic collection complete: ${result.collected}")
        Result.success()
      } else {
        Log.d("[Orbit Tracking]", "Periodic collection skipped: ${result.message}")
        Result.success()
      }
    } catch (error: Exception) {
      Log.e("[Orbit Tracking]", "Periodic collection failed", error)
      Result.retry()
    }
  }
}
