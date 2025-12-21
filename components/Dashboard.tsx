
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Owner } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  ownerFilter: Owner;
  onConfirmSale: (txId: string) => void;
}

const Dashboard: React.FC<Props> = ({ transactions, ownerFilter, onConfirmSale }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const filtered = useMemo(() => 
    ownerFilter === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === ownerFilter)
  , [transactions, ownerFilter]);

  const stats = useMemo(() => filtered.reduce((acc, curr) => {
    if (curr.isForecast) return acc;
    // On ne compte dans le cash que ce qui est réellement encaissé ou sorti (isSold: true)
    // Sauf les dépenses qui sont toujours déduites immédiatement
    if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += curr.amount;
    else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += curr.amount;
    else if (curr.type === TransactionType.EXPENSE) acc.expense += curr.amount;
    else if (curr.type === TransactionType.INVESTMENT) acc.invested += curr.amount;
    else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += (curr.expectedProfit || 0);
    
    return acc;
  }, { initial: 0, income: 0, expense: 0, invested: 0 }), [filtered]);

  const currentCash = stats.initial + stats.income - stats.expense - stats.invested;

  const projects = useMemo(() => {
    return filtered
      .filter(t => (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INCOME) && !t.isSold)
      .map(t => ({
        name: t.projectName || t.category || 'Sans Nom',
        totalSpent: t.amount,
        potentialProfit: t.type === TransactionType.INCOME ? t.amount : (t.expectedProfit || 0),
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
    <div className="space-y-10">
      {/* Top Bar Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-slate-900 dark:bg-indigo-900 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none z-0">
             <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50">CASH FLOW LIQUIDE</p>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="text-[10px] font-black bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all border border-white/10 shadow-lg active:scale-95"
              >
                {showDetails ? 'MASQUER DÉTAILS' : 'VOIR PROVENANCE'}
              </button>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-black tracking-tighter tabular-nums text-white italic">
                {currentCash.toLocaleString()}
              </h2>
              <span className="text-sm font-bold text-white/40 uppercase tracking-widest">EUR</span>
            </div>

            {showDetails ? (
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Initial :</span>
                    <span className="text-[12px] font-black text-white">+{stats.initial}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Gains/Comms :</span>
                    <span className="text-[12px] font-black text-emerald-400">+{stats.income}€</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Dépenses :</span>
                    <span className="text-[12px] font-black text-rose-400">-{stats.expense}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Stock Actif :</span>
                    <span className="text-[12px] font-black text-rose-400">-{stats.invested}€</span>
                  </div>
                </div>
                <div className="col-span-2 text-center pt-4">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Provenance de chaque euro du Vault</p>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex gap-8 border-t border-white/10 pt-6">
                 <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Patrimoine</p>
                    <p className="text-lg font-black text-white">{totalPatrimony.toLocaleString()}€</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-1">Profits Attendus</p>
                    <p className="text-lg font-black text-emerald-400">+{latentProfits.toLocaleString()}€</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-slate-400 italic">Audit Vault IA</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">Actualiser</button>
           </div>
           <div className="min-h-[60px] flex items-center">
             {aiReport ? (
               <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed">"{aiReport}"</p>
             ) : (
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase text-slate-300 italic tracking-widest">En attente d'instruction...</span>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative h-[320px] overflow-hidden">
           <BalanceTrendChart transactions={filtered} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative h-[320px] overflow-hidden flex items-center justify-center">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* Opérations Actives */}
      {projects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-8">
           <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Attentes d'Encaissement ({projects.length})</span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 divide-x divide-y divide-slate-100 dark:divide-slate-800">
             {projects.map(p => (
               <div key={p.originalTransactionId} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${p.type === TransactionType.INCOME ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600'}`}>
                      {p.type === TransactionType.INCOME ? 'REVENU' : p.owner}
                    </span>
                    <span className="text-sm font-black text-emerald-500">+{p.potentialProfit}€</span>
                  </div>
                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 truncate uppercase mb-4 tracking-tight">{p.name}</p>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 py-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    Confirmer Réception
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
