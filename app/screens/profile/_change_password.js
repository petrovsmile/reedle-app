class ChangePassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    }
  }

  resetForm(){
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id + '/update_password', {
      password: this.state.password,
      repeat_password: this.state.repeat_password
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
                <TouchableOpacity onPress={()=>this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </React.Fragment>
        ): (
          <React.Fragment>
            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                {this.state.securePassword == true &&
                  <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                }
                {this.state.securePassword == false &&
                  <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                }
              </TouchableOpacity>
            </View>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Повторите пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ repeat_password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                {this.state.securePassword == true &&
                  <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                }
                {this.state.securePassword == false &&
                  <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                }
              </TouchableOpacity>
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