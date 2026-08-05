import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

let bannerSequence = 0;

export function BannerView({ style }) {
  const renderTo = useRef('yandex_rtb_pwa_' + (++bannerSequence));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (!window.Ya || !window.Ya.Context || !window.Ya.Context.AdvManager) return;

      window.Ya.Context.AdvManager.render({
        blockId: 'R-A-19117521-3',
        renderTo: renderTo.current,
      });
    });
  }, []);

  return (
    <View style={[style, { width: '100%', minHeight: 50, alignItems: 'center' }]}>
      <div id={renderTo.current} style={{ width: '100%', minHeight: 50 }} />
    </View>
  );
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
