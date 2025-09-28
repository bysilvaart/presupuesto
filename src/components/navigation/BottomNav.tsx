import { NavLink } from 'react-router-dom';

interface BottomNavProps {
  items: { to: string; label: string; icon: string }[];
}

const BottomNav = ({ items }: BottomNavProps) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-slate-800 bg-slate-900/90 py-2 backdrop-blur md:hidden"
    role="navigation"
    aria-label="Navegación inferior"
  >
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 rounded-full px-3 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${
            isActive ? 'text-brand' : 'text-slate-300'
          }`
        }
      >
        <span aria-hidden className="text-lg">
          {item.icon}
        </span>
        {item.label}
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
