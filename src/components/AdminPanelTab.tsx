import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Shield, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  Search, 
  Download, 
  RotateCcw, 
  Users, 
  Target, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  CalendarCheck, 
  Calculator, 
  Award, 
  X,
  Crown,
  Archive,
  FolderArchive
} from 'lucide-react';
import { Report, ReportStatus, User } from '../types';
import { SUPER_ADMIN_ID, calculatePoints, exportReportsToCSV, parseReportDate } from '../utils/storage';

interface AdminPanelTabProps {
  reports: Report[];
  admins: string[];
  setAdmins: React.Dispatch<React.SetStateAction<string[]>>;
  users?: User[];
  currentUser?: User;
  onUpdateReportStatus: (reportId: string, status: ReportStatus, comment?: string) => void;
  onSelectReport: (report: Report) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onResetSeedData: () => void;
  onArchiveWeek?: (title?: string) => void;
  onlineUsers?: string[];
  onUpdateUserRole?: (staticId: string, role: string) => void;
  onDeleteUser?: (staticId: string) => void;
  onDeleteReport?: (reportId: string) => void;
}

export const AdminPanelTab: React.FC<AdminPanelTabProps> = ({
  reports,
  admins,
  setAdmins,
  users = [],
  currentUser,
  onSelectReport,
  showToast,
  onResetSeedData,
  onArchiveWeek,
  onlineUsers = [],
  onUpdateUserRole,
  onDeleteUser,
  onDeleteReport,
}) => {
  const isCurator = currentUser?.role === 'superadmin' || currentUser?.staticId === SUPER_ADMIN_ID;
  const [newAdminId, setNewAdminId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [customArchiveTitle, setCustomArchiveTitle] = useState('');
  const [summaryPeriod, setSummaryPeriod] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const filteredReports = useMemo(() => {
    const now = Date.now();
    return reports
      .filter((r) => {
        if (summaryPeriod === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (parseReportDate(r.date) < startOfToday.getTime()) return false;
        } else if (summaryPeriod === '7d') {
          if (parseReportDate(r.date) < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (summaryPeriod === '30d') {
          if (parseReportDate(r.date) < now - 30 * 24 * 60 * 60 * 1000) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNick = r.nickname.toLowerCase().includes(q);
          const matchStatic = r.userId.includes(q);
          const matchDiscord = r.discord.toLowerCase().includes(q);
          return matchNick || matchStatic || matchDiscord;
        }
        return true;
      })
      .sort((a, b) => parseReportDate(b.date) - parseReportDate(a.date));
  }, [reports, searchQuery, summaryPeriod]);

  const summaryData = useMemo(() => {
    let targetReports = reports;
    const now = Date.now();

    if (summaryPeriod === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      targetReports = reports.filter((r) => parseReportDate(r.date) >= startOfToday.getTime());
    } else if (summaryPeriod === '7d') {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      targetReports = reports.filter((r) => parseReportDate(r.date) >= cutoff);
    } else if (summaryPeriod === '30d') {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      targetReports = reports.filter((r) => parseReportDate(r.date) >= cutoff);
    }

    const totalReportsCount = targetReports.length;
    const totalChecked = targetReports.reduce((sum, r) => sum + (r.checkedReports ?? r.checked ?? 0), 0);
    const totalGatherings = targetReports.reduce((sum, r) => sum + (r.gatherings ?? r.gathered ?? 0), 0);
    const totalArrests = targetReports.reduce((sum, r) => sum + (r.arrests ?? 0), 0);
    const totalEvents = targetReports.reduce((sum, r) => sum + (r.events ?? r.trainings ?? 0), 0);
    const totalPoints = targetReports.reduce((sum, r) => sum + calculatePoints(r), 0);

    const instructorMap = new Map<string, {
      nickname: string;
      staticId: string;
      checked: number;
      gatherings: number;
      arrests: number;
      events: number;
      points: number;
      count: number;
    }>();

    targetReports.forEach((r) => {
      const prev = instructorMap.get(r.userId) || {
        nickname: r.nickname,
        staticId: r.userId,
        checked: 0,
        gatherings: 0,
        arrests: 0,
        events: 0,
        points: 0,
        count: 0,
      };

      prev.checked += (r.checkedReports ?? r.checked ?? 0);
      prev.gatherings += (r.gatherings ?? r.gathered ?? 0);
      prev.arrests += (r.arrests ?? 0);
      prev.events += (r.events ?? r.trainings ?? 0);
      prev.points += calculatePoints(r);
      prev.count += 1;

      instructorMap.set(r.userId, prev);
    });

    const instructors = Array.from(instructorMap.values()).sort((a, b) => b.points - a.points);

    return {
      totalReportsCount,
      totalChecked,
      totalGatherings,
      totalArrests,
      totalEvents,
      totalPoints,
      instructors,
    };
  }, [reports, summaryPeriod]);

  const displayAdmins = useMemo(() => {
    const set = new Set<string>(admins);
    set.add(SUPER_ADMIN_ID);
    users.forEach((u) => {
      if (u.role === 'admin' || u.role === 'superadmin' || u.role === 'senior_instructor') {
        set.add(u.staticId);
      }
    });
    return Array.from(set);
  }, [admins, users]);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurator) {
      showToast('Выдавать и изменять роли может только Куратор!', 'error');
      return;
    }
    const cleanId = newAdminId.trim();
    if (!cleanId) return;

    if (admins.includes(cleanId)) {
      showToast(`Static #${cleanId} уже имеет права администратора`, 'info');
      return;
    }

    setAdmins([...admins, cleanId]);
    setNewAdminId('');
    showToast(`Static #${cleanId} назначен администратором`, 'success');
  };

  const handleRevokeAdmin = (staticId: string) => {
    if (!isCurator) {
      showToast('Отозывать роли может только Куратор!', 'error');
      return;
    }
    if (staticId === SUPER_ADMIN_ID) {
      showToast('Нельзя отозвать права у создателя / Super Admin!', 'error');
      return;
    }
    setAdmins(admins.filter((id) => id !== staticId));
    if (onUpdateUserRole) {
      onUpdateUserRole(staticId, 'instructor');
    }
    showToast(`Права администратора у #${staticId} отозваны`, 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
                  Штабная панель управления
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  AUTO-APPROVAL ACTIVE
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  🛡️ DDoS PROTECTED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Управление составом администраторов, сводка начислений и реестр еженедельных отчётов
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (reports.length === 0) {
                  showToast('Нет активных рапортов для подведения итогов недели', 'info');
                  return;
                }
                setIsArchiveModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-white text-black hover:bg-zinc-200 shadow-md transition-all cursor-pointer font-['Unbounded']"
            >
              <Archive className="w-4 h-4 stroke-2" />
              <span>Закрыть неделю</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsSummaryModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-zinc-900 text-white border border-zinc-700 hover:border-zinc-500 shadow-md transition-all cursor-pointer font-['Unbounded']"
            >
              <Calculator className="w-4 h-4 stroke-2" />
              <span>Посчитать итоги</span>
            </motion.button>

            <button
              onClick={() => {
                exportReportsToCSV(reports);
                showToast('База рапортов выгружена в CSV', 'success');
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-black border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors shadow-xs font-mono cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Экспорт CSV</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Сбросить базу данных к начальному состоянию?')) {
                  onResetSeedData();
                  showToast('Данные сброшены', 'info');
                }
              }}
              className="p-2.5 rounded-2xl text-xs bg-black border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
              title="Сбросить данные"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DDoS & Anti-Flood Security Status Card */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-emerald-400 font-mono uppercase tracking-wider text-sm">
                🛡️ Защита от DDoS и спам-атак активна
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5">
              Скользящий лимит запросов (120 req/мин на IP), фильтрация трафика, ограничение размера данных (2MB Body Guard) и заголовки безопасности HTTP.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2.5 font-mono text-[11px] text-zinc-300 bg-black/60 px-3.5 py-2 rounded-2xl border border-zinc-800 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Rate Limit: 120/мин</span>
          <span className="text-zinc-700">|</span>
          <span>Flood Guard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Access & Registered Instructors */}
        <div className="space-y-5">
          {/* Admin Management */}
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-white text-base font-['Syne']">
                Администраторы отдела
              </h3>
            </div>

            {isCurator ? (
              <form onSubmit={handleAddAdmin} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Static ID нового админа..."
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-black border border-zinc-800 font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer font-bold"
                  title="Назначить"
                >
                  <UserPlus className="w-4 h-4 stroke-2 stroke-black" />
                </button>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono">
                🔒 Выдавать и изменять должности может только Куратор отдела.
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Действующие администраторы ({displayAdmins.length})
              </div>

              {displayAdmins.map((adminId) => {
                const isSuper = adminId === SUPER_ADMIN_ID;
                const matchedUser = users.find((u) => u.staticId === adminId);
                const isHeadAdmin = matchedUser?.role === 'admin';
                const isDeputyAdmin = matchedUser?.role === 'senior_instructor';

                return (
                  <div
                    key={adminId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-black border border-zinc-800"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <Shield className="w-4 h-4 text-white shrink-0" />
                      <div className="flex items-center space-x-1.5 truncate">
                        {matchedUser && (
                          <span className="font-bold text-xs text-white truncate">
                            {matchedUser.nickname}
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-zinc-400">
                          #{adminId}
                        </span>
                      </div>
                      {isSuper ? (
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50 shrink-0">
                          ★ Куратор
                        </span>
                      ) : isHeadAdmin ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 shrink-0">
                          ★ Начальник
                        </span>
                      ) : isDeputyAdmin ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50 shrink-0">
                          ★ Зам. начальника
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/50 shrink-0">
                          Админ
                        </span>
                      )}
                    </div>

                    {!isSuper && (
                      <button
                        onClick={() => handleRevokeAdmin(adminId)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                        title="Отозвать права"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registered Accounts */}
          {users.length > 0 && (
            <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="font-extrabold text-white text-base font-['Syne']">
                    Учётные записи
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-black text-zinc-400 border border-zinc-800">
                  {users.length}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {users.map((u) => {
                  const isOnline = onlineUsers.includes(u.staticId);
                  const isSuper = u.staticId === SUPER_ADMIN_ID || u.role === 'superadmin';

                  return (
                    <div
                      key={u.staticId}
                      className="p-3 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between text-xs font-mono gap-2"
                    >
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                        <div>
                          <div className="font-bold text-white leading-tight flex items-center space-x-1.5">
                            <span>{u.nickname}</span>
                            <span className={`text-[9px] px-1 rounded ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-600'}`}>
                              {isOnline ? 'В сети' : 'Офлайн'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            ID: #{u.staticId} · DS: {u.discord}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isCurator && onUpdateUserRole ? (
                          <select
                            value={u.role || 'instructor'}
                            onChange={(e) => onUpdateUserRole(u.staticId, e.target.value)}
                            className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] text-zinc-200 focus:outline-none cursor-pointer font-mono"
                          >
                            <option value="superadmin">★ Куратор</option>
                            <option value="admin">★ Начальник</option>
                            <option value="senior_instructor">★ Зам. начальника</option>
                            <option value="instructor">Инструктор</option>
                          </select>
                        ) : (
                          u.role === 'superadmin' || u.staticId === SUPER_ADMIN_ID ? (
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">★ Куратор</span>
                          ) : u.role === 'admin' ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">★ Начальник</span>
                          ) : u.role === 'senior_instructor' ? (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">★ Зам. начальника</span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">Инструктор</span>
                          )
                        )}

                        {onDeleteUser &&
                          u.staticId !== SUPER_ADMIN_ID &&
                          u.staticId !== currentUser?.staticId &&
                          (isCurator || currentUser?.role === 'admin' || admins.includes(currentUser?.staticId || '')) && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Вы уверены, что хотите полностью удалить аккаунт ${u.nickname} (#${u.staticId}) из базы данных?`
                                  )
                                ) {
                                  onDeleteUser(u.staticId);
                                }
                              }}
                              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Удалить юзера из базы"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: All Accepted Reports Log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-white" />
                <h3 className="font-extrabold text-white text-base font-['Syne']">
                  Журнал принятых рапортов ({filteredReports.length})
                </h3>
              </div>

              {/* Period Selector Pills */}
              <div className="flex items-center space-x-1 p-1 bg-black border border-zinc-800 rounded-2xl text-xs font-mono shadow-inner shrink-0">
                {[
                  { id: 'all', label: 'Всё время' },
                  { id: 'today', label: 'Сегодня' },
                  { id: '7d', label: '7 дней' },
                  { id: '30d', label: '30 дней' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSummaryPeriod(p.id as typeof summaryPeriod)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                      summaryPeriod === p.id
                        ? 'bg-zinc-800 text-red-400 shadow-md border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по имени, Static ID или Discord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-black border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            {/* Table / List */}
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredReports.map((report) => {
                const points = calculatePoints(report);
                const checked = report.checkedReports ?? report.checked ?? 0;
                const gatherings = report.gatherings ?? report.gathered ?? 0;
                const arrests = report.arrests ?? 0;
                const events = report.events ?? report.trainings ?? 0;

                return (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="p-3.5 rounded-2xl border border-zinc-800 hover:border-zinc-600 bg-black hover:bg-zinc-900 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">
                            {report.nickname}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">
                            #{report.userId}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          {new Date(report.date).toLocaleDateString('ru-RU')} · DS: {report.discord}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 text-xs pl-11 sm:pl-0">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                        <span>Отч:{checked}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>Сбор:{gatherings}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>Зад:{arrests}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>Мер:{events}</span>
                      </div>

                      <div className="text-right font-mono">
                        <span className="font-black text-white text-xs">
                          +{points} б.
                        </span>
                      </div>

                      {isCurator && onDeleteReport && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                `Удалить рапорт от ${report.nickname} (#${report.userId})?`
                              )
                            ) {
                              onDeleteReport(report.id);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Удалить рапорт (Только для Куратора)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                  Рапортов пока нет.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Calculation Modal */}
      <AnimatePresence>
        {isSummaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060913]/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#0c1222] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-[#060913]/70">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
                    <Calculator className="w-5 h-5 stroke-2" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 text-lg leading-tight font-['Syne']">
                      Сводка и подсчёт активности
                    </h3>
                    <p className="text-xs text-slate-400">
                      Итоговые показатели работы, задержаний, сборов и начислений
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Period selector */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    Период расчёта:
                  </span>
                  <div className="flex items-center space-x-1 p-1 bg-[#060913] border border-slate-800 rounded-2xl text-xs font-mono">
                    {(
                      [
                        { id: 'all', label: 'Всё время' },
                        { id: 'today', label: 'Сегодня' },
                        { id: '7d', label: '7 дней' },
                        { id: '30d', label: '30 дней' },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSummaryPeriod(p.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          summaryPeriod === p.id
                            ? 'bg-slate-800 text-red-400 shadow-xs border border-slate-700/60'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Official Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-[#060913] border border-slate-800 text-center">
                    <CheckCircle className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <div className="text-2xl font-black text-slate-100 tabular-nums">
                      {summaryData.totalChecked}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Отчётов проверено</div>
                    <div className="text-[10px] text-blue-400 font-bold mt-1">
                      x3 б. = {summaryData.totalChecked * 3} б.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#060913] border border-slate-800 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-red-400" />
                    <div className="text-2xl font-black text-slate-100 tabular-nums">
                      {summaryData.totalGatherings}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Сборов людей</div>
                    <div className="text-[10px] text-red-400 font-bold mt-1">
                      x15 б. = {summaryData.totalGatherings * 15} б.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#060913] border border-slate-800 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                    <div className="text-2xl font-black text-slate-100 tabular-nums">
                      {summaryData.totalArrests}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Задержаний</div>
                    <div className="text-[10px] text-rose-400 font-bold mt-1">
                      x2 б. = {summaryData.totalArrests * 2} б.
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#060913] border border-slate-800 text-center">
                    <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                    <div className="text-2xl font-black text-slate-100 tabular-nums">
                      {summaryData.totalEvents}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Мероприятий фракции</div>
                    <div className="text-[10px] text-sky-400 font-bold mt-1">
                      x10 б. = {summaryData.totalEvents * 10} б.
                    </div>
                  </div>
                </div>

                {/* Grand Total Ribbon */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-[#060913] border border-red-500/40 gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                        Общий итог начислений
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Обработано рапортов за период: <strong className="text-slate-200">{summaryData.totalReportsCount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="text-2xl font-black text-red-400 font-mono tabular-nums tracking-tight">
                    +{summaryData.totalPoints.toLocaleString('ru-RU')} баллов
                  </div>
                </div>

                {/* Breakdown by Instructors */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 font-mono">
                    Вклад каждого инструктора ({summaryData.instructors.length})
                  </h4>

                  {summaryData.instructors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-[#060913] rounded-2xl border border-slate-800 font-mono">
                      За выбранный период рапорты отсутствуют.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {summaryData.instructors.map((ins, i) => (
                        <div
                          key={ins.staticId}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#060913] border border-slate-800 text-xs font-mono"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-slate-500 font-bold text-[11px] w-4">
                              #{i + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-100">
                                {ins.nickname}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1.5">
                                #{ins.staticId}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="font-black text-red-400 text-xs">
                              +{ins.points} б.
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#060913]/70">
                <button
                  onClick={() => {
                    const text = `[ИТОГИ РАБОТЫ ОТДЕЛА «В»]
Период: ${summaryPeriod === 'all' ? 'Всё время' : summaryPeriod === 'today' ? 'Сегодня' : summaryPeriod}
Проверено отчётов: ${summaryData.totalChecked} (x3 б. = ${summaryData.totalChecked * 3} б.)
Сборов на бизаки/тайники: ${summaryData.totalGatherings} (x15 б. = ${summaryData.totalGatherings * 15} б.)
Задержаний: ${summaryData.totalArrests} (x2 б. = ${summaryData.totalArrests * 2} б.)
Мероприятий фракции: ${summaryData.totalEvents} (x10 б. = ${summaryData.totalEvents * 10} б.)
ИТОГО НАЧИСЛЕНО: ${summaryData.totalPoints} баллов
Всего рапортов: ${summaryData.totalReportsCount}`;
                    navigator.clipboard.writeText(text);
                    showToast('Сводка скопирована в буфер обмена', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shadow-xs cursor-pointer font-mono"
                >
                  Скопировать сводку текстом
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsSummaryModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer font-sans"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Close Week & Archive Modal */}
      <AnimatePresence>
        {isArchiveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-white text-black">
                    <Archive className="w-5 h-5 stroke-black stroke-2" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base font-['Unbounded']">
                      Закрытие отчетной недели
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">
                      Подведение итогов и перемещение рапортов в архив
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-black border border-zinc-800 space-y-2">
                  <div className="flex justify-between text-zinc-300">
                    <span>Текущих рапортов в базе:</span>
                    <strong className="text-white">{reports.length} шт.</strong>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Сумма начисленных баллов:</span>
                    <strong className="text-white">
                      +{reports.reduce((sum, r) => sum + calculatePoints(r), 0)} б.
                    </strong>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans pt-2 border-t border-zinc-800">
                    ⚠️ При закрытии недели текущие {reports.length} рапортов будут сохранены в отдельной вкладке «Архив недель», а текущий список рапортов очистится для новой недели.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase font-mono">
                    Название отчета за неделю (опционально):
                  </label>
                  <input
                    type="text"
                    value={customArchiveTitle}
                    onChange={(e) => setCustomArchiveTitle(e.target.value)}
                    placeholder={`Еженедельный отчёт (с ${new Date().toLocaleDateString('ru-RU')})`}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs font-bold cursor-pointer font-sans"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onArchiveWeek) {
                      onArchiveWeek(customArchiveTitle.trim());
                      setIsArchiveModalOpen(false);
                      setCustomArchiveTitle('');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-colors text-xs font-black cursor-pointer font-['Unbounded'] flex items-center space-x-2"
                >
                  <Archive className="w-4 h-4 stroke-black" />
                  <span>Подтвердить и закрыть неделю</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
