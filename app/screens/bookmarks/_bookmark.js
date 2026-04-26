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
      <View style={{ marginLeft: 10, marginRight: 10, marginBottom: 10, backgroundColor: app_theme_colors.backgroundLight, paddingLeft: 10, paddingRight: 10, borderRadius: 5 }}>
        <TouchableOpacity onPress={() => this.props.openBook(this.bookmark.book_id, { page: this.bookmark.page, paragraph: this.bookmark.paragraph })} style={{ flexDirection: 'row' }}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, lineHeight: 40 }}>{this.bookmark.book_name}</Text>
          <Text style={{ width: 100, textAlign: 'right', lineHeight: 40, fontWeight: 'bold' }}>Стр. {this.bookmark.page}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}