class Header extends React.Component {
  render(){
    return(
      <SafeAreaView style={{backgroundColor: appThemeStore.colors.surface}}>
        <View style={applicationStyles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
            <AppIcon icon={MenuIcon} size={26} color={appThemeStore.colors.text} />
          </TouchableOpacity> 
          <Text style={applicationStyles.header_title}>{this.props.title}</Text>
          <View style={applicationStyles.header_empty_block}/>
        </View>
        
      </SafeAreaView>
    )
  }
}
