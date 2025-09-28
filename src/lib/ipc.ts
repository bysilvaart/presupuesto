import { budgetDB, IndiceIPC } from '@/db/dexie';

export const calcularAjusteIPC = (base: number, indiceBase: number, indiceActual?: number) => {
  if (!indiceActual) return base;
  return Math.round(base * (indiceActual / indiceBase));
};

export const obtenerIndiceActual = async (mes: string): Promise<IndiceIPC | undefined> => {
  return budgetDB.indices.get({ mes });
};

export const actualizarIndicesDesdeAPI = async () => {
  // TODO: conectar con API real (BDE/mindicador) una vez que se cuente con credenciales.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [] as IndiceIPC[];
};
