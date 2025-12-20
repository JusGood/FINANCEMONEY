
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, ProjectSummary, Owner } from '../types';
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
        name: t.projectName || 'Flux sans nom',
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Section: Hero Card + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className={`xl:col-span-2 p-1 relative rounded-[3rem] overflow-hidden group shadow-2xl transition-all duration-500 hover:scale-[1.01]`}>
          <div className={`absolute inset-0 transition-colors duration-700 ${
            ownerFilter === Owner.LARBI ? 'bg-gradient-to-br from-indigo-600 to-blue-700' : 
            ownerFilter === Owner.YASSINE ? 'bg-gradient-to-br from-purple-600 to-fuchsia-700' : 
            'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}></div>
          
          <div className="relative z-10 p-10 text-white h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-3">Capital Liquide Actuel</p>
                <h2 className="text-7xl font-black tracking-tighter tabular-nums flex items-baseline gap-2">
                  {currentCash.toLocaleString()} <span className="text-3xl font-medium opacity-40">€</span>
                </h2>
              </div>
              <div className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                <span className="text-xs font-black uppercase tracking-widest">{ownerFilter}</span>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-white/50 mb-1">Patrimoine Total</p>
                <p className="text-2xl font-black">{totalPatrimony.toLocaleString()} €</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-white/50 mb-1">Stock Actif</p>
                <p className="text-2xl font-black">{activeStockValue.toLocaleString()} €</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <p className="text-[10px] font-black uppercase text-white/50 mb-1">Profits Latents</p>
                <p className="text-2xl font-black text-emerald-400">+{latentProfits.toLocaleString()} €</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icons.Dashboard />
          </div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-indigo-500 animate-pulse"></span>
              Finance Insight <span className="text-indigo-600">AI</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[250px] mb-6">
            {aiReport ? (
              <div className="prose prose-sm prose-slate">
                <div className="whitespace-pre-wrap text-slate-600 font-medium leading-relaxed italic">
                  "{aiReport}"
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-2xl">🤖</div>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Prêt pour l'analyse stratégique ?</p>
              </div>
            )}
          </div>

          <button 
            onClick={fetchAiReport}
            disabled={loadingReport}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              loadingReport ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-100'
            }`}
          >
            {loadingReport ? 'Analyse en cours...' : 'Générer mon rapport'}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black tracking-tight">Courbe de Croissance</h4>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Temps réel</span>
          </div>
          <BalanceTrendChart transactions={filtered} />
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black tracking-tight">Répartition des Invests</h4>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Catégories</span>
          </div>
          <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* Active Business/Flips */}
      {projects.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <h4 className="text-3xl font-black text-slate-900 tracking-tight">Opportunités Actives</h4>
             <span className="px-4 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-full">{projects.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {projects.map(p => (
              <div key={p.originalTransactionId} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-3xl transition-colors ${p.type === TransactionType.CLIENT_ORDER ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {p.type === TransactionType.CLIENT_ORDER ? '👤' : '👟'}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Profit Net</p>
                      <p className="text-2xl font-black text-emerald-600">+{p.potentialProfit.toLocaleString()}€</p>
                    </div>
                  </div>
                  <h5 className="text-xl font-black text-slate-800 line-clamp-2 leading-tight">{p.name}</h5>
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${p.owner === Owner.LARBI ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                      {p.owner}
                    </span>
                    {p.clientName && <span className="text-[10px] font-bold text-slate-400">Pour {p.clientName}</span>}
                  </div>
                </div>
                
                <div className="mt-8">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                    <span>Achat: {p.totalSpent}€</span>
                    <span>Total visé: {p.totalExpectedReturn}€</span>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.originalTransactionId!)}
                    className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all transform group-active:scale-95 shadow-xl"
                  >
                    Confirmer la Vente
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
