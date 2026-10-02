import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { useAuth } from '../store/auth';

export default function RootLayout() {
  const restore = useAuth((state) => state.restore);
  useEffect(() => { void restore(); }, [restore]);
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
