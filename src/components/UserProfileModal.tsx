import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Camera, History, X } from 'lucide-react';
import { User } from '../types';
import { SUPER_ADMIN_ID } from '../utils/storage';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  isAdmin: boolean;
  myReportsCount: number;
  onOpenAvatarModal: () => void;
  onNavigateHistory: () => void;
  onUpdateAvatar?: (url: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  myReportsCount,
  onOpenAvatarModal,
  onNavigateHistory,
  onUpdateAvatar,
}) => {
  if (!isOpen) return null;

  const isSuperAdmin = currentUser.staticId === SUPER_ADMIN_ID || currentUser.role === 'superadmin';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-zinc-100 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-black border border-zinc-700 text-white">
                <Shield className="w-4 h-4 stroke-white" />
              </div>
              <h3 className="font-extrabold text-white text-base font-['Syne']">
                Профиль сотрудника
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Profile Card Header */}
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-black border border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center font-black text-xl text-white shrink-0 relative">
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.nickname} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser.nickname.charAt(0)
                )}
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-white text-base font-['Syne']">
                  {currentUser.nickname}
                </div>
                <div className="text-zinc-400 text-xs font-mono">
                  Static ID: #{currentUser.staticId}
                </div>
                <div>
                  {isSuperAdmin ? (
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50">
                      ★ Куратор
                    </span>
                  ) : isAdmin ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50">
                      ★ Начальник
                    </span>
                  ) : currentUser.role === 'senior_instructor' ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50">
                      ★ Зам. начальника
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      Инструктор отдела
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Detail Fields */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase">Discord:</div>
                <div className="font-bold text-white mt-0.5 truncate">{currentUser.discord}</div>
              </div>
              <div className="p-3 rounded-xl bg-black border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase">Статус в сети:</div>
                <div className="font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>В сети</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase">Мои рапорты:</div>
                <div className="font-bold text-white mt-0.5">{myReportsCount} шт.</div>
              </div>
              <div className="p-3 rounded-xl bg-black border border-zinc-800">
                <div className="text-zinc-500 text-[10px] uppercase">Подразделение:</div>
                <div className="font-bold text-white mt-0.5">Управление «В»</div>
              </div>
            </div>

            {/* Action Controls inside Profile Modal */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <label className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center space-x-2 text-xs cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Загрузить новое фото</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Размер файла не должен превышать 5MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (onUpdateAvatar) onUpdateAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                {currentUser.avatarUrl && (
                  <button
                    onClick={() => {
                      if (onUpdateAvatar) onUpdateAvatar('');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 hover:border-red-900/50 transition-colors text-xs font-bold cursor-pointer"
                    title="Удалить аватарку"
                  >
                    Удалить
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateHistory();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2 text-xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Мои рапорты</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
