class TabStack extends React.Component {
  constructor(props) {
    super(props);
  }

  setWebDocumentTitle(title) {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = title;
    }
  }

  render() {
    const Tab = createBottomTabNavigator();


    return (
      <Tab.Navigator initialRouteName="books"
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: appThemeStore.colors.text,
          tabBarLabelPosition: 'below-icon',
          ...(Platform.OS === 'web' ? {
            tabBarStyle: {
              height: 56,
              paddingTop: 0,
              paddingBottom: 0,
            },
            tabBarLabelStyle: {
              lineHeight: 16,
            },
          } : {}),
        })}>
        <Tab.Screen name="books"
          listeners={{
            focus: () => this.setWebDocumentTitle('Книги'),
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
            focus: () => this.setWebDocumentTitle('Закладки'),
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
            focus: () => this.setWebDocumentTitle('Словарь'),
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
            focus: () => this.setWebDocumentTitle('Блог'),
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
          listeners={{
            focus: () => this.setWebDocumentTitle('Профиль'),
          }}
          options={({ route }) => ({
            tabBarIcon: ({ color }) => <AppIcon icon={UserIcon} size={18} color={color} />,
            title: 'Профиль',
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
