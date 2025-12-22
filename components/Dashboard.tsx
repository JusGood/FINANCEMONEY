
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Owner, AccountType } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport, getCryptoPrices } from '../services/geminiService';

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

  // RÉTABLISSEMENT : Calcul Holdings Crypto
  const cryptoHoldings = useMemo(() => {
    const holdings: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.account === AccountType.CRYPTO && t.assetSymbol && t.assetQuantity) {
        const qty = (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || (t.type === TransactionType.TRANSFER && t.toOwner === ownerFilter)) 
          ? t.assetQuantity 
          : -t.assetQuantity;
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

  // RÉTABLISSEMENT : Calcul Stats (Froid et précis)
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

  // RÉTABLISSEMENT : Dossiers en attente (Le coeur du métier)
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
    <div className="space-y-10">
      {/* Fortune Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-slate-900 dark:bg-indigo-900 p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group transition-all duration-500">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/50 italic">FORTUNE TOTALE ESTIMÉE (VAULT)</p>
              <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-black bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all">
                {showDetails ? 'MASQUER' : 'DÉTAILS'}
              </button>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-black tracking-tighter tabular-nums text-white italic">
                {currentTotalCash.toLocaleString()}
              </h2>
              <span className="text-sm font-bold text-white/40 uppercase tracking-widest">EUR</span>
            </div>
            <div className="mt-8 flex gap-8 border-t border-white/10 pt-6">
               <div>
                  <p className="text-[10px] font-black text-white/30 uppercase mb-1">CASH DISPO</p>
                  <p className="text-lg font-black text-white">{fiatCash.toLocaleString()}€</p>
               </div>
               <div>
                  <p className="text-[10px] font-black text-white/30 uppercase mb-1">VALEUR CRYPTO</p>
                  <p className="text-lg font-black text-amber-400">+{cryptoValue.toLocaleString()}€</p>
               </div>
            </div>
            {showDetails && (
              <div className="mt-6 p-4 bg-black/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                 <p className="text-[9px] font-black text-white/40 uppercase mb-3 tracking-widest italic italic">Actifs en Possession</p>
                 <div className="space-y-2">
                   {(Object.entries(cryptoHoldings) as [string, number][]).map(([symbol, qty]) => (
                     <div key={symbol} className="flex justify-between items-center text-xs">
                        <span className="text-white/60 font-bold">{symbol}</span>
                        <div className="text-right">
                          <span className="text-white font-black">{qty.toFixed(4)}</span>
                          <span className="text-emerald-500 ml-2 font-bold italic">≈ {(qty * (cryptoPrices[symbol] || 0)).toLocaleString()}€</span>
                        </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm transition-all">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-slate-400 italic">Audit Stratégique</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[10px] font-black text-indigo-500 uppercase px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg tracking-widest transition-all">Analyses</button>
           </div>
           <div className="min-h-[60px] flex items-center">
             {aiReport ? (
               <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed">"{aiReport}"</p>
             ) : (
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase text-slate-300 italic tracking-widest animate-pulse">Synchronisation IA...</span>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-[320px] shadow-sm">
           <BalanceTrendChart transactions={filtered} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-[320px] flex items-center justify-center shadow-sm">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* RÉTABLISSEMENT : DOSSIERS EN ATTENTE (Restauration Complète) */}
      {pendingItems.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl mt-8">
           <div className="px-8 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] italic">Dossiers à Encaisser ({pendingItems.length})</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-slate-100 dark:divide-slate-800">
             {pendingItems.map(p => (
               <div key={p.id} className="p-7 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'Stock Flip' : 'Client Direct'}
                      </span>
                      <div className="text-right">
                        <span className="block text-sm font-black text-emerald-500">+{p.potentialProfit.toLocaleString()}€</span>
                        {p.type === TransactionType.INVESTMENT && (
                          <span className="block text-[8px] font-bold text-slate-400 uppercase mt-0.5">Mise: {p.investedAmount}€</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] font-black text-slate-900 dark:text-white truncate uppercase mb-1 tracking-tight">{p.name}</p>
                    {p.client && <p className="text-[9px] font-bold text-slate-400 uppercase mb-3 italic">Client: {p.client}</p>}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md uppercase tracking-widest">{p.method}</span>
                    </div>
                  </div>
                  <button onClick={() => onConfirmSale(p.id)} className="w-full text-[10px] font-black uppercase tracking-[0.2em] bg-slate-900 dark:bg-indigo-600 text-white py-3 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95">Confirmer Encaissement</button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
