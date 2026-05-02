import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = '/api/credit-cards';

export function useCreditCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setCards(res.data);
    } catch {
      toast.error('Failed to load credit cards');
    } finally {
      setLoading(false);
    }
  }, []);

  const addCard = useCallback(async (data) => {
    try {
      const res = await axios.post(API, data);
      setCards(prev => [res.data, ...prev]);
      toast.success('Card added! 💳');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add card');
      return { success: false };
    }
  }, []);

  const addTransaction = useCallback(async (cardId, data) => {
    try {
      const res = await axios.post(`${API}/${cardId}/transactions`, data);
      setCards(prev => prev.map(c => c._id === cardId ? res.data : c));
      toast.success(data.type === 'charge' ? 'Charge recorded! 📝' : 'Payment recorded! ✅');
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log transaction');
      return { success: false };
    }
  }, []);

  const deleteTransaction = useCallback(async (cardId, txId) => {
    try {
      const res = await axios.delete(`${API}/${cardId}/transactions/${txId}`);
      setCards(prev => prev.map(c => c._id === cardId ? res.data : c));
      toast.success('Transaction removed');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, []);

  const deleteCard = useCallback(async (cardId) => {
    try {
      await axios.delete(`${API}/${cardId}`);
      setCards(prev => prev.filter(c => c._id !== cardId));
      toast.success('Card removed');
    } catch {
      toast.error('Failed to delete card');
    }
  }, []);

  return { cards, loading, fetchCards, addCard, addTransaction, deleteTransaction, deleteCard };
}
