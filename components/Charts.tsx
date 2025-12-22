
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction, TransactionType, Owner } from '../types';

interface Props {
  transactions: Transaction[];
  ownerFilter?: Owner;
}

export const BalanceTrendChart: React.FC<Props> = ({ transactions, ownerFilter = Owner.GLOBAL }) => {
  const allTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (allTxs.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 italic text-[9px] font-black uppercase tracking-widest">Aucune donnée de flux...</div>;

  let runningRealBalance = 0;
  const dailyDataMap: Record<string, { date: string, real: number, projected: number, timestamp: number }> = {};

  allTxs.forEach(t => {
    const dateKey = t.date;
    
    if (!t.isForecast) {
        if (ownerFilter === Owner.GLOBAL) {
          if (t.type === TransactionType.TRANSFER) {
            // Pas d'impact global sur le cash
          } else if (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE) {
            runningRealBalance += (t.amount || 0);
          } else if (t.type === TransactionType.EXPENSE || t.type === TransactionType.INVESTMENT) {
            runningRealBalance -= (t.amount || 0);
          } else if (t.type === TransactionType.CLIENT_ORDER && t.isSold) {
             runningRealBalance += (t.expectedProfit || 0);
          }
        } else {
          if (t.type === TransactionType.TRANSFER) {
            if (t.owner === ownerFilter) runningRealBalance -= (t.amount || 0);
            if (t.toOwner === ownerFilter) runningRealBalance += (t.amount || 0);
          } else if (t.owner === ownerFilter) {
            if (t.type === TransactionType.INCOME || t.type === TransactionType.INITIAL_BALANCE) {
              runningRealBalance += (t.amount || 0);
            } else if (t.type === TransactionType.EXPENSE || t.type === TransactionType.INVESTMENT) {
              runningRealBalance -= (t.amount || 0);
            } else if (t.type === TransactionType.CLIENT_ORDER && t.isSold) {
               runningRealBalance += (t.expectedProfit || 0);
            }
          }
        }
    }

    const currentActiveInvestments = transactions
      .filter(tx => (ownerFilter === Owner.GLOBAL || tx.owner === ownerFilter) && !tx.isSold && tx.type === TransactionType.INVESTMENT && new Date(tx.date) <= new Date(t.date))
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const currentActiveProfits = transactions
      .filter(tx => (ownerFilter === Owner.GLOBAL || tx.owner === ownerFilter) && !tx.isSold && (tx.type === TransactionType.INVESTMENT || tx.type === TransactionType.CLIENT_ORDER) && new Date(tx.date) <= new Date(t.date))
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
    <div className="h-full w-full min-h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.05} />
          <XAxis dataKey="date" fontSize={8} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
          <YAxis fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val || 0).toLocaleString('fr-FR')}€`} tick={{fill: '#94a3b8'}} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', border: 'none', borderRadius: '12px', fontSize: '9px', color: '#fff', fontWeight: 'bold' }}
            formatter={(value: any) => [`${(value || 0).toLocaleString('fr-FR')} €`, 'Solde']}
          />
          <Area type="monotone" dataKey="real" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const categoryData = transactions.reduce((acc: any, curr) => {
    if (curr.type === TransactionType.EXPENSE || curr.type === TransactionType.INVESTMENT) {
      const existing = acc.find((a: any) => a.name === curr.category);
      if (existing) existing.value += (curr.amount || 0);
      else acc.push({ name: curr.category, value: (curr.amount || 0) });
    }
    return acc;
  }, []);
  
  if (categoryData.length === 0) return <div className="h-full flex items-center justify-center text-slate-400 italic text-[8px] font-black uppercase tracking-widest">Aucune dépense...</div>;

  return (
    <div className="h-full w-full min-h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={categoryData} innerRadius="55%" outerRadius="75%" paddingAngle={5} dataKey="value" stroke="none">
            {categoryData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '12px', fontWeight: 'bold' }} formatter={(value: any) => `${(value || 0).toLocaleString('fr-FR')} €`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
