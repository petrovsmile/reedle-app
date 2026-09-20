class Header extends React.Component {
  render(){
    return(
      <AppSafeAreaView style={{flex: 0, backgroundColor: appThemeStore.colors.surface}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',paddingLeft:16,paddingRight:16,marginTop:8,borderBottomWidth:1,borderBottomColor:app_theme_colors.backgroundLight,paddingBottom:8}}>
          <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
            <AppIcon icon={MenuIcon} size={24} color={appThemeStore.colors.text} />
          </TouchableOpacity> 
          <Text style={{lineHeight:28,height:32}}>{this.props.title}</Text>
          <View style={{width:32,height:32}}/>
        </View>
        
      </AppSafeAreaView>
    )
  }
}
