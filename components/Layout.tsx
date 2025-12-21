
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
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navItems = [
    { id: Owner.GLOBAL, label: 'Global', icon: <Icons.Dashboard /> },
    { id: 'Focus', label: 'Objectifs', icon: <span className="text-lg">🎯</span> },
    { id: Owner.LARBI, label: 'Larbi', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[10px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-md">L</div> },
    { id: Owner.YASSINE, label: 'Yassine', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 rounded-md">Y</div> },
    { id: 'Add', label: 'Ajouter', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar - Desktop (Plus fine) */}
      <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h1 className="text-lg font-black text-indigo-600 tracking-tighter uppercase leading-none italic">
            MILLIONAIRE<br/>
            <span className="text-slate-900 dark:text-white not-italic">EN 2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 dark:shadow-none' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-6 flex justify-center">{item.icon}</div>
              <span className="text-xs font-bold ml-3 uppercase tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 space-y-3">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all"
           >
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Thème</span>
             <span className="text-sm">{isDark ? '🌙' : '☀️'}</span>
           </button>
           <div className="bg-slate-900 dark:bg-indigo-900/20 p-4 rounded-xl text-white">
             <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">Stratégie</p>
             <p className="text-[10px] mt-1 font-bold leading-tight italic">"L'ordre crée la fortune."</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
            {navItems.find(n => n.id === activeView)?.label || 'Chargement...'}
          </h2>
          <div className="flex gap-2">
             <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-[9px] text-white font-black">L</div>
             <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center text-[9px] text-white font-black">Y</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fdfdfd] dark:bg-slate-950 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Navigation Mobile (Plus compacte) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around p-2 pb-6 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center p-2 transition-all ${
                activeView === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              <div className="mb-0.5">{item.icon}</div>
              <span className="text-[7px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
          <button onClick={toggleTheme} className="p-2 text-sm">{isDark ? '🌙' : '☀️'}</button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;
