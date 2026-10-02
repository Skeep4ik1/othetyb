import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Archive, 
  Calendar, 
  FileText, 
  Users, 
  Target, 
  CheckCircle, 
  CalendarCheck, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Copy, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  Search,
  Trophy,
  Crown,
  Medal,
  Sparkles
} from 'lucide-react';
import { WeeklyArchive, Report, User } from '../types';
import { calculatePoints, exportReportsToCSV, parseReportDate } from '../utils/storage';

interface WeeklyArchivesTabProps {
  archives: WeeklyArchive[];
  currentUser: User;
  isAdmin: boolean;
  onSelectReport: (report: Report) => void;
  onDeleteArchive?: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onGoToNewReport: () => void;
}

export const WeeklyArchivesTab: React.FC<WeeklyArchivesTabProps> = ({
  archives,
  isAdmin,
  onSelectReport,
  onDeleteArchive,
  showToast,
  onGoToNewReport,
}) => {
  const [expandedArchiveId, setExpandedArchiveId] = useState<string | null>(
    archives.length > 0 ? archives[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'reports'>('summary');

  const filteredArchives = useMemo(() => {
    const now = Date.now();
    return archives.filter((a) => {
      if (period === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (parseReportDate(a.closedAt || a.endDate) < startOfToday.getTime()) return false;
      } else if (period === '7d') {
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        if (parseReportDate(a.closedAt || a.endDate) < cutoff) return false;
      } else if (period === '30d') {
        const cutoff = now - 30 * 24 * 60 * 60 * 1000;
        if (parseReportDate(a.closedAt || a.endDate) < cutoff) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.closedBy.toLowerCase().includes(q) ||
          a.instructorSummary.some((i) => i.nickname.toLowerCase().includes(q) || i.staticId.includes(q))
        );
      }
      return true;
    });
  }, [archives, period, searchQuery]);

  // Calculate aggregated Top 2 Best Employees for selected period across archives
  const periodTop2Instructors = useMemo(() => {
    const map = new Map<string, {
      nickname: string;
      staticId: string;
      discord: string;
      points: number;
      reportsCount: number;
    }>();

    filteredArchives.forEach((arch) => {
      arch.instructorSummary.forEach((ins) => {
        const prev = map.get(ins.staticId) || {
          nickname: ins.nickname,
          staticId: ins.staticId,
          discord: ins.discord,
          points: 0,
          reportsCount: 0,
        };
        prev.points += ins.points;
        prev.reportsCount += ins.reportsCount;
        map.set(ins.staticId, prev);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.points - a.points).slice(0, 2);
  }, [filteredArchives]);

  const handleCopySummary = (arch: WeeklyArchive) => {
    const text = `[ЕЖЕНЕДЕЛЬНЫЙ ОТЧЁТ ОТДЕЛА «В»]
📌 ${arch.title}
👤 Закрыл: ${arch.closedBy}
📅 Дата закрытия: ${new Date(arch.closedAt).toLocaleString('ru-RU')}
------------------------------------------
📊 СТАТИСТИКА ОТДЕЛА:
• Обработано рапортов: ${arch.reportsCount}
• Проверено отчётов: ${arch.totalCheckedReports} (x3 б. = ${arch.totalCheckedReports * 3} б.)
• Сборов людей: ${arch.totalGatherings} (x15 б. = ${arch.totalGatherings * 15} б.)
• Задержаний: ${arch.totalArrests} (x2 б. = ${arch.totalArrests * 2} б.)
• Мероприятий фракции: ${arch.totalEvents} (x10 б. = ${arch.totalEvents * 10} б.)
🏆 ИТОГО НАЧИСЛЕНО: ${arch.totalPoints} баллов

👑 ВКЛАД ИНСТРУКТОРОВ:
${arch.instructorSummary
  .map(
    (ins, idx) =>
      `${idx + 1}. ${ins.nickname} (#${ins.staticId}) — ${ins.points} б. (${ins.reportsCount} рап.)`
  )
  .join('\n')}`;

    navigator.clipboard.writeText(text);
    showToast('Сводка еженедельного отчёта скопирована для Discord', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <Archive className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Unbounded']">
                  Архив еженедельных отчётов
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {archives.length} {archives.length === 1 ? 'неделя' : archives.length > 1 && archives.length < 5 ? 'недели' : 'недель'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 font-sans">
                Сводные показатели за прошедшие недели. После подведения итогов все рапорты сохраняются здесь.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Period Selector Pills */}
            <div className="flex items-center space-x-1 p-1 bg-black border border-zinc-800 rounded-2xl text-xs font-mono shadow-inner">
              {[
                { id: 'all', label: 'Всё время' },
                { id: 'today', label: 'Сегодня' },
                { id: '7d', label: '7 дней' },
                { id: '30d', label: '30 дней' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id as typeof period)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                    period === p.id
                      ? 'bg-zinc-800 text-red-400 shadow-md border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по архиву..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3.5 py-2 rounded-2xl bg-black border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono w-44 sm:w-52"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top 2 Best Employees Banner across selected period */}
      {periodTop2Instructors.length > 0 && (
        <div className="bg-[#121212] border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Trophy className="w-6 h-6 stroke-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white font-['Unbounded']">
                  🏆 Два лучших сотрудника недели
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ТОП-2 НАГРАДЫ
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Лидеры отдела с наибольшим количеством набранных баллов за период
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {periodTop2Instructors[0] && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black border border-amber-500/50 flex items-center justify-between font-mono shadow-md relative overflow-hidden">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                    🥇
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-amber-300 font-mono tracking-wider px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 inline-block mb-1">
                      1-Е МЕСТО • ЛУЧШИЙ СОТРУДНИК
                    </span>
                    <div className="font-extrabold text-white text-sm font-sans">
                      {periodTop2Instructors[0].nickname}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ID: #{periodTop2Instructors[0].staticId} • DS: {periodTop2Instructors[0].discord}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-300">
                    +{periodTop2Instructors[0].points} б.
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {periodTop2Instructors[0].reportsCount} рапортов
                  </div>
                </div>
              </div>
            )}

            {periodTop2Instructors[1] && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/60 via-slate-800/30 to-black border border-slate-400/50 flex items-center justify-between font-mono shadow-md relative overflow-hidden">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-300 text-black font-black text-2xl flex items-center justify-center shadow-lg shrink-0">
                    🥈
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-300 font-mono tracking-wider px-2 py-0.5 rounded bg-slate-500/20 border border-slate-400/40 inline-block mb-1">
                      2-Е МЕСТО • ЛУЧШИЙ СОТРУДНИК
                    </span>
                    <div className="font-extrabold text-white text-sm font-sans">
                      {periodTop2Instructors[1].nickname}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      ID: #{periodTop2Instructors[1].staticId} • DS: {periodTop2Instructors[1].discord}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-200">
                    +{periodTop2Instructors[1].points} б.
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {periodTop2Instructors[1].reportsCount} рапортов
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main List of Archives */}
      {filteredArchives.length === 0 ? (
        <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Unbounded']">
              Архив еженедельных отчётов пуст
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 font-sans">
              После подведения итогов недели в «Штабе управления» и нажмите кнопку «Закрыть неделю» — все активные рапорты переместятся сюда.
            </p>
          </div>
          <button
            onClick={onGoToNewReport}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Сдать новый рапорт</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArchives.map((arch) => {
            const isExpanded = expandedArchiveId === arch.id;

            return (
              <div
                key={arch.id}
                className="bg-[#121212] border border-zinc-800 rounded-3xl overflow-hidden transition-all shadow-lg"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedArchiveId(isExpanded ? null : arch.id)}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-2xl bg-black border border-zinc-800 text-white shrink-0 mt-0.5">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="text-base sm:text-lg font-extrabold text-white font-['Unbounded']">
                          {arch.title}
                        </h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {arch.reportsCount} рапортов
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center space-x-3 flex-wrap gap-y-1">
                        <span>
                          Период: {new Date(arch.startDate).toLocaleDateString('ru-RU')} — {new Date(arch.endDate).toLocaleDateString('ru-RU')}
                        </span>
                        <span>•</span>
                        <span>Закрыл: <strong className="text-zinc-200">{arch.closedBy}</strong></span>
                        <span>•</span>
                        <span>{new Date(arch.closedAt).toLocaleString('ru-RU')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                    <div className="text-right font-mono">
                      <div className="text-xs text-zinc-400 uppercase tracking-wider">Всего баллов</div>
                      <div className="text-lg font-black text-white tabular-nums">
                        +{arch.totalPoints.toLocaleString('ru-RU')} б.
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-black border border-zinc-800 text-zinc-400 hover:text-white">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-800 bg-black/60 p-5 sm:p-6 space-y-6"
                    >
                      {/* Top Action Bar for Archive */}
                      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121212] p-3 rounded-2xl border border-zinc-800">
                        {/* Subtabs */}
                        <div className="flex items-center space-x-1 font-mono text-xs">
                          <button
                            onClick={() => setActiveSubTab('summary')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                              activeSubTab === 'summary'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                          >
                            Итоги и рейтинг
                          </button>
                          <button
                            onClick={() => setActiveSubTab('reports')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                              activeSubTab === 'reports'
                                ? 'bg-white text-black'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                          >
                            Список рапортов ({arch.archivedReports.length})
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopySummary(arch)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer font-mono"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Скопировать для Discord</span>
                          </button>

                          <button
                            onClick={() => {
                              exportReportsToCSV(arch.archivedReports);
                              showToast(`Архив «${arch.title}» выгружен в CSV`, 'success');
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer font-mono"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Экспорт CSV</span>
                          </button>

                          {isAdmin && onDeleteArchive && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Удалить еженедельный архив «${arch.title}»?`)) {
                                  onDeleteArchive(arch.id);
                                  showToast('Архив удалён', 'info');
                                }
                              }}
                              className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                              title="Удалить архив"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {activeSubTab === 'summary' ? (
                        <div className="space-y-6">
                          {/* 4 Counters */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                            <div className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 text-center">
                              <CheckCircle className="w-5 h-5 mx-auto mb-1 text-white" />
                              <div className="text-2xl font-black text-white tabular-nums">
                                {arch.totalCheckedReports}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">Проверено отчётов</div>
                              <div className="text-[10px] text-zinc-300 font-bold mt-1">
                                x3 б. = {arch.totalCheckedReports * 3} б.
                              </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 text-center">
                              <Users className="w-5 h-5 mx-auto mb-1 text-white" />
                              <div className="text-2xl font-black text-white tabular-nums">
                                {arch.totalGatherings}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">Сборов людей</div>
                              <div className="text-[10px] text-zinc-300 font-bold mt-1">
                                x15 б. = {arch.totalGatherings * 15} б.
                              </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 text-center">
                              <Target className="w-5 h-5 mx-auto mb-1 text-white" />
                              <div className="text-2xl font-black text-white tabular-nums">
                                {arch.totalArrests}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">Задержаний</div>
                              <div className="text-[10px] text-zinc-300 font-bold mt-1">
                                x2 б. = {arch.totalArrests * 2} б.
                              </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 text-center">
                              <CalendarCheck className="w-5 h-5 mx-auto mb-1 text-white" />
                              <div className="text-2xl font-black text-white tabular-nums">
                                {arch.totalEvents}
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5">Мероприятий фракции</div>
                              <div className="text-[10px] text-zinc-300 font-bold mt-1">
                                x10 б. = {arch.totalEvents * 10} б.
                              </div>
                            </div>
                          </div>

                          {/* Two Best Employees of this Week Highlight */}
                          {arch.instructorSummary.length > 0 && (
                            <div className="space-y-3 p-4 rounded-2xl bg-[#0e1424] border border-amber-500/30">
                              <div className="flex items-center space-x-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                                  Два лучших сотрудника этой недели
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {arch.instructorSummary[0] && (
                                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black border border-amber-500/50 flex items-center justify-between font-mono">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-2xl">🥇</div>
                                      <div>
                                        <div className="text-[10px] text-amber-300 font-bold uppercase">1-е место (Лучший)</div>
                                        <div className="font-extrabold text-white text-sm font-sans">
                                          {arch.instructorSummary[0].nickname}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                          ID: #{arch.instructorSummary[0].staticId} • DS: {arch.instructorSummary[0].discord}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-black text-amber-300">
                                        +{arch.instructorSummary[0].points} б.
                                      </div>
                                      <div className="text-[10px] text-zinc-400">
                                        {arch.instructorSummary[0].reportsCount} рапортов
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {arch.instructorSummary[1] && (
                                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900/60 via-slate-800/20 to-black border border-slate-400/50 flex items-center justify-between font-mono">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-2xl">🥈</div>
                                      <div>
                                        <div className="text-[10px] text-slate-300 font-bold uppercase">2-е место (Призёр)</div>
                                        <div className="font-extrabold text-white text-sm font-sans">
                                          {arch.instructorSummary[1].nickname}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                          ID: #{arch.instructorSummary[1].staticId} • DS: {arch.instructorSummary[1].discord}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-black text-slate-200">
                                        +{arch.instructorSummary[1].points} б.
                                      </div>
                                      <div className="text-[10px] text-zinc-400">
                                        {arch.instructorSummary[1].reportsCount} рапортов
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Instructor Leaderboard */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                              Полный список сотрудников за неделю ({arch.instructorSummary.length})
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {arch.instructorSummary.map((ins, idx) => (
                                <div
                                  key={ins.staticId}
                                  className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 flex items-center justify-between font-mono"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-xl bg-black border border-zinc-700 flex items-center justify-center font-bold text-xs text-white">
                                      #{idx + 1}
                                    </div>
                                    <div>
                                      <div className="font-bold text-white text-sm font-sans">
                                        {ins.nickname}
                                      </div>
                                      <div className="text-[11px] text-zinc-400">
                                        Static ID: #{ins.staticId} • Discord: {ins.discord}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-base font-black text-white">
                                      +{ins.points} б.
                                    </div>
                                    <div className="text-[10px] text-zinc-400">
                                      {ins.reportsCount} {ins.reportsCount === 1 ? 'рапорт' : 'рапорта'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Archived Reports List */
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {arch.archivedReports.map((rep) => {
                              const pts = calculatePoints(rep);

                              return (
                                <div
                                  key={rep.id}
                                  onClick={() => onSelectReport(rep)}
                                  className="p-4 rounded-2xl bg-[#121212] border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-bold text-white text-sm">
                                      {rep.nickname}
                                    </div>
                                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded bg-zinc-900 text-white border border-zinc-800">
                                      +{pts} б.
                                    </span>
                                  </div>

                                  <div className="text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                                    <span>ID: #{rep.userId}</span>
                                    <span>{new Date(rep.date).toLocaleString('ru-RU')}</span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1 border-t border-zinc-800/80 text-zinc-400">
                                    <div>
                                      Провер: <strong className="text-white">{rep.checkedReports ?? rep.checked ?? 0}</strong>
                                    </div>
                                    <div>
                                      Сборы: <strong className="text-white">{rep.gatherings ?? rep.gathered ?? 0}</strong>
                                    </div>
                                    <div>
                                      Задерж: <strong className="text-white">{rep.arrests ?? 0}</strong>
                                    </div>
                                    <div>
                                      МП: <strong className="text-white">{rep.events ?? rep.trainings ?? 0}</strong>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
