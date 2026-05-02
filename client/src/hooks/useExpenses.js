import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = '/api/expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setExpenses(res.data);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/summary`);
      setSummary(res.data);
    } catch (err) {
      console.error('Fetch summary error:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch summary');
      setSummary({
        totalThisMonth: 0,
        totalMonthlyIncome: 0,
        expenseCount: 0,
        incomeCount: 0,
        highestCategory: null,
        categoryBreakdown: [],
        dailyTotals: Array(30).fill(0),
        budget: 0,
        spent: 0,
        percentUsed: 0,
        percentIncomeUsed: 0,
        recentExpenses: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = useCallback(async (data) => {
    try {
      const res = await axios.post(API, data);
      setExpenses((prev) => [res.data, ...prev]);
      toast.success('Transaction added! 🎉');
      return res.data;
    } catch (err) {
      console.error('Add transaction error:', err);
      toast.error(err.response?.data?.message || 'Failed to add transaction');
      throw err;
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      toast.success('Transaction deleted');
    } catch (err) {
      console.error('Delete transaction error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete transaction');
    }
  }, []);

  const deleteAllExpenses = useCallback(async () => {
    try {
      await axios.delete(API);
      setExpenses([]);
      toast.success('All expenses cleared');
    } catch (err) {
      console.error('Delete all error:', err);
      toast.error(err.response?.data?.message || 'Failed to clear expenses');
    }
  }, []);


  return {
    expenses,
    summary,
    loading,
    fetchExpenses,
    fetchSummary,
    addExpense,
    deleteExpense,
    deleteAllExpenses,
  };
}
