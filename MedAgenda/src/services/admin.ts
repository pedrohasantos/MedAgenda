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
    .select('id, nome, crm_numero, crm_uf')
    .order('nome');
  if (error) throw error;
  return data;
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