import React, {Component} from 'react';
import {
  Keyboard,
  Dimensions,
  Linking,
  Text,
  View,
  SafeAreaView,
  TouchableHighlight,
  Platform,
  ScrollView,
  TextInput,
  Button,
  Image,
  AppState,
  BackHandler,
  Share,
} from 'react-native';

import OneSignal from 'react-native-onesignal';
import {WebView} from 'react-native-webview';
import AsyncStorage from '@react-native-community/async-storage';

import DeviceInfo from 'react-native-device-info';

import Manager from './Manager';
import Authenticate from './Authenticate';

const site = 'https://' + global.siteDomain;

function isValidUrl(s) {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
}

class App extends React.Component {
  constructor(props) {
    super(props);
    OneSignal.init(global.oneSignalAppId, {kOSSettingsKeyAutoPrompt: false});

    this.state = {
      uri: site,
      promptToConnect: false,
      skipLogin: true,
      appLoading: true,
      username: '',
      password: '',
      authError: '',
      keyboardVisible: false,
      landscapeLayout: false,
      appState: AppState.currentState,
      pushAuth: false,
      loggedIn: false,
      hideNotificationPrompt: false
    };
    
    this.clearKeys();

    this._Manager = new Manager();
    this._Auth = new Authenticate();
  }
  
  async clearKeys() {
    try {
      await AsyncStorage.removeItem('@Discourse.auth')
    } catch(e) {
      // remove error
    }
  }

  loadDiscourseAuth() {
    this._Manager.generateAuthURL().then(authUrl => {
      this.setState({uri: authUrl});
    });
  }

  checkAuthStatus() {
    this._Manager
      .getUserInfo()
      .then(user => {
        if (user && user.username) this.setState({loggedIn: true});
      })
      .catch(err => {})
      .done(done => {
        AsyncStorage.getItem('@Discourse.auth')
          .then(json => {
            if (json) {
              let auth = JSON.parse(json);
              if (auth.key) {
                this.setState({pushAuth: true});
              }
            }
          })
          .catch(err => {
            console.log('.auth error');
            console.log(err);
          })
          .done(done => {
            this.setState({appLoading: false});
          });
      });
  }

  componentDidMount() {
    OneSignal.addEventListener('ids', this.onIds);
    OneSignal.addEventListener('opened', this._onOpened.bind(this));
    OneSignal.inFocusDisplaying(global.inAppNotification);

    AppState.addEventListener('change', this._handleAppStateChange);

    // Android only: clear notifications (badge count) when user is in app
    if (Platform.OS !== 'ios') {
      OneSignal.clearOneSignalNotifications();
    }

    AsyncStorage.getItem('@Discourse.skipLogin').then(json => {
      console.log('skip login: ', json)
      if (json && json === 'loginSkipped') {
        this.setState({skipLogin: true});
      }
    });

    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow.bind(this),
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide.bind(this),
    );

    this.checkAuthStatus();

    BackHandler.addEventListener(
      'hardwareBackPress',
      this._backHandler.bind(this),
    );

