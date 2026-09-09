package com.chronicle.app;

import android.app.ActivityManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Debug;
import android.util.Base64;
import android.util.Log;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Running Apps Module — detects active/running application information
 * using only legitimate Android APIs available to normal third-party apps.
 *
 * APIs used:
 * - UsageStatsManager.queryEvents() — foreground app detection
 * - UsageStatsManager.queryUsageStats() — app usage metadata
 * - ActivityManager.getMemoryInfo() — system-wide memory
 * - Debug.getMemoryInfo() — own process memory
 * - PackageManager — app metadata (name, icon)
 *
 * APIs NOT used (restricted on modern Android):
 * - ActivityManager.getRunningAppProcesses() — only returns own processes (API 22+)
 * - ActivityManager.getRunningServices() — deprecated (API 26+), own services only
 * - /proc/stat — blocked since Android 8.0
 * - /proc/[pid]/stat — blocked for other processes since Android 7.0
 * - ActivityManager.getProcessMemoryInfo() — restricted to own UID on Android 13+
 */
public class RunningAppsModule extends ReactContextBaseJavaModule {
  private static final String TAG = "[Orbit RunningApps]";
  private final ReactApplicationContext context;
  private final java.util.concurrent.Executor executor = Executors.newSingleThreadExecutor();

  private static final int EVENT_TYPES_WINDOW_MS = 5 * 60 * 1000;

  private static final int STANDBY_BUCKET_ACTIVE = 10;
  private static final int STANDBY_BUCKET_WORKING_SET = 20;
  private static final int STANDBY_BUCKET_FREQUENT = 30;
  private static final int STANDBY_BUCKET_RARE = 40;
  private static final int STANDBY_BUCKET_RESTRICTED = 45;
  private static final int STANDBY_BUCKET_EXEMPTED = 50;

  public RunningAppsModule(ReactApplicationContext context) {
    super(context);
    this.context = context;
  }

  @Override
  public String getName() {
    return "RunningAppsModule";
  }

