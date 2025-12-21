
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
        name: t.projectName || 'Sans Nom',
        totalSpent: t.amount,
        potentialProfit: t.expectedProfit || 0,
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
    <div className="space-y-8">
      {/* Top Bar Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-slate-900 dark:bg-indigo-900 p-5 rounded-xl border border-white/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">CASH FLOW LIQUIDE</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black tracking-tighter tabular-nums text-white italic">
              {currentCash.toLocaleString()}
            </h2>
            <span className="text-xs font-bold text-white/40 uppercase">EUR</span>
          </div>
          <div className="mt-4 flex gap-4 border-t border-white/5 pt-4">
             <div>
                <p className="text-[7px] font-bold text-white/30 uppercase">Patrimoine</p>
                <p className="text-sm font-black text-white">{totalPatrimony.toLocaleString()}€</p>
             </div>
             <div>
                <p className="text-[7px] font-bold text-white/30 uppercase">Profits Attentus</p>
                <p className="text-sm font-black text-emerald-400">+{latentProfits.toLocaleString()}€</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-[9px] font-black tracking-widest uppercase text-slate-400 italic">Audit Vault IA</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[8px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">Actualiser</button>
           </div>
           <div className="min-h-[40px]">
             {aiReport ? (
               <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 italic leading-snug">"{aiReport}"</p>
             ) : (
               <div className="flex items-center gap-2 py-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-slate-300 italic">En attente d'instruction...</span>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Charts Section - Assuré d'avoir une hauteur fixe et overflow-hidden */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative h-[240px] overflow-hidden">
           <BalanceTrendChart transactions={filtered} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative h-[240px] overflow-hidden flex items-center justify-center">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* Stock Actif */}
      {projects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-4">
           <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Opérations en cours ({projects.length})</span>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y divide-slate-100 dark:divide-slate-800">
             {projects.map(p => (
               <div key={p.originalTransactionId} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 uppercase">{p.owner[0]}</span>
                    <span className="text-[10px] font-black text-emerald-500">+{p.potentialProfit}€</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate uppercase mb-2">{p.name}</p>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full text-[7px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 py-1.5 rounded hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    Encaisser
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
