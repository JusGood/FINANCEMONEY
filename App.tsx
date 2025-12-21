
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
    if (window.confirm('Supprimer définitivement cette opération ?')) {
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[12px] uppercase tracking-widest italic">Chargement du Vault de Fortune...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/10 shadow-2xl text-center relative z-10">
           <div className="mb-12">
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-tight italic">
               MILLIONAIRE<br/>
               <span className="text-indigo-500 not-italic">EN 2027</span>
             </h1>
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-6">Accès Sécurisé au Vault</p>
           </div>

           {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); }
            }} className="space-y-4">
              <input type="text" placeholder="URL du Vault (Supabase)" className="w-full bg-white/10 border border-white/10 rounded-2xl p-6 text-white text-xs outline-none focus:bg-white/15 transition-all" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé Secrète" className="w-full bg-white/10 border border-white/10 rounded-2xl p-6 text-white text-xs outline-none focus:bg-white/15 transition-all" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl">Connecter le Coffre-Fort</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              try {
                const { data, error } = await DB.signIn(email, password);
                if (error) setErrorMsg("Clés d'accès invalides"); else if (data?.user) setUser(data.user);
              } catch (err) { setErrorMsg("Erreur de connexion au serveur"); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-6 text-left">
              <div className="space-y-4">
                <input type="email" placeholder="Identifiant Fortune" className="w-full bg-white/10 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mot de Passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-6 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {errorMsg && <p className="text-rose-500 text-[10px] font-black uppercase text-center tracking-widest">{errorMsg}</p>}
              <button type="submit" disabled={isAuthenticating} className="w-full bg-indigo-600 text-white py-7 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-2xl hover:bg-indigo-500 active:scale-95 transition-all">
                {isAuthenticating ? 'Vérification...' : 'Déverrouiller le Vault'}
              </button>
              <p className="text-[9px] text-white/20 text-center font-black uppercase mt-6 tracking-widest italic">"Le futur appartient à ceux qui exécutent."</p>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={(v) => { setEditingTransaction(null); setActiveView(v); }}>
      {activeView === 'Add' ? (
        <TransactionForm 
          onAdd={async (d) => {
            try { await DB.saveTransaction({...d, id: Math.random().toString(36).substr(2, 9)}); await loadTransactions(); setActiveView(d.owner); } 
            catch(e: any) { alert(e.message); }
          }} 
          onUpdate={async (id, d) => {
            try { await DB.updateTransactionDB(id, d); await loadTransactions(); setEditingTransaction(null); setActiveView(d.owner); } 
            catch(e: any) { alert(e.message); }
          }} 
          onDelete={handleDelete}
          initialData={editingTransaction} 
          onCancel={() => { setEditingTransaction(null); setActiveView(Owner.GLOBAL); }} 
        />
      ) : activeView === 'Focus' ? (
        <FocusMode owner={Owner.GLOBAL} />
      ) : (
        <div className="space-y-12">
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
                 owner: tx.owner, note: `Vente finalisée: ${tx.projectName || 'Sans nom'}`, isSold: true,
                 method: tx.method
               });
               await loadTransactions();
            }} 
          />

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
              <div>
                <h4 className="font-black uppercase text-[12px] tracking-[0.3em] text-slate-900">Journal d'Exécution</h4>
                <p className="text-[9px] font-black uppercase text-slate-400 mt-2">Mouvements de capital détaillés</p>
              </div>
              <input type="text" placeholder="RECHERCHER..." className="bg-white rounded-2xl px-6 py-4 text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-50 w-40 md:w-64 transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {transactions
                .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                .map(t => (
                <div key={t.id} className="p-8 flex flex-col gap-6">
                  <div className="flex items-center justify-between" onClick={() => {setEditingTransaction(t); setActiveView('Add');}}>
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-[1.25rem] flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <span className="text-xl leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                        {t.method && t.method !== 'Standard' && <span className="text-[7px] mt-1 tracking-tighter">{t.method}</span>}
                      </div>
                      <div className="max-w-[180px]">
                        <p className="text-xs font-black uppercase truncate leading-tight text-slate-900">{t.projectName || t.category}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.date}</p>
                           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                           <span className={`text-[8px] font-black uppercase ${t.owner === Owner.LARBI ? 'text-indigo-500' : 'text-purple-500'}`}>{t.owner}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black tabular-nums ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount.toLocaleString()}€</p>
                      {t.expectedProfit && !t.isSold && <p className="text-[8px] font-black text-emerald-600 mt-1">+{t.expectedProfit}€</p>}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Editer</button>
                    <button onClick={() => handleDelete(t.id)} className="w-14 bg-rose-50 text-rose-600 py-4 rounded-xl flex items-center justify-center border border-rose-100"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-50"><th className="p-8">Opération / Stratégie</th><th className="p-8">Propriétaire</th><th className="p-8">Statut</th><th className="p-8 text-right">Montant Réel</th><th className="p-8 text-center">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions
                    .filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                    .map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 group transition-all duration-200">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <span className="text-lg leading-none">{t.type === TransactionType.INCOME ? '↑' : '↓'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black uppercase text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">{t.projectName || t.category}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-black text-slate-300 tabular-nums">{t.date}</span>
                               {t.method && t.method !== 'Standard' && (
                                 <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{t.method}</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${t.owner === Owner.LARBI ? 'text-indigo-500' : 'text-purple-500'}`}>{t.owner}</span>
                      </td>
                      <td className="p-8">
                        <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${t.isSold ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {t.isSold ? 'TERMINÉ ✅' : 'ACTIF ⏳'}
                        </span>
                      </td>
                      <td className={`p-8 text-right font-black tabular-nums text-sm ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString()}€
                      </td>
                      <td className="p-8">
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Icons.Pencil /></button>
                          <button onClick={() => handleDelete(t.id)} className="p-3 bg-white shadow-sm border border-slate-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"><Icons.Trash /></button>
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
