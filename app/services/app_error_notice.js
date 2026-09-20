const AppErrorNotice = observer(function AppErrorNotice() {
  var insets = React.useContext(SafeAreaInsetsContext) || { top: 0, right: 0, left: 0 };
  if (!appStore.error_show) return null;
  var safeAreaTop = Platform.OS === 'web' ? 0 : (insets.top || 0);
  var safeAreaRight = Platform.OS === 'web' ? 0 : (insets.right || 0);
  var safeAreaLeft = Platform.OS === 'web' ? 0 : (insets.left || 0);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Закрыть уведомление об ошибке" onPress={() => typeof root_app !== 'undefined' && root_app ? root_app.closeError() : appStore.closeError()} style={{ position: 'absolute', top: safeAreaTop + 8, left: safeAreaLeft + 16, right: safeAreaRight + 16, maxWidth: 568, alignSelf: 'center', zIndex: 100000000, elevation: 24, backgroundColor: app_theme_colors.red, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, padding: 8, justifyContent: 'center' }}>
        <Text style={{ color: app_theme_colors.inverseText, fontSize: 14, lineHeight: 20, includeFontPadding: false }}>{appStore.error_title}</Text>
        {!!appStore.error_description && <Text style={{ color: app_theme_colors.inverseText, fontSize: 14, lineHeight: 20, includeFontPadding: false }}>{appStore.error_description}</Text>}
      </View>
      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}><AppIcon icon={CloseIcon} size={24} color={app_theme_colors.inverseText} /></View>
    </TouchableOpacity>
  );
});
