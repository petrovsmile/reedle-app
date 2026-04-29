#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '../node_modules/yandex-mobile-ads/yandex-mobile-ads.podspec'
);

if (!fs.existsSync(podspecPath)) {
  console.log('[patch-yandex-ads] podspec not found, skipping');
  process.exit(0);
}

const original = 's.dependency "YandexMobileAds", "8.0.0-beta.1"';
const patched  = 's.dependency "YandexMobileAds", "~> 7.9"';

const content = fs.readFileSync(podspecPath, 'utf8');

if (content.includes(patched)) {
  console.log('[patch-yandex-ads] already patched, skipping');
  process.exit(0);
}

if (!content.includes(original)) {
  console.warn('[patch-yandex-ads] expected string not found, skipping');
  process.exit(0);
}

fs.writeFileSync(podspecPath, content.replace(original, patched), 'utf8');
console.log('[patch-yandex-ads] patched YandexMobileAds dependency: 8.0.0-beta.1 -> ~> 7.9');
