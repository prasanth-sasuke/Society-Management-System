import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '../auth/AuthContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <SplashController />
      <RootNavigator />
      <StatusBar style="dark" />
    </SessionProvider>
  );
}

function SplashController() {
  const { isLoading } = useSession();
  if (!isLoading) SplashScreen.hide();
  return null;
}

function RootNavigator() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
