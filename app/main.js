import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import type { Node } from 'react';
import {
  SafeAreaView,
  Text,
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
  TextInput,
  StyleSheet,
  Modal,
  Button,
  StatusBar,
  RefreshControl,
  Switch,
  Vibration,
  Linking,
  Alert,
  Animated
} from 'react-native';

import { WebView } from 'react-native-webview';

import { SwipeListView } from 'react-native-swipe-list-view';
import moment from 'moment';

import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


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

import Speech from '@mhpdev/react-native-speech';
import Svg, { Path, Circle } from 'react-native-svg';

import { BannerView, BannerAdSize, RewardedAdLoader, MobileAds } from 'yandex-mobile-ads';

setTimeout(async () => {
  try {
    await Speech.setEngine('com.google.android.tts');
    console.log('Google TTS engine activated');
  } catch (err) {
    console.warn('Google TTS not available, using default engine', err);
  }
  // Выбор голоса по умолчанию выполняется в одном месте — в reader.js
  // (функция pickDefaultVoice), чтобы логика не дублировалась.
}, 1000);

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