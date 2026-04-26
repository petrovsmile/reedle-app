class BookmarkStack extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const RootStack = createStackNavigator();

    return (
      <RootStack.Navigator initialRouteName="Bookmark">
        <RootStack.Screen name="Bookmark" options={() => ({ headerShown: false })}>
          {(stack) => (
            <Bookmarks root={this.props.root} stack={stack} root_stack={this.props.stack} />
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}