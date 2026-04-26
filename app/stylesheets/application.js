const app_theme_colors = {
  background: "#FFF",
  backgroundLight: "#eee",
  backgroundDarkLight: '#ddd',
  text: "#000",
  inverseText: "#FFF",
  red: '#f05458',
}

const applicationStyles = StyleSheet.create({
  save_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header_icon_image: {
    width: 30,
    height: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
    paddingBottom: 10,
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  header_title: {
    lineHeight: 30,
    height: 30,
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10
  },
  error_request: {
    position: 'absolute',
    backgroundColor: app_theme_colors.red,
    width: Dimensions.get('window').width - 30,
    top: 40, 
    left: 15,
    zIndex: 100000000,
    flexDirection: 'row',
    borderRadius: 10,
  },
  error_request_texts: {
    flex: 1,
    padding: 10,
  },
  error_request_text: {
    color: app_theme_colors.inverseText,
    lineHeight: 20,
  },
  error_request_icon: {
    width: 40,
    height: 40,
    padding: 10,
  },
  error_request_icon_image: {
    width: 20,
    height: 20
  }
});