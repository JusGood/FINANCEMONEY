import React, { useState, useEffect } from 'react';
import { Transaction, Owner, TransactionType } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
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
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeView, setActiveView] = useState<Owner | 'Add'>(Owner.GLOBAL);
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
      const channel = DB.subscribeToChanges(() => loadTransactions());
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
    if (window.confirm('Supprimer définitivement ?')) {
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

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white font-black animate-pulse text-[10px] uppercase tracking-widest italic">Chargement...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 pb-24">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
           <h1 className="text-3xl font-black text-white tracking-tighter mb-8">FinanceFlow</h1>
           {authMode === 'config' ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('supabase_url', dbConfig.url.trim());
              localStorage.setItem('supabase_key', dbConfig.key.trim());
              if (DB.initDB()) { setAuthMode('login'); }
            }} className="space-y-4">
              <input type="text" placeholder="URL Supabase" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white text-xs" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} required />
              <input type="text" placeholder="Clé API Anon" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white text-xs" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} required />
              <button type="submit" className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase text-[10px]">Connecter</button>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              try {
                const { data, error } = await DB.signIn(email, password);
                if (error) setErrorMsg("Erreur"); else if (data?.user) setUser(data.user);
              } catch (err) { setErrorMsg("Erreur réseau"); }
              finally { setIsAuthenticating(false); }
            }} className="space-y-4 text-left">
              <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Mot de passe" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-white outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px]">Ouvrir le Vault</button>
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
      ) : (
        <div className="space-y-8 pb-32">
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
                 amount: tx.amount + (tx.expectedProfit || 0),
                 category: tx.category, type: TransactionType.INCOME, account: tx.account,
                 owner: tx.owner, note: `Vente: ${tx.projectName}`, isSold: true
               });
               await loadTransactions();
            }} 
          />

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h4 className="font-black uppercase text-sm">Journal des Flux</h4>
              <input type="text" placeholder="Filtrer..." className="bg-slate-50 rounded-xl px-4 py-2 text-xs font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Liste Mobile avec bouton SUPPRIMER géant */}
            <div className="md:hidden divide-y divide-slate-100">
              {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView) && (!searchTerm || (t.projectName || t.category).toLowerCase().includes(searchTerm.toLowerCase()))).map(t => (
                <div key={t.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between" onClick={() => {setEditingTransaction(t); setActiveView('Add');}}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? '↑' : '↓'}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase">{t.projectName || t.category}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount}€</p>
                  </div>
                  
                  {/* Bouton de suppression dédié sur mobile */}
                  <div className="flex gap-2">
                    <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="flex-1 bg-slate-50 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase">Modifier</button>
                    <button onClick={() => handleDelete(t.id)} className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-xl text-[10px] font-black uppercase border border-rose-100">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead><tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black"><th className="p-6">Date</th><th className="p-6">Projet</th><th className="p-6 text-right">Montant</th><th className="p-6 text-center">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.filter(t => (activeView === Owner.GLOBAL || t.owner === activeView)).map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-6 text-xs font-bold text-slate-400">{t.date}</td>
                      <td className="p-6 font-black uppercase text-xs">{t.projectName || t.category}</td>
                      <td className={`p-6 text-right font-black ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>{t.amount}€</td>
                      <td className="p-6 flex justify-center gap-2">
                        <button onClick={() => {setEditingTransaction(t); setActiveView('Add');}} className="p-2 bg-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Icons.Pencil /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-2 bg-slate-100 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><Icons.Trash /></button>
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