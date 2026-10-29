import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import { Alert, Linking, Platform } from 'react-native';
import { FUSO } from '../lib/formatacao';

export type EventoConsulta = {
  consultaId: number;
  titulo: string;
  inicio: string; // ISO
  fim: string;    // ISO
  local?: string;
  notas?: string;
};

const chave = (id: number) => `evento_calendario:${id}`;

// ---------- Opção A: calendário do aparelho ----------

async function escolherCalendario(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try {
      return (await Calendar.getDefaultCalendarAsync()).id;
    } catch {
      // cai para a busca manual abaixo
    }
  }
  const todos = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const editaveis = todos.filter((c) => c.allowsModifications);
  const google = editaveis.filter((c) => c.source?.type === 'com.google');

  const escolhido =
    google.find((c) => c.isPrimary) ??
    google[0] ??
    editaveis.find((c) => c.isPrimary) ??
    editaveis[0];

  return escolhido?.id ?? null;
}

export async function adicionarNoAparelho(ev: EventoConsulta) {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  if (!perm.granted) throw new Error('PERMISSAO_NEGADA');

  const calendarId = await escolherCalendario();
  if (!calendarId) throw new Error('Nenhum calendário disponível no aparelho.');

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: ev.titulo,
    startDate: new Date(ev.inicio),
    endDate: new Date(ev.fim),
    location: ev.local,
    notes: ev.notas,
    timeZone: FUSO,
    alarms: [{ relativeOffset: -1440 }, { relativeOffset: -60 }], // 1 dia e 1 hora antes
  });

  await AsyncStorage.setItem(chave(ev.consultaId), eventId);
}

export async function jaAdicionado(consultaId: number) {
  return (await AsyncStorage.getItem(chave(consultaId))) !== null;
}

// Remove o evento criado pelo app (não pede permissão: se não tiver, ignora)
export async function removerDoAparelho(consultaId: number) {
  try {
    const eventId = await AsyncStorage.getItem(chave(consultaId));
    if (!eventId) return;
    const perm = await Calendar.getCalendarPermissionsAsync();
    if (!perm.granted) return;
    await Calendar.deleteEventAsync(eventId);
    await AsyncStorage.removeItem(chave(consultaId));
  } catch {
    // evento já apagado pelo usuário ou indisponível
  }
}

// ---------- Opção B: link do Google Calendar ----------

function dataGoogle(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function abrirGoogleCalendar(ev: EventoConsulta) {
  const q = (v: string) => encodeURIComponent(v);
  const url =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${q(ev.titulo)}` +
    `&dates=${dataGoogle(ev.inicio)}/${dataGoogle(ev.fim)}` +
    `&ctz=${q(FUSO)}` +
    `&location=${q(ev.local ?? '')}` +
    `&details=${q(ev.notas ?? '')}`;

  Linking.openURL(url).catch(() =>
    Alert.alert('Erro', 'Não foi possível abrir o Google Calendar.')
  );
}

// ---------- Pergunta ao usuário onde salvar ----------

export function oferecerCalendario(ev: EventoConsulta, aoAdicionar?: () => void) {
  Alert.alert('Adicionar ao calendário', 'Onde deseja salvar esta consulta?', [
    {
      text: 'Calendário do aparelho',
      onPress: async () => {
        try {
          await adicionarNoAparelho(ev);
          aoAdicionar?.();
          Alert.alert(
            'Pronto',
            'Consulta adicionada. Se sua conta Google estiver sincronizada no aparelho, ela também aparecerá no Google Calendar.'
          );
        } catch (e: any) {
          const negou = e?.message === 'PERMISSAO_NEGADA';
          Alert.alert(
            negou ? 'Permissão negada' : 'Não foi possível salvar no aparelho',
            'Você pode adicionar pelo link do Google Calendar.',
            [
              { text: 'Fechar', style: 'cancel' },
              { text: 'Abrir Google Calendar', onPress: () => abrirGoogleCalendar(ev) },
            ]
          );
        }
      },
    },
    { text: 'Google Calendar (link)', onPress: () => abrirGoogleCalendar(ev) },
    { text: 'Agora não', style: 'cancel' },
  ]);
}