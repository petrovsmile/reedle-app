class Header extends React.Component {
  render(){
    return(
      <SafeAreaView style={{backgroundColor: '#FFF'}}>
        <View style={applicationStyles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
            <Image style={applicationStyles.header_icon_image} source={require('./app/images/header/menu.png')} />
          </TouchableOpacity> 
          <Text style={applicationStyles.header_title}>{this.props.title}</Text>
          <View style={applicationStyles.header_empty_block}/>
        </View>
        
      </SafeAreaView>
    )
  }
}