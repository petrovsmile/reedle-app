const Book = observer(class Book extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var book = this.props.book.item;
    var percent = Number(this.props.books_percents[book.id]);
    if (!Number.isFinite(percent)) percent = 0;

    return (
      <TouchableOpacity onPress={() => this.props.onPress(book.id, book.color)}
        style={{ padding: 16, flexDirection: 'row' }}>

        <View style={{ height: 96, width: 72, marginRight: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: book.color }}>
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
            {book.name_en.split(' ').slice(0, 3).map((word, index) =>
              <Text key={index} numberOfLines={1} style={{ fontFamily: 'LibreBaskerville-Regular', color: app_theme_colors.inverseText, fontSize: 14, paddingLeft: 8, paddingRight: 8, textAlign: 'center' }}>{word}</Text>
            )}
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: appThemeStore.colors.mutedText }}>{book.author}</Text>
          <Text style={{ fontSize: 14, marginTop: 4, color: appThemeStore.colors.text }}>{book.name}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={{ height: 16, width: 4, borderRadius: 8, marginRight: 4, overflow: 'hidden' }}>
              {(book.level > 0) ? (
                <View style={{ backgroundColor: app_theme_colors.red, flex: 1 }}></View>
              ) : (
                <View style={{ backgroundColor: appThemeStore.colors.border, flex: 1 }}></View>
              )}
            </View>
            <View style={{ height: 16, width: 4, borderRadius: 8, marginRight: 4, overflow: 'hidden' }}>
              {(book.level > 1) ? (
                <View style={{ backgroundColor: app_theme_colors.red, flex: 1 }}></View>
              ) : (
                <View style={{ backgroundColor: appThemeStore.colors.border, flex: 1 }}></View>
              )}
            </View>
            <View style={{ height: 16, width: 4, borderRadius: 8, marginRight: 4, overflow: 'hidden' }}>
              {(book.level > 2) ? (
                <View style={{ backgroundColor: app_theme_colors.red, flex: 1 }}></View>
              ) : (
                <View style={{ backgroundColor: appThemeStore.colors.border, flex: 1 }}></View>
              )}
            </View>
            <View style={{ height: 16, width: 4, borderRadius: 8, marginRight: 4, overflow: 'hidden' }}>
              {(book.level > 3) ? (
                <View style={{ backgroundColor: app_theme_colors.red, flex: 1 }}></View>
              ) : (
                <View style={{ backgroundColor: appThemeStore.colors.border, flex: 1 }}></View>
              )}
            </View>
            <View style={{ height: 16, width: 4, borderRadius: 8, marginRight: 4, overflow: 'hidden' }}>
              {(book.level > 4) ? (
                <View style={{ backgroundColor: app_theme_colors.red, flex: 1 }}></View>
              ) : (
                <View style={{ backgroundColor: appThemeStore.colors.border, flex: 1 }}></View>
              )}
            </View>
            <Text style={{ marginLeft: 4, color: appThemeStore.colors.text }}>
              <Text style={{ fontSize: 14, lineHeight: 16, color: appThemeStore.colors.text }}>{book.complexity_text}</Text>
            </Text>
          </View>
          <View style={{ marginTop: 16, flexDirection: 'row' }}>
            <AppIcon icon={BookOpenIcon} size={16} color={percent == 100 ? app_theme_colors.completed : appThemeStore.colors.mutedText} style={{ marginRight: 4 }} />
            <Text style={{ lineHeight: 16, fontSize: 14, color: appThemeStore.colors.text }}>
              <Text style={percent == 100 && { color: app_theme_colors.completed }}>
                {percent}%
              </Text>
            </Text>

            <Text style={{ lineHeight: 16, fontSize: 14, marginLeft: 8, color: appThemeStore.colors.text }}>{book.pages} стр.</Text>

            <View style={{ flexDirection: 'row', marginLeft: 4, overflow: 'visible', zIndex: 2 }}>
              {book.voiceover &&
                <BookStatusIcon icon={VolumeIcon} title="Озвучка предложений" color={appThemeStore.colors.mutedText} alignRight />
              }
              {downloadStore.isCompleted(book.id) &&
                <BookStatusIcon icon={FileCheckIcon} title="Книга скачана" color={app_theme_colors.completed} alignRight />
              }
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
        style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'visible', marginLeft: 4 }}
        accessibilityRole="button"
        accessibilityLabel={this.props.title}
      >
        {this.state.showTitle &&
          <View style={[{ position: 'absolute', bottom: 24, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8, elevation: 5, zIndex: 10 }, { backgroundColor: app_theme_colors.tooltipBackground }, this.props.alignRight ? { right: 0 } : { left: 0 }]}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>{this.props.title}</Text>
          </View>
        }
        <AppIcon icon={this.props.icon} size={16} color={this.props.color} />
      </TouchableOpacity>
    );
  }
}
