import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { BotaoAcao } from '../../components/BotaoAcao';
import { FotoPicker } from '../../components/FotoPicker';
import { FotoSegura } from '../../components/FotoSegura';

import {
  atualizarConsultorio, criarConsultorio, definirAtivoConsultorio, excluirConsultorio,
} from '../../services/admin';
import { listarConsultorios, urlDaFoto } from '../../services/catalogo';
import { removerFoto, uploadFoto } from '../../services/storage';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;

export default function Unidades() {
  const scroll = useRef<ScrollView>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState<string | null>(null);       // foto nova escolhida
  const [fotoAtual, setFotoAtual] = useState<string | null>(null); // path salvo no banco
  const [preview, setPreview] = useState<string | null>(null);  // URL assinada da foto atual
  const [removerAtual, setRemoverAtual] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<any[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const formY = useRef(0);
  async function carregar() {
    try {
      setLista(await listarConsultorios());
    } catch (e: any) {
      Alert.alert('Erro ao carregar unidades', e.message);
    }
  }
  useEffect(() => { carregar(); }, []);

  function limpar() {
    setEditandoId(null); setNome(''); setEndereco(''); setDescricao('');
    setFoto(null); setFotoAtual(null); setPreview(null); setRemoverAtual(false);
    setFormAberto(false);
  }

  function mudarFoto(uri: string | null) {
    setFoto(uri);
    if (!uri) { setPreview(null); setRemoverAtual(true); }
  }

  function abrirNovo() {
    limpar();
    setFormAberto(true);
    setTimeout(() => scroll.current?.scrollTo({ y: formY.current, animated: true }), 100);
  }

  function iniciarEdicao(u: any) {
    setEditandoId(u.id);
    setNome(u.nome ?? '');
    setEndereco(u.endereco ?? '');
    setDescricao(u.descricao ?? '');
    setFoto(null);
    setFotoAtual(u.foto_path ?? null);
    setRemoverAtual(false);
    setPreview(null);
    if (u.foto_path) urlDaFoto(u.foto_path).then(setPreview);
    setFormAberto(true);
    setTimeout(() => scroll.current?.scrollTo({ y: formY.current, animated: true }), 100);
  }

  async function salvar() {
    if (!nome.trim() || !endereco.trim()) {
      return Alert.alert('Preencha o nome e o endereço da unidade');
    }

    let novoPath: string | null = null;
    try {
      setEnviando(true);
      if (foto) novoPath = await uploadFoto('consultorios', foto);
      const fotoFinal = novoPath ?? (removerAtual ? null : fotoAtual);

      if (editandoId) {
        await atualizarConsultorio(editandoId, {
          nome: nome.trim(), endereco: endereco.trim(), descricao: descricao.trim(), fotoPath: fotoFinal,
        });
        if (fotoAtual && fotoFinal !== fotoAtual) removerFoto(fotoAtual); // apaga a antiga
      } else {
        await criarConsultorio({
          nome: nome.trim(), endereco: endereco.trim(), descricao: descricao.trim(), fotoPath: fotoFinal,
        });
      }

      Alert.alert('Pronto', editandoId ? 'Unidade atualizada.' : 'Unidade cadastrada.');
      limpar();
      carregar();
    } catch (e: any) {
      if (novoPath) removerFoto(novoPath);
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function alternarAtivo(u: any) {
    try {
      await definirAtivoConsultorio(u.id, !u.ativo);
      carregar();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  }

  function excluir(u: any) {
    Alert.alert(
      'Excluir unidade',
      `Excluir "${u.nome}" definitivamente?\n\nSó é possível se não houver consultas nem profissionais vinculados. Para apenas escondê-la dos clientes, use Desativar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirConsultorio(u.id);
              if (u.foto_path) removerFoto(u.foto_path);
              if (editandoId === u.id) limpar();
              carregar();
            } catch (e: any) {
              Alert.alert(
                'Não foi possível excluir',
                e.message,
                u.ativo
                  ? [{ text: 'Fechar', style: 'cancel' }, { text: 'Desativar', onPress: () => alternarAtivo(u) }]
                  : [{ text: 'Fechar' }]
              );
            }
          },
        },
      ]
    );
  }

  return (
  <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
      Unidades cadastradas ({lista.length})
    </Text>

    {lista.length === 0 && (
      <Text style={{ color: '#666' }}>Nenhuma unidade cadastrada ainda.</Text>
    )}

    {lista.map((u) => (
      <View
        key={u.id}
        style={{
          borderWidth: 1, borderColor: editandoId === u.id ? '#0a7ea4' : '#ddd',
          borderRadius: 10, padding: 12, gap: 10, opacity: u.ativo ? 1 : 0.65,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <FotoSegura path={u.foto_path ?? null} tamanho={52} redonda={false} icone="business" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: 'bold' }}>{u.nome}</Text>
            <Text style={{ color: '#555' }}>{u.endereco}</Text>
            {!u.ativo && <Text style={{ color: '#b91c1c', fontSize: 12, fontWeight: 'bold' }}>Desativada</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <BotaoAcao titulo="Editar" onPress={() => iniciarEdicao(u)} />
          <BotaoAcao
            titulo={u.ativo ? 'Desativar' : 'Ativar'}
            cor={u.ativo ? '#b45309' : '#15803d'}
            onPress={() => alternarAtivo(u)}
          />
          <BotaoAcao titulo="Excluir" cor="#b91c1c" onPress={() => excluir(u)} />
        </View>
      </View>
    ))}

    {/* Botão no fim da lista */}
    {!formAberto && (
      <Pressable
        onPress={abrirNovo}
        style={{
          marginTop: 8, padding: 14, borderRadius: 10, alignItems: 'center',
          borderWidth: 1, borderStyle: 'dashed', borderColor: '#0a7ea4',
        }}
      >
        <Text style={{ color: '#0a7ea4', fontWeight: 'bold' }}>+ Nova unidade</Text>
      </Pressable>
    )}

    {/* Formulário: só aparece quando aberto */}
    {formAberto && (
      <View
        onLayout={(e) => { formY.current = e.nativeEvent.layout.y; }}
        style={{ gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#ddd' }}
      >
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
          {editandoId ? 'Editar unidade' : 'Nova unidade'}
        </Text>

        <FotoPicker uri={foto ?? preview} onChange={mudarFoto} />
        <TextInput placeholder="Nome da unidade" value={nome} onChangeText={setNome} style={input} />
        <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={input} />
        <TextInput
          placeholder="Outra informação (opcional)" value={descricao} onChangeText={setDescricao}
          multiline style={[input, { minHeight: 80, textAlignVertical: 'top' }]}
        />
        <Button
          title={enviando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Cadastrar unidade'}
          onPress={salvar} disabled={enviando}
        />
        <Button title="Cancelar" color="#6b7280" onPress={limpar} />
      </View>
    )}
  </ScrollView>
  )};