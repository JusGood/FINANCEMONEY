
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Owner } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport } from '../services/geminiService';
import { Icons } from '../constants';

interface Props {
  transactions: Transaction[];
  ownerFilter: Owner;
  onConfirmSale: (txId: string) => void;
}

const Dashboard: React.FC<Props> = ({ transactions, ownerFilter, onConfirmSale }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const filtered = useMemo(() => 
    ownerFilter === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === ownerFilter)
  , [transactions, ownerFilter]);

  const stats = useMemo(() => filtered.reduce((acc, curr) => {
    if (curr.isForecast) return acc;
    if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += curr.amount;
    else if (curr.type === TransactionType.INCOME) acc.income += curr.amount;
    else if (curr.type === TransactionType.EXPENSE) acc.expense += curr.amount;
    else if (curr.type === TransactionType.INVESTMENT) acc.invested += curr.amount;
    return acc;
  }, { initial: 0, income: 0, expense: 0, invested: 0 }), [filtered]);

  const currentCash = stats.initial + stats.income - stats.expense - stats.invested;

  const projects = useMemo(() => {
    return filtered
      .filter(t => (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && !t.isSold)
      .map(t => ({
        name: t.projectName || 'Sans nom',
        clientName: t.clientName,
        totalSpent: t.amount,
        potentialProfit: t.expectedProfit || 0,
        totalExpectedReturn: (t.amount || 0) + (t.expectedProfit || 0),
        originalTransactionId: t.id,
        type: t.type,
        owner: t.owner,
        method: t.method
      }));
  }, [filtered]);

  const latentProfits = projects.reduce((sum, p) => sum + p.potentialProfit, 0);
  const activeStockValue = projects.filter(p => p.type === TransactionType.INVESTMENT).reduce((sum, p) => sum + p.totalSpent, 0);
  const totalPatrimony = currentCash + latentProfits + activeStockValue;

  const fetchAiReport = async () => {
    setLoadingReport(true);
    const report = await getFinancialHealthReport(filtered, ownerFilter);
    setAiReport(report);
    setLoadingReport(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 group relative rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl transition-all duration-700 hover:shadow-indigo-200/20">
          <div className={`absolute inset-0 transition-all duration-1000 ${
            ownerFilter === Owner.LARBI ? 'bg-gradient-to-br from-indigo-700 via-blue-800 to-indigo-950' : 
            ownerFilter === Owner.YASSINE ? 'bg-gradient-to-br from-purple-700 via-fuchsia-800 to-purple-950' : 
            'bg-gradient-to-br from-slate-900 via-slate-800 to-black'
          }`}></div>
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

          <div className="relative z-10 p-10 md:p-14 text-white flex flex-col justify-between h-full min-h-[420px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-white/40 mb-4">Capital de Trésorerie</p>
                <h2 className="text-6xl md:text-9xl font-black tracking-tighter tabular-nums flex items-baseline gap-4 leading-none italic">
                  {currentCash.toLocaleString()} <span className="text-2xl md:text-4xl font-black opacity-20 tracking-tight not-italic">EUR</span>
                </h2>
              </div>
              <div className="px-8 py-3 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl group-hover:bg-white/10 transition-colors">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">{ownerFilter}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
              <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 group-hover:bg-white/10 transition-all">
                <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-3">Patrimoine Brut</p>
                <p className="text-3xl font-black tabular-nums">{totalPatrimony.toLocaleString()} <span className="text-xs opacity-40 ml-1">€</span></p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 group-hover:bg-white/10 transition-all">
                <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-3">Valeur du Stock</p>
                <p className="text-3xl font-black tabular-nums">{activeStockValue.toLocaleString()} <span className="text-xs opacity-40 ml-1">€</span></p>
              </div>
              <div className="bg-emerald-500/10 backdrop-blur-md p-8 rounded-[2.5rem] border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-3">Profits Latents</p>
                <p className="text-3xl font-black text-emerald-400 tabular-nums">+{latentProfits.toLocaleString()} <span className="text-xs opacity-40 ml-1">€</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="xl:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-2xl">
                <span className="text-white text-xs font-black tracking-tighter">VAULT</span>
              </div>
              <h3 className="text-xl font-black tracking-tighter uppercase text-slate-900">IA ANALYTICS</h3>
            </div>
            
            <div className="flex-1 min-h-[220px]">
              {aiReport ? (
                <div className="prose prose-slate">
                  <div className="whitespace-pre-wrap text-slate-700 font-bold leading-relaxed italic text-sm md:text-base border-l-4 border-indigo-600 pl-8 py-2 animate-in fade-in slide-in-from-left-4 duration-500">
                    "{aiReport}"
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 opacity-20">
                  <div className="w-16 h-1 bg-slate-100 rounded-full animate-pulse"></div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] italic">Analyse du marché en attente...</p>
                </div>
              )}
            </div>

            <button 
              onClick={fetchAiReport}
              disabled={loadingReport}
              className={`w-full py-6 mt-10 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-2xl ${
                loadingReport ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'
              }`}
            >
              {loadingReport ? 'CALCUL EN COURS...' : 'AUDIT DE FORTUNE'}
            </button>
          </div>
        </div>
      </div>

      {/* Operations Actives Cards */}
      {projects.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-2 h-12 bg-indigo-600 rounded-full"></div>
                <div>
                  <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Flips en Cours</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3">{projects.length} opérations de terrain actives</p>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 flex flex-col justify-between overflow-hidden relative border-b-8 border-b-slate-50 hover:border-b-indigo-100">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${p.type === TransactionType.CLIENT_ORDER ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                         {p.type === TransactionType.CLIENT_ORDER ? '👤' : '📦'}
                       </div>
                       {p.method && p.method !== 'Standard' && (
                         <span className="mt-3 text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg w-fit tracking-widest">{p.method}</span>
                       )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Target Net</p>
                      <p className="text-3xl font-black text-emerald-600 tabular-nums">+{p.potentialProfit}€</p>
                    </div>
                  </div>
                  <h5 className="text-2xl font-black text-slate-900 truncate leading-tight uppercase tracking-tighter mb-4">{p.name}</h5>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${p.owner === Owner.LARBI ? 'bg-indigo-600' : 'bg-purple-600'}`}></div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{p.owner}</span>
                  </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-50 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-8 tabular-nums tracking-widest">
                    <span>Mise: {p.totalSpent}€</span>
                    <span className="text-slate-900">Retour: {p.totalExpectedReturn}€</span>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    CAISSER LA VENTE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></div>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Réel</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Projeté</span>
                </div>
             </div>
          </div>
          <div className="mb-12">
            <h4 className="text-3xl font-black tracking-tighter uppercase text-slate-900 italic">Evolution du Capital</h4>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Projection vers l'objectif millionnaire</p>
          </div>
          <div className="h-[400px] w-full">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl flex flex-col items-center justify-between">
          <div className="w-full text-left mb-8">
            <h4 className="text-3xl font-black tracking-tighter uppercase text-slate-900 italic">Segments</h4>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Répartition Stratégique</p>
          </div>
          <div className="w-full flex justify-center py-6">
            <CategoryPieChart transactions={filtered} />
          </div>
          <div className="w-full mt-8 p-8 bg-slate-950 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent"></div>
             <p className="relative z-10 text-[10px] font-black uppercase text-white/30 text-center tracking-[0.3em] mb-6 italic">Statistiques du Vault</p>
             <div className="relative z-10 flex justify-around">
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-xl font-black text-white">{filtered.filter(t => t.type === TransactionType.INVESTMENT).length}</p>
                   <p className="text-[8px] font-black uppercase text-white/40 tracking-tighter">STOCK</p>
                </div>
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-xl font-black text-emerald-400">{filtered.filter(t => t.isSold).length}</p>
                   <p className="text-[8px] font-black uppercase text-white/40 tracking-tighter">CLOS</p>
                </div>
                <div className="text-center group-hover:scale-110 transition-transform">
                   <p className="text-xl font-black text-indigo-400">{Math.round(latentProfits)}€</p>
                   <p className="text-[8px] font-black uppercase text-white/40 tracking-tighter">PROFITS</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
