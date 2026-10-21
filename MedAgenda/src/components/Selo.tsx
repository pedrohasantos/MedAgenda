import { Text, View } from 'react-native';

const CORES: Record<string, { fundo: string; texto: string; rotulo: string }> = {
  agendada:   { fundo: '#dbeafe', texto: '#1d4ed8', rotulo: 'Agendada' },
  confirmada: { fundo: '#dcfce7', texto: '#15803d', rotulo: 'Confirmada' },
  cancelada:  { fundo: '#fee2e2', texto: '#b91c1c', rotulo: 'Cancelada' },
  realizada:  { fundo: '#e5e7eb', texto: '#374151', rotulo: 'Realizada' },
};

export function Selo({ status }: { status: string }) {
  const c = CORES[status] ?? { fundo: '#e5e7eb', texto: '#374151', rotulo: status };
  return (
    <View style={{ backgroundColor: c.fundo, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
      <Text style={{ color: c.texto, fontSize: 12, fontWeight: 'bold' }}>{c.rotulo}</Text>
    </View>
  );
}