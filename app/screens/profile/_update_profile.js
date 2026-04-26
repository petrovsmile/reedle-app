class UpdateProfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: this.props.current_user.email,
      error: false,
      success: false,
    }
  }

  resetForm() {
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id, {
      email: this.state.email,
    }).put();

    await this.setState({
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
        await this.setState({
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
            <View style={profileStyles.thanks_form}>
              <Text style={profileStyles.thanks_form_title}>
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