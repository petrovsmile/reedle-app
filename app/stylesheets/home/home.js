const homeStyles = StyleSheet.create({
  safe_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10
  },
  header_title: {
    lineHeight: 35,
    fontSize: 16
  },
  logo: { 
    flexDirection: 'row',
    justifyContent: 'center',
    height: 35
  },
  logo_text: {
    fontSize: 30,
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular',
    color: app_theme_colors.text,
  },
  logo_dot: {
    fontSize: 30,
    lineHeight: 35,
    color: app_theme_colors.red,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_text: { 
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_image: {
    width: 15,
    height: 15,
    marginTop: 10,
    marginLeft: 5
  },
  search: { 
    flexDirection: 'row',
    height: 40,
    overflow: 'hidden',
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    margin: 15,
    marginTop: 10
  },
  search_image: {
    margin: 8
  },
  search_input: { 
    flex: 1,
    height: 40,
    fontSize: 16,
    color: app_theme_colors.text,
    backgroundColor: 'transparent'
  },
  level_selector: { 
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 3,
    marginLeft: 15,
    marginRight: 15,
    zIndex: 1
  },
  level_selector_wrap: {
    flexDirection: 'row'
  },
  level_selector_point: {
    flex: 1,
    backgroundColor: '#eee',
    height: 30,
    borderRadius: 5,
  },
  level_selector_point_active: {
    flex: 1, 
    borderRadius: 8
  },
  level_selector_point_text: {
    fontSize: 13, 
    color: '#000', 
    textAlign: 'center', 
    lineHeight: 30
  },
  properties: { 
    padding: 10,
    backgroundColor: '#FFF',
    marginTop: 3,
    borderRadius: 7
  },
  properties_point: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  properties_point_text: { 
    fontSize: 14,
    lineHeight: 30,
    color: '#444'
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  settings_image: {
    width: 20,
    height: 20
  },
  settings_button: {
    width: 30,
    height: 30,
    marginLeft: 3,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  downloadsPanel: {
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadsTitle: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  downloadBookName: {
    marginBottom: 5,
    fontSize: 13,
    color: '#333',
  },
  downloadProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#e5e5e5',
  },
  downloadProgressValue: {
    height: 6,
    borderRadius: 3,
  },
  downloadStatus: {
    marginTop: 4,
    fontSize: 11,
    color: '#777',
  },
  downloadDismiss: {
    width: 30,
    height: 30,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadDismissText: {
    fontSize: 24,
    lineHeight: 26,
    color: '#999',
  },
  bookStatusIcons: {
    flexDirection: 'row',
    marginLeft: 8,
    overflow: 'visible',
    zIndex: 2
  },
  bookStatusIcon: {
    position: 'relative',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible'
  },
  bookStatusTooltip: {
    position: 'absolute',
    bottom: 25,
    minWidth: 130,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 10
  },
  bookStatusTooltipText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center'
  },
});
