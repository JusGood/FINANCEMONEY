
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
  const [dbError, setDbError] = useState<string | null>(null);
  
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
      setDbError(err.message || "Erreur de synchronisation");
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
        setDbError(e.message);
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[12px] uppercase tracking-[0.5em] italic">
      INITIALISATION DU VAULT...
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
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-6">Accès Sécurisé</p>
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
              <p className="text-[9px] text-white/15 text-center font-black uppercase mt-8 tracking-[0.2em] italic">Le million est une question d'exécution, pas de chance.</p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {dbError && (
        <div className="bg-rose-600 text-white p-6 rounded-3xl mb-8 font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top-4 duration-500">
          ⚠️ {dbError}
        </div>
      )}

      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            try { await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)}); await loadTransactions(); setActiveView(d.owner); } 
            catch(e: any) { setDbError(e.message); }
          }} 
          onUpdate={async (id, d) => {
            try { await DB.updateTransactionDB(id, d); await loadTransactions(); setEditingTransaction(null); setActiveView(d.owner); } 
            catch(e: any) { setDbError(e.message); }
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="space-y-14">
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
                 setDbError(e.message);
               }
            }} 
          />

          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-12 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/10 gap-6">
              <div>
                <h4 className="font-black uppercase text-[14px] tracking-[0.4em] text-slate-900 leading-none">Journal d'Opérations</h4>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-3">Audit complet des flux de capital</p>
              </div>
              <input type="text" placeholder="RECHERCHER DANS LE VAULT..." className="bg-white rounded-2xl px-8 py-5 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-100 w-full md:w-96 transition-all shadow-inner border border-slate-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {transactions
                .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                .map(t => (
                <div key={t.id} className="p-10 flex flex-col gap-8">
                  <div className="flex items-center justify-between" onClick={() => {setEditingTransaction(t); setActiveView('Add');}}>
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <span className="text-2xl leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                        {t.method && t.method !== 'Standard' && <span className="text-[8px] mt-1 tracking-tighter uppercase">{t.method}</span>}
                      </div>
                      <div className="max-w-[180px]">
                        <p className="text-sm font-black uppercase truncate leading-tight text-slate-900">{t.projectName || t.category}</p>
                        <div className="flex items-center gap-3 mt-3">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.date}</p>
                           <span className={`text-[10px] font-black uppercase ${t.owner === Owner.LARBI ? 'text-indigo-600' : 'text-purple-600'}`}>{t.owner}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black tabular-nums ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()}€</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Editer</button>
                    <button onClick={() => handleDelete(t.id)} className="w-16 bg-rose-50 text-rose-600 py-5 rounded-2xl flex items-center justify-center border border-rose-100"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-[0.3em] border-b border-slate-50"><th className="p-10">Opération / Stratégie</th><th className="p-10">Propriétaire</th><th className="p-10">Statut</th><th className="p-10 text-right">Montant</th><th className="p-10 text-center">Gestion</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/30 group transition-all duration-300">
                      <td className="p-10">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <span className="text-xl leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-none mb-2">{t.projectName || t.category}</span>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-300 tabular-nums">{t.date}</span>
                               {t.method && t.method !== 'Standard' && (
                                 <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{t.method}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-10">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${t.owner === Owner.LARBI ? 'text-indigo-600' : 'text-purple-600'}`}>{t.owner}</span>
                      </td>
                      <td className="p-10">
                        <span className={`text-[10px] font-black uppercase px-5 py-2 rounded-full ${t.isSold ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {t.isSold ? 'CLOS ✅' : 'OUVERT ⏳'}
                        </span>
                      </td>
                      <td className={`p-10 text-right font-black tabular-nums text-base ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}€
                      </td>
                      <td className="p-10">
                        <div className="flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-4 bg-white shadow-xl border border-slate-100 rounded-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Icons.Pencil /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-4 bg-white shadow-xl border border-slate-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
