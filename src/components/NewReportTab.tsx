import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Users, 
  CheckCircle, 
  Target, 
  Activity, 
  Link as LinkIcon, 
  MessageSquare, 
  Plus, 
  Minus, 
  Award,
  RotateCcw,
  CalendarCheck,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Report, User } from '../types';
import { calculatePoints } from '../utils/storage';

interface NewReportTabProps {
  currentUser: User;
  onAddReport: (report: Report) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onViewHistory: () => void;
}

export const NewReportTab: React.FC<NewReportTabProps> = ({
  currentUser,
  onAddReport,
  showToast,
}) => {
  const [checkedReports, setCheckedReports] = useState<number>(0);
  const [gatherings, setGatherings] = useState<number>(0);
  const [arrests, setArrests] = useState<number>(0);
  const [events, setEvents] = useState<number>(0);
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPoints = calculatePoints({ checkedReports, gatherings, arrests, events });

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    current: number,
    amount: number
  ) => {
    setter(Math.max(0, current + amount));
  };

  const handleResetForm = () => {
    setCheckedReports(0);
    setGatherings(0);
    setArrests(0);
    setEvents(0);
    setProofUrl('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (checkedReports === 0 && gatherings === 0 && arrests === 0 && events === 0) {
      showToast('Заполните хотя бы один пункт активности!', 'error');
      return;
    }

    setIsSubmitting(true);

    const newReport: Report = {
      id: `rep-${Date.now()}`,
      userId: currentUser.staticId,
      nickname: currentUser.nickname,
      discord: currentUser.discord,
      date: new Date().toISOString(),
      checkedReports: Number(checkedReports) || 0,
      gatherings: Number(gatherings) || 0,
      arrests: Number(arrests) || 0,
      events: Number(events) || 0,
      checked: Number(checkedReports) || 0,
      gathered: Number(gatherings) || 0,
      trainings: Number(events) || 0,
      proofUrl: proofUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'approved',
      reviewedBy: 'Система (Автоматически)',
      reviewedAt: new Date().toISOString(),
      reviewComment: 'Автоматически принят в ведомость',
    };

    setTimeout(() => {
      onAddReport(newReport);
      handleResetForm();
      setIsSubmitting(false);
      showToast(`Рапорт на +${totalPoints} б. успешно сдан и принят!`, 'success');
    }, 150);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro Header Banner */}
      <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg shrink-0">
              <FileText className="w-6 h-6 stroke-white dark:stroke-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-['Syne']">
                  Сдача рапорта инструктора
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-1 font-mono">
                <span>Инструктор: <strong className="text-slate-800 dark:text-zinc-200">{currentUser.nickname}</strong></span>
                <span aria-hidden="true">·</span>
                <span>ID: #{currentUser.staticId}</span>
              </div>
            </div>
          </div>

          {/* Points Preview Badge */}
          <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 shadow-inner self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-zinc-400 font-mono">
              <Award className="w-4 h-4 text-slate-900 dark:text-white" />
              <span>Расчёт баллов:</span>
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tabular-nums">
              +{totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Main Form with 4 Official Categories */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Проверенный отчёт на повышение — 3 балла */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label className="flex items-center text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white mr-3">
                <CheckCircle className="w-5 h-5 stroke-slate-900 dark:stroke-white" />
              </div>
              <div>
                <span>Проверенный отчёт на повышение</span>
                <span className="block text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  +3 балла за каждый отчёт
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => adjustValue(setCheckedReports, checkedReports, -1)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setCheckedReports, checkedReports, 1)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setCheckedReports, checkedReports, 5)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>

          <input
            type="number"
            min="0"
            value={checkedReports === 0 ? '' : checkedReports}
            onChange={(e) => setCheckedReports(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0 проверенных отчётов"
            className="w-full text-base sm:text-lg font-bold bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 font-mono tabular-nums transition-colors"
          />
        </div>

        {/* 2. Сборы людей на бизаки, тайники и т.д — 15 баллов */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label className="flex items-center text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white mr-3">
                <Users className="w-5 h-5 stroke-slate-900 dark:stroke-white" />
              </div>
              <div>
                <span>Сборы людей на бизаки, тайники и т.д.</span>
                <span className="block text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  +15 баллов за каждый сбор
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => adjustValue(setGatherings, gatherings, -1)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setGatherings, gatherings, 1)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setGatherings, gatherings, 3)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +3
              </button>
            </div>
          </div>

          <input
            type="number"
            min="0"
            value={gatherings === 0 ? '' : gatherings}
            onChange={(e) => setGatherings(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0 проведённых сборов"
            className="w-full text-base sm:text-lg font-bold bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 font-mono tabular-nums transition-colors"
          />
        </div>

        {/* 3. Задержание — 2 балла */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label className="flex items-center text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white mr-3">
                <Target className="w-5 h-5 stroke-slate-900 dark:stroke-white" />
              </div>
              <div>
                <span>Задержание нарушителей / подозреваемых</span>
                <span className="block text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  +2 балла за каждое задержание
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => adjustValue(setArrests, arrests, -1)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setArrests, arrests, 1)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setArrests, arrests, 5)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +5
              </button>
            </div>
          </div>

          <input
            type="number"
            min="0"
            value={arrests === 0 ? '' : arrests}
            onChange={(e) => setArrests(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0 оформленных задержаний"
            className="w-full text-base sm:text-lg font-bold bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 font-mono tabular-nums transition-colors"
          />
        </div>

        {/* 4. Присутствие на мероприятии от фракции — 10 баллов */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label className="flex items-center text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-black border border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white mr-3">
                <CalendarCheck className="w-5 h-5 stroke-slate-900 dark:stroke-white" />
              </div>
              <div>
                <span>Присутствие на мероприятии от фракции</span>
                <span className="block text-xs font-mono font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
                  +10 баллов за мероприятие
                </span>
              </div>
            </label>

            <div className="flex items-center space-x-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => adjustValue(setEvents, events, -1)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-black hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setEvents, events, 1)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustValue(setEvents, events, 2)}
                className="px-3 h-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-600 text-slate-900 dark:text-white font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                +2
              </button>
            </div>
          </div>

          <input
            type="number"
            min="0"
            value={events === 0 ? '' : events}
            onChange={(e) => setEvents(Math.max(0, parseInt(e.target.value, 10) || 0))}
            placeholder="0 посещённых мероприятий"
            className="w-full text-base sm:text-lg font-bold bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 font-mono tabular-nums transition-colors"
          />
        </div>

        {/* Proof URL & Comment */}
        <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <label className="flex items-center text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-mono">
              <LinkIcon className="w-4 h-4 mr-1.5 text-slate-900 dark:text-white" />
              Ссылка на фото / видеофиксацию (Imgur / Yapx / Discord)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://yapx.ru/album/... или https://imgur.com/..."
              className="w-full text-sm bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="flex items-center text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-mono">
              <MessageSquare className="w-4 h-4 mr-1.5 text-slate-900 dark:text-white" />
              Примечание к смене (необязательно)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Краткие детали дежурства или особенности проведённой работы..."
              className="w-full text-sm bg-slate-50 dark:bg-black border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:border-slate-500 dark:focus:border-zinc-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.015, translateY: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl font-black text-sm sm:text-base text-white dark:text-black bg-slate-900 dark:bg-gradient-to-r dark:from-white dark:via-zinc-100 dark:to-zinc-200 hover:bg-slate-800 dark:hover:from-zinc-100 dark:hover:to-white shadow-[0_0_25px_rgba(0,0,0,0.15)] dark:shadow-[0_0_25px_rgba(255,255,255,0.2)] border border-slate-800 dark:border-white flex items-center justify-center space-x-2.5 transition-all cursor-pointer disabled:opacity-50 font-['Syne'] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <ShieldCheck className="w-5 h-5 stroke-[2.5] text-white dark:text-black group-hover:scale-110 transition-transform relative z-10" />
            <span className="tracking-wide relative z-10">{isSubmitting ? 'Регистрация рапорта...' : 'Сдать рапорт в ведомость'}</span>
          </motion.button>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto py-4 px-5 rounded-2xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-900/90 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Очистить форму</span>
          </button>
        </div>
      </form>
    </div>
  );
};
