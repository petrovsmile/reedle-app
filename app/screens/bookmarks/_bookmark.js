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
      <View style={{marginLeft:8,marginRight:8,marginBottom:8,flexDirection:'row',alignItems:'center'}}>
        <TouchableOpacity
          onPress={() => this.props.openBook(this.bookmark.book_id, { page: this.bookmark.page, paragraph: this.bookmark.paragraph })}
          style={[{flex:1,height:40,paddingLeft:8,paddingRight:8,borderRadius:8,backgroundColor:app_theme_colors.backgroundLight,flexDirection:'row'},{backgroundColor:appThemeStore.colors.backgroundLight}]}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, lineHeight: 40, color: appThemeStore.colors.text }}>{this.bookmark.book_name}</Text>
          <Text style={{ width: 104, textAlign: 'right', lineHeight: 40, fontWeight: 'bold', color: appThemeStore.colors.text }}>Стр. {this.bookmark.page}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => this.props.deleteBookmark()}
          style={{width:40,height:40,alignItems:'center',justifyContent:'center'}}
          accessibilityLabel="Удалить закладку">
          <AppIcon icon={TrashIcon} size={24} color={app_theme_colors.red} />
        </TouchableOpacity>
      </View>
    )
  }
}
