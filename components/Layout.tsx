
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
    { id: Owner.GLOBAL, label: 'ACCUEIL', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'OBJECTIFS', icon: <span className="text-sm">🎯</span> },
    { id: Owner.LARBI, label: 'LARBI', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">L</div> },
    { id: Owner.YASSINE, label: 'YASSINE', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">Y</div> },
    { id: Owner.CRYPTO, label: 'CRYPTO', icon: <span className="text-sm">🪙</span> },
    { id: 'Add', label: 'AJOUTER', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
          <h1 className="text-lg font-black text-slate-950 dark:text-white tracking-tighter uppercase italic">
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
                  ? 'bg-slate-950 text-white dark:bg-indigo-600 font-bold shadow-lg' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="w-5 flex justify-center">{item.icon}</div>
              <span className="text-[10px] font-bold ml-3 uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
           >
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{isDark ? 'NUIT' : 'JOUR'}</span>
             <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
              {navItems.find(n => n.id === activeView)?.label || 'GESTION'}
            </h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
