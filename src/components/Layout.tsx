import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-slate-200 overflow-hidden font-sans relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ResearchMind
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative scrollbar-hide">
          {/* Gradient Background Accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] -z-10 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] -z-10 rounded-full pointer-events-none" />
          
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
