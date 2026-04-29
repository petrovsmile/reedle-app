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

// Revert any stale 7.9 patch from previous builds back to original
const content = fs.readFileSync(podspecPath, 'utf8');
const stale_patch = 's.dependency "YandexMobileAds", "~> 7.9"';
const original    = 's.dependency "YandexMobileAds", "8.0.0-beta.1"';

if (content.includes(stale_patch)) {
  fs.writeFileSync(podspecPath, content.replace(stale_patch, original), 'utf8');
  console.log('[patch-yandex-ads] reverted stale 7.9 patch back to 8.0.0-beta.1');
  process.exit(0);
}

console.log('[patch-yandex-ads] no patch needed, skipping');
