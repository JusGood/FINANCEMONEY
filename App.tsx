
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        // Fallback or config redirect
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
    } catch (err) {
      console.error("Erreur de chargement", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer définitivement cette opération du Vault ?")) {
      try {
        await DB.deleteTransactionDB(id);
        await loadTransactions();
        setEditingTransaction(null);
        if (activeView === 'Add') setActiveView(Owner.GLOBAL);
      } catch (err) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleRevertSale = async (originalTxId: string) => {
    if (confirm("Annuler l'encaissement ? Le revenu généré sera supprimé et l'article repassera en 'Ouvert'.")) {
      try {
        const originalTx = transactions.find(t => t.id === originalTxId);
        if (!originalTx) return;

        await DB.updateTransactionDB(originalTxId, { ...originalTx, isSold: false });

        const relatedIncome = transactions.find(t => 
          t.type === TransactionType.INCOME && 
          t.note?.includes(`[REF:${originalTxId}]`)
        );

        if (relatedIncome) {
          await DB.deleteTransactionDB(relatedIncome.id);
        }

        await loadTransactions();
      } catch (err) {
        alert("Erreur lors de l'annulation");
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs">
      Chargement du Vault...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <h1 className="text-2xl font-black text-white italic mb-10 uppercase tracking-tighter">MILLIONAIRE <span className="text-indigo-500">2027</span></h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé");
          }} className="space-y-6">
            <input name="email" type="email" placeholder="Email Privé" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
            <input name="password" type="password" placeholder="Clé d'Accès" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-indigo-500 active:scale-95 shadow-xl shadow-indigo-900/20">Déverrouiller le Vault</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)});
            await loadTransactions();
            setActiveView(d.owner);
          }} 
          onUpdate={async (id, d) => {
            await DB.updateTransactionDB(id, d);
            await loadTransactions();
            setEditingTransaction(null);
            setActiveView(d.owner);
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="flex flex-col gap-12 animate-in fade-in duration-500 pb-16">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               await DB.updateTransactionDB(id, {...tx, isSold: true});
               await DB.saveTransaction({
                 id: Math.random().toString(36).substr(2, 9),
                 date: new Date().toISOString().split('T')[0],
                 amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                 category: tx.category, type: TransactionType.INCOME, account: tx.account,
                 owner: tx.owner, note: `Vente [REF:${tx.id}]: ${tx.projectName}`, isSold: true, method: tx.method
               });
               await loadTransactions();
            }} 
          />

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors relative z-0">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-6 bg-slate-50/50 dark:bg-slate-800/30">
              <h4 className="font-black uppercase text-[12px] tracking-[0.3em] text-slate-400 italic">Journal d'Audit Financier</h4>
              <div className="relative flex-1 max-sm:w-full max-w-sm">
                <input 
                  type="text" 
                  placeholder="RECHERCHER DANS LE VAULT..." 
                  className="bg-white dark:bg-slate-950 rounded-2xl px-6 py-3 text-[11px] font-black uppercase outline-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 border-none w-full transition-all placeholder:text-slate-300" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/20 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5">Dossier / Produit</th>
                    <th className="px-8 py-5">Méthode</th>
                    <th className="px-8 py-5">Agent</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Profit Net (Ma Part)</th>
                    <th className="px-8 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => {
                      // LOGIQUE : Pour Commande Client, le montant affiché est UNIQUEMENT la commission de 10%
                      const displayAmount = t.type === TransactionType.CLIENT_ORDER ? (t.expectedProfit || 0) : t.amount;
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-sm text-slate-900 dark:text-white truncate max-w-[250px] tracking-tight">{t.projectName || t.category}</span>
                              <span className="text-[10px] text-slate-400 font-bold tabular-nums tracking-wider uppercase mt-1">{t.date}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 border-2 border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                              {t.method || 'STANDARD'}
                            </span>
                          </td>
                          <td className="px-8 py-6"><span className="text-[12px] font-black uppercase text-indigo-500 dark:text-indigo-400">{t.owner}</span></td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                               <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.1em] ${t.isSold ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                {t.isSold ? 'CLOS' : 'OUVERT'}
                              </span>
                              {t.isSold && (t.type === TransactionType.INVESTMENT || t.type === TransactionType.CLIENT_ORDER) && (
                                <button 
                                  onClick={() => handleRevertSale(t.id)} 
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                  title="Annuler l'encaissement"
                                >
                                  ↩️
                                </button>
                              )}
                            </div>
                          </td>
                          <td className={`px-8 py-6 text-right font-black tabular-nums text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{displayAmount.toLocaleString()}€
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all opacity-40 group-hover:opacity-100 text-lg">✏️</button>
                              <button onClick={() => handleDelete(t.id)} className="p-3 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100 text-rose-500 text-lg">🗑️</button>
                            </div>
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
