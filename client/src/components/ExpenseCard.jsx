import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryInfo } from '../utils/categoryColors';

export default function ExpenseCard({ expense, onDelete, index = 0 }) {
  const cat = getCategoryInfo(expense.category);
  const isIncome = expense.type === 'income';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="glass flex items-center gap-4 p-4 group"
    >
      {/* Category Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cat.bgClass}`}
      >
        {cat.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">
          {expense.note || expense.category}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bgClass} ${cat.textClass}`}>
            {expense.category}
          </span>
          <span className="text-xs text-slate-400">
            {format(new Date(expense.date), 'dd MMM yyyy')}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-lg ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(expense.amount)}
        </p>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(expense._id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-400/10 rounded-lg text-slate-400 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
