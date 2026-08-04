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
          listeners={{
            tabPress: () => {
              if (this.homeRef) this.homeRef.getBooks();
            }
          }}
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
            <SafeAreaInsetsContext.Consumer>
              {(insets) => (
                <Home
                  ref={(ref) => this.homeRef = ref}
                  tabs={tabs}
                  stack={this.props.stack}
                  parent={this}
                  root={this.props.root}
                  safeAreaInsets={insets}
                />
              )}
            </SafeAreaInsetsContext.Consumer>
          )}
        </Tab.Screen>
        <Tab.Screen name="Bookmarks"
          listeners={{
            tabPress: () => {
              if (this.bookmarkStackRef) this.bookmarkStackRef.refresh();
            }
          }}
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
            <BookmarkStack ref={(ref) => this.bookmarkStackRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Dictionary"
          listeners={{
            tabPress: () => {
              if (this.dictionaryRef) this.dictionaryRef.getWords();
            }
          }}
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
            <Dictionary ref={(ref) => this.dictionaryRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
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
