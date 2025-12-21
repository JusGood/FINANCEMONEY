
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section - Plus compacte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 relative rounded-[2rem] overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-between p-8 md:p-10 group">
          <div className={`absolute inset-0 transition-all duration-500 ${
            ownerFilter === Owner.LARBI ? 'bg-indigo-700' : 
            ownerFilter === Owner.YASSINE ? 'bg-purple-700' : 'bg-slate-900'
          }`}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">Trésorerie Disponible</p>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter tabular-nums italic text-white leading-none">
                  {currentCash.toLocaleString()} <span className="text-xl font-black opacity-30 tracking-normal not-italic ml-2">EUR</span>
                </h2>
              </div>
              <div className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-lg border border-white/10 text-[9px] font-black text-white uppercase tracking-widest uppercase">
                {ownerFilter}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Patrimoine', val: totalPatrimony, color: 'text-white' },
                { label: 'Stock Actif', val: activeStockValue, color: 'text-white' },
                { label: 'Profits', val: latentProfits, color: 'text-emerald-300' }
              ].map((s, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">{s.label}</p>
                  <p className={`text-xl font-black tabular-nums ${s.color}`}>{s.val.toLocaleString()}€</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transition-colors">
          <h3 className="text-sm font-black tracking-widest uppercase text-slate-900 dark:text-white mb-4">IA ANALYTICS</h3>
          <div className="flex-1 overflow-y-auto mb-6">
            {aiReport ? (
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed border-l-2 border-indigo-500 pl-4 py-1 italic">
                {aiReport}
              </p>
            ) : (
              <div className="h-24 flex items-center justify-center opacity-20 italic text-[10px] uppercase font-black tracking-widest">
                Prêt pour l'audit...
              </div>
            )}
          </div>
          <button 
            onClick={fetchAiReport}
            disabled={loadingReport}
            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-95"
          >
            {loadingReport ? 'ANALYSE...' : 'LANCER AUDIT IA'}
          </button>
        </div>
      </div>

      {/* Opérations Actives - Grille plus dense */}
      {projects.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Opérations Terrain ({projects.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${p.type === TransactionType.CLIENT_ORDER ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                    {p.type === TransactionType.CLIENT_ORDER ? '👤' : '📦'}
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Profit Net</p>
                    <p className="text-xl font-black text-emerald-600 tabular-nums">+{p.potentialProfit}€</p>
                  </div>
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase mb-1">{p.name}</h5>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-4 tracking-tighter">{p.owner}</p>
                <button 
                  onClick={() => onConfirmSale(p.originalTransactionId!)}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                >
                  CAISSER
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Grid - Plus petit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Evolution Capital</h4>
            <div className="flex gap-2 text-[8px] font-black uppercase text-slate-400">
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>Réel</span>
               <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Projeté</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center transition-colors">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white w-full text-left mb-4">Répartition</h4>
          <div className="w-full flex justify-center h-[200px]">
            <CategoryPieChart transactions={filtered} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
