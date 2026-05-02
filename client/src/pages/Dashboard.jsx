import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Receipt, Crown, Bell } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useExpenses } from '../hooks/useExpenses';
import { useLoans } from '../hooks/useLoans';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryInfo } from '../utils/categoryColors';
import ExpenseCard from '../components/ExpenseCard';
import AlertBanner from '../components/AlertBanner';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

/* ── Animated Count Up ── */
function CountUp({ end, duration = 1500, prefix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString('en-IN')}</span>;
}

export default function Dashboard() {
  const { summary, loading, fetchSummary } = useExpenses();
  const { loans, fetchLoans } = useLoans();
  const [dismissedAlert, setDismissedAlert] = useState(false);

  // Loan status calculation
  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalLent = activeLoans.filter(l => l.type === 'Lent').reduce((sum, l) => sum + l.principalAmount, 0);
  const totalBorrowed = activeLoans.filter(l => l.type === 'Borrowed').reduce((sum, l) => sum + l.principalAmount, 0);

  useEffect(() => {
    fetchSummary();
    fetchLoans();
  }, [fetchSummary, fetchLoans]);

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-80" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const { totalThisMonth, totalMonthlyIncome, totalSavings, expenseCount, highestCategory, categoryBreakdown, dailyTotals, budget, percentUsed, percentIncomeUsed, recentExpenses } = summary;

  // AI Prediction & Burn Rate algorithm
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const burnRate = totalThisMonth / Math.max(currentDay, 1);
  const projectedSpend = Math.round(burnRate * daysInMonth);

  // Budget alert
  let alertMessage = null;
  let alertType = 'warning';
  if (budget > 0 && !dismissedAlert) {
    if (percentUsed >= 100) {
      alertMessage = `⚠️ You've exceeded your monthly budget! Spent ${formatCurrency(totalThisMonth)} of ${formatCurrency(budget)}.`;
      alertType = 'danger';
    } else if (percentUsed >= 80) {
      alertMessage = `⚠️ You've used ${percentUsed}% of your monthly budget. Careful with spending!`;
      alertType = 'warning';
    }
  }

  // Donut chart data
  const donutData = {
    labels: categoryBreakdown.map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.total),
        backgroundColor: categoryBreakdown.map((c) => getCategoryInfo(c.name).color),
        borderColor: 'rgba(0,0,0,0.3)',
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff',
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 16,
          usePointStyle: true,
          font: { size: 12, family: 'Inter' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleFont: { family: 'Plus Jakarta Sans', weight: '600' },
        bodyFont: { family: 'Inter' },
        callbacks: {
          label: (ctx) => {
            const pct = categoryBreakdown[ctx.dataIndex]?.percent || 0;
            return ` ${formatCurrency(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  // Bar chart data with projection
  const barData = {
    labels: dailyTotals.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Daily Spend',
        data: dailyTotals,
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
        hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)',
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        label: 'Projected Burn',
        // Fill an array with nulls, then add the projected line at the end
        data: dailyTotals.map(() => projectedSpend / daysInMonth),
        type: 'line',
        borderColor: 'rgba(244, 63, 94, 0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        order: 1,
      }
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          title: (items) => `Day ${items[0].label}`,
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => `₹${v.toLocaleString('en-IN')}`,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  const budgetBarClass = percentUsed >= 100 ? 'danger' : percentUsed >= 80 ? 'warning' : '';
  const incomeBarClass = percentIncomeUsed >= 100 ? 'danger' : percentIncomeUsed >= 80 ? 'warning' : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-white mb-6">Dashboard</h1>

      {/* Alert Banner */}
      <AlertBanner type={alertType} message={alertMessage} onDismiss={() => setDismissedAlert(true)} />

      {/* Reminders / Due Payments */}
      {loans.filter(l => l.status === 'Active').length > 0 && loans.filter(l => {
        const now = new Date();
        const currentDay = now.getDate();
        const dueDay = l.paymentDay;
        if (new Date(l.endDate) < now && currentDay > dueDay) return false;
        let daysUntil = dueDay - currentDay;
        if (daysUntil < 0) daysUntil += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return daysUntil <= 7;
      }).length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="font-heading text-lg font-bold text-white">Upcoming Reminders</h2>
          </div>
          <div className="space-y-3">
            {loans.filter(l => l.status === 'Active').map(loan => {
              const now = new Date();
              const currentDay = now.getDate();
              const dueDay = loan.paymentDay;
              
              // Check if loan has expired
              if (new Date(loan.endDate) < now && currentDay > dueDay) {
                return null;
              }

              // Calculate days until due (this month)
              let daysUntil = dueDay - currentDay;
              if (daysUntil < 0) daysUntil += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

              // Only show if due within 7 days
              if (daysUntil <= 7) {
                const isLent = loan.type === 'Lent';
                return (
                  <div key={loan._id} className={`glass p-4 border-l-4 ${isLent ? 'border-emerald-500 bg-emerald-500/5' : 'border-rose-500 bg-rose-500/5'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isLent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {daysUntil === 0 
                              ? 'Due Today!' 
                              : `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                          </p>
                          <p className="text-sm text-slate-300">
                            {isLent ? 'You need to receive money from' : 'You need to pay money to'}{' '}
                            <span className="font-bold text-white">{loan.partyName}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isLent ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(loan.monthlyEMI)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Budget Progress & AI Forecast bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {budget > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Monthly Budget</span>
              <span className="text-sm text-slate-300">
                {formatCurrency(totalThisMonth)} / {formatCurrency(budget)}
              </span>
            </div>
            <div className="budget-bar">
              <div
                className={`budget-bar-fill ${budgetBarClass}`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">{percentUsed}% used</p>
          </motion.div>
        )}

        {totalMonthlyIncome > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">Spent vs Total Income</span>
              <span className="text-sm text-slate-300">
                {formatCurrency(totalThisMonth)} / {formatCurrency(totalMonthlyIncome)}
              </span>
            </div>
            <div className="budget-bar">
              <div
                className={`budget-bar-fill ${incomeBarClass}`}
                style={{ width: `${Math.min(percentIncomeUsed, 100)}%`, backgroundColor: percentIncomeUsed < 100 ? '#34d399' : undefined }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">{percentIncomeUsed}% used</p>
          </motion.div>
        )}

        {/* AI Forecast Card */}
        {budget > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass p-4 border-l-4 ${projectedSpend > budget ? 'border-rose-500' : 'border-emerald-500'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-white">AI Forecast 🪄</span>
            </div>
            <p className="text-2xl font-heading font-bold text-white my-1">
              {formatCurrency(projectedSpend)}
            </p>
            <p className="text-xs text-slate-400">
              {projectedSpend > budget 
                ? <span className="text-rose-400">Warning: You will overspend by {formatCurrency(projectedSpend - budget)}</span>
                : <span className="text-emerald-400">Great! You are on track to save {formatCurrency(budget - projectedSpend)}</span>
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-400/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm text-slate-400">Total This Month</span>
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold gradient-text">
            <CountUp end={totalThisMonth} prefix="₹" />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Total Income</span>
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-white">
            <CountUp end={totalMonthlyIncome} prefix="₹" />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Expenses</span>
          </div>
          <p className="text-2xl md:text-3xl font-heading font-bold text-white">
            <CountUp end={expenseCount} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">Highest Category</span>
          </div>
          {highestCategory ? (
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryInfo(highestCategory.name).emoji}</span>
              <p className="text-lg font-heading font-semibold text-white">{highestCategory.name}</p>
            </div>
          ) : (
            <p className="text-lg text-slate-400">—</p>
          )}
        </motion.div>
      </div>

      {/* Wealth & Debts Overview */}
      {(totalLent > 0 || totalBorrowed > 0 || totalSavings > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {totalSavings > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-5 border-l-4 border-emerald-400"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-white">Savings Account 🐷</span>
              </div>
              <p className="text-2xl font-heading font-bold text-emerald-400">
                <CountUp end={totalSavings} prefix="₹" />
              </p>
              <p className="text-xs text-slate-400 mt-1">Total accumulated savings</p>
            </motion.div>
          )}

          {totalLent > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-5 border-l-4 border-cyan-500"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-white">Money You Lent Out</span>
              </div>
              <p className="text-2xl font-heading font-bold gradient-text">
                <CountUp end={totalLent} prefix="₹" />
              </p>
              <p className="text-xs text-slate-400 mt-1">Outstanding active credit</p>
            </motion.div>
          )}

          {totalBorrowed > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-5 border-l-4 border-rose-500"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-white">Money You Borrowed</span>
              </div>
              <p className="text-2xl font-heading font-bold text-rose-400">
                <CountUp end={totalBorrowed} prefix="₹" />
              </p>
              <p className="text-xs text-slate-400 mt-1">Outstanding active debt</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-5"
        >
          <h3 className="font-heading font-semibold text-white mb-4">Category Breakdown</h3>
          {categoryBreakdown.length > 0 ? (
            <div className="chart-container h-72 relative">
              <Doughnut data={donutData} options={donutOptions} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-20px' }}>
                <div className="text-center">
                  <p className="text-2xl font-heading font-bold gradient-text">{formatCurrency(totalThisMonth)}</p>
                  <p className="text-xs text-slate-400">this month</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400 text-sm">
              No data to display
            </div>
          )}
        </motion.div>

        {/* Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-5"
        >
          <h3 className="font-heading font-semibold text-white mb-4">Daily Spending Trend</h3>
          <div className="chart-container h-72">
            <Bar data={barData} options={barOptions} />
          </div>
        </motion.div>
      </div>

      {/* Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="font-heading font-semibold text-white mb-4">Recent Transactions</h3>
        {recentExpenses && recentExpenses.length > 0 ? (
          <div className="space-y-3">
            {recentExpenses.map((expense, i) => (
              <ExpenseCard key={expense._id} expense={expense} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass p-8 text-center">
            <p className="text-slate-400 text-sm">No transactions yet</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
