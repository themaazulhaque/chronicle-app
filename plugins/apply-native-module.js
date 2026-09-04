const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.chronicle.app';
const ANDROID_ROOT = path.join(__dirname, '..', 'android');
const NATIVE_SRC_DIR = path.join(__dirname, 'android-native');
const NATIVE_FILES = [
  'ChronicleUsagePackage.java',
  'ChronicleUsageModule.java',
  'TrackingStore.kt',
  'TrackingScheduler.kt',
  'UsageCollectionWorker.kt',
  'UsageSyncWorker.kt',
  'BootReceiver.kt',
];

const REQUIRED_PERMISSIONS = [
  'android.permission.PACKAGE_USAGE_STATS',
  'android.permission.QUERY_ALL_PACKAGES',
  'android.permission.RECEIVE_BOOT_COMPLETED',
];

const WORKMANAGER_DEP = 'implementation("androidx.work:work-runtime-ktx:2.10.1")';
const BOOT_RECEIVER_TAG = '<receiver android:name=".BootReceiver"';
const BOOT_RECEIVER_XML = `    <receiver
      android:name=".BootReceiver"
      android:exported="false">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
      </intent-filter>
    </receiver>`;

function applyNativeModule() {
  console.log('=== Applying native module files ===');

  // 1. Copy native files
  const destDir = path.join(ANDROID_ROOT, 'app', 'src', 'main', 'java', ...PACKAGE.split('.'));
  fs.mkdirSync(destDir, { recursive: true });

  for (const file of NATIVE_FILES) {
    const src = path.join(NATIVE_SRC_DIR, file);
    const dest = path.join(destDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied: ${file}`);
    } else {
      console.error(`  MISSING source: ${src}`);
      process.exit(1);
    }
  }

  // 2. Inject WorkManager dependency into build.gradle
  console.log('\n=== Injecting WorkManager dependency ===');
  const buildGradle = path.join(ANDROID_ROOT, 'app', 'build.gradle');
  if (fs.existsSync(buildGradle)) {
    let gradleText = fs.readFileSync(buildGradle, 'utf8');
    if (!gradleText.includes('work-runtime')) {
      gradleText = gradleText.replace(
        /(dependencies\s*\{)/,
        `$1\n    ${WORKMANAGER_DEP}`
      );
      fs.writeFileSync(buildGradle, gradleText);
      console.log('  Injected WorkManager dependency');
    } else {
      console.log('  WorkManager dependency already present');
    }
  }

  // 3. Add permissions to AndroidManifest.xml
  console.log('\n=== Adding permissions to AndroidManifest.xml ===');
  const manifest = path.join(ANDROID_ROOT, 'app', 'src', 'main', 'AndroidManifest.xml');
  let manifestText = fs.readFileSync(manifest, 'utf8');

  for (const perm of REQUIRED_PERMISSIONS) {
    if (!manifestText.includes(perm)) {
      manifestText = manifestText.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${perm}" />`);
      console.log(`  Added permission: ${perm}`);
    } else {
      console.log(`  Permission already present: ${perm}`);
    }
  }

  // 4. Add BootReceiver to AndroidManifest.xml
  if (!manifestText.includes(BOOT_RECEIVER_TAG)) {
    manifestText = manifestText.replace(
      /(<\/application>)/,
      `${BOOT_RECEIVER_XML}\n  $1`
    );
    console.log('  Added BootReceiver to AndroidManifest.xml');
  } else {
    console.log('  BootReceiver already present in AndroidManifest.xml');
  }

  fs.writeFileSync(manifest, manifestText);

  // 5. Modify MainApplication.kt
  console.log('\n=== Modifying MainApplication.kt ===');
  const mainApp = path.join(destDir, 'MainApplication.kt');
  let contents = fs.readFileSync(mainApp, 'utf8');

  if (!contents.includes('import com.chronicle.app.ChronicleUsagePackage')) {
    contents = contents.replace(/(package [^\n]+\n)/, '$1\nimport com.chronicle.app.ChronicleUsagePackage');
    console.log('  Added ChronicleUsagePackage import');
  }

  if (!contents.includes('add(ChronicleUsagePackage())')) {
    contents = contents.replace(
      'PackageList(this).packages.apply {',
      'PackageList(this).packages.apply {\n              add(ChronicleUsagePackage())'
    );
    console.log('  Added ChronicleUsagePackage registration');
  }

  fs.writeFileSync(mainApp, contents);

  console.log('\n=== All native module files applied successfully ===');
}

applyNativeModule();
