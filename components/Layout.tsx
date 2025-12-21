
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
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const navItems = [
    { id: Owner.GLOBAL, label: 'Global', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'Focus', icon: <span className="text-base">🎯</span> },
    { id: Owner.LARBI, label: 'Larbi', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded">L</div> },
    { id: Owner.YASSINE, label: 'Yassine', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[9px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 rounded">Y</div> },
    { id: 'Add', label: 'Ajouter', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar - Desktop (Narrower & Denser) */}
      <aside className="w-60 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-base font-black text-indigo-600 tracking-tighter uppercase leading-none italic">
            MILLIONAIRE<br/>
            <span className="text-slate-900 dark:text-white not-italic">EN 2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-5 flex justify-center scale-90">{item.icon}</div>
              <span className="text-[11px] font-bold ml-2.5 uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all shadow-sm"
           >
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mode</span>
             <span className="text-xs">{isDark ? '🌙' : '☀️'}</span>
           </button>
           <div className="bg-slate-900 dark:bg-indigo-900/40 p-3 rounded-lg text-white">
             <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">Statut Vault</p>
             <p className="text-[9px] mt-1 font-bold leading-tight italic opacity-90">"Discipline = Liberté."</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 transition-colors">
          <h2 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            {navItems.find(n => n.id === activeView)?.label || 'Chargement...'}
          </h2>
          <div className="flex gap-1.5">
             <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[8px] text-white font-black">L</div>
             <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center text-[8px] text-white font-black">Y</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-slate-50 dark:bg-slate-950 pb-20 md:pb-6 transition-colors">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>

        {/* Navigation Mobile (More compact) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-1.5 pb-5 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center p-1.5 transition-all ${
                activeView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className="mb-0.5 scale-90">{item.icon}</div>
              <span className="text-[7px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
          <button onClick={toggleTheme} className="p-1.5 text-xs">{isDark ? '🌙' : '☀️'}</button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
