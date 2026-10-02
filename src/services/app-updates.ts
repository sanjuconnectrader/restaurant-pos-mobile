import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/sanjuconnectrader/restaurant-pos-mobile/releases/latest';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
};

let lastCheckedAt = 0;
let activeCheck: Promise<void> | null = null;

export const currentAppVersion = Constants.expoConfig?.version ?? '0.0.0';

function versionNumbers(value: string) {
  const match = value.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

export function isNewerVersion(candidate: string, current: string) {
  const next = versionNumbers(candidate);
  const installed = versionNumbers(current);
  if (!next || !installed) return false;
  for (let index = 0; index < 3; index += 1) {
    if (next[index] !== installed[index]) return next[index] > installed[index];
  }
  return false;
}

async function openRelease(release: GitHubRelease) {
  const apk = release.assets.find((asset) => asset.name.toLowerCase().endsWith('.apk'));
  await Linking.openURL(apk?.browser_download_url ?? release.html_url);
}

async function runCheck(interactive: boolean) {
  if (Platform.OS !== 'android') {
    if (interactive) Alert.alert('Android updates only', 'APK updates are available on Android devices.');
    return;
  }

  try {
    const response = await fetch(`${LATEST_RELEASE_URL}?t=${Date.now()}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (response.status === 404) {
      if (interactive) Alert.alert('No release available', 'No APK release has been published yet.');
      return;
    }
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const release = await response.json() as GitHubRelease;
    if (!isNewerVersion(release.tag_name, currentAppVersion)) {
      if (interactive) Alert.alert('App is up to date', `Version ${currentAppVersion} is the latest version.`);
      return;
    }

    Alert.alert(
      'Update available',
      `ServeFlow POS ${release.tag_name.replace(/^v/i, '')} is ready. Download the APK, open it, and approve the Android installation prompt.`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Download update',
          onPress: () => {
            void openRelease(release).catch(() => {
              Alert.alert('Could not open download', 'Open the latest release from the ServeFlow POS GitHub repository.');
            });
          },
        },
      ],
    );
  } catch {
    if (interactive) Alert.alert('Update check failed', 'Check your internet connection and try again.');
  }
}

export function checkForAppUpdate({ force = false, interactive = false } = {}) {
  if (!force && Date.now() - lastCheckedAt < CHECK_INTERVAL_MS) return Promise.resolve();
  if (activeCheck) return activeCheck;

  lastCheckedAt = Date.now();
  activeCheck = runCheck(interactive).finally(() => { activeCheck = null; });
  return activeCheck;
}
