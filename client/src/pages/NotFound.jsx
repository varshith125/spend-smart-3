import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-gradient-mesh min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="font-heading text-6xl font-bold gradient-text mb-4">404</h1>
        <h2 className="font-heading text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
          Looks like this page went on a spending spree and never came back. Let's get you home!
        </p>
        <Link
          to="/dashboard"
          className="btn-gradient inline-flex items-center gap-2 px-6 py-3"
        >
          <Home className="w-5 h-5" />
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
