import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BotaoAcao } from '../../components/BotaoAcao';
import { Chip } from '../../components/Chip';
import { FotoPicker } from '../../components/FotoPicker';
import { FotoSegura } from '../../components/FotoSegura';
import {
  atualizarProfissional, cadastrarProfissional, definirAtivoProfissional,
  excluirProfissional, horariosDoProfissional, listarProfissionaisAdmin,
} from '../../services/admin';
import { listarConsultorios, listarEspecialidades, urlDaFoto } from '../../services/catalogo';
import { removerFoto, uploadFoto } from '../../services/storage';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; // índice = dia_semana
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function Profissionais() {
  const scroll = useRef<ScrollView>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [crm, setCrm] = useState('');
  const [uf, setUf] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removerAtual, setRemoverAtual] = useState(false);
  const [especialidadeId, setEspecialidadeId] = useState<number | null>(null);
  const [consultorioId, setConsultorioId] = useState<number | null>(null);
  const [dias, setDias] = useState<number[]>([]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('12:00');
  const [duracao, setDuracao] = useState('30');
  const [enviando, setEnviando] = useState(false);

  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [lista, setLista] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const formY = useRef(0);

  async function carregar() {
    try {
      const [e, c, p] = await Promise.all([
        listarEspecialidades(), listarConsultorios(), listarProfissionaisAdmin(),
      ]);
      setEspecialidades(e); setConsultorios(c); setLista(p);
    } catch (err: any) {
      Alert.alert('Erro ao carregar dados', err.message);
    }
  }
  useEffect(() => { carregar(); }, []);

  function limpar() {
    setEditandoId(null); setNome(''); setCrm(''); setUf('');
    setFoto(null); setFotoAtual(null); setPreview(null); setRemoverAtual(false);
    setEspecialidadeId(null); setConsultorioId(null); setDias([]);
    setHoraInicio('08:00'); setHoraFim('12:00'); setDuracao('30');
    setFormAberto(false);
  }

  function mudarFoto(uri: string | null) {
    setFoto(uri);
    if (!uri) { setPreview(null); setRemoverAtual(true); }
  }

  function alternarDia(d: number) {
    setDias((a) => (a.includes(d) ? a.filter((x) => x !== d) : [...a, d]));
  }

  async function iniciarEdicao(p: any) {
    const espId = p.profissional_especialidade?.[0]?.especialidade_id ?? null;
    const uniId = p.profissional_consultorio?.[0]?.consultorio_id ?? null;

    limpar();
    setEditandoId(p.id);
    setNome(p.nome ?? '');
    setCrm(p.crm_numero ?? '');
    setUf(p.crm_uf ?? '');
    setEspecialidadeId(espId);
    setConsultorioId(uniId);
    setFotoAtual(p.foto_path ?? null);
    if (p.foto_path) urlDaFoto(p.foto_path).then(setPreview);
    setFormAberto(true);
    setTimeout(() => scroll.current?.scrollTo({ y: formY.current, animated: true }), 100);

    if (uniId) {
      try {
        const hs = await horariosDoProfissional(p.id, uniId);
        if (hs.length > 0) {
          const primeiro = hs[0];
          setDias(hs.map((h) => h.dia_semana));
          setHoraInicio(primeiro.hora_inicio.slice(0, 5));
          setHoraFim(primeiro.hora_fim.slice(0, 5));
          setDuracao(String(primeiro.duracao_min));
          const diferentes = hs.some(
            (h) => h.hora_inicio !== primeiro.hora_inicio ||
                   h.hora_fim !== primeiro.hora_fim ||
                   h.duracao_min !== primeiro.duracao_min
          );
          if (diferentes) {
            Alert.alert(
              'Horários diferentes por dia',
              'Este profissional tem horários diferentes em cada dia. Ao salvar, o horário mostrado será aplicado a todos os dias marcados.'
            );
          }
        }
      } catch (e: any) {
        Alert.alert('Erro ao carregar horários', e.message);
      }
    }
  }

  async function salvar() {
    if (!nome.trim()) return Alert.alert('Informe o nome do profissional');
    if (!crm.trim() || uf.trim().length !== 2) return Alert.alert('Informe o número do CRM e a UF (2 letras)');
    if (!especialidadeId) return Alert.alert('Escolha a especialidade');
    if (!consultorioId) return Alert.alert('Escolha a unidade de atendimento');
    if (dias.length === 0) return Alert.alert('Escolha ao menos um dia de atendimento');
    if (!HORA.test(horaInicio) || !HORA.test(horaFim)) {
      return Alert.alert('Use o formato HH:MM nos horários (ex.: 08:00)');
    }
    if (horaFim <= horaInicio) return Alert.alert('O horário final deve ser maior que o inicial');
    const duracaoMin = parseInt(duracao, 10);
    if (!duracaoMin || duracaoMin <= 0) return Alert.alert('Informe a duração da consulta em minutos');

    const horarios = dias.map((d) => ({
      dia_semana: d, hora_inicio: horaInicio, hora_fim: horaFim, duracao_min: duracaoMin,
    }));

    let novoPath: string | null = null;
    try {
      setEnviando(true);
      if (foto) novoPath = await uploadFoto('profissionais', foto);
      const fotoFinal = novoPath ?? (removerAtual ? null : fotoAtual);

      if (editandoId) {
        await atualizarProfissional({
          id: editandoId, nome: nome.trim(), crmNumero: crm.trim(), crmUf: uf.trim().toUpperCase(),
          especialidadeId, consultorioId, fotoPath: fotoFinal, horarios,
        });
        if (fotoAtual && fotoFinal !== fotoAtual) removerFoto(fotoAtual);
      } else {
        await cadastrarProfissional({
          nome: nome.trim(), crmNumero: crm.trim(), crmUf: uf.trim().toUpperCase(),
          especialidadeId, consultorioId, fotoPath: fotoFinal, horarios,
        });
      }

      Alert.alert('Pronto', editandoId ? 'Profissional atualizado.' : 'Profissional cadastrado.');
      limpar();
      carregar();
    } catch (e: any) {
      if (novoPath) removerFoto(novoPath);
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarAtivo(p: any) {
    try {
      await definirAtivoProfissional(p.id, !p.ativo);
      carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  function abrirNovo() {
  limpar();
  setFormAberto(true);
  setTimeout(() => scroll.current?.scrollTo({ y: formY.current, animated: true }), 100);
  }
  function excluir(p: any) {
    Alert.alert(
      'Excluir profissional',
      `Excluir "${p.nome}" definitivamente?\n\nSó é possível se ele nunca teve consultas. Para apenas escondê-lo dos clientes, use Desativar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirProfissional(p.id);
              if (p.foto_path) removerFoto(p.foto_path);
              if (editandoId === p.id) limpar();
              carregar();
            } catch (e: any) {
              Alert.alert(
                'Não foi possível excluir',
                e.message,
                p.ativo
                  ? [{ text: 'Fechar', style: 'cancel' }, { text: 'Desativar', onPress: () => alternarAtivo(p) }]
                  : [{ text: 'Fechar' }]
              );
            }
          },
        },
      ]
    );
  }

  const unidadesAtivas = consultorios.filter((c) => c.ativo);
  const unidadeDaEdicao = consultorios.find((c) => c.id === consultorioId);

  return (
  <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
      Profissionais cadastrados ({lista.length})
    </Text>

    {lista.length === 0 && (
      <Text style={{ color: '#666' }}>Nenhum profissional cadastrado ainda.</Text>
    )}

    {lista.map((p) => {
      const esp = especialidades.find((e) => e.id === p.profissional_especialidade?.[0]?.especialidade_id);
      const uni = consultorios.find((c) => c.id === p.profissional_consultorio?.[0]?.consultorio_id);
      return (
        <View
          key={p.id}
          style={{
            borderWidth: 1, borderColor: editandoId === p.id ? '#0a7ea4' : '#ddd',
            borderRadius: 10, padding: 12, gap: 10, opacity: p.ativo ? 1 : 0.65,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <FotoSegura path={p.foto_path ?? null} tamanho={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>{p.nome}</Text>
              <Text style={{ color: '#555' }}>CRM {p.crm_numero}/{p.crm_uf}</Text>
              {!!esp && <Text style={{ color: '#0a7ea4' }}>{esp.nome}</Text>}
              {!!uni && <Text style={{ color: '#888', fontSize: 12 }}>{uni.nome}</Text>}
              {!p.ativo && <Text style={{ color: '#b91c1c', fontSize: 12, fontWeight: 'bold' }}>Desativado</Text>}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <BotaoAcao titulo="Editar" onPress={() => iniciarEdicao(p)} />
            <BotaoAcao
              titulo={p.ativo ? 'Desativar' : 'Ativar'}
              cor={p.ativo ? '#b45309' : '#15803d'}
              onPress={() => alternarAtivo(p)}
            />
            <BotaoAcao titulo="Excluir" cor="#b91c1c" onPress={() => excluir(p)} />
          </View>
        </View>
      );
    })}

    {!formAberto && (
      <Pressable
        onPress={abrirNovo}
        style={{
          marginTop: 8, padding: 14, borderRadius: 10, alignItems: 'center',
          borderWidth: 1, borderStyle: 'dashed', borderColor: '#0a7ea4',
        }}
      >
        <Text style={{ color: '#0a7ea4', fontWeight: 'bold' }}>+ Novo profissional</Text>
      </Pressable>
    )}

    {formAberto && (
      <View
        onLayout={(e) => { formY.current = e.nativeEvent.layout.y; }}
        style={{ gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#ddd' }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
          {editandoId ? 'Editar profissional' : 'Novo profissional'}
        </Text>

        <FotoPicker uri={foto ?? preview} onChange={mudarFoto} />
        <TextInput placeholder="Nome completo" value={nome} onChangeText={setNome} style={input} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            placeholder="CRM (número)" value={crm} onChangeText={setCrm}
            keyboardType="number-pad" style={[input, { flex: 1 }]}
          />
          <TextInput
            placeholder="UF" value={uf} onChangeText={(t) => setUf(t.toUpperCase())}
            maxLength={2} autoCapitalize="characters" style={[input, { width: 70 }]}
          />
        </View>

        <Text style={{ fontWeight: 'bold' }}>Especialidade</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {especialidades.map((e) => (
            <Chip key={e.id} label={e.nome} ativo={especialidadeId === e.id}
              onPress={() => setEspecialidadeId(e.id)} />
          ))}
        </View>

        <Text style={{ fontWeight: 'bold' }}>Unidade de atendimento</Text>
        {editandoId ? (
          <Text style={{ color: '#555' }}>
            {unidadeDaEdicao?.nome ?? 'Unidade'} (não pode ser alterada na edição)
          </Text>
        ) : (
          <>
            {unidadesAtivas.length === 0 && (
              <Text style={{ color: '#a00' }}>Cadastre uma unidade ativa primeiro (aba Unidades).</Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {unidadesAtivas.map((c) => (
                <Chip key={c.id} label={c.nome} ativo={consultorioId === c.id}
                  onPress={() => setConsultorioId(c.id)} />
              ))}
            </View>
          </>
        )}

        <Text style={{ fontWeight: 'bold' }}>Dias de atendimento</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DIAS.map((label, i) => (
            <Chip key={i} label={label} ativo={dias.includes(i)} onPress={() => alternarDia(i)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput placeholder="Início (08:00)" value={horaInicio} onChangeText={setHoraInicio}
            maxLength={5} style={[input, { flex: 1 }]} />
          <TextInput placeholder="Fim (12:00)" value={horaFim} onChangeText={setHoraFim}
            maxLength={5} style={[input, { flex: 1 }]} />
          <TextInput placeholder="Min" value={duracao} onChangeText={setDuracao}
            keyboardType="number-pad" maxLength={3} style={[input, { width: 70 }]} />
        </View>
        <Text style={{ color: '#666', fontSize: 12 }}>
          Início, fim e duração de cada consulta em minutos. Vale para todos os dias marcados.
          Consultas já agendadas não são alteradas.
        </Text>

        <Button
          title={enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar profissional'}
          onPress={salvar} disabled={enviando}
        />
        <Button title="Cancelar" color="#6b7280" onPress={limpar} />
      </View>
    )}
  </ScrollView>
  );
}