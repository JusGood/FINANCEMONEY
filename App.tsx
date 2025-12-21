
import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { FocusMode } from './components/FocusMode';
import { Icons } from './constants';
import * as DB from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'config'>('login');
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [dbError, setDbError] = useState<{message: string, sql?: string} | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeView, setActiveView] = useState<Owner | 'Add' | 'Focus'>(Owner.GLOBAL);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  });

  useEffect(() => {
    const init = async () => {
      const isConfigured = DB.initDB();
      if (!isConfigured) {
        setAuthMode('config');
      } else {
        const sb = DB.getSupabase();
        if (sb) {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) setUser(session.user);
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
      if (err.message === "MISSING_COLUMN_METHOD") {
        setDbError({
          message: "La colonne 'method' est absente de votre table 'transactions'.",
          sql: err.sql
        });
      } else {
        setDbError({ message: err.message || "Erreur de synchronisation" });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer définitivement cette opération du Vault ?')) {
      try {
        await DB.deleteTransactionDB(id);
        await loadTransactions();
        setEditingTransaction(null);
        setActiveView(Owner.GLOBAL);
      } catch (e: any) {
        setDbError({ message: e.message });
      }
    }
  };

  const copySQL = () => {
    if (dbError?.sql) {
      navigator.clipboard.writeText(dbError.sql);
      alert("Commande SQL copiée ! Collez-la dans le SQL Editor de Supabase.");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[12px] uppercase tracking-[0.5em] italic">
      INITIALISATION DU VAULT MILLIONNAIRE...
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl text-center relative z-10">
           <div className="mb-14">
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight italic">
               MILLIONAIRE<br/>
               <span className="text-indigo-500 not-italic">EN 2027</span>
             </h1>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-6">Accès Sécurisé</p>
           </div>

           {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); }
            }} className="space-y-4">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé API Anon" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 transition-transform">Lier la Database</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              try {
                const { data, error } = await DB.signIn(email, password);
                if (error) setErrorMsg("Clés d'accès invalides"); else if (data?.user) setUser(data.user);
              } catch (err) { setErrorMsg("Erreur réseau"); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-6 text-left">
              <div className="space-y-4">
                <input type="email" placeholder="Email Fortune" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mot de Passe" className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center tracking-widest">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-7 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all">
                {isAuthenticating ? 'VERIFICATION...' : 'DEVERROUILLER LE VAULT'}
              </button>
              <p className="text-[9px] text-white/15 text-center font-black uppercase mt-8 tracking-[0.2em] italic">"Le million est une question d'exécution, pas de chance."</p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {dbError && (
        <div className="bg-white border-2 border-rose-500 p-8 rounded-[2.5rem] mb-12 shadow-2xl shadow-rose-100 animate-in slide-in-from-top-6 duration-500">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 text-3xl shrink-0">⚠️</div>
            <div className="flex-1">
               <h4 className="text-lg font-black uppercase text-slate-900 tracking-tighter">Action Requise sur la Database</h4>
               <p className="text-sm text-slate-500 font-medium mt-1">{dbError.message}</p>
               {dbError.sql && (
                 <div className="mt-4 flex flex-col gap-3">
                   <code className="block bg-slate-900 text-indigo-400 p-4 rounded-xl text-xs font-mono break-all leading-relaxed border-l-4 border-indigo-500">
                     {dbError.sql}
                   </code>
                   <button 
                     onClick={copySQL}
                     className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest self-start hover:bg-indigo-700 transition-all shadow-lg"
                   >
                     Copier la commande SQL
                   </button>
                 </div>
               )}
            </div>
            <button onClick={() => setDbError(null)} className="text-slate-300 hover:text-slate-600 transition-colors">Fermer</button>
          </div>
        </div>
      )}

      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            try { await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)}); await loadTransactions(); setActiveView(d.owner); } 
            catch(e: any) { loadTransactions(); /* force refresh error UI */ }
          }} 
          onUpdate={async (id, d) => {
            try { await DB.updateTransactionDB(id, d); await loadTransactions(); setEditingTransaction(null); setActiveView(d.owner); } 
            catch(e: any) { loadTransactions(); }
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="space-y-16">
          <Dashboard 
            transactions={transactions} 
            ownerFilter={activeView as Owner} 
            onConfirmSale={async (id) => {
               const tx = transactions.find(t => t.id === id);
               if (!tx) return;
               try {
                 await DB.updateTransactionDB(id, {...tx, isSold: true});
                 await DB.saveTransaction({
                   id: Math.random().toString(36).substr(2, 9),
                   date: new Date().toISOString().split('T')[0],
                   amount: (tx.amount || 0) + (tx.expectedProfit || 0),
                   category: tx.category, type: TransactionType.INCOME, account: tx.account,
                   owner: tx.owner, note: `Profit encaissé: ${tx.projectName || 'Sans nom'}`, isSold: true,
                   method: tx.method
                 });
                 await loadTransactions();
               } catch (e: any) {
                 loadTransactions();
               }
            }} 
          />

          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/10 gap-8">
              <div>
                <h4 className="font-black uppercase text-[15px] tracking-[0.4em] text-slate-900 leading-none italic">JOURNAL D'EXÉCUTION</h4>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-widest">Audit complet du patrimoine et des flux</p>
              </div>
              <div className="relative w-full md:w-96 group">
                <input 
                  type="text" 
                  placeholder="RECHERCHER DANS LE VAULT..." 
                  className="bg-white rounded-2xl px-10 py-5 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 w-full transition-all shadow-inner border border-slate-100 placeholder:opacity-30" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">🔍</div>
              </div>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {transactions
                .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                .map(t => (
                <div key={t.id} className="p-10 flex flex-col gap-10">
                  <div className="flex items-center justify-between" onClick={() => {setEditingTransaction(t); setActiveView('Add');}}>
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.7rem] flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 shadow-inner'}`}>
                        <span className="text-2xl leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                        {t.method && t.method !== 'Standard' && <span className="text-[8px] mt-1 tracking-tighter uppercase font-black">{t.method}</span>}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="text-sm font-black uppercase truncate leading-tight text-slate-900 tracking-tighter">{t.projectName || t.category}</p>
                        <div className="flex items-center gap-4 mt-4">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{t.date}</p>
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${t.owner === Owner.LARBI ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>{t.owner}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black tabular-nums tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()}€</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="flex-1 bg-slate-900 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">ÉDITER L'OPÉRATION</button>
                    <button onClick={() => handleDelete(t.id)} className="w-20 bg-rose-50 text-rose-600 py-6 rounded-2xl flex items-center justify-center border border-rose-100 hover:bg-rose-100 transition-colors"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-[0.4em] border-b border-slate-50 italic"><th className="p-10">Opération / Stratégie</th><th className="p-10">Propriétaire</th><th className="p-10">Statut</th><th className="p-10 text-right">Montant Réel</th><th className="p-10 text-center">Gestion</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 group transition-all duration-300">
                      <td className="p-10">
                        <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'bg-rose-50 text-rose-600 shadow-inner'}`}>
                            <span className="text-2xl leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase text-[15px] text-slate-900 group-hover:text-indigo-600 transition-colors leading-none mb-3 tracking-tighter">{t.projectName || t.category}</span>
                            <div className="flex items-center gap-4">
                               <span className="text-[11px] font-black text-slate-300 tabular-nums italic">{t.date}</span>
                               {t.method && t.method !== 'Standard' && (
                                 <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-widest shadow-sm">{t.method}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-10">
                        <span className={`text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl ${t.owner === Owner.LARBI ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>{t.owner}</span>
                      </td>
                      <td className="p-10">
                        <span className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-sm ${t.isSold ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                          {t.isSold ? 'CLOS ✅' : 'OUVERT ⏳'}
                        </span>
                      </td>
                      <td className={`p-10 text-right font-black tabular-nums text-lg tracking-tighter ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}€
                      </td>
                      <td className="p-10">
                        <div className="flex justify-center gap-5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-5 bg-white shadow-2xl border border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Icons.Pencil /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-5 bg-white shadow-2xl border border-slate-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {transactions.length === 0 && (
              <div className="py-40 text-center opacity-20 flex flex-col items-center">
                 <div className="text-8xl mb-6 grayscale">📦</div>
                 <p className="font-black uppercase tracking-[0.5em] text-slate-900">Le Vault est vide</p>
                 <p className="text-xs font-bold uppercase tracking-widest mt-4">Commencez à bâtir votre empire aujourd'hui</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
