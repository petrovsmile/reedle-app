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
  return <AppIcon icon={EyeIcon} size={16} color={color} style={{ marginRight: 5 }} />;
}

class Blog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { articles: [], page: 1, nextPage: null, loading: true, loadingMore: false };
  }

  componentDidMount() {
    this.loadArticles(1);
  }

  async loadArticles(page) {
    if (page > 1 && this.state.loadingMore) return;
    this.setState(page > 1 ? { loadingMore: true } : { loading: true });

    var result = await new Request('/api/v1/articles', { page: page }, { do_not_show_error: true }).get();
    if (result != false) {
      this.setState({
        articles: page == 1 ? result.items : this.state.articles.concat(result.items),
        page: page,
        nextPage: result.pagination.next_page,
        loading: false,
        loadingMore: false
      });
    } else {
      this.setState({ loading: false, loadingMore: false });
    }
  }

  openArticle(article) {
    this.props.stack.navigation.navigate('article', { code: article.code, title: article.title });
  }

  renderArticle({ item }) {
    var uri = articleImageUrl(item.image_url);
    return (
      <View style={blogStyles.row}>
        <TouchableOpacity style={blogStyles.card} onPress={() => this.openArticle(item)}>
          <View style={blogStyles.cardImageWrap}>
            {uri && <Image source={{ uri: uri }} style={blogStyles.cardImage} resizeMode="cover" />}
            <View style={blogStyles.infoOverlay}>
              <View style={blogStyles.look}>
                <BlogEye color="#fff" />
                <Text style={blogStyles.infoOverlayText}>{item.look}</Text>
              </View>
              <Text style={blogStyles.infoOverlayText}>{item.created_at}</Text>
            </View>
          </View>
          <Text style={blogStyles.cardTitle}>{item.title}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView style={blogStyles.screen}>
        <FlatList
          data={this.state.articles}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={blogStyles.content}
          ListEmptyComponent={!this.state.loading ? <Text style={blogStyles.empty}>Статей пока нет</Text> : null}
          ListFooterComponent={(this.state.loading || this.state.loadingMore) ? <ActivityIndicator style={blogStyles.loader} color="#aaa" /> : null}
          renderItem={(item) => this.renderArticle(item)}
          onEndReached={() => this.state.nextPage && this.loadArticles(this.state.nextPage)}
          onEndReachedThreshold={0.4}
        />
      </SafeAreaView>
    );
  }
}

class BlogArticle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { article: null, loading: true };
  }

  async componentDidMount() {
    var article = await new Request('/api/v1/articles/' + encodeURIComponent(this.props.stack.route.params.code), {}, { do_not_show_error: true }).get();
    this.setState({ article: article || null, loading: false });
    if (article) this.props.stack.navigation.setOptions({ title: article.title });
  }

  renderBlock(block, index) {
    var data = block.data || {};
    if (block.type == 'paragraph') {
      return <Text key={index} style={[blogStyles.block, blogStyles.paragraph]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'header') {
      return <Text key={index} style={[blogStyles.block, blogStyles.header]}>{plainArticleText(data.text)}</Text>;
    }
    if (block.type == 'delimiter') {
      return <Text key={index} style={[blogStyles.block, blogStyles.delimiter]}>* * *</Text>;
    }
    if (block.type == 'list') {
      return (
        <View key={index} style={blogStyles.block}>
          {(data.items || []).map((item, itemIndex) => (
            <View key={itemIndex} style={blogStyles.listRow}>
              <Text style={blogStyles.listMarker}>{data.style == 'ordered' ? (itemIndex + 1) + '.' : '•'}</Text>
              <Text style={blogStyles.listText}>{plainArticleText(item)}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (block.type == 'image' && data.file && data.file.url) {
      return (
        <View key={index} style={blogStyles.block}>
          <Image source={{ uri: articleImageUrl(data.file.url) }} style={blogStyles.contentImage} resizeMode="cover" />
          {data.caption ? <Text style={blogStyles.caption}>{plainArticleText(data.caption)}</Text> : null}
        </View>
      );
    }
    return null;
  }

  render() {
    if (this.state.loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#aaa" />;
    if (!this.state.article) return <Text style={blogStyles.empty}>Статья не найдена</Text>;

    var article = this.state.article;
    return (
      <SafeAreaView style={blogStyles.screen}>
        <ScrollView contentContainerStyle={blogStyles.articleContent}>
          <View style={blogStyles.articleInfo}>
            <View style={blogStyles.look}>
              <BlogEye color="#aaa" />
              <Text style={blogStyles.articleInfoText}>{article.look}</Text>
            </View>
            <Text style={blogStyles.articleInfoText}>{article.created_at}</Text>
          </View>
          {article.image_url && <Image source={{ uri: articleImageUrl(article.image_url) }} style={blogStyles.articleImage} resizeMode="cover" />}
          {(article.content || []).map((block, index) => this.renderBlock(block, index))}
        </ScrollView>
      </SafeAreaView>
    );
  }
}
