
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Owner, AccountType } from '../types';
import { BalanceTrendChart, CategoryPieChart } from './Charts';
import { getFinancialHealthReport, getCryptoPrices } from '../services/geminiService';

interface Props {
  transactions: Transaction[];
  viewType: Owner | 'CryptoView';
  onConfirmSale: (txId: string) => void;
}

const Dashboard: React.FC<Props> = ({ transactions, viewType, onConfirmSale }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    if (viewType === 'CryptoView') {
      return transactions.filter(t => t.account === AccountType.CRYPTO);
    }
    return viewType === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === viewType || t.toOwner === viewType);
  }, [transactions, viewType]);

  // Calcul du stock réel de crypto
  const cryptoHoldings = useMemo(() => {
    const holdings: Record<string, number> = {};
    const txsToSum = viewType === 'CryptoView' ? transactions : filtered;
    
    txsToSum.forEach(t => {
      if (t.account === AccountType.CRYPTO && t.assetSymbol && t.assetQuantity) {
        const isActualized = t.isSold || t.type === TransactionType.INITIAL_BALANCE;
        
        if (isActualized) {
          const isIncoming = (
            (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || t.type === TransactionType.CLIENT_ORDER) ||
            (t.type === TransactionType.TRANSFER && t.toOwner === (viewType as any))
          );
          const qty = isIncoming ? (t.assetQuantity || 0) : -(t.assetQuantity || 0);
          holdings[t.assetSymbol] = (holdings[t.assetSymbol] || 0) + qty;
        }
      }
    });
    return holdings;
  }, [transactions, filtered, viewType]);

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = Object.keys(cryptoHoldings);
      if (symbols.length > 0) {
        try {
          const prices = await getCryptoPrices(symbols);
          setCryptoPrices(prices || {});
        } catch (e) { console.debug("Prix fallbacks utilisés."); }
      }
    };
    fetchPrices();
  }, [cryptoHoldings]);

  const cryptoTotalValueEuro = useMemo(() => {
    return (Object.entries(cryptoHoldings) as [string, number][]).reduce((sum, [symbol, qty]) => {
      return sum + (qty * (cryptoPrices[symbol] || 0));
    }, 0);
  }, [cryptoHoldings, cryptoPrices]);

  const stats = useMemo(() => filtered.reduce((acc, curr) => {
    if (curr.account === AccountType.CRYPTO) return acc;
    const amount = curr.amount || 0;
    const profit = curr.expectedProfit || 0;

    if (viewType === Owner.GLOBAL) {
      if (curr.type === TransactionType.TRANSFER) return acc;
      if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
      else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
      else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
      else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
      else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
    } else {
      if (curr.type === TransactionType.TRANSFER) {
        if (curr.owner === (viewType as any)) acc.expense += amount;
        if (curr.toOwner === (viewType as any)) acc.income += amount;
      } else if (curr.owner === (viewType as any)) {
        if (curr.type === TransactionType.INITIAL_BALANCE) acc.initial += amount;
        else if (curr.type === TransactionType.INCOME && curr.isSold) acc.income += profit;
        else if (curr.type === TransactionType.EXPENSE) acc.expense += amount;
        else if (curr.type === TransactionType.INVESTMENT) acc.invested += amount;
        else if (curr.type === TransactionType.CLIENT_ORDER && curr.isSold) acc.income += profit;
      }
    }
    return acc;
  }, { initial: 0, income: 0, expense: 0, invested: 0 }), [filtered, viewType]);

  const fiatCash = (stats.initial || 0) + (stats.income || 0) - (stats.expense || 0) - (stats.invested || 0);
  const currentTotalCash = viewType === 'CryptoView' ? cryptoTotalValueEuro : (fiatCash + cryptoTotalValueEuro);

  const pendingItems = useMemo(() => {
    return filtered
      .filter(t => (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && !t.isSold)
      .map(t => ({
        name: t.projectName || t.category || 'Sans nom',
        profit: t.expectedProfit || 0,
        id: t.id,
        type: t.type,
        asset: t.account === AccountType.CRYPTO ? t.assetSymbol : '€',
        qty: t.assetQuantity || 0
      }));
  }, [filtered]);

  const fetchAiReport = async () => {
    setLoadingReport(true);
    try {
      const report = await getFinancialHealthReport(filtered, viewType as any);
      setAiReport(report);
    } catch (e) { setAiReport("Analyse indisponible."); }
    setLoadingReport(false);
  };

  const isCryptoOnly = viewType === 'CryptoView';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* BLOC PRINCIPAL SOLDE */}
        <div className={`lg:col-span-8 p-10 rounded-[3rem] border shadow-2xl relative overflow-hidden group transition-all duration-500 ${isCryptoOnly ? 'bg-slate-950 border-amber-500/20' : 'bg-slate-900 border-white/5'}`}>
          <div className={`absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full pointer-events-none opacity-40 ${isCryptoOnly ? 'bg-amber-500/10' : 'bg-indigo-500/10'}`}></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">
                {isCryptoOnly ? 'VALEUR TOTALE DES ACTIFS CRYPTO' : 'SOLDE CONSOLIDÉ DU VAULT'}
              </p>
            </div>
            
            <div className="flex items-baseline gap-4 mb-12">
              <h2 className={`text-6xl font-black tabular-nums tracking-tighter transition-colors duration-500 ${isCryptoOnly ? 'text-amber-500' : 'text-white'}`}>
                {(currentTotalCash || 0).toLocaleString('fr-FR')}
              </h2>
              <span className={`text-sm font-black uppercase italic ${isCryptoOnly ? 'text-amber-500/40' : 'text-indigo-400'}`}>EUR</span>
            </div>
            
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-10 border-t pt-10 ${isCryptoOnly ? 'border-amber-500/10' : 'border-white/5'}`}>
               {!isCryptoOnly && (
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">CASH & BANQUE</p>
                    <p className="text-3xl font-black text-white italic">{(fiatCash || 0).toLocaleString('fr-FR')}€</p>
                 </div>
               )}
               
               <div className={`${isCryptoOnly ? 'col-span-2' : 'col-span-1'} space-y-1`}>
                  <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest">ACTIFS NUMÉRIQUES</p>
                  <div className="flex flex-col">
                    <p className="text-3xl font-black text-amber-500 italic">{(cryptoTotalValueEuro || 0).toLocaleString('fr-FR')}€</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {Object.entries(cryptoHoldings).map(([symbol, qty]) => (qty as number) > 0 ? (
                        <div key={symbol} className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 transition-all hover:bg-white/10 hover:scale-105">
                          <span className="text-[10px] font-black text-white/40 uppercase">{symbol}: </span>
                          <span className="text-[11px] font-black text-amber-400">{(qty as number).toFixed(4)}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400/40 uppercase tracking-widest">EN COURS</p>
                  <p className="text-3xl font-black text-indigo-400 italic">
                    +{(pendingItems.reduce((sum, p) => sum + p.profit, 0) || 0).toLocaleString('fr-FR')}€
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* ANALYSE IA */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm group">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 italic">SYSTEM PILOT</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-4 py-2 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                {loadingReport ? 'ANALYSING...' : 'RUN IA'}
             </button>
           </div>
           <div className="flex-1 flex items-center">
             <p className="text-xs font-bold text-slate-800 dark:text-slate-100 italic leading-loose border-l-4 border-indigo-600 pl-6 py-2">
               {aiReport || "Lancez l'IA pour obtenir une analyse prédictive de vos actifs."}
             </p>
           </div>
        </div>
      </div>

      {!isCryptoOnly && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[250px] shadow-sm overflow-hidden">
             <BalanceTrendChart transactions={filtered} ownerFilter={viewType === Owner.GLOBAL ? Owner.GLOBAL : viewType as any} />
          </div>
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 h-[250px] flex flex-col items-center justify-center shadow-sm overflow-hidden">
             <CategoryPieChart transactions={filtered} />
          </div>
        </div>
      )}

      {/* COMMANDES À CONFIRMER */}
      {pendingItems.length > 0 && (
        <div className="space-y-6">
           <div className="flex items-center gap-6 px-4">
             <span className="text-[12px] font-black uppercase text-slate-400 tracking-[0.3em] italic">DÉBOUCLAGE EN ATTENTE ({pendingItems.length})</span>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-20"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[190px] group transition-all hover:shadow-2xl hover:-translate-y-2 border-b-4 border-b-transparent hover:border-b-emerald-500">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'STOCK' : 'COMM.'}
                      </span>
                      <div className="text-right">
                        <span className="text-base font-black text-emerald-500 block">+{(p.profit || 0).toLocaleString('fr-FR')}€</span>
                        {p.asset !== '€' && <span className="text-[10px] font-black text-amber-500 block italic">{(p.qty || 0).toFixed(4)} {p.asset}</span>}
                      </div>
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic leading-none">{p.name}</p>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.id)} 
                    className="mt-6 w-full text-[10px] font-black uppercase bg-slate-950 dark:bg-indigo-600 text-white py-4 rounded-[1.5rem] hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                  >
                    RECEVOIR LE GAIN
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
