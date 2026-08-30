import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  Text as NativeText,
  View,
  TouchableOpacity,
  Platform,
  ImageBackground,
  ScrollView,
  FlatList,
  Dimensions,
  Image,
  ActivityIndicator,
  TouchableWithoutFeedback,
  TextInput as NativeTextInput,
  StyleSheet,
  Modal,
  Button,
  StatusBar,
  RefreshControl,
  Switch,
  Vibration,
  Linking,
  Animated,
  Appearance
} from 'react-native';

import { WebView } from 'react-native-webview';

import { SwipeListView } from 'react-native-swipe-list-view';
import moment from 'moment';

import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';


var RNFS = require('react-native-fs');

var file_root = RNFS.DocumentDirectoryPath;
//console.log(file_root);  

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Slider from '@react-native-community/slider';
import NetInfo from "@react-native-community/netinfo";

import RNRestart from 'react-native-restart';

import { AnimatedCircularProgress } from 'react-native-circular-progress';

import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import { requestTrackingPermission } from 'react-native-tracking-transparency';

import AppMetrica from '@appmetrica/react-native-analytics';

AppMetrica.activate({
  apiKey: 'c810cef0-e69a-4201-81ce-35e3d0e8ce8d',
  sessionTimeout: 120,
  firstActivationAsUpdate: false,
});

var Sound = require('react-native-sound');
Sound = Sound.default || Sound;
Sound.setCategory('Playback');

import * as StoreReview from 'react-native-store-review';

import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

import {
  AlignCenter as AlignCenterIcon,
  AlignJustify as AlignJustifyIcon,
  AlignLeft as AlignLeftIcon,
  AlignRight as AlignRightIcon,
  Book as BookIcon,
  BookOpen as BookOpenIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  CloudDownload as CloudDownloadIcon,
  Download as DownloadIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  FileCheck as FileCheckIcon,
  Menu as MenuIcon,
  Minus as MinusIcon,
  Newspaper as NewspaperIcon,
  Play as PlayIcon,
  Plus as PlusIcon,
  RectangleHorizontal as AdvertisementIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  SlidersHorizontal as SlidersIcon,
  Trash2 as TrashIcon,
  User as UserIcon,
  Volume2 as VolumeIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  X as CloseIcon,
  ArrowDownToLine as ArrowDownToLineIcon,
  BookA as BookAIcon,
  Ellipsis as EllipsisIcon,
  EllipsisVertical as EllipsisVerticalIcon,
  MegaphoneOff as MegaphoneOffIcon
} from 'lucide-react-native';

const AppIcon = ({ icon: Icon, strokeWidth = 1.7, ...props }) => (
  <Icon strokeWidth={strokeWidth} {...props} />
);

const APP_COLOR_THEMES = {
  light: { background: '#ffffff', surface: '#ffffff', backgroundLight: '#eeeeee', border: '#dddddd', text: '#000000', mutedText: '#777777', second: '#bbbbbb' },
  gray: { background: '#eeeeee', surface: '#f7f7f7', backgroundLight: '#dddddd', border: '#cccccc', text: '#000000', mutedText: '#666666', second: '#cccccc' },
  sepia: { background: '#f8f4e9', surface: '#fffaf0', backgroundLight: '#eee6d2', border: '#d4c8a0', text: '#000000', mutedText: '#756d5b', second: '#d4c8a0' },
  dark: { background: '#292c2c', surface: '#353838', backgroundLight: '#444848', border: '#5a5d5d', text: '#ffffff', mutedText: '#bbbbbb', second: '#5a5d5d' },
  black: { background: '#000000', surface: '#161616', backgroundLight: '#242424', border: '#444444', text: '#ffffff', mutedText: '#bbbbbb', second: '#444444' }
};

class AppThemeStore {
  mode = 'system';
  customTheme = 'light';
  systemScheme = Appearance.getColorScheme() || 'light';
  initialized = false;

