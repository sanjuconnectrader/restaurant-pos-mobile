import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { AppState } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppUpdateModal } from '../components/AppUpdateModal';
import { checkForAppUpdate } from '../services/app-update-manager';
import { colors } from '../theme/colors';
import { useAuth } from '../store/auth';

export default function RootLayout() {
  const restore = useAuth((state) => state.restore);
  useEffect(() => { void restore(); }, [restore]);
  useEffect(() => {
    void checkForAppUpdate();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkForAppUpdate();
    });
    return () => subscription.remove();
  }, []);
  return (
    <KeyboardProvider>
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      /> 
      <AppUpdateModal />
    </SafeAreaProvider>
    </KeyboardProvider>
  );
}
