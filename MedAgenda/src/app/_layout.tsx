import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  useEffect(() => {
    supabase
      .from('unidades')
      .select('*')
      .limit(1)
      .then(({ data, error }) => console.log('TESTE SUPABASE:', { data, error }));
  }, []);

  return <Slot />;
}