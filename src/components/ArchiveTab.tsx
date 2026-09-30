import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderArchive, 
  Calendar, 
  Search, 
  Award, 
  Users, 
  CheckCircle, 
  Target, 
  CalendarCheck, 
  ChevronRight, 
  Download, 
  Trash2, 
  X, 
  Crown,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { WeeklyArchive, Report, User } from '../types';
import { calculatePoints, exportReportsToCSV } from '../utils/storage';

interface ArchiveTabProps {
  archives: WeeklyArchive[];
  currentUser: User;
  isAdmin: boolean;
  onSelectReport: (report: Report) => void;
  onDeleteArchive?: (archiveId: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({
  archives,
  currentUser,
  isAdmin,
  onSelectReport,
  onDeleteArchive,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<WeeklyArchive | null>(null);

  const filteredArchives = useMemo(() => {
    return archives
      .filter((arch) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = arch.title.toLowerCase().includes(q);
          const matchClosedBy = arch.closedBy.toLowerCase().includes(q);
          const matchInstructor = arch.instructorSummary.some(
            (i) => i.nickname.toLowerCase().includes(q) || i.staticId.includes(q)
          );
          return matchTitle || matchClosedBy || matchInstructor;
        }
        return true;
      })
      .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());
  }, [archives, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <FolderArchive className="w-6 h-6 stroke-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Unbounded']">
                  Еженедельные архивы
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {archives.length} АРХИВОВ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Реестр закрытых еженедельных отчётов, рейтинги и архивные ведомости
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по названию недели, автору или инструкторам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-black border border-zinc-800 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
          />
        </div>
      </div>

      {/* Archives List */}
      {filteredArchives.length === 0 ? (
        <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-black border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
            <FolderArchive className="w-7 h-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-white font-['Unbounded']">
            Архивные недели не найдены
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-mono">
            Еженедельные отчёты архивируются руководством из вкладки «Штаб управления» после каждого подведения итогов недели.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArchives.map((arch) => (
            <motion.div
              key={arch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#121212] border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 sm:p-6 shadow-sm transition-all space-y-4"
            >
              {/* Card Top: Title, Date, ClosedBy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-black border border-zinc-700 text-white">
                      <Calendar className="w-4 h-4 stroke-white" />
                    </span>
                    <h3 className="font-extrabold text-base sm:text-lg text-white font-['Unbounded']">
                      {arch.title}
                    </h3>
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center space-x-2">
                    <span>Закрыл: <strong className="text-zinc-200">{arch.closedBy}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(arch.closedAt).toLocaleString('ru-RU')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => {
                      exportReportsToCSV(arch.archivedReports);
                      showToast(`Экспортирован архив «${arch.title}»`, 'success');
                    }}
                    className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
                    title="Скачать CSV этой недели"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {isAdmin && onDeleteArchive && (
                    <button
                      onClick={() => {
                        if (confirm(`Удалить архив «${arch.title}»?`)) {
                          onDeleteArchive(arch.id);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-black border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
                      title="Удалить этот архив"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedArchive(arch)}
                    className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors flex items-center space-x-1.5 cursor-pointer font-sans"
                  >
                    <span>Открыть архив</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Всего баллов:</div>
                  <div className="font-extrabold text-white text-base mt-0.5 tabular-nums">
                    +{arch.totalPoints} б.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Рапортов за неделю:</div>
                  <div className="font-extrabold text-white text-base mt-0.5 tabular-nums">
                    {arch.reportsCount} шт.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Сборов:</div>
                  <div className="font-extrabold text-white text-base mt-0.5 tabular-nums">
                    {arch.totalGatherings} шт.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">Задержаний:</div>
                  <div className="font-extrabold text-white text-base mt-0.5 tabular-nums">
                    {arch.totalArrests} шт.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black border border-zinc-800 col-span-2 sm:col-span-1">
                  <div className="text-zinc-400 text-[10px]">Мероприятий:</div>
                  <div className="font-extrabold text-white text-base mt-0.5 tabular-nums">
                    {arch.totalEvents} шт.
                  </div>
                </div>
              </div>

              {/* Top Instructors Preview */}
              {arch.instructorSummary.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 font-mono">
                    Лидеры недели:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {arch.instructorSummary.slice(0, 3).map((inst, idx) => (
                      <div
                        key={inst.staticId}
                        className="px-3 py-1.5 rounded-xl bg-black border border-zinc-800 text-xs font-mono flex items-center space-x-2"
                      >
                        <span className="text-xs">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-bold text-white">{inst.nickname}</span>
                        <span className="text-zinc-400 text-[11px]">+{inst.points} б.</span>
                      </div>
                    ))}
                    {arch.instructorSummary.length > 3 && (
                      <span className="text-xs text-zinc-500 font-mono">
                        +{arch.instructorSummary.length - 3} других сотрудников
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Archive Full View Modal */}
      <AnimatePresence>
        {selectedArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl bg-[#121212] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-black">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-md">
                    <FolderArchive className="w-6 h-6 stroke-black" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg font-['Unbounded']">
                      {selectedArchive.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Закрыл: {selectedArchive.closedBy} · {new Date(selectedArchive.closedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedArchive(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Score Banner */}
                <div className="p-4 rounded-2xl bg-black border border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      Итоговый фонд еженедельного отчёта
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Сдано рапортов: <strong className="text-white">{selectedArchive.reportsCount}</strong> · Сборов: <strong className="text-white">{selectedArchive.totalGatherings}</strong> · Задержаний: <strong className="text-white">{selectedArchive.totalArrests}</strong>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white tabular-nums">
                    +{selectedArchive.totalPoints} баллов
                  </div>
                </div>

                {/* Instructors Ranking Table for this Archived Week */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                    Итоговый рейтинг активности за неделю ({selectedArchive.instructorSummary.length})
                  </h4>

                  <div className="space-y-2">
                    {selectedArchive.instructorSummary.map((inst, idx) => (
                      <div
                        key={inst.staticId}
                        className="p-3.5 rounded-2xl bg-black border border-zinc-800 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 text-center font-bold text-zinc-400">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {inst.nickname}
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              ID: #{inst.staticId} · DS: {inst.discord}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-extrabold text-white text-sm tabular-nums">
                            +{inst.points} б.
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {inst.reportsCount} смен ({inst.checkedReports} отч. / {inst.gatherings} сб. / {inst.arrests} зад.)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Archived Individual Reports List */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 font-mono">
                    Архивные рапорты недели ({selectedArchive.archivedReports.length})
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedArchive.archivedReports.map((rep) => {
                      const pts = calculatePoints(rep);
                      return (
                        <div
                          key={rep.id}
                          onClick={() => {
                            setSelectedArchive(null);
                            onSelectReport(rep);
                          }}
                          className="p-3 rounded-xl bg-black border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5">
                            <span className="text-white font-bold">✓</span>
                            <div>
                              <div className="font-semibold text-zinc-200 font-mono">
                                {rep.nickname} (#{rep.userId}) · {new Date(rep.date).toLocaleDateString('ru-RU')}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Отч: {rep.checkedReports ?? rep.checked ?? 0} · Сбор: {rep.gatherings ?? rep.gathered ?? 0} · Зад: {rep.arrests ?? 0}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 font-mono">
                            <span className="font-bold text-white">
                              +{pts} б.
                            </span>
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-black">
                <button
                  onClick={() => {
                    exportReportsToCSV(selectedArchive.archivedReports);
                    showToast(`Ведомость недели «${selectedArchive.title}» загружена`, 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 cursor-pointer font-mono"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать ведомость (CSV)</span>
                </button>

                <button
                  onClick={() => setSelectedArchive(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
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
