import { NavLink } from 'react-router-dom';

interface SidebarProps {
  navItems: { to: string; label: string; icon: string }[];
}

const Sidebar = ({ navItems }: SidebarProps) => (
  <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-900 bg-slate-950/80 px-4 py-6 backdrop-blur lg:flex">
    <div className="mb-8 flex items-center gap-3">
      <span className="text-2xl" role="img" aria-label="alcancía">
        🐖
      </span>
      <div>
        <p className="text-sm text-slate-400">Tu presupuesto</p>
        <p className="text-lg font-semibold">PresuPWA</p>
      </div>
    </div>
    <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
              isActive ? 'bg-brand/10 text-brand' : 'text-slate-300 hover:bg-slate-900'
            }`
          }
        >
          <span aria-hidden>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
    <p className="mt-auto text-xs text-slate-500">⌨️ Ctrl/Cmd + K para capturar rápido</p>
  </aside>
);

export default Sidebar;
