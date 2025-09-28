import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import KpiCard from '@/components/ui/KpiCard';
import StackedBarChart from '@/components/ui/StackedBarChart';
import BarChart from '@/components/ui/BarChart';
import { budgetDB } from '@/db/dexie';
import { formatCLP, derivePrecioMesSuscripcion, aporteMensualSinking } from '@/lib/format';
import { calcularAjusteIPC } from '@/lib/ipc';
import { isHormiga } from '@/lib/rules';
import MonthPicker from '@/components/ui/MonthPicker';
import EmptyState from '@/components/ui/EmptyState';

const PanelPage = () => {
  const movimientos = useLiveQuery(() => budgetDB.movimientos.toArray(), []);
  const suscripciones = useLiveQuery(() => budgetDB.suscripciones.toArray(), []);
  const obligaciones = useLiveQuery(() => budgetDB.obligaciones.toArray(), []);
  const sinkingFunds = useLiveQuery(() => budgetDB.sinkingFunds.toArray(), []);
  const indices = useLiveQuery(() => budgetDB.indices.toArray(), []);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));

  const data = useMemo(() => {
    if (!movimientos) return null;
    const delMes = movimientos.filter((mov) => mov.mes === mes);
    const ingresos = delMes.filter((mov) => mov.tipo === 'Ingreso').reduce((acc, mov) => acc + mov.monto, 0);
    const gastos = delMes.filter((mov) => mov.tipo === 'Gasto').reduce((acc, mov) => acc + mov.monto, 0);
    const fijos = delMes.filter((mov) => mov.esFijo).reduce((acc, mov) => acc + mov.monto, 0);
    const sinking = (sinkingFunds ?? [])
      .filter((fund) => fund.activo)
      .reduce((acc, fund) => acc + aporteMensualSinking(fund.montoAnual), 0);
    const variables = gastos - fijos;
    const ahorro = ingresos - gastos - sinking;
    const tasaAhorro = ingresos === 0 ? 0 : Math.round((ahorro / ingresos) * 100);
    const caps = { fijos: 600000, variables: 400000, sinking: 150000 };
    const desviacion = {
      fijos: fijos - caps.fijos,
      variables: variables - caps.variables,
      sinking: sinking - caps.sinking
    };
    const pagosDeuda = delMes
      .filter((mov) => mov.categoria.toLowerCase().includes('pago'))
      .reduce((acc, mov) => acc + mov.monto, 0);
    const dti = ingresos === 0 ? 0 : Math.round((pagosDeuda / ingresos) * 100);
    const comidaFuera = delMes.filter((mov) => mov.categoria === 'Comida fuera').reduce((acc, mov) => acc + mov.monto, 0);
    const comidaCasa = delMes.filter((mov) => mov.categoria === 'Supermercado').reduce((acc, mov) => acc + mov.monto, 0);

    const hormigas = delMes.filter(isHormiga);
    const hormigasPorComerciante = hormigas.reduce<Record<string, { count: number; total: number }>>((acc, mov) => {
      const key = mov.comerciante ?? 'Sin comerciante';
      const current = acc[key] ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += mov.monto;
      acc[key] = current;
      return acc;
    }, {});
    const hormigasTop = Object.entries(hormigasPorComerciante)
      .map(([comerciante, value]) => ({ comerciante, ...value, promedio: Math.round(value.total / value.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const suscripcionesMensual = (suscripciones ?? []).map((sus) => ({
      ...sus,
      precioMes: derivePrecioMesSuscripcion(sus)
    }));
    const suscripcionesTop = [...suscripcionesMensual].sort((a, b) => b.precioMes - a.precioMes).slice(0, 5);
    const totalSuscripcionesMes = suscripcionesMensual.reduce((acc, sus) => acc + sus.precioMes, 0);

    const obligacionesMes = (obligaciones ?? []).map((obl) => {
      const indiceActual = indices?.find((indice) => indice.mes === mes)?.valor ?? obl.indiceActual;
      const montoAjustado = calcularAjusteIPC(obl.base, obl.indiceBase, indiceActual);
      return { ...obl, montoAjustado, pagada: obl.pagado };
    });

    return {
      delMes,
      ingresos,
      gastos,
      fijos,
      variables,
      sinking,
      ahorro,
      tasaAhorro,
      desviacion,
      dti,
      comidaFuera,
      comidaCasa,
      hormigasTop,
      suscripcionesTop,
      totalSuscripcionesMes,
      obligacionesMes
    };
  }, [movimientos, mes, suscripciones, obligaciones, indices, sinkingFunds]);

  if (!data) {
    return <p>Cargando panel…</p>;
  }

  return (
    <section className="space-y-6">
      <MonthPicker value={mes} onChange={setMes} />
      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Tasa de ahorro" value={`${data.tasaAhorro}%`} description={`Ahorro neto ${formatCLP(data.ahorro)}`} />
        <KpiCard title="DTI mensual" value={`${data.dti}%`} description="Pagos de deuda / ingreso real" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-200">Fijos vs Variables vs Sinking</h2>
          <StackedBarChart
            data={[
              {
                name: mes,
                Fijos: data.fijos,
                Variables: data.variables,
                Sinking: data.sinking
              }
            ]}
            stackKeys={['Fijos', 'Variables', 'Sinking']}
            colors={['#38bdf8', '#a855f7', '#f97316']}
          />
        </div>
        <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-200">Desvíos vs caps</h2>
          <BarChart
            data={[
              { name: 'Fijos', value: data.desviacion.fijos },
              { name: 'Variables', value: data.desviacion.variables },
              { name: 'Sinking', value: data.desviacion.sinking }
            ]}
            color="#f87171"
          />
        </div>
        <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-200">Comida fuera vs casa</h2>
          <BarChart
            data={[
              { name: 'Fuera', value: data.comidaFuera },
              { name: 'Casa', value: data.comidaCasa }
            ]}
            color="#34d399"
          />
        </div>
        <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
          <h2 className="text-sm font-semibold text-slate-200">Top hormigas</h2>
          {data.hormigasTop.length === 0 ? (
            <EmptyState icon="🐜" title="Sin hormigas" description="Aún no detectamos gastos pequeños en ocio/comida." />
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {data.hormigasTop.map((item) => (
                <li key={item.comerciante} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{item.comerciante}</p>
                    <p className="text-xs text-slate-400">
                      {item.count} veces · Promedio {formatCLP(item.promedio)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300">{formatCLP(item.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Suscripciones</h2>
        <p className="text-xs text-slate-400">Total mensual estimado {formatCLP(data.totalSuscripcionesMes)}</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {data.suscripcionesTop.map((sus) => (
            <li key={sus.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
              <p className="font-semibold text-slate-100">{sus.servicio}</p>
              <p className="text-xs text-slate-400">
                {sus.periodicidad} · {formatCLP(sus.precioMes)} / mes · Uso {sus.uso ?? '—'}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-slate-900 bg-slate-900/80 p-4 shadow-soft">
        <h2 className="text-sm font-semibold text-slate-200">Obligaciones indexadas</h2>
        <ul className="mt-3 space-y-3">
          {data.obligacionesMes.map((obl) => (
            <li key={obl.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-3 text-sm">
              <div>
                <p className="font-semibold text-slate-100">{obl.nombre}</p>
                <p className="text-xs text-slate-400">{formatCLP(obl.montoAjustado)} · Pago {new Date(obl.fechaPago).toLocaleDateString('es-CL')}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${obl.pagada ? 'bg-emerald-500/20 text-emerald-300' : 'bg-orange-500/20 text-orange-300'}`}>
                {obl.pagada ? 'Pagada' : 'Pendiente'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default PanelPage;
