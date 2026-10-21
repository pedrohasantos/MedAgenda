import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FotoSegura } from '../../components/FotoSegura';
import { Consulta, cancelarConsulta, minhasConsultas } from '../../services/consultas';

const FUSO = 'America/Sao_Paulo';
const ATIVAS = ['agendada', 'confirmada'];

function formatarData(iso: string) {
  const texto = new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', timeZone: FUSO,
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: FUSO,
  });
}

const CORES: Record<string, { fundo: string; texto: string; rotulo: string }> = {
  agendada:   { fundo: '#dbeafe', texto: '#1d4ed8', rotulo: 'Agendada' },
  confirmada: { fundo: '#dcfce7', texto: '#15803d', rotulo: 'Confirmada' },
  cancelada:  { fundo: '#fee2e2', texto: '#b91c1c', rotulo: 'Cancelada' },
  realizada:  { fundo: '#e5e7eb', texto: '#374151', rotulo: 'Realizada' },
};

function Selo({ status }: { status: string }) {
  const c = CORES[status] ?? { fundo: '#e5e7eb', texto: '#374151', rotulo: status };
  return (
    <View style={{ backgroundColor: c.fundo, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 }}>
      <Text style={{ color: c.texto, fontSize: 12, fontWeight: 'bold' }}>{c.rotulo}</Text>
    </View>
  );
}

export default function ClienteInicio() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [aba, setAba] = useState<'proximas' | 'historico'>('proximas');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const carregar = useCallback(async (puxando = false) => {
    try {
      if (puxando) setAtualizando(true);
      setConsultas(await minhasConsultas());
    } catch (e: any) {
      Alert.alert('Erro ao carregar consultas', e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // recarrega toda vez que a aba ganha foco (ex.: depois de agendar)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const agora = Date.now();
  const proximas = consultas
    .filter((c) => ATIVAS.includes(c.status) && new Date(c.fim).getTime() > agora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  const historico = consultas
    .filter((c) => !proximas.includes(c))
    .sort((a, b) => b.inicio.localeCompare(a.inicio));

  const lista = aba === 'proximas' ? proximas : historico;

  function cancelar(c: Consulta) {
    Alert.alert(
      'Cancelar consulta',
      `${c.profissional?.nome ?? 'Consulta'}\n${formatarData(c.inicio)} às ${formatarHora(c.inicio)}\n\nDeseja realmente cancelar?`,
      [
        { text: 'Manter', style: 'cancel' },
        {
          text: 'Cancelar consulta',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelandoId(c.id);
              await cancelarConsulta(c.id);
              await carregar();
            } catch (e: any) {
              Alert.alert('Não foi possível cancelar', e.message);
            } finally {
              setCancelandoId(null);
            }
          },
        },
      ]
    );
  }

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Abas internas */}
      <View style={{ flexDirection: 'row', padding: 16, gap: 8 }}>
        {(['proximas', 'historico'] as const).map((k) => {
          const ativo = aba === k;
          const total = k === 'proximas' ? proximas.length : historico.length;
          return (
            <Pressable
              key={k}
              onPress={() => setAba(k)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                backgroundColor: ativo ? '#0a7ea4' : '#f3f4f6',
              }}
            >
              <Text style={{ color: ativo ? '#fff' : '#333', fontWeight: 'bold' }}>
                {k === 'proximas' ? 'Próximas' : 'Histórico'} ({total})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={lista}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} />}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>
              {aba === 'proximas'
                ? 'Você não tem consultas marcadas.\nVá na aba Agendar para marcar uma.'
                : 'Nenhuma consulta no histórico.'}
            </Text>
          </View>
        }
        renderItem={({ item: c }) => {
          const podeCancelar = aba === 'proximas' && ATIVAS.includes(c.status);
          return (
            <View
              style={{
                borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
                backgroundColor: '#fff', gap: 10, opacity: aba === 'historico' ? 0.85 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 15 }}>{formatarData(c.inicio)}</Text>
                <Selo status={c.status} />
              </View>

              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0a7ea4' }}>
                {formatarHora(c.inicio)} – {formatarHora(c.fim)}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <FotoSegura path={c.profissional?.foto_path ?? null} tamanho={48} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>
                    {c.profissional?.nome ?? 'Profissional indisponível'}
                  </Text>
                  <Text style={{ color: '#555' }}>{c.consultorio?.nome ?? 'Unidade indisponível'}</Text>
                  {!!c.consultorio?.endereco && (
                    <Text style={{ color: '#888', fontSize: 12 }}>{c.consultorio.endereco}</Text>
                  )}
                </View>
              </View>

              {!!c.observacoes && (
                <Text style={{ color: '#666', fontSize: 12 }}>Obs.: {c.observacoes}</Text>
              )}

              {podeCancelar && (
                <Pressable
                  onPress={() => cancelar(c)}
                  disabled={cancelandoId === c.id}
                  style={{
                    padding: 10, borderRadius: 8, alignItems: 'center',
                    borderWidth: 1, borderColor: '#b91c1c',
                    opacity: cancelandoId === c.id ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>
                    {cancelandoId === c.id ? 'Cancelando...' : 'Cancelar consulta'}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
// isabela@exemplo.com Senha12345