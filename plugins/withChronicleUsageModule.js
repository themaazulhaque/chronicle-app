const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.chronicle.app';
const JAVA_PACKAGE = PACKAGE.replace(/\./g, '/');

const moduleSource = `package ${PACKAGE};

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.provider.Settings;
import android.util.Base64;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ChronicleUsageModule extends ReactContextBaseJavaModule {
  private final ReactApplicationContext context;
  public ChronicleUsageModule(ReactApplicationContext context) { super(context); this.context = context; }
  @Override public String getName() { return "ChronicleUsageModule"; }

  @ReactMethod public void isUsageAccessGranted(Promise promise) {
    try {
      AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
      int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.getPackageName());
      promise.resolve(mode == AppOpsManager.MODE_ALLOWED);
    } catch (Exception error) { promise.reject("USAGE_ACCESS_CHECK_FAILED", error); }
  }

  @ReactMethod public void openUsageAccessSettings(Promise promise) {
    try { context.startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); promise.resolve(null); }
    catch (Exception error) { promise.reject("USAGE_ACCESS_SETTINGS_FAILED", error); }
  }

  @ReactMethod public void getInstalledApps(Promise promise) {
    try {
      PackageManager packageManager = context.getPackageManager();
      List<ApplicationInfo> installed = packageManager.getInstalledApplications(PackageManager.GET_META_DATA);
      WritableArray result = Arguments.createArray();
      for (ApplicationInfo info : installed) {
        if (info.packageName.equals(context.getPackageName())) continue;
        boolean system = (info.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
        if (system && packageManager.getLaunchIntentForPackage(info.packageName) == null) continue;
        WritableMap app = Arguments.createMap();
        app.putString("packageName", info.packageName);
        app.putString("appName", String.valueOf(packageManager.getApplicationLabel(info)));
        app.putBoolean("isSystemApp", system);
        String icon = iconData(packageManager.getApplicationIcon(info));
        if (icon != null) app.putString("icon", icon);
        result.pushMap(app);
      }
      promise.resolve(result);
    } catch (Exception error) { promise.reject("INSTALLED_APPS_FAILED", error); }
  }

  @ReactMethod public void getUsageStats(double startTime, double endTime, Promise promise) {
    try {
      UsageStatsManager manager = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
      List<UsageStats> stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, (long) startTime, (long) endTime);
      Map<String, UsageStats> merged = new HashMap<>();
      for (UsageStats item : stats) {
        if (item.getTotalTimeInForeground() <= 0) continue;
        UsageStats existing = merged.get(item.getPackageName());
        if (existing == null) merged.put(item.getPackageName(), item); else { existing.add(item); }
      }
      WritableArray result = Arguments.createArray();
      for (UsageStats item : merged.values()) {
        WritableMap record = Arguments.createMap();
        record.putString("packageName", item.getPackageName());
        record.putDouble("lastTimeUsed", item.getLastTimeUsed());
        record.putDouble("totalTimeInForeground", item.getTotalTimeInForeground());
        result.pushMap(record);
      }
      promise.resolve(result);
    } catch (Exception error) { promise.reject("USAGE_STATS_FAILED", error); }
  }

  private String iconData(Drawable drawable) {
    if (drawable == null) return null;
    int size = 96; Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888); Canvas canvas = new Canvas(bitmap);
    drawable.setBounds(0, 0, size, size); drawable.draw(canvas); ByteArrayOutputStream output = new ByteArrayOutputStream(); bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
    return "data:image/png;base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
  }
}

class ChronicleUsagePackage implements com.facebook.react.ReactPackage {
  @Override public List<com.facebook.react.bridge.NativeModule> createNativeModules(ReactApplicationContext context) { return java.util.Collections.<com.facebook.react.bridge.NativeModule>singletonList(new ChronicleUsageModule(context)); }
  @Override public List<com.facebook.react.uimanager.ViewManager> createViewManagers(ReactApplicationContext context) { return java.util.Collections.emptyList(); }
}
`;

const REQUIRED_PERMISSIONS = [
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.QUERY_ALL_PACKAGES',
];

module.exports = function withChronicleUsageModule(config) {
  config = withDangerousMod(config, ['android', async config => {
    const javaDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'java', JAVA_PACKAGE);
    fs.mkdirSync(javaDir, { recursive: true });
    fs.writeFileSync(path.join(javaDir, 'ChronicleUsageModule.java'), moduleSource);

    const manifest = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestText = fs.readFileSync(manifest, 'utf8');

    for (const perm of REQUIRED_PERMISSIONS) {
      if (!manifestText.includes(perm)) {
        manifestText = manifestText.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${perm}" />`);
      }
    }

    fs.writeFileSync(manifest, manifestText);
    return config;
  }]);

  return withMainApplication(config, config => {
    let contents = config.modResults.contents;
    if (config.modResults.language === 'java') {
      if (!contents.includes('import com.chronicle.app.ChronicleUsagePackage;')) {
        contents = contents.replace(/(package [^;]+;)/, '$1\n\nimport com.chronicle.app.ChronicleUsagePackage;');
      }
      contents = contents.replace('return packages;', 'packages.add(new ChronicleUsagePackage());\n    return packages;');
    } else {
      if (!contents.includes('import com.chronicle.app.ChronicleUsagePackage')) {
        contents = contents.replace(/(package [^\n]+\n)/, '$1\nimport com.chronicle.app.ChronicleUsagePackage');
      }
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(ChronicleUsagePackage())'
      );
    }
    config.modResults.contents = contents;
    return config;
  });
};
