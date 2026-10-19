import { useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;

// "25/12/1990" -> "1990-12-25"
function paraIso(data: string) {
  const [d, m, a] = data.split('/');
  return d && m && a ? `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : undefined;
}

export default function Cadastro() {
  const { signUp } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cadastrar() {
    if (!nome.trim()) return Alert.alert('Informe seu nome');
    if (senha.length < 6) return Alert.alert('A senha precisa ter ao menos 6 caracteres');

    try {
      setEnviando(true);
      const { needsConfirmation } = await signUp({
        nome: nome.trim(),
        email: email.trim(),
        password: senha,
        cpf: cpf.replace(/\D/g, ''),
        data_nascimento: paraIso(nascimento),
        endereco: endereco.trim(),
      });
      if (needsConfirmation) {
        Alert.alert('Quase lá', 'Confirme seu e-mail para poder entrar.');
      }
    } catch (e: any) {
      Alert.alert('Erro no cadastro', e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Criar conta</Text>
      <TextInput placeholder="Nome completo" value={nome} onChangeText={setNome} style={input} />
      <TextInput placeholder="E-mail" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" style={input} />
      <TextInput placeholder="CPF (somente números)" value={cpf} onChangeText={setCpf}
        keyboardType="number-pad" maxLength={14} style={input} />
      <TextInput placeholder="Data de nascimento (DD/MM/AAAA)" value={nascimento}
        onChangeText={setNascimento} keyboardType="numbers-and-punctuation" style={input} />
      <TextInput placeholder="Endereço" value={endereco} onChangeText={setEndereco} style={input} />
      <TextInput placeholder="Senha" value={senha} onChangeText={setSenha}
        secureTextEntry style={input} />
      <Button title={enviando ? 'Criando...' : 'Cadastrar'} onPress={cadastrar} disabled={enviando} />
      <Link href="/(auth)/login">Já tem conta? Entrar</Link>
    </ScrollView>
  );
}