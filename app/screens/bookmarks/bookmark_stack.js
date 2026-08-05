class BookmarkStack extends React.Component {
  constructor(props) {
    super(props);
  }

  refresh() {
    if (this.bookmarksRef) this.bookmarksRef.getBookmarks();
  }

  render() {
    const RootStack = createStackNavigator();

    return (
      <RootStack.Navigator initialRouteName="bookmark">
        <RootStack.Screen name="bookmark" options={() => ({ headerShown: false })}>
          {(stack) => (
            <Bookmarks ref={(ref) => this.bookmarksRef = ref} root={this.props.root} stack={stack} root_stack={this.props.stack} />
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}
