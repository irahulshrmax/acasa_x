'use client';

import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { IconType } from 'react-icons';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  color?: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  className?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'bg-gradient-to-br from-blue-500 to-blue-600',
  trend, 
  trendLabel,
  subtitle,
  className = ''
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className={`bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${className}`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        <p className="text-2xl md:text-3xl font-semibold text-neutral-900 mt-1">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
        )}
        {trend !== undefined && trend !== 0 && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <FiArrowUp className="text-emerald-500" size={14} />
            ) : (
              <FiArrowDown className="text-red-500" size={14} />
            )}
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-neutral-400">
              {trendLabel || 'vs last month'}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} flex-shrink-0 ml-3`}>
        <Icon className="text-white" size={20} />
      </div>
    </div>
  </motion.div>
);