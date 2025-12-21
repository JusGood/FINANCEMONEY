
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
        name: t.projectName || 'Sans nom',
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
    <div className="space-y-6">
      {/* Hero Section (More Compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-lg p-6 md:p-8 flex flex-col justify-between min-h-[220px]">
          <div className={`absolute inset-0 transition-colors duration-500 ${
            ownerFilter === Owner.LARBI ? 'bg-indigo-700' : 
            ownerFilter === Owner.YASSINE ? 'bg-purple-700' : 'bg-slate-900'
          }`}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          <div className="relative z-10">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">CASH DISPONIBLE</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums italic text-white leading-none">
              {currentCash.toLocaleString()} <span className="text-lg opacity-30 not-italic ml-1">EUR</span>
            </h2>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Patrimoine', val: totalPatrimony, color: 'text-white' },
              { label: 'Stock', val: activeStockValue, color: 'text-white' },
              { label: 'Profits Latents', val: latentProfits, color: 'text-emerald-300' }
            ].map((s, i) => (
              <div key={i} className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-[7px] font-black uppercase text-white/40 tracking-widest mb-0.5">{s.label}</p>
                <p className={`text-base font-black tabular-nums ${s.color}`}>{s.val.toLocaleString()}€</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col">
          <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-3 italic">AUDIT VAULT IA</h3>
          <div className="flex-1 overflow-y-auto max-h-[100px] mb-4">
            {aiReport ? (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-snug border-l-2 border-indigo-500 pl-3 italic">
                {aiReport}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 italic text-[9px] uppercase font-black tracking-widest">
                En attente d'analyse...
              </div>
            )}
          </div>
          <button 
            onClick={fetchAiReport}
            disabled={loadingReport}
            className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all active:scale-95 shadow-md shadow-indigo-100 dark:shadow-none"
          >
            {loadingReport ? 'CALCUL...' : 'LANCER ANALYSE'}
          </button>
        </div>
      </div>

      {/* Opérations Terrain (Denser Grid) */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">STOCK ACTIF ({projects.length})</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-lg">{p.type === TransactionType.CLIENT_ORDER ? '👤' : '📦'}</span>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Profit</p>
                    <p className="text-sm font-black text-emerald-600 tabular-nums">+{p.potentialProfit}€</p>
                  </div>
                </div>
                <h5 className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase mb-0.5">{p.name}</h5>
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-3">{p.owner}</p>
                <button 
                  onClick={() => onConfirmSale(p.originalTransactionId!)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                >
                  ENCAISSER
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics (Smaller height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Evolution Patrimoine</h4>
          <div className="h-[200px] w-full">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-full mb-2 text-left">Répartition</h4>
          <div className="w-full flex justify-center h-[180px]">
            <CategoryPieChart transactions={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
