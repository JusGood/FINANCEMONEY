
import React from 'react';
import { Icons } from '../constants';
import { Owner } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: Owner | 'Add' | 'Focus';
  onNavigate: (view: Owner | 'Add' | 'Focus') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const navItems = [
    { 
      id: Owner.GLOBAL, 
      label: 'Global', 
      icon: <Icons.Dashboard />, 
      mobileLabel: 'Dashboard' 
    },
    { 
      id: 'Focus', 
      label: 'Objectifs', 
      icon: <span className="text-xl">🎯</span>, 
      mobileLabel: 'Focus' 
    },
    { 
      id: Owner.LARBI, 
      label: 'Espace Larbi', 
      icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">L</div>, 
      mobileLabel: 'Larbi' 
    },
    { 
      id: Owner.YASSINE, 
      label: 'Espace Yassine', 
      icon: <div className="w-6 h-6 flex items-center justify-center font-black text-[11px] bg-purple-100 text-purple-600 rounded-lg shadow-sm">Y</div>, 
      mobileLabel: 'Yassine' 
    },
    { 
      id: 'Add', 
      label: 'Ajouter', 
      icon: <div className="p-1 bg-slate-100 rounded-md"><Icons.Plus /></div>, 
      mobileLabel: 'Plus' 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-8">
          <h1 className="text-xl font-black text-indigo-600 tracking-tighter uppercase leading-tight italic">
            MILLIONAIRE<br/>
            <span className="text-slate-900 not-italic">EN 2027</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center px-4 py-4 rounded-2xl transition-all duration-200 group ${
                activeView === item.id 
                  ? 'bg-slate-900 text-white font-bold shadow-xl translate-x-1' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {/* Conteneur d'icône fixe pour l'alignement vertical parfait */}
              <div className="w-10 flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-90">
                {item.icon}
              </div>
              <span className="text-sm font-bold tracking-tight ml-2">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-indigo-600 rounded-[2rem] p-6 text-white text-center shadow-lg shadow-indigo-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Rappel Focus</p>
            <p className="text-xs mt-2 font-bold leading-tight italic">"Une tâche terminée est un pas vers la fortune."</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
            {navItems.find(n => n.id === activeView)?.label || 'Chargement...'}
          </h2>
          <div className="flex -space-x-1">
             <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black border-2 border-white shadow-sm">L</div>
             <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-[10px] text-white font-black border-2 border-white shadow-sm">Y</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f8f9fc] pb-32">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Navigation Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around p-3 pb-8 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id ? 'text-indigo-600 scale-105' : 'text-slate-400'
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                {item.icon}
              </div>
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{item.mobileLabel}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;
