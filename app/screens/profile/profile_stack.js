class ProfileStack extends React.Component {
  render() {
    const RootStack = createStackNavigator();
    const childScreenOptions = {
      headerBackTitle: 'Аккаунт',
      headerTintColor: app_theme_colors.red,
    };

    return (
      <RootStack.Navigator initialRouteName="profile_home">
        <RootStack.Screen name="profile_home" options={{ headerShown: false }}>
          {(stack) => <Profile root={this.props.root} root_stack={this.props.root_stack} stack={stack} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_details" options={{ ...childScreenOptions, title: 'Аккаунт' }}>
          {() => <ProfileDetails root={this.props.root} />}
        </RootStack.Screen>
        <RootStack.Screen name="profile_password" options={{ ...childScreenOptions, title: 'Изменить пароль' }}>
          {() => <ProfilePassword root={this.props.root} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}
