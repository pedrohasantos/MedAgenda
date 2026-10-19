
import { supabase } from '../lib/supabase';

export async function listarEspecialidades() {
  const { data, error } = await supabase.from('especialidade').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function listarConsultorios() {
  const { data, error } = await supabase.from('consultorio').select('*').order('nome');
  if (error) throw error;
  return data;
}

export async function listarProfissionais(especialidadeId: number, consultorioId: number) {
  const { data, error } = await supabase
    .from('profissional')
    .select('*, profissional_especialidade!inner(especialidade_id), profissional_consultorio!inner(consultorio_id)')
    .eq('profissional_especialidade.especialidade_id', especialidadeId)
    .eq('profissional_consultorio.consultorio_id', consultorioId);
  if (error) throw error;
  return data;
}

// Bucket "fotos" é privado: gere uma URL temporária para exibir
export async function urlDaFoto(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from('fotos').createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}