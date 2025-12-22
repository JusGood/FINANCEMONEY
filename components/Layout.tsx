
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { Owner } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: Owner | 'Add' | 'Focus';
  onNavigate: (view: Owner | 'Add' | 'Focus') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { id: Owner.GLOBAL, label: 'VAULT ALPHA', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'OBJECTIFS', icon: <span className="text-sm">🎯</span> },
    { id: Owner.LARBI, label: 'LARBI', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">L</div> },
    { id: Owner.YASSINE, label: 'YASSINE', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">Y</div> },
    { id: Owner.CRYPTO, label: 'CRYPTO', icon: <span className="text-sm">🪙</span> },
    { id: 'Add', label: 'AUDIT', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30">
      {/* Sidebar - Slim and Professional */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
          <h1 className="text-lg font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-tight italic">
            VAULT<br/>
            <span className="text-indigo-600 not-italic text-xl">2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-slate-950 text-white dark:bg-indigo-600 font-bold shadow-lg shadow-indigo-600/10' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-5 flex justify-center opacity-70">{item.icon}</div>
              <span className="text-[11px] font-bold ml-3 uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-3">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-400 transition-all"
           >
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{isDark ? 'DARK' : 'LIGHT'}</span>
             <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Compact */}
        <header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
              PROTOCOLE ACTIF : {navItems.find(n => n.id === activeView)?.label || 'ALPHA'}
            </h2>
          </div>
          <div className="flex gap-2 items-center">
             <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-800 bg-slate-950 flex items-center justify-center text-[9px] text-white font-black">L</div>
                <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[9px] text-white font-black">Y</div>
             </div>
          </div>
        </header>

        {/* Content Area - Information Dense */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>

        {/* Mobile Navigation - Minimalist */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-around p-2 z-50 shadow-2xl">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`p-3 transition-all ${
                activeView === item.id ? 'text-white scale-110' : 'text-slate-500'
              }`}
            >
              <div className="w-5 h-5">{item.icon}</div>
            </button>
          ))}
          <button onClick={() => onNavigate('Add')} className="bg-indigo-600 text-white p-3 rounded-xl shadow-xl">
            <Icons.Plus />
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
