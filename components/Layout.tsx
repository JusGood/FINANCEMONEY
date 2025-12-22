
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { Owner } from '../types';

export type ViewType = Owner | 'Add' | 'Focus' | 'CryptoView';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
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
    { id: 'CryptoView', label: 'CRYPTO VAULT', icon: <span className="text-sm">🪙</span> },
    { id: Owner.LARBI, label: 'LARBI', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg shadow-sm">L</div> },
    { id: Owner.YASSINE, label: 'YASSINE', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg shadow-sm">Y</div> },
    { id: 'Focus', label: 'OBJECTIFS', icon: <span className="text-sm">🎯</span> },
    { id: 'Add', label: 'OPÉRATION', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100">
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50">
          <h1 className="text-lg font-black text-slate-950 dark:text-white tracking-tighter uppercase italic leading-none">
            VAULT<br/>
            <span className="text-indigo-600 not-italic text-2xl tracking-normal">2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-slate-950 text-white dark:bg-indigo-600 font-bold shadow-xl translate-x-1' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="w-6 flex justify-center">{item.icon}</div>
              <span className="text-[10px] font-black ml-4 uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/50 transition-all"
           >
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">{isDark ? 'COFFRE NUIT' : 'COFFRE JOUR'}</span>
             <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-10 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] italic">
              {navItems.find(n => n.id === activeView)?.label || 'GESTIONNAIRE'} — SYSTÈME ACTIF
            </h2>
          </div>
          <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
