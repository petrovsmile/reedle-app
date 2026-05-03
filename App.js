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
const CURRENT_IOS_VERSION = '1.2.1'
const CURRENT_ANDROID_VERSION = '1.2.1'
const BOOKS_FILENAME = 'books_v1.json'
const POLICY_VERSION = 'v6'
const HOST="https://reedle.ru"
//const HOST="https://stage.reedle.ru" 
//const HOST = "http://localhost:3000"; 
const API_TOKEN = 'yzniq0zn5ygrlg0i3gd1mdi41n3nyycza17dl6tpwdskfo9b50'; 
const app_theme_colors = {
  background: "#FFF",
  backgroundLight: "#eee",
  backgroundDarkLight: '#ddd',
  text: "#000",
  inverseText: "#FFF",
  red: '#f05458',
}

const applicationStyles = StyleSheet.create({
  save_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header_icon_image: {
    width: 30,
    height: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: app_theme_colors.backgroundLight,
    paddingBottom: 10,
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  header_title: {
    lineHeight: 30,
    height: 30,
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10
  },
  error_request: {
    position: 'absolute',
    backgroundColor: app_theme_colors.red,
    width: Dimensions.get('window').width - 30,
    top: 40, 
    left: 15,
    zIndex: 100000000,
    flexDirection: 'row',
    borderRadius: 10,
  },
  error_request_texts: {
    flex: 1,
    padding: 10,
  },
  error_request_text: {
    color: app_theme_colors.inverseText,
    lineHeight: 20,
  },
  error_request_icon: {
    width: 40,
    height: 40,
    padding: 10,
  },
  error_request_icon_image: {
    width: 20,
    height: 20
  }
});
const homeStyles = StyleSheet.create({
  safe_area_view: {
    flex: 1,
    backgroundColor: app_theme_colors.background
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 10
  },
  header_title: {
    lineHeight: 35,
    fontSize: 16
  },
  logo: { 
    flexDirection: 'row',
    justifyContent: 'center',
    height: 35
  },
  logo_text: {
    fontSize: 30,
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular',
    color: app_theme_colors.text,
  },
  logo_dot: {
    fontSize: 30,
    lineHeight: 35,
    color: app_theme_colors.red,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_text: { 
    lineHeight: 35,
    fontFamily: 'LibreBaskerville-Regular'
  },
  link_image: {
    width: 15,
    height: 15,
    marginTop: 10,
    marginLeft: 5
  },
  search: { 
    flexDirection: 'row',
    height: 40,
    overflow: 'hidden',
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    margin: 15,
    marginTop: 10
  },
  search_image: {
    width: 40,
    height: 40
  },
  search_input: { 
    flex: 1,
    height: 40,
    fontSize: 16,
    color: app_theme_colors.text
  },
  level_selector: { 
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 3,
    marginLeft: 15,
    marginRight: 15,
    zIndex: 1
  },
  level_selector_wrap: {
    flexDirection: 'row'
  },
  level_selector_point: {
    flex: 1,
    backgroundColor: '#eee',
    height: 30,
    borderRadius: 5,
  },
  level_selector_point_active: {
    flex: 1, 
    borderRadius: 8
  },
  level_selector_point_text: {
    fontSize: 13, 
    color: '#000', 
    textAlign: 'center', 
    lineHeight: 30
  },
  properties: { 
    padding: 10,
    backgroundColor: '#FFF',
    marginTop: 3,
    borderRadius: 7
  },
  properties_point: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  properties_point_text: { 
    fontSize: 14,
    lineHeight: 30,
    color: '#444'
  },
  header_empty_block: {
    width: 30,
    height: 30
  },
  settings_image: {
    width: 20,
    height: 20,
    margin: 5
  },
});
const bookmarksStyles = StyleSheet.create({
  auth_content: {
    margin: 15,
    marginTop: 30
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 18 
  }
});
const dictionaryStyles = StyleSheet.create({
  auth_content: {
    margin: 15,
    marginTop: 30
  },
  auth_into: {
    textAlign: 'center',
    fontSize: 18
  },
  button_sorting: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingLeft: 8, 
    paddingRight: 8, 
    borderRadius: 4,
    height: 24
  }
});
const profileStyles = StyleSheet.create({
  content: {
    padding: 15,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 40,
  },
  authorization_form_tabs: {
    height: 40,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  authorization_form_tab: {
    flex: 1,
    height: 32,
    lineHeight: 32,
    borderRadius: 7,
    margin: 4,
  },
  authorization_form_tab_text: {
    textAlign: 'center',
    lineHeight: 32,
  },
  form_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
  },
  form_button_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  input_title: {
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: app_theme_colors.backgroundDarkLight,
    borderRadius: 5,
    paddingLeft: 10
  },
  point_input: {
    marginBottom: 15,
  },
  button_remember_password: {
    marginTop: 15,
  },
  remember_password_info: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  error_block: {
    marginBottom: 10,
    color: app_theme_colors.red
  },
  password_hide_image: {
    width: 20,
    height: 20,
    margin: 10,
  },
  button_password_hide: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 0,
    bottom: 0
  },
  log_out_button: {
    height: 40,
    backgroundColor: app_theme_colors.red,
    borderRadius: 5,
    marginTop: 15
  },
  log_out_text: {
    textAlign: 'center',
    flex: 1,
    color: app_theme_colors.inverseText,
    lineHeight: 40,
  },
  remember_password_thanks: {
    marginBottom: 10,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
  },
  remember_password_thanks_text: {
    textAlign: 'center',
    margin: 10,
    fontSize: 16,
    lineHeight: 100,
  },
  thanks_form: {
    padding: 30,
    backgroundColor: app_theme_colors.backgroundLight,
    borderRadius: 10,
    marginTop: 15,
  },
  thanks_form_title: {
    textAlign: 'center',
    fontWeight: 'bold'
  },
  thanks_form_button_parent: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  thanks_form_button: {
    backgroundColor: app_theme_colors.red,
    width: 50,
    height: 30,
    borderRadius: 5,
    marginTop: 15,
  },
  thanks_form_button_text: {
    color: app_theme_colors.inverseText,
    textAlign: 'center', 
    lineHeight: 30
  }
});
var readerScreenStyles = StyleSheet.create({
  bookTitle: {
    marginTop: 20,
    paddingLeft: 40,
    paddingRight: 20,
  },
  bookTitleText: {
    fontSize: 35,
    fontFamily: 'LibreBaskerville-Regular',
  },
  paragraphRow: {
    marginTop: 15,
    flexDirection: 'row',
  },
  bookmarkButton: {
    marginTop: 5,
    paddingRight: 5,
    paddingLeft: 15,
  },
  bookmarkNumber: {
    fontSize: 18,
    fontFamily: 'Times',
    textAlign: 'center',
  },
  bookmarkNumberActive: {
    color: '#f05458',
  },
  bookmarkImage: {
    height: 20,
    width: 15,
    marginTop: 5,
  },
  sentencesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 15,
  },
  sentenceIndent: {
    width: 15,
  },
  speakButton: {
    marginTop: 5,
    marginRight: 4,
  },
  wordBlock: {
    borderBottomWidth: 2,
    marginTop: 5,
  },
  wordBlockWithMargin: {
    marginLeft: 10,
    borderBottomWidth: 2,
    marginTop: 5,
  },
  punctuation: {
    marginLeft: 3,
    marginTop: 5,
  },
  translateIcon: {
    marginTop: 5,
    marginLeft: 5,
  },
  adContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    height: 250,
    marginTop: 20,
  },
  readerContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  footerSpacer: {
    height: 50,
  },
  footerNav: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 10,
  },
  navArrow: {
    width: 30,
    height: 30,
  },
  pageInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageText: {
    fontSize: 18,
    lineHeight: 50,
    textAlign: 'center',
  },
});

// ==================== AppStore ====================
class AppStore {
  has_internet = true;
  has_subscription = false;
  subscription_info = {};
  current_user = false;
  confirm_conditions = true;
  books_percents = {};
  error_show = false;
  error_title = '';
  error_description = '';
  type_payment = Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa';
  show_subsription = false;

  constructor() {
    makeAutoObservable(this);
    this._notification_timer = null;
  }

  setInternet(value) { this.has_internet = value; }
  setSubscription(value) { this.has_subscription = value; }
  setSubscriptionInfo(info) { this.subscription_info = info; }
  setCurrentUser(user) { this.current_user = user; }
  setConfirmConditions(value) { this.confirm_conditions = value; }
  setBooksPercents(percents) { this.books_percents = percents; }
  setTypePayment(value) { this.type_payment = value; }
  setShowSubscription(value) { this.show_subsription = value; }

  showError(title, description) {
    this.error_show = true;
    this.error_title = title;
    this.error_description = description;
    console.log(title + ' ' + description);
    clearTimeout(this._notification_timer);
    this._notification_timer = setTimeout(() => {
      runInAction(() => { this.error_show = false; });
    }, 3000);
  }

  closeError() {
    this.error_show = false;
  }

  clearErrorTimer() {
    clearTimeout(this._notification_timer);
  }
}
const appStore = new AppStore();

// ==================== ReaderStore ====================
class ReaderStore {
  fontSize = 18;
  fontFamily = 'LibreBaskerville-Regular';
  textAlign = 'flex-start';
  translate_icon_size = 24;
  backgroundColorTheme = '#ffffff';
  textColorTheme = '#000000';
  secondColorTheme = '#bbb';
  bookmark = false;
  page = '';
  ttsVoice = false;
  ttsVoiceApplied = false; // true, если текущий ttsVoice уже применён в Tts engine
  list_words = null;
  currentSpeaking = null;

  constructor() {
    makeAutoObservable(this);
  }

  setThemeSettings(settings) {
    // Мерджим — обновляем только те поля, которые реально пришли.
    // Иначе при вызове вида setThemeSettings({fontFamily: 'X'}) все
    // остальные поля стали бы undefined (баг со сбросом шрифта/размеров).
    if (settings.fontSize !== undefined) this.fontSize = settings.fontSize;
    if (settings.fontFamily !== undefined) this.fontFamily = settings.fontFamily;
    if (settings.textAlign !== undefined) this.textAlign = settings.textAlign;
    if (settings.translate_icon_size !== undefined) this.translate_icon_size = settings.translate_icon_size;
    if (settings.backgroundColorTheme !== undefined) this.backgroundColorTheme = settings.backgroundColorTheme;
    if (settings.textColorTheme !== undefined) this.textColorTheme = settings.textColorTheme;
    if (settings.secondColorTheme !== undefined) this.secondColorTheme = settings.secondColorTheme;
  }

  setBookmark(value) { this.bookmark = value; }
  setPage(value) { this.page = value; }
  setTtsVoice(value) { this.ttsVoice = value; this.ttsVoiceApplied = false; }
  setTtsVoiceApplied(value) { this.ttsVoiceApplied = value; }
  setCurrentSpeaking(value) { this.currentSpeaking = value; }
  setListWords(words) { this.list_words = words; }
  clearListWords() { this.list_words = null; }
}
const readerStore = new ReaderStore();

// ==================== HomeStore ====================
class HomeStore {
  open_property = false;

  constructor() {
    makeAutoObservable(this);
  }

  setOpenProperty(value) { this.open_property = value; }
}
const homeStore = new HomeStore();

class Request {
  constructor(url, params, options) {
    this.url = url;
    this.params = params;
    if (options == undefined) {
      this.options = {};
    } else {
      this.options = options;
    }
  }

  async get() {
    return await this.makeRequest('get');
  }

  async post() {
    return await this.makeRequest('post');
  }

  async put() {
    return await this.makeRequest('put');
  }

  async delete() {
    return await this.makeRequest('delete');
  }

