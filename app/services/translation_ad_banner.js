function TranslationAdBanner() {
  return (
    <SafeAreaInsetsContext.Consumer>
      {(insets) => (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets ? insets.bottom : 0, paddingLeft: insets ? insets.left : 0, paddingRight: insets ? insets.right : 0, backgroundColor: '#000' }}>
          <View style={{ height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {adSizeMini && <BannerView size={adSizeMini} adRequest={{ adUnitId: AD_UNIT_BANNER }} />}
          </View>
        </View>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
}
