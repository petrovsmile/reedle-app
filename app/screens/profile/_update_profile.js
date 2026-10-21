class UpdateProfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      first_name: this.props.current_user.first_name || '',
      last_name: this.props.current_user.last_name || '',
      email: this.props.current_user.email,
      error: false,
      success: false,
    }
  }

  resetForm() {
    this.setState({
      error: false,
      success: false,
    });
  }

  async update() {
    this.setState({
      button_loader: true,
      error: false,
    });

    var response = await new Request('/api/v2/users/current', {
      first_name: this.state.first_name,
      last_name: this.state.last_name,
      email: this.state.email,
    }).put();

    this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        var updated_user = typeof response == 'object' ? response : {
          ...this.props.current_user,
          first_name: this.state.first_name.trim(),
          last_name: this.state.last_name.trim(),
          email: this.state.email.trim().toLowerCase(),
        };

        appStore.setCurrentUser(updated_user);
        await persistCurrentUser(updated_user);

        this.setState({
          first_name: updated_user.first_name || '',
          last_name: updated_user.last_name || '',
          email: updated_user.email,
          success: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.success == true ? (
          <React.Fragment>
            <View style={[profileStyles.thanks_form, { backgroundColor: appThemeStore.colors.backgroundLight }]}>
              <Text style={[profileStyles.thanks_form_title, { color: appThemeStore.colors.text }]}>
                Информация успешно обновлена
              </Text>
              <View style={profileStyles.thanks_form_button_parent}>
                <TouchableOpacity onPress={() => this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>

            </View>
          </React.Fragment>
        ) : (
          <React.Fragment>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Фамилия</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="family-name"
                maxLength={50}
                onChangeText={(value) => this.setState({ last_name: value })}
                style={profileStyles.input}
                placeholder="Фамилия"
                value={this.state.last_name}
              />
            </View>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Имя</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="given-name"
                maxLength={50}
                onChangeText={(value) => this.setState({ first_name: value })}
                style={profileStyles.input}
                placeholder="Имя"
                value={this.state.first_name}
              />
            </View>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>E-mail</Text>
              <TextInput
                onChangeText={(value) => this.setState({ email: value })}
                style={profileStyles.input}
                placeholder={"E-mail"}
                value={this.state.email}
              />
            </View>

            {this.state.error != false &&
              <Text style={profileStyles.error_block}>{this.state.error}</Text>
            }

            <TouchableOpacity style={profileStyles.form_button} onPress={() => this.update()}>
              {this.state.button_loader == true ? (
                <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
              ) : (
                <Text style={profileStyles.form_button_text}>Обновить</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}
