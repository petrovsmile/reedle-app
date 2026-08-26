const bookmarksStyles = StyleSheet.create({
  auth_content: {
    margin: 15,
    marginTop: 30
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 18 
  },
  bookmarkRow: {
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  bookmarkCard: {
    flex: 1,
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 5,
    backgroundColor: app_theme_colors.backgroundLight,
    flexDirection: 'row'
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
