function articleImageUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : HOST + path;
}

function plainArticleText(value) {
  if (!value) return '';
  return String(value)
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function BlogEye({ color }) {
  return <AppIcon icon={EyeIcon} size={16} color={color} style={{ marginRight: 8 }} />;
}

class Blog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { articles: [], page: 1, nextPage: null, loading: true, loadingMore: false, refreshing: false };
  }

  componentDidMount() {
    this.loadArticles(1);
  }

  async loadArticles(page, refreshing) {
    if (page > 1 && this.state.loadingMore) return;
    this.setState(page > 1 ? { loadingMore: true } : (refreshing ? { refreshing: true } : { loading: true }));

    try {
      var result = await new Request('/api/v2/articles', { page: page }, { do_not_show_error: true }).get();
      if (!result || !Array.isArray(result.items) || !result.pagination) throw new Error('Invalid articles response');
      this.setState({
        articles: page == 1 ? result.items : this.state.articles.concat(result.items),
        page: page,
        nextPage: result.pagination.next_page,
      });
    } catch (error) {
      appStore.showError('Не удалось загрузить блог');
    } finally {
      this.setState({ loading: false, loadingMore: false, refreshing: false });
    }
  }

  openArticle(article) {
    this.props.stack.navigation.navigate('article', { code: article.code });
  }

  renderArticle({ item }) {
    var uri = articleImageUrl(item.image_url);
    return (
      <View style={{ flex: 1, padding: 8 }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => this.openArticle(item)}>
          <View style={[{ height: 184, borderRadius: 8, overflow: 'hidden', backgroundColor: '#eee' }, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
            {uri && <Image source={{ uri: uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: 'rgba(0, 0, 0, 0.55)' }}>
              <View style={blogStyles.look}>
                <BlogEye color="#fff" />
                <Text style={blogStyles.infoOverlayText}>{item.look}</Text>
              </View>
              <Text style={blogStyles.infoOverlayText}>{item.created_at}</Text>
            </View>
          </View>
          <Text style={[{ marginTop: 8, color: '#111', fontSize: 16, fontWeight: 'bold', lineHeight: 20 }, { color: appThemeStore.colors.text }]}>{item.title}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    return (
      <AppSafeAreaView style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        <SwipeListView
          style={blogStyles.scrollContent}
          data={this.state.loading || this.state.refreshing ? [] : this.state.articles}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={() => this.loadArticles(1, true)} />
          }
          ListEmptyComponent={this.state.loading || this.state.refreshing ? <PreviewArticles /> : <Text style={blogStyles.empty}>Статей пока нет</Text>}
          ListFooterComponent={this.state.loadingMore ? <PreviewArticles rows={1} /> : null}
          renderItem={(item) => this.renderArticle(item)}
          onEndReached={() => this.state.nextPage && this.loadArticles(this.state.nextPage)}
          onEndReachedThreshold={0.4}
        />
      </AppSafeAreaView>
    );
  }
}

function PreviewArticles({ rows = 3 }) {
  return (
    <View>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {[0, 1].map(column => (
            <View key={column} style={{ flex: 1, padding: 8 }}>
              <View style={{ height: 184, borderRadius: 8, backgroundColor: appThemeStore.colors.backgroundLight }}>
                <ActivityIndicator style={{ flex: 1 }} size="small" color={appThemeStore.colors.mutedText} />
              </View>
              <View style={{ height: 20, marginTop: 8, borderRadius: 8, backgroundColor: appThemeStore.colors.backgroundLight }} />
              <View style={{ height: 20, marginTop: 8, width: '70%', borderRadius: 8, backgroundColor: appThemeStore.colors.backgroundLight }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

class BlogArticle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { article: null, loading: true };
  }

  async componentDidMount() {
    var article = await new Request('/api/v2/articles/' + encodeURIComponent(this.props.stack.route.params.code), {}, { do_not_show_error: true }).get();
    this.setState({ article: article || null, loading: false });
  }

  renderBlock(block, index) {
    var data = block.data || {};
    if (block.type == 'paragraph') {
      return <Text key={index} style={[blogStyles.block, { fontSize: 16, lineHeight: 24, color: '#222' }, { color: appThemeStore.colors.text }]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'header') {
      return <Text key={index} style={[blogStyles.block, { fontSize: 18, lineHeight: 28, fontWeight: 'bold' }, { color: appThemeStore.colors.text }]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'delimiter') {
      return <Text key={index} style={[blogStyles.block, { textAlign: 'center', fontSize: 18, letterSpacing: 6 }, { color: appThemeStore.colors.text }]}>* * *</Text>;
    }
    if (block.type == 'list') {
      return (
        <View key={index} style={blogStyles.block}>
          {(data.items || []).map((item, itemIndex) => (
            <View key={itemIndex} style={{ flexDirection: 'row', paddingLeft: 8, marginBottom: 8 }}>
              <Text style={[{ width: 24, fontSize: 16, lineHeight: 24 }, { color: appThemeStore.colors.text }]}>{data.style == 'ordered' ? (itemIndex + 1) + '.' : '•'}</Text>
              <Text style={[{ flex: 1, fontSize: 16, lineHeight: 24 }, { color: appThemeStore.colors.text }]}>{plainArticleText(item)}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (block.type == 'image' && data.file && data.file.url) {
      return (
        <View key={index} style={blogStyles.block}>
          <Image source={{ uri: articleImageUrl(data.file.url) }} style={[{ width: '100%', height: 232, borderRadius: 8, backgroundColor: '#eee' }, { backgroundColor: appThemeStore.colors.backgroundLight }]} resizeMode="cover" />
          {data.caption ? <Text style={{ marginTop: 8, color: '#aaa', fontSize: 14 }}>{plainArticleText(data.caption)}</Text> : null}
        </View>
      );
    }
    return null;
  }

  render() {
    if (this.state.loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={appThemeStore.colors.mutedText} />;
    if (!this.state.article) return <Text style={blogStyles.empty}>Статья не найдена</Text>;

    var article = this.state.article;
    return (
      <AppSafeAreaView style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        <ScrollView style={blogStyles.scrollContent} contentContainerStyle={{ padding: 16, paddingBottom: 104 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={blogStyles.look}>
              <BlogEye color="#aaa" />
              <Text style={blogStyles.articleInfoText}>{article.look}</Text>
            </View>
            <Text style={blogStyles.articleInfoText}>{article.created_at}</Text>
          </View>
          <Text style={[{ fontSize: 18, lineHeight: 36, fontWeight: 'bold', marginBottom: 8 }, { color: appThemeStore.colors.text }]}>{article.title}</Text>
          {article.image_url && <Image source={{ uri: articleImageUrl(article.image_url) }} style={[{ width: '100%', height: 232, borderRadius: 8, backgroundColor: '#eee', marginBottom: 8 }, { backgroundColor: appThemeStore.colors.backgroundLight }]} resizeMode="cover" />}
          {(article.content || []).map((block, index) => this.renderBlock(block, index))}
        </ScrollView>
      </AppSafeAreaView>
    );
  }
}
