
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
    { id: Owner.GLOBAL, label: 'Vault Alpha', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'Objectifs', icon: <span className="text-lg">🎯</span> },
    { id: Owner.LARBI, label: 'Larbi', icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">L</div> },
    { id: Owner.YASSINE, label: 'Yassine', icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-slate-900 text-white dark:bg-indigo-600 rounded-lg">Y</div> },
    { id: Owner.CRYPTO, label: 'Crypto', icon: <span className="text-base">🪙</span> },
    { id: 'Add', label: 'Nouvel Audit', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* Sidebar Elite */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-10 border-b border-slate-100 dark:border-slate-800/50">
          <h1 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter uppercase leading-none italic">
            MILLIONAIRE<br/>
            <span className="text-indigo-600 not-italic text-2xl">2027</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 mt-2 tracking-[0.4em] uppercase">Private Asset Vault</p>
        </div>
        
        <nav className="flex-1 px-6 py-10 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-6 py-4 rounded-[1.5rem] transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-slate-950 text-white dark:bg-indigo-600 font-black shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)]' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-6 flex justify-center">{item.icon}</div>
              <span className="text-[12px] font-black ml-4 uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-4">
           <button 
             onClick={() => setIsDark(!isDark)}
             className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-400 transition-all shadow-sm"
           >
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">Terminal {isDark ? 'Alpha' : 'Beta'}</span>
             <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
           </button>
           <div className="bg-slate-950 p-6 rounded-[2rem] text-white border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/20 blur-3xl"></div>
             <p className="relative z-10 text-[10px] font-black italic opacity-60 leading-relaxed uppercase tracking-widest text-indigo-400 mb-1">Status</p>
             <p className="relative z-10 text-[12px] font-black uppercase tracking-tighter">"Discipline = Fortune"</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar ultra-fine */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-10 shrink-0 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.5em] italic">
              Terminal Connecté : {navItems.find(n => n.id === activeView)?.label || 'Alpha'}
            </h2>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex -space-x-3">
                <div className="w-9 h-9 rounded-xl border-[3px] border-white dark:border-slate-800 bg-slate-950 flex items-center justify-center text-[10px] text-white font-black shadow-lg">L</div>
                <div className="w-9 h-9 rounded-xl border-[3px] border-white dark:border-slate-800 bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black shadow-lg">Y</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 md:p-14 bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="max-w-7xl mx-auto pb-32">
            {children}
          </div>
        </div>

        {/* Mobile Bar High Tech */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-slate-950 dark:bg-indigo-900/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex items-center justify-around p-3 z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {navItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center p-3 transition-all ${
                activeView === item.id ? 'text-white scale-110' : 'text-slate-500'
              }`}
            >
              <div>{item.icon}</div>
            </button>
          ))}
          <button onClick={() => onNavigate('Add')} className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl -mt-12 border-4 border-slate-50 dark:border-slate-950">
            <Icons.Plus />
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
