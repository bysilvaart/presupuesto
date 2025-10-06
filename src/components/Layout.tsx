import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ReactNode, useEffect } from 'react';
import BottomNav from './navigation/BottomNav';
import Sidebar from './navigation/Sidebar';
import FabAdd from './ui/FabAdd';

const navItems = [
  { to: '/capturar', label: 'Capturar', icon: '📝' },
  { to: '/movimientos', label: 'Movimientos', icon: '📄' },
  { to: '/panel', label: 'Panel', icon: '📊' },
  { to: '/suscripciones', label: 'Suscripciones', icon: '💡' },
  { to: '/obligaciones', label: 'Obligaciones', icon: '🏠' },
  { to: '/indices', label: 'Índices', icon: '📈' },
  { to: '/importar', label: 'Importar', icon: '⬆️' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' }
];

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-slate-950/80 px-4 py-3 backdrop-blur">
      <h1 className="text-xl font-semibold text-slate-100" tabIndex={-1}>
        {children}
      </h1>
      <div className="hidden gap-2 md:flex">
        {navItems.slice(0, 3).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-full px-3 py-1 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
                isActive ? 'bg-brand/10 text-brand' : 'text-slate-300 hover:text-brand'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        navigate('/capturar');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        navigate('/movimientos');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        navigate('/panel');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const currentNav = navItems.find((item) => item.to === location.pathname);

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col">
        <SectionHeader>{currentNav?.label ?? 'Presupuesto'}</SectionHeader>
        <main className="relative flex-1 pb-24 pt-4 md:pb-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
            <Outlet />
          </div>
        </main>
      </div>
      <FabAdd />
      <BottomNav items={navItems} />
    </div>
  );
};

export default Layout;
