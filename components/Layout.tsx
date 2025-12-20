
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
    { id: Owner.GLOBAL, label: 'Vue Globale', icon: <Icons.Dashboard /> },
    { id: Owner.LARBI, label: 'Espace Larbi', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-xs bg-indigo-100 text-indigo-600 rounded-lg">L</div> },
    { id: Owner.YASSINE, label: 'Espace Yassine', icon: <div className="w-5 h-5 flex items-center justify-center font-black text-xs bg-purple-100 text-purple-600 rounded-lg">Y</div> },
    { id: 'Add', label: 'Nouveau Flux', icon: <Icons.Plus /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-900">
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
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
            <p className="text-xs font-black uppercase text-indigo-400 mb-2">Multi-Propriété</p>
            <p className="text-[10px] leading-relaxed opacity-80 relative z-10">
              Chaque flux est maintenant assigné à son propriétaire pour un suivi précis.
            </p>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-600/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            {navItems.find(n => n.id === activeView)?.label}
          </h2>
          <div className="flex items-center space-x-4">
             <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">L</div>
                <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">Y</div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#FBFBFE]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
