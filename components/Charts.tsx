
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell
} from 'recharts';
import { Transaction, TransactionType, Owner } from '../types';

interface Props {
  transactions: Transaction[];
  ownerFilter?: Owner;
}

export const BalanceTrendChart: React.FC<Props> = ({ transactions, ownerFilter = Owner.GLOBAL }) => {
  const allTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (allTxs.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 italic text-[10px] font-black uppercase tracking-widest">En attente de données...</div>;

  let runningRealBalance = 0;
  const dailyDataMap: Record<string, { date: string, real: number, projected: number, timestamp: number }> = {};

  allTxs.forEach(t => {
    const dateKey = t.date;
    
    if (!t.isForecast) {
        if (ownerFilter === Owner.GLOBAL) {
          if (t.type === TransactionType.TRANSFER) {
            // Pas d'impact sur le global
          } else if (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE) {
            runningRealBalance += t.amount;
          } else if (t.type === TransactionType.EXPENSE || t.type === TransactionType.INVESTMENT) {
            runningRealBalance -= t.amount;
          }
        } else {
          // Vue individuelle
          if (t.type === TransactionType.TRANSFER) {
            if (t.owner === ownerFilter) runningRealBalance -= t.amount;
            if (t.toOwner === ownerFilter) runningRealBalance += t.amount;
          } else if (t.owner === ownerFilter) {
            if (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE) {
              runningRealBalance += t.amount;
            } else if (t.type === TransactionType.EXPENSE || t.type === TransactionType.INVESTMENT) {
              runningRealBalance -= t.amount;
            }
          }
        }
    }

    // Projection simplifiée
    const currentActiveInvestments = transactions
      .filter(tx => tx.owner === ownerFilter && !tx.isSold && tx.type === TransactionType.INVESTMENT && new Date(tx.date) <= new Date(t.date))
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentActiveProfits = transactions
      .filter(tx => tx.owner === ownerFilter && !tx.isSold && (tx.type === TransactionType.INVESTMENT || tx.type === TransactionType.CLIENT_ORDER) && new Date(tx.date) <= new Date(t.date))
      .reduce((sum, tx) => sum + (tx.expectedProfit || 0), 0);

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
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
          <XAxis dataKey="date" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
          <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Area name="Cash" type="monotone" dataKey="real" stroke="#6366f1" fill="url(#colorReal)" strokeWidth={2} />
          <Area name="Projeté" type="monotone" dataKey="projected" stroke="#10b981" strokeDasharray="4 4" fill="url(#colorProj)" strokeWidth={1.5} />
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
  
  if (categoryData.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 italic text-[10px] font-black uppercase">Aucune donnée</div>;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie data={categoryData} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
            {categoryData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
