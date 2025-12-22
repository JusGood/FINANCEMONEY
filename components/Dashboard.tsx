
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
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  const filtered = useMemo(() => 
    ownerFilter === Owner.GLOBAL 
      ? transactions 
      : transactions.filter(t => t.owner === ownerFilter || t.toOwner === ownerFilter)
  , [transactions, ownerFilter]);

  // Calcul du stock réel de crypto (Uniquement ce qui est encaissé ou solde initial)
  const cryptoHoldings = useMemo(() => {
    const holdings: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.account === AccountType.CRYPTO && t.assetSymbol && t.assetQuantity) {
        // On compte dans le portefeuille si c'est encaissé OU si c'est un solde de départ
        const isActualized = t.isSold || t.type === TransactionType.INITIAL_BALANCE;
        
        if (isActualized) {
          const isIncoming = (
            (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE || t.type === TransactionType.CLIENT_ORDER) ||
            (t.type === TransactionType.TRANSFER && t.toOwner === ownerFilter)
          );
          const qty = isIncoming ? (t.assetQuantity || 0) : -(t.assetQuantity || 0);
          holdings[t.assetSymbol] = (holdings[t.assetSymbol] || 0) + qty;
        }
      }
    });
    return holdings;
  }, [filtered, ownerFilter]);

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = Object.keys(cryptoHoldings);
      if (symbols.length > 0) {
        try {
          const prices = await getCryptoPrices(symbols);
          setCryptoPrices(prices || {});
        } catch (e) {
          console.debug("Prix non récupérés, utilisation des fallbacks");
        }
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

  const fiatCash = (stats.initial || 0) + (stats.income || 0) - (stats.expense || 0) - (stats.invested || 0);
  const currentTotalCash = fiatCash + cryptoTotalValueEuro;

  const pendingItems = useMemo(() => {
    return filtered
      .filter(t => (ownerFilter === Owner.GLOBAL || t.owner === ownerFilter) && (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && !t.isSold)
      .map(t => ({
        name: t.projectName || t.category || 'Sans nom',
        profit: t.expectedProfit || 0,
        id: t.id,
        type: t.type,
        asset: t.account === AccountType.CRYPTO ? t.assetSymbol : '€',
        qty: t.assetQuantity || 0
      }));
  }, [filtered, ownerFilter]);

  const fetchAiReport = async () => {
    setLoadingReport(true);
    try {
      const report = await getFinancialHealthReport(filtered, ownerFilter);
      setAiReport(report);
    } catch (e) { setAiReport("Analyse indisponible."); }
    setLoadingReport(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BLOC PRINCIPAL SOLDE */}
        <div className="lg:col-span-8 bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">VALEUR TOTALE DU VAULT</p>
            </div>
            
            <div className="flex items-baseline gap-3 mb-10">
              <h2 className="text-5xl font-black tabular-nums text-white tracking-tighter">
                {(currentTotalCash || 0).toLocaleString('fr-FR')}
              </h2>
              <span className="text-sm font-black text-indigo-400 uppercase italic">EUR</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/5 pt-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">CASH & BANQUE</p>
                  <p className="text-2xl font-black text-white italic">{(fiatCash || 0).toLocaleString('fr-FR')}€</p>
               </div>
               
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest">ACTIFS CRYPTO</p>
                  <div className="flex flex-col">
                    <p className="text-2xl font-black text-amber-500 italic">{(cryptoTotalValueEuro || 0).toLocaleString('fr-FR')}€</p>
                    {/* Détail par Jeton - Correction ternaire pour éviter l'erreur qty */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(cryptoHoldings).map(([symbol, qty]) => (qty as number) > 0 ? (
                        <div key={symbol} className="bg-white/5 px-2 py-1 rounded-lg border border-white/5 transition-colors hover:bg-white/10">
                          <span className="text-[9px] font-black text-white/60 uppercase">{symbol}: </span>
                          <span className="text-[10px] font-bold text-amber-400">{(qty as number).toFixed(4)}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400/40 uppercase tracking-widest">ATTENTE RÉCEPTION</p>
                  <p className="text-2xl font-black text-indigo-400 italic">
                    +{(pendingItems.reduce((sum, p) => sum + p.profit, 0) || 0).toLocaleString('fr-FR')}€
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* ANALYSE IA */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-[10px] font-black tracking-widest uppercase text-slate-400 italic">PILOTAGE</h3>
             <button onClick={fetchAiReport} disabled={loadingReport} className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                {loadingReport ? 'CALCUL...' : 'ANALYSER'}
             </button>
           </div>
           <div className="flex-1 flex items-center">
             <p className="text-xs font-bold text-slate-700 dark:text-slate-200 italic leading-relaxed border-l-2 border-indigo-500 pl-5">
               {aiReport || "Lancez l'IA pour analyser vos flux et optimiser votre stratégie."}
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-[220px] shadow-sm overflow-hidden">
           <BalanceTrendChart transactions={filtered} ownerFilter={ownerFilter} />
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-[220px] flex flex-col items-center justify-center shadow-sm overflow-hidden">
           <CategoryPieChart transactions={filtered} />
        </div>
      </div>

      {/* COMMANDES À CONFIRMER */}
      {pendingItems.length > 0 && (
        <div className="space-y-4">
           <div className="flex items-center gap-4 px-3">
             <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest italic">ATTENTE ENCAISSEMENT ({pendingItems.length})</span>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800 opacity-20"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
             {pendingItems.map(p => (
               <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[170px] group transition-all hover:shadow-xl hover:-translate-y-1">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${p.type === TransactionType.INVESTMENT ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {p.type === TransactionType.INVESTMENT ? 'Stock' : 'Com.'}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-500 block">+{(p.profit || 0).toLocaleString('fr-FR')}€</span>
                        {p.asset !== '€' && <span className="text-[10px] font-bold text-amber-500 block italic">{(p.qty || 0).toFixed(4)} {p.asset}</span>}
                      </div>
                    </div>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase italic leading-tight">{p.name}</p>
                  </div>
                  <button 
                    onClick={() => onConfirmSale(p.id)} 
                    className="mt-4 w-full text-[10px] font-black uppercase bg-slate-950 dark:bg-indigo-600 text-white py-3 rounded-2xl hover:bg-emerald-500 transition-all shadow-md active:scale-95"
                  >
                    Confirmer Réception
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
