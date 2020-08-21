Discourse Mobile App for a Single Site
--- 

This is a whitelisted app for a single Discourse forum. It is built with React Native and inspired by [DiscourseMobile](https://github.com/discourse/DiscourseMobile). For a demonstration check out SWAPD or TekInvestor on the App Store or Google Play.

# Platform Support

The primary platform this app is used on is iOS. This app also works on Android, and may support other React Native platforms in the future, however you should consider whether other solutions are more appropriate in those cases. 

Android notifications are now supported directly in the Discourse web app, making a mobile app like this uncessary for the delivery of push notifications on Android. In your Discourse instance, enable the `push notifications prompt` admin setting. In applicable browsers (including Chrome for Android) users will see a bar prompting them to enable notifications.

You may wish to have an app for your forum on multiple app stores for marketing purposes, however keep in mind that the focus of development for this repository is on the iOS version. If you wish to support the development of this app on other platforms you can reach out to contact@thepavilion.io.

# Deployment

To deploy your own version of this application to the iOS App Store, or the Google Play Store, you need to update the configuration and build the app locally. This is a guide to that process, however keep in mind that this is typically performed by a developer.

### 1. Generate 

# Development



## iOS 




#### Discourse Setup

- Add the [discourse-onesignal](https://github.com/pmusaraj/discourse-onesignal/) plugin to your Discourse instance and configure it by enable notifications, add your OneSignal App ID and the OneSignal REST API key.

- In your Discourse settings, add your site's home URL to `allowed user api auth redirects` (the app will redirect to your home URL once the user authorizes access for the app in Discourse).

#### OneSignal updates to native code


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


After renaming the app, you need to manually edit some files in subfolders under `android/app/src/main/java`, and replace `com.discosingle;` at the beginning of every file with your new bundle ID. The rename script does it for `MainActivity.java` and `MainApplication.java`, you need to manually do this for the remaining files. 

### Troubleshooting

- If you have already checked out the project, and renamed the app, you may run into a variety of file conflicts if you pull updates. This is especially the case if the React Native version in the project has been updated. This is normal, and a better course of action is to check out a fresh copy, and reapply your changes and the rename. 
