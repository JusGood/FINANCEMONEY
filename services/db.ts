
import { createClient } from '@supabase/supabase-js';
import { Transaction } from '../types';

let supabase: any = null;

export const initDB = () => {
  const url = localStorage.getItem('supabase_url');
  const key = localStorage.getItem('supabase_key');
  if (url && key) {
    supabase = createClient(url, key);
    return true;
  }
  return false;
};

export const getSupabase = () => supabase;

export const signUp = async (email: string, pass: string, name: string) => {
  if (!supabase) return { error: "Base de données non configurée" };
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { data: { display_name: name } }
  });
  return { data, error };
};

export const signIn = async (email: string, pass: string) => {
  if (!supabase) return { error: "Base de données non configurée" };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  return { data, error };
};

export const signOut = async () => {
  if (supabase) await supabase.auth.signOut();
  sessionStorage.removeItem('finance_auth_session');
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
    console.error('Error fetching:', error);
    return [];
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
  if (error) console.error('Error saving:', error);
};

export const updateTransactionDB = async (id: string, tx: Transaction) => {
  if (!supabase) {
    const saved = await getTransactions();
    const updated = saved.map(t => t.id === id ? tx : t);
    localStorage.setItem('finance_v3_data', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from('transactions').update(tx).eq('id', id);
  if (error) console.error('Error updating:', error);
};

export const deleteTransactionDB = async (id: string) => {
  if (!supabase) {
    const saved = await getTransactions();
    const updated = saved.filter(t => t.id !== id);
    localStorage.setItem('finance_v3_data', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Error deleting:', error);
};
