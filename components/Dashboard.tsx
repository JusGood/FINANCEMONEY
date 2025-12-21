
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
        totalExpectedReturn: t.amount + (t.expectedProfit || 0),
        originalTransactionId: t.id,
        type: t.type,
        owner: t.owner
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
            ownerFilter === Owner.LARBI ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800' : 
            ownerFilter === Owner.YASSINE ? 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-800' : 
            'bg-gradient-to-br from-slate-900 via-slate-800 to-black'
          }`}></div>
          
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

          <div className="relative z-10 p-10 md:p-14 text-white flex flex-col justify-between h-full min-h-[400px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-white/50 mb-4">Solde de Trésorerie</p>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter tabular-nums flex items-baseline gap-4 leading-none">
                  {currentCash.toLocaleString()} <span className="text-2xl md:text-4xl font-black opacity-30 tracking-tight italic">EUR</span>
                </h2>
              </div>
              <div className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 shadow-xl">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{ownerFilter}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Patrimoine Total</p>
                <p className="text-3xl font-black">{totalPatrimony.toLocaleString()} <span className="text-xs opacity-40">€</span></p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Valeur Stock</p>
                <p className="text-3xl font-black">{activeStockValue.toLocaleString()} <span className="text-xs opacity-40">€</span></p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 group-hover:bg-white/10 transition-colors">
                <p className="text-[10px] font-black uppercase text-emerald-400/50 tracking-widest mb-3">Profits Latents</p>
                <p className="text-3xl font-black text-emerald-400">+{latentProfits.toLocaleString()} <span className="text-xs opacity-40">€</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="xl:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                <span className="text-white text-xs font-black">AI</span>
              </div>
              <h3 className="text-xl font-black tracking-tighter uppercase text-slate-900">Intelligence</h3>
            </div>
            
            <div className="flex-1 min-h-[220px]">
              {aiReport ? (
                <div className="prose prose-slate">
                  <div className="whitespace-pre-wrap text-slate-600 font-bold leading-relaxed italic text-sm md:text-base border-l-4 border-indigo-500 pl-6 py-2">
                    "{aiReport}"
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 opacity-30">
                  <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">En attente de vos instructions...</p>
                </div>
              )}
            </div>

            <button 
              onClick={fetchAiReport}
              disabled={loadingReport}
              className={`w-full py-5 mt-8 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all ${
                loadingReport ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-2xl hover:bg-indigo-600 hover:-translate-y-1'
              }`}
            >
              {loadingReport ? 'Génération...' : 'Lancer l\'audit IA'}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Performance</h4>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Évolution du capital réel vs projeté</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <span className="text-[8px] font-black uppercase text-indigo-600 tracking-widest">Reel</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">Projeté</span>
               </div>
            </div>
          </div>
          <div className="h-[300px] md:h-96 w-full">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col items-center justify-between">
          <div className="w-full text-left mb-6">
            <h4 className="text-2xl font-black tracking-tighter uppercase text-slate-900">Secteurs</h4>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Répartition des investissements</p>
          </div>
          <div className="w-full flex justify-center">
            <CategoryPieChart transactions={filtered} />
          </div>
          <div className="w-full mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
             <p className="text-[9px] font-black uppercase text-slate-400 text-center tracking-[0.2em] mb-4">Statistiques Clés</p>
             <div className="flex justify-around">
                <div className="text-center">
                   <p className="text-xs font-black text-slate-900">{filtered.filter(t => t.type === TransactionType.INVESTMENT).length}</p>
                   <p className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Invests</p>
                </div>
                <div className="text-center">
                   <p className="text-xs font-black text-emerald-500">{filtered.filter(t => t.isSold).length}</p>
                   <p className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Ventes</p>
                </div>
                <div className="text-center">
                   <p className="text-xs font-black text-indigo-600">{Math.round(latentProfits)}€</p>
                   <p className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Profits</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Active Projects Cards */}
      {projects.length > 0 && (
        <div className="space-y-8 pb-10">
          <div className="flex items-center gap-4">
             <div className="w-1 h-10 bg-indigo-600 rounded-full"></div>
             <div>
               <h4 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Opérations Actives</h4>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{projects.length} flips en cours de réalisation</p>
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="group bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${p.type === TransactionType.CLIENT_ORDER ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                      {p.type === TransactionType.CLIENT_ORDER ? '👤' : '📦'}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Profit Cible</p>
                      <p className="text-2xl font-black text-emerald-600">+{p.potentialProfit}€</p>
                    </div>
                  </div>
                  <h5 className="text-xl font-black text-slate-900 truncate leading-tight uppercase tracking-tighter mb-4">{p.name}</h5>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.owner === Owner.LARBI ? 'bg-indigo-600' : 'bg-purple-600'}`}></div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">Manager: {p.owner}</span>
                  </div>
                </div>
                
                <div className="mt-10 pt-8 border-t border-slate-50 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-6">
                    <span>Invest: {p.totalSpent}€</span>
                    <span className="text-slate-900">Total: {p.totalExpectedReturn}€</span>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 active:scale-95 transition-all"
                  >
                    Valider la Vente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
