import React from 'react';
import { View } from 'react-native';

export function BannerView({ style }) {
  return <View style={style} />;
}

export const BannerAdSize = {
  async inlineSize(width, height) {
    return { width, height };
  },
};

export const RewardedAdLoader = {
  async create() {
    return {
      async loadAd() {
        return {
          onAdDismissed: null,
          onAdFailedToShow: null,
          async show() {
            if (this.onAdDismissed) this.onAdDismissed();
          },
        };
      },
    };
  },
};

export const MobileAds = {
  async initialize() {},
};
