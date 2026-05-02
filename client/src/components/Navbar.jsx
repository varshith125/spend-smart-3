import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  ScrollText,
  Lightbulb,
  Settings,
  Plus,
  Repeat,
  MoreHorizontal,
  Landmark,
  CreditCard,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/subscriptions', label: 'Bills', icon: Repeat },
  { path: '/add-expense', label: '', icon: Plus, isFab: true },
  { path: '/history', label: 'History', icon: ScrollText },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
];

const moreItems = [
  { path: '/loans', label: 'Loans', icon: Landmark },
  { path: '/credit-cards', label: 'Cards', icon: CreditCard },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => item.path === location.pathname);

  return (
    <>
      <AnimatePresence>
        {showMore && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
              aria-label="Close more navigation"
            />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="fixed left-3 right-3 bottom-20 md:hidden glass-static border border-white/10 rounded-2xl p-3 z-50"
            >
              <div className="grid grid-cols-2 gap-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        isActive
                          ? 'bg-violet-400/15 text-violet-400'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-static border-t border-white/10 z-50 px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.isFab) {
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setShowMore(false);
                    navigate(item.path);
                  }}
                  className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white transition-transform active:scale-90"
                >
                  <Icon className="w-7 h-7" />
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowMore(false)}
                className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                  isActive ? 'text-violet-400' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowMore((open) => !open)}
            className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
              isMoreActive || showMore ? 'text-violet-400' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
