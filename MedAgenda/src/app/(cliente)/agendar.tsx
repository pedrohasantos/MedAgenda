import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Chip } from '../../components/Chip';
import { FotoSegura } from '../../components/FotoSegura';
import { listarConsultorios, listarProfissionaisDaUnidade } from '../../services/catalogo';
import { agendarConsulta, diasAtendimento, horariosDisponiveis } from '../../services/consultas';

const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const pad = (n: number) => String(n).padStart(2, '0');

function proximosDias(qtd = 30) {
  const hoje = new Date();
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    return {
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      diaSemana: d.getDay(), // 0 = domingo, igual ao banco
      label: `${SEMANA[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`,
    };
  });
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function formatarDataLonga(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

type Unidade = { id: number; nome: string; endereco: string | null; descricao: string | null; foto_path: string | null };
type Profissional = {
  id: number; nome: string; crm_numero: string; crm_uf: string; foto_path: string | null;
  profissional_especialidade: { especialidade: { id: number; nome: string } | null }[];
};
type Horario = { inicio: string; fim: string };

const cartao = {
  borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12,
  flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
} as const;

export default function Agendar() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [profissional, setProfissional] = useState<Profissional | null>(null);

  const [diasAtende, setDiasAtende] = useState<number[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horario, setHorario] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const dias = useMemo(
    () => proximosDias().filter((d) => diasAtende.includes(d.diaSemana)),
    [diasAtende]
  );

  // Etapa 1: unidades
  useEffect(() => {
    listarConsultorios()
      .then((u) => setUnidades(u as Unidade[]))
      .catch((e) => Alert.alert('Erro ao carregar unidades', e.message))
      .finally(() => setCarregando(false));
  }, []);

  async function escolherUnidade(u: Unidade) {
    try {
      setCarregando(true);
      setProfissionais((await listarProfissionaisDaUnidade(u.id)) as unknown as Profissional[]);
      setUnidade(u);
    } catch (e: any) {
      Alert.alert('Erro ao carregar profissionais', e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function escolherProfissional(p: Profissional) {
    if (!unidade) return;
    try {
      setCarregando(true);
      setDiasAtende(await diasAtendimento(p.id, unidade.id));
      setProfissional(p);
      setData(null);
      setHorarios([]);
      setHorario(null);
    } catch (e: any) {
      Alert.alert('Erro ao carregar agenda', e.message);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarHorarios(iso: string) {
    if (!profissional || !unidade) return;
    setData(iso);
    setHorario(null);
    setCarregandoHorarios(true);
    try {
      setHorarios(await horariosDisponiveis(profissional.id, unidade.id, iso));
    } catch (e: any) {
      Alert.alert('Erro ao carregar horários', e.message);
    } finally {
      setCarregandoHorarios(false);
    }
  }

  function voltar() {
    if (profissional) {
      setProfissional(null);
      setData(null);
      setHorarios([]);
      setHorario(null);
    } else if (unidade) {
      setUnidade(null);
      setProfissionais([]);
    }
  }

  function reiniciar() {
    setUnidade(null);
    setProfissional(null);
    setProfissionais([]);
    setData(null);
    setHorarios([]);
    setHorario(null);
  }

  function confirmar() {
    if (!unidade || !profissional || !data || !horario) return;
    const especialidade = profissional.profissional_especialidade[0]?.especialidade;

    Alert.alert(
      'Confirmar consulta',
      `${profissional.nome}\n${unidade.nome}\n${formatarDataLonga(data)} às ${formatarHora(horario)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setEnviando(true);
              await agendarConsulta({
                profissionalId: profissional.id,
                consultorioId: unidade.id,
                inicio: horario,
                especialidadeId: especialidade?.id,
              });
              Alert.alert('Consulta agendada!', 'Você pode acompanhá-la na aba Início.');
              reiniciar();
            } catch (e: any) {
              Alert.alert('Não foi possível agendar', e.message);
              carregarHorarios(data); // atualiza: o horário pode ter sido ocupado
            } finally {
              setEnviando(false);
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

  const titulo = !unidade
    ? '1. Escolha a unidade'
    : !profissional
    ? `2. Profissionais · ${unidade.nome}`
    : `3. Dia e horário · ${profissional.nome}`;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      {unidade && (
        <Pressable onPress={voltar}>
          <Text style={{ color: '#0a7ea4', fontSize: 16 }}>← Voltar</Text>
        </Pressable>
      )}
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{titulo}</Text>

      {/* Etapa 1: unidades */}
      {!unidade && (
        <>
          {unidades.length === 0 && <Text>Nenhuma unidade disponível no momento.</Text>}
          {unidades.map((u) => (
            <Pressable key={u.id} onPress={() => escolherUnidade(u)} style={cartao}>
              <FotoSegura path={u.foto_path} tamanho={64} redonda={false} icone="business" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{u.nome}</Text>
                {!!u.endereco && <Text style={{ color: '#555' }}>{u.endereco}</Text>}
                {!!u.descricao && (
                  <Text style={{ color: '#888', fontSize: 12 }} numberOfLines={2}>{u.descricao}</Text>
                )}
              </View>
            </Pressable>
          ))}
        </>
      )}

      {/* Etapa 2: profissionais da unidade */}
      {unidade && !profissional && (
        <>
          {profissionais.length === 0 && (
            <Text>Esta unidade ainda não tem profissionais cadastrados.</Text>
          )}
          {profissionais.map((p) => {
            const especialidades = p.profissional_especialidade
              .map((x) => x.especialidade?.nome)
              .filter(Boolean)
              .join(', ');
            return (
              <Pressable key={p.id} onPress={() => escolherProfissional(p)} style={cartao}>
                <FotoSegura path={p.foto_path} tamanho={56} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{p.nome}</Text>
                  {!!especialidades && <Text style={{ color: '#0a7ea4' }}>{especialidades}</Text>}
                  <Text style={{ color: '#888', fontSize: 12 }}>CRM {p.crm_numero}/{p.crm_uf}</Text>
                </View>
              </Pressable>
            );
          })}
        </>
      )}

      {/* Etapa 3: dia e horário */}
      {unidade && profissional && (
        <>
          <Text style={{ color: '#555' }}>{unidade.nome}</Text>

          {dias.length === 0 ? (
            <Text>Este profissional ainda não tem dias de atendimento cadastrados.</Text>
          ) : (
            <>
              <Text style={{ fontWeight: 'bold' }}>Dia</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {dias.map((d) => (
                  <Chip key={d.iso} label={d.label} ativo={data === d.iso}
                    onPress={() => carregarHorarios(d.iso)} />
                ))}
              </ScrollView>
            </>
          )}

          {data && (
            <>
              <Text style={{ fontWeight: 'bold', marginTop: 8 }}>
                Horários em {formatarDataLonga(data)}
              </Text>
              {carregandoHorarios ? (
                <ActivityIndicator />
              ) : horarios.length === 0 ? (
                <Text>Sem horários livres neste dia. Tente outra data.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {horarios.map((h) => (
                    <Chip key={h.inicio} label={formatarHora(h.inicio)}
                      ativo={horario === h.inicio} onPress={() => setHorario(h.inicio)} />
                  ))}
                </View>
              )}
            </>
          )}

          <Pressable
            onPress={confirmar}
            disabled={!horario || enviando}
            style={{
              marginTop: 16, padding: 14, borderRadius: 10, alignItems: 'center',
              backgroundColor: !horario || enviando ? '#9ca3af' : '#0a7ea4',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {enviando ? 'Agendando...' : 'Confirmar agendamento'}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}