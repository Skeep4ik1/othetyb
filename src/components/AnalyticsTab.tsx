import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  Target, 
  Award, 
  Trophy, 
  Crown, 
  Download,
  Layers,
  Sparkles,
  CalendarCheck,
  ShieldCheck
} from 'lucide-react';
import { Report } from '../types';
import { StatCard } from './StatCard';
import { calculatePoints, exportReportsToCSV } from '../utils/storage';

interface AnalyticsTabProps {
  reports: Report[];
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ reports, showToast }) => {
  const stats = useMemo(() => {
    const uniqueRepMap = new Map<string, Report>();
    (reports || []).forEach((r) => { if (r && r.id) uniqueRepMap.set(r.id, r); });
    const uniqueReports = Array.from(uniqueRepMap.values());

    const totalCheckedReports = uniqueReports.reduce(
      (sum, r) => sum + (r.checkedReports ?? r.checked ?? 0),
      0
    );
    const totalGatherings = uniqueReports.reduce(
      (sum, r) => sum + (r.gatherings ?? r.gathered ?? 0),
      0
    );
    const totalArrests = uniqueReports.reduce(
      (sum, r) => sum + (r.arrests ?? 0),
      0
    );
    const totalEvents = uniqueReports.reduce(
      (sum, r) => sum + (r.events ?? r.trainings ?? 0),
      0
    );
    const totalPoints = uniqueReports.reduce((sum, r) => sum + calculatePoints(r), 0);

    // Leaderboard by instructor
    const instructorMap = new Map<
      string,
      {
        nickname: string;
        staticId: string;
        discord: string;
        checkedReports: number;
        gatherings: number;
        arrests: number;
        events: number;
        points: number;
        reportsCount: number;
      }
    >();

    uniqueReports.forEach((r) => {
      const existing = instructorMap.get(r.userId) || {
        nickname: r.nickname,
        staticId: r.userId,
        discord: r.discord,
        checkedReports: 0,
        gatherings: 0,
        arrests: 0,
        events: 0,
        points: 0,
        reportsCount: 0,
      };

      existing.checkedReports += r.checkedReports ?? r.checked ?? 0;
      existing.gatherings += r.gatherings ?? r.gathered ?? 0;
      existing.arrests += r.arrests ?? 0;
      existing.events += r.events ?? r.trainings ?? 0;
      existing.points += calculatePoints(r);
      existing.reportsCount += 1;

      instructorMap.set(r.userId, existing);
    });

    const leaderboard = Array.from(instructorMap.values()).sort(
      (a, b) => b.points - a.points
    );

    // Distribution percentages
    const totalActions =
      totalCheckedReports + totalGatherings + totalArrests + totalEvents;
    const checkedPercent = totalActions > 0 ? Math.round((totalCheckedReports / totalActions) * 100) : 0;
    const gatheringsPercent = totalActions > 0 ? Math.round((totalGatherings / totalActions) * 100) : 0;
    const arrestsPercent = totalActions > 0 ? Math.round((totalArrests / totalActions) * 100) : 0;
    const eventsPercent = totalActions > 0 ? Math.round((totalEvents / totalActions) * 100) : 0;

    return {
      totalCheckedReports,
      totalGatherings,
      totalArrests,
      totalEvents,
      totalPoints,
      leaderboard,
      checkedPercent,
      gatheringsPercent,
      arrestsPercent,
      eventsPercent,
      activeInstructorsCount: instructorMap.size,
      reportsCount: reports.length,
    };
  }, [reports]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header and Export Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black shadow-lg shrink-0">
            <BarChart3 className="w-6 h-6 stroke-black" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne']">
              Аналитика и фонд баллов отдела «В»
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Сводный учёт нормы активности по официальной балловой системе
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            exportReportsToCSV(reports);
            showToast('Отчёт сформирован и загружен в CSV', 'success');
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-black hover:bg-zinc-800 border border-zinc-700 text-white transition-colors shadow-sm cursor-pointer self-start sm:self-auto font-mono"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Скачать ведомость (CSV)</span>
        </button>
      </div>

      {/* 4 Official Activity Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Проверенный отчёт на повышение — 3 балла */}
        <StatCard
          icon={CheckCircle}
          title="Проверено отчётов"
          value={stats.totalCheckedReports}
          subtitle="3 балла за каждый отчёт"
          colorClass="bg-black text-white"
        />

        {/* 2. Сборы людей на бизаки, тайники и т.д — 15 баллов */}
        <StatCard
          icon={Users}
          title="Сборы (бизаки/тайники)"
          value={stats.totalGatherings}
          subtitle="15 баллов за каждый сбор"
          colorClass="bg-black text-white"
        />

        {/* 3. Задержание — 2 балла */}
        <StatCard
          icon={Target}
          title="Задержания"
          value={stats.totalArrests}
          subtitle="2 балла за задержание"
          colorClass="bg-black text-white"
        />

        {/* 4. Присутствие на мероприятии от фракции — 10 баллов */}
        <StatCard
          icon={CalendarCheck}
          title="Мероприятия фракции"
          value={stats.totalEvents}
          subtitle="10 баллов за мероприятие"
          colorClass="bg-black text-white"
        />
      </div>

      {/* Total Score Summary Ribbon */}
      <div className="p-5 rounded-3xl bg-[#121212] border border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-black border border-zinc-700 text-white font-black">
            <Award className="w-6 h-6 stroke-white" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400">
              Суммарный фонд баллов личного состава
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
              {stats.totalPoints.toLocaleString('ru-RU')} баллов
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-400 bg-black px-4 py-2 rounded-2xl border border-zinc-800 font-mono">
          Активных инструкторов: <strong className="text-white font-bold">{stats.activeInstructorsCount}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboard */}
        <div className="lg:col-span-2 bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-base sm:text-lg text-white font-['Syne']">
                Рейтинг активности инструкторов
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              По сумме баллов
            </span>
          </div>

          <div className="space-y-2.5">
            {stats.leaderboard.length === 0 ? (
              <div className="p-10 text-center text-zinc-500 text-xs font-mono">
                Пока нет сданных рапортов. Статистика появится автоматически после первой сдачи отчёта.
              </div>
            ) : (
              stats.leaderboard.map((instructor, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                return (
                  <div
                    key={instructor.staticId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isFirst
                        ? 'bg-zinc-900 border-white text-white'
                        : isSecond
                        ? 'bg-black border-zinc-700'
                        : isThird
                        ? 'bg-black border-zinc-800'
                        : 'bg-black/60 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Rank Badge */}
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                        {isFirst && <span className="text-xl">🥇</span>}
                        {isSecond && <span className="text-xl">🥈</span>}
                        {isThird && <span className="text-xl">🥉</span>}
                        {!isFirst && !isSecond && !isThird && (
                          <span className="text-zinc-500 text-xs font-mono font-bold">
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm sm:text-base">
                            {instructor.nickname}
                          </span>
                          {isFirst && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black border border-white flex items-center">
                              <Crown className="w-3 h-3 mr-1 text-black fill-black" /> ТОП-1
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          ID: #{instructor.staticId} · DS: {instructor.discord}
                        </div>
                      </div>
                    </div>

                    {/* Instructor Breakdown and Points */}
                    <div className="flex items-center justify-between sm:justify-end space-x-4 pl-11 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                        <span>{instructor.checkedReports} отч.</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>{instructor.gatherings} сб.</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>{instructor.arrests} зад.</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>{instructor.events} мер.</span>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-base sm:text-lg font-black text-white tabular-nums">
                          +{instructor.points} б.
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {instructor.reportsCount} смен
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Activity Structure */}
        <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Layers className="w-5 h-5 text-white" />
              <h3 className="font-extrabold text-base text-white font-['Syne']">
                Структура деятельности
              </h3>
            </div>

            {/* 4 Progress Bars */}
            <div className="space-y-4">
              {/* 1. Отчёты */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
                  <span className="text-zinc-200 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-white" /> Отчёты (3 б.)
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {stats.checkedPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${stats.checkedPercent}%` }}
                  />
                </div>
              </div>

              {/* 2. Сборы */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
                  <span className="text-zinc-200 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-white" /> Сборы бизаки/тайники (15 б.)
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {stats.gatheringsPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-zinc-300 rounded-full transition-all duration-500"
                    style={{ width: `${stats.gatheringsPercent}%` }}
                  />
                </div>
              </div>

              {/* 3. Задержания */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
                  <span className="text-zinc-200 flex items-center">
                    <Target className="w-3.5 h-3.5 mr-1 text-white" /> Задержания (2 б.)
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {stats.arrestsPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-zinc-400 rounded-full transition-all duration-500"
                    style={{ width: `${stats.arrestsPercent}%` }}
                  />
                </div>
              </div>

              {/* 4. Мероприятия */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
                  <span className="text-zinc-200 flex items-center">
                    <CalendarCheck className="w-3.5 h-3.5 mr-1 text-white" /> Мероприятия фракции (10 б.)
                  </span>
                  <span className="text-zinc-400 tabular-nums">
                    {stats.eventsPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-zinc-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.eventsPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tariffs Legend Box */}
          <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-xs font-mono space-y-1.5">
            <div className="font-bold text-white flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-white mr-1.5" />
              Тарифная сетка отдела «В»:
            </div>
            <div className="text-zinc-400 text-[11px] leading-relaxed space-y-1 mt-2">
              <div>• Проверенный отчёт: <strong className="text-white">3 балла</strong></div>
              <div>• Сбор (бизаки/тайники): <strong className="text-white">15 баллов</strong></div>
              <div>• Задержание: <strong className="text-white">2 балла</strong></div>
              <div>• Мероприятие фракции: <strong className="text-white">10 баллов</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
