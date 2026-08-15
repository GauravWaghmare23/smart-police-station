import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SocketProvider } from '../src/context/SocketContext';
import Loading from '../src/components/Loading';

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(citizen)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <Loading message="Initializing Smart Police Station..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(citizen)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <RootNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}
