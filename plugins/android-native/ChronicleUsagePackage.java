package com.chronicle.app;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.ReactPackage;
import com.facebook.react.uimanager.ViewManager;

public class ChronicleUsagePackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    return Arrays.<NativeModule>asList(
      new ChronicleUsageModule(context),
      new RunningAppsModule(context)
    );
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext context) {
    return Collections.emptyList();
  }
}
