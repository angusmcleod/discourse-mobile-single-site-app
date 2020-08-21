#### Setup

This is a slightly modified version of the [React Native Getting Started](https://facebook.github.io/react-native/docs/getting-started.html) instructions for OSX.

1. Ensure xCode is up to date and you have the latest version of the Command Line Tools installed.

2. Install Node (if not already present)
```
brew install node
```

3. Copy the contents of `default.variables.js` to `app.variables.js` and set your app's variables.

#### Run

From the repository's root folder:

1. Navigate to the `ios` folder and install the app's CocoaPods
```
cd ios
pod install
```

2. Navigate back to the root folder and start the react native server

```
cd ..
npx react-native start
```
3. Open a new terminal tab and run the app
```
npx react-native run-ios