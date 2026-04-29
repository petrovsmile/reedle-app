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
const patched  = 's.dependency "AppMetricaAnalytics", "~> 6.0"';

const content = fs.readFileSync(podspecPath, 'utf8');

if (content.includes(patched)) {
  console.log('[patch-appmetrica] already patched, skipping');
  process.exit(0);
}

if (!content.includes(original)) {
  console.warn('[patch-appmetrica] expected string not found, skipping');
  process.exit(0);
}

fs.writeFileSync(podspecPath, content.replace(original, patched), 'utf8');
console.log('[patch-appmetrica] patched AppMetricaAnalytics dependency: 5.16.0 -> ~> 6.0');
