class Bookmark extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      have_file: true,
    }
    this.bookmark = this.props.bookmark.item;
  }

  async componentDidMount() {
    var have_file = await new Storage().get('have_file_' + this.bookmark.book_id);
    this.setState({
      have_file: have_file == 'true',
    });
  }

  render() {
    return (
      <View style={bookmarksStyles.bookmarkRow}>
        <TouchableOpacity
          onPress={() => this.props.openBook(this.bookmark.book_id, { page: this.bookmark.page, paragraph: this.bookmark.paragraph })}
          style={[bookmarksStyles.bookmarkCard, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, lineHeight: 40, color: appThemeStore.colors.text }}>{this.bookmark.book_name}</Text>
          <Text style={{ width: 100, textAlign: 'right', lineHeight: 40, fontWeight: 'bold', color: appThemeStore.colors.text }}>Стр. {this.bookmark.page}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.deleteBookmark()}
          style={bookmarksStyles.deleteButton}
          accessibilityLabel="Удалить закладку">
          <AppIcon icon={TrashIcon} size={20} color={app_theme_colors.red} />
        </TouchableOpacity>
      </View>
    )
  }
}
