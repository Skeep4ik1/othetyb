import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  Shield, 
  Download, 
  RotateCcw, 
  Crown
} from 'lucide-react';
import { User, Report, ActiveTab } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SUPER_ADMIN_ID, exportReportsToCSV } from '../utils/storage';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  reports: Report[];
  onResetSeedData: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  isAdmin?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  reports,
  onResetSeedData,
  showToast,
  onNavigateTab,
  isAdmin = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const isSuper = currentUser.staticId === SUPER_ADMIN_ID;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/85 backdrop-blur-md">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative z-10 bg-[#121212] border-t border-zinc-800 rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6"
        >
          {/* Drag Handle */}
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto -mt-2 mb-2" />

          {/* User Profile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg shadow-md overflow-hidden shrink-0 border border-white">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.nickname} className="w-full h-full object-cover" />
                ) : (
                  currentUser.nickname.charAt(0)
                )}
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight font-['Syne']">
                  {currentUser.nickname}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Static ID: #{currentUser.staticId} · DS: {currentUser.discord}
                </p>
                <div className="mt-1">
                  {isSuper ? (
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                      ★ Куратор
                    </span>
                  ) : isAdmin ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50">
                      ★ Начальник
                    </span>
                  ) : currentUser.role === 'senior_instructor' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50">
                      ★ Зам. начальника
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/50">
                      Инструктор отдела
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full bg-black border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links in Drawer */}
          {onNavigateTab && (
            <div className="space-y-2 pt-1 font-mono">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Быстрый переход
              </div>

              <button
                onClick={() => {
                  onNavigateTab('history');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-200 hover:text-white"
              >
                <span className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-white" />
                  <span>Мой профиль и история рапортов</span>
                </span>
                <span className="text-zinc-500">→</span>
              </button>
              
              <button
                onClick={() => {
                  onNavigateTab('instructors');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-200 hover:text-white"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-white">👥</span>
                  <span>Реестр инструкторов (Состав)</span>
                </span>
                <span className="text-zinc-500">→</span>
              </button>

              <button
                onClick={() => {
                  onNavigateTab('archive');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-200 hover:text-white"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-white">📁</span>
                  <span>Архив еженедельных отчётов</span>
                </span>
                <span className="text-zinc-500">→</span>
              </button>

              <button
                onClick={() => {
                  onNavigateTab('info');
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-200 hover:text-white"
              >
                <span className="flex items-center space-x-2">
                  <span className="text-white">ℹ️</span>
                  <span>Информация и справочник</span>
                </span>
                <span className="text-zinc-500">→</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    onNavigateTab('admin');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-900"
                >
                  <span className="flex items-center space-x-2">
                    <span>🛡️</span>
                    <span>Штабная панель руководства</span>
                  </span>
                  <span className="text-white">→</span>
                </button>
              )}
            </div>
          )}

          {/* Quick theme switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black border border-zinc-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white">
                {isDark ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-zinc-300" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-white font-mono">
                  Тёмная тема
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  Tactical Black & White Ops
                </div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-mono cursor-pointer"
            >
              {isDark ? 'Светлая' : 'Тёмная'}
            </button>
          </div>

          {/* Quick Actions: Export & Reset */}
          <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
            <button
              onClick={() => {
                exportReportsToCSV(reports);
                showToast('Отчёты экспортированы в CSV файл');
              }}
              className="flex items-center justify-center space-x-2 p-3 rounded-2xl text-xs font-semibold bg-black border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Экспорт CSV</span>
            </button>

            <button
              onClick={() => {
                onResetSeedData();
                showToast('Данные успешно сброшены');
                onClose();
              }}
              className="flex items-center justify-center space-x-2 p-3 rounded-2xl text-xs font-semibold bg-black border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Сброс данных</span>
            </button>
          </div>

          {/* Logout button */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center space-x-2 p-3.5 rounded-2xl text-xs font-bold text-white bg-black border border-zinc-700 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Завершить смену / Выйти</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
