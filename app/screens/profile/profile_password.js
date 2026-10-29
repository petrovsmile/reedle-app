const ProfilePassword = observer(
  class ProfilePassword extends React.Component {
    render() {
      var current_user = appStore.current_user;
      if (current_user == false) return <Auth />;
      return (
        <AppSafeAreaView
          edges={['left', 'right', 'bottom']}
          style={[
            applicationStyles.save_area_view,
            {
              backgroundColor: appThemeStore.colors.background,
            },
          ]}
        >
          <ScrollView contentContainerStyle={profileStyles.section}>
            <ChangePassword current_user={current_user} />
          </ScrollView>
        </AppSafeAreaView>
      );
    }
  },
);
