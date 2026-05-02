import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter, Download } from 'lucide-react';
import { useExpenses } from '../hooks/useExpenses';
import ExpenseCard from '../components/ExpenseCard';
import CategoryBadge from '../components/CategoryBadge';
import { categories } from '../utils/categoryColors';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const dateRanges = [
  { label: 'All Time', value: 'all' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

export default function History() {
  const { expenses, loading, fetchExpenses, deleteExpense } = useExpenses();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dateRange, setDateRange] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Delete this expense?</span>
        <button
          onClick={() => {
            deleteExpense(id);
            toast.dismiss(t.id);
          }}
          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
        >
          Delete
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    ), { duration: 5000 });
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setDateRange('all');
    setCustomFrom('');
    setCustomTo('');
  };

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          ((e.note || '').toLowerCase().includes(q)) ||
          ((e.category || '').toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((e) => selectedCategories.includes(e.category));
    }

    // Date range
    const now = new Date();
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      result = result.filter((e) => new Date(e.date) >= weekAgo);
    } else if (dateRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter((e) => new Date(e.date) >= startOfMonth);
    } else if (dateRange === 'custom') {
      if (customFrom) result = result.filter((e) => new Date(e.date) >= new Date(customFrom));
      if (customTo) {
        const to = new Date(customTo);
        to.setHours(23, 59, 59);
        result = result.filter((e) => new Date(e.date) <= to);
      }
    }

    return result;
  }, [expenses, search, selectedCategories, dateRange, customFrom, customTo]);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica');

    doc.setFontSize(20);
    doc.text('SpendSmart Transactions', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    doc.text(`Total Records: ${filteredExpenses.length}`, 14, 36);

    const tableColumn = ["Date", "Type", "Category", "Amount", "Note"];
    const tableRows = [];

    // Reverse to print oldest first or keep sorted from backend (which is newest first)
    filteredExpenses.forEach(exp => {
      const rowData = [
        format(new Date(exp.date), 'MMM dd, yyyy'),
        exp.type === 'income' ? 'Income' : 'Expense',
        exp.category,
        `Rs. ${exp.amount.toLocaleString('en-IN')}`,
        exp.note || '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }, // Violet-500
      styles: { fontSize: 10, cellPadding: 3 },
    });

    const fileName = `SpendSmart_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    toast.success('PDF Statement downloaded!');
  };

  const hasActiveFilters = search || selectedCategories.length > 0 || dateRange !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
          Expense History
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition bg-violet-600/50 hover:bg-violet-500 text-white shadow shadow-violet-500/20"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Export PDF</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
              showFilters ? 'bg-violet-400/20 text-violet-400' : 'bg-white/5 text-slate-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block space-y-4 mb-6`}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by note or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-10"
          />
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap gap-2">
          {dateRanges.map((dr) => (
            <button
              key={dr.value}
              onClick={() => setDateRange(dr.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                dateRange === dr.value
                  ? 'bg-violet-400/20 text-violet-400 border border-violet-400/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        {dateRange === 'custom' && (
          <div className="flex gap-3">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="glass-input flex-1"
              placeholder="From"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="glass-input flex-1"
              placeholder="To"
            />
          </div>
        )}

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <CategoryBadge
              key={cat.name}
              category={cat.name}
              size="sm"
              selected={selectedCategories.includes(cat.name)}
              onClick={toggleCategory}
            />
          ))}
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-400/10 text-violet-400 text-xs">
                "{search}"
                <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedCategories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-400/10 text-violet-400 text-xs">
                {c}
                <button onClick={() => toggleCategory(c)}><X className="w-3 h-3" /></button>
              </span>
            ))}
            {dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-400/10 text-violet-400 text-xs">
                {dateRanges.find((d) => d.value === dateRange)?.label}
                <button onClick={() => setDateRange('all')}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 ml-2">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : filteredExpenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">📋</div>
          <h3 className="font-heading text-xl font-semibold text-white mb-2">
            {expenses.length === 0 ? 'No expenses yet' : 'No matching expenses'}
          </h3>
          <p className="text-slate-400 text-sm">
            {expenses.length === 0
              ? 'Start tracking your expenses to see them here!'
              : 'Try adjusting your filters'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense, i) => (
            <ExpenseCard
              key={expense._id}
              expense={expense}
              index={i}
              onDelete={handleDelete}
            />
          ))}
          <p className="text-center text-slate-500 text-xs pt-4">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </p>
        </div>
      )}
    </motion.div>
  );
}