  constructor() {
    makeAutoObservable(this);
    this.appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      runInAction(() => { this.systemScheme = colorScheme || 'light'; });
    });
  }

  get themeName() {
    if (this.mode == 'custom') return this.customTheme;
    return this.systemScheme == 'dark' ? 'dark' : 'light';
  }

  get colors() { return APP_COLOR_THEMES[this.themeName]; }

  get navigationTheme() {
    var colors = this.colors;
    var baseTheme = colors.text == '#ffffff' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.text,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: '#f05458'
      }
    };
  }

  async initialize() {
    var mode = await AsyncStorage.getItem('app_color_theme_mode');
    var customTheme = await AsyncStorage.getItem('app_color_theme');
    if (!mode) {
      var readerSettingsValue = await AsyncStorage.getItem('themeReaderSettings');
      if (readerSettingsValue) {
        try {
          var readerSettings = JSON.parse(readerSettingsValue);
          var legacyTheme = appThemeNameByBackground(readerSettings.backgroundColorTheme);
          if (legacyTheme != 'light') {
            mode = 'custom';
            customTheme = legacyTheme;
            await AsyncStorage.setItem('app_color_theme_mode', 'custom');
            await AsyncStorage.setItem('app_color_theme', legacyTheme);
          }
        } catch (e) { }
      }
    }
    runInAction(() => {
      this.mode = mode == 'custom' ? 'custom' : 'system';
      this.customTheme = APP_COLOR_THEMES[customTheme] ? customTheme : 'light';
      this.initialized = true;
    });
  }

  async setCustomTheme(themeName) {
    if (!APP_COLOR_THEMES[themeName]) return;
    await AsyncStorage.setItem('app_color_theme_mode', 'custom');
    await AsyncStorage.setItem('app_color_theme', themeName);
    runInAction(() => {
      this.mode = 'custom';
      this.customTheme = themeName;
    });
  }
}

const appThemeStore = new AppThemeStore();

function appThemeNameByBackground(backgroundColor) {
  return ({
    '#ffffff': 'light',
    '#eeeeee': 'gray',
    '#f8f4e9': 'sepia',
    '#292c2c': 'dark',
    '#000000': 'black'
  })[String(backgroundColor || '').toLowerCase()] || 'light';
}

const Text = observer(React.forwardRef(function ThemedText(props, ref) {
  return <NativeText {...props} ref={ref} style={[{ color: appThemeStore.colors.text }, props.style]} />;
}));

const TextInput = observer(React.forwardRef(function ThemedTextInput(props, ref) {
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      placeholderTextColor={props.placeholderTextColor || appThemeStore.colors.mutedText}
      style={[
        { color: appThemeStore.colors.text, backgroundColor: appThemeStore.colors.surface },
        props.style,
        {
          borderColor: appThemeStore.colors.border,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
        }
      ]}
    />
  );
}));

const AppAlert = {
  handler: null,

  alert(title, message, buttons) {
    if (this.handler) {
      this.handler({
        title: title || '',
        message: message || '',
        buttons: buttons && buttons.length ? buttons : [{ text: 'Понятно' }]
      });
    }
  },

  confirm(title, message, onConfirm, confirmText) {
    this.alert(title, message, [
      { text: 'Отмена', style: 'cancel' },
      { text: confirmText || 'Подтвердить', style: 'destructive', onPress: onConfirm }
    ]);
  }
};

class AppAlertModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false, title: '', message: '', buttons: [] };
  }

  componentDidMount() {
    AppAlert.handler = (options) => this.setState(Object.assign({ visible: true }, options));
  }

  componentWillUnmount() {
    AppAlert.handler = null;
  }

  close(button) {
    this.setState({ visible: false }, () => {
      if (button && button.onPress) button.onPress();
    });
  }

  render() {
    if (!this.state.visible) return null;

    return (
      <Modal
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={true}
        statusBarTranslucent={true}
        onRequestClose={() => this.close()}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => this.close()}
          style={{ flex: 1, position: 'relative', zIndex: 2147483647, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
          <View style={{ width: '100%', maxWidth: 420, padding: 20, borderRadius: 10, backgroundColor: appThemeStore.colors.surface }}>
            {this.state.title ? <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: appThemeStore.colors.text }}>{this.state.title}</Text> : null}
            {this.state.message ? <Text style={{ marginTop: this.state.title ? 12 : 0, fontSize: 16, lineHeight: 23, textAlign: 'center', color: appThemeStore.colors.mutedText }}>{this.state.message}</Text> : null}
            <View style={{ flexDirection: 'column', marginTop: 20 }}>
              {this.state.buttons.map((button, index) => {
                var isCancel = button.style == 'cancel';
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => this.close(button)}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      marginTop: index == 0 ? 0 : 8,
                      borderWidth: isCancel ? 1 : 0,
                      borderColor: appThemeStore.colors.border,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isCancel ? appThemeStore.colors.backgroundLight : app_theme_colors.red
                    }}
                  >
                    <Text style={{ color: isCancel ? appThemeStore.colors.text : '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>{button.text || 'Понятно'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    );
  }
}

import { BannerView, BannerAdSize, RewardedAdLoader, MobileAds } from 'yandex-mobile-ads';

if (Platform.OS === 'ios') {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey: 'appl_yVDGxgTAqUpWVfzJNrGMYaxmwhm' });
}

