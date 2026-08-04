#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '../node_modules/@appmetrica/react-native-analytics/appmetrica-react-native-analytics.podspec'
);

if (!fs.existsSync(podspecPath)) {
  console.log('[patch-appmetrica] podspec not found, skipping');
  process.exit(0);
}

const original = 's.dependency "AppMetricaAnalytics", "5.16.0"';
const stalePatch = 's.dependency "AppMetricaAnalytics", "~> 6.0"';

const content = fs.readFileSync(podspecPath, 'utf8');

if (content.includes(stalePatch)) {
  fs.writeFileSync(podspecPath, content.replace(stalePatch, original), 'utf8');
  console.log('[patch-appmetrica] reverted stale AppMetrica 6.x patch to 5.16.0');
  process.exit(0);
}

console.log('[patch-appmetrica] no patch needed, skipping');
