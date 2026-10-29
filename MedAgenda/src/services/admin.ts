import { supabase } from '../lib/supabase';

export async function criarConsultorio(c: {
  nome: string;
  endereco: string;
  descricao?: string;
  fotoPath?: string | null;
}) {
  const { data, error } = await supabase
    .from('consultorio')
    .insert({
      nome: c.nome,
      endereco: c.endereco,
      descricao: c.descricao || null,
      foto_path: c.fotoPath ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function atualizarConsultorio(
  id: number,
  c: { nome: string; endereco: string; descricao?: string; fotoPath: string | null }
) {
  const { data, error } = await supabase
    .from('consultorio')
    .update({
      nome: c.nome,
      endereco: c.endereco,
      descricao: c.descricao || null,
      foto_path: c.fotoPath,
    })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Unidade não encontrada.');
}

export async function definirAtivoConsultorio(id: number, ativo: boolean) {
  const { data, error } = await supabase
    .from('consultorio').update({ ativo }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Unidade não encontrada.');
}

export async function excluirConsultorio(id: number) {
  const { error } = await supabase.rpc('excluir_consultorio', { p_id: id });
  if (error) throw error;
}

export async function cadastrarProfissional(p: {
  nome: string;
  crmNumero: string;
  crmUf: string;
  especialidadeId: number;
  consultorioId: number;
  fotoPath?: string | null;
  horarios: { dia_semana: number; hora_inicio: string; hora_fim: string; duracao_min: number }[];
}) {
  const { data, error } = await supabase.rpc('cadastrar_profissional', {
    p_nome: p.nome,
    p_crm_numero: p.crmNumero,
    p_crm_uf: p.crmUf,
    p_especialidade_id: p.especialidadeId,
    p_consultorio_id: p.consultorioId,
    p_foto_path: p.fotoPath ?? null,
    p_horarios: p.horarios,
  });
  if (error) throw error;
  return data as number;
}

export async function listarProfissionaisAdmin() {
  const { data, error } = await supabase
    .from('profissional')
    .select(`
      id, nome, crm_numero, crm_uf, foto_path, ativo,
      profissional_especialidade ( especialidade_id ),
      profissional_consultorio ( consultorio_id )
    `)
    .order('nome');
  if (error) throw error;
  return data as any[];
}

export async function horariosDoProfissional(profissionalId: number, consultorioId: number) {
  const { data, error } = await supabase
    .from('horario_atendimento')
    .select('dia_semana, hora_inicio, hora_fim, duracao_min')
    .eq('profissional_id', profissionalId)
    .eq('consultorio_id', consultorioId)
    .order('dia_semana');
  if (error) throw error;
  return data as { dia_semana: number; hora_inicio: string; hora_fim: string; duracao_min: number }[];
}

export async function atualizarProfissional(p: {
  id: number;
  nome: string;
  crmNumero: string;
  crmUf: string;
  especialidadeId: number;
  consultorioId: number;
  fotoPath: string | null;
  horarios: { dia_semana: number; hora_inicio: string; hora_fim: string; duracao_min: number }[];
}) {
  const { error } = await supabase.rpc('atualizar_profissional', {
    p_id: p.id,
    p_nome: p.nome,
    p_crm_numero: p.crmNumero,
    p_crm_uf: p.crmUf,
    p_especialidade_id: p.especialidadeId,
    p_consultorio_id: p.consultorioId,
    p_foto_path: p.fotoPath,
    p_horarios: p.horarios,
  });
  if (error) throw error;
}

export async function definirAtivoProfissional(id: number, ativo: boolean) {
  const { data, error } = await supabase
    .from('profissional').update({ ativo }).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Profissional não encontrado.');
}

export async function excluirProfissional(id: number) {
  const { error } = await supabase.rpc('excluir_profissional', { p_id: id });
  if (error) throw error;
}

export type ConsultaAdmin = {
  id: number;
  inicio: string;
  fim: string;
  status: string;
  observacoes: string | null;
  cliente: { nome: string; email: string | null } | null;
  profissional: { nome: string; foto_path: string | null } | null;
  consultorio: { nome: string } | null;
};

export async function listarConsultasAdmin(): Promise<ConsultaAdmin[]> {
  const { data, error } = await supabase
    .from('consulta')
    .select(`
      id, inicio, fim, status, observacoes,
      cliente ( nome, email ),
      profissional ( nome, foto_path ),
      consultorio ( nome )
    `)
    .order('inicio', { ascending: true })
    .limit(500);
  if (error) throw error;
  return data as unknown as ConsultaAdmin[];
}

export async function confirmarConsulta(id: number) {
  const { data, error } = await supabase
    .from('consulta')
    .update({ status: 'confirmada' })
    .eq('id', id)
    .eq('status', 'agendada')
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('A consulta não está mais pendente.');
}