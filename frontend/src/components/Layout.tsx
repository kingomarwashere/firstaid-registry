import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav('/'); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-extrabold">+</span>
                </div>
                <span className="text-white font-bold text-base tracking-tight hidden sm:block">FirstAid Registry</span>
              </div>
              <div className="flex items-center gap-0.5">
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/map" className={linkClass}>Live Map</NavLink>
                <NavLink to="/profile" className={linkClass}>Profile</NavLink>
                {user?.is_admin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${user?.is_available ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
                <span className="text-slate-300 text-sm hidden sm:block">{user?.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium hidden sm:inline ${user?.is_available ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                  {user?.is_available ? 'Available' : 'Offline'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-300 text-sm transition-colors ml-1"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
