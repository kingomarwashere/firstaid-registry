import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => { logout(); nav('/'); };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-red-700 text-white' : 'text-gray-300 hover:bg-red-800 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-white text-xl font-bold">🚑 FirstAid Registry</span>
              <div className="hidden md:flex items-center gap-1 ml-6">
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/map" className={linkClass}>Live Map</NavLink>
                <NavLink to="/profile" className={linkClass}>Profile</NavLink>
                {user?.is_admin ? <NavLink to="/admin" className={linkClass}>Admin</NavLink> : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-red-200 text-sm hidden sm:block">{user?.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${user?.is_available ? 'bg-green-400 text-green-900' : 'bg-gray-500 text-gray-100'}`}>
                {user?.is_available ? 'Available' : 'Offline'}
              </span>
              <button onClick={handleLogout} className="text-red-200 hover:text-white text-sm transition-colors">Sign out</button>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden pb-2 flex gap-1">
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/map" className={linkClass}>Map</NavLink>
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
            {user?.is_admin ? <NavLink to="/admin" className={linkClass}>Admin</NavLink> : null}
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
