import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const getHeaders = useCallback(() => {
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  }, [token]);

  const fetchLoans = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/loans', getHeaders());
      setLoans(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch loans');
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders]);

  const addLoan = async (loanData) => {
    try {
      const res = await axios.post('/api/loans', loanData, getHeaders());
      setLoans((prev) => [res.data, ...prev]);
      toast.success(`${loanData.type === 'Lent' ? 'Lent amount' : 'Borrowing'} added!`);
      return { success: true, data: res.data };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add loan');
      return { success: false, error: err.response?.data?.message };
    }
  };

  const updateLoanStatus = async (id, status) => {
    try {
      const res = await axios.put(`/api/loans/${id}`, { status }, getHeaders());
      setLoans((prev) => prev.map((loan) => (loan._id === id ? res.data : loan)));
      toast.success('Loan status updated!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update loan');
      return { success: false };
    }
  };

  const deleteLoan = async (id) => {
    try {
      await axios.delete(`/api/loans/${id}`, getHeaders());
      setLoans((prev) => prev.filter((loan) => loan._id !== id));
      toast.success('Loan record deleted!');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete loan');
      return { success: false };
    }
  };

  return {
    loans,
    loading,
    error,
    fetchLoans,
    addLoan,
    updateLoanStatus,
    deleteLoan,
  };
};
