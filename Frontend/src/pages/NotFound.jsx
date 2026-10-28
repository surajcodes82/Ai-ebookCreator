import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo to="/" />
      <p className="mt-10 text-6xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">This page doesn’t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The link may be outdated, or the page has moved. Head back to your dashboard to keep writing.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-secondary">
          Go Home
        </Link>
        <Link to="/dashboard" className="btn-primary">
          <Compass size={16} /> Open Dashboard
        </Link>
      </div>
    </div>
  );
}
