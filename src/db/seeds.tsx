import { createContext, ReactNode, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { budgetDB, ComercianteRegla, IndiceIPC, Movimiento, Obligacion, SinkingFund, Suscripcion } from './dexie';
import LoadingScreen from '@/components/LoadingScreen';

interface SeedContextValue {
  ready: boolean;
}

export const SeedContext = createContext<SeedContextValue>({ ready: false });

const movimientosSeed: Movimiento[] = [
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Comida fuera',
    subcategoria: 'Café',
    comerciante: 'Starbucks',
    canal: 'Cafetería',
    contexto: 'Trabajo',
    metodo: 'Débito',
    monto: 4500,
    esFijo: false,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Supermercado',
    comerciante: 'Lider',
    canal: 'Supermercado',
    contexto: 'Casa',
    metodo: 'Débito',
    monto: 35000,
    esFijo: true,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Transporte',
    comerciante: 'Metro',
    canal: 'Tienda',
    contexto: 'Trabajo',
    metodo: 'Débito',
    monto: 1200,
    mes: new Date().toISOString().slice(0, 7)
  } as Movimiento,
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    comerciante: 'Empresa',
    metodo: 'Transferencia',
    monto: 1500000,
    esFijo: true,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Ocio y suscripciones',
    comerciante: 'Netflix',
    canal: 'Online',
    metodo: 'Crédito',
    monto: 9900,
    esFijo: true,
    mes: new Date().toISOString().slice(0, 7),
    suscripcionId: 'netflix'
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Arriendo',
    comerciante: 'Pensión Maxi',
    canal: 'Online',
    metodo: 'Transferencia',
    monto: 420000,
    esFijo: true,
    mes: new Date().toISOString().slice(0, 7),
    obligacionId: 'pension-maxi'
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Almuerzo oficina',
    comerciante: 'Cafetería local',
    canal: 'Cafetería',
    contexto: 'Trabajo',
    metodo: 'Efectivo',
    monto: 6500,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Comida fuera',
    comerciante: 'Juanito Sanguches',
    canal: 'Restaurant',
    metodo: 'Débito',
    monto: 7800,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Delivery',
    comerciante: 'PedidosYa',
    canal: 'Delivery',
    metodo: 'Crédito',
    monto: 12990,
    mes: new Date().toISOString().slice(0, 7)
  },
  {
    id: uuid(),
    fecha: new Date().toISOString(),
    tipo: 'Gasto',
    categoria: 'Pago tarjeta',
    comerciante: 'Banco',
    canal: 'Online',
    metodo: 'Transferencia',
    monto: 250000,
    mes: new Date().toISOString().slice(0, 7)
  }
];

const suscripcionesSeed: Suscripcion[] = [
  {
    id: 'netflix',
    servicio: 'Netflix',
    periodicidad: 'Anual',
    precioCiclo: 120000,
    categoria: 'Ocio y suscripciones',
    metodoPago: 'Crédito',
    renuevaEl: new Date().toISOString(),
    estado: 'Activa',
    uso: 'Alto',
    ultimoAumento: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'spotify',
    servicio: 'Spotify',
    periodicidad: 'Mensual',
    precioCiclo: 4990,
    categoria: 'Ocio y suscripciones',
    metodoPago: 'Débito',
    renuevaEl: new Date().toISOString(),
    estado: 'Activa',
    uso: 'Alto',
    ultimoAumento: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'notion',
    servicio: 'Notion Plus',
    periodicidad: 'Mensual',
    precioCiclo: 9500,
    categoria: 'Trabajo/Freelance',
    metodoPago: 'Crédito',
    renuevaEl: new Date().toISOString(),
    estado: 'Trial',
    uso: 'Medio',
    ultimoAumento: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const obligacionesSeed: Obligacion[] = [
  {
    id: 'pension-maxi',
    nombre: 'Pensión Maxi',
    tipo: 'Pensión',
    base: 400000,
    mesBase: '2023-12',
    indiceBase: 110.2,
    indiceActual: 112.5,
    fechaPago: new Date().toISOString(),
    pagado: false
  }
];

const indicesSeed: IndiceIPC[] = [
  { id: 'ipc-2023-12', mes: '2023-12', valor: 110.2 },
  { id: 'ipc-2024-01', mes: '2024-01', valor: 111.1 },
  { id: 'ipc-2024-02', mes: '2024-02', valor: 112.5, esUltimo: true },
  { id: 'ipc-2024-03', mes: '2024-03', valor: 113.0 }
];

const sinkingSeed: SinkingFund[] = [
  { id: uuid(), nombre: 'Navidad', montoAnual: 240000, activo: true },
  { id: uuid(), nombre: 'Vacaciones', montoAnual: 600000, activo: true },
  { id: uuid(), nombre: 'Mantención auto', montoAnual: 360000, activo: true }
];

const comerciantesSeed: ComercianteRegla[] = [
  { id: uuid(), patron: 'starbucks', categoriaPorDefecto: 'Comida fuera', canalPorDefecto: 'Cafetería' },
  { id: uuid(), patron: 'lider', categoriaPorDefecto: 'Supermercado', canalPorDefecto: 'Supermercado' },
  { id: uuid(), patron: 'metro', categoriaPorDefecto: 'Transporte', canalPorDefecto: 'Tienda' }
];

export const SeedProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seed = async () => {
      const count = await budgetDB.movimientos.count();
      if (count === 0) {
        await budgetDB.transaction('rw', budgetDB.tables, async () => {
          await budgetDB.movimientos.bulkAdd(movimientosSeed);
          await budgetDB.suscripciones.bulkAdd(suscripcionesSeed);
          await budgetDB.obligaciones.bulkAdd(obligacionesSeed);
          await budgetDB.indices.bulkAdd(indicesSeed);
          await budgetDB.sinkingFunds.bulkAdd(sinkingSeed);
          await budgetDB.comercianteReglas.bulkAdd(comerciantesSeed);
        });
      }
      setReady(true);
    };
    seed().catch((error) => {
      console.error('Error al cargar semillas', error);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return <SeedContext.Provider value={{ ready }}>{children}</SeedContext.Provider>;
};
