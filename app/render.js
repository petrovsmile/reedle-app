const App = observer(function App() {
  useEffect(() => { appThemeStore.initialize(); }, []);
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.body.dataset.reedleBackgroundOwner !== 'book') {
      document.body.style.backgroundColor = appThemeStore.colors.background;
    }
  }, [appThemeStore.themeName]);

  return (
    <SafeAreaProvider>
      <RootApp themeName={appThemeStore.themeName} />
    </SafeAreaProvider>
  );
});

export default App;
