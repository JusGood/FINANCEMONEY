
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType, AccountType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import * as DB from './services/db';
import { Icons } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        // Init logic 
      } else {
        const sb = DB.getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          setUser(session?.user || null);
          sb.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
          });
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      loadTransactions();
      const channel = DB.subscribeToChanges('transactions', () => loadTransactions());
      return () => { if (channel) DB.getSupabase()?.removeChannel(channel); };
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const data = await DB.getTransactions();
      setTransactions(data || []);
      setDbError(null);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else console.error("Vault Error", err);
    }
  };

  const handleAddTransaction = async (d: Omit<Transaction, 'id'>) => {
    try {
      await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)});
      await loadTransactions();
      setActiveView(d.owner);
    } catch (err: any) {
      if (err.sql) setDbError(err.sql);
      else alert("Erreur d'enregistrement.");
    }
  };

  const handleConfirmSale = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    await DB.updateTransactionDB(id, {...tx, isSold: true});

    const incomeAmount = tx.type === TransactionType.INVESTMENT 
      ? ((tx.amount || 0) + (tx.expectedProfit || 0)) 
      : (tx.expectedProfit || 0);

    await DB.saveTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      expectedProfit: incomeAmount,
      category: tx.category, 
      type: TransactionType.INCOME, 
      account: tx.account,
      owner: tx.owner, 
      note: `Reçu : ${tx.projectName || tx.category}`, 
      isSold: true, 
      method: tx.method,
      assetSymbol: tx.assetSymbol,
      assetQuantity: tx.assetQuantity 
    });

    await loadTransactions();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-[10px] italic">
      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      Chargement...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white/5 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-2xl">
          <h1 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">VAULT 2027</h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé.");
          }} className="space-y-4">
            <input name="email" type="email" placeholder="AGENT ID" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-[10px] outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-bold uppercase" required />
            <input name="password" type="password" placeholder="PASSWORD" className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-[10px] outline-none focus:ring-1 focus:ring-indigo-600 transition-all font-bold uppercase" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 shadow-xl transition-all">Accéder</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={handleAddTransaction} 
          onUpdate={async (id, d) => {
            await DB.updateTransactionDB(id, d);
            await loadTransactions();
            setEditingTransaction(null);
            setActiveView(d.owner);
          }} 
          onDelete={async (id) => {
            if (confirm("Supprimer ?")) {
              await DB.deleteTransactionDB(id);
              await loadTransactions();
              setActiveView(Owner.GLOBAL);
            }
          }}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={handleConfirmSale} 
          />

          {dbError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 shadow-sm text-[9px]">
               <h5 className="font-black uppercase tracking-widest mb-1">Erreur DB</h5>
               <pre className="p-2 bg-black/10 rounded-lg whitespace-pre-wrap font-mono overflow-x-auto">{dbError}</pre>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/10">
              <h4 className="font-black uppercase text-[9px] tracking-widest text-slate-400">Journal</h4>
              <div className="flex-1 max-w-[200px] ml-4">
                <input 
                  type="text" 
                  placeholder="Filtrer..." 
                  className="w-full bg-white dark:bg-slate-950 rounded-lg px-2.5 py-1.5 text-[9px] font-bold uppercase outline-none ring-1 ring-slate-100 dark:ring-slate-800 focus:ring-indigo-600 transition-all border-none" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/5 text-slate-400 text-[8px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-2">Dossier</th>
                    <th className="px-5 py-2">Type</th>
                    <th className="px-5 py-2 text-center">Source ➔ Cible</th>
                    <th className="px-5 py-2">État</th>
                    <th className="px-5 py-2 text-right">Montant</th>
                    <th className="px-5 py-2 text-center">...</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView || t.toOwner === activeView) && (!searchTerm || (t.projectName || t.category || t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => {
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      const displayAmount = (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INCOME) ? (t.expectedProfit || 0) : (t.amount || 0);
                      const isPending = !t.isSold && (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INVESTMENT);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${isPending ? 'opacity-40' : ''}`}>
                          <td className="px-5 py-3">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[10px] text-slate-900 dark:text-white truncate max-w-[200px] italic">{t.projectName || t.category}</span>
                              <span className="text-[8px] text-slate-400 font-bold mt-0.5">{t.date} {t.clientName ? ` / ${t.clientName}` : ''}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${t.type === TransactionType.TRANSFER ? 'bg-indigo-600 text-white' : t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {t.type} {t.method !== 'Standard' ? `[${t.method}]` : ''}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {t.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase italic">
                                <span className="text-rose-500">{t.owner}</span>
                                <span className="opacity-20">➜</span>
                                <span className="text-emerald-500">{t.toOwner}</span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-[9px] font-bold uppercase text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded">{t.owner}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3">
                             <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded uppercase ${t.isSold ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {t.isSold ? 'Reçu' : 'Attente'}
                             </span>
                          </td>
                          <td className={`px-5 py-3 text-right font-black tabular-nums text-[11px] ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{(displayAmount || 0).toLocaleString('fr-FR')}€
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all">✏️</button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