  /**
   * Returns a list of recently active applications detected via UsageStatsManager events.
   *
   * Each entry contains:
   * - packageName: String
   * - appName: String
   * - icon: String (base64 data URI or null)
   * - status: "foreground" | "recent" | "active" | "background"
   * - lastTimeUsed: double (epoch ms)
   * - standbyBucket: int (API 28+, -1 if unavailable)
   * - standbyBucketLabel: String ("Active", "Working Set", "Frequent", "Rare", "Restricted", "Exempted", "Unknown")
   * - processImportance: int (-1 if unavailable)
   * - processState: String ("foreground", "background", "unknown")
   *
   * Status definitions:
   * - "foreground": Most recent ACTIVITY_RESUMED event (currently visible to user)
   * - "recent": Activity resumed within the last 5 minutes
   * - "active": Has any usage event within the last 30 minutes
   * - "background": Has usage in the last 24 hours but not recently active
   */
  @ReactMethod
  public void getRunningApps(Promise promise) {
    executor.execute(() -> {
      try {
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        PackageManager pm = context.getPackageManager();
        String ownPackage = context.getPackageName();

        long now = System.currentTimeMillis();
        long windowStart = now - (30 * 60 * 1000);

        WritableArray result = Arguments.createArray();

        if (!TrackingStore.isUsageAccessGranted(context)) {
          promise.resolve(result);
          return;
        }

        UsageEvents events = usm.queryEvents(windowStart, now);
        Map<String, long[]> packageEvents = new HashMap<>();
        Map<String, Integer> packageEventTypes = new HashMap<>();

        long mostRecentResumedTime = 0;
        String mostRecentResumedPackage = null;

        while (events.hasNextEvent()) {
          UsageEvents.Event event = new UsageEvents.Event();
          events.getNextEvent(event);

          int eventType = event.getEventType();
          String pkg = event.getPackageName();
          long timestamp = event.getTimeStamp();

          if (pkg.equals(ownPackage)) continue;

          if (eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
            long[] existing = packageEvents.get(pkg);
            if (existing == null || timestamp > existing[0]) {
              packageEvents.put(pkg, new long[]{timestamp, (long) eventType});
            }
            if (timestamp > mostRecentResumedTime) {
              mostRecentResumedTime = timestamp;
              mostRecentResumedPackage = pkg;
            }
          } else if (eventType == UsageEvents.Event.ACTIVITY_PAUSED
                  || eventType == UsageEvents.Event.ACTIVITY_STOPPED
                  || eventType == UsageEvents.Event.FOREGROUND_SERVICE_START
                  || eventType == UsageEvents.Event.FOREGROUND_SERVICE_STOP) {
            long[] existing = packageEvents.get(pkg);
            if (existing == null || timestamp > existing[0]) {
              packageEvents.put(pkg, new long[]{timestamp, (long) eventType});
            }
          }
        }

        for (Map.Entry<String, long[]> entry : packageEvents.entrySet()) {
          String pkg = entry.getKey();
          long lastEventTime = entry.getValue()[0];
          int lastEventType = (int) entry.getValue()[1];

          String status;
          if (pkg.equals(mostRecentResumedPackage)) {
            status = "foreground";
          } else if (now - lastEventTime <= EVENT_TYPES_WINDOW_MS) {
            status = "recent";
          } else if (now - lastEventTime <= 30 * 60 * 1000) {
            status = "active";
          } else {
            status = "background";
          }

          String processState;
          if (lastEventType == UsageEvents.Event.ACTIVITY_RESUMED) {
            processState = "foreground";
          } else if (lastEventType == UsageEvents.Event.ACTIVITY_PAUSED
                  || lastEventType == UsageEvents.Event.ACTIVITY_STOPPED) {
            processState = "background";
          } else if (lastEventType == UsageEvents.Event.FOREGROUND_SERVICE_START) {
            processState = "foreground-service";
          } else {
            processState = "unknown";
          }

          int standbyBucket = -1;
          String standbyBucketLabel = "Unknown";

          int processImportance = -1;
          try {
            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            List<ActivityManager.RunningAppProcessInfo> procs = am.getRunningAppProcesses();
            if (procs != null) {
              for (ActivityManager.RunningAppProcessInfo proc : procs) {
                if (proc.pkgList != null) {
                  for (String procPkg : proc.pkgList) {
                    if (procPkg.equals(pkg)) {
                      processImportance = proc.importance;
                      break;
                    }
                  }
                }
                if (processImportance != -1) break;
              }
            }
          } catch (Exception e) {
            // Process info not available — expected on modern Android
          }

          WritableMap appInfo = Arguments.createMap();
          appInfo.putString("packageName", pkg);

          try {
            ApplicationInfo appInfoData = pm.getApplicationInfo(pkg, 0);
            appInfo.putString("appName", String.valueOf(pm.getApplicationLabel(appInfoData)));
            Drawable icon = pm.getApplicationIcon(appInfoData);
            String iconBase64 = iconData(icon);
            if (iconBase64 != null) appInfo.putString("icon", iconBase64);
          } catch (Exception e) {
            appInfo.putString("appName", pkg);
          }

          appInfo.putString("status", status);
          appInfo.putDouble("lastTimeUsed", lastEventTime);
          appInfo.putInt("standbyBucket", standbyBucket);
          appInfo.putString("standbyBucketLabel", standbyBucketLabel);
          appInfo.putInt("processImportance", processImportance);
          appInfo.putString("processState", processState);

          result.pushMap(appInfo);
        }

        WritableArray sorted = Arguments.createArray();
        List<ReadableMap> tempList = new ArrayList<>();
        for (int i = 0; i < result.size(); i++) {
          tempList.add(result.getMap(i));
        }
        tempList.sort((a, b) -> {
          long timeA = (long) a.getDouble("lastTimeUsed");
          long timeB = (long) b.getDouble("lastTimeUsed");
          return Long.compare(timeB, timeA);
        });
        for (ReadableMap item : tempList) {
          sorted.pushMap(item);
        }

        Log.d(TAG, "getRunningApps: found " + sorted.size() + " recently active apps");
        promise.resolve(sorted);
      } catch (Exception error) {
        Log.e(TAG, "getRunningApps failed", error);
        promise.reject("RUNNING_APPS_FAILED", error);
      }
    });
  }

