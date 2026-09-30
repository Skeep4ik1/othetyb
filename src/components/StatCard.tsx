import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  subtitle?: string;
  colorClass: string;
  bgLightClass?: string;
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  colorClass,
  trend,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl p-5 md:p-6 transition-all duration-300
        bg-[#121212] 
        border border-zinc-800 hover:border-zinc-700
        shadow-sm hover:shadow-md
        ${onClick ? 'cursor-pointer hover:border-white' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl flex items-center justify-center bg-black border border-zinc-700 text-white">
            <Icon className="w-5 h-5 stroke-white" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-semibold text-zinc-400">
              {title}
            </p>
            <div className="flex items-baseline space-x-2 mt-0.5 font-mono">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-white tabular-nums">
                {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
              </span>
              {trend && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-white border border-zinc-700">
                  {trend}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-xs text-zinc-400 border-t border-zinc-800 pt-2.5 font-mono">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
