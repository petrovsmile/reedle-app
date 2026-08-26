class TabStack extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const Tab = createBottomTabNavigator();


    return (
      <Tab.Navigator initialRouteName="books"
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#f05458'
        })}>
        <Tab.Screen name="books"
          listeners={{
            tabPress: () => {
              if (this.homeRef) this.homeRef.getBooks();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookOpenIcon} size={18} color={color} />,
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
        <Tab.Screen name="bookmarks"
          listeners={{
            tabPress: () => {
              if (this.bookmarkStackRef) this.bookmarkStackRef.refresh();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookmarkIcon} size={18} color={color} />,
            title: 'Закладки',
          })}>
          {(tabs) => (
            <BookmarkStack ref={(ref) => this.bookmarkStackRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="dictionary"
          listeners={{
            tabPress: () => {
              if (this.dictionaryRef) this.dictionaryRef.getWords();
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={BookAIcon} size={18} color={color} />,
            title: 'Словарь',
          })}>
          {(tabs) => (
            <Dictionary ref={(ref) => this.dictionaryRef = ref} tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="blog"
          listeners={{
            tabPress: () => {
              if (this.blogRef) this.blogRef.loadArticles(1);
            }
          }}
          options={() => ({
            tabBarIcon: ({ color }) => <AppIcon icon={NewspaperIcon} size={18} color={color} />,
            title: 'Блог',
          })}>
          {() => (
            <Blog ref={(ref) => this.blogRef = ref} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="profile"
          options={({ route }) => ({
            tabBarIcon: ({ color }) => <AppIcon icon={UserIcon} size={18} color={color} />,
            title: 'Аккаунт',
            headerShown: (getFocusedRouteNameFromRoute(route) || 'profile_home') == 'profile_home',
          })}>
          {() => (
            <ProfileStack root={this.props.root} root_stack={this.props.stack} />
          )}
        </Tab.Screen>
      </Tab.Navigator >
    );
  }
}
