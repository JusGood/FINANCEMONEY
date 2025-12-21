
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
        name: t.projectName || 'Stock Sans Nom',
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
      {/* Hero Section Compacte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 flex flex-col justify-between min-h-[200px]">
          <div className={`absolute inset-0 transition-colors duration-500 ${
            ownerFilter === Owner.LARBI ? 'bg-indigo-700' : 
            ownerFilter === Owner.YASSINE ? 'bg-purple-700' : 'bg-slate-900'
          }`}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">TRÉSORERIE LIQUIDE</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter tabular-nums italic text-white leading-none">
              {currentCash.toLocaleString()} <span className="text-base opacity-40 not-italic ml-1">EUR</span>
            </h2>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Valeur Totale', val: totalPatrimony, color: 'text-white' },
              { label: 'Stock Actif', val: activeStockValue, color: 'text-white/90' },
              { label: 'Profit Projeté', val: latentProfits, color: 'text-emerald-300' }
            ].map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-sm">
                <p className="text-[7px] font-black uppercase text-white/40 tracking-widest mb-0.5">{s.label}</p>
                <p className={`text-base font-black tabular-nums ${s.color}`}>{s.val.toLocaleString()}€</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between border-t-4 border-t-indigo-500">
          <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2 italic">ANALYSIS IA</h3>
          <div className="flex-1 overflow-y-auto max-h-[80px] mb-3">
            {aiReport ? (
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-tight border-l-2 border-indigo-500 pl-3 italic">
                {aiReport}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 italic text-[9px] uppercase font-black tracking-widest">
                Prêt pour l'audit...
              </div>
            )}
          </div>
          <button 
            onClick={fetchAiReport}
            disabled={loadingReport}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            {loadingReport ? 'CALCUL EN COURS...' : 'LANCER L\'AUDIT'}
          </button>
        </div>
      </div>

      {/* Stock Actif - Grille plus dense */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">STOCK EN COURS</h4>
            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full">{projects.length}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xl group-hover:scale-110 transition-transform">{p.type === TransactionType.CLIENT_ORDER ? '👤' : '📦'}</span>
                  <div className="text-right">
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Gain</p>
                    <p className="text-sm font-black text-emerald-600 tabular-nums">+{p.potentialProfit}€</p>
                  </div>
                </div>
                <h5 className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase mb-0.5">{p.name}</h5>
                <p className="text-[8px] font-bold text-indigo-500 uppercase mb-3 tracking-tighter">{p.owner}</p>
                <button 
                  onClick={() => onConfirmSale(p.originalTransactionId!)}
                  className="w-full bg-slate-900 dark:bg-slate-800 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  CAISSER VENTE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Compacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4">Progression Patrimoine</h4>
          <div className="h-[200px] w-full">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center">
          <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-full mb-2 text-left">Dépenses par Catégorie</h4>
          <div className="w-full flex justify-center h-[180px]">
            <CategoryPieChart transactions={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
