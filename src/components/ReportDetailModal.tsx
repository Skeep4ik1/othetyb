import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  Users, 
  FileCheck, 
  Target, 
  Award,
  Copy,
  CalendarCheck,
  Trash2
} from 'lucide-react';
import { Report, User } from '../types';
import { SUPER_ADMIN_ID, calculatePoints } from '../utils/storage';

interface ReportDetailModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  isAdmin?: boolean;
  onDeleteReport?: (reportId: string) => void;
  onStatusChange?: (reportId: string, newStatus: 'approved' | 'rejected', comment?: string) => void;
  onCopyNotice?: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  currentUser,
  onDeleteReport,
  onCopyNotice,
}) => {
  if (!isOpen || !report) return null;

  const isCurator = currentUser?.role === 'superadmin' || currentUser?.staticId === SUPER_ADMIN_ID;
  const points = calculatePoints(report);

  const checkedCount = report.checkedReports ?? report.checked ?? 0;
  const gatheringsCount = report.gatherings ?? report.gathered ?? 0;
  const arrestsCount = report.arrests ?? 0;
  const eventsCount = report.events ?? report.trainings ?? 0;

  const handleCopy = () => {
    const text = `[Рапорт Управление «В»]
Инструктор: ${report.nickname} (Static ID: ${report.userId})
Discord: ${report.discord}
Дата: ${new Date(report.date).toLocaleString('ru-RU')}
Проверено отчётов на повышение: ${checkedCount} (x3 б. = ${checkedCount * 3} б.)
Сборы на бизаки, тайники: ${gatheringsCount} (x15 б. = ${gatheringsCount * 15} б.)
Задержания: ${arrestsCount} (x2 б. = ${arrestsCount * 2} б.)
Присутствие на мероприятиях: ${eventsCount} (x10 б. = ${eventsCount * 10} б.)
ИТОГО НАЧИСЛЕНО: ${points} баллов
Статус: Принят в ведомость
${report.proofUrl ? `Доказательства: ${report.proofUrl}` : ''}
${report.notes ? `Примечание: ${report.notes}` : ''}`;

    navigator.clipboard.writeText(text);
    if (onCopyNotice) onCopyNotice();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-[#121212] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white text-black border border-white flex items-center justify-center font-bold">
                {report.nickname.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-white leading-tight font-['Syne']">
                  {report.nickname}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  ID: #{report.userId} · Discord: {report.discord}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Status and timestamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black border border-zinc-800 text-xs font-mono">
              <div className="flex items-center space-x-2 text-zinc-400">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span>{new Date(report.date).toLocaleString('ru-RU')}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-zinc-500">Статус:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-white border border-zinc-600">
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-white" /> Принят в ведомость
                </span>
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
              <div className="p-3 rounded-2xl bg-black border border-zinc-800 text-center">
                <FileCheck className="w-4 h-4 mx-auto mb-1 text-white" />
                <div className="text-lg font-bold text-white tabular-nums">{checkedCount}</div>
                <div className="text-[10px] text-zinc-400">Отчёты (x3 б.)</div>
              </div>

              <div className="p-3 rounded-2xl bg-black border border-zinc-800 text-center">
                <Users className="w-4 h-4 mx-auto mb-1 text-white" />
                <div className="text-lg font-bold text-white tabular-nums">{gatheringsCount}</div>
                <div className="text-[10px] text-zinc-400">Сборы (x15 б.)</div>
              </div>

              <div className="p-3 rounded-2xl bg-black border border-zinc-800 text-center">
                <Target className="w-4 h-4 mx-auto mb-1 text-white" />
                <div className="text-lg font-bold text-white tabular-nums">{arrestsCount}</div>
                <div className="text-[10px] text-zinc-400">Задержания (x2 б.)</div>
              </div>

              <div className="p-3 rounded-2xl bg-black border border-zinc-800 text-center">
                <CalendarCheck className="w-4 h-4 mx-auto mb-1 text-white" />
                <div className="text-lg font-bold text-white tabular-nums">{eventsCount}</div>
                <div className="text-[10px] text-zinc-400">Мероприятия (x10 б.)</div>
              </div>
            </div>

            {/* Score points banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black border border-zinc-700 font-mono">
              <div className="flex items-center space-x-2 text-zinc-200 font-medium text-xs sm:text-sm">
                <Award className="w-5 h-5 text-white" />
                <span>Всего начислено баллов:</span>
              </div>
              <span className="text-xl font-black text-white tabular-nums">
                +{points} баллов
              </span>
            </div>

            {/* Notes */}
            {report.notes && (
              <div>
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                  Примечание инструктора
                </h4>
                <div className="p-3.5 rounded-2xl bg-black border border-zinc-800 text-sm text-zinc-200">
                  {report.notes}
                </div>
              </div>
            )}

            {/* Proof Url */}
            {report.proofUrl && (
              <div>
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                  Доказательства фиксации
                </h4>
                <a
                  href={report.proofUrl.startsWith('http') ? report.proofUrl : `https://${report.proofUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs font-mono text-white hover:underline break-all bg-black px-3.5 py-2.5 rounded-xl border border-zinc-800"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>{report.proofUrl}</span>
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-black gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white transition-colors p-1 cursor-pointer font-mono"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать</span>
              </button>

              {isCurator && onDeleteReport && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Вы уверены, что хотите удалить рапорт сотрудника ${report.nickname} (#${report.userId})?`
                      )
                    ) {
                      onDeleteReport(report.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white transition-all cursor-pointer font-sans"
                  title="Удалить рапорт (Только для Куратора)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить рапорт</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
