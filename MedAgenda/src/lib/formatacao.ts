export const FUSO = 'America/Sao_Paulo';

export function formatarData(iso: string) {
  const texto = new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', timeZone: FUSO,
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: FUSO,
  });
}

// 'AAAA-MM-DD' no fuso de Recife/São Paulo
export function chaveDoDia(d: Date | string) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: FUSO });
}

// '1990-12-25' -> '25/12/1990'
export function isoParaBr(iso: string | null) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

// '25/12/1990' -> '1990-12-25' (ou null se inválida)
export function brParaIso(br: string) {
  const m = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mes, a] = m;
  const data = new Date(Number(a), Number(mes) - 1, Number(d));
  const valida =
    data.getFullYear() === Number(a) &&
    data.getMonth() === Number(mes) - 1 &&
    data.getDate() === Number(d);
  return valida ? `${a}-${mes}-${d}` : null;
}

export function mascararCpf(cpf: string | null) {
  const n = (cpf ?? '').replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf ?? '';
}