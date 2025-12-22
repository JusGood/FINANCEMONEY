
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
    { id: Owner.GLOBAL, label: 'Dashboard', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'Objectifs', icon: <span className="text-lg">🎯</span> },
    { id: Owner.LARBI, label: 'Larbi', icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-md">L</div> },
    { id: Owner.YASSINE, label: 'Yassine', icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 rounded-md">Y</div> },
    { id: Owner.CRYPTO, label: 'Crypto', icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[14px] text-amber-500">🪙</div> },
    { id: 'Add', label: 'Ajouter Flux', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-base font-black text-indigo-600 tracking-tighter uppercase leading-none italic">
            MILLIONAIRE<br/>
            <span className="text-slate-900 dark:text-white not-italic text-lg">EN 2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-6 flex justify-center">{item.icon}</div>
              <span className="text-[13px] font-bold ml-3 uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-3">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-all shadow-sm"
           >
             <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Mode {isDark ? 'Clair' : 'Sombre'}</span>
             <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
           </button>
           <div className="bg-slate-900 dark:bg-indigo-950 p-4 rounded-xl text-white shadow-xl">
             <p className="text-[11px] font-bold italic opacity-90 leading-snug">"La rigueur attire l'argent."</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Compact */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors">
          <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] italic">
            {navItems.find(n => n.id === activeView)?.label || 'Vault'}
          </h2>
          <div className="flex gap-3 items-center">
             <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">L</div>
                <div className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-800 bg-purple-600 flex items-center justify-center text-[10px] text-white font-black">Y</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-6xl mx-auto pb-24 md:pb-8">
            {children}
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-2 pb-6 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center p-2 transition-all ${
                activeView === item.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setIsDark(!isDark)} className="p-2 text-base">{isDark ? '☀️' : '🌙'}</button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
