const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// POST /api/expenses — create expense
router.post(
  '/',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category').notEmpty().withMessage('Category is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { amount, category, type, note, date, isRecurring } = req.body;

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([{
          userId: req.userId,
          amount,
          type: type || 'expense',
          category,
          note: note || '',
          isRecurring: isRecurring || false,
          date: date || new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(expense);
    } catch (err) {
      console.error('Create expense error:', err);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// GET /api/expenses/summary — aggregated dashboard data
router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('monthlyBudget, yearlyIncome')
      .eq('id', req.userId)
      .single();

    // This month's transactions
    const { data: monthTransactions, error: txError } = await supabase
      .from('expenses')
      .select('*')
      .eq('userId', req.userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (txError) throw txError;

    const monthExpenses = monthTransactions.filter((t) => t.type !== 'income');
    const monthIncomes = monthTransactions.filter((t) => t.type === 'income');

    const totalThisMonth = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    let adHocIncome = monthIncomes.reduce((sum, e) => sum + Number(e.amount), 0);

    // Month loans
    const { data: monthLoans, error: mlError } = await supabase
      .from('loans')
      .select('*')
      .eq('userId', req.userId)
      .eq('type', 'Borrowed')
      .gte('startDate', startOfMonth)
      .lte('startDate', endOfMonth);

    if (mlError) throw mlError;

    const borrowedIncome = monthLoans.reduce((sum, l) => sum + Number(l.principalAmount), 0);
    adHocIncome += borrowedIncome;

    // AutoSave Loans
    const { data: autoSaveLoans, error: alError } = await supabase
      .from('loans')
      .select('*')
      .eq('userId', req.userId)
      .eq('type', 'AutoSave')
      .eq('status', 'Active');

    if (alError) throw alError;

    let autoSaveThisMonth = 0;
    let totalAutoSavedAllTime = 0;

    autoSaveLoans.forEach(loan => {
      const startDate = new Date(loan.startDate);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();

      let monthsPassed = (nowYear - startYear) * 12 + (nowMonth - startMonth);
      if (now.getDate() >= loan.paymentDay) {
        monthsPassed++;
      }
      
      if (monthsPassed > loan.durationMonths) monthsPassed = loan.durationMonths;
      if (monthsPassed < 0) monthsPassed = 0;

      totalAutoSavedAllTime += (monthsPassed * Number(loan.monthlyEMI));

      const loanEndDT = new Date(startDate);
      loanEndDT.setMonth(loanEndDT.getMonth() + loan.durationMonths);
      if (now <= loanEndDT || (nowYear === loanEndDT.getFullYear() && nowMonth === loanEndDT.getMonth())) {
        autoSaveThisMonth += Number(loan.monthlyEMI);
      }
    });

    const baseMonthlyIncome = (Number(user?.yearlyIncome) || 0) / 12;
    const totalMonthlyIncome = baseMonthlyIncome + adHocIncome;
    const totalOutflowThisMonth = totalThisMonth + autoSaveThisMonth;

    // Category breakdown
    const categoryMap = {};
    monthExpenses.forEach((e) => {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = 0;
      }
      categoryMap[e.category] += Number(e.amount);
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100,
        percent: totalThisMonth > 0 ? Math.round((total / totalThisMonth) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyTotals = Array(daysInMonth).fill(0);
    monthExpenses.forEach((e) => {
      const day = new Date(e.date).getDate();
      dailyTotals[day - 1] += Number(e.amount);
    });

    const budget = Number(user?.monthlyBudget) || 0;
    const percentUsed = budget > 0 ? Math.round((totalOutflowThisMonth / budget) * 100) : 0;
    const percentIncomeUsed = totalMonthlyIncome > 0 ? Math.round((totalOutflowThisMonth / totalMonthlyIncome) * 100) : 0;

    // Recent 5 transactions
    const { data: recentExpenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('userId', req.userId)
      .order('date', { ascending: false })
      .limit(5);

    // All-time savings
    const { data: allSavingsArr } = await supabase
      .from('expenses')
      .select('amount')
      .eq('userId', req.userId)
      .eq('category', 'Savings');

    let totalSavings = allSavingsArr.reduce((sum, e) => sum + Number(e.amount), 0);
    totalSavings += totalAutoSavedAllTime;

    res.json({
      totalThisMonth: Math.round(totalOutflowThisMonth * 100) / 100,
      totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      expenseCount: monthExpenses.length,
      incomeCount: monthIncomes.length,
      highestCategory,
      categoryBreakdown,
      dailyTotals: dailyTotals.map((v) => Math.round(v * 100) / 100),
      budget,
      spent: Math.round(totalThisMonth * 100) / 100,
      percentUsed,
      percentIncomeUsed,
      recentExpenses: recentExpenses || [],
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/expenses/monthly-report
router.get('/monthly-report', async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month ?? now.getMonth()); 
    const year = parseInt(req.query.year ?? now.getFullYear());

    if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 1970) {
      return res.status(400).json({ message: 'Invalid month or year.' });
    }

    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const startOfPrev = new Date(prevYear, prevMonth, 1).toISOString();
    const endOfPrev = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59).toISOString();

    const { data: user } = await supabase
      .from('users')
      .select('monthlyBudget, yearlyIncome')
      .eq('id', req.userId)
      .single();

    const { data: monthTransactions } = await supabase
      .from('expenses')
      .select('*')
      .eq('userId', req.userId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    const { data: prevTransactions } = await supabase
      .from('expenses')
      .select('*')
      .eq('userId', req.userId)
      .gte('date', startOfPrev)
      .lte('date', endOfPrev);

    const monthExpenses = monthTransactions.filter(t => t.type !== 'income');
    const monthIncomes = monthTransactions.filter(t => t.type === 'income');
    const monthSavings = monthTransactions.filter(t => t.category === 'Savings');

    const prevExpenses = prevTransactions.filter(t => t.type !== 'income');

    const totalSpent = monthExpenses.filter(e => e.category !== 'Savings').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalIncome = monthIncomes.reduce((sum, e) => sum + Number(e.amount), 0) + (Number(user?.yearlyIncome) || 0) / 12;
    const totalSaved = monthSavings.reduce((sum, e) => sum + Number(e.amount), 0);
    const prevTotalSpent = prevExpenses.filter(e => e.category !== 'Savings').reduce((sum, e) => sum + Number(e.amount), 0);

    const categoryMap = {};
    monthExpenses.filter(e => e.category !== 'Savings').forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
    });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100,
        percent: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyTotals = Array(daysInMonth).fill(0);
    monthExpenses.filter(e => e.category !== 'Savings').forEach(e => {
      const day = new Date(e.date).getDate();
      dailyTotals[day - 1] += Number(e.amount);
    });

    const spendingChange = prevTotalSpent > 0
      ? Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100)
      : null;

    const budget = Number(user?.monthlyBudget) || 0;
    const percentUsed = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
    const netBalance = totalIncome - totalSpent - totalSaved;

    res.json({
      month,
      year,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalSaved: Math.round(totalSaved * 100) / 100,
      netBalance: Math.round(netBalance * 100) / 100,
      budget,
      percentUsed,
      spendingChange,
      prevTotalSpent: Math.round(prevTotalSpent * 100) / 100,
      categoryBreakdown,
      dailyTotals: dailyTotals.map(v => Math.round(v * 100) / 100),
      transactionCount: monthExpenses.length + monthIncomes.length,
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('userId', req.userId)
      .order('date', { ascending: false });
    res.json(expenses || []);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense id.' });
    }

    const { data: expense } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', req.params.id)
      .eq('userId', req.userId)
      .single();

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    await supabase.from('expenses').delete().eq('id', req.params.id);
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/expenses
router.delete('/', async (req, res) => {
  try {
    await supabase.from('expenses').delete().eq('userId', req.userId);
    res.json({ message: 'All expenses deleted.' });
  } catch (err) {
    console.error('Delete all expenses error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
