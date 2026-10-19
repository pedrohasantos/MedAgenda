import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Role = 'cliente' | 'admin' | null;

export type DadosCadastro = {
  nome: string;
  email: string;
  password: string;
  cpf?: string;
  data_nascimento?: string; // AAAA-MM-DD
  endereco?: string;
};

type AuthContextType = {
  session: Session | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (dados: DadosCadastro) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // 1) Sessão: leitura inicial + escuta de mudanças
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setRole(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 2) Papel: busca sempre que o usuário muda
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    setLoading(true);
    supabase
      .from('perfil')
      .select('papel')
      .eq('user_id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) console.warn('Erro ao buscar perfil:', error.message);
        setRole((data?.papel as Role) ?? 'cliente');
        setLoading(false);
      });
  }, [session?.user.id]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp({ email, password, ...meta }: DadosCadastro) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta }, // o trigger lê nome, cpf, data_nascimento, endereco
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}