var readerScreenStyles = StyleSheet.create({
  screen: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    } : {}),
  },
  layout: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    height: 40,
    flexShrink: 0,
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
    } : {}),
  },
  bookTitle: {
    marginTop: 20,
    paddingLeft: 40,
    paddingRight: 20,
  },
  bookTitleText: {
    fontSize: 35,
    fontFamily: 'LibreBaskerville-Regular',
  },
  paragraphRow: {
    marginTop: 15,
    flexDirection: 'row',
  },
  bookmarkButton: {
    marginTop: 5,
    paddingRight: 5,
    paddingLeft: 15,
  },
  bookmarkNumber: {
    fontSize: 18,
    fontFamily: 'Times',
    textAlign: 'center',
  },
  bookmarkNumberActive: {
    color: '#f05458',
  },
  bookmarkImage: {
    height: 20,
    width: 15,
    marginTop: 5,
  },
  sentencesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 15,
  },
  sentenceIndent: {
    width: 15,
  },
  speakButton: {
    marginTop: 5,
    marginRight: 4,
  },
  wordBlock: {
    borderBottomWidth: 2,
    marginTop: 5,
  },
  wordBlockWithMargin: {
    marginLeft: 10,
    borderBottomWidth: 2,
    marginTop: 5,
  },
  punctuation: {
    marginLeft: 3,
    marginTop: 5,
  },
  translateIcon: {
    marginTop: 5,
    marginLeft: 5,
  },
  adContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 250,
    marginTop: 20,
  },
  readerContainer: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      top: 40,
      bottom: 50,
      left: 0,
      right: 0,
    } : {}),
  },
  footerSpacer: {
    height: Platform.OS === 'web' ? 0 : 50,
  },
  safeRoot: {
    flex: 1,
  },
  readerHeader: {
    height: 40,
    borderBottomWidth: 1,
    flexDirection: 'row',
    position: 'relative',
    zIndex: 2,
  },
  footerNav: {
    height: 50,
    flexShrink: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 2,
    } : {}),
  },
  navButton: {
    padding: 10,
  },
  navArrow: {
    width: 30,
    height: 30,
  },
  pageInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 18,
    lineHeight: 50,
    textAlign: 'center',
  },
});
