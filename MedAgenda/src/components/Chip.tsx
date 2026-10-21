import { Pressable, Text } from 'react-native';

export function Chip({
  label, ativo, onPress,
}: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: ativo ? '#0a7ea4' : '#bbb',
        backgroundColor: ativo ? '#0a7ea4' : 'transparent',
      }}
    >
      <Text style={{ color: ativo ? '#fff' : '#333' }}>{label}</Text>
    </Pressable>
  );
}