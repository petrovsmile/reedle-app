class Profile extends React.Component {
  async log_out() {
    await new Storage().remove('current_user');
    await new Storage().set('has_subscription', 'false');

    this.props.root.setState({
      current_user: false,
      has_subscription: false
    });
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view} >
        {this.props.root.state.current_user == false ? (
          <Auth />
        ) : (
          <ScrollView>
            <View style={profileStyles.content}>
              <Text style={[profileStyles.title, { marginTop: 15 }]}>Основная информация</Text>
              <UpdateProfile current_user={this.props.root.state.current_user} />

              <Text style={profileStyles.title}>Смена пароля</Text>
              <ChangePassword current_user={this.props.root.state.current_user} />

              <Text style={profileStyles.title}>Выход из аккаунта</Text>
              <TouchableOpacity style={profileStyles.log_out_button} onPress={() => this.log_out()}>
                <Text style={profileStyles.log_out_text}>Выход</Text>
              </TouchableOpacity>

              <Text style={profileStyles.title}>Удалить аккаунт</Text>

              <Text style={{ marginTop: 15, marginBottom: 15 }}>Для того, чтобы полностью удалить аккаунт, перейдите по ссылке ниже: </Text>

              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/profile/delete")}>
                <Text style={{ color: app_theme_colors.red }}>Удаление аккаунта</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    )
  }
}