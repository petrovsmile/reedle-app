const profileStyles = StyleSheet.create({
  app_info_text: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 16
  },
  memoryActionDisabled: {
    opacity: 0.4
  },
  section: {
    alignSelf: 'stretch',
    padding: 16
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 40
  },
  authorization_form_tab: {
    flex: 1,
    height: 32,
    lineHeight: 32,
    borderRadius: 8,
    margin: 4
  },
  authorization_form_tab_text: {
    textAlign: 'center',
    lineHeight: 32
  },
  form_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 8
  },
  form_button_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40
  },
  input_title: {
    marginBottom: 8
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundDarkLight,
    borderRadius: 8,
    paddingLeft: 8
  },
  point_input: {
    marginBottom: 16
  },
  error_block: {
    marginBottom: 8,
    color: app_theme_colors.red
  },
  button_password_hide: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  thanks_form: {
    padding: 32,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 8,
    marginTop: 16
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
    width: 48,
    height: 32,
    borderRadius: 8,
    marginTop: 16
  },
  thanks_form_button_text: {
    color: app_theme_colors.inverseText,
    textAlign: 'center',
    lineHeight: 32
  }
});
