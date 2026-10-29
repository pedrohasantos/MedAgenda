import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { EventoConsulta, jaAdicionado, oferecerCalendario } from '../services/calendario';

export function BotaoCalendario({ evento }: { evento: EventoConsulta }) {
  const [adicionado, setAdicionado] = useState(false);

  useEffect(() => {
    jaAdicionado(evento.consultaId).then(setAdicionado);
  }, [evento.consultaId]);

  if (adicionado) {
    return (
      <Text style={{ color: '#15803d', textAlign: 'center', fontWeight: 'bold' }}>
        ✓ Adicionada ao calendário
      </Text>
    );
  }

  return (
    <Pressable
      onPress={() => oferecerCalendario(evento, () => setAdicionado(true))}
      style={{
        padding: 10, borderRadius: 8, alignItems: 'center',
        borderWidth: 1, borderColor: '#0a7ea4',
      }}
    >
      <Text style={{ color: '#0a7ea4', fontWeight: 'bold' }}>Adicionar ao calendário</Text>
    </Pressable>
  );
}