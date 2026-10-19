import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootGuard() {
  const { session, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const grupo = segments[0]; // '(auth)' | '(cliente)' | '(admin)'

    if (!session) {
      if (grupo !== '(auth)') router.replace('/(auth)/login');
      return;
    }

    if (role === 'admin' && grupo !== '(admin)') router.replace('/(admin)');
    if (role === 'cliente' && grupo !== '(cliente)') router.replace('/(cliente)');
  }, [session, role, loading, segments]);

  return (
    <>
      <Slot />
      {loading && (
        <View
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
            alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  );
}