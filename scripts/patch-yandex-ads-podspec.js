#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// RN 0.87's prebuilt React module does not expose RCTConvert+CoreLocation
// to Swift. CLLocationDegrees is a Double, so read the JS numbers directly.
const locationFactoryPath = path.join(
  __dirname,
  '../node_modules/yandex-mobile-ads/ios/Utils/Factory/LocationFactory.swift'
);
if (fs.existsSync(locationFactoryPath)) {
  const source = fs.readFileSync(locationFactoryPath, 'utf8');
  const patched = source
    .replace('let latitude = dict[Constants.Key.latitude],', 'let latitude = dict[Constants.Key.latitude] as? NSNumber,')
    .replace('let longitude = dict[Constants.Key.longitude]', 'let longitude = dict[Constants.Key.longitude] as? NSNumber')
    .replace('RCTConvert.clLocationDegrees(latitude)', 'latitude.doubleValue')
    .replace('RCTConvert.clLocationDegrees(longitude)', 'longitude.doubleValue');
  if (source.includes('RCTConvert.clLocationDegrees(') && patched !== source) {
    fs.writeFileSync(locationFactoryPath, patched, 'utf8');
    console.log('[patch-yandex-ads] fixed coordinate conversion for prebuilt React');
  }
}

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
