class ProfileStack extends React.Component {
  render() {
    const RootStack = createStackNavigator();
    const childScreenOptions = (navigation) => ({
      headerTitle: '',
      headerBackVisible: false,
      headerTintColor: appThemeStore.colors.text,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: '100%' }}>
          <AppIcon icon={ChevronLeftIcon} size={24} color={appThemeStore.colors.text} />
          <Text style={{ marginLeft: 4, color: appThemeStore.colors.text, fontSize: 16 }}>Аккаунт</Text>
        </TouchableOpacity>
      )
    });

    return (
      <RootStack.Navigator initialRouteName="profile_home">
        <RootStack.Screen name="profile_home" options={{ headerShown: false }}>
          {(stack) => <Profile root={this.props.root} root_stack={this.props.root_stack} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_details" options={({ navigation }) => childScreenOptions(navigation)}>
          {() => <ProfileDetails root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_password" options={({ navigation }) => childScreenOptions(navigation)}>
          {() => <ProfilePassword root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_memory" options={({ navigation }) => childScreenOptions(navigation)}>
          {(stack) => <ProfileMemory root={this.props.root} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_settings" options={({ navigation }) => childScreenOptions(navigation)}>
          {(stack) => <ProfileSettings root={this.props.root} stack={stack} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}
