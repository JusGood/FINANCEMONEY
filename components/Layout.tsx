
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
    { id: Owner.GLOBAL, label: 'Tableau de bord', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'Objectifs', icon: <span className="text-base">🎯</span> },
    { id: Owner.LARBI, label: 'Larbi', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded">L</div> },
    { id: Owner.YASSINE, label: 'Yassine', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 rounded">Y</div> },
    { id: 'Add', label: 'Nouveau flux', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar - Desktop (Plus étroite pour gagner de la place) */}
      <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-sm font-black text-indigo-600 tracking-tighter uppercase leading-none italic">
            MILLIONAIRE<br/>
            <span className="text-slate-900 dark:text-white not-italic">EN 2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-5 flex justify-center scale-90">{item.icon}</div>
              <span className="text-[11px] font-bold ml-2 uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all shadow-sm"
           >
             <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Mode {isDark ? 'Clair' : 'Sombre'}</span>
             <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
           </button>
           <div className="bg-indigo-600 dark:bg-indigo-900 p-3 rounded-lg text-white shadow-lg">
             <p className="text-[9px] font-bold italic opacity-90 leading-tight">"La rigueur attire l'argent."</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Compact */}
        <header className="h-11 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 transition-colors">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
            {navItems.find(n => n.id === activeView)?.label || 'Vault'}
          </h2>
          <div className="flex gap-2 items-center">
             <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded border border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[8px] text-white font-black">L</div>
                <div className="w-5 h-5 rounded border border-white dark:border-slate-800 bg-purple-600 flex items-center justify-center text-[8px] text-white font-black">Y</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-5xl mx-auto pb-20 md:pb-6">
            {children}
          </div>
        </div>

        {/* Mobile Nav Denser */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-1.5 pb-5 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center p-2 transition-all ${
                activeView === item.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className="mb-0.5 scale-90">{item.icon}</div>
              <span className="text-[7px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-xs">{isDark ? '☀️' : '🌙'}</button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
