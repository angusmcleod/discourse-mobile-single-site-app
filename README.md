Discourse Mobile App for a Single Site (with support for Push Notifications)
--- 

Whitelisted iOS app for a single Discourse forum with push notification support via OneSignal. Built with React Native and inspired by [DiscourseMobile](https://github.com/discourse/DiscourseMobile). For a demonstration check out SWAPD or TekInvestor on the App Store or Google Play. 

## Android (deprecated)

This app's support for Android is deprecated as Android notifications are now supported directly in Discourse. In your Discourse instance, enable the `push notifications prompt` admin setting. In applicable browsers (incl. Chrome for Android) users will see a bar prompting them to enable notifications.

## iOS 

### Getting Started

This is a slightly modified version of the [React Native Getting Started](https://facebook.github.io/react-native/docs/getting-started.html) instructions. These instructions are for OSX.

1. Ensure your xCode is up to date and you have the latest version of the Command Line Tools installed.

2. Install Node (if not already present)
```
brew install node
```

3. Copy the contents of `default.variables.js` to `app.variables.js` and set your app's variables.

Starting from the root folder of this repository on your local machine:

4. Navigate to the `ios` folder in this repository and install its CocoaPods
```
cd ios
pod install
```

5. Navigate back to the main app folder and start the react native server

```
cd ..
npx react-native start
```
6. Open a new terminal tab and run the app
```
npx react-native run-ios
```

### OneSignal setup

You need to open a OneSignal account to be able to send push notifications from Discourse, and receive them in the app. 

1. Register an App ID on the Apple portal (developer.apple.com).
2. Open an account with [OneSignal](https://www.onesignal.com) (free), create a new app, and generate certificates for iOS.
3. Create provisioning profiles on the Apple portal. You need a distribution profile for pushing to TestFlight and the App Store, and an ad-hoc profile for testing quickly on your device. (Note that you may also need a development certificate for testing the app on your device. Step 2 above creates only the production certificate.)
4. Create an iCloud container and associate it with your App ID.

#### Discourse Setup

- Add the [discourse-onesignal](https://github.com/pmusaraj/discourse-onesignal/) plugin to your Discourse instance and configure it by enable notifications, add your OneSignal App ID and the OneSignal REST API key.

- In your Discourse settings, add your site's home URL to `allowed user api auth redirects` (the app will redirect to your home URL once the user authorizes access for the app in Discourse).

#### OneSignal updates to native code

In your app code for iOS replace the placeholder OneSignal App ID with your app's OneSignal App ID. 

- For iOS, look for `ONESIGNAL_APP_ID` in `ios/DiscoSingle/AppDelegate.m`.  

You should now be ready to build and test the app. Note that in iOS, Push Notifications can only be tested on a real device, but the OneSignal console will show attempts to enable Push Notifications from a simulator.

### Helpful Tools

#### Generating assets
Use [generator-rn-toolbox](https://github.com/bamlab/generator-rn-toolbox) to setup icons and splash screens for the app: 

```
npm install -g yo generator-rn-toolbox

yo rn-toolbox:assets --icon icon.png
yo rn-toolbox:assets --splash splash.png --android
yo rn-toolbox:assets --splash splash.png --ios
```

#### Logo for login screen
The logo file for the login screen is under `js/logo.png`. Replace it with your logo. 

#### Renaming your App

You can rename the app using `react-native-rename`. This is necessary for Android, because it's the only way to change the bundle ID. 

```
npm install react-native-rename -g
react-native-rename "NewName" -b com.yourco.yourappid
```

(The bundle name specified by `-b` above only applies to Android, to change your iOS bundle ID, use Xcode.)

After renaming the app, you need to manually edit some files in subfolders under `android/app/src/main/java`, and replace `com.discosingle;` at the beginning of every file with your new bundle ID. The rename script does it for `MainActivity.java` and `MainApplication.java`, you need to manually do this for the remaining files. 

### Troubleshooting

- If you have already checked out the project, and renamed the app, you may run into a variety of file conflicts if you pull updates. This is especially the case if the React Native version in the project has been updated. This is normal, and a better course of action is to check out a fresh copy, and reapply your changes and the rename. 
