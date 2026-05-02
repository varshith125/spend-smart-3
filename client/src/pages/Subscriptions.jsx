import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useExpenses } from '../hooks/useExpenses';
import ExpenseCard from '../components/ExpenseCard';
import { formatCurrency } from '../utils/formatCurrency';
import { Repeat } from 'lucide-react';

export default function Subscriptions() {
  const { expenses, fetchExpenses, deleteExpense } = useExpenses();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses().then(() => setLoading(false));
  }, [fetchExpenses]);

  const recurringTransactions = expenses.filter((e) => e.isRecurring);

  const fixedMonthlyBurn = recurringTransactions
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const recurringIncome = recurringTransactions
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <Repeat className="w-6 h-6 text-pink-400" />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">Subscriptions & Fixed Bills</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="glass p-5 border-l-4 border-rose-500">
          <p className="text-sm text-slate-400 mb-1">Fixed Monthly Burn (Expenses)</p>
          <p className="text-3xl font-heading font-bold text-white">{formatCurrency(fixedMonthlyBurn)}</p>
        </div>
        <div className="glass p-5 border-l-4 border-emerald-500">
          <p className="text-sm text-slate-400 mb-1">Recurring Income</p>
          <p className="text-3xl font-heading font-bold text-white">{formatCurrency(recurringIncome)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {recurringTransactions.length > 0 ? (
          recurringTransactions.map((sub, i) => (
            <ExpenseCard key={sub._id} expense={sub} index={i} onDelete={deleteExpense} />
          ))
        ) : (
          <div className="glass p-12 text-center">
            <Repeat className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-heading font-semibold text-white mb-2">No active subscriptions</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              You haven't marked any transactions as recurring yet. Mark an expense as recurring when adding it to see it here.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
