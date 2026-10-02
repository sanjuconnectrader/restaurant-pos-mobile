import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { create } from 'zustand';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/sanjuconnectrader/restaurant-pos-mobile/releases/latest';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;

type GitHubRelease = {
  tag_name: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
};

type UpdatePhase = 'hidden' | 'available' | 'downloading' | 'opening' | 'error';

type AppUpdateState = {
  phase: UpdatePhase;
  progress: number;
  release: GitHubRelease | null;
  error: string | null;
  showRelease: (release: GitHubRelease) => void;
  setProgress: (progress: number) => void;
  setPhase: (phase: UpdatePhase) => void;
  setError: (error: string) => void;
  dismiss: () => void;
};

export const useAppUpdate = create<AppUpdateState>((set) => ({
  phase: 'hidden',
  progress: 0,
  release: null,
  error: null,
  showRelease: (release) => set({ phase: 'available', progress: 0, release, error: null }),
  setProgress: (progress) => set({ progress }),
  setPhase: (phase) => set({ phase, error: null }),
  setError: (error) => set({ phase: 'error', error }),
  dismiss: () => set({ phase: 'hidden', progress: 0, release: null, error: null }),
}));

let lastCheckedAt = 0;
let activeCheck: Promise<void> | null = null;
let activeDownload: Promise<void> | null = null;

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

function releaseApk(release: GitHubRelease | null) {
  return release?.assets.find((asset) => asset.name.toLowerCase().endsWith('.apk'));
}

export function latestVersionLabel(release: GitHubRelease | null) {
  return release?.tag_name.replace(/^v/i, '') ?? '';
}

export async function openUpdateRelease() {
  const release = useAppUpdate.getState().release;
  if (release) await Linking.openURL(release.html_url);
}

export function downloadAndInstallUpdate() {
  if (activeDownload) return activeDownload;

  const release = useAppUpdate.getState().release;
  const apk = releaseApk(release);
  if (!release || !apk || !FileSystem.cacheDirectory) {
    useAppUpdate.getState().setError('The APK download is unavailable. Try opening the release page instead.');
    return Promise.resolve();
  }

  const version = latestVersionLabel(release).replace(/[^0-9A-Za-z.-]/g, '-');
  const destination = `${FileSystem.cacheDirectory}ServeFlow-POS-v${version}.apk`;
  useAppUpdate.getState().setPhase('downloading');

  activeDownload = (async () => {
    const task = FileSystem.createDownloadResumable(
      apk.browser_download_url,
      destination,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite <= 0) return;
        useAppUpdate.getState().setProgress(
          Math.min(1, totalBytesWritten / totalBytesExpectedToWrite),
        );
      },
    );

    const result = await task.downloadAsync();
    if (!result?.uri) throw new Error('The APK download did not complete.');

    useAppUpdate.getState().setProgress(1);
    useAppUpdate.getState().setPhase('opening');
    const contentUri = await FileSystem.getContentUriAsync(result.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
      type: APK_MIME_TYPE,
    });
    useAppUpdate.getState().setPhase('available');
  })()
    .catch(() => {
      useAppUpdate.getState().setError(
        'The update could not be installed. Check your connection and allow ServeFlow POS to install unknown apps, then try again.',
      );
    })
    .finally(() => {
      activeDownload = null;
    });

  return activeDownload;
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

    if (!releaseApk(release)) {
      if (interactive) Alert.alert('Update unavailable', 'The latest release does not contain an APK.');
      return;
    }

    useAppUpdate.getState().showRelease(release);
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
