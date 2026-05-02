import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoans } from '../hooks/useLoans';
import { formatCurrency } from '../utils/formatCurrency';
import { Landmark, Plus, Trash2, CheckCircle2, Circle, PartyPopper } from 'lucide-react';

export default function Loans() {
  const { loans, loading, fetchLoans, addLoan, updateLoanStatus, deleteLoan } = useLoans();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [type, setType] = useState('Lent');
  const [partyName, setPartyName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentDay, setPaymentDay] = useState(new Date().getDate().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleAddLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { success } = await addLoan({
      type,
      partyName,
      principalAmount: Number(principalAmount),
      interestRate: Number(interestRate),
      durationMonths: Number(durationMonths),
      startDate,
      endDate: endDate || undefined,
      paymentDay: Number(paymentDay),
    });
    setIsSubmitting(false);

    if (success) {
      setShowModal(false);
      setPartyName('');
      setPrincipalAmount('');
      setInterestRate('');
      setDurationMonths('');
      setEndDate('');
      setPaymentDay(new Date().getDate().toString());
    }
  };

  const handleToggleStatus = async (loan) => {
    const newStatus = loan.status === 'Active' ? 'Completed' : 'Active';
    await updateLoanStatus(loan._id, newStatus);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteLoan(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">Loans & Debts</h1>
          <p className="text-slate-400">Track money you've lent out and borrowed.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gradient flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Record</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : loans.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active loans or debts!</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            You don't have any money lent out or borrowed. Keep it up!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {loans.map((loan) => (
              <motion.div
                key={loan._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass p-6 relative overflow-hidden ${
                  loan.status === 'Completed' ? 'opacity-60 grayscale-[0.5]' : ''
                }`}
              >
                {loan.status === 'Completed' && (
                  <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                    COMPLETED
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                        loan.type === 'Lent'
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30'
                          : 'bg-gradient-to-br from-rose-400 to-red-600 shadow-red-500/30'
                      }`}
                    >
                      <Landmark className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg text-white">
                        {loan.partyName}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        {loan.type === 'Lent' ? 'You gave' : 'You borrowed'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(loan._id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Principal</p>
                    <p className="font-bold text-white text-lg">{formatCurrency(loan.principalAmount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Total w/ {loan.interestRate}% Int.</p>
                    <p className="font-bold text-white text-lg">{formatCurrency(loan.totalAmount)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-400">Monthly EMI (for {loan.durationMonths}m)</p>
                      <p className="text-xs text-slate-400">
                        {new Date(loan.startDate).toLocaleDateString()} to {new Date(loan.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-violet-400 text-xl">{formatCurrency(loan.monthlyEMI)}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                      <p className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                        Due on {loan.paymentDay}{loan.paymentDay === 1 || loan.paymentDay === 21 || loan.paymentDay === 31 ? 'st' : loan.paymentDay === 2 || loan.paymentDay === 22 ? 'nd' : loan.paymentDay === 3 || loan.paymentDay === 23 ? 'rd' : 'th'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(loan)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition ${
                    loan.status === 'Completed'
                      ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                      : 'border-slate-500 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {loan.status === 'Completed' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Active
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" />
                      Mark as Completed
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold font-heading text-white">Add Record</h3>
              </div>
              <form onSubmit={handleAddLoan} className="p-6 space-y-4">
                
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setType('Lent')}
                    className={`p-3 rounded-xl border text-sm font-medium transition ${
                      type === 'Lent'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    I Lent Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Borrowed')}
                    className={`p-3 rounded-xl border text-sm font-medium transition ${
                      type === 'Borrowed'
                        ? 'border-red-500 bg-red-500/10 text-red-400'
                        : 'border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    I Borrowed Money
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {type === 'Lent' ? 'To whom?' : 'From whom?'} (Person or App)
                  </label>
                  <input
                    type="text"
                    required
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="e.g. John Doe, KredX App"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Principal Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    className="glass-input w-full"
                    placeholder="e.g. 50000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Annual Interest (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="glass-input w-full"
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(e.target.value)}
                      className="glass-input w-full"
                      placeholder="e.g. 6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Payment Day (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                    className="glass-input w-full"
                    placeholder="e.g. 5 (for 5th of every month)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/25 transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Record'}
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
