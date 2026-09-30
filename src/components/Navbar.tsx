import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  FileText, 
  History, 
  Users, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronDown, 
  Menu,
  Camera,
  X,
  Check,
  Archive
} from 'lucide-react';
import { ActiveTab, User, Report } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SUPER_ADMIN_ID } from '../utils/storage';

interface NavbarProps {
  currentUser: User;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  myReportsCount: number;
  pendingReportsCount: number;
  onLogout: () => void;
  onSwitchUser?: (user: User) => void;
  onUpdateAvatar?: (url: string) => void;
  allReports?: Report[];
  onOpenMobileMenu: () => void;
  onlineUsers?: string[];
  users?: User[];
  onOpenProfileModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isAdmin,
  myReportsCount,
  onLogout,
  onUpdateAvatar,
  onOpenMobileMenu,
  onlineUsers = [],
  users = [],
  onOpenProfileModal,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState(currentUser.avatarUrl || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const isSuperAdmin = currentUser.staticId === SUPER_ADMIN_ID || currentUser.role === 'superadmin';

  // Find leadership online status
  const curators = users.filter((u) => u.role === 'superadmin' || u.staticId === SUPER_ADMIN_ID);
  const chiefs = users.filter((u) => u.role === 'admin' && u.staticId !== SUPER_ADMIN_ID);
  const deputyChiefs = users.filter((u) => u.role === 'senior_instructor');

  const onlineCurators = curators.filter((u) => onlineUsers.includes(u.staticId));
  const onlineChiefs = chiefs.filter((u) => onlineUsers.includes(u.staticId));
  const onlineDeputies = deputyChiefs.filter((u) => onlineUsers.includes(u.staticId));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Размер файла не должен превышать 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateAvatar) {
      onUpdateAvatar(newAvatarUrl.trim());
    }
    setIsAvatarModalOpen(false);
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left Brand Mark & Main Nav Links (Moved Left) */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button
              onClick={() => setActiveTab('new')}
              className="flex items-center space-x-2 sm:space-x-3 group text-left cursor-pointer focus:outline-none shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg shadow-black/5 dark:shadow-white/10 border border-slate-700 dark:border-zinc-200 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-5 h-5 fill-white dark:fill-black stroke-white dark:stroke-black stroke-1" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap">
                  <span className="font-['Unbounded'] font-extrabold text-xs md:text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors whitespace-nowrap">
                    УПРАВЛЕНИЕ «В»
                  </span>
                  <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-300 dark:border-zinc-700 uppercase tracking-widest shrink-0">
                    ФСБ
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium tracking-wide uppercase hidden sm:block font-mono whitespace-nowrap">
                  Еженедельные отчёты
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links - Positioned directly next to logo */}
            <nav className="hidden md:flex items-center space-x-1 shrink">
              <button
                onClick={() => setActiveTab('new')}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'new'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                {activeTab === 'new' && (
                  <motion.div
                    layoutId="desktop-tab-indicator"
                    className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl -z-10 shadow-inner"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <FileText className="w-4 h-4" />
                <span>Сдать рапорт</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'history'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                {activeTab === 'history' && (
                  <motion.div
                    layoutId="desktop-tab-indicator"
                    className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl -z-10 shadow-inner"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <History className="w-4 h-4" />
                <span>История рапортов</span>
                {myReportsCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700">
                    {myReportsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('instructors')}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'instructors'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                {activeTab === 'instructors' && (
                  <motion.div
                    layoutId="desktop-tab-indicator"
                    className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl -z-10 shadow-inner"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Users className="w-4 h-4" />
                <span>Состав</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                {activeTab === 'analytics' && (
                  <motion.div
                    layoutId="desktop-tab-indicator"
                    className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl -z-10 shadow-inner"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <BarChart3 className="w-4 h-4" />
                <span>Аналитика</span>
              </button>

              <button
                onClick={() => setActiveTab('archive')}
                className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'archive'
                    ? 'text-slate-900 dark:text-white font-bold'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                {activeTab === 'archive' && (
                  <motion.div
                    layoutId="desktop-tab-indicator"
                    className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl -z-10 shadow-inner"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Archive className="w-4 h-4" />
                <span>Архив недель</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'admin'
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  {activeTab === 'admin' && (
                    <motion.div
                      layoutId="desktop-tab-indicator"
                      className="absolute inset-0 bg-slate-200/80 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600 rounded-xl -z-10 shadow-inner"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <ShieldAlert className="w-4 h-4 text-slate-900 dark:text-white" />
                  <span>Штаб управления</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Section: Live Staff Online + Theme Toggle + User Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Live Command Staff Online Status Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-mono shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-slate-600 dark:text-zinc-400">В сети:</span>
              <strong className="text-slate-900 dark:text-white font-bold">{onlineUsers.length}</strong>
              
              <div className="h-3 w-px bg-slate-300 dark:bg-zinc-700 mx-0.5" />

              <div className="flex items-center space-x-1">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${onlineCurators.length > 0 ? 'bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/40' : 'text-slate-400 dark:text-zinc-600'}`}>
                  Куратор: {onlineCurators.length > 0 ? '🟢' : '⚪'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${onlineChiefs.length > 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40' : 'text-slate-400 dark:text-zinc-600'}`}>
                  Нач: {onlineChiefs.length > 0 ? '🟢' : '⚪'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${onlineDeputies.length > 0 ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40' : 'text-slate-400 dark:text-zinc-600'}`}>
                  Зам: {onlineDeputies.length > 0 ? '🟢' : '⚪'}
                </span>
              </div>
            </div>

            {/* Mobile Drawer Trigger */}
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* User Profile Dropdown */}
            <div ref={dropdownRef} className="relative flex shrink-0">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-pointer group shrink-0"
              >
                <div className="hidden sm:flex flex-col text-right whitespace-nowrap max-w-[120px] sm:max-w-[150px]">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 group-hover:text-slate-700 dark:group-hover:text-white transition-colors truncate">
                    {currentUser.nickname}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                    #{currentUser.staticId}
                  </span>
                </div>

                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-black flex items-center justify-center font-black text-xs sm:text-sm shadow-md border border-slate-700 dark:border-white shrink-0 overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.nickname} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    currentUser.nickname.charAt(0)
                  )}
                </div>

                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-zinc-400 transition-transform shrink-0 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 shadow-2xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800/80">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {currentUser.nickname}
                      </div>
                      <div className="text-slate-500 dark:text-zinc-400 mt-0.5 text-[11px] font-mono">
                        Static ID: #{currentUser.staticId} · Discord: {currentUser.discord}
                      </div>
                      <div className="mt-1.5">
                        {isSuperAdmin ? (
                          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/50 shadow-xs">
                            ★ Куратор
                          </span>
                        ) : isAdmin ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/50 shadow-xs">
                            ★ Начальник
                          </span>
                        ) : currentUser.role === 'senior_instructor' ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/50 shadow-xs">
                            ★ Зам. начальника
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                            Инструктор отдела
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onOpenProfileModal) onOpenProfileModal();
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer font-bold"
                      >
                        <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                        <span>Мой профиль (Карточка)</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setNewAvatarUrl(currentUser.avatarUrl || '');
                          setIsAvatarModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                        <span>Изменить аватарку</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setActiveTab('history');
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                        <span>История моих рапортов</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-black border border-zinc-700 text-white">
                    <Camera className="w-4 h-4 stroke-white" />
                  </div>
                  <h3 className="font-extrabold text-white text-base font-['Syne']">
                    Изменить аватарку
                  </h3>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAvatar} className="space-y-4 font-mono text-xs">
                {/* Current / Preview Avatar */}
                <div className="flex items-center space-x-4 p-3 rounded-2xl bg-black border border-zinc-800">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center font-bold text-lg text-white shrink-0">
                    {newAvatarUrl.trim() ? (
                      <img 
                        src={newAvatarUrl.trim()} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      currentUser.nickname.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm font-sans">{currentUser.nickname}</div>
                    <div className="text-zinc-400 text-[11px]">Загрузите фото с компьютера или укажите URL</div>
                  </div>
                </div>

                {/* Direct Upload Button */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase">
                    Загрузить файл изображения:
                  </label>
                  <label className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white transition-colors flex items-center justify-center space-x-2 cursor-pointer font-sans">
                    <Camera className="w-4 h-4 text-zinc-400" />
                    <span>Выбрать фото с устройства</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase">
                    Или укажите прямую ссылку (URL):
                  </label>
                  <input
                    type="url"
                    value={newAvatarUrl}
                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                    placeholder="https://imgur.com/your-image.png или cdn.discordapp.com..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2 cursor-pointer font-sans text-xs"
                  >
                    <Check className="w-4 h-4 stroke-2" />
                    <span>Сохранить аватарку</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewAvatarUrl('');
                      if (onUpdateAvatar) onUpdateAvatar('');
                      setIsAvatarModalOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer font-sans text-xs"
                  >
                    Сбросить
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </header>
  );
};
