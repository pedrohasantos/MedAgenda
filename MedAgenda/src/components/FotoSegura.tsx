import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { urlDaFoto } from '../services/catalogo';

export function FotoSegura({
  path, tamanho = 56, redonda = true, icone = 'person',
}: {
  path: string | null;
  tamanho?: number;
  redonda?: boolean;
  icone?: keyof typeof Ionicons.glyphMap;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    urlDaFoto(path).then((u) => ativo && setUrl(u)).catch(() => {});
    return () => { ativo = false; };
  }, [path]);

  const estilo = {
    width: tamanho,
    height: tamanho,
    borderRadius: redonda ? tamanho / 2 : 10,
  };

  if (!url) {
    return (
      <View style={[estilo, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name={icone} size={tamanho / 2} color="#9ca3af" />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={estilo} />;
}