var readerScreenStyles = StyleSheet.create({
  speakButton: {
    marginTop: 8,
    marginRight: 8
  },
  translateButton: {
    marginTop: 8,
    marginRight: 8,
    ...(Platform.OS === 'web' ? {
      outlineStyle: 'none'
    } : {})
  },
  safeRoot: {
    flex: 1
  }
});
