import { useEffect, useReducer, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  PiggyBank,
  Wallet,
  Receipt,
  BarChart3,
  Download,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { getCategoryInfo } from '../utils/categoryColors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

async function fetchMonthlyReport(month, year) {
  const res = await axios.get(`/api/expenses/monthly-report`, { params: { month, year } });
  return res.data;
}

function StatCard({ title, value, subtitle, icon: Icon, color, delay = 0, badge, badgeColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass p-5 border-l-4 ${color}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-400">{title}</span>
        </div>
        {badge !== null && badge !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-heading font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function reportReducer(state, action) {
  switch (action.type) {
    case 'loading':
      return { report: null, loading: true, error: null };
    case 'success':
      return { report: action.payload, loading: false, error: null };
    case 'error':
      return { report: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [{ report, loading, error }, dispatch] = useReducer(reportReducer, {
    report: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'loading' });
    fetchMonthlyReport(month, year)
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'success', payload: data });
        }
      })
      .catch((err) => {
        console.error('Report error:', err?.response?.data || err.message);
        if (!cancelled) {
          dispatch({
            type: 'error',
            payload: err?.response?.data?.message || 'Failed to load report',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [month, year]);

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goForward = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
  const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  const generatePDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const monthLabel = `${MONTH_NAMES[report.month]} ${report.year}`;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(139, 92, 246);
    doc.text('SpendSmart', 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(30, 30, 60);
    doc.text(`Monthly Financial Report — ${monthLabel}`, 14, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 14, 37);

    // Summary table
    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Amount']],
      body: [
        ['Total Income', `Rs. ${report.totalIncome.toLocaleString('en-IN')}`],
        ['Total Spent', `Rs. ${report.totalSpent.toLocaleString('en-IN')}`],
        ['Total Saved', `Rs. ${report.totalSaved.toLocaleString('en-IN')}`],
        ['Net Balance', `Rs. ${report.netBalance.toLocaleString('en-IN')} (${report.netBalance >= 0 ? 'Surplus' : 'Deficit'})`],
        ['Budget Used', `${report.percentUsed}% of Rs. ${(report.budget || 0).toLocaleString('en-IN')}`],
        ['Spending vs Last Month', report.spendingChange != null ? `${report.spendingChange > 0 ? '+' : ''}${report.spendingChange}%` : 'N/A'],
      ],
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: { 1: { halign: 'right' } },
    });

    // Category breakdown
    if (report.categoryBreakdown.length > 0) {
      const lastY = doc.lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 60);
      doc.text('Category Breakdown', 14, lastY);

      autoTable(doc, {
        startY: lastY + 5,
        head: [['Category', 'Amount (Rs.)', 'Share %']],
        body: report.categoryBreakdown.map(c => [
          c.name,
          c.total.toLocaleString('en-IN'),
          `${c.percent}%`,
        ]),
        headStyles: { fillColor: [99, 102, 241] },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
      });
    }

    // Strategy note
    const finalY = doc.lastAutoTable.finalY + 14;
    doc.setDrawColor(139, 92, 246);
    doc.setLineWidth(0.5);
    doc.line(14, finalY - 4, 196, finalY - 4);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100);
    const advice = report.netBalance >= 0
      ? `Great month! You had a surplus of Rs. ${Math.abs(report.netBalance).toLocaleString('en-IN')}. Keep the discipline!`
      : `You overspent by Rs. ${Math.abs(report.netBalance).toLocaleString('en-IN')} this month. Review your top categories.`;
    doc.text(advice, 14, finalY + 3, { maxWidth: 180 });

    doc.save(`SpendSmart_Report_${monthLabel.replace(' ', '_')}.pdf`);
  };

  const spendDelta = report?.spendingChange;
  const deltaLabel = spendDelta == null
    ? 'No previous data'
    : spendDelta === 0
      ? 'Same as last month'
      : spendDelta > 0
        ? `↑ ${spendDelta}% vs last month`
        : `↓ ${Math.abs(spendDelta)}% vs last month`;
  const deltaColor = spendDelta == null || spendDelta === 0
    ? 'text-slate-400 bg-slate-400/10'
    : spendDelta > 0
      ? 'text-rose-400 bg-rose-400/10'
      : 'text-emerald-400 bg-emerald-400/10';

  // Donut chart
  const donutData = report?.categoryBreakdown?.length > 0 ? {
    labels: report.categoryBreakdown.map(c => c.name),
    datasets: [{
      data: report.categoryBreakdown.map(c => c.total),
      backgroundColor: report.categoryBreakdown.map(c => getCategoryInfo(c.name).color),
      borderColor: 'rgba(0,0,0,0.3)',
      borderWidth: 2,
    }],
  } : null;

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', padding: 14, usePointStyle: true, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        callbacks: {
          label: (ctx) => {
            const pct = report.categoryBreakdown[ctx.dataIndex]?.percent || 0;
            return ` ${formatCurrency(ctx.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  const barData = report ? {
    labels: report.dailyTotals.map((_, i) => i + 1),
    datasets: [{
      label: 'Daily Spend',
      data: report.dailyTotals,
      backgroundColor: 'rgba(139, 92, 246, 0.6)',
      hoverBackgroundColor: 'rgba(139, 92, 246, 0.9)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  } : null;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,12,41,0.9)',
        callbacks: {
          title: (items) => `Day ${items[0].label}`,
          label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
      y: {
        ticks: { color: '#64748b', font: { size: 10 }, callback: v => `₹${v.toLocaleString('en-IN')}` },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-7 h-7 text-violet-400" />
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">Monthly Reports</h1>
          </div>
          {report && (
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition shadow shadow-violet-500/30"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </div>
        <p className="text-slate-400">Track your financial progress month by month — like a pro.</p>
      </div>

      {/* Month Navigator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 flex items-center justify-between mb-6"
      >
        <button
          onClick={goBack}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="font-heading text-xl font-bold text-white">
            {MONTH_NAMES[month]} {year}
          </h2>
          {isCurrentMonth && (
            <span className="text-xs text-violet-400 font-medium">Current Month</span>
          )}
          {isFuture && (
            <span className="text-xs text-amber-400 font-medium">Future Month</span>
          )}
        </div>

        <button
          onClick={goForward}
          disabled={isCurrentMonth}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 text-center text-slate-400">
            {error}
          </motion.div>
        ) : !report ? null : (
          <motion.div key={`${month}-${year}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Spent"
                value={formatCurrency(report.totalSpent)}
                subtitle={`${report.transactionCount} transactions`}
                icon={Receipt}
                color="border-rose-500"
                delay={0}
                badge={spendDelta != null ? (spendDelta > 0 ? `+${spendDelta}%` : `${spendDelta}%`) : null}
                badgeColor={deltaColor}
              />
              <StatCard
                title="Total Income"
                value={formatCurrency(report.totalIncome)}
                subtitle="Salary + ad-hoc"
                icon={TrendingUp}
                color="border-emerald-500"
                delay={0.05}
              />
              <StatCard
                title="Saved"
                value={formatCurrency(report.totalSaved)}
                subtitle="Moved to savings"
                icon={PiggyBank}
                color="border-cyan-500"
                delay={0.1}
              />
              <StatCard
                title="Net Balance"
                value={formatCurrency(Math.abs(report.netBalance))}
                subtitle={report.netBalance >= 0 ? 'Surplus 🎉' : 'Deficit ⚠️'}
                icon={Wallet}
                color={report.netBalance >= 0 ? 'border-violet-500' : 'border-amber-500'}
                delay={0.15}
              />
            </div>

            {/* Budget Progress */}
            {report.budget > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-5 mb-6"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-white">Budget Utilization</span>
                  <span className="text-sm text-slate-300">
                    {formatCurrency(report.totalSpent)} / {formatCurrency(report.budget)}
                  </span>
                </div>
                <div className="budget-bar mb-2">
                  <div
                    className={`budget-bar-fill ${report.percentUsed >= 100 ? 'danger' : report.percentUsed >= 80 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(report.percentUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${report.percentUsed >= 100 ? 'text-rose-400' : report.percentUsed >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {report.percentUsed}% used
                  </span>
                  {spendDelta != null && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${spendDelta < 0 ? 'text-emerald-400' : spendDelta > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {spendDelta < 0 ? <TrendingDown className="w-3 h-3" /> : spendDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {deltaLabel}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Donut */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass p-5"
              >
                <h3 className="font-heading font-semibold text-white mb-4">Spending by Category</h3>
                {donutData ? (
                  <div className="chart-container h-64 relative">
                    <Doughnut data={donutData} options={donutOptions} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-20px' }}>
                      <div className="text-center">
                        <p className="text-xl font-heading font-bold gradient-text">{formatCurrency(report.totalSpent)}</p>
                        <p className="text-xs text-slate-400">spent</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                    No expense data for this month
                  </div>
                )}
              </motion.div>

              {/* Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-5"
              >
                <h3 className="font-heading font-semibold text-white mb-4">Daily Spending Pattern</h3>
                <div className="chart-container h-64">
                  {barData && report.dailyTotals.some(v => v > 0) ? (
                    <Bar data={barData} options={barOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                      No spending data for this month
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Category Breakdown Table */}
            {report.categoryBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass p-5 mb-6"
              >
                <h3 className="font-heading font-semibold text-white mb-4">Category Details</h3>
                <div className="space-y-3">
                  {report.categoryBreakdown.map((cat, i) => {
                    const info = getCategoryInfo(cat.name);
                    return (
                      <motion.div
                        key={cat.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.04 }}
                        className="flex items-center gap-4"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${info.bgClass} shrink-0`}>
                          <span className="text-base">{info.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-white">{cat.name}</span>
                            <span className="text-sm font-bold text-white">{formatCurrency(cat.total)}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${cat.percent}%`, backgroundColor: info.color }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right shrink-0">{cat.percent}%</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Strategy Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass p-5 border border-violet-500/20"
            >
              <h3 className="font-heading font-semibold text-white mb-4">📊 Month Summary & Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Savings Rate */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Savings Rate</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {report.totalIncome > 0
                      ? `${Math.round((report.totalSaved / report.totalIncome) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">of income saved</p>
                </div>
                {/* Spend Rate */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Expense Ratio</p>
                  <p className={`text-xl font-bold ${report.totalIncome > 0 && (report.totalSpent / report.totalIncome) < 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {report.totalIncome > 0
                      ? `${Math.round((report.totalSpent / report.totalIncome) * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">of income spent</p>
                </div>
                {/* Top Category */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Highest Category</p>
                  {report.categoryBreakdown[0] ? (
                    <>
                      <p className="text-xl font-bold text-white flex items-center gap-2">
                        <span>{getCategoryInfo(report.categoryBreakdown[0].name).emoji}</span>
                        <span className="truncate text-base">{report.categoryBreakdown[0].name}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{formatCurrency(report.categoryBreakdown[0].total)} spent</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-slate-500">—</p>
                  )}
                </div>
              </div>

              {/* Strategy advice */}
              <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <p className="text-sm text-slate-300">
                  {report.netBalance >= 0
                    ? report.totalSaved > 0
                      ? `✅ Great month! You saved ${formatCurrency(report.totalSaved)} and ended with a ₹${Math.abs(report.netBalance).toLocaleString('en-IN')} surplus. Keep up the discipline.`
                      : `👍 You stayed in the green this month with a ${formatCurrency(report.netBalance)} surplus. Consider setting up an auto-save for next month!`
                    : `⚠️ You overspent by ${formatCurrency(Math.abs(report.netBalance))} this month. ${report.categoryBreakdown[0] ? `Your biggest category was ${report.categoryBreakdown[0].name} — look for ways to reduce it.` : 'Review your categories for savings opportunities.'}`
                  }
                </p>
              </div>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
