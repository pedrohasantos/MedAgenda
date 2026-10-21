import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import { FotoPicker } from '../../components/FotoPicker';
import { criarConsultorio } from '../../services/admin';
import { listarConsultorios } from '../../services/catalogo';
import { removerFoto, uploadFoto } from '../../services/storage';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;

export default function Unidades() {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [lista, setLista] = useState<any[]>([]);

  async function carregar() {
    try {
      setLista(await listarConsultorios());
    } catch (e: any) {
      Alert.alert('Erro ao carregar unidades', e.message);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!nome.trim() || !endereco.trim()) {
      return Alert.alert('Preencha o nome e o endereço da unidade');
    }

    let fotoPath: string | null = null;
    try {
      setEnviando(true);
      if (foto) fotoPath = await uploadFoto('consultorios', foto);

      await criarConsultorio({
        nome: nome.trim(),
        endereco: endereco.trim(),
        descricao: descricao.trim(),
        fotoPath,
      });

      setNome(''); setEndereco(''); setDescricao(''); setFoto(null);
      Alert.alert('Pronto', 'Unidade cadastrada.');
      carregar();
    } catch (e: any) {
      if (fotoPath) removerFoto(fotoPath); // não deixa foto órfã
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
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Nova unidade</Text>

      <FotoPicker uri={foto} onChange={setFoto} />
      <TextInput placeholder="Nome da unidade" value={nome} onChangeText={setNome} style={input} />
      <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={input} />
      <TextInput
        placeholder="Outra informação (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        multiline
        style={[input, { minHeight: 80, textAlignVertical: 'top' }]}
      />
      <Button title={enviando ? 'Salvando...' : 'Cadastrar unidade'} onPress={salvar} disabled={enviando} />

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 24 }}>
        Unidades cadastradas ({lista.length})
      </Text>
      {lista.map((u) => (
        <View key={u.id} style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>{u.nome}</Text>
          <Text>{u.endereco}</Text>
        </View>
      ))}
    </ScrollView>
  );
}