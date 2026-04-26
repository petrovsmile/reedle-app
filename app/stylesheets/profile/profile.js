const profileStyles = StyleSheet.create({
  content: {
    padding: 15,
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
    marginTop: 15
  },
  log_out_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
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