import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Award, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';

export const InfoTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'Как правильно сдавать еженедельный отчёт?',
      a: 'Отчёт сдаётся в конце рабочей недели до подведения итогов. Для каждой категории (проверка отчётов, сборы, задержания, мероприятия) указывайте точное количество выполненных действий и прикрепляйте рабочую ссылку на фото/видео фиксацию (Imgur, Yandex.Disk, YouTube и т.д.).'
    },
    {
      q: 'Какая норма баллов за неделю?',
      a: 'Каждый инструктор должен стремиться к максимальной продуктивности. Баллы начисляются строго по фиксированной системе тарифных ставок. В конце недели руководству передаётся итоговый список с баллами всех сотрудников.'
    },
    {
      q: 'За что отклоняется рапорт?',
      a: 'Рапорт может быть отклонён руководству при отсутствии доказательств, предоставлении некорректных ссылок, фальсификации данных или указании работы, выполненной за пределами отчётной недели.'
    },
    {
      q: 'Как вычисляются два лучших сотрудника недели?',
      a: 'Система автоматически рассчитывает суммарное количество баллов за выбранную неделю или период. Автоматически выделяются 1-е место (Золото 🥇) и 2-е место (Серебро 🥈) в Архиве недель.'
    },
    {
      q: 'Что делать, если возникла ошибка при входе или отправке?',
      a: 'Проверьте свой Статический ID и пароль. Если проблема сохраняется, обратитесь к Заместителю или Начальнику Управления «В» через Discord.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Справочный раздел · Управление «В» ФСБ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Syne']">
              Регламент и информация для инструкторов
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-sans">
              Полный справочник по системе оценивания, начислению баллов, правилам подачи отчётности и структуре руководства Управления «В».
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
              <span className="block text-xl font-extrabold text-white font-mono">15 б.</span>
              <span className="text-[11px] text-zinc-400 font-mono">Макс. ставка</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center">
              <span className="block text-xl font-extrabold text-sky-400 font-mono">4 кат.</span>
              <span className="text-[11px] text-zinc-400 font-mono">Деятельности</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Point Calculation Rules */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 px-1">
          <Award className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white font-['Syne']">
            Тарификация и расчёт баллов
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item 1 */}
          <div className="p-5 rounded-2xl bg-[#121212] border border-zinc-800 hover:border-sky-500/40 transition-all space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-extrabold text-sm font-mono whitespace-nowrap shrink-0">
                3 б.
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                за 1 отчёт
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Проверенный отчёт</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Проверка официального отчёта сотрудника на повышение с фиксацией в реестре.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-5 rounded-2xl bg-[#121212] border border-zinc-800 hover:border-amber-500/40 transition-all space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-sm font-mono whitespace-nowrap shrink-0">
                15 б.
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                ТОП ставка
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Сбор людей</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Организация и сбор личного состава на бизаки, тайники, поставки и спецзадачи.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-5 rounded-2xl bg-[#121212] border border-zinc-800 hover:border-emerald-500/40 transition-all space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold text-sm font-mono whitespace-nowrap shrink-0">
                2 б.
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                за 1 задержание
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Задержание нарушителя</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Процессуальное задержание нарушителя с доставкой и арестом.
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-5 rounded-2xl bg-[#121212] border border-zinc-800 hover:border-purple-500/40 transition-all space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-extrabold text-sm font-mono whitespace-nowrap shrink-0">
                10 б.
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                за 1 МП
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Присутствие на МП</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Активное участие в глобальном или фракционном мероприятии от организации.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules and Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rules Card */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-zinc-800 space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base font-['Syne']">
              Обязательный регламент подачи
            </h3>
          </div>
          <ul className="space-y-3 text-xs text-zinc-300 font-sans">
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Отчёт подаётся <strong>один раз в неделю</strong> строго до подведения еженедельных итогов руководством.
              </span>
            </li>
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Каждое выполненное действие должно подтверждаться рабочей ссылкой на фото/видеофиксацию.
              </span>
            </li>
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Запрещено использовать повторные доказательства или материалы из чужих отчётов.
              </span>
            </li>
            <li className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Руководство оставляет за собой право запросить дополнительные исходные материалы работы.
              </span>
            </li>
          </ul>
        </div>

        {/* Roles & Hierarchy Card */}
        <div className="p-6 rounded-3xl bg-[#121212] border border-zinc-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base font-['Syne']">
              Иерархия Управления «В»
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-bold">★ Куратор</span>
              </div>
              <span className="text-[11px] font-mono text-red-300">Высший контроль и аудит</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-amber-300 font-bold">★ Начальник</span>
              </div>
              <span className="text-[11px] font-mono text-amber-200">Управление и проверка</span>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-purple-300 font-bold">★ Зам. начальника</span>
              </div>
              <span className="text-[11px] font-mono text-purple-200">Организация и архив</span>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sky-400 font-bold">Инструктор отдела</span>
              </div>
              <span className="text-[11px] font-mono text-sky-300">Основной состав</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121212] border border-zinc-800 space-y-6">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white font-['Syne']">
            Часто задаваемые вопросы (FAQ)
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-white text-sm hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-zinc-800/60 px-4 py-3.5 text-xs text-zinc-300 leading-relaxed font-sans bg-black/40"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
