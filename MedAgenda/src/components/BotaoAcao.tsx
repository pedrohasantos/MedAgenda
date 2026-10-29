import { Pressable, Text } from 'react-native';

export function BotaoAcao({
  titulo, cor = '#0a7ea4', preenchido = false, desabilitado = false, onPress,
}: {
  titulo: string;
  cor?: string;
  preenchido?: boolean;
  desabilitado?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={{
        flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center',
        borderWidth: 1, borderColor: cor,
        backgroundColor: preenchido ? cor : 'transparent',
        opacity: desabilitado ? 0.5 : 1,
      }}
    >
      <Text style={{ color: preenchido ? '#fff' : cor, fontWeight: 'bold', fontSize: 13 }}>{titulo}</Text>
    </Pressable>
  );
}