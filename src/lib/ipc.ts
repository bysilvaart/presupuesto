import { v4 as uuid } from 'uuid';
import { budgetDB, IndiceIPC } from '@/db/dexie';
import { fetchIPCForMonth, fetchUTMForMonth, isMissingCredentialsError } from './cmf';

export const calcularAjusteIPC = (base: number, indiceBase: number, indiceActual?: number) => {
  if (!indiceActual) return base;
  return Math.round(base * (indiceActual / indiceBase));
};

export const obtenerIndiceActual = async (mes: string): Promise<IndiceIPC | undefined> => {
  return budgetDB.indices.get({ mes });
};

interface MesConsulta {
  iso: string;
  year: number;
  month: number;
}

const MESES_A_DESCARGAR = 12;

const obtenerMesesRecientes = (cantidad: number): MesConsulta[] => {
  const meses: MesConsulta[] = [];
  const fecha = new Date();
  fecha.setDate(1);

  for (let i = 0; i < cantidad; i += 1) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1;
    const iso = `${year}-${month.toString().padStart(2, '0')}`;
    meses.push({ iso, year, month });
    fecha.setMonth(fecha.getMonth() - 1);
  }

  return meses;
};

export interface ActualizacionIndicesResultado {
  procesados: number;
  agregados: number;
  actualizados: number;
}

const formatearError = (mensaje: string, error: unknown) => {
  const detalle = error instanceof Error ? error.message : String(error);
  return `${mensaje}: ${detalle}`;
};

export const actualizarIndicesDesdeAPI = async (): Promise<ActualizacionIndicesResultado> => {
  const meses = obtenerMesesRecientes(MESES_A_DESCARGAR);
  const datosPorMes = new Map<string, { valor?: number; utm?: number }>();

  for (const mes of meses) {
    try {
      const ipcDato = await fetchIPCForMonth(mes.year, mes.month);
      if (ipcDato) {
        const entry = datosPorMes.get(ipcDato.mes) ?? {};
        entry.valor = ipcDato.valor;
        datosPorMes.set(ipcDato.mes, entry);
      }
    } catch (error) {
      if (isMissingCredentialsError(error)) {
        throw error;
      }
      throw new Error(formatearError(`No se pudo obtener el IPC de ${mes.iso}`, error));
    }

    try {
      const utmDato = await fetchUTMForMonth(mes.year, mes.month);
      if (utmDato) {
        const entry = datosPorMes.get(utmDato.mes) ?? {};
        entry.utm = utmDato.valor;
        datosPorMes.set(utmDato.mes, entry);
      }
    } catch (error) {
      if (isMissingCredentialsError(error)) {
        throw error;
      }
      throw new Error(formatearError(`No se pudo obtener la UTM de ${mes.iso}`, error));
    }
  }

  if (datosPorMes.size === 0) {
    return { procesados: 0, agregados: 0, actualizados: 0 };
  }

  let agregados = 0;
  let actualizados = 0;
  let ultimoMesConDato: string | undefined;

  const entradasOrdenadas = Array.from(datosPorMes.entries()).sort(([mesA], [mesB]) => {
    if (mesA < mesB) return -1;
    if (mesA > mesB) return 1;
    return 0;
  });

  await budgetDB.transaction('rw', budgetDB.indices, async () => {
    for (const [mes, valores] of entradasOrdenadas) {
      if (valores.valor === undefined && valores.utm === undefined) {
        continue;
      }

      if (!ultimoMesConDato || mes > ultimoMesConDato) {
        ultimoMesConDato = mes;
      }

      const existente = await budgetDB.indices.get({ mes });

      if (!existente) {
        if (valores.valor === undefined) {
          // No generamos un registro nuevo si la API no entrega valor IPC aún.
          continue;
        }
        const nuevo: IndiceIPC = {
          id: uuid(),
          mes,
          valor: valores.valor,
          utm: valores.utm
        };
        await budgetDB.indices.add(nuevo);
        agregados += 1;
        continue;
      }

      const cambios: Partial<IndiceIPC> = {};
      let hayCambios = false;

      if (valores.valor !== undefined && valores.valor !== existente.valor) {
        cambios.valor = valores.valor;
        hayCambios = true;
      }

      if (valores.utm !== undefined && valores.utm !== existente.utm) {
        cambios.utm = valores.utm;
        hayCambios = true;
      }

      if (hayCambios) {
        await budgetDB.indices.update(existente.id, cambios);
        actualizados += 1;
      }
    }

    if (ultimoMesConDato) {
      const ultimoRegistro = await budgetDB.indices.where('mes').equals(ultimoMesConDato).first();
      if (ultimoRegistro) {
        await budgetDB.indices.where('esUltimo').equals(1).modify({ esUltimo: false });
        await budgetDB.indices.update(ultimoRegistro.id, { esUltimo: true });
      }
    }
  });

  return { procesados: datosPorMes.size, agregados, actualizados };
};
