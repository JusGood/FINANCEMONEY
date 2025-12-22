
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
      else alert("Erreur d'enregistrement.");
    }
  };

  const handleConfirmSale = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    // Marquer l'original comme vendu
    await DB.updateTransactionDB(id, {...tx, isSold: true});

    // Créer le mouvement d'entrée de fonds
    // Pour une commande client : on n'encaisse que le profit net
    // Pour un investissement stock : on encaisse le capital investi + le profit
    const incomeAmount = tx.type === TransactionType.INVESTMENT 
      ? (tx.amount + tx.expectedProfit) 
      : tx.expectedProfit;

    await DB.saveTransaction({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount: 0, // Pas de dépense ici
      expectedProfit: incomeAmount,
      category: tx.category, 
      type: TransactionType.INCOME, 
      account: tx.account,
      owner: tx.owner, 
      note: `Encaissé : ${tx.projectName || tx.category}`, 
      isSold: true, 
      method: tx.method,
      assetSymbol: tx.assetSymbol,
      assetQuantity: tx.assetQuantity // Si profit reçu en crypto, on garde la trace
    });

    await loadTransactions();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-black uppercase tracking-widest text-xs italic">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      Chargement du Vault...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">LE VAULT 2027</h1>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            const { error } = await DB.signIn(target.email.value, target.password.value);
            if (error) alert("Accès refusé.");
          }} className="space-y-5">
            <input name="email" type="email" placeholder="IDENTIFIANT" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold uppercase" required />
            <input name="password" type="password" placeholder="MOT DE PASSE" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white text-xs outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold uppercase" required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all hover:bg-indigo-500 shadow-xl">Se connecter</button>
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
            if (confirm("Supprimer définitivement ?")) {
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
        <div className="flex flex-col gap-8 animate-in fade-in duration-500">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={handleConfirmSale} 
          />

          {dbError && (
            <div className="bg-rose-500 p-6 rounded-2xl text-white shadow-lg text-[10px]">
               <h5 className="font-black uppercase tracking-widest mb-2">MISE À JOUR REQUIS</h5>
               <pre className="p-3 bg-black/20 rounded-lg whitespace-pre-wrap font-mono select-all overflow-x-auto">{dbError}</pre>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Journal des Flux</h4>
              <div className="flex-1 max-w-xs ml-4">
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  className="w-full bg-white dark:bg-slate-950 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-600 transition-all border-none" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/10 text-slate-400 text-[9px] uppercase font-black border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3">Libellé</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-center">Agents</th>
                    <th className="px-6 py-3">Statut</th>
                    <th className="px-6 py-3 text-right">Profit Net</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView || t.toOwner === activeView) && (!searchTerm || (t.projectName || t.category || t.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => {
                      const isPositive = t.type === TransactionType.INCOME || t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INITIAL_BALANCE;
                      const displayAmount = (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INCOME) ? t.expectedProfit : t.amount;
                      const isPending = !t.isSold && (t.type === TransactionType.CLIENT_ORDER || t.type === TransactionType.INVESTMENT);

                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group ${isPending ? 'opacity-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-black uppercase text-[11px] text-slate-900 dark:text-white truncate max-w-[250px] italic">{t.projectName || t.category}</span>
                              <span className="text-[9px] text-slate-400 font-bold mt-0.5">{t.date} {t.clientName ? ` / ${t.clientName}` : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${t.type === TransactionType.TRANSFER ? 'bg-indigo-600 text-white' : t.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {t.type} {t.method !== 'Standard' ? `[${t.method}]` : ''}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {t.type === TransactionType.TRANSFER ? (
                              <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase italic">
                                <span className="text-rose-500">{t.owner}</span>
                                <span className="opacity-30">➜</span>
                                <span className="text-emerald-500">{t.toOwner}</span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <span className="text-[10px] font-bold uppercase text-indigo-500 bg-indigo-500/5 px-2 py-0.5 rounded">{t.owner}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${t.isSold ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {t.isSold ? 'Encaissé' : 'En attente'}
                             </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-black tabular-nums text-xs ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : '-'}{displayAmount.toLocaleString('fr-FR')}€
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all opacity-0 group-hover:opacity-100">✏️</button>
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
