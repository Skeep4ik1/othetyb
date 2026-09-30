import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Award, 
  Copy, 
  Check, 
  CheckCircle, 
  Target, 
  CalendarCheck, 
  ChevronRight, 
  X, 
  Crown,
  Filter,
  Camera,
  Trash2
} from 'lucide-react';
import { User, Report } from '../types';
import { SUPER_ADMIN_ID, calculatePoints } from '../utils/storage';

interface InstructorsTabProps {
  users: User[];
  reports: Report[];
  admins: string[];
  currentUser: User;
  onSelectReport: (report: Report) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onUpdateUserAvatar?: (staticId: string, url: string) => void;
  onlineUsers?: string[];
  onUpdateUserRole?: (staticId: string, role: string) => void;
  onDeleteUser?: (staticId: string) => void;
  onDeleteReport?: (reportId: string) => void;
}

export const InstructorsTab: React.FC<InstructorsTabProps> = ({
  users,
  reports,
  admins,
  currentUser,
  onSelectReport,
  showToast,
  onUpdateUserAvatar,
  onlineUsers = [],
  onUpdateUserRole,
  onDeleteUser,
  onDeleteReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'online' | 'superadmin' | 'admin' | 'senior_instructor' | 'instructor'>('all');
  const [sortBy, setSortBy] = useState<'points' | 'reports' | 'name' | 'staticId'>('points');
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAvatarUrl, setEditingAvatarUrl] = useState('');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // Combine user info with computed stats from reports
  const instructorsWithStats = useMemo(() => {
    const userMap = new Map<string, User>();
    
    users.forEach((u) => userMap.set(u.staticId, u));

    // Ensure users found in reports are also mapped if not already
    reports.forEach((r) => {
      if (!userMap.has(r.userId)) {
        userMap.set(r.userId, {
          nickname: r.nickname,
          staticId: r.userId,
          discord: r.discord,
          role: r.userId === SUPER_ADMIN_ID ? 'superadmin' : admins.includes(r.userId) ? 'admin' : 'instructor',
          createdAt: r.date,
        });
      }
    });

    const list = Array.from(userMap.values()).map((user) => {
      const userReports = reports.filter((r) => r.userId === user.staticId);
      const totalReports = userReports.length;
      const totalPoints = userReports.reduce((sum, r) => sum + calculatePoints(r), 0);
      const checkedReports = userReports.reduce((sum, r) => sum + (r.checkedReports ?? r.checked ?? 0), 0);
      const gatherings = userReports.reduce((sum, r) => sum + (r.gatherings ?? r.gathered ?? 0), 0);
      const arrests = userReports.reduce((sum, r) => sum + (r.arrests ?? 0), 0);
      const events = userReports.reduce((sum, r) => sum + (r.events ?? r.trainings ?? 0), 0);
      
      const isSuperAdmin = user.staticId === SUPER_ADMIN_ID || user.role === 'superadmin';
      const isChief = user.role === 'admin' || (admins.includes(user.staticId) && !isSuperAdmin);
      const isDeputyChief = user.role === 'senior_instructor';
      const isOnline = user.staticId === currentUser.staticId || onlineUsers.includes(user.staticId);

      return {
        ...user,
        isSuperAdmin,
        isChief,
        isDeputyChief,
        isAdmin: isSuperAdmin || isChief,
        isOnline,
        totalReports,
        totalPoints,
        checkedReports,
        gatherings,
        arrests,
        events,
        userReports,
      };
    });

    // Apply filtering
    return list.filter((item) => {
      if (roleFilter === 'online' && !item.isOnline) return false;
      if (roleFilter === 'superadmin' && !item.isSuperAdmin) return false;
      if (roleFilter === 'admin' && !item.isChief) return false;
      if (roleFilter === 'senior_instructor' && !item.isDeputyChief) return false;
      if (roleFilter === 'instructor' && (item.isSuperAdmin || item.isChief || item.isDeputyChief)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nickname.toLowerCase().includes(q);
        const matchStatic = item.staticId.includes(q);
        const matchDiscord = item.discord.toLowerCase().includes(q);
        return matchName || matchStatic || matchDiscord;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      if (sortBy === 'reports') return b.totalReports - a.totalReports;
      if (sortBy === 'name') return a.nickname.localeCompare(b.nickname, 'ru');
      if (sortBy === 'staticId') return a.staticId.localeCompare(b.staticId);
      return 0;
    });
  }, [users, reports, admins, roleFilter, searchQuery, sortBy, onlineUsers]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Скопировано: ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedInstructorData = useMemo(() => {
    if (!selectedInstructor) return null;
    return instructorsWithStats.find((i) => i.staticId === selectedInstructor.staticId) || null;
  }, [selectedInstructor, instructorsWithStats]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Banner & Stats Overview */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <Users className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Личный состав отдела «В»
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {instructorsWithStats.length} ИНСТРУКТОРОВ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Реестр действующих сотрудников, показатели смен и фонд баллов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-black border border-zinc-800 rounded-2xl text-xs font-mono">
              <span className="text-zinc-400">Зарегистрировано: </span>
              <strong className="text-white font-bold">{users.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по имени, Static ID или Discord..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-black border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 self-end md:self-auto text-xs">
            <span className="text-zinc-400 font-mono whitespace-nowrap">Сортировка:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white focus:outline-none cursor-pointer font-mono"
            >
              <option value="points" className="bg-[#121212]">По баллам (убывание)</option>
              <option value="reports" className="bg-[#121212]">По числу рапортов</option>
              <option value="name" className="bg-[#121212]">По имени (А-Я)</option>
              <option value="staticId" className="bg-[#121212]">По Static ID</option>
            </select>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800 text-xs">
          <span className="text-zinc-400 font-mono mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-white" /> Фильтр:
          </span>
          {[
            { id: 'all', label: 'Все сотрудники' },
            { id: 'online', label: `🟢 В сети (${onlineUsers.length})` },
            { id: 'superadmin', label: 'Куратор' },
            { id: 'admin', label: 'Начальник' },
            { id: 'senior_instructor', label: 'Зам. начальника' },
            { id: 'instructor', label: 'Инструкторы' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as typeof roleFilter)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-white text-black font-bold shadow-xs border border-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instructors Roster Cards Grid */}
      {instructorsWithStats.length === 0 ? (
        <div className="bg-[#0c1222]/80 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#060913] border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-100 font-['Syne']">
            Сотрудники не найдены
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Попробуйте изменить запрос поиска или выбранные фильтры.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructorsWithStats.map((inst) => {
            const isMe = inst.staticId === currentUser.staticId;
            const canManageRoles = (currentUser.role === 'superadmin' || currentUser.staticId === SUPER_ADMIN_ID) && !isMe;

            return (
              <motion.div
                key={inst.staticId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className={`bg-[#121212] border rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  inst.isSuperAdmin
                    ? 'border-red-500/50 bg-gradient-to-b from-red-950/20 to-zinc-900'
                    : inst.isChief
                    ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-zinc-900'
                    : inst.isDeputyChief
                    ? 'border-purple-500/50 bg-gradient-to-b from-purple-950/20 to-zinc-900'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div>
                  {/* Card Header: Avatar, Name, Badges & Online Indicator */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md overflow-hidden ${
                          inst.isSuperAdmin
                            ? 'bg-red-600 text-white border border-red-400'
                            : inst.isChief
                            ? 'bg-amber-500 text-black border border-amber-300'
                            : inst.isDeputyChief
                            ? 'bg-purple-600 text-white border border-purple-400'
                            : 'bg-black text-zinc-300 border border-zinc-800'
                        }`}>
                          {inst.avatarUrl ? (
                            <img 
                              src={inst.avatarUrl} 
                              alt={inst.nickname} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            inst.nickname.charAt(0)
                          )}
                        </div>

                        {/* Pulsing Online Status Badge */}
                        <div 
                          title={inst.isOnline ? 'В сети на сайте' : 'Не в сети'}
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#121212] flex items-center justify-center ${
                            inst.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                          }`}
                        >
                          {inst.isOnline && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 leading-tight">
                            {inst.nickname}
                          </h3>
                          {isMe && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              (Вы)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono mt-0.5">
                          <button
                            onClick={() => handleCopy(inst.staticId, `static-${inst.staticId}`)}
                            title="Скопировать Static ID"
                            className="hover:text-white flex items-center space-x-1 cursor-pointer"
                          >
                            <span>#{inst.staticId}</span>
                            {copiedId === `static-${inst.staticId}` ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </button>

                          <span aria-hidden="true">·</span>
                          <span className={`text-[10px] font-bold ${inst.isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {inst.isOnline ? '● В сети' : 'Офлайн'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role Tag */}
                    <div className="shrink-0">
                      {inst.isSuperAdmin ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-black bg-red-500/20 text-red-400 border border-red-500/50 flex items-center shadow-xs">
                          <Crown className="w-3 h-3 mr-1 text-red-400 fill-red-400/30" /> ★ Куратор
                        </span>
                      ) : inst.isChief ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center shadow-xs">
                          <ShieldCheck className="w-3 h-3 mr-1 text-amber-300" /> ★ Начальник
                        </span>
                      ) : inst.isDeputyChief ? (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 flex items-center shadow-xs">
                          <Award className="w-3 h-3 mr-1 text-purple-300" /> ★ Зам. начальника
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-mono text-zinc-400 bg-black border border-zinc-800">
                          Инструктор
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discord Info Box */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black border border-zinc-800 text-xs mb-3 font-mono">
                    <span className="text-zinc-400">Discord:</span>
                    <button
                      onClick={() => handleCopy(inst.discord, `ds-${inst.staticId}`)}
                      className="font-semibold text-zinc-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{inst.discord}</span>
                      {copiedId === `ds-${inst.staticId}` ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
                      )}
                    </button>
                  </div>

                  {/* Metrics Counters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3 font-mono">
                    <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">Отчётов (3 б.)</div>
                      <div className="font-bold text-white mt-0.5">
                        {inst.checkedReports} шт.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">Сборов (15 б.)</div>
                      <div className="font-bold text-white mt-0.5">
                        {inst.gatherings} шт.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">Задержаний (2 б.)</div>
                      <div className="font-bold text-white mt-0.5">
                        {inst.arrests} шт.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black border border-zinc-800">
                      <div className="text-zinc-400 text-[10px]">Мероприятий (10 б.)</div>
                      <div className="font-bold text-white mt-0.5">
                        {inst.events} шт.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar with Total Points and Dossier Trigger */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono font-bold tracking-wider">
                      Всего баллов:
                    </div>
                    <div className="text-lg font-black text-white font-mono tabular-nums">
                      +{inst.totalPoints} б.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedInstructor(inst);
                      setEditingAvatarUrl(inst.avatarUrl || '');
                      setIsEditingAvatar(false);
                    }}
                    className="flex items-center space-x-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-black hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>Личное дело</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Instructor Dossier / Profile Detail Modal */}
      <AnimatePresence>
        {selectedInstructorData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#121212] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-black">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-md overflow-hidden relative group ${
                    selectedInstructorData.isSuperAdmin
                      ? 'bg-white text-black border border-white'
                      : selectedInstructorData.isAdmin
                      ? 'bg-zinc-800 text-white border border-zinc-600'
                      : 'bg-black text-zinc-300 border border-zinc-800'
                  }`}>
                    {selectedInstructorData.avatarUrl ? (
                      <img 
                        src={selectedInstructorData.avatarUrl} 
                        alt={selectedInstructorData.nickname} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      selectedInstructorData.nickname.charAt(0)
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-white text-lg font-['Syne']">
                        {selectedInstructorData.nickname}
                      </h3>
                      {selectedInstructorData.isSuperAdmin ? (
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                          ★ Куратор
                        </span>
                      ) : selectedInstructorData.isAdmin ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50">
                          ★ Начальник
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-zinc-400 border border-zinc-800">
                          Инструктор
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      Static ID: #{selectedInstructorData.staticId} · Discord: {selectedInstructorData.discord}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedInstructor(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Role Management Section for Curator Only */}
                {(currentUser.role === 'superadmin' || currentUser.staticId === SUPER_ADMIN_ID) && onUpdateUserRole && (
                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 font-mono text-xs space-y-2">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>Назначить должность сотруднику:</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Текущий роль: {selectedInstructorData.role || 'instructor'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={() => onUpdateUserRole(selectedInstructorData.staticId, 'superadmin')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedInstructorData.isSuperAdmin
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        ★ Куратор
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateUserRole(selectedInstructorData.staticId, 'admin')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedInstructorData.isChief
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        ★ Начальник
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateUserRole(selectedInstructorData.staticId, 'senior_instructor')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedInstructorData.isDeputyChief
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        ★ Зам. начальника
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateUserRole(selectedInstructorData.staticId, 'instructor')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          !selectedInstructorData.isSuperAdmin && !selectedInstructorData.isChief && !selectedInstructorData.isDeputyChief
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        Инструктор
                      </button>
                    </div>
                  </div>
                )}
                {(selectedInstructorData.staticId === currentUser.staticId || currentUser.staticId === SUPER_ADMIN_ID) && (
                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 font-mono text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white flex items-center">
                        <Camera className="w-4 h-4 mr-1.5 text-zinc-300" /> Изменить аватарку сотрудника
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                        className="text-zinc-400 hover:text-white underline text-[11px]"
                      >
                        {isEditingAvatar ? 'Свернуть' : 'Редактировать'}
                      </button>
                    </div>

                    {isEditingAvatar && (
                      <div className="space-y-3 pt-2 border-t border-zinc-800">
                        <div className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={editingAvatarUrl}
                            onChange={(e) => setEditingAvatarUrl(e.target.value)}
                            placeholder="https://imgur.com/your-image.png или URL"
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none"
                          />
                          <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer text-xs font-sans whitespace-nowrap">
                            Загрузить файл
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setEditingAvatarUrl(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateUserAvatar) {
                                onUpdateUserAvatar(selectedInstructorData.staticId, editingAvatarUrl.trim());
                              }
                              setIsEditingAvatar(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                          >
                            Сохранить аватар
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAvatarUrl('');
                              if (onUpdateUserAvatar) {
                                onUpdateUserAvatar(selectedInstructorData.staticId, '');
                              }
                              setIsEditingAvatar(false);
                            }}
                            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs cursor-pointer"
                          >
                            Удалить аватар
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* User Deletion Box for Chief and Curator roles */}
                {(currentUser.role === 'superadmin' || currentUser.role === 'admin' || currentUser.staticId === SUPER_ADMIN_ID || admins.includes(currentUser.staticId)) &&
                  selectedInstructorData.staticId !== SUPER_ADMIN_ID &&
                  selectedInstructorData.staticId !== currentUser.staticId &&
                  onDeleteUser && (
                    <div className="p-4 rounded-2xl bg-red-950/20 border border-red-900/40 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-red-400 flex items-center">
                          <Trash2 className="w-4 h-4 mr-1.5 text-red-400" />
                          Удалить сотрудника из личного состава
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                          Без сброса всей базы данных. Учётная запись #{selectedInstructorData.staticId} будет полностью удалена.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Вы уверены, что хотите полностью удалить сотрудника ${selectedInstructorData.nickname} (#${selectedInstructorData.staticId}) из базы данных?`
                            )
                          ) {
                            onDeleteUser(selectedInstructorData.staticId);
                            setSelectedInstructor(null);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer font-sans shadow-md shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Удалить юзера</span>
                      </button>
                    </div>
                  )}

                {/* Score and Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-center">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-white" />
                    <div className="text-xl font-black text-white tabular-nums">
                      {selectedInstructorData.checkedReports}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Отчёты (3 б.)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-white" />
                    <div className="text-xl font-black text-white tabular-nums">
                      {selectedInstructorData.gatherings}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Сборы (15 б.)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-white" />
                    <div className="text-xl font-black text-white tabular-nums">
                      {selectedInstructorData.arrests}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Задержания (2 б.)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-center">
                    <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-white" />
                    <div className="text-xl font-black text-white tabular-nums">
                      {selectedInstructorData.events}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">Мероприятия (10 б.)</div>
                  </div>
                </div>

                {/* Total Points Ribbon */}
                <div className="p-4 rounded-2xl bg-black border border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-black">
                      <Award className="w-5 h-5 stroke-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Накопленный фонд баллов
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">
                        Сдано рапортов: <strong className="text-white">{selectedInstructorData.totalReports}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-2xl font-black text-white font-mono tabular-nums">
                    +{selectedInstructorData.totalPoints} баллов
                  </div>
                </div>

                {/* Submitted Reports History for this instructor */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                    История сданных рапортов ({selectedInstructorData.userReports.length})
                  </h4>

                  {selectedInstructorData.userReports.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 bg-black rounded-2xl border border-zinc-800">
                      Инструктор ещё не сдавал рапорты.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedInstructorData.userReports.map((rep) => {
                        const pts = calculatePoints(rep);
                        return (
                          <div
                            key={rep.id}
                            onClick={() => {
                              setSelectedInstructor(null);
                              onSelectReport(rep);
                            }}
                            className="p-3 rounded-xl bg-black border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-white font-bold">✓</span>
                              <div>
                                <div className="font-semibold text-zinc-200 font-mono">
                                  Рапорт от {new Date(rep.date).toLocaleDateString('ru-RU')} в {new Date(rep.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  Отч: {rep.checkedReports ?? rep.checked ?? 0} · Сбор: {rep.gatherings ?? rep.gathered ?? 0} · Зад: {rep.arrests ?? 0} · Мер: {rep.events ?? rep.trainings ?? 0}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 font-mono">
                              <span className="font-bold text-white">
                                +{pts} б.
                              </span>
                              {(currentUser.role === 'superadmin' || currentUser.staticId === SUPER_ADMIN_ID) && onDeleteReport && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        `Удалить рапорт от ${new Date(rep.date).toLocaleDateString('ru-RU')}?`
                                      )
                                    ) {
                                      onDeleteReport(rep.id);
                                    }
                                  }}
                                  className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Удалить рапорт (Только для Куратора)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-black">
                <button
                  onClick={() => setSelectedInstructor(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
