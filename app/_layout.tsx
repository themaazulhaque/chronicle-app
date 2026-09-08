import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { colors } from '../src/theme';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { AppSkeleton } from '../src/components/AppSkeleton';

function RootLayoutNav() {
  const { isReady } = useAuth();

  if (!isReady) {
    return <AppSkeleton />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="app/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
