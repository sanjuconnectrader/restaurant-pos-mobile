# ServeFlow POS

Expo SDK 57 mobile client. The Express/Supabase PostgreSQL backend is maintained in the separate [react-native-backend](https://github.com/sanjuconnectrader/react-native-backend) repository.

## Run locally

1. From `C:\posapp`, run `npx expo start --dev-client --clear`. Open the QR code with the installed development build. Receipt printer discovery requires that build.
2. The mobile client calls `https://react-native-backend-9ojm.onrender.com/api` by default. Check `https://react-native-backend-9ojm.onrender.com/health` if API requests fail.
3. To use a local backend, clone the [backend repository](https://github.com/sanjuconnectrader/react-native-backend) alongside this one, configure its `.env`, and run it. Set `EXPO_PUBLIC_API_URL` in `.env.local` to `http://YOUR_COMPUTER_LAN_IP:5000/api` before starting Expo. The phone and computer must be on the same network.

## Receipt printers

The receipt screen can scan nearby BLE printers and USB printers attached through Android OTG. Select a discovered device to connect and save it, then tap **Print receipt**. The app sends ESC/POS commands directly to the selected printer; without a selection, it opens the operating system print dialog.

An Android debug build is available at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on the phone, or create another development build with `npx eas-cli@latest build --profile development --platform android`, then start Metro with `npx expo start --dev-client`. Expo Go cannot load the Bluetooth and USB native printer modules. BLE printing currently supports printers exposing the Nordic UART service (`6e400001-b5a3-f393-e0a9-e50e24dcca9e`); Bluetooth Classic printers need a model-specific integration. USB printing requires a compatible bulk output interface and Android USB permission. Verify discovery, connection, and output with the actual printer hardware.

## Structure

- `src/app/`: Expo Router screens and navigation.
- `src/api/`: typed backend calls, token refresh, and error handling.
- `src/store/`: secure session and onboarding state.
- `src/services/`: shared Socket.IO connection.
- `src/ui/`: responsive components, colors, and SVG icons.
- Backend repository: API, PostgreSQL models, and real-time events.

## Checks

Run `npx expo lint`, `npx tsc --noEmit`, and `npx expo-doctor` in the mobile project. Run `npm test` and `npm run lint` in the backend checkout.

## Android releases and updates

Production updates are distributed as signed APK files through [GitHub Releases](https://github.com/sanjuconnectrader/restaurant-pos-mobile/releases). The installed Android app checks the latest release at launch, at most once every six hours, and also provides **More → Check for updates**. When a newer semantic version is available, the app opens the APK download and Android asks the user to approve installation.

To publish a release:

1. Increase `expo.version` in `app.json`, for example from `1.0.0` to `1.0.1`. Every client release must have a new version.
2. Ensure the GitHub Actions secret `EXPO_TOKEN` is valid and the repository variable `EXPO_PUBLIC_API_URL` points to the public backend URL ending in `/api`.
3. Push the version change to the `production` branch. The **Build production APK** workflow starts automatically, runs lint and typecheck, creates a signed APK, and publishes it as a GitHub Release named after the app version. You can also start it manually from the Actions page.
4. Install the first APK manually on the client's Android device. Future releases trigger an in-app update prompt. The user downloads the APK and approves Android's installation screen; silent installation is not available to ordinary apps.

All APK releases must use the same Android application ID and signing key. EAS Build currently stores that signing key and increments the Android version code. This workflow uses EAS Build's available plan quota for compilation, while update delivery is handled by GitHub Releases rather than EAS Update.
