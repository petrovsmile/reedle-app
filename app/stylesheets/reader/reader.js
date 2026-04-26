var readerScreenStyles = StyleSheet.create({
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
    position: 'relative',
    zIndex: 1,
  },
  footerSpacer: {
    height: 50,
  },
  footerNav: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
