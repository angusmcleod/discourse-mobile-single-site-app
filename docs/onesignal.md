You need to open a OneSignal account to be able to send push notifications from Discourse, and receive them in the app. 

1. Register an App ID on the Apple portal (developer.apple.com).
2. Open an account with [OneSignal](https://www.onesignal.com) (free), create a new app, and generate certificates for iOS.
3. Create provisioning profiles on the Apple portal. You need a distribution profile for pushing to TestFlight and the App Store, and an ad-hoc profile for testing quickly on your device. (Note that you may also need a development certificate for testing the app on your device. Step 2 above creates only the production certificate.)
4. Create an iCloud container and associate it with your App ID.