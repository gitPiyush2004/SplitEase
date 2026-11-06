import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ToastProvider } from '@/components/common/Toast';
import { colors } from '@/constants/theme';
import { AppProvider } from '@/context/AppContext';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // If fonts fail to load we continue with system fonts rather than block the app.
  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="groups/create" />
            <Stack.Screen name="groups/[id]" />
            <Stack.Screen name="expenses/create" />
            <Stack.Screen name="expenses/[id]" />
            <Stack.Screen name="settlements/create" />
          </Stack>
        </AppProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
