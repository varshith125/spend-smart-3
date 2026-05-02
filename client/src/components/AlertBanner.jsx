import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function AlertBanner({ type = 'warning', message, onDismiss }) {
  const config = {
    warning: {
      bg: 'bg-amber-400/10 border-amber-400/30',
      text: 'text-amber-300',
      icon: 'text-amber-400',
    },
    danger: {
      bg: 'bg-red-400/10 border-red-400/30',
      text: 'text-red-300',
      icon: 'text-red-400',
    },
  };

  const style = config[type] || config.warning;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className={`rounded-xl border px-4 py-3 flex items-center gap-3 mb-4 ${style.bg}`}
        >
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${style.icon}`} />
          <p className={`text-sm flex-1 ${style.text}`}>{message}</p>
          {onDismiss && (
            <button onClick={onDismiss} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
