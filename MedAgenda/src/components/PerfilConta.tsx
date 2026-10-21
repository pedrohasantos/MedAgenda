import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Button, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { brParaIso, isoParaBr, mascararCpf } from '../lib/formatacao';
import { carregarMeuCliente, salvarMeuCliente } from '../services/perfil';
import { uploadAvatar } from '../services/storage';
import { FotoSegura } from './FotoSegura';

const input = { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12 } as const;
const bloqueado = { ...input, backgroundColor: '#f3f4f6', color: '#6b7280' } as const;

export function PerfilConta() {
  const { session, role, signOut } = useAuth();
  const userId = session?.user.id;

  const [carregando, setCarregando] = useState(true);
  const [temCadastro, setTemCadastro] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [versaoFoto, setVersaoFoto] = useState(0);

  useEffect(() => {
    if (!userId) return;
    carregarMeuCliente(userId)
      .then((c) => {
        if (!c) return;
        setTemCadastro(true);
        setNome(c.nome ?? '');
        setCpf(c.cpf ?? '');
        setNascimento(isoParaBr(c.data_nascimento));
        setEndereco(c.endereco ?? '');
      })
      .catch((e) => Alert.alert('Erro ao carregar perfil', e.message))
      .finally(() => setCarregando(false));
  }, [userId]);

  async function trocarFoto() {
    if (!userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permissão negada', 'Libere o acesso às fotos nas configurações.');
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (r.canceled) return;

    try {
      setEnviandoFoto(true);
      await uploadAvatar(userId, r.assets[0].uri);
      setVersaoFoto((v) => v + 1); // força o FotoSegura a gerar nova URL
    } catch (e: any) {
      Alert.alert('Erro ao enviar foto', e.message);
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar() {
    if (!userId) return;
    if (!nome.trim()) return Alert.alert('Informe seu nome');

    let nascimentoIso: string | null = null;
    if (nascimento.trim()) {
      nascimentoIso = brParaIso(nascimento);
      if (!nascimentoIso) return Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
    }

    try {
      setSalvando(true);
      await salvarMeuCliente(userId, {
        nome: nome.trim(),
        data_nascimento: nascimentoIso,
        endereco: endereco.trim() || null,
      });
      Alert.alert('Pronto', 'Perfil atualizado.');
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Pressable onPress={trocarFoto} disabled={enviandoFoto}>
          <FotoSegura
            key={versaoFoto}
            path={userId ? `clientes/${userId}/avatar.jpg` : null}
            tamanho={110}
          />
        </Pressable>
        <Pressable onPress={trocarFoto} disabled={enviandoFoto}>
          <Text style={{ color: '#0a7ea4' }}>{enviandoFoto ? 'Enviando...' : 'Alterar foto'}</Text>
        </Pressable>
        <Text style={{ color: '#666' }}>
          {role === 'admin' ? 'Conta de administrador' : 'Conta de cliente'}
        </Text>
      </View>

      <Text style={{ fontWeight: 'bold' }}>E-mail</Text>
      <TextInput value={session?.user.email ?? ''} editable={false} style={bloqueado} />

      {temCadastro ? (
        <>
          <Text style={{ fontWeight: 'bold' }}>Nome</Text>
          <TextInput value={nome} onChangeText={setNome} style={input} />

          <Text style={{ fontWeight: 'bold' }}>CPF</Text>
          <TextInput value={mascararCpf(cpf)} editable={false} style={bloqueado} />

          <Text style={{ fontWeight: 'bold' }}>Data de nascimento</Text>
          <TextInput
            value={nascimento} onChangeText={setNascimento}
            placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" maxLength={10}
            style={input}
          />

          <Text style={{ fontWeight: 'bold' }}>Endereço</Text>
          <TextInput value={endereco} onChangeText={setEndereco} style={input} />

          <Button title={salvando ? 'Salvando...' : 'Salvar alterações'} onPress={salvar} disabled={salvando} />
        </>
      ) : (
        <Text style={{ color: '#666' }}>
          Esta conta não tem dados cadastrais de cliente (provavelmente foi criada antes do trigger).
        </Text>
      )}

      <View style={{ marginTop: 16 }}>
        <Button title="Sair" color="#b91c1c" onPress={signOut} />
      </View>
    </ScrollView>
  );
}