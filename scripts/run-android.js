#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');

const sdkCandidates = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  '/usr/local/share/android-commandlinetools',
].filter(Boolean);

const platformToolsSdk = sdkCandidates.find(sdk =>
  fs.existsSync(path.join(sdk, 'platform-tools', 'adb')),
);
const emulatorSdk = sdkCandidates.find(sdk =>
  fs.existsSync(path.join(sdk, 'emulator', 'emulator')),
);

if (!platformToolsSdk) {
  console.error('Android SDK platform-tools not found. Install adb or set ANDROID_HOME.');
  process.exit(1);
}

const pathEntries = [path.join(platformToolsSdk, 'platform-tools')];
if (emulatorSdk) {
  pathEntries.push(path.join(emulatorSdk, 'emulator'));
}

const env = {
  ...process.env,
  ANDROID_HOME: platformToolsSdk,
  ANDROID_SDK_ROOT: platformToolsSdk,
  PATH: [...pathEntries, process.env.PATH].filter(Boolean).join(path.delimiter),
};

const cli = require.resolve('@react-native-community/cli/build/bin.js');
const result = spawnSync(process.execPath, [cli, 'run-android', ...process.argv.slice(2)], {
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
