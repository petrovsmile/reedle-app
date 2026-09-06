const profileStyles = StyleSheet.create({
  content: {
    padding: 15,
  },
  page: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 30,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar_text: {
    color: app_theme_colors.inverseText,
    fontSize: 32,
    fontWeight: 'bold',
  },
  login_button: {
    minHeight: 48,
    marginBottom: 28,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: app_theme_colors.red,
    borderRadius: 8,
  },
  login_button_text: {
    marginLeft: 9,
    color: app_theme_colors.inverseText,
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    marginTop: 12,
    marginBottom: 28,
    fontSize: 16,
    color: app_theme_colors.text,
  },
  menu: {
    alignSelf: 'stretch',
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: app_theme_colors.backgroundLight,
  },
  menu_item: {
    minHeight: 54,
    marginLeft: 15,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
  },
  menu_item_last: {
    borderBottomWidth: 0,
  },
  menu_item_text: {
    flex: 1,
    fontSize: 16,
  },
  menu_item_arrow: {
    color: '#aaa',
    fontSize: 28,
    lineHeight: 30,
  },
  memorySummary: {
    minHeight: 58,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  memoryTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  memoryClear: {
    color: app_theme_colors.red,
    fontSize: 15,
    fontWeight: '600',
  },
  memoryList: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  memoryRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  memoryBookInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  memoryBookName: {
    fontSize: 15,
  },
  memoryBookSize: {
    marginTop: 5,
    fontSize: 13,
  },
  memoryDelete: {
    color: app_theme_colors.red,
    fontSize: 14,
  },
  memoryActionDisabled: {
    opacity: 0.4,
  },
  memoryEmpty: {
    paddingTop: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  section: {
    alignSelf: 'stretch',
    padding: 15,
  },
  section_title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
  },
  authorization_form_tabs: {
    height: 40,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  authorization_form_tab: {
    flex: 1,
    height: 32,
    lineHeight: 32,
    borderRadius: 7,
    margin: 4,
  },
  authorization_form_tab_text: {
    textAlign: 'center',
    lineHeight: 32,
  },
  form_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
  },
  form_button_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  input_title: {
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundDarkLight,
    borderRadius: 5,
    paddingLeft: 10
  },
  point_input: {
    marginBottom: 15,
  },
  button_remember_password: {
    marginTop: 15,
  },
  remember_password_info: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  error_block: {
    marginBottom: 10,
    color: app_theme_colors.red
  },
  password_hide_image: {
    width: 20,
    height: 20,
    margin: 10,
  },
  button_password_hide: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  log_out_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
    marginTop: 30
  },
  log_out_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  delete_button: {
    height: 40,
    marginTop: 10,
    justifyContent: 'center',
  },
  delete_button_text: {
    color: app_theme_colors.red,
    textAlign: 'center',
  },
  social_title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: 'bold',
  },
  social_description: {
    marginTop: 6,
    marginBottom: 14,
    color: '#777',
  },
  social_list: {
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  social_row: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
  },
  social_row_last: {
    borderBottomWidth: 0,
  },
  social_icon: {
    width: 38,
    height: 38,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  social_icon_image: {
    width: 23,
    height: 23,
  },
  social_name: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  social_action: {
    color: app_theme_colors.red,
    fontSize: 14,
  },
  remember_password_thanks: {
    marginBottom: 10,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  remember_password_thanks_text: {
    textAlign: 'center',
    margin: 10,
    fontSize: 16,
    lineHeight: 100,
  },
  thanks_form: {
    padding: 30,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    marginTop: 15,
  },
  thanks_form_title: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  thanks_form_button_parent: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  thanks_form_button: {
    backgroundColor: app_theme_colors.red,
    width: 50,
    height: 30,
    borderRadius: 5,
    marginTop: 15,
  },
  thanks_form_button_text: {
    color: app_theme_colors.inverseText,
    textAlign: 'center', 
    lineHeight: 30
  }
});
