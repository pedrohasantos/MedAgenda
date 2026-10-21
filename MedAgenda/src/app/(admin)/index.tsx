import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FotoSegura } from '../../components/FotoSegura';
import { Selo } from '../../components/Selo';
import { chaveDoDia, formatarData, formatarHora } from '../../lib/formatacao';
import { ConsultaAdmin, confirmarConsulta, listarConsultasAdmin } from '../../services/admin';
import { cancelarConsulta } from '../../services/consultas';

const ATIVAS = ['agendada', 'confirmada'];
type Aba = 'hoje' | 'proximas' | 'historico';
const ROTULOS: Record<Aba, string> = { hoje: 'Hoje', proximas: 'Próximas', historico: 'Histórico' };

export default function AdminInicio() {
  const [consultas, setConsultas] = useState<ConsultaAdmin[]>([]);
  const [aba, setAba] = useState<Aba>('hoje');
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);

  const carregar = useCallback(async (puxando = false) => {
    try {
      if (puxando) setAtualizando(true);
      setConsultas(await listarConsultasAdmin());
    } catch (e: any) {
      Alert.alert('Erro ao carregar consultas', e.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const grupos = useMemo(() => {
    const agora = Date.now();
    const hoje = chaveDoDia(new Date());
    const hojeLista: ConsultaAdmin[] = [];
    const proximasLista: ConsultaAdmin[] = [];
    const historicoLista: ConsultaAdmin[] = [];

    for (const c of consultas) {
      const dia = chaveDoDia(c.inicio);
      const ativa = ATIVAS.includes(c.status);
      if (dia === hoje) hojeLista.push(c);
      else if (ativa && dia > hoje) proximasLista.push(c);
      else historicoLista.push(c);
    }
    historicoLista.sort((a, b) => b.inicio.localeCompare(a.inicio));
    return { hoje: hojeLista, proximas: proximasLista, historico: historicoLista, agora };
  }, [consultas]);

  const lista = useMemo(() => {
    const base = grupos[aba];
    const termo = busca.trim().toLowerCase();
    if (!termo) return base;
    return base.filter((c) =>
      [c.cliente?.nome, c.cliente?.email, c.profissional?.nome, c.consultorio?.nome]
        .some((t) => t?.toLowerCase().includes(termo))
    );
  }, [grupos, aba, busca]);

  const pendentes = consultas.filter(
    (c) => c.status === 'agendada' && new Date(c.fim).getTime() > grupos.agora
  ).length;

  function confirmar(c: ConsultaAdmin) {
    (async () => {
      try {
        setOcupadoId(c.id);
        await confirmarConsulta(c.id);
        await carregar();
      } catch (e: any) {
        Alert.alert('Não foi possível confirmar', e.message);
        carregar();
      } finally {
        setOcupadoId(null);
      }
    })();
  }

  function cancelar(c: ConsultaAdmin) {
    Alert.alert(
      'Cancelar consulta',
      `${c.cliente?.nome ?? 'Cliente'} com ${c.profissional?.nome ?? 'profissional'}\n${formatarData(c.inicio)} às ${formatarHora(c.inicio)}\n\nDeseja realmente cancelar?`,
      [
        { text: 'Manter', style: 'cancel' },
        {
          text: 'Cancelar consulta',
          style: 'destructive',
          onPress: async () => {
            try {
              setOcupadoId(c.id);
              await cancelarConsulta(c.id);
              await carregar();
            } catch (e: any) {
              Alert.alert('Não foi possível cancelar', e.message);
            } finally {
              setOcupadoId(null);
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
      <View style={{ padding: 16, paddingBottom: 8, gap: 10 }}>
        <Text style={{ color: '#666' }}>
          {pendentes} {pendentes === 1 ? 'consulta aguardando confirmação' : 'consultas aguardando confirmação'}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['hoje', 'proximas', 'historico'] as Aba[]).map((k) => {
            const ativo = aba === k;
            return (
              <Pressable
                key={k}
                onPress={() => setAba(k)}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: ativo ? '#0a7ea4' : '#f3f4f6',
                }}
              >
                <Text style={{ color: ativo ? '#fff' : '#333', fontWeight: 'bold', fontSize: 13 }}>
                  {ROTULOS[k]} ({grupos[k].length})
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          placeholder="Buscar por cliente, profissional ou unidade"
          value={busca}
          onChangeText={setBusca}
          style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10 }}
        />
      </View>

      <FlatList
        data={lista}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 12, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} />}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <Text style={{ color: '#666', textAlign: 'center' }}>
              {busca ? 'Nenhuma consulta encontrada para essa busca.' : 'Nenhuma consulta nesta lista.'}
            </Text>
          </View>
        }
        renderItem={({ item: c }) => {
          const futura = new Date(c.fim).getTime() > grupos.agora;
          const podeAgir = ATIVAS.includes(c.status) && futura;
          const ocupado = ocupadoId === c.id;
          return (
            <View
              style={{
                borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
                backgroundColor: '#fff', gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>{formatarData(c.inicio)}</Text>
                <Selo status={c.status} />
              </View>

              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0a7ea4' }}>
                {formatarHora(c.inicio)} – {formatarHora(c.fim)}
              </Text>

              <Text>
                <Text style={{ fontWeight: 'bold' }}>Cliente: </Text>
                {c.cliente?.nome ?? '—'}
                {c.cliente?.email ? `  (${c.cliente.email})` : ''}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FotoSegura path={c.profissional?.foto_path ?? null} tamanho={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{c.profissional?.nome ?? 'Profissional'}</Text>
                  <Text style={{ color: '#555' }}>{c.consultorio?.nome ?? 'Unidade'}</Text>
                </View>
              </View>

              {!!c.observacoes && (
                <Text style={{ color: '#666', fontSize: 12 }}>Obs.: {c.observacoes}</Text>
              )}

              {podeAgir && (
                <View style={{ flexDirection: 'row', gap: 8, opacity: ocupado ? 0.5 : 1 }}>
                  {c.status === 'agendada' && (
                    <Pressable
                      onPress={() => confirmar(c)}
                      disabled={ocupado}
                      style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#15803d' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => cancelar(c)}
                    disabled={ocupado}
                    style={{
                      flex: 1, padding: 10, borderRadius: 8, alignItems: 'center',
                      borderWidth: 1, borderColor: '#b91c1c',
                    }}
                  >
                    <Text style={{ color: '#b91c1c', fontWeight: 'bold' }}>Cancelar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}
// usuario@exemplo.com senha123