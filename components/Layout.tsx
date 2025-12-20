import React from 'react';
import { Icons } from '../constants';
import { Owner } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: Owner | 'Add';
  onNavigate: (view: Owner | 'Add') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const navItems = [
    { id: Owner.GLOBAL, label: 'Global', icon: <Icons.Dashboard />, mobileLabel: 'Dashboard' },
    { id: Owner.LARBI, label: 'Espace Larbi', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[10px] bg-indigo-100 text-indigo-600 rounded-lg">L</div>, mobileLabel: 'Larbi' },
    { id: Owner.YASSINE, label: 'Espace Yassine', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-[10px] bg-purple-100 text-purple-600 rounded-lg">Y</div>, mobileLabel: 'Yassine' },
    { id: 'Add', label: 'Nouveau Flux', icon: <Icons.Plus />, mobileLabel: 'Ajouter' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
      {/* Sidebar - Desktop Only */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black text-indigo-600 tracking-tighter">FinanceFlow <span className="text-slate-400">AI</span></h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Multi-Comptes Larbi & Yassine</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {item.icon}
              <span className="text-sm font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
            <p className="text-xs font-black uppercase text-indigo-400 mb-2">Cloud Synchro</p>
            <p className="text-[10px] leading-relaxed opacity-80 relative z-10 font-bold">
              Données synchronisées en temps réel entre vos appareils.
            </p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-600/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header - Adaptive padding */}
        <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-10 shrink-0">
          <h2 className="text-sm md:text-lg font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px]">
            {navItems.find(n => n.id === activeView)?.label}
          </h2>
          <div className="flex items-center space-x-3">
             <div className="flex -space-x-2">
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white ${activeView === Owner.LARBI ? 'bg-indigo-600 scale-110 z-10 ring-2 ring-indigo-100' : 'bg-indigo-400 opacity-50'}`}>L</div>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] text-white font-black border-2 border-white ${activeView === Owner.YASSINE ? 'bg-purple-600 scale-110 z-10 ring-2 ring-purple-100' : 'bg-purple-400 opacity-50'}`}>Y</div>
             </div>
          </div>
        </header>

        {/* Content Area - Adaptive padding */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#FBFBFE] pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around p-2 pb-6 z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              <div className={`${activeView === item.id ? 'scale-110' : 'scale-100'} transition-transform`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">{item.mobileLabel}</span>
              {activeView === item.id && <div className="w-1 h-1 bg-indigo-600 rounded-full mt-1"></div>}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default Layout;