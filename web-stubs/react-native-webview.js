import React from 'react';
import { View } from 'react-native';

export function WebView({ style, onLoadStart, onLoadEnd }) {
  React.useEffect(() => {
    if (onLoadStart) onLoadStart();
    if (onLoadEnd) {
      const timer = setTimeout(onLoadEnd, 0);
      return () => clearTimeout(timer);
    }
  }, [onLoadStart, onLoadEnd]);

  return <View style={style} />;
}

export default WebView;
