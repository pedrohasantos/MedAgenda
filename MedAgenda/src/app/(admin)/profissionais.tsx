import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { Chip } from '../../components/Chip';
import { FotoPicker } from '../../components/FotoPicker';
import { cadastrarProfissional, listarProfissionaisAdmin } from '../../services/admin';
import { listarConsultorios, listarEspecialidades } from '../../services/catalogo';
import { removerFoto, uploadFoto } from '../../services/storage';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; // índice = dia_semana (0 = domingo)
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function Profissionais() {
  const [nome, setNome] = useState('');
  const [crm, setCrm] = useState('');
  const [uf, setUf] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
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

  async function carregar() {
    try {
      const [e, c, p] = await Promise.all([
        listarEspecialidades(),
        listarConsultorios(),
        listarProfissionaisAdmin(),
      ]);
      setEspecialidades(e);
      setConsultorios(c);
      setLista(p);
    } catch (err: any) {
      Alert.alert('Erro ao carregar dados', err.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  function alternarDia(d: number) {
    setDias((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d]));
  }

  async function salvar() {
    if (!nome.trim()) return Alert.alert('Informe o nome do profissional');
    if (!crm.trim() || uf.trim().length !== 2) {
      return Alert.alert('Informe o número do CRM e a UF (2 letras)');
    }
    if (!especialidadeId) return Alert.alert('Escolha a especialidade');
    if (!consultorioId) return Alert.alert('Escolha a unidade de atendimento');
    if (dias.length === 0) return Alert.alert('Escolha ao menos um dia de atendimento');
    if (!HORA.test(horaInicio) || !HORA.test(horaFim)) {
      return Alert.alert('Use o formato HH:MM nos horários (ex.: 08:00)');
    }
    if (horaFim <= horaInicio) return Alert.alert('O horário final deve ser maior que o inicial');
    const duracaoMin = parseInt(duracao, 10);
    if (!duracaoMin || duracaoMin <= 0) return Alert.alert('Informe a duração da consulta em minutos');

    let fotoPath: string | null = null;
    try {
      setEnviando(true);
      if (foto) fotoPath = await uploadFoto('profissionais', foto);

      await cadastrarProfissional({
        nome: nome.trim(),
        crmNumero: crm.trim(),
        crmUf: uf.trim().toUpperCase(),
        especialidadeId,
        consultorioId,
        fotoPath,
        horarios: dias.map((d) => ({
          dia_semana: d,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          duracao_min: duracaoMin,
        })),
      });

      setNome(''); setCrm(''); setUf(''); setFoto(null);
      setEspecialidadeId(null); setConsultorioId(null); setDias([]);
      Alert.alert('Pronto', 'Profissional cadastrado.');
      carregar();
    } catch (e: any) {
      if (fotoPath) removerFoto(fotoPath);
      Alert.alert('Erro ao cadastrar', e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 12 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Novo profissional</Text>

      <FotoPicker uri={foto} onChange={setFoto} />
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
      {consultorios.length === 0 && (
        <Text style={{ color: '#a00' }}>Cadastre uma unidade primeiro (aba Unidades).</Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {consultorios.map((c) => (
          <Chip key={c.id} label={c.nome} ativo={consultorioId === c.id}
            onPress={() => setConsultorioId(c.id)} />
        ))}
      </View>

      <Text style={{ fontWeight: 'bold' }}>Dias de atendimento</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {DIAS.map((label, i) => (
          <Chip key={i} label={label} ativo={dias.includes(i)} onPress={() => alternarDia(i)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          placeholder="Início (08:00)" value={horaInicio} onChangeText={setHoraInicio}
          maxLength={5} style={[input, { flex: 1 }]}
        />
        <TextInput
          placeholder="Fim (12:00)" value={horaFim} onChangeText={setHoraFim}
          maxLength={5} style={[input, { flex: 1 }]}
        />
        <TextInput
          placeholder="Min" value={duracao} onChangeText={setDuracao}
          keyboardType="number-pad" maxLength={3} style={[input, { width: 70 }]}
        />
      </View>
      <Text style={{ color: '#666', fontSize: 12 }}>
        Início, fim e duração de cada consulta em minutos. Vale para todos os dias marcados.
      </Text>

      <Button title={enviando ? 'Salvando...' : 'Cadastrar profissional'} onPress={salvar} disabled={enviando} />

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24 }}>
        Profissionais cadastrados ({lista.length})
      </Text>
      {lista.map((p) => (
        <View key={p.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>{p.nome}</Text>
          <Text>CRM {p.crm_numero}/{p.crm_uf}</Text>
        </View>
      ))}
    </ScrollView>
  );
}