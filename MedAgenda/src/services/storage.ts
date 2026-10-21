import { supabase } from '../lib/supabase';

export async function uploadFoto(
  pasta: 'profissionais' | 'consultorios',
  uri: string
): Promise<string> {
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${pasta}/${nome}`;

  const resposta = await fetch(uri);
  const arquivo = await resposta.arrayBuffer();

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, arquivo, { contentType: 'image/jpeg' });
  if (error) throw error;

  return path;
}

export async function removerFoto(path: string) {
  await supabase.storage.from('fotos').remove([path]);
}