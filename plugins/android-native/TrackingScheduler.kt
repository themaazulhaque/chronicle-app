package com.chronicle.app

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

object TrackingScheduler {
  const val COLLECTION_WORK_NAME = "orbit_usage_collection"
  const val SYNC_WORK_NAME = "orbit_usage_sync"
  const val IMMEDIATE_COLLECTION_WORK_NAME = "orbit_usage_collection_now"
  const val IMMEDIATE_SYNC_WORK_NAME = "orbit_usage_sync_now"

  @JvmStatic fun scheduleCollection(context: Context): Boolean {
    if (!TrackingStore.isUsageAccessGranted(context)) {
      return false
    }

    val request = PeriodicWorkRequestBuilder<UsageCollectionWorker>(
      15,
      TimeUnit.MINUTES
    ).build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      COLLECTION_WORK_NAME,
      ExistingPeriodicWorkPolicy.KEEP,
      request
    )
    TrackingStore.markCollectionScheduled(context, true)
    return true
  }

  @JvmStatic fun scheduleSync(context: Context): Boolean {
    if (!TrackingStore.hasSyncCredentials(context)) {
      return false
    }

    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()

    val request = PeriodicWorkRequestBuilder<UsageSyncWorker>(
      15,
      TimeUnit.MINUTES
    )
      .setConstraints(constraints)
      .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      SYNC_WORK_NAME,
      ExistingPeriodicWorkPolicy.KEEP,
      request
    )
    TrackingStore.markSyncScheduled(context, true)
    return true
  }

  @JvmStatic fun cancelSync(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork(SYNC_WORK_NAME)
    WorkManager.getInstance(context).cancelUniqueWork(IMMEDIATE_SYNC_WORK_NAME)
    TrackingStore.markSyncScheduled(context, false)
  }

  fun scheduleImmediateCollection(context: Context) {
    val request = OneTimeWorkRequestBuilder<UsageCollectionWorker>().build()
    WorkManager.getInstance(context).enqueueUniqueWork(
      IMMEDIATE_COLLECTION_WORK_NAME,
      ExistingWorkPolicy.REPLACE,
      request
    )
  }

  fun scheduleImmediateSync(context: Context) {
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()
    val request = OneTimeWorkRequestBuilder<UsageSyncWorker>()
      .setConstraints(constraints)
      .build()
    WorkManager.getInstance(context).enqueueUniqueWork(
      IMMEDIATE_SYNC_WORK_NAME,
      ExistingWorkPolicy.REPLACE,
      request
    )
  }
}

private fun TrackingStore.hasSyncCredentials(context: Context): Boolean {
  return !TrackingStore.getDeviceId(context).isNullOrBlank() &&
    !TrackingStore.getAccessToken(context).isNullOrBlank() &&
    !TrackingStore.getRefreshToken(context).isNullOrBlank()
}
