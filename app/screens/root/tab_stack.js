class TabStack extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const Tab = createBottomTabNavigator();


    return (
      <Tab.Navigator initialRouteName="Books"
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#f05458'
        })}>
        <Tab.Screen name="Books"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/book-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/book.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Книги',
            headerShown: false
          })}>
          {(tabs) => (
            <Home tabs={tabs} stack={this.props.stack} parent={this} root={this.props.root} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Bookmarks"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/bookmark-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/bookmark.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Закладки',
          })}>
          {(tabs) => (
            <BookmarkStack tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Dictionary"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/dictionary-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/dictionary.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Словарь',
          })}>
          {(tabs) => (
            <Dictionary tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Subscription"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/pro-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/pro.png')} />
                )}
              </React.Fragment>

            ),
            title: 'PRO-доступ',
          })}>
          {(tabs) => (
            <Subscription tabs={tabs} root={this.props.root} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/profile-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/profile.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Профиль',
          })}>
          {() => (
            <Profile root={this.props.root} />
          )}
        </Tab.Screen>
      </Tab.Navigator >
    );
  }
}