    this._dimensionsChanged();
    Dimensions.addEventListener('change', () => {
      this._dimensionsChanged();
    });
  }

  _dimensionsChanged() {
    const {width, height} = Dimensions.get('window');
    this.setState({landscapeLayout: width > height});
  }

  componentWillUnmount() {
    OneSignal.removeEventListener('ids', this.onIds);
    OneSignal.removeEventListener('opened', this._onOpened);

    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();

    BackHandler.removeEventListener('hardwareBackPress', this._backHandler);
  }

  _backHandler = () => {
    this.webview.goBack();
    return true;
  };

  _handleAppStateChange = nextAppState => {
    console.log('APPSTATE: ' + nextAppState);
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      if (Platform.OS !== 'ios') {
        OneSignal.clearOneSignalNotifications();
      }
    }
    this.setState({appState: nextAppState});
  };

  onIds(device) {
    // TODO: should this be handled differently?
    if (device.userId) {
      AsyncStorage.setItem('@Discourse.clientId', device.userId);
    }
  }

  _userLogin() {
    console.log('user login called');
    self = this;
    this._Auth
      .login(this.state.username, this.state.password)
      .then(json => {
        this._Manager.generateAuthURL().then(authUrl => {
          AsyncStorage.setItem('@Discourse.skipLogin', 'loginSkipped');
          this.setState({
            uri: authUrl,
            authError: '',
            skipLogin: true,
          });
        });
      })
      .catch(err => {
        console.log(err);
        if (err.error) this.setState({authError: err.error});
        else this.setState({authError: 'Error: Could not login.'});
      })
      .done();
  }

  skipWelcomeScreen() {
    this.setState({skipLogin: true});
    AsyncStorage.setItem('@Discourse.skipLogin', 'loginSkipped');
  }

  createAccount() {
    AsyncStorage.setItem('@Discourse.skipLogin', 'loginSkipped');
    this.setState({
      uri: isValidUrl(global.acctUrl) ? global.acctUrl : site + global.acctUrl,
      authError: '',
      skipLogin: true,
    });
  }

  primaryStartAction() {
    AsyncStorage.setItem('@Discourse.skipLogin', 'loginSkipped');
    this.setState({
      uri: isValidUrl(global.primaryStartUrl)
        ? global.primaryStartUrl
        : site + global.primaryStartUrl,
      authError: '',
      skipLogin: true,
    });
  }

  TOS() {
    AsyncStorage.setItem('@Discourse.skipLogin', 'loginSkipped');
    this.setState({
      uri: isValidUrl(global.TOSUrl) ? global.TOSUrl : site + global.TOSUrl,
      authError: '',
      skipLogin: true,
    });
  }

  _onOpened(openResult) {
    if (
      openResult.notification.payload &&
      openResult.notification.payload.additionalData &&
      openResult.notification.payload.additionalData.discourse_url
    ) {
      var path = openResult.notification.payload.additionalData.discourse_url;
      this.setState({uri: site + path});
    }
  }

  _keyboardDidShow(e) {
    this.setState({keyboardVisible: true});
  }
  _keyboardDidHide(e) {
    this.setState({keyboardVisible: false});
  }
  invokeAuthRedirect(url) {
    let split = url.split('payload=');
    console.log("Invoking: ", url)
    if (split.length === 2) {
      console.log("Registering for push")
      OneSignal.registerForPushNotifications({
        modalPrompt: true
      });
      this._Manager.handleAuthPayload(decodeURIComponent(split[1]));
      this.checkAuthStatus();
    }
  }
  _onNavigationStateChange(event) {
    if (event.loading && event.url.includes(`?payload=`)) {
      this.invokeAuthRedirect(event.url);
    }
    
    // open device browser for external links in Android
    const internalLink = global.internalURLs.some(v => event.url.includes(v));

    if (event.url.indexOf(site) === -1 && !internalLink) {
      this.webview.stopLoading();
      if (Platform.OS === 'android') {
        Linking.openURL(event.url);
      }
      return false;
    }
  }
  _handleMessage(event) {
    let data = JSON.parse(event.nativeEvent.data);

    if (data.shareUrl !== undefined) {
      Share.share({
        url: data.shareUrl,
      });
    }
  }
  _onShouldStartLoadWithRequest(event) {
    // open device browser for external links
    if (event.url.includes('about:')) {
      return false;
    }
    const internalLink = global.internalURLs.some(v => event.url.includes(v));
    const fileDownload = ['.pdf'].some(v => event.url.includes(v));

    // onShouldStartLoadWithRequest is sometimes triggered by ajax requests (ads, etc.)
    // this is a workaround to avoid launching Safari for these events
    if (
      event.mainDocumentURL !== undefined &&
      event.url !== event.mainDocumentURL
    ) {
      return true;
    }

    if (
      (Platform.OS === 'ios' &&
        (event.url.indexOf(site) === -1 && !internalLink)) ||
      fileDownload
    ) {
      Linking.openURL(event.url);
      return false;
    }
    return true;
  }
  _renderError(e1, e2, e3) {
    return (
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <Text
          style={{
            color: global.textColor,
            fontSize: 16,
            paddingVertical: 10,
          }}>
          {e1} ({e2})
        </Text>
        <Text
          style={{
            color: global.textColor,
            fontSize: 14,
          }}>
          {e3}
        </Text>
        <TouchableHighlight
          style={{
            backgroundColor: global.buttonColor,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 3,
            marginTop: 50,
          }}
          onPress={e => {
            this.webview.reload();
          }}>
          <Text
            style={{
              color: '#FFF',
              fontSize: 20,
              alignItems: 'center',
            }}>
            Refresh
          </Text>
        </TouchableHighlight>
      </View>
    );
  }
  renderWebView() {
    return (
      <WebView
        ref={ref => {
          this.webview = ref;
        }}
        source={{uri: this.state.uri}}
        startInLoadingState={false}
        bounces={true}
        mixedContentMode="always"
        sharedCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        onNavigationStateChange={this._onNavigationStateChange.bind(this)}
        onMessage={e => this._handleMessage(e)}
        onShouldStartLoadWithRequest={this._onShouldStartLoadWithRequest.bind(
          this,
        )}
        renderError={this._renderError.bind(this)}
        useWebKit={true}
      />
    );
  }

  renderLoginForm() {
    return (
      <View style={{paddingVertical: 10}}>
        <View style={{paddingVertical: 10}}>
          <TextInput
            placeholder={global.usernamePlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
            returnKeyType={'next'}
            keyboardType="email-address"
            value={this.state.username}
            style={{
              color: global.textColor,
              paddingVertical: 5,
              borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
              borderColor: global.buttonColor,
              height: 36,
            }}
            underlineColorAndroid={global.textColor}
            onChangeText={text => this.setState({username: text})}
          />
        </View>
        <View style={{paddingVertical: 10}}>
          <TextInput
            placeholder={global.passwordPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
            returnKeyType={'go'}
            value={this.state.password}
            style={{
              color: global.textColor,
              paddingVertical: 5,
              borderBottomWidth: Platform.OS === 'ios' ? 1 : 0,
              borderColor: global.buttonColor,
              height: 36,
            }}
            underlineColorAndroid={global.textColor}
            onSubmitEditing={e => {
              this._userLogin(e);
            }}
            onChangeText={text => this.setState({password: text})}
          />
        </View>
        <View>
          <Text
            style={{
              color: global.textColor,
              fontSize: 16,
              paddingVertical: 10,
            }}>
            {this.state.authError}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 10,
          }}>
          <View
            style={{
              flex: 1,
              paddingHorizontal: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <TouchableHighlight
              style={{
                backgroundColor: global.buttonColor,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 3,
              }}
              onPress={e => {
                this._userLogin(e);
              }}>
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 18,
                  alignItems: 'center',
                }}>
                {global.loginText}
              </Text>
            </TouchableHighlight>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: 'center',
            }}>
            <TouchableHighlight
              onPress={() => {
                this.skipWelcomeScreen();
              }}>
              <Text style={{color: global.textColor, fontSize: 16}}>
                {global.skipText}
              </Text>
            </TouchableHighlight>
          </View>
        </View>
        {!this.state.keyboardVisible && global.acctText != '' && (
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              paddingVertical: 10,
              alignItems: 'center',
            }}>
            <TouchableHighlight
              onPress={() => {
                this.createAccount();
              }}>
              <Text style={{color: global.textColor, fontSize: 14}}>
                {global.acctText}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </View>
    );
  }
  renderStartButtons() {
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <TouchableHighlight
            style={{
              backgroundColor: global.buttonColor,
              paddingVertical: 8,
              paddingHorizontal: 20,
              borderRadius: 3,
            }}
            onPress={() => {
              this.primaryStartAction();
            }}>
            <Text
              style={{
                color: global.primaryStartButtonTextColor,
                fontSize: 18,
                alignItems: 'center',
              }}>
              {global.primaryStartButtonText}
            </Text>
          </TouchableHighlight>
        </View>
        {global.secondaryStartButtonText != '' && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <TouchableHighlight
              onPress={() => {
                this.createAccount();
              }}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
              }}>
              <Text style={{color: global.textColor, fontSize: 15}}>
                {global.secondaryStartButtonText}
              </Text>
            </TouchableHighlight>
          </View>
        )}
      </View>
    );
  }

  render() {
    if (this.state.appLoading) return false;
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: global.bgColor,
        }}>
        {!this.state.pushAuth &&
          this.state.loggedIn &&
          !this.state.hideNotificationPrompt && (
          <View
            style={{
              flex: 0,
              flexDirection: 'row',
            }}>
            <TouchableHighlight
              style={{
                backgroundColor: global.connectButtonBgColor,
                padding: 20,
                flex: 1
              }}
              onPress={() => {
                this.loadDiscourseAuth();
              }}>
              <Text
                style={{
                  color: global.connectButtonTextColor,
                  fontSize: 18,
                  paddingLeft: 8,
                  paddingRight: 8,
                  fontFamily: 'HelveticaNeue-Medium',
                  textAlign: 'center'
                }}>
                {global.connectText}
              </Text>
            </TouchableHighlight>
            <TouchableHighlight
              style={{
                backgroundColor: global.connectButtonBgColor,
                padding: 20,
                flex: 0,
                position: 'absolute',
                right: 0,
                top: 5
              }}
              onPress={() => {
                this.setState({ hideNotificationPrompt: true });
              }}>
              <Text
                style={{
                  color: global.connectButtonTextColor,
                  fontSize: 18,
                  paddingLeft: 8,
                  paddingRight: 8,
                  fontFamily: 'HelveticaNeue-Medium',
                  textAlign: 'center'
                }}>
                ⨉
              </Text>
            </TouchableHighlight>
          </View>
        )}
        {this.state.uri && this.renderWebView()}
      </SafeAreaView>
    );
  }
}

export default App;
