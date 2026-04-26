class Book extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var book = this.props.book.item;
    var percent = this.props.books_percents[book.id];
 
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, margin: 5 }}>
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
            <Text style={{ fontSize: 12, color: '#666', }}>{book.author}</Text>
            <Text style={{ fontSize: 14, marginTop: 5, }}>{book.name}</Text>
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
              <Text style={{ marginLeft: 5 }}>
                <Text style={{ fontSize: 14, lineHeight: 15 }}>{book.complexity_text}</Text>
              </Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              {percent == 100 &&
                <Image
                  style={{ height: 20, width: 20, marginRight: 8 }}
                  source={require('./app/images/books/book_read.png')}
                />
              }
              {percent != 100 &&
                <Image
                  style={{ height: 20, width: 20, marginRight: 8 }}
                  source={require('./app/images/books/book.png')}
                />
              }
              <Text style={{ lineHeight: 20, fontSize: 12 }}>
                <Text style={percent == 100 && { color: '#0fa90f' }}>
                  {percent}%
                </Text>
              </Text>

              <Text style={{ lineHeight: 20, fontSize: 12, marginLeft: 10, color: "#444" }}>{book.pages} стр.</Text>


              {book.have_file == true &&
                <Image
                  style={{ height: 20, width: 20, marginLeft: 8 }}
                  source={require('./app/images/books/downloaded.png')}
                />
              }
            </View>
          </View>

        </TouchableOpacity>
      </View>
    )
  }
}