import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ headerTitleAlign: 'center' }}>
      <Tabs.Screen name="index" options={{ title: 'Início',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="unidades" options={{ title: 'Unidades',
        tabBarIcon: ({ color, size }) => <Ionicons name="business" color={color} size={size} /> }} />
      <Tabs.Screen name="profissionais" options={{ title: 'Profissionais',
        tabBarIcon: ({ color, size }) => <Ionicons name="medkit" color={color} size={size} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}