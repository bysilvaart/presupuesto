const DEFAULT_BASE_URL = 'https://api.cmfchile.cl/api-sbifv3/recursos_api';

const apiKey = import.meta.env.VITE_CMF_API_KEY;
const apiSecret = import.meta.env.VITE_CMF_API_SECRET;
const baseUrl = import.meta.env.VITE_CMF_API_BASE_URL ?? DEFAULT_BASE_URL;

class MissingCredentialsError extends Error {
  constructor() {
    super('Debes configurar las credenciales de la API de la CMF (VITE_CMF_API_KEY y VITE_CMF_API_SECRET).');
    this.name = 'MissingCredentialsError';
  }
}

const getAuthParams = () => {
  if (!apiKey || !apiSecret) {
    throw new MissingCredentialsError();
  }
  const params = new URLSearchParams();
  params.set('apikey', apiKey);
  params.set('token', apiSecret);
  params.set('formato', 'json');
  return params;
};

const parseChileanNumber = (value: string | number | undefined): number | undefined => {
  if (typeof value === 'number') return value;
  if (!value) return undefined;
  const sanitized = value
    .toString()
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const requestFromCMF = async (resource: string, path: string) => {
  const params = getAuthParams();
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${resource}/${path.replace(/^\//, '')}`);
  url.search = params.toString();

  const response = await fetch(url.toString());

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Error al consultar la API de la CMF (${response.status} ${response.statusText}). ${errorText}`.trim()
    );
  }

  return response.json() as Promise<Record<string, unknown>>;
};

export interface SerieDatoCMF {
  mes: string;
  valor: number;
}

const extractSerieDato = (payload: Record<string, unknown> | undefined, clave: string): SerieDatoCMF | undefined => {
  if (!payload) return undefined;
  const series =
    (payload[clave] as Array<Record<string, string>> | undefined) ??
    (payload[clave.toLowerCase() as keyof typeof payload] as Array<Record<string, string>> | undefined) ??
    [];
  if (!Array.isArray(series) || series.length === 0) return undefined;
  const registro = series[series.length - 1];
  const fecha = registro?.Fecha ?? registro?.fecha;
  const valor = parseChileanNumber(registro?.Valor ?? registro?.valor);
  if (!fecha || typeof fecha !== 'string' || valor === undefined) return undefined;
  const mes = fecha.slice(0, 7);
  return { mes, valor };
};

export const fetchUTMForMonth = async (year: number, month: number): Promise<SerieDatoCMF | undefined> => {
  const monthString = month.toString().padStart(2, '0');
  const payload = await requestFromCMF('utm', `periodo/${year}/${monthString}`);
  return extractSerieDato(payload, 'UTMs');
};

export const fetchIPCForMonth = async (year: number, month: number): Promise<SerieDatoCMF | undefined> => {
  const monthString = month.toString().padStart(2, '0');
  const payload = await requestFromCMF('ipc', `periodo/${year}/${monthString}`);
  return extractSerieDato(payload, 'IPCs');
};

export const isMissingCredentialsError = (error: unknown): error is MissingCredentialsError => {
  return error instanceof MissingCredentialsError;
};
