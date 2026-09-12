import { Link, useLocation } from 'react-router-dom';
import { Home, History, Settings, Search, PlusCircle, LogOut, BrainCircuit, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'New Research', icon: Search, path: '/' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const fullName = user?.user_metadata?.full_name || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

  return (
    <aside className="w-full lg:w-64 border-r border-white/5 bg-black/60 lg:bg-black/20 backdrop-blur-3xl lg:backdrop-blur-xl flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center justify-between">
        <Link to="/" onClick={onClose} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ResearchMind
          </span>
        </Link>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-2">
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{fullName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all w-full text-left"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
