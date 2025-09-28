import { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import { budgetDB, Movimiento } from '@/db/dexie';
import { formatCLP } from '@/lib/format';
import { isHormiga } from '@/lib/rules';
import MonthPicker from '@/components/ui/MonthPicker';
import EmptyState from '@/components/ui/EmptyState';
import { useCurrencyCLP } from '@/hooks/useCurrencyCLP';

const quickFilters = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Mes', value: 'month' }
] as const;

const MovimientosPage = () => {
  const movimientos = useLiveQuery(() => budgetDB.movimientos.orderBy('fecha').reverse().toArray(), []);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [tipo, setTipo] = useState<'Todos' | Movimiento['tipo']>('Todos');
  const [categoria, setCategoria] = useState<string>('Todas');
  const [search, setSearch] = useState('');
  const [quick, setQuick] = useState<typeof quickFilters[number]['value']>('month');
  const numberFormat = useCurrencyCLP();

  const filtered = useMemo(() => {
    if (!movimientos) return [];
    const now = new Date();
    return movimientos.filter((mov) => {
      if (tipo !== 'Todos' && mov.tipo !== tipo) return false;
      if (categoria !== 'Todas' && mov.categoria !== categoria) return false;
      if (mov.mes !== mes) return false;
      if (search && !mov.comerciante?.toLowerCase().includes(search.toLowerCase())) return false;
      if (quick === 'today') {
        const today = new Date();
        const movDate = new Date(mov.fecha);
        if (movDate.toDateString() !== today.toDateString()) return false;
      }
      if (quick === 'week') {
        const movDate = new Date(mov.fecha);
        const diff = Math.abs(now.getTime() - movDate.getTime());
        if (diff > 7 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [movimientos, tipo, categoria, mes, search, quick]);

  const categorias = useMemo(() => {
    return Array.from(new Set(movimientos?.map((mov) => mov.categoria).filter(Boolean))).sort();
  }, [movimientos]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10
  });

  const groupedPorComerciante = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    filtered.forEach((mov) => {
      const key = mov.comerciante ?? 'Sin comerciante';
      const current = map.get(key) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += mov.monto;
      map.set(key, current);
    });
    return Array.from(map.entries()).map(([comerciante, value]) => ({
      comerciante,
      ...value,
      promedio: value.total / value.count
    }));
  }, [filtered]);

  if (!movimientos) {
    return <p>Cargando movimientos…</p>;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
        <MonthPicker value={mes} onChange={setMes} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setQuick(filter.value)}
              className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                quick === filter.value ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Gasto', 'Ingreso', 'Transferencia'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTipo(option)}
              className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                tipo === option ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoria('Todas')}
            className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              categoria === 'Todas' ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoria(cat)}
              className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                categoria === cat ? 'bg-brand/20 text-brand' : 'bg-slate-900 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <label className="w-full" htmlFor="search">
          <span className="text-xs text-slate-400">Buscar comerciante</span>
          <input
            id="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Starbucks, feria…"
          />
        </label>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon="🗂" title="Sin movimientos" description="Captura un gasto desde el botón + o importa tu historial." />
      ) : (
        <div className="space-y-6">
          <div ref={parentRef} className="max-h-[420px] overflow-y-auto pr-2">
            <div
              style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}
              className="space-y-0"
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const movimiento = filtered[virtualRow.index];
                const top = virtualRow.start;
                const hormiga = isHormiga(movimiento);
                return (
                  <article
                    key={movimiento.id}
                    className="absolute left-0 right-0 flex items-center justify-between rounded-2xl border border-slate-900 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 shadow-soft"
                    style={{ top, transform: 'translateY(0)' }}
                    role="listitem"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{movimiento.comerciante ?? movimiento.categoria}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(movimiento.fecha).toLocaleDateString('es-CL')} · {movimiento.categoria}
                      </p>
                      {hormiga && <span className="mt-1 inline-flex rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-300">Hormiga</span>}
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${movimiento.tipo === 'Ingreso' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {movimiento.tipo === 'Ingreso' ? '+' : '-'}
                        {numberFormat.format(movimiento.monto)}
                      </p>
                      {movimiento.canal && <p className="text-[10px] text-slate-500">{movimiento.canal}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <section className="rounded-3xl border border-slate-900 bg-slate-900/70 p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-slate-200">Comerciantes frecuentes</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {groupedPorComerciante.map((item) => (
                <li key={item.comerciante} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{item.comerciante}</p>
                    <p className="text-xs text-slate-400">{item.count} movimientos · Ticket promedio {formatCLP(item.promedio)}</p>
                  </div>
                  <span className="text-xs text-slate-300">{formatCLP(item.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
};

export default MovimientosPage;
