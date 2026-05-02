import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, IndianRupee, StickyNote, Calendar, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { useExpenses } from '../hooks/useExpenses';
import CategoryBadge from '../components/CategoryBadge';
import { expenseCategories, incomeCategories } from '../utils/categoryColors';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
};

export default function AddExpense() {
  const { addExpense } = useExpenses();
  const [recordType, setRecordType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeCategories = recordType === 'expense' ? expenseCategories : incomeCategories;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    setLoading(true);
    try {
      await addExpense({
        type: recordType,
        amount: parseFloat(amount),
        category,
        note,
        date: new Date(date).toISOString(),
        isRecurring,
      });
      // Reset form
      setAmount('');
      setCategory('');
      setNote('');
      setIsRecurring(false);
      setDate(format(new Date(), 'yyyy-MM-dd'));
    } catch {
      // Error handled by hook toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-2xl mx-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-cyan-400 mb-8 tracking-tight">
          Add Transaction
        </h1>
      </motion.div>

      <div className="glass p-6 md:p-10 relative overflow-hidden">
        {/* Subtle decorative glow orb inside card */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex bg-black/40 p-1 rounded-xl w-full mb-8 relative z-10 box-border border border-white/5 shadow-inner">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${recordType === 'expense' ? 'bg-white/10 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => { setRecordType('expense'); setCategory(''); }}
          >
            Expense
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${recordType === 'income' ? 'bg-white/10 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            onClick={() => { setRecordType('income'); setCategory(''); }}
          >
            Income
          </button>
        </div>


        <motion.form 
          variants={container}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit} 
          className="space-y-8 relative z-10"
        >
          {/* Amount */}
          <motion.div variants={item}>
            <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider text-xs">Amount</label>
            <div className="relative group">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-violet-400 transition-colors group-focus-within:text-violet-300" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glass-input pl-12 text-3xl md:text-4xl font-heading font-black py-4 transition-all focus:ring-4 focus:ring-violet-500/20"
                required
              />
            </div>
          </motion.div>

          {/* Category chips */}
          <motion.div variants={item}>
            <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider text-xs">Category</label>
            <div className="flex flex-wrap gap-3">
              {activeCategories.map((cat) => (
                <motion.div key={cat.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <CategoryBadge
                    category={cat.name}
                    selected={category === cat.name}
                    onClick={setCategory}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Note */}
          <motion.div variants={item}>
            <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider text-xs">
              Note / Description
              <span className="text-slate-500 font-normal ml-2 lowercase tracking-normal">(optional)</span>
            </label>
            <div className="relative group">
              <StickyNote className="absolute left-4 top-4 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-violet-300" />
              <input
                type="text"
                placeholder={`What was this ${recordType} for?`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input pl-12 py-3.5 focus:ring-4 focus:ring-violet-500/20"
                maxLength={200}
              />
            </div>
          </motion.div>

          {/* Date */}
          <motion.div variants={item}>
            <label className="block text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider text-xs">Date</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-violet-300" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input pl-12 py-3.5 focus:ring-4 focus:ring-violet-500/20"
                required
              />
            </div>
          </motion.div>

          {/* Recurring Toggle */}
          <motion.div variants={item} className="flex items-center gap-3 glass p-4 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-pink-400" />
            </div>
            <div className="flex-1">
              <label htmlFor="recurring-switch" className="text-sm font-semibold text-white block">Recurring Transaction</label>
              <span className="text-xs text-slate-400">Mark if this repeats monthly</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="recurring-switch"
                className="sr-only peer"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </motion.div>

          {/* Submit */}
          <motion.div variants={item} className="pt-4">
            <button
              type="submit"
              disabled={loading || !amount || !category}
              className="btn-gradient w-full py-4 text-lg shadow-xl shadow-violet-500/20 group relative overflow-hidden"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-5 h-5" />
                  <span>{recordType === 'income' ? 'Add Income' : 'Add Expense'}</span>
                </div>
              )}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
}
