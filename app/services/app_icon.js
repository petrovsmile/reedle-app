function createAppIcon() {
  return ({ icon: Icon, strokeWidth = 1.7, ...props }) => (
    <Icon strokeWidth={strokeWidth} {...props} />
  );
}
