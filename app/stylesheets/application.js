const app_theme_colors = {
  background: "#FFF",
  backgroundLight: "#eee",
  backgroundDarkLight: '#ddd',
  text: "#000",
  inverseText: "#FFF",
  red: '#f05458',
  success: '#75b641',
  successText: '#57922c',
  successBackground: '#eaf6df',
  errorBackground: '#fdebec',
  completed: '#0fa90f',
  tooltipBackground: '#333',
}

const applicationStyles = StyleSheet.create({
  save_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  error_request_text: {
    color: app_theme_colors.inverseText,
    lineHeight: 20
  }
});
