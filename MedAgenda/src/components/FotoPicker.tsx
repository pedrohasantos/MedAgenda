import { Alert, Button, Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function FotoPicker({
  uri, onChange,
}: { uri: string | null; onChange: (uri: string | null) => void }) {
  async function escolher() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permissão negada', 'Libere o acesso às fotos nas configurações.');
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!r.canceled) onChange(r.assets[0].uri);
  }

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {uri && (
        <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 60 }} />
      )}
      <Button title={uri ? 'Trocar foto' : 'Escolher foto'} onPress={escolher} />
      {uri && <Button title="Remover foto" color="#c00" onPress={() => onChange(null)} />}
    </View>
  );
}