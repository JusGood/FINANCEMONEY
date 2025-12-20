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
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className={`xl:col-span-2 p-1 relative rounded-[2.5rem] md:rounded-[3rem] overflow-hidden group shadow-xl md:shadow-2xl transition-all duration-500`}>
          <div className={`absolute inset-0 transition-colors duration-700 ${
            ownerFilter === Owner.LARBI ? 'bg-gradient-to-br from-indigo-600 to-blue-700' : 
            ownerFilter === Owner.YASSINE ? 'bg-gradient-to-br from-purple-600 to-fuchsia-700' : 
            'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}></div>
          
          <div className="relative z-10 p-6 md:p-10 text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em] text-white/60 mb-2">Liquidités</p>
                <h2 className="text-4xl md:text-7xl font-black tracking-tighter tabular-nums flex items-baseline gap-2 overflow-hidden text-ellipsis">
                  {currentCash.toLocaleString()} <span className="text-xl md:text-3xl font-medium opacity-40">€</span>
                </h2>
              </div>
              <div className="px-3 md:px-5 py-1 md:py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest">{ownerFilter}</span>
              </div>
            </div>

            <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex justify-between items-center sm:block">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/50 mb-1">Patrimoine Total</p>
                <p className="text-lg md:text-2xl font-black">{totalPatrimony.toLocaleString()} €</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex justify-between items-center sm:block">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/50 mb-1">Stock Actif</p>
                <p className="text-lg md:text-2xl font-black">{activeStockValue.toLocaleString()} €</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 flex justify-between items-center sm:block">
                <p className="text-[8px] md:text-[10px] font-black uppercase text-white/50 mb-1">Profits Latents</p>
                <p className="text-lg md:text-2xl font-black text-emerald-400">+{latentProfits.toLocaleString()} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-lg flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <span className="flex h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>
              Finance <span className="text-indigo-600">AI</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[150px] md:max-h-[250px] mb-4 md:mb-6">
            {aiReport ? (
              <div className="prose prose-sm prose-slate">
                <div className="whitespace-pre-wrap text-slate-600 font-bold leading-relaxed italic text-xs md:text-sm">
                  "{aiReport}"
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight">Besoin d'un conseil ?</p>
              </div>
            )}
          </div>

          <button 
            onClick={fetchAiReport}
            disabled={loadingReport}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              loadingReport ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-lg'
            }`}
          >
            {loadingReport ? 'Analyse...' : 'Analyser le capital'}
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h4 className="text-lg md:text-xl font-black tracking-tight uppercase">Croissance</h4>
            <span className="text-[9px] font-black uppercase text-slate-400">Temps réel</span>
          </div>
          <div className="h-[250px] md:h-80">
            <BalanceTrendChart transactions={filtered} />
          </div>
        </div>
        
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-lg hidden md:block">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black tracking-tight uppercase">Secteurs</h4>
            <span className="text-[10px] font-black uppercase text-slate-400">Invests</span>
          </div>
          <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* Active Flips */}
      {projects.length > 0 && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
             <h4 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">En Cours</h4>
             <span className="px-3 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">{projects.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="group bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${p.type === TransactionType.CLIENT_ORDER ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <span className="text-xl">{p.type === TransactionType.CLIENT_ORDER ? '👤' : '👟'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-emerald-500 uppercase">Profit</p>
                      <p className="text-xl font-black text-emerald-600">+{p.potentialProfit}€</p>
                    </div>
                  </div>
                  <h5 className="text-base md:text-lg font-black text-slate-800 line-clamp-1 truncate leading-tight uppercase tracking-tighter">{p.name}</h5>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${p.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                      {p.owner}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-3">
                    <span>Achat: {p.totalSpent}€</span>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                  >
                    Valider Vente
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