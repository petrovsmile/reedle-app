const Book = observer(class Book extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var book = this.props.book.item;
    var percent = Number(this.props.books_percents[book.id]);
    if (!Number.isFinite(percent)) percent = 0;
 
    return (
      <View style={{ flex: 1, borderRadius: 10, margin: 5 }}>
        <TouchableOpacity onPress={() => this.props.onPress(book.id, book.color)}
          style={{ marginLeft: 10, marginRight: 10, paddingBottom: 15, paddingTop: 15, flexDirection: 'row' }}>

          <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: book.color }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
              {book.name_en.split(' ').slice(0, 3).map((word, index) =>
                <Text key={index} numberOfLines={1} style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 12, paddingLeft: 5, paddingRight: 5, textAlign: 'center' }}>{word}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: appThemeStore.colors.mutedText }}>{book.author}</Text>
            <Text style={{ fontSize: 14, marginTop: 5, color: appThemeStore.colors.text }}>{book.name}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 0) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 1) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 2) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 3) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 4) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <Text style={{ marginLeft: 5, color: appThemeStore.colors.text }}>
                <Text style={{ fontSize: 14, lineHeight: 15, color: appThemeStore.colors.text }}>{book.complexity_text}</Text>
              </Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              <AppIcon icon={BookOpenIcon} size={20} color={percent == 100 ? '#0fa90f' : '#777'} style={{ marginRight: 8 }} />
              <Text style={{ lineHeight: 20, fontSize: 12, color: appThemeStore.colors.text }}>
                <Text style={percent == 100 && { color: '#0fa90f' }}>
                  {percent}%
                </Text>
              </Text>

              <Text style={{ lineHeight: 20, fontSize: 12, marginLeft: 10, color: appThemeStore.colors.text }}>{book.pages} стр.</Text>

              <View style={homeStyles.bookStatusIcons}>
                {book.voiceover &&
                  <BookStatusIcon icon={VolumeIcon} title="Озвучка предложений" color="#777" alignRight />
                }
                {downloadStore.isCompleted(book.id) &&
                  <BookStatusIcon icon={FileCheckIcon} title="Книга скачана" color="#0fa90f" alignRight />
                }
              </View>
            </View>
          </View>

        </TouchableOpacity>
      </View>
    )
  }
});

class BookStatusIcon extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showTitle: false };
  }

  componentWillUnmount() {
    clearTimeout(this.hideTitleTimer);
    if (BookStatusIcon.activeTooltip === this) {
      BookStatusIcon.activeTooltip = null;
    }
  }

  hideTitle() {
    clearTimeout(this.hideTitleTimer);
    this.setState({ showTitle: false });
    if (BookStatusIcon.activeTooltip === this) {
      BookStatusIcon.activeTooltip = null;
    }
  }

  toggleTitle() {
    clearTimeout(this.hideTitleTimer);
    var showTitle = !this.state.showTitle;

    if (showTitle && BookStatusIcon.activeTooltip && BookStatusIcon.activeTooltip !== this) {
      BookStatusIcon.activeTooltip.hideTitle();
    }

    this.setState({ showTitle: showTitle });
    if (showTitle) {
      BookStatusIcon.activeTooltip = this;
      this.hideTitleTimer = setTimeout(() => this.hideTitle(), 2500);
    } else if (BookStatusIcon.activeTooltip === this) {
      BookStatusIcon.activeTooltip = null;
    }
  }

  render() {
    return (
      <TouchableOpacity
        onPress={() => this.toggleTitle()}
        style={homeStyles.bookStatusIcon}
        accessibilityRole="button"
        accessibilityLabel={this.props.title}
      >
        {this.state.showTitle &&
          <View style={[
            homeStyles.bookStatusTooltip,
            { backgroundColor: '#333' },
            this.props.alignRight ? { right: 0 } : { left: 0 }
          ]}>
            <Text numberOfLines={1} style={homeStyles.bookStatusTooltipText}>{this.props.title}</Text>
          </View>
        }
        <AppIcon icon={this.props.icon} size={18} color={this.props.color} />
      </TouchableOpacity>
    );
  }
}
