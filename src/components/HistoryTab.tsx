import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  History, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Award, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Report, User, ReportStatus, WeeklyArchive } from '../types';
import { calculatePoints } from '../utils/storage';

interface HistoryTabProps {
  currentUser: User;
  reports: Report[];
  archives?: WeeklyArchive[];
  onSelectReport: (report: Report) => void;
  onDeleteReport: (reportId: string) => void;
  onGoToNewReport: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  currentUser,
  reports,
  archives = [],
  onSelectReport,
  onDeleteReport,
  onGoToNewReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d'>('all');

  // Filter user's own reports (both active week and archived weeks)
  const myReports = useMemo(() => {
    const activeUserReports = reports
      .filter((r) => r.userId === currentUser.staticId)
      .map((r) => ({ ...r, isArchived: false, archiveTitle: undefined }));

    const archivedUserReports: (Report & { isArchived?: boolean; archiveTitle?: string })[] = [];
    (archives || []).forEach((a) => {
      (a.archivedReports || []).forEach((r) => {
        if (r.userId === currentUser.staticId) {
          archivedUserReports.push({
            ...r,
            isArchived: true,
            archiveTitle: a.title,
          });
        }
      });
    });

    // Deduplicate by report id (active preferred)
    const map = new Map<string, Report & { isArchived?: boolean; archiveTitle?: string }>();
    archivedUserReports.forEach((r) => map.set(r.id, r));
    activeUserReports.forEach((r) => map.set(r.id, r));

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reports, archives, currentUser.staticId]);

  // Aggregate personal metrics
  const personalStats = useMemo(() => {
    const totalCount = myReports.length;
    const totalPoints = myReports.reduce((sum, r) => sum + calculatePoints(r), 0);
    const approvedCount = myReports.filter((r) => r.status === 'approved').length;
    const totalChecked = myReports.reduce((sum, r) => sum + (r.checkedReports ?? r.checked ?? 0), 0);
    const totalGatherings = myReports.reduce((sum, r) => sum + (r.gatherings ?? r.gathered ?? 0), 0);
    const totalArrests = myReports.reduce((sum, r) => sum + (r.arrests ?? 0), 0);
    const totalEvents = myReports.reduce((sum, r) => sum + (r.events ?? r.trainings ?? 0), 0);

    return {
      totalCount,
      totalPoints,
      approvedCount,
      totalChecked,
      totalGatherings,
      totalArrests,
      totalEvents,
    };
  }, [myReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return myReports.filter((r) => {
      // Time filter
      if (timeFilter !== 'all') {
        const reportTime = new Date(r.date).getTime();
        const days = timeFilter === '7d' ? 7 : 30;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (reportTime < cutoff) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNote = r.notes ? r.notes.toLowerCase().includes(q) : false;
        const matchDate = new Date(r.date).toLocaleDateString('ru-RU').includes(q);
        return matchNote || matchDate;
      }

      return true;
    });
  }, [myReports, timeFilter, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Personal Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-[#121212] border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            Сдано смен
          </div>
          <div className="text-3xl font-black text-white mt-1 font-mono tabular-nums">
            {personalStats.totalCount}
          </div>
          <div className="text-[11px] text-zinc-300 font-medium mt-1 flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1 text-white" /> Принято в ведомость
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#121212] border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            Заработано баллов
          </div>
          <div className="text-3xl font-black text-white mt-1 font-mono tabular-nums">
            +{personalStats.totalPoints}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {personalStats.totalPoints > 0 ? (
              <span className="text-white font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> Активный статус
              </span>
            ) : (
              'Фонд смен'
            )}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#121212] border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            Проверено отчётов
          </div>
          <div className="text-3xl font-black text-white mt-1 font-mono tabular-nums">
            {personalStats.totalChecked}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            На сумму {personalStats.totalChecked * 3} б.
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#121212] border border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
            Сборы & Задержания
          </div>
          <div className="text-3xl font-black text-white mt-1 font-mono tabular-nums">
            {personalStats.totalGatherings + personalStats.totalArrests}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 font-mono">
            {personalStats.totalGatherings} сб. / {personalStats.totalArrests} зад.
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Поиск по комментариям или дате смены..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-black border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center space-x-1 bg-black p-1 rounded-2xl border border-zinc-800 text-xs">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-white text-black font-bold shadow-xs border border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Всё время
            </button>
            <button
              onClick={() => setTimeFilter('7d')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                timeFilter === '7d'
                  ? 'bg-white text-black font-bold shadow-xs border border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 дней
            </button>
            <button
              onClick={() => setTimeFilter('30d')}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                timeFilter === '30d'
                  ? 'bg-white text-black font-bold shadow-xs border border-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              30 дней
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-black border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-['Syne']">
              {myReports.length === 0 ? 'У вас пока нет сданных рапортов' : 'По вашему запросу ничего не найдено'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              {myReports.length === 0
                ? 'Заполните форму во вкладке "Сдать рапорт", чтобы зафиксировать проведённую работу.'
                : 'Попробуйте изменить параметры поиска или временной интервал.'}
            </p>
          </div>
          {myReports.length === 0 && (
            <button
              onClick={onGoToNewReport}
              className="px-5 py-2.5 rounded-2xl font-bold text-xs bg-white text-black hover:bg-zinc-200 shadow-md transition-all active:scale-95 cursor-pointer font-['Syne']"
            >
              Сдать первый рапорт
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const points = calculatePoints(report);
            const checked = report.checkedReports ?? report.checked ?? 0;
            const gatherings = report.gatherings ?? report.gathered ?? 0;
            const arrests = report.arrests ?? 0;
            const events = report.events ?? report.trainings ?? 0;

            return (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                className="bg-[#0c1222]/80 hover:bg-[#0c1222] border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-xs transition-all cursor-pointer"
                onClick={() => onSelectReport(report)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5" />
                    </div>

                    <div>
                      {/* Zero-pill unboxed header */}
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 flex-wrap">
                        <span className="text-slate-200 font-semibold flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          {new Date(report.date).toLocaleDateString('ru-RU')} в{' '}
                          {new Date(report.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-blue-400 font-medium">Принят в ведомость</span>
                        {(report as any).archiveTitle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              📁 {(report as any).archiveTitle}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Clean stats breakdown */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-2 font-mono">
                        {checked > 0 && <span>Отчёты: <strong className="text-blue-400">{checked}</strong></span>}
                        {gatherings > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span>Сборы: <strong className="text-red-400">{gatherings}</strong></span>
                          </>
                        )}
                        {arrests > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span>Задержания: <strong className="text-red-400">{arrests}</strong></span>
                          </>
                        )}
                        {events > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span>Мероприятия: <strong className="text-purple-400">{events}</strong></span>
                          </>
                        )}
                      </div>

                      {/* Note snippet */}
                      {report.notes && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">
                          «{report.notes}»
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Points and Chevron */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right font-mono">
                      <div className="text-base sm:text-lg font-black text-red-400 tabular-nums">
                        +{points} б.
                      </div>
                    </div>

                    <div className="p-1.5 text-slate-500">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
