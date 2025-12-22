
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
        name: t.projectName || t.category || 'Sans nom',
        potentialProfit: t.expectedProfit || 0,
        investedAmount: t.amount,
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
    <div className="space-y-6">
      {/* Vue d'ensemble condensée */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">SOLDE TOTAL ESTIMÉ</p>
              <button onClick={() => setShowDetails(!showDetails)} className="text-[9px] font-bold bg-white/5 text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all uppercase">
                {showDetails ? 'Masquer' : 'Détails'}
              </button>
            </div>
            
            <div className="flex items-baseline gap-2 mb-8">
              <h2 className="text-4xl font-black tabular-nums text-white">
                {currentTotalCash.toLocaleString('fr-FR')}
              </h2>
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">EUR</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-white/30 uppercase">DISPONIBLE</p>
                  <p className="text-lg font-black text-white">{fiatCash.toLocaleString('fr-FR')}€</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-white/30 uppercase">CRYPTO</p>
                  <p className="text-lg font-black text-amber-500">{cryptoValue.toLocaleString('fr-FR')}€</p>
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-white/30 uppercase">EN ATTENTE</p>
                  <p className="text-lg font-black text-indigo-400">
                    +{pendingItems.reduce((sum, p) => sum + p.potentialProfit, 0).toLocaleString('fr-FR')}€
                  </p>
               </div>
            </div>

            {showDetails && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
                 {(Object.entries(cryptoHoldings) as [string, number][]).filter(([_,q])=>q>0).map(([symbol, qty]) => (
                   <div key={symbol} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                      <span className="text-white/40 font-bold text-[10px]">{symbol}</span>
                      <div className="text-right">
                        <span className="block text-xs font-black text-white">{qty.toFixed(4)}</span>
                        <span className="text-[9px] text-emerald-500 font-bold">≈ {(qty * (cryptoPrices[symbol] || 0)).toLocaleString('fr-FR')}€</span>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400">RAPPORT IA</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                {loadingReport ? 'ANALYSE...' : 'ACTUALISER'}
             </button>
           </div>
           <div className="flex-1 flex items-center">
             {aiReport ? (
               <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed border-l-2 border-indigo-500 pl-3">{aiReport}</p>
             ) : (
               <p className="text-[10px] font-bold uppercase text-slate-300 italic">Lancez une analyse pour vos conseils personnalisés.</p>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 h-[240px]">
           <BalanceTrendChart transactions={filtered} ownerFilter={ownerFilter} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 h-[240px] flex flex-col items-center">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* Dossiers en attente */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">DOSSIERS EN ATTENTE D'ENCAISSEMENT</p>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[160px]">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[8px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded uppercase">
                        {p.type === TransactionType.INVESTMENT ? 'Stock' : 'Commande'}
                      </span>
                      <span className="text-sm font-black text-emerald-500">+{p.potentialProfit.toLocaleString('fr-FR')}€</span>
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{p.name}</p>
                    {p.client && <p className="text-[9px] font-bold text-slate-400 truncate">CLIENT: {p.client}</p>}
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.id)} 
                    className="mt-4 w-full text-[9px] font-black uppercase bg-slate-900 dark:bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-emerald-600 transition-all"
                  >
                    Marquer comme reçu
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
