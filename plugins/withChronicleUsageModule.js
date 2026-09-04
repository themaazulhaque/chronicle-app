const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE = 'com.chronicle.app';
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

module.exports = function withChronicleUsageModule(config) {
  config = withDangerousMod(config, ['android', async config => {
    const platformRoot = config.modRequest.platformProjectRoot;

    const destDir = path.join(platformRoot, 'app', 'src', 'main', 'java', ...PACKAGE.split('.'));
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    for (const file of NATIVE_FILES) {
      const src = path.join(NATIVE_SRC_DIR, file);
      const dest = path.join(destDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }

    const buildGradle = path.join(platformRoot, 'app', 'build.gradle');
    if (fs.existsSync(buildGradle)) {
      let gradleText = fs.readFileSync(buildGradle, 'utf8');
      if (!gradleText.includes('work-runtime')) {
        gradleText = gradleText.replace(
          /(dependencies\s*\{)/,
          `$1\n    ${WORKMANAGER_DEP}`
        );
        fs.writeFileSync(buildGradle, gradleText);
      }
    }

    const manifest = path.join(platformRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
    let manifestText = fs.readFileSync(manifest, 'utf8');

    for (const perm of REQUIRED_PERMISSIONS) {
      if (!manifestText.includes(perm)) {
        manifestText = manifestText.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${perm}" />`);
      }
    }

    if (!manifestText.includes(BOOT_RECEIVER_TAG)) {
      manifestText = manifestText.replace(
        /(<\/application>)/,
        `${BOOT_RECEIVER_XML}\n  $1`
      );
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
      if (!contents.includes('new ChronicleUsagePackage()')) {
        contents = contents.replace('return packages;', 'packages.add(new ChronicleUsagePackage());\n    return packages;');
      }
    } else {
      if (!contents.includes('import com.chronicle.app.ChronicleUsagePackage')) {
        contents = contents.replace(/(package [^\n]+\n)/, '$1\nimport com.chronicle.app.ChronicleUsagePackage');
      }
      if (!contents.includes('add(ChronicleUsagePackage())')) {
        contents = contents.replace(
          'PackageList(this).packages.apply {',
          'PackageList(this).packages.apply {\n              add(ChronicleUsagePackage())'
        );
      }
    }
    config.modResults.contents = contents;
    return config;
  });
};