let adSizeBig = null;
let adSizeMini = null;

const AD_UNIT_BANNER = Platform.OS === 'ios' ? 'R-M-1281415-12' : 'R-M-1281416-12';
const AD_UNIT_REWARDED = Platform.OS === 'ios' ? 'R-M-1281415-13' : 'R-M-1281416-13';

// import {
//   Appodeal,
//   AppodealSdkEvent,
//   AppodealAdType,
//   AppodealRewardedEvent,
//   AppodealInterstitialEvent,
//   AppodealLogLevel,
// } from 'react-native-appodeal';

// const adTypes = AppodealAdType.INTERSTITIAL | AppodealAdType.REWARDED_VIDEO;
// if (Platform.OS === 'ios') {
//   Appodeal.initialize('789aac74edf2a69bbe79c2183ffde03ce5b23177b2ac3689', adTypes, true);
// } else {
//   Appodeal.initialize('f4edf7b5ae1c5a9b440881471997c45c6e28f2f31ac7bd54', adTypes, true);
// }

//Appodeal.setLogLevel(AppodealLogLevel.DEBUG);


// Appodeal.addEventListener(AppodealSdkEvent.INITIALIZED, () => {
//   //console.log("Appodeal SDK did initialize");
// });


// Appodeal.addEventListener(AppodealRewardedEvent.REWARD, (event: any) => {
//   if (root_reader != undefined) {
//     //AppMetrica.reportEvent('adEvent',{status: 'REWARD'});    
//     if (root_reader.state.showAdOpacity == true) {
//       root_reader.setState({
//         showAdOpacity: false,
//       });
//       AsyncStorage.setItem('time_ad', moment().format());
//       root_reader.openPage(false);
//     }
//   }
// });

// Appodeal.addEventListener(AppodealRewardedEvent.CLOSED, () => {
//   if (root_reader != undefined) {
//     if (root_reader.state.showAdOpacity == true) {
//       root_reader.setState({
//         showAdOpacity: false,
//       });
//       root_reader.openPage(false);
//     }
//   }
// });

// Appodeal.addEventListener(AppodealRewardedEvent.FAILED_TO_LOAD, () => {
//   if (root_reader != undefined) {
//     //AppMetrica.reportEvent('adEvent',{status: 'FAILED_TO_LOAD'});    
//     if (root_reader.state.showAdOpacity == true) {
//       root_reader.setState({
//         showAdOpacity: false,
//       });
//       if (root_reader.state.showNoAd == false) {
//         root_reader.setState({
//           showNoAd: true,
//         });
//       }
//       root_reader.openPage(false);
//     }
//   }
// });
// Appodeal.addEventListener(AppodealRewardedEvent.FAILED_TO_SHOW, () => {
//   if (root_reader != undefined) {
//     //AppMetrica.reportEvent('adEvent',{status: 'FAILED_TO_SHOW'});    
//     if (root_reader.state.showAdOpacity == true) {
//       root_reader.setState({
//         showAdOpacity: false,
//       });
//       if (root_reader.state.showNoAd == false) {
//         root_reader.setState({
//           showNoAd: true,
//         });
//       }
//       root_reader.openPage(false);
//     }
//   }
// });

// Appodeal.addEventListener(AppodealInterstitialEvent.SHOWN, () => {
//   AsyncStorage.setItem('time_short_ad', moment().format());
// });
