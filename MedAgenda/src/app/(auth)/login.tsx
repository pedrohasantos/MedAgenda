import { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

const input = { borderWidth: 1, borderRadius: 8, padding: 12 } as const;

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar() {
    try {
      setEnviando(true);
      await signIn(email.trim(), senha); // o RootGuard redireciona sozinho
    } catch (e: any) {
      Alert.alert('Erro ao entrar', e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>MedAgenda</Text>
      <TextInput placeholder="E-mail" value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" style={input} />
      <TextInput placeholder="Senha" value={senha} onChangeText={setSenha}
        secureTextEntry style={input} />
      <Button title={enviando ? 'Entrando...' : 'Entrar'} onPress={entrar} disabled={enviando} />
      <Link href="/(auth)/cadastro">Não tem conta? Cadastre-se</Link>
    </View>
  );
}