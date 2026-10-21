import { supabase } from '../lib/supabase';

export type Cliente = {
  id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  endereco: string | null;
};

export async function carregarMeuCliente(userId: string) {
  const { data, error } = await supabase
    .from('cliente')
    .select('id, nome, email, cpf, data_nascimento, endereco')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Cliente | null;
}

export async function salvarMeuCliente(
  userId: string,
  campos: { nome: string; data_nascimento: string | null; endereco: string | null }
) {
  const { data, error } = await supabase
    .from('cliente')
    .update(campos)
    .eq('user_id', userId)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Cadastro não encontrado para atualizar.');
}