import { Button, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function Perfil() {
  const { session, role, signOut } = useAuth();
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text>{session?.user.email}</Text>
      <Text>Tipo de conta: {role}</Text>
      <Button title="Sair" onPress={signOut} />
    </View>
  );
}