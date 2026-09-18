function createAppIcon() {
  return ({ icon: Icon, strokeWidth = 1.7, size = 24, ...props }) => {
    return <Icon strokeWidth={strokeWidth} size={size} {...props} />;
  };
}
