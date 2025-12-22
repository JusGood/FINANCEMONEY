
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Owner, AccountType } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport, getCryptoPrices } from '../services/geminiService';
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
        const isIncoming = (
          (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || t.type === TransactionType.CLIENT_ORDER) ||
          (t.type === TransactionType.TRANSFER && t.toOwner === ownerFilter)
        );
        const qty = isIncoming ? (t.assetQuantity || 0) : -(t.assetQuantity || 0);
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
    if (curr.account === AccountType.CRYPTO) return acc;

    const amount = curr.amount || 0;
    const profit = curr.expectedProfit || 0;

    if (ownerFilter === Owner.GLOBAL) {
      if (curr.type === TransactionType.TRANSFER) return acc;
      if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
      else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
      else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
      else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
      else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
    } else {
      if (curr.type === TransactionType.TRANSFER) {
        if (curr.owner === ownerFilter) acc.expense += amount;
        if (curr.toOwner === ownerFilter) acc.income += amount;
      } else if (curr.owner === ownerFilter) {
        if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
        else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
        else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
        else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
        else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
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
        name: t.projectName || t.category || 'Sans nom',
        profit: t.expectedProfit || 0,
        capital: t.amount || 0,
        id: t.id,
        type: t.type,
        client: t.clientName
      }));
  }, [filtered, ownerFilter]);

  const fetchAiReport = async () => {
    setLoadingReport(true);
    const report = await getFinancialHealthReport(filtered, ownerFilter);
    setAiReport(report);
    setLoadingReport(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] rounded-full"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 italic">SOLDE CONSOLIDÉ</p>
              <button onClick={() => setShowDetails(!showDetails)} className="text-[8px] font-bold bg-white/5 text-white/60 px-2 py-1 rounded-md hover:bg-white/10 transition-all uppercase">
                {showDetails ? 'Fermer' : 'Détails'}
              </button>
            </div>
            
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-3xl font-black tabular-nums text-white">
                {(currentTotalCash || 0).toLocaleString('fr-FR')}
              </h2>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">EUR</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
               <div className="space-y-0.5">
                  <p className="text-[8px] font-bold text-white/30 uppercase">DISPONIBLE</p>
                  <p className="text-base font-black text-white">{(fiatCash || 0).toLocaleString('fr-FR')}€</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[8px] font-bold text-white/30 uppercase">CRYPTO</p>
                  <p className="text-base font-black text-amber-500">{(cryptoValue || 0).toLocaleString('fr-FR')}€</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[8px] font-bold text-white/30 uppercase">BÉNÉFICES PRÉVUS</p>
                  <p className="text-base font-black text-indigo-400">
                    +{(pendingItems.reduce((sum, p) => sum + p.profit, 0) || 0).toLocaleString('fr-FR')}€
                  </p>
               </div>
            </div>

            {showDetails && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-1">
                 {(Object.entries(cryptoHoldings) as [string, number][]).filter(([_,q])=>q!==0).map(([symbol, qty]) => (
                   <div key={symbol} className="p-2 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center">
                      <span className="text-white/40 font-bold text-[8px]">{symbol}</span>
                      <div className="text-right">
                        <span className="block text-[10px] font-black text-white">{qty.toFixed(4)}</span>
                        <span className="text-[7px] text-emerald-500 font-bold">≈ {((qty || 0) * (cryptoPrices[symbol] || 0)).toLocaleString('fr-FR')}€</span>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-[9px] font-black tracking-widest uppercase text-slate-400">ANALYSE IA</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[8px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md hover:bg-indigo-600 hover:text-white transition-all">
                {loadingReport ? 'CALCUL...' : 'ANALYSER'}
             </button>
           </div>
           <div className="flex-1 flex items-center">
             {aiReport ? (
               <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 leading-snug border-l-2 border-indigo-500 pl-2 italic">{aiReport}</p>
             ) : (
               <p className="text-[9px] font-bold uppercase text-slate-300 italic">Cliquez sur Analyser pour vos conseils.</p>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 h-[200px]">
           <BalanceTrendChart transactions={filtered} ownerFilter={ownerFilter} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 h-[200px] flex flex-col items-center">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {pendingItems.length > 0 && (
        <div className="space-y-2">
           <div className="flex items-center gap-2 px-1">
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">A CLÔTURER ({pendingItems.length})</span>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-20"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group transition-all">
                  <div className="mb-2">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'Stock' : 'Com'}
                      </span>
                      <span className="text-xs font-black text-emerald-500">+{(p.profit || 0).toLocaleString('fr-FR')}€</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase italic">{p.name}</p>
                    {p.client && <p className="text-[8px] font-bold text-slate-400 truncate uppercase">Client: {p.client}</p>}
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.id)} 
                    className="w-full text-[8px] font-black uppercase bg-slate-950 dark:bg-indigo-600 text-white py-2 rounded-lg hover:bg-emerald-500 transition-all active:scale-95"
                  >
                    Recevoir
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
