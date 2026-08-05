function PwaInstallBanner() {
  const [installEvent, setInstallEvent] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    var standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone || window.localStorage.getItem('reedle_install_banner_dismissed') === 'true') {
      return undefined;
    }

    setVisible(true);
    var handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    var handleInstalled = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!visible) return null;

  var isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  var instruction = isIos
    ? 'Нажмите «Поделиться», затем «На экран Домой».'
    : installEvent
      ? 'Установите Reedle, чтобы открывать его как обычное приложение.'
      : 'Откройте меню браузера и выберите «Установить приложение».';

  var close = () => {
    window.localStorage.setItem('reedle_install_banner_dismissed', 'true');
    setVisible(false);
  };

  var install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    var choice = await installEvent.userChoice;
    AppMetrica.reportEvent('installPrompt', { outcome: choice.outcome });
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  return (
    <View style={{
      position: 'absolute', top: 8, left: 8, right: 8, zIndex: 10000,
      padding: 12, borderRadius: 12, backgroundColor: '#fff',
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
      flexDirection: 'row', alignItems: 'center'
    }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 3 }}>Установить Reedle</Text>
        <Text style={{ fontSize: 12, color: '#555' }}>{instruction}</Text>
      </View>
      {installEvent &&
        <TouchableOpacity onPress={install} style={{ backgroundColor: '#f05458', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 12 }}>Установить</Text>
        </TouchableOpacity>
      }
      <TouchableOpacity accessibilityLabel="Закрыть" onPress={close} style={{ padding: 8 }}>
        <Text style={{ color: '#777', fontSize: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}
