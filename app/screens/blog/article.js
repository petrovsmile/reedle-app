class BlogArticle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { article: null, loading: true };
  }

  async componentDidMount() {
    try {
      var article = await new Request('/api/v2/articles/' + encodeURIComponent(this.props.stack.route.params.code), {}, { do_not_show_error: true }).get();
      this.setState({ article: article || null, loading: false });
    } catch (error) {
      this.setState({ loading: false });
      appStore.showError('Не удалось загрузить статью');
    }
  }

  render() {
    if (this.state.loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />;
    if (!this.state.article) return <Text style={blogStyles.empty}>Статья не найдена</Text>;

    var article_html = BuildBlogArticleHtml(this.state.article, appThemeStore.colors, HOST);
    return (
      <AppSafeAreaView edges={['left', 'right', 'bottom']} style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        {Platform.OS === 'web' ? React.createElement('iframe', {
          title: this.state.article.title,
          srcDoc: article_html,
          sandbox: 'allow-popups allow-popups-to-escape-sandbox',
          style: { border: 0, width: '100%', height: '100%', flex: 1, display: 'block' },
        }) : <WebView
          source={{ html: article_html, baseUrl: HOST }}
          style={{ flex: 1, backgroundColor: appThemeStore.colors.background }}
          javaScriptEnabled={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          contentInset={{ top: 0, right: 0, bottom: 0, left: 0 }}
          onShouldStartLoadWithRequest={request => {
            if (request.url === 'about:blank' || request.url === HOST || request.url === HOST + '/') return true;
            if (/^https?:\/\//i.test(request.url) || /^mailto:/i.test(request.url)) Linking.openURL(request.url);
            return false;
          }}
        />}
      </AppSafeAreaView>
    );
  }
}
