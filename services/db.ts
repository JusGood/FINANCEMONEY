
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

let supabase: SupabaseClient | null = null;

export const initDB = () => {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');
  if (url && key) {
    try {
      supabase = createClient(url, key);
      return true;
    } catch (e) {
      console.error("Erreur d'initialisation Supabase:", e);
      return false;
    }
  }
  return false;
};

export const getSupabase = () => supabase;

export const signUp = async (email: string, pass: string, name: string) => {
  if (!supabase) return { error: { message: "Base de données non configurée. Allez dans les réglages." } };
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { 
      data: { display_name: name },
      emailRedirectTo: window.location.origin
    }
  });
  return { data, error };
};

export const signIn = async (email: string, pass: string) => {
  if (!supabase) return { error: { message: "Base de données non configurée." } };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  return { data, error };
};

export const signOut = async () => {
  if (supabase) await supabase.auth.signOut();
};

export const getTransactions = async (): Promise<Transaction[]> => {
  if (!supabase) {
    const saved = localStorage.getItem('finance_v3_data');
    return saved ? JSON.parse(saved) : [];
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Erreur de récupération:', error.message);
    // Fallback local en cas d'erreur réseau ou table manquante
    const saved = localStorage.getItem('finance_v3_data');
    return saved ? JSON.parse(saved) : [];
  }
  return data || [];
};

export const saveTransaction = async (tx: Transaction) => {
  if (!supabase) {
    const saved = await getTransactions();
    const updated = [...saved, tx];
    localStorage.setItem('finance_v3_data', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from('transactions').insert([tx]);
  if (error) {
    console.error('Erreur sauvegarde cloud:', error.message);
    // Backup local si échec
    const saved = JSON.parse(localStorage.getItem('finance_v3_data') || '[]');
    localStorage.setItem('finance_v3_data', JSON.stringify([...saved, tx]));
  }
};

export const updateTransactionDB = async (id: string, tx: Transaction) => {
  if (!supabase) {
    const saved = await getTransactions();
    const updated = saved.map(t => t.id === id ? tx : t);
    localStorage.setItem('finance_v3_data', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from('transactions').update(tx).eq('id', id);
  if (error) console.error('Erreur mise à jour cloud:', error.message);
};

export const deleteTransactionDB = async (id: string) => {
  if (!supabase) {
    const saved = await getTransactions();
    const updated = saved.filter(t => t.id !== id);
    localStorage.setItem('finance_v3_data', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Erreur suppression cloud:', error.message);
};

// Fonction pour écouter les changements en temps réel
export const subscribeToChanges = (callback: () => void) => {
  if (!supabase) return null;
  
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      () => {
        callback();
      }
    )
    .subscribe();
    
  return channel;
};