  AbortSignal(timeoutMs) {
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), timeoutMs || 0);
  
    return abortController.signal;
  }

  async makeRequest(method) {
    if (appStore.has_internet) {
      let url = HOST + this.url;

      try {
        if (method == 'get') {
          var response = await axios.get(url, { signal: this.AbortSignal(5000), params: this.params });
        }

        if (method == 'post') {
          var response = await axios.post(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'put') {
          var response = await axios.put(url,
            this.params,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` }
            }
          );
        }

        if (method == 'delete') {
          var response = await axios.delete(url,
            {
              signal: this.AbortSignal(5000),
              headers: { Authorization: `Bearer ${API_TOKEN}` },
              data: this.params
            },
          );
        }


        if (response.data['response'] != undefined) {
          return response.data['response'];
        } else {
          return response.data;
        }

      } catch (e) {
        if (this.options.do_not_show_error != true) {
          appStore.showError('Ошибка подключения к серверу', this.options.desciption_error);
        }
        return false;
      }

    } else {
      if (this.options.do_not_show_error != true) {
        appStore.showError('Отсутствует подключение к интернету', this.options.desciption_error);
      }
      return false;
    }
  }
}
class Storage {
  async get(key, default_value) {
    var value = await AsyncStorage.getItem(key);
    if (value == undefined || value == null) {
      value = default_value;
      this.set(key, default_value);
    }
    return value;
  }

  async set(key, value) {
    if (value == undefined) {
      value = '';
    }

    var value = await AsyncStorage.setItem(key, value.toString());
    return value;
  }

  async remove(key) {
    await AsyncStorage.removeItem(key);
  }
}
export default function App() {
  return <RootApp/>;
}
class Bookmark extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      have_file: true,
    }
    this.bookmark = this.props.bookmark.item;
  }

  async componentDidMount() {
    var have_file = await new Storage().get('have_file_' + this.bookmark.book_id);
    this.setState({
      have_file: have_file == 'true',
    });
  }

  render() {
    return (
      <View style={{ marginLeft: 10, marginRight: 10, marginBottom: 10, backgroundColor: app_theme_colors.backgroundLight, paddingLeft: 10, paddingRight: 10, borderRadius: 5 }}>
        <TouchableOpacity onPress={() => this.props.openBook(this.bookmark.book_id, { page: this.bookmark.page, paragraph: this.bookmark.paragraph })} style={{ flexDirection: 'row' }}>
          <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex: 1, lineHeight: 40 }}>{this.bookmark.book_name}</Text>
          <Text style={{ width: 100, textAlign: 'right', lineHeight: 40, fontWeight: 'bold' }}>Стр. {this.bookmark.page}</Text>
        </TouchableOpacity>
      </View>
    )
  }
}
class BookmarkStack extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const RootStack = createStackNavigator();

    return (
      <RootStack.Navigator initialRouteName="Bookmark">
        <RootStack.Screen name="Bookmark" options={() => ({ headerShown: false })}>
          {(stack) => (
            <Bookmarks root={this.props.root} stack={stack} root_stack={this.props.stack} />
          )}
        </RootStack.Screen>
      </RootStack.Navigator>
    );
  }
}
class Bookmarks extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      bookmarks: [],
      do_not_find: false,
    };

    this.storage_bookmarks = [];
    this.search_value = "";
  }

  async componentDidMount() {
    //await new Storage().set('bookmarks_keys', JSON.stringify([]));
    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getBookmarks();
    });

    await this.getBookmarks();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  async getBookmarks() {
    if (this.props.root.state.current_user != false) {
      await this.setState({
        do_not_find: false,
        bookmarks: [],
      });

      this.storage_bookmarks = await this.getBookmarksFromStorage();
      await this.getBookmarksFromServer();
      var bookmarks = await this.getBookmarksFromStorage();

      this.setState({
        bookmarks: bookmarks,
        do_not_find: bookmarks.length == 0
      });
    }
  }

  async getBookmarksFromServer() {
    var server_bookmarks = await new Request('/api/v1/bookmarks', {
      user_id: this.props.root.state.current_user.id
    }, {
      do_not_show_error: true
    }).get();
    if (server_bookmarks != false) {

      var ar_delete_keys = [];
      var ar_add_keys = [];

      // Удаляем с устройства если на сервере удалили и добавляем на сервере, если есть добавленные на устройстве offline
      await Promise.all(this.storage_bookmarks.reverse().map(async storage_bookmark => {
        var has_bookmark = false;
        server_bookmarks.map(async server_bookmark => {
          if (server_bookmark.book.id == storage_bookmark.book_id && has_bookmark == false) {
            has_bookmark = true;
          }
        })
        if (has_bookmark == false) {
          if (storage_bookmark.offline == true) {
            await new Request('/api/v1/bookmarks', {
              book_id: storage_bookmark.book_id,
              user_id: this.props.root.state.current_user.id,
              page: storage_bookmark.page,
              paragraph: storage_bookmark.paragraph
            }, {
              do_not_show_error: true
            }).post();
            storage_bookmark.offline = false;
            await new Storage().set('bookmark_' + storage_bookmark.book_id, JSON.stringify(storage_bookmark));
          } else {
            ar_delete_keys.push('bookmark_' + storage_bookmark.book_id);
          }
        }
      }));

      await Promise.all(server_bookmarks.reverse().map(async server_bookmark => {
        // Добавляем, если на сервере есть новые
        var has_bookmark = false;
        this.storage_bookmarks.forEach((storage_bookmark) => {
          if (server_bookmark.book.id == storage_bookmark.book_id && has_bookmark == false) {
            has_bookmark = true;
          }
        });

        if (has_bookmark == false) {
          await new Storage().set('bookmark_' + server_bookmark.book.id, JSON.stringify({
            book_id: server_bookmark.book.id,
            book_name: server_bookmark.book.name,
            page: server_bookmark.page,
            paragraph: server_bookmark.paragraph
          }));
          ar_add_keys.push('bookmark_' + server_bookmark.book.id);
        }

        // Обновляем, если на сервере параграф больше
        this.storage_bookmarks.forEach((storage_bookmark) => {
          if (server_bookmark.book.id == storage_bookmark.book_id) {
            if (server_bookmark.paragraph > storage_bookmark.paragraph) {
              new Storage().set('bookmark_' + storage_bookmark.book_id, JSON.stringify({
                book_id: storage_bookmark.book_id,
                book_name: storage_bookmark.book_name,
                page: server_bookmark.page,
                paragraph: server_bookmark.paragraph
              }));
              ar_add_keys.push('bookmark_' + server_bookmark.book.id);
            }
          }
        });
      }));

      bookmarks_keys = await new Storage().get('bookmarks_keys');
      if (bookmarks_keys == undefined || bookmarks_keys == null) {
        bookmarks_keys = [];
      } else {
        bookmarks_keys = JSON.parse(bookmarks_keys);
      }

      ar_add_keys.forEach(function (add_key) {
        var index = bookmarks_keys.indexOf(add_key);
        if (index > -1) {
          bookmarks_keys.splice(index, 1);
        }
        bookmarks_keys.unshift(add_key);
      });

      ar_delete_keys.forEach(function (delete_key) {
        var index = bookmarks_keys.indexOf(delete_key);
        if (index > -1) {
          bookmarks_keys.splice(index, 1);
        }
      });

      await new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
    }
  }

  async getBookmarksFromStorage() {
    var bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);
    }

    var bookmarks = await Promise.all(bookmarks_keys.map(async bookmark_key => {
      var bookmark = await new Storage().get(bookmark_key);

      return JSON.parse(bookmark);
    }));

    return bookmarks;
  }

  async deleteBookmark(rowMap, data) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf('bookmark_' + data.book_id);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));

    await new Request('/api/v1/bookmarks', {
      book_id: data.book_id,
      user_id: this.props.root.state.current_user.id
    }, {
      desciption_error: 'Закладка удалена только с этого устройства.'
    }).delete();

    this.getBookmarks();
  }

  openBook(book_id, bookmark) {
    // Открываем Reader через корневой стек (над табами), чтобы не было
    // ни нижней таб-панели, ни заголовка вложенного стека закладок.
    this.props.root_stack.navigation.navigate('Reader', {
      book_id: book_id,
      bookmark: bookmark,
    });
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        {this.props.root.state.current_user == false ? (
          <View style={bookmarksStyles.auth_content}>
            <Text style={bookmarksStyles.auth_into}>
              Для того чтобы воспользоваться закладками,
              необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[bookmarksStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={bookmarksStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[bookmarksStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (

          <React.Fragment>
            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', flexDirection: 'row' }}>
                  Чтобы создать закладку,
                  зайдите на книгу и нажмите иконку закладки
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили закладку, но она не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: '#ddd', borderRadius: 10 }} onPress={() => this.getBookmarks()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center' }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false &&
              <SwipeListView
                style={{ flex: 1, zIndex: 0, paddingTop: 10 }}
                refreshControl={
                  <RefreshControl refreshing={false} onRefresh={() => this.getBookmarks()} />
                }
                showsHorizontalScrollIndicator={false}
                scrollIndicatorInsets={{ right: 1 }}
                removeClippedSubviews={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                data={this.state.bookmarks}
                renderItem={(bookmark) => <Bookmark openBook={(book_id, bookmark) => this.openBook(book_id, bookmark)} bookmark={bookmark} />}
                keyExtractor={(bookmark) => bookmark.book_id}
                ListEmptyComponent={() => <PreviewBookmarks />}
                rightOpenValue={-40}
                disableRightSwipe={true}
                renderHiddenItem={(data, rowMap) => {

                  return (
                    <View style={{ flex: 1, flexDirection: 'row', heihgt: 40, justifyContent: 'flex-end', marginRight: 10, }}>
                      <TouchableOpacity onPress={() => this.deleteBookmark(rowMap, data.item)}>
                        <Image style={{ width: 20, height: 20, margin: 10 }} source={require('./app/images/bookmarks/delete.png')} />
                      </TouchableOpacity>
                    </View>
                  )
                }}

              />
            }
          </React.Fragment>

        )}
      </SafeAreaView>

    )
  }
}


function PreviewBookmarks() {
  return (
    <React.Fragment>
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
      <PreviewBookmark />
    </React.Fragment>
  );
}

function PreviewBookmark() {
  return (
    <React.Fragment>
      <View style={{ marginLeft: 15, marginRight: 15, paddingBottom: 15, paddingTop: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ height: 50, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        </View>
      </View>
    </React.Fragment>
  );
}
class Dictionary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      auth_modal: false,
      auth_method: 'login',
      words: [],
      do_not_find: false,
      sorting_by: 'date'
    };

    this.storage_words = [];
  }

  async componentDidMount() {
    this._unsubFocus = this.props.stack.navigation.addListener('focus', () => {
      this.getWords();
    });

    this.getWords();
  }

  componentWillUnmount() {
    if (this._unsubFocus) {
      this._unsubFocus();
    }
  }

  async getWords() {
    if (this.props.root.state.current_user != false) {
      await this.setState({
        do_not_find: false,
        words: [],
      });

      this.storage_words = await this.getWordsFromStorage();
      await this.getWordsFromServer();
      var words = await this.getWordsFromStorage();

      if (this.state.sorting_by == 'alphabet') {
        words = words.sort((a, b) => {
          return a.original >= b.original ? 0 : - 1;
        });
      }

      this.setState({
        words: words,
        do_not_find: words.length == 0
      });
    }
  }

  async getWordsFromStorage() {
    var words_keys = await new Storage().get('words_keys', '[]');
    words_keys = JSON.parse(words_keys);

    var words = await Promise.all(words_keys.map(async word_key => {
      var word = await new Storage().get(word_key, '{}');

      return JSON.parse(word);
    }));

    return words;
  }

  async getWordsFromServer() {
    var server_words = await new Request('/api/v1/dictionary/words', {
      user_id: this.props.root.state.current_user.id
    }, {
      do_not_show_error: true
    }).get();

    if (server_words != false) {
      var ar_delete_keys = [];
      var ar_add_keys = [];

      // Удаляем с устройства если на сервере удалили и добавляем на сервере, если есть добавленные на устройстве offline
      await Promise.all(this.storage_words.reverse().map(async storage_word => {
        var has_word = false;
        server_words.map(async server_word => {
          if (server_word.original == storage_word.original && has_word == false) {
            has_word = true;
          }
        })
        if (has_word == false) {
          if (storage_word.offline == true) {
            await new Request('/api/v1/dictionary/words', {
              original: storage_word.original,
              user_id: this.props.root.state.current_user.id
            }, {
              do_not_show_error: true
            }).post();
            storage_word.offline = false;
            
            await new Storage().set('word_' + storage_word.original, JSON.stringify(storage_word));
          } else {
            ar_delete_keys.push('word_' + storage_word.original);
          }
        }
      }));

      await Promise.all(server_words.reverse().map(async server_word => {
        // Добавляем, если на сервере есть новые
        var has_word = false;
        this.storage_words.forEach((storage_word) => {
          if (server_word.original == storage_word.original && has_word == false) {
            has_word = true;
          }
        });

        if (has_word == false) {
          await new Storage().set('word_' + server_word.original, JSON.stringify({
            original: server_word.original,
            transcription: server_word.transcription,
            translate: server_word.translate,
            created_at: server_word.created_at
          }));
          ar_add_keys.push('word_' + server_word.original);
        }
      }));

      words_keys = await new Storage().get('words_keys', '[]');
      words_keys = JSON.parse(words_keys);

      ar_add_keys.forEach(function (add_key) {
        var index = words_keys.indexOf(add_key);
        if (index > -1) {
          words_keys.splice(index, 1);
        }
        words_keys.unshift(add_key);
      });

      ar_delete_keys.forEach(function (delete_key) {
        var index = words_keys.indexOf(delete_key);
        if (index > -1) {
          words_keys.splice(index, 1);
        }
      });

      await new Storage().set('words_keys', JSON.stringify(words_keys));
    }
  }

  async deleteWord(rowMap, data) {
    words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf('word_' + data.original);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    new Storage().set('words_keys', JSON.stringify(words_keys));

    await new Request('/api/v1/dictionary/words', {
      original: data.original,
      user_id: this.props.root.state.current_user.id
    }, {
      desciption_error: 'Слово удалено только с этого устройства.'
    }).delete();

    this.getWords();
  }

  set_sorting_by(sorting_by) {
    this.setState({
      sorting_by: sorting_by
    }, function () {
      this.getWords();
    });
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view}>
        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        {this.props.root.state.current_user == false ? (
          <View style={dictionaryStyles.auth_content}>
            <Text style={dictionaryStyles.auth_into}>
              Для того чтобы воспользоваться
              словарем, необходимо
            </Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'login' })} style={[dictionaryStyles.auth_into, { color: '#f05458', marginTop: 15 }]}>авторизоваться</Text>
            <Text style={dictionaryStyles.auth_into}>или</Text>
            <Text onPress={() => this.setState({ auth_modal: true, auth_method: 'reg' })} style={[dictionaryStyles.auth_into, { color: '#f05458' }]}>зарегистрироваться</Text>
          </View>
        ) : (
          <React.Fragment>

            {this.state.do_not_find == true &&
              <View style={{ marginTop: 100, flex: 1, padding: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
                  Нет слов...
                </Text>
                <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa', marginTop: 8 }}>
                  Мы можете добавить перевод любого слова на странице книги
                </Text>
                <Text style={{ marginTop: 50, fontSize: 14, color: '#aaa', textAlign: 'center' }}>Если вы добавили слово, но оно не отображается, обновите раздел</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 15 }}>
                  <TouchableOpacity style={{ width: 200, height: 40, backgroundColor: '#ddd', borderRadius: 10 }} onPress={() => this.getWords()}>
                    <Text style={{ lineHeight: 40, textAlign: 'center' }}>Обновить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            {this.state.do_not_find == false &&
              <View style={{ flex: 1, flexDirection: 'column' }}>
                <View style={{ padding: 8 }}>

                  {this.props.root.state.has_subscription == false &&
                    <React.Fragment>
                      <Text>Вы использовали {this.state.words.length} из 30 слов</Text>
                      <View style={{ marginTop: 10, marginBottom: 10, backgroundColor: '#eee', borderRadius: 4, height: 15, overflow: 'hidden' }}>
                        <View style={{
                          width: Dimensions.get('window').width * (this.state.words.length / 30),
                          height: 15, backgroundColor: '#f05458'
                        }}></View>
                      </View>
                      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 15 }}>Без PRO-доступа можно добавить максимум 30 слов</Text>
                    </React.Fragment>
                  }

                  <Text style={{}}>
                    Сортировать по:
                  </Text>


                  <View style={{ height: 24, flexDirection: 'row', justifyContent: 'flex-start', marginTop: 8 }}>
                    <TouchableOpacity onPress={() => this.set_sorting_by('date')}>
                      <View style={[dictionaryStyles.button_sorting, this.state.sorting_by == 'date' ? { backgroundColor: '#aaa', borderColor: '#aaa' } : {}]}>
                        <Text style={[this.state.sorting_by == 'date' ? { color: '#FFF' } : {}, { fontSize: 12, lineHeight: 22 }]}>дате добавления</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.set_sorting_by('alphabet')}>
                      <View style={[dictionaryStyles.button_sorting, this.state.sorting_by == 'alphabet' ? { backgroundColor: '#aaa', borderColor: '#aaa' } : {}, { marginLeft: 8 }]}>
                        <Text style={[this.state.sorting_by == 'alphabet' ? { color: '#FFF' } : {}, { fontSize: 12, lineHeight: 22 }]}>по алфавиту</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>


                <SwipeListView
                  style={{ flex: 1, zIndex: 0, paddingTop: 8 }}
                  refreshControl={
                    <RefreshControl refreshing={false} onRefresh={() => this.getWords()} />
                  }
                  showsHorizontalScrollIndicator={false}
                  scrollIndicatorInsets={{ right: 1 }}
                  removeClippedSubviews={true}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  data={this.state.words}
                  renderItem={(word) => {
                    return (
                      <View style={{ marginLeft: 8, marginRight: 8, backgroundColor: '#FFF', borderColor: '#eee', borderWidth: 1, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                        <View style={{ height: 4, backgroundColor: '#eee' }}></View>
                        <View style={{ padding: 8 }}>
                          <Text style={{ fontWeight: 'bold' }}>{word.item.original}</Text>
                          {word.item.transcription != null &&
                            <Text style={{ color: '#aaa', marginTop: 4 }}>{word.item.transcription}</Text>
                          }
                          <Text style={{ marginTop: 4 }}>{word.item.translate}</Text>
                        </View>
                      </View>
                    )
                  }}
                  keyExtractor={(word) => word.original}
                  ListEmptyComponent={() => <PreviewWords />}
                  rightOpenValue={-40}
                  disableRightSwipe={true}
                  renderHiddenItem={(data, rowMap) => {
                    return (
                      <View style={{ flex: 1, flexDirection: 'row', heihgt: 40, justifyContent: 'flex-end', marginRight: 8 }}>
                        <TouchableOpacity onPress={() => this.deleteWord(rowMap, data.item)}>
                          <Image style={{ width: 20, height: 20, margin: 10 }} source={require('./app/images/bookmarks/delete.png')} />
                        </TouchableOpacity>
                      </View>
                    )
                  }}
                />
              </View>
            }
          </React.Fragment>
        )}
      </SafeAreaView>

    )
  }
}




function PreviewWords() {
  return (
    <React.Fragment>
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
      <PreviewWord />
    </React.Fragment>
  );
}

function PreviewWord() {
  return (
    <React.Fragment>
      <View style={{ margin: 8, height: 50, borderRadius: 4, overflow: 'hidden', backgroundColor: '#eee' }}>
        <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
      </View>
    </React.Fragment>
  );
}
class Book extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    var book = this.props.book.item;
    var percent = this.props.books_percents[book.id];
 
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, margin: 5 }}>
        <TouchableOpacity onPress={() => this.props.onPress(book.id, book.color)}
          style={{ marginLeft: 10, marginRight: 10, paddingBottom: 15, paddingTop: 15, flexDirection: 'row' }}>

          <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: book.color }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
              {book.name_en.split(' ').slice(0, 3).map((word, index) =>
                <Text key={index} numberOfLines={1} style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 12, paddingLeft: 5, paddingRight: 5, textAlign: 'center' }}>{word}</Text>
              )}
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#666', }}>{book.author}</Text>
            <Text style={{ fontSize: 14, marginTop: 5, }}>{book.name}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 0) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 1) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 2) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 3) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <View style={{ height: 15, width: 5, borderRadius: 5, marginRight: 5, overflow: 'hidden' }}>
                {(book.level > 4) ? (
                  <View style={{ backgroundColor: book.level_color, flex: 1 }}></View>
                ) : (
                  <View style={{ backgroundColor: '#ddd', flex: 1 }}></View>
                )}
              </View>
              <Text style={{ marginLeft: 5 }}>
                <Text style={{ fontSize: 14, lineHeight: 15 }}>{book.complexity_text}</Text>
              </Text>
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row' }}>
              {percent == 100 &&
                <Image
                  style={{ height: 20, width: 20, marginRight: 8 }}
                  source={require('./app/images/books/book_read.png')}
                />
              }
              {percent != 100 &&
                <Image
                  style={{ height: 20, width: 20, marginRight: 8 }}
                  source={require('./app/images/books/book.png')}
                />
              }
              <Text style={{ lineHeight: 20, fontSize: 12 }}>
                <Text style={percent == 100 && { color: '#0fa90f' }}>
                  {percent}%
                </Text>
              </Text>

              <Text style={{ lineHeight: 20, fontSize: 12, marginLeft: 10, color: "#444" }}>{book.pages} стр.</Text>


              {book.have_file == true &&
                <Image
                  style={{ height: 20, width: 20, marginLeft: 8 }}
                  source={require('./app/images/books/downloaded.png')}
                />
              }
            </View>
          </View>

        </TouchableOpacity>
      </View>
    )
  }
}
class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      do_not_find: false,
      level: 'all',
      books: [],
      books_filtered: [],
      books_loader: true,
      not_show_read: true,
      sort_new_book: true,
      show_only_loaded: false,
      open_property: false,
    };

    this.search_value = "";
  }

  async componentDidMount() {
    var not_show_read = await new Storage().get('not_show_read', 'false')
    await this.setState({ not_show_read: not_show_read === 'true' });

    var sort_new_book = await new Storage().get('sort_new_book', 'false');
    await this.setState({ sort_new_book: sort_new_book === 'true' });

    var show_only_loaded = await new Storage().get('show_only_loaded', 'false');
    await this.setState({ show_only_loaded: show_only_loaded === 'true' });

    this.getBooks();

    // this.props.stack.navigation.navigate('Reader', {
    //   book_id: 1
    // });
  }

  async getBooks() {
    await this.setState({
      books: [],
      filter_books: [],
    });

    var exists = await RNFS.exists(file_root + '/' + BOOKS_FILENAME);
    if (exists == false) {
      await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, "[]", 'utf8');
    }

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await this.setState({
      books: books,
    });

    var server_books = await new Request('/api/v1/books', {}, { do_not_show_error: true }).get();
    if (server_books == false) {
      this.filter_books();
    } else {
      if (server_books.length != books.length) {
        books = server_books;
        await RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(server_books), 'utf8');

        await this.setState({
          books: books,
        });
        this.filter_books();
      } else {
        this.filter_books();
      }
    }
  }

  //Фильтрует по Level, Названиям, Скачиванию
  async filter_books() {
    await this.setState({
      books_filtered: false,
    });

    var result = [];

    for (const i in this.state.books) {
      var book = this.state.books[i];

      if (this.state.level == 'all' || this.state.level == book.level) {

        var check = false;

        //Названия
        if (this.search_value.length == 0) {
          check = true;
        } else {
          var search_array = this.search_value.split(' ').map(name => name.toLowerCase());
          search_array = search_array.filter(word => word.length > 0);

          book.name.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });

          book.author.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });

          book.name_en.split(' ').forEach(function (subname) {
            subname = subname.toLowerCase();
            search_array.forEach(function (subsearch) {
              if (subname.includes(subsearch)) {
                check = true;
              }
            });
          });
        }

        //Скачана книга
        if (check == true) {
          var have_file = await new Storage().get('have_file_' + book.id, 'false');
          book['have_file'] = have_file == 'true';
          if (this.state.show_only_loaded == true) {
            check = book['have_file'];
          }

          var percent = await new Storage().get('percent_' + book.id, 0);
          book['percent'] = percent;

          if (percent == 100) {
            if (this.state.not_show_read == true) {
              check = false;
            }
          }
        }


        if (check == true) {
          result.push(book);
        }
      }
    }

    percents = {}
    result.forEach(function (book) {
      percents[book.id] = book.percent;
    });

    await this.props.root.setState({
      books_percents: percents
    });

    this.setState({
      books_filtered: result,
      do_not_find: result.length == 0,
    }, function () {
      this.showReview();
    });
  }

  async showReview() {

    var review_showed = await new Storage().get('review_showed', 'false');

    if (review_showed == 'false') {
      var time_show_review = await new Storage().get('time_show_review');

      if (time_show_review == undefined) {
        time_show_review = moment();
        await new Storage().set('time_show_review', moment().format());
      } else {
        time_show_review = moment(time_show_review);
      }

      var now_time = moment();

      var range_time = (now_time - time_show_review) / 1000 / 60;

      if (range_time > 7200) { //7200
        AppMetrica.reportEvent('reviewShow', { show: true });
        await new Storage().set('review_showed', 'true');
        StoreReview.requestReview();
      }
    }
  }

  goToSite() {
    Linking.openURL("https://reedle.ru");
  }

  onChangeText(value) {
    this.search_value = value;
    this.filter_books();
  }

  setLevel(level) {

    AppMetrica.reportEvent('setLevel', { level: level });

    this.setState({
      level: level,
    }, function () {
      this.filter_books();
    });
  }
  openProperty() {

    AppMetrica.reportEvent('openProperty', { show: !this.state.open_property });

    this.setState({
      open_property: !this.state.open_property,
    });
  }

  setPropertyShowRead() {

    AppMetrica.reportEvent('notShowRead', { value: !this.state.not_show_read });

    AsyncStorage.setItem('not_show_read', (!this.state.not_show_read).toString()).then(() => {
      this.setState({
        not_show_read: !this.state.not_show_read,
      }, () => {
        this.filter_books();
      });
    });


  }
  setPropertySortNewBook() {

    AppMetrica.reportEvent('sortNewBook', { value: !this.state.sort_new_book });

    AsyncStorage.setItem('sort_new_book', (!this.state.sort_new_book).toString()).then(() => {
      this.setState({
        sort_new_book: !this.state.sort_new_book,
      }, () => {
        this.filter_books();
      });
    });
  }

  setPropertyShowOnlyLoaded() {

    AppMetrica.reportEvent('showOnlyLoaded', { value: !this.state.show_only_loaded });

    AsyncStorage.setItem('show_only_loaded', (!this.state.show_only_loaded).toString()).then(() => {
      this.setState({
        show_only_loaded: !this.state.show_only_loaded,
      }, () => {
        this.filter_books();
      });
    });
  }

  render() {

    const readBook = (rowMap, rowKey) => {
      if (rowMap[rowKey.id]) {
        rowMap[rowKey.id].closeRow();
      }
      AsyncStorage.setItem('percent_' + rowKey.id, '100').then(() => {
        this.filter_books();
      });
    };

    const deleteBook = (rowMap, rowKey) => {
      if (rowMap[rowKey.id]) {
        rowMap[rowKey.id].closeRow();
      }
      AsyncStorage.setItem('have_file_' + rowKey.id, '').then(() => {
        RNFS.unlink(file_root + '/books/' + rowKey.id + '/').then(() => {
          this.filter_books();
        });
      });
    };

    return (
      <SafeAreaView style={applicationStyles.save_area_view}>
        <View style={homeStyles.header}>

          <View style={homeStyles.header_empty_block} />

          <View style={homeStyles.logo}>
            <Text style={homeStyles.logo_text}>Reedle</Text>
            <Text style={homeStyles.logo_dot}>.</Text>
          </View>

          {(this.props.root.state.has_subscription == false) ? (
            <TouchableOpacity onPress={() => this.props.tabs.navigation.navigate('Subscription')}>
              <Image style={{ width: 30, height: 30, marginTop: 2.5 }} source={require('./app/images/header/ads.jpg')} />
            </TouchableOpacity>
          ) : (
            <View style={homeStyles.header_empty_block}></View>
          )}
        </View>

        <View style={homeStyles.search}>
          <Image
            style={homeStyles.search_image}
            resizeMode={'contain'}
            source={require('./app/images/home/search.png')}
          />
          <TextInput
            style={homeStyles.search_input}
            onChangeText={(value) => this.onChangeText(value)}
            placeholder={"Поиск"}
            clearButtonMode="always"
          />
        </View>

        <View style={homeStyles.level_selector}>
          <View style={homeStyles.level_selector_wrap}>
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="Все" color="#aaa" level="all" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A1" color="#89c053" level="1" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="A2" color="#5e9cea" level="2" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B1" color="#f5b945" level="3" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="B2" color="#fb836f" level="4" current_level={this.state.level} />
            <LevelSelectorPoint onPress={(level) => this.setLevel(level)} name="C1" color="#fe4444" level="5" current_level={this.state.level} />


            <TouchableOpacity onPress={() => this.openProperty()}>
              <View style={{ backgroundColor: '#ddd', borderRadius: 7, marginLeft: 3 }}>
                {this.state.open_property == false &&
                  <Image
                    style={homeStyles.settings_image}
                    source={require('./app/images/home/settings.png')}
                  />
                }
                {this.state.open_property == true &&
                  <Image
                    style={homeStyles.settings_image}
                    source={require('./app/images/home/settings-close.png')}
                  />
                }
              </View>
            </TouchableOpacity>
          </View>
          {this.state.open_property == true &&
            <View style={homeStyles.properties}>
              <View style={homeStyles.properties_point}>

                <Text style={homeStyles.properties_point_text}>Не показывать прочитанные книги</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertyShowRead()}
                  value={this.state.not_show_read}
                />

              </View>


              <View style={homeStyles.properties_point}>

                <Text style={homeStyles.properties_point_text}>Ставить вперед открытые книги</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertySortNewBook()}
                  value={this.state.sort_new_book}
                />

              </View>

              <View style={[homeStyles.properties_point, { marginBottom: 0 }]}>

                <Text style={homeStyles.properties_point_text}>Показать только скачанные</Text>

                <Switch
                  trackColor={{ false: "#eee", true: "#407cfd" }}
                  thumbColor={'#FFF'}
                  onValueChange={() => this.setPropertyShowOnlyLoaded()}
                  value={this.state.show_only_loaded}
                />

              </View>

            </View>
          }

        </View>

        <React.Fragment>
          {this.state.do_not_find == true &&
            <View style={{ marginTop: 100 }}>
              <Text style={{ textAlign: 'center', fontSize: 20, color: '#aaa' }}>Книги не найдены :(</Text>
            </View>
          }
          {this.state.do_not_find == false &&
            <SwipeListView
              style={{ flex: 1, marginTop: -10, zIndex: 0, paddingTop: 10 }}
              refreshControl={
                <RefreshControl refreshing={false} onRefresh={() => this.getBooks()} />
              }
              showsHorizontalScrollIndicator={false}
              scrollIndicatorInsets={{ right: 1 }}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingBottom: 100 }}
              data={this.state.books_filtered}
              renderItem={(book) => <Book
                books_percents={this.props.root.state.books_percents}
                book={book}
                onPress={(book_id, color) => this.props.stack.navigation.navigate('Show', {
                  book_id: book_id,
                  color: color,
                })}
              />}
              keyExtractor={(book) => book.id}
              ListEmptyComponent={() => <PreviewBooks />}
              rightOpenValue={-130}
              disableRightSwipe={true}

              renderHiddenItem={(data, rowMap) => {

                return (
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#ddd', marginLeft: 15, marginRight: 15, }}>
                    <View style={{ zIndex: 2, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#FFF' }}>
                    </View>
                    <TouchableWithoutFeedback onPress={() => readBook(rowMap, data.item)} >
                      <View style={{ zIndex: 1, marginLeft: -10, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#75b641' }}>
                        <Text numberOfLines={1} style={{ width: 130, position: 'absolute', bottom: 37, left: -27, color: '#FFF', lineHeight: 55, textAlign: 'center', fontSize: 16, transform: [{ rotate: '-90deg' }] }}>Прочитана</Text>
                      </View>
                    </TouchableWithoutFeedback>
                    {data.item.have_file == true &&
                      <TouchableWithoutFeedback onPress={() => deleteBook(rowMap, data.item)}>
                        <View style={{ zIndex: 0, marginLeft: -10, marginTop: 5, borderTopRightRadius: 10, borderBottomRightRadius: 10, height: 130, width: 65, backgroundColor: '#f05458' }}>
                          <Text numberOfLines={1} style={{ width: 130, position: 'absolute', bottom: 37, left: -27, color: '#FFF', lineHeight: 55, textAlign: 'center', fontSize: 12, transform: [{ rotate: '-90deg' }] }}>Удалить из памяти</Text>
                        </View>
                      </TouchableWithoutFeedback>
                    }
                  </View>
                )
              }}

            />
          }
        </React.Fragment>

      </SafeAreaView>
    )
  }
}


class LevelSelectorPoint extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={() => this.props.onPress(this.props.level)} style={homeStyles.level_selector_point}>
        <View style={this.props.current_level == this.props.level && [{ backgroundColor: this.props.color }, homeStyles.level_selector_point_active]}>
          <Text style={homeStyles.level_selector_point_text}>
            <Text style={this.props.current_level == this.props.level ? { color: '#FFF' } : { color: '#000' }}>
              {this.props.name}
            </Text>
          </Text>
        </View>
      </TouchableOpacity>
    )
  }
}


function PreviewBooks() {
  return (
    <React.Fragment>
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
      <PreviewBook />
    </React.Fragment>
  );
}

function PreviewBook() {
  return (
    <React.Fragment>
      <View style={{ marginLeft: 15, marginRight: 15, paddingBottom: 15, paddingTop: 15, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <View style={{ height: 100, width: 70, marginRight: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#eee' }}>
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ borderRadius: 5, height: 25, backgroundColor: '#eee', width: '50%' }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: '#eee' }}></View>
          <View style={{ borderRadius: 5, marginTop: 12.5, height: 25, backgroundColor: '#eee', width: '70%' }}></View>
        </View>
      </View>
    </React.Fragment>
  );
}
class ChangePassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    }
  }

  resetForm(){
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id + '/update_password', {
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).put();

    await this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        await this.setState({
          success: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.success == true ? (
          <React.Fragment>
            <View style={profileStyles.thanks_form}>
              <Text style={profileStyles.thanks_form_title}>
                Информация успешно обновлена
              </Text>
              <View style={profileStyles.thanks_form_button_parent}>
                <TouchableOpacity onPress={()=>this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>
              
            </View>
          </React.Fragment>
        ): (
          <React.Fragment>
            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                {this.state.securePassword == true &&
                  <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                }
                {this.state.securePassword == false &&
                  <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                }
              </TouchableOpacity>
            </View>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>Повторите пароль</Text>
              <TextInput
                secureTextEntry={this.state.securePassword}
                onChangeText={(value) => this.setState({ repeat_password: value })}
                style={profileStyles.input}
                placeholder={"Пароль"}
              />
              <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                {this.state.securePassword == true &&
                  <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                }
                {this.state.securePassword == false &&
                  <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                }
              </TouchableOpacity>
            </View>

            {this.state.error != false &&
              <Text style={profileStyles.error_block}>{this.state.error}</Text>
            }

            <TouchableOpacity style={profileStyles.form_button} onPress={() => this.update()}>
              {this.state.button_loader == true ? (
                <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
              ) : (
                <Text style={profileStyles.form_button_text}>Обновить</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}
class UpdateProfile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: this.props.current_user.email,
      error: false,
      success: false,
    }
  }

  resetForm() {
    this.setState({
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      success: false,
    });
  }

  async update() {
    var response = await new Request('/api/v1/users/' + this.props.current_user.id, {
      email: this.state.email,
    }).put();

    await this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        await this.setState({
          success: true,
        });
      }
    }
  }

  render() {
    return (
      <React.Fragment>
        {this.state.success == true ? (
          <React.Fragment>
            <View style={profileStyles.thanks_form}>
              <Text style={profileStyles.thanks_form_title}>
                Информация успешно обновлена
              </Text>
              <View style={profileStyles.thanks_form_button_parent}>
                <TouchableOpacity onPress={() => this.resetForm()} style={profileStyles.thanks_form_button}>
                  <Text style={profileStyles.thanks_form_button_text}>Ok</Text>
                </TouchableOpacity>
              </View>

            </View>
          </React.Fragment>
        ) : (
          <React.Fragment>

            <View style={profileStyles.point_input}>
              <Text style={profileStyles.input_title}>E-mail</Text>
              <TextInput
                onChangeText={(value) => this.setState({ email: value })}
                style={profileStyles.input}
                placeholder={"E-mail"}
                value={this.state.email}
              />
            </View>

            {this.state.error != false &&
              <Text style={profileStyles.error_block}>{this.state.error}</Text>
            }

            <TouchableOpacity style={profileStyles.form_button} onPress={() => this.update()}>
              {this.state.button_loader == true ? (
                <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
              ) : (
                <Text style={profileStyles.form_button_text}>Обновить</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
      </React.Fragment>
    )
  }
}
class Auth extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      method: 'login',
      email: null,
      password: null,
      repeat_password: null,
      securePassword: true,
      error: false,
      button_loader: false,
      remember_password_thanks: false
    }
  }

  async componentDidMount() {
    if (this.props.method != undefined) {
      this.setState({
        method: this.props.method
      });
    }

    this._linkSub = Linking.addEventListener('url', async (e) => {
      let token = e.url.split('token=')[1].split('/')[0];

      let response = await new Request('/api/v1/users/by_oauth_token', {
        token: token,
      }).get();

      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        appStore.setCurrentUser(response);
        root_app.setState({
          current_user: response
        });
        await new Storage().set('current_user', JSON.stringify(response));
        root_app.checkSubscription();
      }
    });
  }

  componentWillUnmount() {
    if (this._linkSub) {
      this._linkSub.remove();
    }
  }

  changeMethod(method) {
    this.setState({
      method: method,
      button_loader: false,
      error: false,
      remember_password_thanks: false
    });
  }

  async sendForm(method) {
    if (this.state.button_loader == false) {
      await this.setState({
        button_loader: true
      });

      if (method == 'login') {
        this.login();
      }
      if (method == 'reg') {
        this.reg();
      }
      if (method == 'remember_password') {
        this.remember_password();
      }
    }
  }

  async login() {
    var response = await new Request('/api/v1/users/login', {
      email: this.state.email,
      password: this.state.password
    }).get();

    await this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        await this.setState({
          error: false
        });

        appStore.setCurrentUser(response);
        root_app.setState({
          current_user: response
        });

        await new Storage().set('current_user', JSON.stringify(response));

        root_app.checkSubscription();
      }
    }

  }

  async reg() {
    var response = await new Request('/api/v1/users/registration', {
      email: this.state.email,
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).post();

    await this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        await this.setState({
          error: false
        });

        appStore.setCurrentUser(response);
        root_app.setState({
          current_user: response
        });

        await new Storage().set('current_user', JSON.stringify(response));
      }
    }
  }

  async remember_password() {
    var response = await new Request('/api/v1/users/remember_password', {
      email: this.state.email,
      password: this.state.password,
      repeat_password: this.state.repeat_password
    }).post();

    await this.setState({
      button_loader: false
    });

    if (response == false) {
      return false;
    } else {
      if (response['error'] != undefined) {
        this.setState({
          error: response['error']
        });
      } else {
        await this.setState({
          error: false
        });

        this.setState({
          remember_password_thanks: true
        });
      }
    }
  }

  socialLink(type){
    let link;
    if(type == 'vk'){
      link = HOST+"/oauth/vk_redirect?oauth_app=true"
    }
    if(type == 'yandex'){
      link = "https://oauth.yandex.ru/authorize?response_type=code&client_id=1af05aae68ba486aa812aef9740bd74b&redirect_uri="+HOST+"/oauth_app/yandex"
    }
    if(type == 'google'){
      link = "https://accounts.google.com/o/oauth2/auth?redirect_uri="+HOST+"/oauth_app/google&response_type=code&client_id=379352911930-2neobku7ji043lh0s22ifegfgunascon.apps.googleusercontent.com&scope=https://www.googleapis.com/auth/userinfo.email"
    }

    Linking.openURL(link);
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view} >
        <ScrollView>
          {this.props.modal == true &&
            <View style={{ height: 35, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => this.props.close()} style={{ width: 35, height: 35, backgroundColor: '#ddd', borderRadius: 7, margin: 10 }}>
                <Image
                  style={{ height: 20, width: 20, margin: 7.5 }}
                  source={require('./app/images/header/right-menu-close.png')}
                />
              </TouchableOpacity>
            </View>
          }

          <View style={profileStyles.content}>
            {this.props.bookmark_info != undefined &&
              <React.Fragment>
                <Text style={bookmarksStyles.auth_into}>
                  Для того чтобы воспользоваться закладками или словарем,
                  необходимо
                  <Text style={{ color: '#f05458' }}> авторизоваться </Text>
                  или
                  <Text style={{ color: '#f05458' }}> зарегистрироваться</Text>
                </Text>
              </React.Fragment>
            }

            {this.state.method == 'login' &&
              <Text style={profileStyles.title}>Вход</Text>
            }
            {this.state.method == 'reg' &&
              <Text style={profileStyles.title}>Регистрация</Text>
            }
            {this.state.method == 'remember_password' &&
              <Text style={profileStyles.title}>Восстановить пароль</Text>
            }

            <View style={profileStyles.authorization_form_tabs}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => this.changeMethod('login')} style={[
                  profileStyles.authorization_form_tab,
                  this.state.method == 'login' ? { backgroundColor: app_theme_colors.backgroundDarkLight } : null
                ]}>
                  <Text style={profileStyles.authorization_form_tab_text}>Вход</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.changeMethod('reg')} style={[
                  profileStyles.authorization_form_tab,
                  this.state.method == 'reg' ? { backgroundColor: app_theme_colors.backgroundDarkLight } : null
                ]}>
                  <Text style={profileStyles.authorization_form_tab_text}>Регистрация</Text>
                </TouchableOpacity>
              </View>
            </View>

            {this.state.remember_password_thanks ? (
              <View style={profileStyles.remember_password_thanks}>
                <Text style={profileStyles.remember_password_thanks_text}>Новый пароль отправлен на почту</Text>
              </View>
            ) : (
              <React.Fragment>
                {this.state.method == 'remember_password' &&
                  <Text style={profileStyles.remember_password_info}>Новый пароль придет на почту</Text>
                }

                <View style={profileStyles.point_input}>
                  <Text style={profileStyles.input_title}>E-mail</Text>
                  <TextInput
                    onChangeText={(value) => this.setState({ email: value })}
                    style={profileStyles.input}
                    placeholder={"E-mail"}
                  />
                </View>

                {(this.state.method == 'login' || this.state.method == 'reg') &&
                  <View style={profileStyles.point_input}>
                    <Text style={profileStyles.input_title}>Пароль</Text>
                    <TextInput
                      secureTextEntry={this.state.securePassword}
                      onChangeText={(value) => this.setState({ password: value })}
                      style={profileStyles.input}
                      placeholder={"Пароль"}
                    />
                    <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                      {this.state.securePassword == true &&
                        <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                      }
                      {this.state.securePassword == false &&
                        <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                      }
                    </TouchableOpacity>
                  </View>
                }

                {this.state.method == 'reg' &&
                  <View style={profileStyles.point_input}>
                    <Text style={profileStyles.input_title}>Повторите пароль</Text>
                    <TextInput
                      secureTextEntry={this.state.securePassword}
                      onChangeText={(value) => this.setState({ repeat_password: value })}
                      style={profileStyles.input}
                      placeholder={"Пароль"}
                    />
                    <TouchableOpacity onPress={() => this.setState({ securePassword: !this.state.securePassword })} style={profileStyles.button_password_hide}>
                      {this.state.securePassword == true &&
                        <Image source={require('./app/images/profile/auth/password_hide.png')} style={profileStyles.password_hide_image} />
                      }
                      {this.state.securePassword == false &&
                        <Image source={require('./app/images/profile/auth/password_show.png')} style={profileStyles.password_hide_image} />
                      }
                    </TouchableOpacity>
                  </View>
                }

                {this.state.error != false &&
                  <Text style={profileStyles.error_block}>{this.state.error}</Text>
                }

                <TouchableOpacity onPress={() => this.sendForm(this.state.method)} style={profileStyles.form_button}>
                  {this.state.button_loader == true &&
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  }

                  {this.state.button_loader == false &&
                    <React.Fragment>
                      {this.state.method == 'login' &&
                        <Text style={profileStyles.form_button_text}>Вход</Text>
                      }
                      {this.state.method == 'reg' &&
                        <Text style={profileStyles.form_button_text}>Регистрация</Text>
                      }
                      {this.state.method == 'remember_password' &&
                        <Text style={profileStyles.form_button_text}>Отправить</Text>
                      }
                    </React.Fragment>
                  }
                </TouchableOpacity>

                {this.state.method == 'login' &&
                  <TouchableOpacity onPress={() => this.changeMethod('remember_password')} style={profileStyles.button_remember_password}>
                    <Text style={profileStyles.remember_password_text}>Забыли пароль?</Text>
                  </TouchableOpacity>
                }

                <Text style={{ textAlign: 'center', marginTop: 24 }}>
                  Войти через соц. сети
                </Text>
                <View style={{ flex: 1, justifyContent: 'center', flexDirection: 'row', marginTop: 16 }}>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#0077FF', borderRadius: 4, justifyContent: 'center', alignItems: 'center' }} onPress={()=>this.socialLink('vk')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/vk.png')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#f9d657', borderRadius: 4, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }}  onPress={()=>this.socialLink('yandex')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/ya.png')} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 40, height: 40, backgroundColor: '#df432f', borderRadius: 4, marginLeft: 16, justifyContent: 'center', alignItems: 'center' }}  onPress={()=>this.socialLink('google')}>
                    <Image style={{ width: 24, height: 24 }} source={require('./app/images/profile/auth/socials/google.png')} />
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            )}

            <View style={{ height: 100 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

class Profile extends React.Component {
  async log_out() {
    await new Storage().remove('current_user');
    await new Storage().set('has_subscription', 'false');

    this.props.root.setState({
      current_user: false,
      has_subscription: false
    });
  }

  render() {
    return (
      <SafeAreaView style={applicationStyles.save_area_view} >
        {this.props.root.state.current_user == false ? (
          <Auth />
        ) : (
          <ScrollView>
            <View style={profileStyles.content}>
              <Text style={[profileStyles.title, { marginTop: 15 }]}>Основная информация</Text>
              <UpdateProfile current_user={this.props.root.state.current_user} />

              <Text style={profileStyles.title}>Смена пароля</Text>
              <ChangePassword current_user={this.props.root.state.current_user} />

              <Text style={profileStyles.title}>Выход из аккаунта</Text>
              <TouchableOpacity style={profileStyles.log_out_button} onPress={() => this.log_out()}>
                <Text style={profileStyles.log_out_text}>Выход</Text>
              </TouchableOpacity>

              <Text style={profileStyles.title}>Удалить аккаунт</Text>

              <Text style={{ marginTop: 15, marginBottom: 15 }}>Для того, чтобы полностью удалить аккаунт, перейдите по ссылке ниже: </Text>

              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/profile/delete")}>
                <Text style={{ color: app_theme_colors.red }}>Удаление аккаунта</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    )
  }
}
class ModalFastLearning extends React.Component {
  render(){
    return(
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: '#FFF', padding: 15 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Быстрое обучение</Text>

              <Text style={{ marginTop: 15 }}>
                Нажмите на любое подчеркнутое слово, чтобы посмотреть его перевод.
              </Text>

              <Text style={{ marginTop: 15 }}>А также:</Text>

              <View style={{ flexDirection: 'row', marginTop: 10 }}>

                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('./app/images/reader/sentence-translate.png')}
                />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод предложения.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <Image
                  style={{ width: 20, height: 20 }}
                  source={require('./app/images/reader/paragraph-translate.png')}
                />
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - перевод абзаца.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 15 }}>

                <View style={{ width: 20, height: 20 }}>
                  <Text style={{ textAlign: 'center', lineHeight: 20, fontSize: 18, fontFamily: 'Times', color: '#f05458' }}>15</Text>
                </View>
                <Text style={{ lineHeight: 20, marginLeft: 10 }}>
                  - цифру в левой части, чтобы отметить где вы остановились.
                </Text>
              </View>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

      </Modal>
    )
  }
}
class ModalNoAd extends React.Component {
  render(){
    return(
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}>

        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: '#FFF', padding: 15 }}>


              <Text>
                В данный момент рекламный блок для вашего устройства не найден.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Реклама будет показана в следующий раз.
              </Text>

              <TouchableOpacity onPress={() => this.props.close()} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Понятно</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

      </Modal>
    )
  }
}
const ModalTranslateSentence = observer(class ModalTranslateSentence extends React.Component {
  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <TouchableWithoutFeedback>
            <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
              <View style={{
                backgroundColor: readerStore.backgroundColorTheme,
                borderRadius: 10,
                alignItems: "center",
                width: "90%",
                shadowRadius: 4,
                overflow: 'hidden',
                elevation: 5
              }}>
                <ScrollView style={{ maxHeight: Dimensions.get('window').height - 300 }}>

                  <TouchableOpacity activeOpacity={1}>
                    {this.props.translate.constructor === Array &&
                      <View style={{ margin: 10 }}>
                        {this.props.translate.map((sentence, index) =>
                          <View key={index} style={{ marginTop: 5, flexDirection: "row" }}>
                            <View style={{ width: 20 }}>
                              <Text style={{ fontSize: 18, fontFamily: 'Times', color: '#bbb' }}>{(index + 1)}</Text>
                            </View>
                            <View style={{ width: Dimensions.get('window').width * 0.9 - 40 }}>
                              <Text style={{ color: readerStore.textColorTheme }}>{sentence}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    }

                    {this.props.translate.constructor != Array &&
                      <Text style={{ padding: 10, color: readerStore.textColorTheme }}>
                        {this.props.translate}
                      </Text>
                    }
                  </TouchableOpacity>

                </ScrollView>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 10, marginTop: 15, height: 40, backgroundColor: '#f05458', width: Dimensions.get('window').width * 0.9 - 20, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>

              {this.props.has_subscription == false &&
                <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {adSizeMini && (
                    <BannerView
                      size={adSizeMini}
                      adRequest={{ adUnitId: AD_UNIT_BANNER }}
                    />
                  )}
                </View>
              }
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>

      </Modal>
    )
  }
});
const ModalTranslateWord = observer(class ModalTranslateWord extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      voiceover_playing: false,
      count_voiceover: 0,
      count_words: 0,
      words: [],
      show_limits_information: false
    }

    // Animated value для пульсирования иконки озвучки слова
    this.scaleAnim = new Animated.Value(1);
  }

  async componentDidMount() {
    if (!this.props.has_subscription) {
      this.check_count_voiceover();
    }

    var words = await new Storage().get('words_keys', '[]');
    words = JSON.parse(words);

    this.setState({
      count_words: words.length
    });
  }

  async check_count_voiceover() {
    var date_today = moment().format("YYYY-MM-DD");
    var count_voiceover_hash = await new Storage().get('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    count_voiceover_hash = JSON.parse(count_voiceover_hash);

    if (count_voiceover_hash['date'] != date_today) {
      count_voiceover_hash['count'] = 0;
      count_voiceover_hash['words'] = [];

      new Storage().set('count_voiceover', JSON.stringify({ date: date_today, count: 0, words: [] }));
    }

    this.setState({
      count_voiceover: count_voiceover_hash['count'],
      words: count_voiceover_hash['words']
    });
  }

  startPulseAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  stopPulseAnimation() {
    this.scaleAnim.setValue(1);
  }

  async voice_word(original) {
    AppMetrica.reportEvent('Voiceover', {
      original: original
    });

    this.setState({
      voiceover_playing: true
    });
    this.startPulseAnimation();

    var pesponse = await new Request('/api/v1/books/voiceover_url_by_word', { original: original }, { do_not_show_error: true }).get();

    url = HOST + pesponse.url;

    if (url == null) {
      Alert.alert('Озвучка не найдена');
      this.setState({
        voiceover_playing: false
      });
      this.stopPulseAnimation();
    } else {
      const sound = new Sound(url, '', error => {
        if (error) {
          appStore.showError('Ошибка воспроизвездения');
          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
        }

        sound.play((success) => {
          if (success) {
            if (!this.state.words.includes(original)) {
              var new_words = this.state.words;
              new_words.push(original);
              var new_count = this.state.count_voiceover + 1;

              new Storage().set('count_voiceover', JSON.stringify(
                {
                  date: moment().format("YYYY-MM-DD"),
                  count: new_count,
                  words: new_words
                }
              ));

              this.setState({
                count_voiceover: new_count,
                words: new_words
              });
            }
          }

          this.setState({
            voiceover_playing: false
          });
          this.stopPulseAnimation();
        });
      })
    }
  }

  async addWordToDictionary() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addWordToDictionary', { word: this.props.original });

      var add_to_server = await new Request('/api/v1/dictionary/words', {
        original: this.props.original,
        user_id: this.props.current_user.id
      }, {
        desciption_error: 'Слово добавлено только на этом устройстве.'
      }).post();

      await new Storage().set('word_' + this.props.original, JSON.stringify({
        original: this.props.original,
        transcription: this.props.transcription,
        translate: this.props.translate,
        offline: add_to_server == false
      }));
      await this.addWordToKeys('word_' + this.props.original);

      this.props.setWordInDictionary(true);

      this.setState({
        count_words: this.state.count_words + 1
      });
    }
  }


  async addWordToKeys(value) {
    words_keys = await new Storage().get('words_keys');
    if (words_keys == undefined) {
      words_keys = []
    } else {
      words_keys = JSON.parse(words_keys);

      var index = words_keys.indexOf(value);
      if (index > -1) {
        words_keys.splice(index, 1);
      }
    }

    words_keys.unshift(value);

    new Storage().set('words_keys', JSON.stringify(words_keys));
  }

  async deleteWordFromDictionary() {
    this.props.setWordInDictionary(false);

    this.deleteBookmarkKey('word_' + this.props.original);

    this.setState({
      count_words: this.state.count_words - 1
    });

    new Storage().remove('word_' + this.props.original);

    await new Request('/api/v1/dictionary/words', {
      original: this.props.original,
      user_id: this.props.current_user.id
    }, {
      desciption_error: 'Слово удалено только с этого устройства.'
    }).delete();
  }

  async deleteBookmarkKey(value) {
    words_keys = await new Storage().get('words_keys');
    words_keys = JSON.parse(words_keys);

    var index = words_keys.indexOf(value);
    if (index > -1) {
      words_keys.splice(index, 1);
    }

    new Storage().set('words_keys', JSON.stringify(words_keys));
  }


  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.props.visible}
      >
        <TouchableOpacity activeOpacity={1} style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={() => this.props.close()}>
          <TouchableWithoutFeedback>
            <View style={{ flex: 1, width: '100%', justifyContent: "center", alignItems: "center" }}>
              <View style={{
                margin: 20,
                backgroundColor: readerStore.backgroundColorTheme,
                borderRadius: 10,
                alignItems: "center",
                width: 250,
                shadowRadius: 4,
                overflow: 'hidden',
                elevation: 5
              }}>
                {appStore.has_internet ? (
                  <React.Fragment>
                    <React.Fragment>
                      {this.state.count_voiceover < 15 ? (
                        <TouchableWithoutFeedback onPress={() => this.voice_word(this.props.original)}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Animated.Image
                              style={[
                                { width: 24, height: 24 },
                                this.state.voiceover_playing && {
                                  transform: [{ scale: this.scaleAnim }]
                                }
                              ]}
                              source={this.state.voiceover_playing ? require('./app/images/reader/voiceover-active.png') : require('./app/images/reader/voiceover.png')}
                            />
                            {!this.props.has_subscription &&
                              <View style={{ marginTop: 5, width: 24 }}>
                                <Text style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>
                                  {15 - this.state.count_voiceover}/15
                                </Text>
                              </View>
                            }
                          </View>
                        </TouchableWithoutFeedback>
                      ) : (
                        <TouchableWithoutFeedback onPress={() => Alert.alert('Лимт на сегодня закончился.\nОплатите подписку, чтобы пользоваться озвучкой без ограничений\nБесплатно доступно 15 слов в день.')}>
                          <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                            <Image style={{ width: 24, height: 24 }}
                              source={require('./app/images/reader/voiceover-limited.png')} />
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </React.Fragment>
                  </React.Fragment>
                ) : (
                  <TouchableWithoutFeedback onPress={() => Alert.alert('Нет подключения к интернету!')}>
                    <View style={{ position: 'absolute', left: 10, top: 10, width: 48, height: 34 }}>
                      <Image style={{ width: 24, height: 24 }}
                        source={require('./app/images/reader/voiceover-limited.png')} />
                    </View>
                  </TouchableWithoutFeedback>
                )}

                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: '#f05458', fontSize: 19 }}>{this.props.original}</Text>
                </View>
                {this.props.transcription != null &&
                  <View style={{ marginTop: 5 }}>
                    <Text style={{ color: '#aaa' }}>[{this.props.transcription}]</Text>
                  </View>
                }
                <View style={{ paddingLeft: 10, paddingRight: 10, marginTop: 10 }}>
                  <Text style={{ color: readerStore.textColorTheme, textAlign: 'center' }}>{this.props.translate}</Text>
                </View>
                <TouchableWithoutFeedback onPress={() => this.props.close()}>
                  <View style={{ margin: 10, marginTop: 15, height: 40, backgroundColor: '#f05458', width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                    <Text style={{ color: '#FFF', lineHeight: 40, textAlign: 'center' }}>Понятно</Text>
                  </View>
                </TouchableWithoutFeedback>

                {this.props.word_in_dictionary ? (
                  <React.Fragment>
                    <View style={{ width: 230, backgroundColor: '#eee', borderRadius: 5, marginBottom: 5 }}>
                      <Text style={{ fontSize: 14, textAlign: 'center', marginTop: 5, marginBottom: 5 }}>
                        Слово добавлено в словарь
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => this.deleteWordFromDictionary()}>
                      <View style={{ borderWidth: 1, borderColor: '#ddd', margin: 10, marginTop: 0, height: 32, width: 230, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                        <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Удалить из словаря</Text>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <View style={{ flexDirection: 'row', height: 32, width: 230, margin: 10, marginTop: 10, alignItems: 'center' }}>
                      {(this.state.count_words < 30 || this.props.has_subscription) ? (
                        <TouchableOpacity onPress={() => this.addWordToDictionary()}>
                          <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, borderWidth: 1, borderColor: '#ddd', height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                            <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Добавить в словарь</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View style={{ flex: 1, width: this.props.has_subscription ? 230 : 198, height: 32, flexDirection: 'column', justifyContent: 'center', borderRadius: 5 }}>
                          <Text style={{ color: '#444', lineHeight: 30, textAlign: 'center' }}>Вы исчерпали лимит</Text>
                        </View>
                      )}
                      {this.props.has_subscription == false &&
                        <TouchableOpacity onPress={() => this.setState({ show_limits_information: !this.state.show_limits_information })}>
                          <View style={{ width: 24, height: 24, margin: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, overflow: 'hidden' }}>
                            {this.state.show_limits_information ? (
                              <Image style={{ width: 22, height: 22 }} source={require('./app/images/books/dictionary_info_close.png')} />
                            ) : (
                              <Image style={{ width: 22, height: 22 }} source={require('./app/images/books/dictionary_info.png')} />
                            )}
                          </View>
                        </TouchableOpacity>
                      }
                    </View>

                    {this.state.show_limits_information &&
                      <View style={{ margin: 10, marginTop: 0 }}>
                        <View><Text style={{ textAlign: 'center', fontSize: 12 }}>Без PRO-доступа вы можете</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>добавить до 30 слов</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>и озвучить до 15 слов в день</Text></View>

                        <View><Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12 }}>Вы добавили {this.state.count_words}/30</Text></View>
                        <View><Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12 }}>Вы озвучили {this.state.count_voiceover}/15</Text></View>

                        <TouchableOpacity onPress={() => this.props.openSubscription()}>
                          <Text style={{ color: '#f05458', fontSize: 12, marginTop: 4, textAlign: 'center', }}>Приобрести PRO-доступ</Text>
                        </TouchableOpacity>
                      </View>
                    }
                  </React.Fragment>
                )}

              </View>

              {this.props.has_subscription == false &&
                <View style={{ position: 'absolute', left: 0, bottom: 0, width: Dimensions.get('window').width, height: 50, backgroundColor: '#000', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  {adSizeMini && (
                    <BannerView
                      size={adSizeMini}
                      adRequest={{ adUnitId: AD_UNIT_BANNER }}
                    />
                  )}
                </View>
              }
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal >
    )
  }
});
const Paragraph = observer(class Paragraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sentences: false,
      paragraph_translate: [],
    }

    // Animated value для пульсирования иконки озвучки
    this.scaleAnim = new Animated.Value(1);
  }

  isSpeaking(sentenceIndex) {
    var cur = readerStore.currentSpeaking;
    return cur && cur.p === this.props.data['name'] && cur.i === sentenceIndex;
  }

  startPulseAnimation() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.scaleAnim, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  stopPulseAnimation() {
    this.scaleAnim.setValue(1);
  }

  speakSentence(sentence, sentenceIndex) {
    var text = (sentence['b'] || []).map(function (b) { return b['v'] || ''; }).join('');
    if (!text || !text.trim()) return;

    // Если нажали на уже играющее предложение — остановить
    if (this.isSpeaking(sentenceIndex)) {
      Speech.stop();
      readerStore.setCurrentSpeaking(null);
      this.stopPulseAnimation();
      return;
    }

    // Остановить текущую озвучку и запустить новую.
    Speech.stop();
    readerStore.setCurrentSpeaking({ p: this.props.data['name'], i: sentenceIndex });
    this.startPulseAnimation();

    var applyAndSpeak = function () {
      try { Speech.speak(text.trim()); } catch (e) {}
    };

    // configure вызываем ОДИН РАЗ на голос — при смене или первом запуске.
    if (readerStore.ttsVoice && !readerStore.ttsVoiceApplied) {
      try {
        Speech.configure({ voiceId: readerStore.ttsVoice });
        readerStore.setTtsVoiceApplied(true);
      } catch (e) {}
      applyAndSpeak();
    } else {
      applyAndSpeak();
    }
  }

  async componentDidMount() {
    this._ttsFinish = Speech.onFinish(() => {
      readerStore.setCurrentSpeaking(null);
    });
    var paragraph_translate = [];
    for (const s in this.props.data['sentences']) {
      paragraph_translate.push(this.props.data['sentences'][s]['tr']);
    }

    this.setState({
      sentences: this.props.data['sentences'],
      paragraph_translate: paragraph_translate,
    });
  }

  componentWillUnmount() {
    if (this._ttsFinish) this._ttsFinish.remove();
  }

  async addBookmark() {
    if (this.props.current_user == false) {
      this.props.openAuthModal();
    } else {
      AppMetrica.reportEvent('addBookmark', { bookmark: 'bookmark_' + this.props.book_id + '_' + this.props.data['name'] });

      if (readerStore.bookmark == this.props.data['name']) {
        this.props.setBookmark(false);

        this.deleteBookmarkKey('bookmark_' + this.props.book_id);

        new Storage().remove('bookmark_' + this.props.book_id);

        await new Request('/api/v1/bookmarks', {
          book_id: this.props.book_id,
          user_id: this.props.current_user.id
        }, {
          desciption_error: 'Закладка удалена только с этого устройства.'
        }).delete();
      } else {
        var add_to_server = await new Request('/api/v1/bookmarks', {
          book_id: this.props.book_id,
          user_id: this.props.current_user.id,
          page: this.props.page,
          paragraph: this.props.data['name']
        }, {
          desciption_error: 'Закладка добавлена только на этом устройстве.'
        }).post();

        await new Storage().set('bookmark_' + this.props.book_id, JSON.stringify({
          book_id: this.props.book_id,
          book_name: this.props.book_name,
          page: this.props.page,
          paragraph: this.props.data['name'],
          offline: add_to_server == false
        }));
        await this.addBookmarkToKeys('bookmark_' + this.props.book_id);

        await this.props.setBookmark(this.props.data['name']);
      }

    }
  }

  async addBookmarkToKeys(value) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    if (bookmarks_keys == undefined) {
      bookmarks_keys = []
    } else {
      bookmarks_keys = JSON.parse(bookmarks_keys);

      var index = bookmarks_keys.indexOf(value);
      if (index > -1) {
        bookmarks_keys.splice(index, 1);
      }
    }

    bookmarks_keys.unshift(value);

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  async deleteBookmarkKey(value) {
    bookmarks_keys = await new Storage().get('bookmarks_keys');
    bookmarks_keys = JSON.parse(bookmarks_keys);

    var index = bookmarks_keys.indexOf(value);
    if (index > -1) {
      bookmarks_keys.splice(index, 1);
    }

    new Storage().set('bookmarks_keys', JSON.stringify(bookmarks_keys));
  }

  translateWord(word_id) {
    word_id = parseInt(word_id);

    var word = readerStore.list_words[word_id];

    AppMetrica.reportEvent('translateWord', { word: word });

    var transcription = word.ts;

    if (word != undefined) {
      if (word.ts != null) {
        if (word.ts.length == 0) {
          transcription = null;
        }
      }

      this.props.openTranslateWord(
        word.o,
        word.tr,
        transcription,
      );
    }
  }

  translateText(translate) {
    AppMetrica.reportEvent('translateText', { platform: Platform.OS });

    this.props.openTranslateSentence(translate);
  }

  render() {

    return (

      <React.Fragment>
        {(readerStore.page == 1 && this.props.data['name'] == 1) &&
          <View style={readerScreenStyles.bookTitle}>
            <Text style={[readerScreenStyles.bookTitleText, { color: readerStore.textColorTheme }]}>{this.props.book_name_en}</Text>
          </View>
        }
        <View style={readerScreenStyles.paragraphRow}>
          <TouchableOpacity onPress={() => this.addBookmark(this.props.data['name'])} style={readerScreenStyles.bookmarkButton}>
            <Text style={[readerScreenStyles.bookmarkNumber, { color: readerStore.secondColorTheme }, (readerStore.bookmark == this.props.data['name']) && readerScreenStyles.bookmarkNumberActive]}>{this.props.data['name']}</Text>
            {readerStore.bookmark == this.props.data['name'] ? (
              <Image
                style={readerScreenStyles.bookmarkImage}
                source={require('./app/images/reader/bookmark-active.png')}
              />
            ) : (
              <Image
                style={readerScreenStyles.bookmarkImage}
                source={require('./app/images/reader/bookmark.png')}
              />
            )}

          </TouchableOpacity>
          <View style={[readerScreenStyles.sentencesContainer, { justifyContent: readerStore.textAlign }]}>
            <View style={readerScreenStyles.sentenceIndent}></View>
            {this.props.data['sentences'].map((sentence, index) =>
              <React.Fragment key={index}>
                {appStore.has_internet ? (
                  <TouchableOpacity onPress={() => this.speakSentence(sentence, index)} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Animated.Image
                      style={[
                        { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size },
                        this.isSpeaking(index) && {
                          tintColor: '#f05458',
                          transform: [{ scale: this.scaleAnim }]
                        }
                      ]}
                      source={require('./app/images/reader/voiceover.png')}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => Alert.alert('Нет подключения к интернету!')} style={readerScreenStyles.speakButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Image
                      style={{ width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }}
                      source={require('./app/images/reader/voiceover-limited.png')}
                    />
                  </TouchableOpacity>
                )}
                {sentence['b'].map((block, index) => {

                  var past_value = "";
                  if (sentence['b'][index - 1] != undefined) {
                    past_value = sentence['b'][index - 1]['v'];
                  }

                  return (
                    <React.Fragment key={index} >
                      {block['w'] != undefined &&
                        <TouchableWithoutFeedback onPress={() => this.translateWord(block['w'])}>
                          <View style={[past_value != '"' && past_value != "'" ? readerScreenStyles.wordBlockWithMargin : readerScreenStyles.wordBlock, { borderBottomColor: readerStore.secondColorTheme }]}>
                            <Text style={{ fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }}>{block['v']}</Text>
                          </View>
                        </TouchableWithoutFeedback>
                      }
                      {block['w'] == undefined &&
                        <Text style={[readerScreenStyles.punctuation, { fontSize: readerStore.fontSize, fontFamily: readerStore.fontFamily, color: readerStore.textColorTheme }]}>{block['v']}</Text>
                      }
                    </React.Fragment>
                  );
                }
                )}

                {this.props.data['sentences'].length > 1 &&
                  <TouchableWithoutFeedback onPress={() => this.translateText(sentence['tr'])}>
                    <Image
                      style={[readerScreenStyles.translateIcon, { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }]}
                      source={require('./app/images/reader/sentence-translate.png')}
                    />
                  </TouchableWithoutFeedback>
                }

              </React.Fragment>
            )}


            <TouchableWithoutFeedback onPress={() => this.translateText(this.state.paragraph_translate)}>
              <Image
                style={[readerScreenStyles.translateIcon, { width: readerStore.translate_icon_size, height: readerStore.translate_icon_size }]}
                source={require('./app/images/reader/paragraph-translate.png')}
              />
            </TouchableWithoutFeedback>


          </View>
        </View>
      </React.Fragment>
    );
  }
});
class ReaderSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      voices: [],
    };
  }

  componentDidMount() {
    Speech.getAvailableVoices().then((voices) => {
      var englishVoices = voices.filter(v =>
        v.language &&
        v.language.toLowerCase().startsWith('en')
      );
      // Сортируем по алфавиту отображаемого названия ("Австралия — ...", "Британия — ...", "США — ...").
      var self = this;
      englishVoices.sort(function (a, b) {
        return self.getVoiceLabel(a).localeCompare(self.getVoiceLabel(b), 'ru');
      });
      this.setState({ voices: englishVoices });
    }).catch(() => {});
  }

  getVoiceLabel(voice, index) {
    // Просто возвращаем "Голос N" где N — это порядковый номер (индекс + 1)
    return `Голос ${index + 1}`;
  }

  render(){
    return(
      <Modal
        visible={this.props.visible == true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => (this.props.closeSettings && this.props.closeSettings())}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' }}
          onPress={() => (this.props.closeSettings && this.props.closeSettings())}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={{
                width: 212,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#ddd',
                position: 'absolute',
                right: 10,
                top: 45,
                backgroundColor: '#fff',
                overflow: 'hidden',
              }}
            >
                <View style={{ flexDirection: 'row', borderBottomColor: '#ddd', borderBottomWidth: 1 }}>
                  <View style={{ borderRightWidth: 1, borderRightColor: '#ddd' }}>
                    {this.props.fontSize <= 14 &&
                      <View style={{ flex: 1, opacity: 0.3 }}>
                        <Image
                          style={{ width: 70, height: 50 }}
                          source={require('./app/images/reader/fontSizeLess.png')}
                        />
                      </View>
                    }
                    {this.props.fontSize > 14 &&
                      <TouchableOpacity onPress={() => this.props.changeFontSize('less')} style={{ flex: 1 }}>
                        <Image
                          style={{ width: 70, height: 50 }}
                          source={require('./app/images/reader/fontSizeLess.png')}
                        />
                      </TouchableOpacity>
                    }
                  </View>
                  <View pointerEvents="none" style={{ position: 'absolute', height: 25, width: 30, left: 55, top: 12.5, borderRadius: 5, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#FFF' }}>
                    <Text style={{ fontSize: 13, color: '#aaa', lineHeight: 24, textAlign: 'center' }}>{this.props.fontSize}</Text>
                  </View>
                  <View style={{ borderRightWidth: 1, borderRightColor: '#ddd' }}>
                    {this.props.fontSize >= 24 &&
                      <View style={{ flex: 1, opacity: 0.3 }}>
                        <Image
                          style={{ width: 70, height: 50 }}
                          source={require('./app/images/reader/fontSizeMore.png')}
                        />
                      </View>
                    }
                    {this.props.fontSize < 24 &&
                      <TouchableOpacity onPress={() => this.props.changeFontSize('more')} style={{ flex: 1 }}>
                        <Image
                          style={{ width: 70, height: 50 }}
                          source={require('./app/images/reader/fontSizeMore.png')}
                        />
                      </TouchableOpacity>
                    }
                  </View>
                  <TouchableOpacity onPress={() => this.props.textAlignChange()}>
                    {this.props.textAlign == 'flex-start' &&
                      <Image
                        style={{ width: 70, height: 50 }}
                        source={require('./app/images/reader/align/left.png')}
                      />
                    }
                    {this.props.textAlign == 'flex-end' &&
                      <Image
                        style={{ width: 70, height: 50 }}
                        source={require('./app/images/reader/align/right.png')}
                      />
                    }
                    {this.props.textAlign == 'center' &&
                      <Image
                        style={{ width: 70, height: 50 }}
                        source={require('./app/images/reader/align/center.png')}
                      />
                    }
                    {this.props.textAlign == 'space-evenly' &&
                      <Image
                        style={{ width: 70, height: 50 }}
                        source={require('./app/images/reader/align/justify.png')}
                      />
                    }
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', borderBottomColor: '#ddd', borderBottomWidth: 1, paddingTop: 15, paddingBottom: 15 }}>
                  <TouchableOpacity onPress={() => this.props.changeColorTheme('#ffffff', '#000000', '#dddddd')} style={{ width: 30, height: 30, marginLeft: 5, marginRight: 5, borderWidth: 1, borderColor: '#c6c4c1', borderRadius: 20, backgroundColor: '#ffffff' }}>
                    {this.props.backgroundColorTheme == '#ffffff' &&
                      <Image
                        style={{ width: 13, height: 13, marginTop: 8, marginLeft: 7 }}
                        source={require('./app/images/reader/check_black.png')}
                      />
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.props.changeColorTheme('#eeeeee', '#000000', '#cccccc')} style={{ width: 30, height: 30, marginLeft: 5, marginRight: 5, borderWidth: 1, borderColor: '#c6c4c1', borderRadius: 20, backgroundColor: '#eeeeee' }}>
                    {this.props.backgroundColorTheme == '#eeeeee' &&
                      <Image
                        style={{ width: 13, height: 13, marginTop: 8, marginLeft: 7 }}
                        source={require('./app/images/reader/check_black.png')}
                      />
                    }
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => this.props.changeColorTheme('#f8f4e9', '#000000', '#d4c8a0')} style={{ width: 30, height: 30, marginLeft: 5, marginRight: 5, borderWidth: 1, borderColor: '#c6c4c1', borderRadius: 20, backgroundColor: '#f6f0e3' }}>
                    {this.props.backgroundColorTheme == '#f8f4e9' &&
                      <Image
                        style={{ width: 13, height: 13, marginTop: 8, marginLeft: 7 }}
                        source={require('./app/images/reader/check_black.png')}
                      />
                    }
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => this.props.changeColorTheme('#292c2c', '#ffffff', '#5a5d5d')} style={{ width: 30, height: 30, marginLeft: 5, marginRight: 5, borderWidth: 1, borderColor: '#292c2c', borderRadius: 20, backgroundColor: '#000000' }}>
                    {this.props.backgroundColorTheme == '#292c2c' &&
                      <Image
                        style={{ width: 13, height: 13, marginTop: 8, marginLeft: 7 }}
                        source={require('./app/images/reader/check_white.png')}
                      />
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.props.changeColorTheme('#000000', '#ffffff', '#444')} style={{ width: 30, height: 30, marginLeft: 5, marginRight: 5, borderWidth: 1, borderColor: '#000000', borderRadius: 20, backgroundColor: '#000000' }}>
                    {this.props.backgroundColorTheme == '#000000' &&
                      <Image
                        style={{ width: 13, height: 13, marginTop: 8, marginLeft: 7 }}
                        source={require('./app/images/reader/check_white.png')}
                      />
                    }
                  </TouchableOpacity>
                </View>

                <View style={{ padding: 10 }}>
                  <Text style={{ fontSize: 16, marginBottom: 10 }}>
                    Шрифт текста:
                  </Text>
                  <TouchableOpacity onPress={() => this.props.chanageFontFamily('LibreBaskerville-Regular')}
                    style={[(this.props.fontFamily == "LibreBaskerville-Regular") ? { padding: 7, paddingLeft: 10, paddingRight: 10, backgroundColor: '#ddd', borderRadius: 5 } : { padding: 7, paddingLeft: 10, paddingRight: 10 }]}>
                    <Text style={{ fontSize: 16, fontFamily: 'LibreBaskerville-Regular' }}>
                      Libre Baskerville
                    </Text>

                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.props.chanageFontFamily('Times')}
                    style={[(this.props.fontFamily == "Times") ? { padding: 7, paddingLeft: 10, paddingRight: 10, backgroundColor: '#ddd', borderRadius: 5 } : { padding: 7, paddingLeft: 10, paddingRight: 10 }]}>
                    <Text style={{ fontSize: 16, fontFamily: 'Times' }}>
                      Times
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.props.chanageFontFamily('Arial')}
                    style={[(this.props.fontFamily == "Arial") ? { padding: 7, paddingLeft: 10, paddingRight: 10, backgroundColor: '#ddd', borderRadius: 5 } : { padding: 7, paddingLeft: 10, paddingRight: 10 }]}>
                    <Text style={{ fontSize: 16, fontFamily: 'Arial' }}>
                      Arial
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => this.props.chanageFontFamily('Verdana')}
                    style={[(this.props.fontFamily == "Verdana") ? { padding: 7, paddingLeft: 10, paddingRight: 10, backgroundColor: '#ddd', borderRadius: 5 } : { padding: 7, paddingLeft: 10, paddingRight: 10 }]}>
                    <Text style={{ fontSize: 16, fontFamily: 'Verdana' }}>
                      Verdana
                    </Text>
                  </TouchableOpacity>
                </View>

                {this.state.voices.length > 0 &&
                  <View style={{ borderTopColor: '#ddd', borderTopWidth: 1 }}>
                    <Text style={{ fontSize: 16, marginTop: 10, marginBottom: 6, marginLeft: 10, marginRight: 10 }}>
                      Голос озвучки предложений:
                    </Text>
                    <ScrollView
                      style={{ height: 200 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingLeft: 10, paddingRight: 10, paddingBottom: 10 }}
                    >
                      {this.state.voices.map((voice, index) =>
                        <TouchableOpacity key={index} onPress={() => this.props.changeVoice(voice)}
                          style={[(this.props.ttsVoice == voice.identifier) ? { padding: 7, paddingLeft: 10, paddingRight: 10, backgroundColor: '#ddd', borderRadius: 5 } : { padding: 7, paddingLeft: 10, paddingRight: 10 }]}>
                          <Text style={{ fontSize: 14 }}>
                            {this.getVoiceLabel(voice, index)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                }
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    )
  }
}
var scroll_percent = 0;

// ============================================================
// Единая точка выбора голоса озвучки по умолчанию.
// Приоритет: английский → оффлайн → мужской.
// Используется ТОЛЬКО здесь — в reader.js при первом запуске,
// когда в Storage ещё нет сохранённого ttsVoice.
// ============================================================
// Google TTS: только точно мужские коды. tpf/tpc/sfg/ene — женские,
// rjs — неопределённый, не включаем во избежание ошибочной детекции.
var MALE_ANDROID_CODES = ['iol', 'iom', 'iob'];
var MALE_IOS_NAMES = [
  'daniel', 'alex', 'aaron', 'fred', 'tom', 'arthur',
  'oliver', 'rishi', 'gordon', 'albert', 'bruce', 'ralph',
  'jorge', 'diego', 'juan', 'luca', 'reed'
];

function isEnglishVoice(v) {
  return v && v.language && v.language.toLowerCase().startsWith('en');
}
function isMaleVoice(v) {
  if (!v) return false;
  // Android Google TTS: identifier вида "en-us-x-tpf-local"
  var id = (v.identifier || '').toLowerCase();
  var parts = id.split('-');
  if (parts.length >= 4 && MALE_ANDROID_CODES.indexOf(parts[3]) !== -1) return true;
  // iOS: человекочитаемое имя
  var name = (v.name || '').toLowerCase();
  for (var i = 0; i < MALE_IOS_NAMES.length; i++) {
    if (name.indexOf(MALE_IOS_NAMES[i]) !== -1) return true;
  }
  return false;
}

function pickDefaultVoice(voices) {
  if (!voices || !voices.length) return null;
  var english = voices.filter(isEnglishVoice);
  if (!english.length) return null;

  // 1. Мужской Enhanced (оффлайн высокого качества)
  var maleEnhanced = english.filter(function (v) { return v.quality === 'Enhanced' && isMaleVoice(v); });
  if (maleEnhanced.length) return maleEnhanced[0];

  // 2. Любой мужской
  var male = english.filter(isMaleVoice);
  if (male.length) return male[0];

  // 3. Enhanced английский
  var enhanced = english.filter(function (v) { return v.quality === 'Enhanced'; });
  if (enhanced.length) return enhanced[0];

  // 4. Хоть какой-то английский
  return english[0];
}


class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      current_page: null,
      page: '',
      pages: null,
      percent: 0,

      paragraphs: false,
      show_list: false,

      showTranslateWord: false,
      showTranslateSentence: false,

      showThemeSetting: false,

      translate_icon_size: false,
      fontSize: false,
      textAlign: false,

      fontFamily: false,

      backgroundColorTheme: false,
      textColorTheme: false,
      secondColorTheme: false,

      showTraining: false,

      showAdInfo: false,
      showAdOpacity: false,

      showNoAd: false,

      auth_modal: false,

      bookmark: false,

      word_in_dictionary: false,

      ttsVoice: false,
    };

    this.modalTranslateWordOriginal = null;
    this.modalTranslateWordTranscription = null;
    this.modalTranslateWordTranslate = null;

    this.modalTranslateSentence = "";

    this.book_name;
    this.book_name_en;
  }


  async componentDidMount() {
    this.have_file = await new Storage().get('have_file_' + this.props.stack.route.params.book_id, '') == 'true';

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    books.map((book) => {
      if (book.id == this.props.stack.route.params.book_id) {
        this.book_name = book.name;
        this.book_name_en = book.name_en;
      }
    });

    AppMetrica.reportEvent('openReader', {
      book_name: this.book_name
    });

    var bookmark = await new Storage().get('bookmark_' + this.props.stack.route.params.book_id);

    if (bookmark != undefined) {
      await this.setState({
        bookmark: JSON.parse(bookmark).paragraph,
      });
    }

    var settings = await new Storage().get('themeReaderSettings');

    if (settings == undefined) {
      settings = {
        translate_icon_size: 24,
        fontSize: 18,
        textAlign: 'flex-start',
        backgroundColorTheme: '#ffffff',
        textColorTheme: '#000000',
        secondColorTheme: '#bbb',
        fontFamily: 'LibreBaskerville-Regular',
      }
      new Storage().set('themeReaderSettings', JSON.stringify(settings));
    } else {
      settings = JSON.parse(settings);
    }

    var ttsVoice = await new Storage().get('ttsVoice');
    var ttsVoiceApplied = false;

    if (!ttsVoice) {
      try {
        var allVoices = await Speech.getAvailableVoices();
        var picked = pickDefaultVoice(allVoices);
        if (picked) {
          ttsVoice = picked.identifier;
          try {
            Speech.configure({ voiceId: ttsVoice });
            ttsVoiceApplied = true;
          } catch (e) {}
          new Storage().set('ttsVoice', ttsVoice);
        }
      } catch(e) {}
    }

    await this.setState({
      translate_icon_size: settings['translate_icon_size'],
      fontSize: settings['fontSize'],
      textAlign: settings['textAlign'],
      backgroundColorTheme: settings['backgroundColorTheme'],
      textColorTheme: settings['textColorTheme'],
      secondColorTheme: settings['secondColorTheme'],
      fontFamily: settings['fontFamily'],
      ttsVoice: ttsVoice || false,
    });

    readerStore.setThemeSettings(settings);
    readerStore.setBookmark(this.state.bookmark);
    readerStore.setPage(this.state.page);
    if (ttsVoice) {
      readerStore.setTtsVoice(ttsVoice);
      readerStore.setTtsVoiceApplied(ttsVoiceApplied);
    }

    if (this.have_file == true) {
      var words = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/words.json');
      words = JSON.parse(words);

      var pagination = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/pagination.json');
      pagination = JSON.parse(pagination);
    } else {
      var words = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/words.json', {}, {}).get();
      var pagination = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/pagination.json', {}, {}).get();
    }

    readerStore.setListWords(words);

    if (this.props.stack.route.params.bookmark == undefined) {
      var page = await new Storage().get('page_' + this.props.stack.route.params.book_id);

      if (page == undefined) {
        page = 1;
      }
    } else {
      var page = this.props.stack.route.params.bookmark.page;
    }


    await this.setState({
      page: parseInt(page),
      pages: Object.keys(pagination).length,
    });


    this.openPage(true);

    var haveTraining = await new Storage().get('haveTraining') == 'true';
    if (haveTraining == false) {
      this.setState({
        showTraining: true,
      });
    }
  }

  componentWillUnmount() {
    this.setState({
      paragraphs: false,
    });
    readerStore.clearListWords();
    clearTimeout(this._scrollRestoreTimer);
  }

  async openPage(first_load) {
    var open_page = true;

    if (this.have_file == false && this.props.root.state.has_internet == false) {
      open_page = false;
      Alert.alert('Отсутствует подключение к интернету');
    }

    if (open_page == true) {

      scroll_percent = 0;

      await this.setState({ show_list: false, paragraphs: false });

      await new Storage().set('page_' + this.props.stack.route.params.book_id, this.state.page.toString());

      this.setPercent();

      if (this.have_file == true) {
        var response = await RNFS.readFile(file_root + '/books/' + this.props.stack.route.params.book_id + '/pagination.json');
        var pagination = JSON.parse(response);
      } else {
        var pagination = await new Request('/books/' + this.props.stack.route.params.book_id + '/result/pagination.json', {}, {}).get();
      }

      this.goBookUp(this.props.stack.route.params.book_id);

      var pageItems = pagination[this.state.page];
      var bookId = this.props.stack.route.params.book_id;
      var paragraphs = [];
      var batchSize = 3;
      for (var i = 0; i < pageItems.length; i += batchSize) {
        var batch = pageItems.slice(i, i + batchSize);
        var results = await Promise.all(batch.map(async (paragraphId) => {
          if (this.have_file == true) {
            var response = await RNFS.readFile(file_root + '/books/' + bookId + '/paragraphs/' + paragraphId + '.json');
            return { name: paragraphId, sentences: JSON.parse(response) };
          } else {
            var sentences = await new Request('/books/' + bookId + '/result/paragraphs/' + paragraphId + '.json', {}, {}).get();
            return sentences !== false ? { name: paragraphId, sentences: sentences } : null;
          }
        }));
        results.forEach(function(p) { if (p !== null) paragraphs.push(p); });
      }

      if (paragraphs.length != 0) {
        if (this.props.root.state.has_subscription == false) {
          if (paragraphs.length > 3) paragraphs.splice(3, 0, { _type: 'ad', _key: 'ad_3' });
          if (paragraphs.length > 8) paragraphs.splice(8, 0, { _type: 'ad', _key: 'ad_8' });
        }

        await this.setState({
          paragraphs: paragraphs,
          show_list: true,
        });

        if (first_load == true) {
          if (this.props.stack.route.params.bookmark == undefined) {
            // Восстанавливаем сохранённую позицию скролла
            var scroll = await new Storage().get('scroll_' + this.props.stack.route.params.book_id);

            if (scroll !== undefined && scroll !== null && scroll !== '') {
              this._scrollRestoreTimer = setTimeout(() => {
                if (this.flatListRef && this.state.paragraphs && this.state.paragraphs.length > 0) {
                  try {
                    var offset = parseInt(scroll);
                    if (!isNaN(offset) && offset >= 0) {
                      this.flatListRef.scrollToOffset({ offset: offset, animated: false });
                    }
                  } catch (e) {}
                }
              }, 500);
            }
          } else {
            // Скролим к параграфу закладки
            var bookmarkParagraphId = this.props.stack.route.params.bookmark.paragraph;
            var bookmarkIndex = paragraphs.findIndex(p => p.name === bookmarkParagraphId);

            if (bookmarkIndex >= 0 && bookmarkIndex < paragraphs.length) {
              this._scrollRestoreTimer = setTimeout(() => {
                if (this.flatListRef && this.state.paragraphs && this.state.paragraphs.length > 0) {
                  try {
                    this.flatListRef.scrollToIndex({ index: bookmarkIndex, animated: false });
                  } catch (e) {
                    // Fallback: если scrollToIndex не работает, пробуем scrollToOffset с примерным смещением
                    try {
                      var approximateOffset = bookmarkIndex * 200; // примерная высота элемента
                      this.flatListRef.scrollToOffset({ offset: approximateOffset, animated: false });
                    } catch (e2) {}
                  }
                }
              }, 500);
            }
          }
        }
      }

      this.setState({
        current_page: this.state.page
      });
    }
  }

  async prevPage() {
    await this.setState({
      page: this.state.page - 1,
    });

    this.checkAd();
  }

  async nextPage() {
    await this.setState({
      page: this.state.page + 1,
    });

    this.checkAd();
  }

  async checkAd() {
    if (this.props.root.state.has_internet == true && this.props.root.state.has_subscription == false) {
      var time_ad = await new Storage().get('time_ad');

      if (time_ad == undefined) {
        time_ad = moment();
        await new Storage().set('time_ad', moment().format());
      } else {
        time_ad = moment(time_ad);
      }

      var now_time = moment();

      var range_time = (now_time - time_ad) / 1000 / 60;

      //range_time = 40;

      if (range_time < 30) {
        this.openPage(false);
      } else {
        if (appStore.show_subsription == true) {
          this.showAdInfo();
        } else {
          this.showAd();
        }
      }
    } else {
      this.openPage(false);
    }
  }

  showAdInfo() {
    AppMetrica.reportEvent('showAdInfo', { platform: Platform.OS });

    this.setState({
      showAdInfo: true,
    });
  }

  closeAdInfo() {
    this.setState({
      showAdInfo: false,
      page: this.state.current_page
    });
  }


  closeNoAdInfo() {
    this.setState({
      showNoAd: false,
    });
  }


  closeTranslateWord() {
    this.setState({
      showTranslateWord: false,
    });
  }

  closeTranslateSentence() {
    this.setState({
      showTranslateSentence: false,
    });
  }

  async showAd() {
    await this.setState({
      showAdInfo: false,
      showAdOpacity: true,
    });

    try {
      const loader = await RewardedAdLoader.create();
      const rewardedAd = await loader.loadAd({
        adUnitId: AD_UNIT_REWARDED,
      });

      rewardedAd.onAdDismissed = () => {
        if (this.state.showAdOpacity == true) {
          this.setState({
            showAdOpacity: false,
          });
          new Storage().set('time_ad', moment().format());
          this.openPage(false);
        }
      };

      rewardedAd.onAdFailedToShow = () => {
        if (this.state.showAdOpacity == true) {
          this.setState({
            showAdOpacity: false,
          });
          if (this.state.showNoAd == false) {
            this.setState({
              showNoAd: true,
            });
          }
          this.openPage(false);
        }
      };

      await rewardedAd.show();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      if (this.state.showAdOpacity == true) {
        this.setState({
          showAdOpacity: false,
        });
        if (this.state.showNoAd == false) {
          this.setState({
            showNoAd: true,
          });
        }
        this.openPage(false);
      }
    }
  }

  closeTraining() {
    new Storage().set('haveTraining', 'true');

    this.setState({
      showTraining: false,
    });
  }


  sliderValueChange(value) {
    var page = parseInt((value / (100 / (this.state.pages - 1))).toFixed(0)) + 1;
    this.setState({
      page: page,
    });
  }

  async onSlidingComplete() {

    AppMetrica.reportEvent('slidingPage', { platform: Platform.OS });

    this.checkAd();
  }

  onScroll(event) {
    if (event.nativeEvent.contentSize.height < event.nativeEvent.layoutMeasurement.height) {
      scroll_percent = 100;
    } else {
      scroll_percent = (event.nativeEvent.contentOffset.y / (event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height)) * 100;
      if (scroll_percent > 100) {
        scroll_percent = 100;
      }
    }
  }
  onScrollEndDrag(event) {
    new Storage().set('scroll_' + this.props.stack.route.params.book_id, event.nativeEvent.contentOffset.y.toString());
    this.setPercent();
  }

  async setPercent() {
    var percent = parseInt(((parseFloat(this.state.page - 1) / parseFloat(this.state.pages)) * 100));

    percent = percent + ((100 / this.state.pages) * (scroll_percent / 100));
    percent = parseInt(percent.toFixed(0));

    if (percent > 98) {
      percent = 100
    }

    await new Storage().set('percent_' + this.props.stack.route.params.book_id, percent.toString());

    var percents = this.props.root.state.books_percents;
    percents[this.props.stack.route.params.book_id] = percent;

    this.props.root.setState({
      books_percents: percents,
    });

    this.setState({
      percent: percent,
    });
  }


  setBookmark(value) {
    readerStore.setBookmark(value);
    this.setState({
      bookmark: value,
    });
  }

  openAuthModal() {
    this.setState({
      showTranslateWord: false,
      auth_modal: true,
    });
  }

  async openTranslateWord(original, translate, transcription) {
    this.modalTranslateWordOriginal = original;
    this.modalTranslateWordTranscription = transcription;
    this.modalTranslateWordTranslate = translate;

    var word = await new Storage().get('word_' + original);

    this.setState({
      word_in_dictionary: word != undefined,
      showTranslateWord: true,
    });
  }

  translateSentence(value) {
    this.modalTranslateSentence = value;
    this.setState({
      showTranslateSentence: true,
    });
  }

  openThemeSetting() {

    AppMetrica.reportEvent('openThemeSetting', { open: !this.state.showThemeSetting });

    this.setState({
      showThemeSetting: !this.state.showThemeSetting,
    });
  }


  chanageFontFamily(fontFamily) {
    this.setState({
      show_list: false,
    }, function () {
      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);
        settings['fontFamily'] = fontFamily;
        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          AppMetrica.reportEvent('changeProperty', { fontFamily: fontFamily });
          this.setState({
            fontFamily: fontFamily,
            show_list: true,
          });
          readerStore.setThemeSettings({ fontFamily: fontFamily });
        });

      });
    });
  }

  changeColorTheme(backgroundColor, textColor, secondColor) {
    this.setState({
      show_list: false,
    }, function () {
      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['backgroundColorTheme'] = backgroundColor;
        settings['textColorTheme'] = textColor;
        settings['secondColorTheme'] = secondColor;

        AppMetrica.reportEvent('changeProperty', { colorTheme: backgroundColor });

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          this.setState({
            backgroundColorTheme: backgroundColor,
            textColorTheme: textColor,
            secondColorTheme: secondColor,
            show_list: true,
          });
          readerStore.setThemeSettings({
            backgroundColorTheme: backgroundColor,
            textColorTheme: textColor,
            secondColorTheme: secondColor,
          });
        });
      });
    });
  }

  textAlignChange() {
    this.setState({
      show_list: false,
    }, function () {

      var nowTextAlign = this.state.textAlign;
      if (nowTextAlign == 'flex-start') {
        nowTextAlign = 'flex-end';
      } else {
        if (nowTextAlign == 'flex-end') {
          nowTextAlign = 'center';
        } else {
          if (nowTextAlign == 'center') {
            nowTextAlign = 'space-evenly';
          } else {
            nowTextAlign = 'flex-start';
          }
        }
      }

      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['textAlign'] = nowTextAlign;

        AppMetrica.reportEvent('changeProperty', { textAlign: nowTextAlign });

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {

          this.setState({
            show_list: true,
            textAlign: nowTextAlign,
          });
          readerStore.setThemeSettings({ textAlign: nowTextAlign });
        });

      });
    });
  }

  changeFontSize(type_change) {
    this.setState({
      show_list: false,
    }, function () {

      if (type_change == 'more') {
        var newFontSize = this.state.fontSize + 2;
      } else {
        var newFontSize = this.state.fontSize - 2;
      }

      AppMetrica.reportEvent('changeProperty', { fontSize: newFontSize });

      if (newFontSize == 14) {
        var translate_icon_size = 18;
      }
      if (newFontSize == 16) {
        var translate_icon_size = 22;
      }
      if (newFontSize == 18) {
        var translate_icon_size = 24;
      }
      if (newFontSize == 20) {
        var translate_icon_size = 26;
      }
      if (newFontSize == 22) {
        var translate_icon_size = 28;
      }
      if (newFontSize == 24) {
        var translate_icon_size = 30;
      }

      AsyncStorage.getItem('themeReaderSettings').then((settings) => {
        settings = JSON.parse(settings);

        settings['fontSize'] = newFontSize;
        settings['translate_icon_size'] = translate_icon_size;

        new Storage().set('themeReaderSettings', JSON.stringify(settings)).then(() => {
          this.setState({
            fontSize: newFontSize,
            translate_icon_size: translate_icon_size,
            show_list: true,
          });
          readerStore.setThemeSettings({ fontSize: newFontSize, translate_icon_size: translate_icon_size });
        });
      });
    });
  }


  async goBookUp(book_id) {
    var sort_new_book = await new Storage().get('sort_new_book');
    if (sort_new_book == undefined) {
      sort_new_book = 'true';
    }
    if (sort_new_book == 'true') {
      var new_result = [];

      var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
      books = JSON.parse(books);

      books.map((book) => {
        if (book.id == book_id) {
          new_result.unshift(book);
        } else {
          new_result.push(book);
        }
      });

      RNFS.writeFile(file_root + '/' + BOOKS_FILENAME, JSON.stringify(new_result), 'utf8');
    }
  }

  async changeVoice(voice) {
    // Принимаем как объект voice, так и строку (id) для обратной совместимости
    var voiceId = (typeof voice === 'string') ? voice : (voice && voice.identifier);
    if (!voiceId) return;

    // Остановить текущую озвучку, чтобы новая стартовала чистой
    try { Speech.stop(); } catch (e) {}
    readerStore.setCurrentSpeaking(null);

    var applied = false;
    try {
      Speech.configure({ voiceId: voiceId });
      applied = true;
    } catch (e) {}

    new Storage().set('ttsVoice', voiceId);
    readerStore.setTtsVoice(voiceId);           // сбрасывает ttsVoiceApplied в false
    readerStore.setTtsVoiceApplied(applied);    // и сразу ставит true, если успешно применили
    this.setState({ ttsVoice: voiceId });
  }

  setWordInDictionary(word_in_dictionary) {
    this.setState({
      word_in_dictionary: word_in_dictionary
    });
  }

  renderParagraphItem({item}) {
    if (item._type === 'ad') {
      return (
        <View style={readerScreenStyles.adContainer}>
          {adSizeBig && (
            <BannerView
              size={adSizeBig}
              adRequest={{ adUnitId: AD_UNIT_BANNER }}
            />
          )}
        </View>
      );
    }
    return (
      <View>
        <Paragraph
          data={item}
          openTranslateSentence={(value) => this.translateSentence(value)}
          openTranslateWord={(o, tr, ts) => this.openTranslateWord(o, tr, ts)}
          openAuthModal={() => this.openAuthModal()}
          setBookmark={(value) => this.setBookmark(value)}
          current_user={this.props.root.state.current_user}
          page={this.state.page}
          book_name={this.book_name}
          book_name_en={this.book_name_en}
          book_id={this.props.stack.route.params.book_id}
          percent={this.state.percent}
          has_internet={this.props.root.state.has_internet}
        />
      </View>
    );
  }

  render() {
    return (
      <React.Fragment>

        {this.state.textColorTheme == '#ffffff' &&
          <StatusBar
            barStyle="light-content"
          />
        }
        {this.state.textColorTheme == '#000000' &&
          <StatusBar
            barStyle="dark-content"
          />
        }

        {(this.state.paragraphs == false) ? (
          <SafeAreaView style={{ flex: 1, backgroundColor: this.state.backgroundColorTheme }}>
            <TouchableOpacity onPress={() => this.props.stack.navigation.goBack()}>
              {this.state.textColorTheme == '#ffffff' &&
                <Image style={{ width: 30, height: 30, marginTop: 5, marginLeft: 10 }}
                  source={require('./app/images/header/arrow-left-white.png')} />
              }
              {this.state.textColorTheme == '#000000' &&
                <Image style={{ width: 30, height: 30, marginTop: 5, marginLeft: 10 }}
                  source={require('./app/images/header/arrow-left.png')} />
              }
            </TouchableOpacity>

            <ActivityIndicator style={{ flex: 1 }} size="large" color="#aaa" />
          </SafeAreaView>
        ) : (

          <SafeAreaView style={{ flex: 1, backgroundColor: this.state.backgroundColorTheme }}>
            <Modal
              animationType="slide"
              presentationStyle={'overFullScreen'}
              visible={this.state.auth_modal && this.props.root.state.current_user == false}>
              <Auth
                method={this.state.auth_method}
                modal={true}
                bookmark_info={true}
                close={() => this.setState({ auth_modal: false })}
              />
            </Modal>

            {this.state.showAdOpacity == true &&
              <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10 }}>
                <ActivityIndicator style={{ flex: 1 }} size="large" color="#999" />
              </View>
            }

            {(this.state.showAdInfo && this.props.root.state.has_subscription == false) &&
              <TouchableOpacity style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: '120%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }} onPress={() => this.closeAdInfo()}>
                <TouchableWithoutFeedback>
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    backgroundColor: "#FFF",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}>
                    <View style={{ padding: 30 }}>
                      <Text style={{ fontSize: 17 }}>
                        Чтобы приложение было бесплатным, мы вынуждены показывать рекламу. {"\n"} {"\n"}Вы можете приобрести PRO-версию, чтобы отключить рекламу, а еще будет доступен режим чтения без интернета.
                      </Text>

                      <TouchableOpacity onPress={() => this.showAd()} style={{ marginTop: 30, backgroundColor: '#75b641', height: 50, borderRadius: 10 }}>
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Смотреть рекламу</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => this.props.stack.navigation.navigate('Subscription')} style={{ marginTop: 15, marginBottom: 30, backgroundColor: '#f05458', height: 50, borderRadius: 10 }}>
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Приобрести PRO-версию</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            }

            <ModalNoAd visible={this.state.showNoAd} close={() => this.closeNoAdInfo()} />

            <ModalFastLearning
              visible={this.state.showTraining}
              close={() => this.closeTraining()} />

            <ModalTranslateSentence
              has_subscription={this.props.root.state.has_subscription}
              translate={this.modalTranslateSentence}
              visible={this.state.showTranslateSentence}
              close={() => this.closeTranslateSentence()} />

            <ModalTranslateWord
              current_user={this.props.root.state.current_user}
              has_subscription={this.props.root.state.has_subscription}
              original={this.modalTranslateWordOriginal}
              transcription={this.modalTranslateWordTranscription}
              translate={this.modalTranslateWordTranslate}
              word_in_dictionary={this.state.word_in_dictionary}
              visible={this.state.showTranslateWord}
              has_internet={this.props.root.state.has_internet}
              close={() => this.closeTranslateWord()}
              openAuthModal={() => this.openAuthModal()}
              setWordInDictionary={(flag) => this.setWordInDictionary(flag)}
              openSubscription={() => this.props.stack.navigation.navigate('Subscription')}
            />

            <View style={{
              height: 40,
              backgroundColor: this.state.backgroundColorTheme,
              borderBottomWidth: 1,
              borderColor: this.state.secondColorTheme,
              flexDirection: 'row',
              position: 'relative',
              zIndex: 2,
            }}>
              <TouchableOpacity onPress={() => this.props.stack.navigation.goBack()}>
                {this.state.textColorTheme == '#ffffff' &&
                  <Image style={{ width: 30, height: 30, marginTop: 5, marginLeft: 10 }}
                    source={require('./app/images/header/arrow-left-white.png')} />
                }
                {this.state.textColorTheme == '#000000' &&
                  <Image style={{ width: 30, height: 30, marginTop: 5, marginLeft: 10 }}
                    source={require('./app/images/header/arrow-left.png')} />
                }
              </TouchableOpacity>

              {this.state.pages == 1 ? (
                <View style={{ flex: 1 }}></View>
              ) : (
                <Slider
                  style={{
                    flex: 1,
                    marginLeft: 5,
                    marginRight: 5,
                    width: Dimensions.get('window').width - 100
                  }}
                  value={this.state.percent}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#fe4444"
                  maximumTrackTintColor={this.state.secondColorTheme}
                  thumbImage={require("./app/images/reader/sliderThumb.png")}
                  onValueChange={(value) => this.sliderValueChange(value)}
                  onSlidingComplete={() => this.onSlidingComplete()}
                />
              )}

              <TouchableWithoutFeedback onPress={() => this.openThemeSetting()}>
                <View style={{ height: 30, width: 30, marginTop: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center' }}>
                  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                    <Circle
                      cx="12" cy="12" r="3"
                      stroke={this.state.textColorTheme || '#000000'}
                      strokeWidth={1.4}
                    />
                    <Path
                      stroke={this.state.textColorTheme || '#000000'}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    />
                  </Svg>
                </View>
              </TouchableWithoutFeedback>

              <ReaderSettings
                visible={this.state.showThemeSetting}
                closeSettings={() => this.setState({ showThemeSetting: false })}

                fontSize={this.state.fontSize}
                changeFontSize={(value) => this.changeFontSize(value)}

                textAlign={this.state.textAlign}
                textAlignChange={() => this.textAlignChange()}

                backgroundColorTheme={this.state.backgroundColorTheme}
                changeColorTheme={(backgroundColor, textColor, secondColor) => this.changeColorTheme(backgroundColor, textColor, secondColor)}

                fontFamily={this.state.fontFamily}
                chanageFontFamily={(fontFamily) => this.chanageFontFamily(fontFamily)}

                ttsVoice={this.state.ttsVoice}
                changeVoice={(voiceId) => this.changeVoice(voiceId)}
              />

            </View>

            <View style={readerScreenStyles.readerContainer}>
              {this.state.show_list &&
                <FlatList
                  ref={(ref) => this.flatListRef = ref}
                  data={this.state.paragraphs}
                  keyExtractor={(item) => item._type === 'ad' ? item._key : 'p_' + item.name}
                  renderItem={(itemInfo) => this.renderParagraphItem(itemInfo)}
                  initialNumToRender={5}
                  maxToRenderPerBatch={3}
                  windowSize={7}
                  onScroll={(event) => this.onScroll(event)}
                  onScrollEndDrag={(event) => this.onScrollEndDrag(event)}
                  scrollEventThrottle={8}
                  ListFooterComponent={<View style={readerScreenStyles.footerSpacer} />}
                  style={{ flex: 1 }}
                />
              }
            </View>

            <View style={[readerScreenStyles.footerNav, { borderTopWidth: 1, borderTopColor: this.state.secondColorTheme }]}>

              {this.state.page > 1 &&
                <TouchableOpacity onPress={() => this.prevPage()} style={readerScreenStyles.navButton}>
                  {this.state.textColorTheme == '#ffffff' &&
                    <Image style={readerScreenStyles.navArrow}
                      source={require('./app/images/header/arrow-left-white.png')} />
                  }
                  {this.state.textColorTheme == '#000000' &&
                    <Image style={readerScreenStyles.navArrow}
                      source={require('./app/images/header/arrow-left.png')} />
                  }
                </TouchableOpacity>
              }
              {this.state.page == 1 &&
                <React.Fragment>
                  {this.state.textColorTheme == '#ffffff' &&
                    <Image style={{ width: 30, height: 30, opacity: 0.3, margin: 10 }}
                      source={require('./app/images/header/arrow-left-white.png')} />
                  }
                  {this.state.textColorTheme == '#000000' &&
                    <Image style={{ width: 30, height: 30, opacity: 0.3, margin: 10 }}
                      source={require('./app/images/header/arrow-left.png')} />
                  }

                </React.Fragment>
              }


              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Text style={{ color: this.state.textColorTheme, lineHeight: 30, fontSize: 16 }}> {this.state.page} / {this.state.pages}</Text>
              </View>

              {this.state.page < this.state.pages &&
                <TouchableOpacity onPress={() => this.nextPage()} style={{ padding: 10 }}>
                  {this.state.textColorTheme == '#ffffff' &&
                    <Image style={{ width: 30, height: 30 }}
                      source={require('./app/images/header/arrow-right-white.png')} />
                  }
                  {this.state.textColorTheme == '#000000' &&
                    <Image style={{ width: 30, height: 30 }}
                      source={require('./app/images/header/arrow-right.png')} />
                  }
                </TouchableOpacity>
              }
              {this.state.page == this.state.pages &&
                <React.Fragment>
                  {this.state.textColorTheme == '#ffffff' &&
                    <Image style={{ width: 30, height: 30, opacity: 0.3, margin: 10 }}
                      source={require('./app/images/header/arrow-right-white.png')} />
                  }
                  {this.state.textColorTheme == '#000000' &&
                    <Image style={{ width: 30, height: 30, opacity: 0.3, margin: 10 }}
                      source={require('./app/images/header/arrow-right.png')} />
                  }

                </React.Fragment>
              }

            </View>


          </SafeAreaView>

        )}
      </React.Fragment>
    )
  }
};

const TargetVersion = observer(class TargetVersion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
    }
    this.current_version = '1';
    this.target_version = null;
  }

  async componentDidMount() {
    if (appStore.has_internet == true) {
      var response = await new Request('/api/v1/target_version', {}, { do_not_show_error: true }).get();
      if (response != false) {
        if (Platform.OS === 'ios') {
          this.current_version = CURRENT_IOS_VERSION;
          this.target_version = response.ios_version;
        }
        if (Platform.OS === 'android') {
          this.current_version = CURRENT_ANDROID_VERSION;
          this.target_version = response.android_version;
        }

        if (this.compareVersions() == false) {
          this.setState({
            visible: true
          });
        }
      }
    }
  }

  compareVersions() {
    var current = parseInt(this.current_version.split('.').join(''));
    var target = parseInt(this.target_version.split('.').join(''));

    var check = true;

    if (target > current) {
      check = false;
    }

    return check;
  }

  close() {
    this.setState({
      visible: false
    });
  }

  render() {
    return (
      <Modal
        animationType="fade"
        presentationStyle={'overFullScreen'}
        transparent={true}
        visible={this.state.visible}>

        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <View style={{ margin: 30, borderRadius: 15, backgroundColor: '#FFF', padding: 15 }}>

              <Text style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>Обновите приложение</Text>

              <View style={{ marginTop: 15, backgroundColor: '#ddd', borderRadius: 5, padding: 5 }} w>
                <Text style={{ textAlign: 'center', fontSize: 14 }}>
                  {this.current_version} -> {this.target_version}
                </Text>
              </View>


              <Text style={{ marginTop: 15 }}>
                Просим обновить приложение, чтобы иметь доступ ко всем нововведениям.
              </Text>

              <Text style={{ marginTop: 15 }}>
                Обратите внимание, что если приложение не обновлять - это может привести к ошибкам.
              </Text>

              {Platform.OS === 'ios' &&
                <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/ru/app/read-en/id1562732797")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                  <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>App Store</Text>
                </TouchableOpacity>
              }

              {Platform.OS === 'android' &&
                <React.Fragment>
                  <TouchableOpacity onPress={() => Linking.openURL("https://play.google.com/store/apps/details?id=com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Google Play</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => Linking.openURL("https://apps.rustore.ru/app/com.read_en")} style={{ marginTop: 15, backgroundColor: '#75b641', height: 40, borderRadius: 10 }}>
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>RuStore</Text>
                  </TouchableOpacity>
                </React.Fragment>
              }

              <TouchableOpacity onPress={() => this.close()} style={{ marginTop: 15, backgroundColor: '#ddd', height: 40, borderRadius: 10 }}>
                <Text style={{ color: '#444', textAlign: 'center', lineHeight: 40, fontSize: 14 }}>Обновить позже</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>

      </Modal>
    )
  }
});
class Header extends React.Component {
  render(){
    return(
      <SafeAreaView style={{backgroundColor: '#FFF'}}>
        <View style={applicationStyles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.openDrawer()}>
            <Image style={applicationStyles.header_icon_image} source={require('./app/images/header/menu.png')} />
          </TouchableOpacity> 
          <Text style={applicationStyles.header_title}>{this.props.title}</Text>
          <View style={applicationStyles.header_empty_block}/>
        </View>
        
      </SafeAreaView>
    )
  }
}
var root_app;
class RootApp extends React.Component {
  constructor(props) {
    super(props);
    root_app = this;

    this.state = {
      has_internet: true,
      has_subscription: false,
      subscription_info: {},
      current_user: false,
      confirm_conditions: true,
      books_percents: {},

      error_show: false,
      error_title: '',
      error_description: '',
      type_payment: Platform.OS === 'ios' ? 'by_store' : 'by_yoo_kassa'
    }

    this.notification_timer;
  }

  async componentDidMount() {
    this.initAds();

    var current_user = await new Storage().get('current_user');

    if (current_user != undefined) {
      var parsed_user = JSON.parse(current_user);
      await this.setState({
        current_user: parsed_user,
      });
      appStore.setCurrentUser(parsed_user);
    }

    var confirm_conditions = await new Storage().get('confirm_conditions_' + POLICY_VERSION);
    var confirm_val = confirm_conditions == 'true';
    await this.setState({
      confirm_conditions: confirm_val
    });
    appStore.setConfirmConditions(confirm_val);

    this.checkSubscription();

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
    });

    if (await new Storage().get('openAppFirst') == undefined) {
      new Storage().set('openAppFirst', 'true');

      AppMetrica.reportEvent('openAppFirst', {
        platform: Platform.OS,
      });
    } else {
      //this.check_location();

      AppMetrica.reportEvent('openAppNotFirst', {
        platform: Platform.OS,
      });
    }
  }

  componentWillUnmount() {
    if (this._unsubNet) {
      this._unsubNet();
    }
    clearTimeout(this.notification_timer);
  }

  async initAds() {
    if (Platform.OS === 'ios') {
      try {
        await requestTrackingPermission();
      } catch (e) {}
    }
    await MobileAds.initialize();
    adSizeBig = await BannerAdSize.inlineSize(300, 250);
    adSizeMini = await BannerAdSize.inlineSize(300, 50);
    this.forceUpdate();
  }

  async check_location() {
    var response = await new Request('/api/v1/users/context', {
    }, {
      do_not_show_error: false
    }).get();

    if (response != false) {
      if (response['country'] == 'RU') {
        this.setState({
          type_payment: 'by_yoo_kassa'
        });
        appStore.setTypePayment('by_yoo_kassa');
      }
    }
  }

  async sync_subscription_with_server(user_id, subscription_id, end_date) {
    await new Request('/api/v1/payments/sync_subscription', {
      user_id: user_id,
      subscription_id: subscription_id,
      end_date: end_date,
    }, {}).post();
  }

  async checkSubscription() {
    var has_subscription = await new Storage().get('has_subscription', 'false');

    var subscription_info = await new Storage().get('subscription_info');
    if (subscription_info != undefined) {
      subscription_info = JSON.parse(subscription_info);
    } else {
      subscription_info = {};
    }

    await this.setState({
      has_subscription: has_subscription == 'true',
      subscription_info: subscription_info
    });
    appStore.setSubscription(has_subscription == 'true');
    appStore.setSubscriptionInfo(subscription_info);

    if (this.state.type_payment == 'by_store') {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const proEntitlement = customerInfo.entitlements.active['pro'];

        if (proEntitlement) {
          const productId = proEntitlement.productIdentifier;
          let subscription_id;
          if (productId === 'read_1_month') subscription_id = 1;
          else if (productId === 'read_6_month') subscription_id = 2;
          else if (productId === 'read_1_year') subscription_id = 3;
          else if (productId === 'read_forever') subscription_id = 4;
          else subscription_id = 3;

          const end_date = proEntitlement.expirationDate
            ? moment(proEntitlement.expirationDate)
            : moment().add(200, 'years');

          const subscription_info = {
            end_date: end_date.format('YYYY-MM-DD HH:MM'),
            subscription_id: subscription_id,
          };

          await new Storage().set('has_subscription', 'true');
          await new Storage().set('subscription_info', JSON.stringify(subscription_info));

          await this.setState({
            subscription_info: subscription_info,
            has_subscription: true,
          });
          appStore.setSubscription(true);
          appStore.setSubscriptionInfo(subscription_info);

          if (this.state.current_user) {
            this.sync_subscription_with_server(
              this.state.current_user.id,
              subscription_id,
              end_date.format('YYYY-MM-DD HH:MM')
            );
          }
        } else {
          await new Storage().set('has_subscription', 'false');
          await this.setState({ has_subscription: false });
          appStore.setSubscription(false);
        }
      } catch (e) {
        console.warn('Error checking subscription via RevenueCat:', e);
      }
    }

    if (this.state.current_user != false && this.state.has_subscription == false) {
      var response = await new Request('/api/v1/users/subscription', {
        user_id: this.state.current_user.id
      }, {
        do_not_show_error: true
      }).get();
      if (response != false) {
        await this.setState({
          subscription_info: response,
          has_subscription: true,
        });
        appStore.setSubscription(true);
        appStore.setSubscriptionInfo(response);
        response['subscription_id'] = response['subscription']['id'];
        await new Storage().set('has_subscription', 'true');
        await new Storage().set('subscription_info', JSON.stringify(response));
      }
    }

    if (this.state.has_subscription == true) {
      var subscription_info = JSON.parse(await new Storage().get('subscription_info'));

      var end_date = moment(subscription_info.end_date);
      var now_time = moment();
      if (end_date < now_time) {
        await new Storage().set('has_subscription', 'false');
        await this.setState({
          has_subscription: false,
        });
        appStore.setSubscription(false);
      }
    }

    return this.state.has_subscription;
  }


  showError(title, description) {
    this.setState({
      error_show: true,
      error_title: title,
      error_description: description,
    });

    console.log(title + ' ' + description);

    clearTimeout(this.notification_timer);
    this.notification_timer = setTimeout(() => {
      this.setState({
        error_show: false
      });
    }, 3000);
  }

  closeError() {
    this.setState({
      error_show: false,
    });
  }

  checkInternet() {
    NetInfo.fetch().then(state => {
      if (state.isConnected == false) {
        Alert.alert(false, 'Интернета по-прежнему нет(');
      }
      this.setState({
        has_internet: state.isConnected,
      });
      appStore.setInternet(state.isConnected);
    });
  }

  async confirm_conditions() {
    await new Storage().set('confirm_conditions_' + POLICY_VERSION, 'true');

    this.setState({
      confirm_conditions: true
    });
    appStore.setConfirmConditions(true);
  }

  render() {


    const Stack = createStackNavigator();

    return (
      <React.Fragment>
        <TargetVersion />
        {this.state.confirm_conditions == false ? (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Image
                style={{ height: 200, width: 200, }}
                source={require('./app/images/layouts/logo.png')}
              />
            </View>
            <View>
              <Text style={{ textAlign: 'center' }}>Продолжая пользоваться приложением,</Text>

              <Text style={{ textAlign: 'center' }}>вы принимате, что</Text>
              <Text style={{ textAlign: 'center' }}>приложение собирает данные</Text>
              <Text style={{ textAlign: 'center' }}>о приблизительном местоположении</Text>
              <Text style={{ textAlign: 'center' }}>и принимаете условия</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")}>
              <Text style={{ color: app_theme_colors.red, textAlign: 'center' }}>Политики конфидициальности</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")}>
              <Text style={{ color: app_theme_colors.red, textAlign: 'center', marginBottom: 15 }}>Пользовательского соглашения</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => this.confirm_conditions()} style={profileStyles.form_button}>
              <Text style={profileStyles.form_button_text}>Продолжить</Text>
            </TouchableOpacity>

          </View>
        ) : (
          <React.Fragment>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="Home">
                <Stack.Screen name="Home" options={() => ({ headerShown: false })}>
                  {(stack) => (
                    <TabStack root={this} stack={stack} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Show" options={({ navigation, route }) => ({
                  title: false,
                  headerStyle: {
                    backgroundColor: route.params.color,
                    borderColor: 'transparent',
                    shadowColor: 'transparent'
                  },
                  headerBackTitle: 'Список книг',
                  headerBackTitleStyle: {
                    color: '#FFF',
                  },
                  headerBackTitleVisible: Platform.OS === 'ios',
                  headerBackImage: () => (
                    <ImageBackground style={{ width: 30, height: 30, marginLeft: 10 }}
                      resizeMode='cover'
                      source={require('./app/images/header/arrow-left-white.png')} />
                  )
                }
                )}>
                  {(stack) => (
                    <Show stack={stack} root={this} />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Reader"
                  options={({ navigation, route }) => ({
                    headerShown: false
                  })}>
                  {(stack) => (
                    <Reader home_stack_state={this} root={this} stack={stack} />
                  )}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>

            {this.state.error_show == true &&
              <TouchableOpacity onPress={() => this.closeError()} style={applicationStyles.error_request}>
                <View style={applicationStyles.error_request_texts}>
                  <Text style={applicationStyles.error_request_text}>
                    {this.state.error_title}
                  </Text>

                  {this.state.error_description != undefined &&
                    <Text style={applicationStyles.error_request_text}>
                      {this.state.error_description}
                    </Text>
                  }
                </View>
                <View style={applicationStyles.error_request_icon}>
                  <Image source={require('./app/images/layouts/error_close.png')} style={applicationStyles.error_request_icon_image} />
                </View>
              </TouchableOpacity>
            }
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

class TabStack extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const Tab = createBottomTabNavigator();


    return (
      <Tab.Navigator initialRouteName="Books"
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#f05458'
        })}>
        <Tab.Screen name="Books"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/book-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/book.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Книги',
            headerShown: false
          })}>
          {(tabs) => (
            <Home tabs={tabs} stack={this.props.stack} parent={this} root={this.props.root} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Bookmarks"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/bookmark-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/bookmark.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Закладки',
          })}>
          {(tabs) => (
            <BookmarkStack tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Dictionary"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/dictionary-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/dictionary.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Словарь',
          })}>
          {(tabs) => (
            <Dictionary tabs={tabs} root={this.props.root} stack={this.props.stack} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Subscription"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/pro-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/pro.png')} />
                )}
              </React.Fragment>

            ),
            title: 'PRO-доступ',
          })}>
          {(tabs) => (
            <Subscription tabs={tabs} root={this.props.root} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile"
          options={() => ({
            tabBarIcon: ({ focused, color }) => (
              <React.Fragment>
                {focused ? (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/profile-active.png')} />
                ) : (
                  <Image style={{ width: 18, height: 18 }} source={require('./app/images/layouts/menu/profile.png')} />
                )}
              </React.Fragment>

            ),
            title: 'Профиль',
          })}>
          {() => (
            <Profile root={this.props.root} />
          )}
        </Tab.Screen>
      </Tab.Navigator >
    );
  }
}

class ButtonRead extends React.Component {

  _isMounted = false;

  constructor(props) {

    super(props);

    this.state = {
      have_file: false,
      show_load_status: false,
      progress: 2,
      progress_text: '0',
      have_internet: true,
      button_loader: true,
    }
  }

  async componentDidMount() {

    this._isMounted = true;
    
    var have_file = await AsyncStorage.getItem('have_file_' + this.props.book_id);

    this.setState({
      have_file: have_file == 'true',
      button_loader: false,
    });

    this._unsubNet = NetInfo.addEventListener(state => {
      this.setState({
        have_internet: state.isConnected,
      });
    });


  }

  async loadFiles(ar_files, index, count, book_id) {

    if (this._isMounted == true) {
      var path = ar_files[index]; 

      var response = await axios.get("https://reedle.ru" + path, { params: {} });

      var response = await new Request(path, {}).get();
      var file_data = JSON.stringify(response);

      path = path.replace('/result', '');
      
      await RNFS.writeFile(file_root + path, file_data, 'utf8');
      
      index++;

      var progress = (index / count) * 100;
      if (progress < 2) {
        progress = 2;
      }

      

      await this.setState({
        progress: progress,
        progress_text: progress.toFixed(0),
      });

      if (index < count) {
        this.loadFiles(ar_files, index, count, book_id);
      } else {

        AppMetrica.reportEvent('loader',{status: 'finish'});
        AppMetrica.reportEvent('loader',{progress: 100});

        await this.setState({
          progress: 100,
          have_file: true,
          show_load_status: false,
        });

        await AsyncStorage.setItem('have_file_' + book_id, 'true');

        this.openBook(book_id);

      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this._unsubNet) {
      this._unsubNet();
    }
  }

  async openBook(book_id) {
    if (this.state.have_file == false) {
      AppMetrica.reportEvent('loader',{status: 'start'});

      await this.setState({
        show_load_status: true,
      });
      var response = await new Request('/api/v1/books/download_list', { book_id: book_id }).get();
     
      await RNFS.mkdir(file_root + '/books/' + book_id + '/paragraphs/');

      this.setState({
        progress: 2,
      });

      this.loadFiles(response, 0, response.length, book_id);
    } else {
      this.props.set_have_file();
      // this.props.navigation.navigate('Reader', {
      //   book_id: book_id
      // });
    }
  }

  render() {

    return <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
      <React.Fragment>
        {this.state.button_loader == true &&
          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
        }
        {this.state.button_loader == false &&
          <React.Fragment>
            {this.state.show_load_status == true &&
              <View style={{
                position: 'absolute',
                left: -15,
                top: -15,
              }}>
                <AnimatedCircularProgress
                  size={90}
                  width={20}
                  fill={this.state.progress}
                  tintColor={this.props.color}
                  backgroundColor="#FFF"
                  rotation={0}
                  duration={0}>
                  {
                    (fill) => (
                      <React.Fragment>
                        {this.state.progress_text == '0' &&
                          <ActivityIndicator style={{ flex: 1 }} size="small" color="#aaa" />
                        }
                        {this.state.progress_text != '0' &&
                          <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>{this.state.progress_text}%</Text>
                        }
                      </React.Fragment>
                    )
                  }
                </AnimatedCircularProgress>
                {this.state.progress_text != '0' &&
                  <Text style={{ color: this.props.color, textAlign: 'center', lineHeight: 40, fontSize: 14 }}>{this.state.progress_text}%</Text>
                }
              </View>
            }


            {this.state.show_load_status == false &&
              <React.Fragment>

                {this.state.have_file == false &&
                  <React.Fragment>
                    {this.state.have_internet == false &&
                      <Image
                        style={{ height: 30, width: 30, margin: 15, opacity: 0.5 }}
                        source={require('./app/images/books/no-connect.png')}
                      />
                    }
                    {this.state.have_internet == true &&
                      <TouchableOpacity onPress={() => this.openBook(this.props.book_id)}>
                        <Image
                          style={{ height: 30, width: 30, margin: 15 }}
                          source={require('./app/images/books/download.png')}
                        />
                      </TouchableOpacity>
                    }
                  </React.Fragment>
                }
                {this.state.have_file == true &&
                  <TouchableOpacity onPress={() => this.openBook(this.props.book_id)}>
                    <Image
                      style={{ height: 20, width: 20, margin: 20 }}
                      source={require('./app/images/books/arrow-button-read.png')}
                    />
                  </TouchableOpacity>
                }
              </React.Fragment>
            }
          </React.Fragment>
        }
      </React.Fragment>
    </View>
  }
}
class Show extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      percent: 0,
      book: false,
      have_file: false
    };
  }

  async componentDidMount() {
    homeStore.setOpenProperty(false);

    var books = await RNFS.readFile(file_root + '/' + BOOKS_FILENAME, 'utf8');
    books = JSON.parse(books);

    await Promise.all(
      books.map(async (book) => {
        if (book.id == this.props.stack.route.params.book_id) {
          var have_file = await new Storage().get('have_file_' + book.id, 'false');

          AppMetrica.reportEvent('openDetail', {
            book_name: book.name
          });
          
          this.setState({
            book: book,
            have_file: have_file == 'true'
          });
        }
      })
    )
  }

  openBook(book_id) {
    this.props.stack.navigation.navigate('Reader', {
      book_id: book_id
    });
  }

  set_have_file() {
    this.setState({
      have_file: true
    });
  }

  render() {

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: this.props.stack.route.params.color }}>
        <TargetVersion />
        <StatusBar barStyle="light-content" />

        {this.state.book == false &&
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#aaa" />
        }

        {this.state.book != false &&
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly' }}>

            <View>
              <Text style={{ marginBottom: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.author}</Text>
              <Text style={{ fontFamily: 'LibreBaskerville-Regular', color: '#FFF', fontSize: 45, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name_en}</Text>
              <Text style={{ marginTop: 30, color: '#FFF', fontSize: 18, paddingLeft: 30, paddingRight: 30, textAlign: 'center' }}>{this.state.book.name}</Text>
            </View>

            <View>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}>
                <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginRight: 15 }}>
                    <Image
                      style={{ height: 20, width: 20, marginRight: 8 }}
                      source={require('./app/images/books/book-white.png')}
                    />
                    <Text style={{ lineHeight: 20, fontSize: 12, color: '#FFF' }}>{this.props.root.state.books_percents[this.props.stack.route.params.book_id]}%</Text>
                  </View>
                </View>

                <View style={{ height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden', marginRight: 15 }}>
                  {this.props.root.state.has_internet == true || this.state.have_file == true ? (
                    <TouchableOpacity onPress={() => this.openBook(this.state.book.id)}>
                      <Image
                        style={{ height: 20, width: 20, margin: 20 }}
                        source={require('./app/images/books/arrow-button-read.png')}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Image
                      style={{ height: 30, width: 30, margin: 15, opacity: 0.5 }}
                      source={require('./app/images/books/no-connect.png')}
                    />
                  )}
                </View>

                {(this.props.root.state.has_subscription) && this.state.have_file == false &&
                  <View style={{ marginRight: 15 }}>
                    {this.props.root.state.has_subscription == true ? (
                      <React.Fragment>
                        {this.props.root.state.has_internet == true &&
                          <ButtonRead
                            set_have_file={() => this.set_have_file()}
                            book_id={this.state.book.id} color={this.state.book.color}
                            book_name={this.state.book.name}
                            book_name_en={this.state.book.name_en}
                            navigation={this.props.stack.navigation}
                          />
                        }
                      </React.Fragment>
                    ) : (
                      <View style={{ opacity: 0.3, height: 60, width: 60, borderRadius: 18, backgroundColor: '#FFF', flexDirection: 'row', overflow: 'hidden' }}>
                        <Image
                          style={{ height: 30, width: 30, margin: 15 }}
                          source={require('./app/images/books/download.png')}
                        />
                      </View>
                    )}
                  </View>
                }
              </View>


            </View>

            {this.state.have_file == false && this.props.root.state.has_internet == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>
                  Вы можете скачать книгу,{"\n"} чтобы читать ее без интернета
                </Text>

                {this.props.root.state.has_subscription == false &&
                  <Text style={{ marginTop: 15, color: '#FFF', textAlign: 'center' }}>
                    Функция скачивания доступна{"\n"} только при наличии подписки
                  </Text>
                }
              </View>
            }

            {this.state.have_file == true &&
              <View style={{ padding: 15 }}>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Книга скачана.</Text>
                <Text style={{ color: '#FFF', textAlign: 'center' }}>Вы можете читать ее без интернета</Text>
              </View>
            }
          </View>
        }
      </SafeAreaView>
    );

  }
};


const Subscription = observer(class Subscription extends React.Component {
  constructor() {
    super();
    this.state = {
      active_subscription: 3,
      load_check_status_button: false,
      load_payment_button: false,
      load_restore_button: false,
      modal_yoo_kassa: false,
      payment_url: '',
      auth_modal: false,
      load_sync_button: false,
      store_prices: {},
    }

    this.read_1_month = 99;
    this.read_6_month = 499;
    this.read_1_year = 799;
    this.read_forever = 2490;
  }

  async componentDidMount() {
    if (appStore.type_payment == 'by_store') {
      try {
        const ids = ['read_1_month', 'read_6_month', 'read_1_year', 'read_forever'];
        const products = await Purchases.getProducts(ids);
        const prices = {};
        products.forEach(p => { prices[p.identifier] = p.priceString; });
        this.setState({ store_prices: prices });
      } catch (e) {}
    }
  }

  cancelSubscription() {
    new Storage().set('has_subscription', 'false');
    this.props.root.setState({
      has_subscription: false,
    });
  }

  async checkSubscription() {
    this.setState({
      load_check_status_button: true
    });

    var result = await this.props.root.checkSubscription();

    this.setState({
      load_check_status_button: false
    });

    if (result == false) {
      Alert.alert('У Вас нет активных покупок.');
    }
  }

  async setActiveSubscription(active_subscription) {
    await this.setState({
      active_subscription: active_subscription
    });
  }

  async initPayment(subscription_id) {
    AppMetrica.reportEvent('initPayment', { type_payment: appStore.type_payment, subscription_id: subscription_id });
    if (appStore.type_payment == 'by_store') {
      this.payByStore(subscription_id);
    } else {
      this.payBySite(subscription_id);
    }
  }

  async initSubscriptionPayment() {
    this.initPayment(this.state.active_subscription);
  }

  async initForeverPayment() {
    this.initPayment(4);
  }

  async payByStore(subscription_id) {
    if (this.state.load_payment_button) return;
    try {
      this.setState({ load_payment_button: true });

      if (subscription_id == 1) var productId = 'read_1_month';
      if (subscription_id == 2) var productId = 'read_6_month';
      if (subscription_id == 3) var productId = 'read_1_year';
      if (subscription_id == 4) var productId = 'read_forever';

      const products = await Purchases.getProducts([productId]);
      if (!products || products.length === 0) {
        throw new Error('Product not found: ' + productId);
      }

      await Purchases.purchaseStoreProduct(products[0]);

      await this.props.root.checkSubscription();
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.warn('IAP error:', error);
        if (error.message && error.message.startsWith('Product not found')) {
          Alert.alert('Недоступно', 'Продукт временно недоступен в App Store. Попробуйте позже.');
        } else {
          Alert.alert('Ошибка покупки', error.message || 'Неизвестная ошибка. Попробуйте ещё раз.');
        }
      }
    } finally {
      this.setState({ load_payment_button: false });
    }
  }

  async payBySite(subscription_id) {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      if (this.state.load_payment_button == false) {
        this.setState({
          load_payment_button: true
        });

        var response = await new Request('/api/v1/payments', {
          user_id: this.props.root.state.current_user.id,
          subscription_id: subscription_id,
          app_payment: 'true'
        }, {}).post();

        this.setState({
          load_payment_button: false
        });

        if (response != false) {
          this.setState({
            modal_yoo_kassa: true,
            payment_url: response.payment_url
          });
        }
      }
    }
  }

  closeYooKassa() {
    this.props.root.checkSubscription();

    this.setState({
      modal_yoo_kassa: false
    });
  }

  async sync_subscription() {
    if (this.props.root.state.current_user == false) {
      this.setState({
        auth_modal: true
      });
    } else {
      await this.setState({
        load_sync_button: true
      });

      await this.props.root.sync_subscription_with_server(
        this.props.root.state.current_user.id,
        this.props.root.state.subscription_info.subscription_id,
        moment(this.props.root.state.subscription_info.end_date).format('YYYY-MM-DD'),
      );

      await this.setState({
        load_sync_button: false
      });

      Alert.alert("Данные синхронизированы");
    }
  }

  async restorePurchases() {
    try {
      this.setState({ load_restore_button: true });
      const customerInfo = await Purchases.restorePurchases();
      const proEntitlement = customerInfo.entitlements.active['pro'];
      if (proEntitlement) {
        await this.props.root.checkSubscription();
        Alert.alert('Готово', 'Покупка восстановлена.');
      } else {
        Alert.alert('Покупки не найдены', 'Активных покупок для этого Apple ID не найдено.');
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось восстановить покупки. Попробуйте позже.');
    } finally {
      this.setState({ load_restore_button: false });
    }
  }

  getPrice(productId, fallback) {
    const s = this.state.store_prices[productId];
    return s || fallback + ' ₽';
  }

  getDiscount(monthlyTotal, months) {
    const monthly = this.read_1_month;
    const perMonth = monthlyTotal / months;
    return Math.round((1 - perMonth / monthly) * 100);
  }

  getButtonLabel() {
    const { active_subscription } = this.state;
    if (appStore.type_payment == 'by_store') {
      if (active_subscription == 1) return 'Подписаться за ' + this.getPrice('read_1_month', this.read_1_month);
      if (active_subscription == 2) return 'Подписаться за ' + this.getPrice('read_6_month', this.read_6_month);
      if (active_subscription == 3) return 'Подписаться за ' + this.getPrice('read_1_year', this.read_1_year);
      if (active_subscription == 4) return 'Купить за ' + this.getPrice('read_forever', this.read_forever);
    } else {
      if (active_subscription == 1) return 'Оплатить 1 месяц — ' + this.read_1_month + ' ₽';
      if (active_subscription == 2) return 'Оплатить 6 месяцев — ' + this.read_6_month + ' ₽';
      if (active_subscription == 3) return 'Оплатить 1 год — ' + this.read_1_year + ' ₽';
      if (active_subscription == 4) return 'Купить навсегда — ' + this.read_forever + ' ₽';
    }
  }

  can_show_pricing() {
    var can_show = true;
    if (this.props.root.state.has_subscription == true) {
      if (this.props.root.state.subscription_info != undefined) {
        can_show = this.props.root.state.subscription_info.subscription_id != 4;
      }
    }

    return can_show;
  }

  range_of_subscription(subscription_id) {
    var texts = {
      '1': '1 месяц',
      '2': '6 месяцев',
      '3': '1 год'
    }

    return texts[subscription_id];
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>

        <Modal
          animationType="slide"
          presentationStyle={'overFullScreen'}
          visible={this.state.auth_modal && this.props.root.state.current_user == false}>
          <Auth method={this.state.auth_method} modal={true} close={() => this.setState({ auth_modal: false })} />
        </Modal>

        <Modal
          animationType="fade"
          presentationStyle={'overFullScreen'}
          transparent={true}
          visible={this.state.modal_yoo_kassa}
        >
          <View activeOpacity={1} style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <View style={{ backgroundColor: '#FFF', flex: 1, flexDirection: 'column', marginTop: 40, borderRadius: 10 }}>
              <View style={{
                height: 55, flexDirection: 'row', justifyContent: 'flex-end', borderBottomColor: '#ddd', borderBottomWidth: 1
              }}>
                <TouchableOpacity onPress={() => this.closeYooKassa()} style={{ width: 35, height: 35, backgroundColor: '#ddd', borderRadius: 7, margin: 10 }}>
                  <Image
                    style={{ height: 20, width: 20, margin: 7.5 }}
                    source={require('./app/images/header/right-menu-close.png')}
                  />
                </TouchableOpacity>

              </View>
              <View style={{ flex: 1 }}>
                <WebView
                  source={{
                    uri: this.state.payment_url,
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView style={{ flex: 1 }} >

          <View style={{ marginLeft: 30, marginRight: 30, }}>

            <React.Fragment>
              {this.props.root.state.has_subscription == true ? (
                <React.Fragment>
                  <View style={{ marginTop: 30, borderRadius: 10, backgroundColor: '#eee', padding: 10 }}>
                    {this.props.root.state.subscription_info.subscription_id == 4 ? (
                      <React.Fragment>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          У вас активирован
                        </Text>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          вечный PRO-доступ
                        </Text>
                      </React.Fragment>
                    ) : (
                      <React.Fragment>
                        <Text style={{ textAlign: 'center', fontSize: 18 }}>
                          Ваш PRO-доступ активен до:
                        </Text>
                        <View style={{ marginTop: 5 }}>
                          <Text style={{ textAlign: 'center', fontSize: 18, marginTop: 5, fontWeight: 'bold', color: '#f05458' }}> {moment(this.props.root.state.subscription_info.end_date).format('DD.MM.YYYY')}</Text>
                        </View>
                      </React.Fragment>
                    )}
                  </View>

                  {appStore.type_payment == 'by_store' &&
                    <React.Fragment>
                      <TouchableOpacity onPress={() => this.sync_subscription()} style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 5 }}>
                        {this.state.load_sync_button == true ? (
                          <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                        ) : (
                          <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16 }}>Синхронизировать с сайтом</Text>
                        )}
                      </TouchableOpacity>
                      <Text style={{ marginTop: 10 }}>
                        Если вы оплатили подписку через AppStore, но на сайте ваша подписка не отображается, синхронизуруйте данные.
                      </Text>
                    </React.Fragment>
                  }
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 25,
                    fontWeight: 'bold',
                    marginTop: 30,
                  }}>
                    У Вас нет активного PRO-доступа
                  </Text>

                  {(this.props.root.state.current_user || appStore.type_payment == 'by_store') &&
                    <TouchableOpacity onPress={() => this.checkSubscription()} style={{ marginTop: 15, marginLeft: 15, marginRight: 15, backgroundColor: '#f05458', height: 40, borderRadius: 5 }}>
                      {this.state.load_check_status_button == true ? (
                        <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                      ) : (
                        <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 40, fontSize: 16 }}>
                          Проверить статус
                        </Text>
                      )}
                    </TouchableOpacity>
                  }

                </React.Fragment>
              )}
              <View style={{ height: 1, backgroundColor: '#ddd', marginTop: 30 }}></View>
            </React.Fragment>


            {this.props.root.state.has_subscription == false &&
              <React.Fragment>
                <View style={{ marginTop: 30, flexDirection: 'column', justifyContent: 'center' }}>
                  {this.props.root.state.has_subscription == true ? (
                    <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>Продлить доступ</Text>
                  ) : (
                    <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>Приобрести PRO-доступ</Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 15 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/no_ads.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Выключить</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>рекламу</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/offline.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Чтение</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без интернета</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 15 }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/dictionary.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Словарь</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без ограничений</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <Image style={{ width: 50, height: 50, marginBottom: 10 }} source={require('./app/images/subscrition/voiceover.png')} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>Озвучка слов</Text>
                    <Text style={{ textAlign: 'center', fontSize: 16 }}>без ограничений</Text>
                  </View>
                </View>

                <Text style={{ marginTop: 15 }}>PRO-доступ распространяется на сайт <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text> и другие устройства, авторизованные под вашим аккаунтом.</Text>
              </React.Fragment>
            }

            {this.can_show_pricing() &&
              <React.Fragment>

                <Text style={{ marginTop: 20, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }}>
                  {appStore.type_payment == 'by_store' ? 'Варианты подписки:' : 'Варианты оплаты:'}
                </Text>

                <View style={{ marginTop: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, overflow: 'visible' }}>

                  {/* 1 месяц */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(1)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: '#FFF', padding: 15, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                      borderBottomWidth: 1, borderBottomColor: '#ddd',
                    }, this.state.active_subscription == 1 && {
                      borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2,
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 1 && { color: '#f05458' }]}>1 месяц</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_1_month', this.read_1_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{this.getPrice('read_1_month', this.read_1_month)}/мес</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* 6 месяцев */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(2)}>
                    <View style={[{
                      zIndex: 1, backgroundColor: '#FFF', padding: 15, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                      borderBottomWidth: 1, borderBottomColor: '#ddd',
                    }, this.state.active_subscription == 2 && {
                      borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2,
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 2 && { color: '#f05458' }]}>6 месяцев</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_6_month', this.read_6_month)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{(this.read_6_month / 6).toFixed(0)} руб/мес</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* 1 год */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(3)}>
                    <View style={[{
                      zIndex: 1, backgroundColor: '#FFF', padding: 15, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                      borderBottomWidth: 1, borderBottomColor: '#ddd',
                    }, this.state.active_subscription == 3 && {
                      borderBottomColor: '#f05458', borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2,
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 3 && { color: '#f05458' }]}>1 год</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>{this.getPrice('read_1_year', this.read_1_year)}</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{(this.read_1_year / 12).toFixed(0)} руб/мес</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                  {/* Навсегда */}
                  <TouchableWithoutFeedback onPress={() => this.setActiveSubscription(4)}>
                    <View style={[{
                      borderRadius: 10, zIndex: 1, backgroundColor: '#FFF', padding: 15, height: 85,
                      flexDirection: 'row', justifyContent: 'space-between',
                    }, this.state.active_subscription == 4 && {
                      borderColor: '#f05458', borderWidth: 1, transform: [{ scale: 1.1 }], zIndex: 2,
                    }]}>
                      <View>
                        <Text style={[{ fontSize: 22, fontWeight: 'bold', color: '#000' }, this.state.active_subscription == 4 && { color: '#f05458' }]}>Навсегда</Text>
                        <Text style={{ fontSize: 16, marginTop: 5 }}>Единоразовый платёж</Text>
                      </View>
                      <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18, textAlign: 'center' }}>{this.getPrice('read_forever', this.read_forever)}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>

                </View>

                {this.state.active_subscription == 4 &&
                  <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>Доступ оплачивается один раз — продлевать не нужно.</Text>
                }
                {appStore.type_payment == 'by_yoo_kassa' && this.state.active_subscription != 4 &&
                  <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>По окончании периода подписка не продлевается автоматически.</Text>
                }

                <TouchableOpacity
                  onPress={() => this.state.active_subscription == 4 ? this.initForeverPayment() : this.initSubscriptionPayment()}
                  style={{ marginTop: 15, backgroundColor: '#f05458', height: 50, borderRadius: 8 }}>
                  {this.state.load_payment_button == true ? (
                    <ActivityIndicator style={{ flex: 1 }} size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', textAlign: 'center', lineHeight: 50, fontSize: 16, fontWeight: 'bold' }}>
                      {this.props.root.state.has_subscription ? 'Продлить' : this.getButtonLabel()}
                    </Text>
                  )}
                </TouchableOpacity>

                {appStore.type_payment == 'by_store' &&
                  <TouchableOpacity onPress={() => this.restorePurchases()} style={{ marginTop: 12, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center' }}>
                    {this.state.load_restore_button ? (
                      <ActivityIndicator size="small" color="#888" />
                    ) : (
                      <Text style={{ color: '#555', textAlign: 'center', fontSize: 15 }}>Восстановить покупки</Text>
                    )}
                  </TouchableOpacity>
                }

              </React.Fragment>
            }

            <View style={{ marginTop: 30, marginBottom: 30, flexDirection: 'row', justifyContent: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_terms_and_conditions")} style={{ marginRight: 15 }}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14 }}>Terms of Use</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL("https://reedle.ru/apps_policy")} style={{}}>
                <Text style={{ color: '#aaa', textAlign: 'center', fontSize: 14 }}>Privacy policy</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: 'bold', marginTop: 5 }}>Подробности условий использования</Text>

            <Text style={{ fontSize: 13, marginTop: 8, color: '#555', lineHeight: 20 }}>
              Приложение распространяется бесплатно, без ограничений по времени. Автоматического списания средств нет.{'\n\n'}
              PRO-доступ можно приобрести на 1 месяц (99 ₽), 6 месяцев (499 ₽), 1 год (799 ₽) или навсегда (2 490 ₽). PRO убирает рекламу и открывает чтение без интернета.{'\n\n'}
              По окончании периода PRO-доступ не продлевается автоматически — для продления необходимо совершить покупку повторно в приложении или на сайте <Text onPress={() => Linking.openURL("https://reedle.ru")} style={{ color: app_theme_colors.red }}>read-en.ru</Text>. Пожизненный доступ продлевать не нужно.{'\n\n'}
              Возврат средств возможен только через поддержку Apple (для покупок через App Store). По другим вопросам пишите на read-en@yandex.ru.
            </Text>

            <View style={{ height: 40 }}></View>

          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
});
