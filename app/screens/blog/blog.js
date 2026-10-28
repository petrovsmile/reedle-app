function articleImageUrl(path) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : HOST + path;
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
      <AppSafeAreaView edges={['left', 'right', 'bottom']} style={[blogStyles.screen, { backgroundColor: appThemeStore.colors.background }]}>
        <SwipeListView
          style={blogStyles.scrollContent}
          data={this.state.loading || this.state.refreshing ? [] : this.state.articles}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
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