  /**
   * Returns the currently foreground application.
   *
   * Returns a map with:
   * - packageName: String
   * - appName: String
   * - icon: String (base64 data URI or null)
   * - lastTimeUsed: double (epoch ms)
   *
   * Returns null if no foreground app is detected or usage access is not granted.
   */
  @ReactMethod
  public void getCurrentForegroundApp(Promise promise) {
    executor.execute(() -> {
      try {
        UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
        PackageManager pm = context.getPackageManager();
        String ownPackage = context.getPackageName();

        if (!TrackingStore.isUsageAccessGranted(context)) {
          promise.resolve(null);
          return;
        }

        long now = System.currentTimeMillis();
        long windowStart = now - (5 * 60 * 1000);

        UsageEvents events = usm.queryEvents(windowStart, now);
        long mostRecentTime = 0;
        String mostRecentPackage = null;

        while (events.hasNextEvent()) {
          UsageEvents.Event event = new UsageEvents.Event();
          events.getNextEvent(event);
          if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
            if (event.getTimeStamp() > mostRecentTime) {
              mostRecentTime = event.getTimeStamp();
              mostRecentPackage = event.getPackageName();
            }
          }
        }

        if (mostRecentPackage == null || mostRecentPackage.equals(ownPackage)) {
          promise.resolve(null);
          return;
        }

        WritableMap result = Arguments.createMap();
        result.putString("packageName", mostRecentPackage);
        result.putDouble("lastTimeUsed", mostRecentTime);

        try {
          ApplicationInfo appInfo = pm.getApplicationInfo(mostRecentPackage, 0);
          result.putString("appName", String.valueOf(pm.getApplicationLabel(appInfo)));
          Drawable icon = pm.getApplicationIcon(appInfo);
          String iconBase64 = iconData(icon);
          if (iconBase64 != null) result.putString("icon", iconBase64);
        } catch (Exception e) {
          result.putString("appName", mostRecentPackage);
        }

        promise.resolve(result);
      } catch (Exception error) {
        Log.e(TAG, "getCurrentForegroundApp failed", error);
        promise.reject("FOREGROUND_APP_FAILED", error);
      }
    });
  }

  /**
   * Returns system-wide memory information.
   * No special permission required — available to all apps.
   *
   * Returns:
   * - totalMem: double (bytes)
   * - availMem: double (bytes)
   * - threshold: double (bytes)
   * - lowMemory: boolean
   */
  @ReactMethod
  public void getSystemMemoryInfo(Promise promise) {
    try {
      ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
      ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
      am.getMemoryInfo(memInfo);

      WritableMap result = Arguments.createMap();
      result.putDouble("totalMem", memInfo.totalMem);
      result.putDouble("availMem", memInfo.availMem);
      result.putDouble("threshold", memInfo.threshold);
      result.putBoolean("lowMemory", memInfo.lowMemory);

      promise.resolve(result);
    } catch (Exception error) {
      Log.e(TAG, "getSystemMemoryInfo failed", error);
      promise.reject("SYSTEM_MEMORY_FAILED", error);
    }
  }

  /**
   * Returns Orbit's own process memory information.
   * No special permission required — only for the calling process.
   *
   * Returns:
   * - totalPss: int (KB)
   * - dalvikPss: int (KB)
   * - nativePss: int (KB)
   * - otherPss: int (KB)
   * - summary: map with java-heap, native-heap, code, stack, graphics, private-other, system, total-pss, total-swap
   */
  @ReactMethod
  public void getOrbitProcessInfo(Promise promise) {
    try {
      Debug.MemoryInfo debugMemInfo = new Debug.MemoryInfo();
      Debug.getMemoryInfo(debugMemInfo);

      WritableMap result = Arguments.createMap();
      result.putInt("totalPss", debugMemInfo.getTotalPss());
      result.putInt("dalvikPss", debugMemInfo.dalvikPss);
      result.putInt("nativePss", debugMemInfo.nativePss);
      result.putInt("otherPss", debugMemInfo.otherPss);
      result.putInt("dalvikPrivateDirty", debugMemInfo.dalvikPrivateDirty);
      result.putInt("nativePrivateDirty", debugMemInfo.nativePrivateDirty);
      result.putInt("otherPrivateDirty", debugMemInfo.otherPrivateDirty);

      WritableMap summary = Arguments.createMap();
      try {
        summary.putString("javaHeap", debugMemInfo.getMemoryStat("summary.java-heap"));
        summary.putString("nativeHeap", debugMemInfo.getMemoryStat("summary.native-heap"));
        summary.putString("code", debugMemInfo.getMemoryStat("summary.code"));
        summary.putString("stack", debugMemInfo.getMemoryStat("summary.stack"));
        summary.putString("graphics", debugMemInfo.getMemoryStat("summary.graphics"));
        summary.putString("privateOther", debugMemInfo.getMemoryStat("summary.private-other"));
        summary.putString("system", debugMemInfo.getMemoryStat("summary.system"));
        summary.putString("totalPss", debugMemInfo.getMemoryStat("summary.total-pss"));
        summary.putString("totalSwap", debugMemInfo.getMemoryStat("summary.total-swap"));
        summary.putString("totalSwapPss", debugMemInfo.getMemoryStat("summary.total-swap-pss"));
      } catch (Exception e) {
        // Memory stats not available on this API level
      }
      result.putMap("summary", summary);

      promise.resolve(result);
    } catch (Exception error) {
      Log.e(TAG, "getOrbitProcessInfo failed", error);
      promise.reject("ORBIT_PROCESS_INFO_FAILED", error);
    }
  }

  /**
   * Returns all installed applications with metadata.
   * Used to resolve package names to human-readable names and icons.
   */
  @ReactMethod
  public void getInstalledAppsForRunning(Promise promise) {
    try {
      PackageManager pm = context.getPackageManager();
      List<ApplicationInfo> installed = pm.getInstalledApplications(PackageManager.GET_META_DATA);
      WritableArray result = Arguments.createArray();
      for (ApplicationInfo info : installed) {
        boolean system = (info.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
        if (system && pm.getLaunchIntentForPackage(info.packageName) == null) continue;
        WritableMap app = Arguments.createMap();
        app.putString("packageName", info.packageName);
        app.putString("appName", String.valueOf(pm.getApplicationLabel(info)));
        app.putBoolean("isSystemApp", system);
        String icon = iconData(pm.getApplicationIcon(info));
        if (icon != null) app.putString("icon", icon);
        result.pushMap(app);
      }
      promise.resolve(result);
    } catch (Exception error) {
      promise.reject("INSTALLED_APPS_FAILED", error);
    }
  }

  private static String standbyBucketToString(int bucket) {
    switch (bucket) {
      case STANDBY_BUCKET_ACTIVE: return "Active";
      case STANDBY_BUCKET_WORKING_SET: return "Working Set";
      case STANDBY_BUCKET_FREQUENT: return "Frequent";
      case STANDBY_BUCKET_RARE: return "Rare";
      case STANDBY_BUCKET_RESTRICTED: return "Restricted";
      case STANDBY_BUCKET_EXEMPTED: return "Exempted";
      default: return "Unknown";
    }
  }

  private String iconData(Drawable drawable) {
    if (drawable == null) return null;
    int size = 96;
    Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap);
    drawable.setBounds(0, 0, size, size);
    drawable.draw(canvas);
    ByteArrayOutputStream output = new ByteArrayOutputStream();
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
    return "data:image/png;base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
  }
}
