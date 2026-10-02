import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { checkForAppUpdate } from '../services/app-updates';
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
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      /> 
    </SafeAreaProvider>
  );
}
