import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, IndianRupee, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useExpenses } from '../hooks/useExpenses';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatCurrency';

export default function Settings() {
  const { user, updateSettings } = useAuth();
  const { deleteAllExpenses } = useExpenses();
  const [budget, setBudget] = useState(user?.monthlyBudget || '');
  const [yearlyIncome, setYearlyIncome] = useState(user?.yearlyIncome || '');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveSettings = async () => {
    if (!budget && budget !== 0 && !yearlyIncome && yearlyIncome !== 0) {
      toast.error('Please enter a budget or income');
      return;
    }
    setSettingsLoading(true);
    try {
      const updates = {};
      if (budget !== '') updates.monthlyBudget = parseFloat(budget);
      if (yearlyIncome !== '') updates.yearlyIncome = parseFloat(yearlyIncome);
      
      await updateSettings(updates);
      toast.success('Settings updated! 💰');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleClearAll = async () => {
    await deleteAllExpenses();
    setShowConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-6">Settings</h1>

      {/* Profile */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="font-heading text-lg font-semibold text-white">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Name</label>
            <div className="glass-input opacity-70 cursor-not-allowed">{user?.name || '—'}</div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <div className="glass-input opacity-70 cursor-not-allowed">{user?.email || '—'}</div>
          </div>
        </div>
      </div>

      {/* Financial Settings */}
      <div className="glass p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <IndianRupee className="w-5 h-5 text-cyan-400" />
          <h2 className="font-heading text-lg font-semibold text-white">Financial Baseline & Budget</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Set your base yearly income and monthly budget limit. This will calculate your primary monthly income in the dashboard.
        </p>

        <div className="space-y-5">
          {/* Yearly Income */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Base Yearly Income
              {user?.yearlyIncome > 0 && (
                <span className="ml-2 text-xs text-slate-400">
                  (Current: <span className="text-cyan-400 font-medium">{formatCurrency(user.yearlyIncome)}</span>)
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 1200000"
                value={yearlyIncome}
                onChange={(e) => {
                  const val = e.target.value;
                  setYearlyIncome(val);
                  if (val && !isNaN(val)) {
                    setBudget(Math.round(Number(val) / 12).toString());
                  } else {
                    setBudget('');
                  }
                }}
                className="glass-input pl-8 w-full"
              />
            </div>
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Monthly Budget Limit
              {user?.monthlyBudget > 0 && (
                <span className="ml-2 text-xs text-slate-400">
                  (Current: <span className="text-purple-400 font-medium">{formatCurrency(user.monthlyBudget)}</span>)
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 30000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="glass-input pl-8 w-full"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="btn-gradient w-full md:w-auto px-8"
            >
              {settingsLoading ? (
                <div className="w-5 h-5 flex justify-center w-full">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-6 border-red-400/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-heading text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          This action is irreversible. All your expense data will be permanently deleted.
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Expenses
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-400/10 border border-red-400/30 rounded-xl p-4"
          >
            <p className="text-sm text-red-300 mb-3">
              Are you sure? This will delete ALL your expenses permanently.
            </p>
            <div className="flex gap-3">
              <button onClick={handleClearAll} className="btn-danger text-sm px-4 py-2">
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
