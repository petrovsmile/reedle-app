#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const source_path = path.join(
  __dirname,
  '../node_modules/react-native-store-review/ios/RNStoreReview.mm'
);

if (!fs.existsSync(source_path)) {
  console.log('[patch-store-review] source not found, skipping');
  process.exit(0);
}

// CocoaPods frameworks expose the generated Swift header through the module.
const original_import = '#import "RNStoreReview-Swift.h"';
const patched_import = '#if __has_include(<RNStoreReview/RNStoreReview-Swift.h>)\n#import <RNStoreReview/RNStoreReview-Swift.h>\n#else\n#import "RNStoreReview-Swift.h"\n#endif';
const source = fs.readFileSync(source_path, 'utf8');

if (source.includes(patched_import)) {
  console.log('[patch-store-review] already patched');
  process.exit(0);
}

if (!source.includes(original_import)) {
  throw new Error('[patch-store-review] Swift header import changed; review the patch');
}

fs.writeFileSync(source_path, source.replace(original_import, patched_import), 'utf8');
console.log('[patch-store-review] fixed Swift header import for frameworks');
