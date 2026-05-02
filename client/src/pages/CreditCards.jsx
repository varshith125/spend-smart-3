import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreditCards } from '../hooks/useCreditCards';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryInfo, expenseCategories } from '../utils/categoryColors';
import {
  CreditCard, Plus, Trash2, ArrowUpCircle, ArrowDownCircle,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

const CARD_COLORS = [
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Slate', value: '#64748b' },
];

function CardVisual({ card }) {
  const util = card.creditLimit > 0
    ? Math.min(100, Math.round((card.currentBalance / card.creditLimit) * 100))
    : 0;
  const utilColor = util >= 90 ? '#f43f5e' : util >= 70 ? '#f59e0b' : '#10b981';

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden shadow-xl"
      style={{ background: `linear-gradient(135deg, ${card.color}cc, ${card.color}55)`, border: `1px solid ${card.color}44` }}
    >
      {/* Shine effect */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
        style={{ background: 'white' }} />

      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Credit Card</p>
          <p className="font-heading font-bold text-white text-lg">{card.cardName}</p>
        </div>
        <CreditCard className="w-7 h-7 text-white/60" />
      </div>

      <p className="text-white/60 text-xs mb-4 font-mono tracking-widest">
        •••• •••• •••• {card.lastFourDigits}
      </p>

      {/* Balance & Limit */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-white/60 text-xs mb-1">Outstanding Balance</p>
          <p className="text-white font-heading font-bold text-2xl">{formatCurrency(card.currentBalance)}</p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs mb-1">Limit</p>
          <p className="text-white font-semibold">{formatCurrency(card.creditLimit)}</p>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/60 mb-1">
          <span>Utilization</span>
          <span style={{ color: utilColor }}>{util}%</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${util}%`, backgroundColor: utilColor }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CreditCards() {
  const { cards, loading, fetchCards, addCard, addTransaction, deleteTransaction, deleteCard } = useCreditCards();
  const [showAddCard, setShowAddCard] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showTxModal, setShowTxModal] = useState(null); // cardId

  // Add card form
  const [cardName, setCardName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [billingDate, setBillingDate] = useState('1');
  const [color, setColor] = useState('#8b5cf6');
  const [currentBalance, setCurrentBalance] = useState('');

  // Transaction form
  const [txType, setTxType] = useState('charge');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Other');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleAddCard = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { success } = await addCard({
      cardName, lastFourDigits: lastFour || '0000',
      creditLimit: Number(creditLimit), billingDate: Number(billingDate),
      color, currentBalance: Number(currentBalance) || 0,
    });
    setIsSubmitting(false);
    if (success) {
      setShowAddCard(false);
      setCardName(''); setLastFour(''); setCreditLimit('');
      setBillingDate('1'); setColor('#8b5cf6'); setCurrentBalance('');
    }
  };

  const handleAddTx = async (e) => {
    e.preventDefault();
    if (!showTxModal) return;
    setIsSubmitting(true);
    const { success } = await addTransaction(showTxModal, {
      amount: Number(txAmount), type: txType,
      category: txCategory, note: txNote, date: txDate,
    });
    setIsSubmitting(false);
    if (success) {
      setShowTxModal(null);
      setTxAmount(''); setTxNote(''); setTxCategory('Other');
      setTxDate(new Date().toISOString().split('T')[0]); setTxType('charge');
    }
  };

  const totalBalance = cards.reduce((s, c) => s + c.currentBalance, 0);
  const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0);
  const overallUtil = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="w-7 h-7 text-violet-400" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">Credit Cards</h1>
          </div>
          <p className="text-slate-400">Track your credit cards and keep utilization in check.</p>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="btn-gradient flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Card</span>
        </button>
      </div>

      {/* Summary strip */}
      {cards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 mb-6 grid grid-cols-3 gap-4 text-center"
        >
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Outstanding</p>
            <p className="font-heading font-bold text-rose-400 text-xl">{formatCurrency(totalBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Total Limit</p>
            <p className="font-heading font-bold text-white text-xl">{formatCurrency(totalLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Overall Utilization</p>
            <p className={`font-heading font-bold text-xl ${overallUtil >= 70 ? 'text-rose-400' : overallUtil >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {overallUtil}%
            </p>
          </div>
        </motion.div>
      )}

      {/* Cards list */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="glass p-14 text-center">
          <CreditCard className="w-14 h-14 text-violet-400/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No cards added yet</h3>
          <p className="text-slate-400">Add your credit cards to track spending and utilization.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <AnimatePresence>
            {cards.map((card) => {
              const isExpanded = expandedCard === card._id;
              const monthCharges = card.transactions
                .filter(t => t.type === 'charge' && new Date(t.date).getMonth() === new Date().getMonth())
                .reduce((s, t) => s + t.amount, 0);

              const daysToBilling = (() => {
                const today = new Date().getDate();
                let d = card.billingDate - today;
                if (d < 0) {
                  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                  d += daysInMonth;
                }
                return d;
              })();

              return (
                <motion.div
                  key={card._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass overflow-hidden"
                >
                  {/* Card visual + quick actions */}
                  <div className="p-5 grid md:grid-cols-2 gap-5 items-start">
                    <CardVisual card={card} />

                    {/* Right panel */}
                    <div className="space-y-3">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">This Month Spent</p>
                          <p className="font-bold text-rose-400">{formatCurrency(monthCharges)}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">Billing in</p>
                          <p className={`font-bold ${daysToBilling <= 3 ? 'text-amber-400' : 'text-white'}`}>
                            {daysToBilling === 0 ? 'Today!' : `${daysToBilling} days`}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">Available Credit</p>
                          <p className="font-bold text-emerald-400">{formatCurrency(Math.max(0, card.creditLimit - card.currentBalance))}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-1">Billing Date</p>
                          <p className="font-bold text-white">{card.billingDate}th</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowTxModal(card._id); setTxType('charge'); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-sm font-medium transition"
                        >
                          <ArrowUpCircle className="w-4 h-4" /> Charge
                        </button>
                        <button
                          onClick={() => { setShowTxModal(card._id); setTxType('payment'); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition"
                        >
                          <ArrowDownCircle className="w-4 h-4" /> Payment
                        </button>
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : card._id)}
                          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => window.confirm('Delete this card and all transactions?') && deleteCard(card._id)}
                          className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-400/10 text-sm transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction history (expandable) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/10"
                      >
                        <div className="p-5">
                          <h4 className="font-heading font-semibold text-white mb-4">Transaction History</h4>
                          {card.transactions.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-6">No transactions yet</p>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {[...card.transactions].reverse().map((tx) => {
                                const info = getCategoryInfo(tx.category);
                                return (
                                  <div key={tx._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${info.bgClass}`}>
                                      {tx.type === 'payment' ? '💳' : info.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-white truncate">
                                        {tx.note || tx.category}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {tx.category} · {new Date(tx.date).toLocaleDateString('en-IN')}
                                      </p>
                                    </div>
                                    <p className={`font-bold text-sm ${tx.type === 'payment' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount)}
                                    </p>
                                    <button
                                      onClick={() => deleteTransaction(card._id, tx._id)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowAddCard(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold font-heading text-white">Add Credit Card</h3>
                <button onClick={() => setShowAddCard(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddCard} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Card Name</label>
                  <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)}
                    className="glass-input w-full" placeholder="e.g. HDFC Regalia, SBI SimplyCLICK" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Last 4 Digits</label>
                    <input type="text" maxLength={4} pattern="\d{4}" value={lastFour} onChange={e => setLastFour(e.target.value)}
                      className="glass-input w-full font-mono" placeholder="1234" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Billing Date</label>
                    <input type="number" min="1" max="31" required value={billingDate} onChange={e => setBillingDate(e.target.value)}
                      className="glass-input w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Credit Limit (₹)</label>
                    <input type="number" min="1" required value={creditLimit} onChange={e => setCreditLimit(e.target.value)}
                      className="glass-input w-full" placeholder="e.g. 100000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Current Balance (₹)</label>
                    <input type="number" min="0" value={currentBalance} onChange={e => setCurrentBalance(e.target.value)}
                      className="glass-input w-full" placeholder="0" />
                  </div>
                </div>
                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Card Color</label>
                  <div className="flex gap-2">
                    {CARD_COLORS.map(c => (
                      <button key={c.value} type="button" onClick={() => setColor(c.value)}
                        className={`w-7 h-7 rounded-full border-2 transition ${color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c.value }} title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddCard(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/25 transition disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : 'Add Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showTxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowTxModal(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold font-heading text-white">
                  {txType === 'charge' ? '💳 Log a Charge' : '✅ Log a Payment'}
                </h3>
                <button onClick={() => setShowTxModal(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddTx} className="p-5 space-y-4">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setTxType('charge')}
                    className={`p-3 rounded-xl border text-sm font-medium transition ${txType === 'charge' ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                    💸 Charge
                  </button>
                  <button type="button" onClick={() => setTxType('payment')}
                    className={`p-3 rounded-xl border text-sm font-medium transition ${txType === 'payment' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}>
                    ✅ Payment
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹)</label>
                  <input type="number" min="1" required value={txAmount} onChange={e => setTxAmount(e.target.value)}
                    className="glass-input w-full" placeholder="e.g. 2500" />
                </div>
                {txType === 'charge' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                    <select value={txCategory} onChange={e => setTxCategory(e.target.value)} className="glass-input w-full">
                      {expenseCategories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
                      <option value="Other">💵 Other</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Note (optional)</label>
                  <input type="text" value={txNote} onChange={e => setTxNote(e.target.value)}
                    className="glass-input w-full" placeholder="e.g. Amazon order, EMI payment..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <input type="date" required value={txDate} onChange={e => setTxDate(e.target.value)} className="glass-input w-full" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowTxModal(null)}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className={`flex-1 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 ${txType === 'charge' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                    {isSubmitting ? 'Saving...' : txType === 'charge' ? 'Record Charge' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
