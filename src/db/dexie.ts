import Dexie, { Table } from 'dexie';

export type MovimientoTipo = 'Gasto' | 'Ingreso' | 'Transferencia';
export type MovimientoCanal =
  | 'Feria'
  | 'Supermercado'
  | 'Cafetería'
  | 'Restaurant'
  | 'Delivery'
  | 'Online'
  | 'Tienda';
export type MovimientoContexto = 'Casa' | 'Trabajo' | 'Calle' | 'Viaje';
export type MovimientoMetodo = 'Débito' | 'Crédito' | 'Efectivo' | 'Transferencia';

export interface Movimiento {
  id: string;
  fecha: string;
  tipo: MovimientoTipo;
  categoria: string;
  subcategoria?: string;
  comerciante?: string;
  canal?: MovimientoCanal;
  contexto?: MovimientoContexto;
  metodo?: MovimientoMetodo;
  monto: number;
  esFijo?: boolean;
  mes: string;
  suscripcionId?: string;
  obligacionId?: string;
}

export type SuscripcionPeriodicidad = 'Mensual' | 'Anual';
export type SuscripcionCategoria = 'Ocio y suscripciones' | 'Trabajo/Freelance' | 'Educación y libros';
export type SuscripcionEstado = 'Activa' | 'Trial' | 'Pausada' | 'Cancelar';
export type SuscripcionUso = 'Alto' | 'Medio' | 'Bajo';

export interface Suscripcion {
  id: string;
  servicio: string;
  periodicidad: SuscripcionPeriodicidad;
  precioCiclo: number;
  categoria: SuscripcionCategoria;
  metodoPago?: string;
  renuevaEl: string;
  estado: SuscripcionEstado;
  uso?: SuscripcionUso;
  ultimoAumento?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Obligacion {
  id: string;
  nombre: string;
  tipo: 'Pensión' | 'Arriendo indexado' | 'Otro';
  base: number;
  mesBase: string;
  indiceBase: number;
  indiceActual?: number;
  fechaPago: string;
  pagado?: boolean;
  comprobanteUrl?: string;
}

export interface IndiceIPC {
  id: string;
  mes: string;
  valor: number;
  esUltimo?: boolean;
}

export interface SinkingFund {
  id: string;
  nombre: string;
  montoAnual: number;
  activo: boolean;
  mesesMeta?: number;
}

export interface ComercianteRegla {
  id: string;
  patron: string;
  categoriaPorDefecto?: string;
  subcategoriaPorDefecto?: string;
  canalPorDefecto?: string;
}

export interface OfflineQueueItem {
  id?: number;
  type: 'movimiento' | 'suscripcion' | 'obligacion';
  payload: unknown;
  status: 'pending' | 'synced';
  createdAt: number;
}

export class BudgetDB extends Dexie {
  movimientos!: Table<Movimiento>;
  suscripciones!: Table<Suscripcion>;
  obligaciones!: Table<Obligacion>;
  indices!: Table<IndiceIPC>;
  sinkingFunds!: Table<SinkingFund>;
  comercianteReglas!: Table<ComercianteRegla>;
  offlineQueue!: Table<OfflineQueueItem>;

  constructor() {
    super('budget-db');
    this.version(1).stores({
      movimientos: 'id, fecha, mes, comerciante, categoria, suscripcionId, obligacionId',
      suscripciones: 'id, servicio, renuevaEl, categoria',
      obligaciones: 'id, nombre, tipo, fechaPago',
      indices: 'id, mes, esUltimo',
      sinkingFunds: 'id, nombre, activo',
      comercianteReglas: 'id, patron',
      offlineQueue: '++id, type, status'
    });
  }
}

export const budgetDB = new BudgetDB();
