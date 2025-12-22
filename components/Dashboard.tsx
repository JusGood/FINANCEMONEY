
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Owner, AccountType } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport, getCryptoPrices } from '../services/geminiService';
// Fix: Import Icons from constants to resolve "Cannot find name 'Icons'" errors
import { Icons } from '../constants';

interface Props {
  transactions: Transaction[];
  ownerFilter: Owner;
  onConfirmSale: (txId: string) => void;
}

const Dashboard: React.FC<Props> = ({ transactions, ownerFilter, onConfirmSale }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  const filtered = useMemo(() => 
    ownerFilter === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === ownerFilter || t.toOwner === ownerFilter)
  , [transactions, ownerFilter]);

  const cryptoHoldings = useMemo(() => {
    const holdings: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.account === AccountType.CRYPTO && t.assetSymbol && t.assetQuantity) {
        const isIncoming = (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || (t.type === TransactionType.TRANSFER && t.toOwner === ownerFilter));
        const qty = isIncoming ? t.assetQuantity : -t.assetQuantity;
        holdings[t.assetSymbol] = (holdings[t.assetSymbol] || 0) + qty;
      }
    });
    return holdings;
  }, [filtered, ownerFilter]);

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = Object.keys(cryptoHoldings);
      if (symbols.length > 0) {
        const prices = await getCryptoPrices(symbols);
        setCryptoPrices(prices);
      }
    };
    fetchPrices();
  }, [cryptoHoldings]);

  const cryptoValue = useMemo(() => {
    return (Object.entries(cryptoHoldings) as [string, number][]).reduce((sum, [symbol, qty]) => {
      return sum + (qty * (cryptoPrices[symbol] || 0));
    }, 0);
  }, [cryptoHoldings, cryptoPrices]);

  const stats = useMemo(() => filtered.reduce((acc, curr) => {
    if (curr.isForecast) return acc;
    if (curr.account === AccountType.CRYPTO) return acc;

    if (ownerFilter === Owner.GLOBAL) {
      if (curr.type === TransactionType.TRANSFER) return acc;
      if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += curr.amount;
      else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += curr.amount;
      else if (curr.type === TransactionType.EXPENSE) acc.expense += curr.amount;
      else if (curr.type === TransactionType.INVESTMENT) acc.invested += curr.amount;
      else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += (curr.expectedProfit || 0);
    } else {
      if (curr.type === TransactionType.TRANSFER) {
        if (curr.owner === ownerFilter) acc.expense += curr.amount;
        if (curr.toOwner === ownerFilter) acc.income += curr.amount;
      } else if (curr.owner === ownerFilter) {
        if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += curr.amount;
        else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += curr.amount;
        else if (curr.type === TransactionType.EXPENSE) acc.expense += curr.amount;
        else if (curr.type === TransactionType.INVESTMENT) acc.invested += curr.amount;
        else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += (curr.expectedProfit || 0);
      }
    }
    return acc;
  }, { initial: 0, income: 0, expense: 0, invested: 0 }), [filtered, ownerFilter]);

  const fiatCash = stats.initial + stats.income - stats.expense - stats.invested;
  const currentTotalCash = fiatCash + cryptoValue;

  const pendingItems = useMemo(() => {
    return filtered
      .filter(t => (ownerFilter === Owner.GLOBAL || t.owner === ownerFilter) && (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && !t.isSold)
      .map(t => ({
        name: t.projectName || t.category || 'Sans Nom',
        potentialProfit: t.expectedProfit || 0,
        investedAmount: t.amount,
        id: t.id,
        type: t.type,
        client: t.clientName,
        method: t.method
      }));
  }, [filtered, ownerFilter]);

  const fetchAiReport = async () => {
    setLoadingReport(true);
    const report = await getFinancialHealthReport(filtered, ownerFilter);
    setAiReport(report);
    setLoadingReport(false);
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      {/* Header Stat Alpha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-slate-950 p-12 md:p-20 rounded-[4.5rem] border border-white/10 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all duration-700">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.8em] text-white/30 italic leading-none">ÉTAT DES ACTIFS RÉELS</p>
                <div className="h-1 w-20 bg-indigo-600 rounded-full"></div>
              </div>
              <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-black bg-white/5 text-white/40 px-8 py-4 rounded-2xl border border-white/5 hover:bg-white/10 hover:text-white transition-all tracking-[0.3em] uppercase">Vérifier l'Audit</button>
            </div>
            
            <div className="flex items-baseline gap-6 mb-16">
              <h2 className="text-8xl font-black tracking-tighter tabular-nums text-white italic drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
                {currentTotalCash.toLocaleString()}
              </h2>
              <span className="text-2xl font-bold text-white/20 uppercase tracking-[0.4em]">EUR</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 border-t border-white/5 pt-12">
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">LIQUIDITÉS FIAT</p>
                  <p className="text-3xl font-black text-white">{fiatCash.toLocaleString()} <span className="text-sm text-white/30 italic">€</span></p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">VALEUR CRYPTO</p>
                  <p className="text-3xl font-black text-amber-500">+{cryptoValue.toLocaleString()} <span className="text-sm text-amber-500/30 italic">€</span></p>
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">MARGES EN AUDIT</p>
                  <p className="text-3xl font-black text-indigo-400">
                    {pendingItems.reduce((sum, p) => sum + p.potentialProfit, 0).toLocaleString()} <span className="text-sm text-indigo-400/30 italic">€</span>
                  </p>
               </div>
            </div>

            {showDetails && (
              <div className="mt-12 p-10 bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
                 <p className="text-[11px] font-black text-white/40 uppercase mb-8 tracking-[0.5em] italic">Répartition du Portefeuille Actif</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                   {(Object.entries(cryptoHoldings) as [string, number][]).map(([symbol, qty]) => (
                     <div key={symbol} className="p-6 bg-black/40 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all group/asset">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-white font-black text-xs tracking-widest">{symbol}</span>
                           <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] opacity-30 group-hover/asset:opacity-100 transition-all">🪙</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black text-white tabular-nums">{qty.toFixed(4)}</p>
                          <p className="text-[11px] text-emerald-500 font-black italic">≈ {(qty * (cryptoPrices[symbol] || 0)).toLocaleString()}€</p>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xl relative overflow-hidden group">
           <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full"></div>
           <div className="relative z-10 h-full flex flex-col">
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-[11px] font-black tracking-[0.6em] uppercase text-slate-400 italic">Financial Health AI</h3>
               <button onClick={fetchAiReport} disabled={loadingReport} className="p-3 bg-slate-950 text-white rounded-2xl hover:bg-indigo-600 transition-all">
                  {loadingReport ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Icons.Plus />}
               </button>
             </div>
             <div className="flex-1 flex flex-col justify-center">
               {aiReport ? (
                 <div className="space-y-6">
                   {aiReport.split('\n').map((line, i) => (
                     <p key={i} className="text-xl font-bold text-slate-900 dark:text-white italic leading-tight border-l-[6px] border-indigo-600 pl-8 py-1">{line}</p>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-3xl animate-bounce">🤖</div>
                   <p className="text-[12px] font-black uppercase text-slate-300 italic tracking-[0.3em]">IA Prête pour l'audit stratégique</p>
                 </div>
               )}
             </div>
             <p className="mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-50">Dernière Mise à jour : {new Date().toLocaleTimeString()}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-200 dark:border-slate-800 h-[500px] shadow-sm relative overflow-hidden transition-all hover:shadow-2xl">
           <div className="flex justify-between items-center mb-10">
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 italic">Trajectoire du Patrimoine</span>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Cash</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Proj.</span>
                </div>
             </div>
           </div>
           <BalanceTrendChart transactions={filtered} ownerFilter={ownerFilter} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-200 dark:border-slate-800 h-[500px] flex flex-col shadow-sm transition-all hover:shadow-2xl">
           <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 italic mb-12">Architecture des Flux</span>
           <div className="flex-1 flex items-center justify-center">
             <CategoryPieChart transactions={filtered} />
           </div>
           <div className="mt-8 flex flex-wrap justify-center gap-4">
              {['FTID', 'DNA', 'EB', 'LIT'].map(m => (
                <span key={m} className="text-[9px] font-black bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl text-slate-500 uppercase tracking-[0.2em]">{m}</span>
              ))}
           </div>
        </div>
      </div>

      {/* Audit Center Alpha */}
      {pendingItems.length > 0 && (
        <div className="space-y-10 pt-8">
           <div className="flex items-center gap-6 px-12">
             <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
             <span className="text-[12px] font-black uppercase text-slate-900 dark:text-white tracking-[0.8em] italic whitespace-nowrap">AUDITS GHOST MODE ({pendingItems.length})</span>
             <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 group flex flex-col justify-between min-h-[340px] relative overflow-hidden hover:-translate-y-3">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[80px] group-hover:bg-indigo-500/15 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <span className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-600 text-white shadow-lg' : 'bg-emerald-500 text-white shadow-lg'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'Stock' : 'Comm'}
                      </span>
                      <div className="text-right">
                        <span className="block text-3xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-sm">+{p.potentialProfit.toLocaleString()}€</span>
                        {p.type === TransactionType.INVESTMENT && (
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest italic">Immobilisé: {p.investedAmount}€</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[20px] font-black text-slate-950 dark:text-white truncate uppercase mb-4 tracking-tighter leading-none italic">{p.name}</p>
                    {p.client && <p className="text-[11px] font-bold text-slate-400 uppercase mb-8 italic tracking-widest border-l-2 border-indigo-200 pl-4">{p.client}</p>}
                  </div>
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-4">
                       <span className="text-[10px] font-black bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-400 px-6 py-3 rounded-2xl uppercase tracking-[0.3em] border border-slate-100 dark:border-slate-700/50 italic">{p.method}</span>
                    </div>
                    <button 
                      onClick={() => onConfirmSale(p.id)} 
                      className="w-full text-[11px] font-black uppercase tracking-[0.4em] bg-slate-950 dark:bg-indigo-600 text-white py-6 rounded-[2rem] hover:bg-emerald-500 dark:hover:bg-emerald-500 transition-all shadow-2xl active:scale-[0.95] flex items-center justify-center gap-3"
                    >
                      Encaisser <Icons.Plus />
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
