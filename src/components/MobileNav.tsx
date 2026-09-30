import React from 'react';
import { motion } from 'motion/react';
import { 
  FileEdit, 
  History, 
  Users,
  BarChart3, 
  ShieldAlert, 
  Menu
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  myReportsCount: number;
  pendingReportsCount: number;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  myReportsCount,
  onOpenDrawer,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 pb-safe transition-colors">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {/* 1. New Report */}
        <button
          onClick={() => setActiveTab('new')}
          className={`flex flex-col items-center justify-center relative py-1 transition-colors ${
            activeTab === 'new'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
          }`}
        >
          {activeTab === 'new' && (
            <motion.div
              layoutId="mobile-active-pill"
              className="absolute top-1 w-8 h-1 bg-slate-900 dark:bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <FileEdit className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight font-mono">Сдать</span>
        </button>

        {/* 2. History */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center relative py-1 transition-colors ${
            activeTab === 'history'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
          }`}
        >
          {activeTab === 'history' && (
            <motion.div
              layoutId="mobile-active-pill"
              className="absolute top-1 w-8 h-1 bg-slate-900 dark:bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <div className="relative">
            <History className="w-5 h-5 mb-0.5" />
            {myReportsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 min-w-3.5 text-center font-mono">
                {myReportsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight font-mono">Отчёты</span>
        </button>

        {/* 3. Instructors */}
        <button
          onClick={() => setActiveTab('instructors')}
          className={`flex flex-col items-center justify-center relative py-1 transition-colors ${
            activeTab === 'instructors'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
          }`}
        >
          {activeTab === 'instructors' && (
            <motion.div
              layoutId="mobile-active-pill"
              className="absolute top-1 w-8 h-1 bg-slate-900 dark:bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight font-mono">Состав</span>
        </button>

        {/* 4. Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center relative py-1 transition-colors ${
            activeTab === 'analytics'
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300'
          }`}
        >
          {activeTab === 'analytics' && (
            <motion.div
              layoutId="mobile-active-pill"
              className="absolute top-1 w-8 h-1 bg-slate-900 dark:bg-white rounded-full shadow-xs"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight font-mono">Баллы</span>
        </button>

        {/* 5. Menu Drawer */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center py-1 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors relative"
        >
          {isAdmin && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-slate-900 dark:bg-white shadow-xs" />
          )}
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight font-mono">Меню</span>
        </button>
      </div>
    </div>
  );
};
