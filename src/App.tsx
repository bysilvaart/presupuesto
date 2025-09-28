import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import { SeedProvider } from './db/seeds';

const QuickAddPage = lazy(() => import('./pages/capturar/QuickAddPage'));
const MovimientosPage = lazy(() => import('./pages/movimientos/MovimientosPage'));
const PanelPage = lazy(() => import('./pages/panel/PanelPage'));
const SuscripcionesPage = lazy(() => import('./pages/suscripciones/SuscripcionesPage'));
const ObligacionesPage = lazy(() => import('./pages/obligaciones/ObligacionesPage'));
const IndicesPage = lazy(() => import('./pages/indices/IndicesPage'));
const ImportPage = lazy(() => import('./pages/importar/ImportPage'));
const AjustesPage = lazy(() => import('./pages/ajustes/AjustesPage'));

function App() {
  return (
    <SeedProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/capturar" replace />} />
            <Route path="/capturar" element={<QuickAddPage />} />
            <Route path="/movimientos" element={<MovimientosPage />} />
            <Route path="/panel" element={<PanelPage />} />
            <Route path="/suscripciones" element={<SuscripcionesPage />} />
            <Route path="/obligaciones" element={<ObligacionesPage />} />
            <Route path="/indices" element={<IndicesPage />} />
            <Route path="/importar" element={<ImportPage />} />
            <Route path="/ajustes" element={<AjustesPage />} />
          </Route>
        </Routes>
      </Suspense>
    </SeedProvider>
  );
}

export default App;
