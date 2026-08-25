class ProfileStack extends React.Component {
  render() {
    const RootStack = createStackNavigator();
    const childScreenOptions = (navigation) => ({
      headerBackTitle: 'Аккаунт',
      headerBackTitleVisible: Platform.OS === 'ios',
      headerTintColor: app_theme_colors.red,
      ...(Platform.OS === 'web' ? {
        headerTitle: '',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: '100%' }}
          >
            <AppIcon icon={ChevronLeftIcon} size={24} color={app_theme_colors.red} />
            <Text style={{ marginLeft: 8, color: app_theme_colors.red, fontSize: 17 }}>Аккаунт</Text>
          </TouchableOpacity>
        ),
      } : {}),
    });

    return (
      <RootStack.Navigator initialRouteName="profile_home">
        <RootStack.Screen name="profile_home" options={{ headerShown: false }}>
          {(stack) => <Profile root={this.props.root} root_stack={this.props.root_stack} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_details" options={({ navigation }) => ({ ...childScreenOptions(navigation), title: 'Аккаунт' })}>
          {() => <ProfileDetails root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_password" options={({ navigation }) => ({ ...childScreenOptions(navigation), title: 'Изменить пароль' })}>
          {() => <ProfilePassword root={this.props.root} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}
