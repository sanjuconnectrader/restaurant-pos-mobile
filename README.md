# ServeFlow POS

Expo SDK 57 mobile client. The Express/Supabase PostgreSQL backend is maintained in the separate [react-native-backend](https://github.com/sanjuconnectrader/react-native-backend) repository.

## Run locally

1. Clone the backend repository alongside this one and configure its `.env` with the Supabase PostgreSQL connection from the project's **Connect** dialog. Run `npm run migrate` inside the backend checkout, then `npm run dev`. The terminal should report PostgreSQL connected and POS API listening on port 5000. `http://localhost:5000/health` should return `status: up`.
2. From `C:\posapp`, run `npx expo start --dev-client --clear`. Open the QR code with the installed development build on a phone on the same Wi-Fi. Receipt printer discovery requires that build.
3. By default, the mobile client uses the computer address provided by Expo and calls port 5000. For a release build, tunnel, or a different backend address, set `EXPO_PUBLIC_API_URL` to the complete `/api` URL (see `.env.example`) before starting Expo.

On a phone, `localhost` means the phone itself. Verify `http://YOUR_COMPUTER_LAN_IP:5000/health` opens in the phone browser if API requests fail. Keep the backend and Expo terminals running.

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

## Android production updates

The production EAS build profile uses the `production` update channel. After the client installs a **release APK built with that profile**, pushes to the GitHub `production` branch publish Android JavaScript and asset changes through [EAS Update](https://docs.expo.dev/eas-update/introduction/). The app downloads an available update when opened and normally applies it after another restart. A development or preview APK will not receive production updates.

Before enabling the workflow in `.github/workflows/production-update.yml`:

1. Create an Expo access token for the account that owns the EAS project and save it as the GitHub Actions repository secret `EXPO_TOKEN`.
2. Set the GitHub Actions repository variable `EXPO_PUBLIC_API_URL` to the reachable release backend URL ending in `/api`. Use the same URL when building the APK. This value is bundled into the app and is not a secret.
3. Build and test the client APK with `npx eas-cli@latest build --profile production-apk --platform android` and give the client that APK. You can also run the **Build production APK** workflow from GitHub Actions. Keep the app version in `app.json` aligned with this build; EAS Update matches by channel and runtime version.
4. Use the `production` GitHub branch for client releases. Its first push only creates the branch; subsequent pushes run lint, typecheck, and publish to the production channel. Review the GitHub Actions result for each push.

Changes to native dependencies, `app.json`, `eas.json`, or the lockfile require a new APK. The workflow rejects those changes. Increment the app version for a new native release, rebuild and distribute the APK, then resume JavaScript updates. A GitHub push does not create a phone notification; an in-app prompt would require separate app code.
