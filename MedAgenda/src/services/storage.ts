import { File } from 'expo-file-system';
import { supabase } from '../lib/supabase';

async function lerBytes(uri: string): Promise<Uint8Array> {
  const bytes = await new File(uri).bytes();
  if (bytes.length < 100) throw new Error('A imagem escolhida está vazia ou inválida.');
  return bytes;
}

export async function uploadFoto(
  pasta: 'profissionais' | 'consultorios',
  uri: string
): Promise<string> {
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const path = `${pasta}/${nome}`;

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, await lerBytes(uri), { contentType: 'image/jpeg' });
  if (error) throw error;

  return path;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const path = `clientes/${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from('fotos')
    .upload(path, await lerBytes(uri), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;

  return path;
}

export async function removerFoto(path: string) {
  await supabase.storage.from('fotos').remove([path]);
}