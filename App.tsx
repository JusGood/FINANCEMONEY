
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
        // Init logic handled elsewhere
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
      setTransactions(data);
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
      else alert("Transaction Failed");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black uppercase tracking-[1em] text-[10px] italic">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl"></div>
      SYNC...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 blur-[80px]"></div>
          
          <div className="mb-12">
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">VAULT <br/><span className="text-indigo-600">EN 2027</span></h1>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-4">PRIVATE AUTHENTICATION</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé.");
          }} className="space-y-6">
            <input name="email" type="email" placeholder="AGENT ID" className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold tracking-widest uppercase" required />
            <input name="password" type="password" placeholder="PASSWORD" className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold tracking-widest uppercase" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.4em] transition-all hover:bg-indigo-500 shadow-xl shadow-indigo-900/40">ACCÉDER</button>
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
            if (confirm("Suppression d'audit ?")) {
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
        <div className="flex flex-col gap-10 animate-in fade-in duration-700">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               
               if (tx.type === TransactionType.INCOME) {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
               } else {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
                 await DB.saveTransaction({
                   id: Math.random().toString(36).substr(2, 9),
                   date: new Date().toISOString().split('T')[0],
                   amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                   category: tx.category, type: TransactionType.INCOME, account: tx.account,
                   owner: tx.owner, note: `Audit Clos [${tx.projectName || 'REF'}]`, isSold: true, method: tx.method
                 });
               }
               await loadTransactions();
            }} 
          />

          {dbError && (
            <div className="bg-rose-500 p-6 rounded-2xl text-white shadow-lg text-[10px]">
               <h5 className="font-black uppercase tracking-widest mb-2">MISE À JOUR SQL</h5>
               <pre className="p-3 bg-black/20 rounded-lg whitespace-pre-wrap font-mono select-all overflow-x-auto">{dbError}</pre>
            </div>
          )}

          {/* Transaction Journal - High Density */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h4 className="font-black uppercase text-[10px] tracking-[0.4em] text-slate-400 italic">JOURNAL D'AUDIT ALPHA</h4>
              <div className="flex-1 max-w-sm px-8">
                <input 
                  type="text" 
                  placeholder="FILTRER..." 
                  className="w-full bg-white dark:bg-slate-950 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase outline-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-600 transition-all border-none" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/10 text-slate-400 text-[9px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-4 tracking-widest">DOSSIER</th>
                    <th className="px-8 py-4 tracking-widest">PROTOCOLE</th>
                    <th className="px-8 py-4 tracking-widest text-center">AGENTS</th>
                    <th className="px-8 py-4 tracking-widest">STATUT</th>
                    <th className="px-8 py-4 text-right tracking-widest">QUANTUM</th>
                    <th className="px-8 py-4 text-center tracking-widest">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView || t.toOwner === activeView) && (!searchTerm || (t.projectName || t.category || t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => {
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      const displayAmount = t.type === TransactionType.CLIENT_ORDER ? (t.expectedProfit || 0) : t.amount;
                      const isPending = !t.isSold && (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INVESTMENT);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${isPending ? 'opacity-50' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-xs text-slate-900 dark:text-white truncate max-w-[280px] tracking-tight group-hover:text-indigo-600 transition-colors italic">{t.projectName || t.category}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-slate-400 font-bold tabular-nums">{t.date}</span>
                                {t.clientName && <span className="text-[9px] text-indigo-500/60 font-black uppercase italic">/ {t.clientName}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${t.type === TransactionType.TRANSFER ? 'bg-indigo-600 text-white' : t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {t.type} {t.method !== 'Standard' ? `[${t.method}]` : ''}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {t.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase italic">
                                <span className="text-rose-500">{t.owner}</span>
                                <span className="opacity-20">➜</span>
                                <span className="text-emerald-500">{t.toOwner}</span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-[11px] font-black uppercase text-indigo-500 bg-indigo-500/5 px-2.5 py-1 rounded-md border border-indigo-500/10">{t.owner}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-5">
                             <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${t.isSold ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                {t.isSold ? 'CLOS' : 'OUVERT'}
                             </span>
                          </td>
                          <td className={`px-8 py-5 text-right font-black tabular-nums text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{displayAmount.toLocaleString('fr-FR')}€
                          </td>
                          <td className="px-8 py-5 text-center">
                            <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all opacity-20 group-hover:opacity-100">✏️</button>
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
