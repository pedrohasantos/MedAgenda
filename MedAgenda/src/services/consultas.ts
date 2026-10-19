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

export async function minhasConsultas() {
  const { data, error } = await supabase
    .from('consulta')
    .select('*, profissional(nome), consultorio(nome)')
    .order('inicio', { ascending: true });
  if (error) throw error;
  return data; // a RLS já filtra: cliente vê só as suas, admin vê todas
}