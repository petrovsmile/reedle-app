import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import type { Node } from 'react';
import {
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
  Appearance,
  AppState,
  NativeModules,
  DeviceEventEmitter,
  PermissionsAndroid
} from 'react-native';

import { WebView } from 'react-native-webview';
import { SwipeListView } from 'react-native-swipe-list-view';
import moment from 'moment';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaInsetsContext, SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo';
import RNRestart from 'react-native-restart';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { requestTrackingPermission } from 'react-native-tracking-transparency';
import AppMetrica from '@appmetrica/react-native-analytics';
import * as StoreReview from 'react-native-store-review';
import { makeAutoObservable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import messaging from '@react-native-firebase/messaging';
import { BannerView, BannerAdSize, RewardedAdLoader, MobileAds } from 'yandex-mobile-ads';
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

var SocialAuthSvgXml = require('react-native-svg').SvgXml;
var RNFS = require('react-native-fs');
var file_root = RNFS.DocumentDirectoryPath;

AppMetrica.activate({
  apiKey: 'c810cef0-e69a-4201-81ce-35e3d0e8ce8d',
  sessionTimeout: 120,
  firstActivationAsUpdate: false,
});

var Sound = require('react-native-sound');
Sound = Sound.default || Sound;
Sound.setCategory('Playback');

if (Platform.OS === 'ios') {
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey: 'appl_yVDGxgTAqUpWVfzJNrGMYaxmwhm' });
}

const storage = new Storage();
const AppIcon = createAppIcon();
const appThemeStore = new AppThemeStore();
const Text = createThemedText();
const TextInput = createThemedTextInput();
const AppAlert = new AppAlertService();
const appStore = new AppStore();
const progressStore = new ProgressStore();
const progressService = new ProgressService();
const readerStore = new ReaderStore();
const downloadStore = new DownloadStore();
const homeStore = new HomeStore();
let push_messaging_client = null;
if (Platform.OS === 'web') {
  push_messaging_client = new WebPushMessagingClient();
} else {
  push_messaging_client = messaging();
}
const user_device_registration = new UserDeviceRegistration(push_messaging_client);
const notification_receipt_service = new NotificationReceiptService();
const push_notification_service = new PushNotificationService(push_messaging_client, user_device_registration, notification_receipt_service);
if (Platform.OS === 'android') {
  push_notification_service.foreground_notifications = NativeModules.ForegroundNotification;
  push_notification_service.requestNotificationPermission = async () => {
    if (Platform.Version < 33) return true;
    const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return permission === PermissionsAndroid.RESULTS.GRANTED;
  };
  push_notification_service.subscribeForegroundNotificationOpened = handler => {
    const subscription = DeviceEventEmitter.addListener('reedleNotificationOpened', handler);
    return () => subscription.remove();
  };
}
setInterval(() => notification_receipt_service.flush(), 30000);
AppState.addEventListener('change', state => {
  if (state === 'active') notification_receipt_service.flush();
});

// Modal content is rendered in a separate native host and therefore must own
// its safe-area boundary instead of relying on the screen behind it.
const AppSafeAreaView = ({ style, edges, ...props }) => (
  <ContextSafeAreaView
    {...props}
    edges={Platform.OS === 'web' ? [] : edges}
    style={[{ flex: 1 }, style]}
  />
);

const advertisingConfig = new AdvertisingConfig(Platform.OS);
let adSizeBig = null;
let adSizeMini = null;
const AD_UNIT_BANNER = advertisingConfig.bannerUnitId;
const AD_UNIT_REWARDED = advertisingConfig.rewardedUnitId;
