const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

// Initialize Gemini if key exists
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// GET /api/insights — generate smart insights
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setMilliseconds(-1);

    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();

    const [
      { data: monthExpensesData },
      { data: lastMonthExpensesData },
      { data: weekExpensesData },
      { data: lastWeekExpensesData },
      { data: allExpensesData },
      { data: recentExpensesData },
      { data: userData }
    ] = await Promise.all([
      supabase.from('expenses').select('*').eq('userId', req.userId).neq('type', 'income').gte('date', startOfMonth).lte('date', endOfMonth),
      supabase.from('expenses').select('*').eq('userId', req.userId).neq('type', 'income').gte('date', startOfLastMonth).lte('date', endOfLastMonth),
      supabase.from('expenses').select('*').eq('userId', req.userId).neq('type', 'income').gte('date', startOfWeek.toISOString()).lte('date', now.toISOString()),
      supabase.from('expenses').select('*').eq('userId', req.userId).neq('type', 'income').gte('date', startOfLastWeek.toISOString()).lte('date', endOfLastWeek.toISOString()),
      supabase.from('expenses').select('*').eq('userId', req.userId).order('date', { ascending: false }),
      supabase.from('expenses').select('*').eq('userId', req.userId).neq('type', 'income').gte('date', threeMonthsAgo),
      supabase.from('users').select('monthlyBudget, yearlyIncome, name').eq('id', req.userId).single()
    ]);

    const monthExpenses = monthExpensesData || [];
    const lastMonthExpenses = lastMonthExpensesData || [];
    const weekExpenses = weekExpensesData || [];
    const lastWeekExpenses = lastWeekExpensesData || [];
    const allExpenses = allExpensesData || [];
    const recentExpenses = recentExpensesData || [];
    const user = userData || {};

    const insights = [];
    const spendExpenses = (arr) => arr.filter(e => e.category !== 'Savings');

    // 1. Top spending category this month
    const catTotals = {};
    spendExpenses(monthExpenses).forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
    });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      insights.push({
        id: 'top-category',
        icon: '🏆',
        headline: `Top spend: ${topCat[0]}`,
        detail: `You've spent ₹${Math.round(topCat[1]).toLocaleString('en-IN')} on ${topCat[0]} this month.`,
        sentiment: 'info',
      });
    }

    // 2. vs Last month spend comparison
    const thisMonthTotal = spendExpenses(monthExpenses).reduce((s, e) => s + Number(e.amount), 0);
    const lastMonthTotal = spendExpenses(lastMonthExpenses).reduce((s, e) => s + Number(e.amount), 0);
    if (lastMonthTotal > 0) {
      const delta = Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100);
      insights.push({
        id: 'month-compare',
        icon: delta > 0 ? '📈' : '📉',
        headline: `${Math.abs(delta)}% ${delta > 0 ? 'more' : 'less'} spent vs last month`,
        detail: `This month: ₹${Math.round(thisMonthTotal).toLocaleString('en-IN')} vs last month: ₹${Math.round(lastMonthTotal).toLocaleString('en-IN')}.`,
        sentiment: delta > 20 ? 'danger' : delta > 0 ? 'warning' : 'good',
      });
    }

    // 3. Average daily spend
    const daysElapsed = Math.max(1, now.getDate());
    const avgDaily = Math.round(thisMonthTotal / daysElapsed);
    if (monthExpenses.length > 0) {
      insights.push({
        id: 'avg-daily',
        icon: '📊',
        headline: `Avg daily spend: ₹${avgDaily.toLocaleString('en-IN')}`,
        detail: `Based on ${daysElapsed} days of data. Projected month: ₹${(avgDaily * 30).toLocaleString('en-IN')}.`,
        sentiment: 'info',
      });
    }

    // 4. Budget health
    const budget = Number(user.monthlyBudget);
    if (budget > 0) {
      const pct = Math.round((thisMonthTotal / budget) * 100);
      insights.push({
        id: 'budget-health',
        icon: pct >= 100 ? '🚨' : pct >= 80 ? '⚠️' : '✅',
        headline: `Budget: ${pct}% used`,
        detail: pct >= 100 ? 'You are over budget!' : `₹${Math.round(budget - thisMonthTotal).toLocaleString('en-IN')} left.`,
        sentiment: pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'good',
      });
    }

    // 5. Logging streak
    if (allExpenses.length > 0) {
      let streak = 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() - i);
        const dayStr = checkDate.toISOString().split('T')[0];
        const hasEntry = allExpenses.some(e => new Date(e.date).toISOString().split('T')[0] === dayStr);
        if (hasEntry) streak++; else if (i > 0) break;
      }
      if (streak >= 3) {
        insights.push({
          id: 'streak', icon: '🔥', headline: `${streak}-day streak!`,
          detail: `You've tracked for ${streak} consecutive days. Keep it up!`, sentiment: 'good',
        });
      }
    }

    // --- GEMINI AI STRATEGY GENERATION ---
    if (genAI && monthExpenses.length > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const budgetStatus = budget ? `Budget: ₹${budget}. Spent: ₹${thisMonthTotal}.` : '';
        const categoryData = Object.entries(catTotals).map(([k, v]) => `${k}: ₹${v}`).join(', ');

        const prompt = `
          Acting as a professional financial advisor for ${user.name || 'the user'}.
          Analyze this month's spending: ${categoryData}.
          ${budgetStatus}
          Provide ONE concise, actionable smart strategy (max 2 sentences) to save money next month. 
          Focus on the highest category or the budget status.
          Be encouraging but direct. Do not use bold markdown.
        `;

        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text().trim();

        if (aiResponse) {
          insights.unshift({
            id: 'ai-strategy',
            icon: '✨',
            headline: 'Gemini Smart Strategy',
            detail: aiResponse,
            sentiment: 'good',
          });
        }
      } catch (aiErr) {
        console.error('Gemini Error:', aiErr.message);
      }
    }

    res.json(insights);
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
