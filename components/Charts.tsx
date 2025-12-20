
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { Transaction, TransactionType } from '../types';

interface Props {
  transactions: Transaction[];
}

export const BalanceTrendChart: React.FC<Props> = ({ transactions }) => {
  const allTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (allTxs.length === 0) return <div className="h-72 flex items-center justify-center text-slate-400 italic font-medium">En attente de données...</div>;

  let runningRealBalance = 0;
  const dailyDataMap: Record<string, { date: string, real: number, projected: number, timestamp: number }> = {};

  allTxs.forEach(t => {
    const dateKey = t.date;
    
    // Calcul du cash réel (l'argent qui sort vraiment de la banque)
    if (!t.isForecast) {
        if (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE) {
          runningRealBalance += t.amount;
        } else if (t.type === TransactionType.EXPENSE || t.type === TransactionType.INVESTMENT) {
          runningRealBalance -= t.amount;
        }
    }

    // Calcul de la projection (Patrimoine : Cash + Valeur Stock + Profits)
    const currentActiveInvestments = transactions
      .filter(tx => !tx.isSold && tx.type === TransactionType.INVESTMENT && new Date(tx.date) <= new Date(t.date))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentActiveProfits = transactions
      .filter(tx => !tx.isSold && (tx.type === TransactionType.INVESTMENT || tx.type === TransactionType.CLIENT_ORDER) && new Date(tx.date) <= new Date(t.date))
      .reduce((sum, tx) => sum + (tx.expectedProfit || 0), 0);

    // Les 1300€ sont retirés du 'real' mais rajoutés ici via 'currentActiveInvestments'
    const currentProjected = runningRealBalance + currentActiveInvestments + currentActiveProfits;

    dailyDataMap[dateKey] = {
      date: new Date(dateKey).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      timestamp: new Date(dateKey).getTime(),
      real: runningRealBalance,
      projected: currentProjected
    };
  });

  const data = Object.values(dailyDataMap).sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} />
          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
          <Legend verticalAlign="top" height={36} />
          <Area name="Cash en Banque" type="monotone" dataKey="real" stroke="#6366f1" fill="url(#colorReal)" strokeWidth={3} />
          <Area name="Projection (Valeur Totale)" type="monotone" dataKey="projected" stroke="#10b981" strokeDasharray="5 5" fill="url(#colorProj)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
  const categoryData = transactions.reduce((acc: any, curr) => {
    if (curr.type === TransactionType.EXPENSE || curr.type === TransactionType.INVESTMENT) {
      const existing = acc.find((a: any) => a.name === curr.category);
      if (existing) existing.value += curr.amount;
      else acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);
  
  if (categoryData.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400 italic text-sm">Aucune donnée</div>;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
            {categoryData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
