import { Link } from 'react-router-dom';
import Logo from '../Logo';
import UserMenu from './UserMenu';

export default function AppHeader({ children, right }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Logo to="/dashboard" />
          {children}
        </div>
        <div className="flex items-center gap-3">
          {right}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-slate-300">/</span>}
          {item.to ? (
            <Link to={item.to} className="transition hover:text-primary-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
