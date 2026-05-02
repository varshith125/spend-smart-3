import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import InsightCard from '../components/InsightCard';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await axios.get('/api/insights');
        setInsights(res.data);
      } catch (err) {
        console.error('Fetch insights error:', err);
        toast.error('Failed to load insights');
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">
          Smart Insights
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          AI-powered analysis of your spending patterns
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="font-heading text-xl font-semibold text-white mb-2">
            No insights yet
          </h3>
          <p className="text-slate-400 text-sm">
            Add more expenses to unlock personalized financial insights!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
