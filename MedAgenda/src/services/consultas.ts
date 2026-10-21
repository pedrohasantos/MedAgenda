import { supabase } from '../lib/supabase';

export async function diasAtendimento(profissionalId: number, consultorioId: number) {
  const { data, error } = await supabase.rpc('dias_atendimento', {
    p_profissional: profissionalId,
    p_consultorio: consultorioId,
  });
  if (error) throw error;
  return data as number[]; // 0 = domingo ... 6 = sábado
}

export async function horariosDisponiveis(profissionalId: number, consultorioId: number, data: string) {
  const { data: horarios, error } = await supabase.rpc('horarios_disponiveis', {
    p_profissional: profissionalId,
    p_consultorio: consultorioId,
    p_data: data, // 'AAAA-MM-DD'
  });
  if (error) throw error;
  return horarios as { inicio: string; fim: string }[];
}

export async function agendarConsulta(params: {
  profissionalId: number;
  consultorioId: number;
  inicio: string; // ISO
  especialidadeId?: number;
  observacoes?: string;
}) {
  const { data, error } = await supabase.rpc('agendar_consulta', {
    p_profissional: params.profissionalId,
    p_consultorio: params.consultorioId,
    p_inicio: params.inicio,
    p_especialidade: params.especialidadeId ?? null,
    p_observacoes: params.observacoes ?? null,
  });
  if (error) throw error;
  return data as number;
}

export async function cancelarConsulta(id: number) {
  const { error } = await supabase.rpc('cancelar_consulta', { p_id: id });
  if (error) throw error;
}

export type Consulta = {
  id: number;
  inicio: string;
  fim: string;
  status: string;
  observacoes: string | null;
  profissional: { nome: string; foto_path: string | null } | null;
  consultorio: { nome: string; endereco: string | null } | null;
};

export async function minhasConsultas(): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from('consulta')
    .select(`
      id, inicio, fim, status, observacoes,
      profissional ( nome, foto_path ),
      consultorio ( nome, endereco )
    `)
    .order('inicio', { ascending: true });
  if (error) throw error;
  return data as unknown as Consulta[];
}