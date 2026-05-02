import { motion } from 'framer-motion';

const sentimentConfig = {
  good: { bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', glow: 'shadow-emerald-400/20', iconBg: 'bg-emerald-400/20' },
  warning: { bg: 'bg-amber-400/10', border: 'border-amber-400/30', glow: 'shadow-amber-400/20', iconBg: 'bg-amber-400/20' },
  danger: { bg: 'bg-red-400/10', border: 'border-red-400/30', glow: 'shadow-red-400/20', iconBg: 'bg-red-400/20' },
  info: { bg: 'bg-blue-400/10', border: 'border-blue-400/30', glow: 'shadow-blue-400/20', iconBg: 'bg-blue-400/20' },
};

export default function InsightCard({ insight, index = 0 }) {
  const config = sentimentConfig[insight.sentiment] || sentimentConfig.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`glass p-5 ${config.bg} border ${config.border}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${config.iconBg} shadow-lg ${config.glow}`}>
          {insight.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-white text-sm md:text-base">
            {insight.headline}
          </h3>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            {insight.detail}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
