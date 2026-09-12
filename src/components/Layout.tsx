import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Gradient Background Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] -z-10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
