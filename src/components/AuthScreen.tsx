import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  UserCheck, 
  Hash, 
  MessageSquare, 
  LogIn, 
  Sun, 
  Moon, 
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { User } from '../types';
import { SUPER_ADMIN_ID } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
}

const COMMON_WEAK_PASSWORDS = new Set([
  '123123', '123456', '12345678', '123456789', '654321', '000000', '111111', '222222', '333333',
  '444444', '555555', '666666', '777777', '888888', '999999', '123321', '123123123',
  'password', 'qwerty', 'qweqwe', 'qwert', 'admin', 'admin123', '123qwe', 'abc123',
  '1234', '12345', '1234567', 'password123', 'pass1234'
]);

function validatePassword(pass: string): { isValid: boolean; message?: string } {
  const clean = pass.trim();

  if (clean.length < 6) {
    return { isValid: false, message: 'Пароль слишком короткий. Минимальная длина — 6 символов.' };
  }

  const lower = clean.toLowerCase();

  // Check common weak passwords list
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return { isValid: false, message: 'Придумайте более сложный пароль (простые комбинации вроде 123123, qwerty запрещены).' };
  }

  // Check for repeated sequences like 123123, qweqwe, abcabc
  if (/^(.{2,4})\1+$/.test(clean)) {
    return { isValid: false, message: 'Пароль состоит из повторяющихся комбинаций (например, 123123). Укажите надежный пароль.' };
  }

  // Check for all identical characters (e.g. 11111111, aaaaaaaa)
  if (/^(.)\1+$/.test(clean)) {
    return { isValid: false, message: 'Пароль не должен состоять из одного и того же символа.' };
  }

  // Check for purely sequential numbers
  const isSeqAsc = '0123456789'.includes(clean);
  const isSeqDesc = '9876543210'.includes(clean);
  if (isSeqAsc || isSeqDesc) {
    return { isValid: false, message: 'Пароль не должен содержать простые последовательности цифр.' };
  }

  // Require both letters and numbers
  const hasLetter = /[a-zA-Zа-яА-ЯёЁ]/.test(clean);
  const hasDigit = /[0-9]/.test(clean);
  if (!hasLetter || !hasDigit) {
    return { isValid: false, message: 'Пароль должен содержать как буквы, так и цифры (например: Pass1234).' };
  }

  return { isValid: true };
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ users, onLogin, onRegister }) => {
  const { isDark, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Login form state
  const [loginStaticId, setLoginStaticId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regNickname, setRegNickname] = useState('');
  const [regStaticId, setRegStaticId] = useState('');
  const [regDiscord, setRegDiscord] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('Размер файла не должен превышать 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanInput = loginStaticId.trim().replace(/^#\s*/, '');
    const cleanPass = loginPassword.trim();

    if (!cleanInput || !cleanPass) {
      setErrorMsg('Пожалуйста, введите Static ID и пароль');
      return;
    }

    const found = users.find(
      (u) =>
        u.staticId.toLowerCase() === cleanInput.toLowerCase() ||
        u.nickname.toLowerCase() === cleanInput.toLowerCase() ||
        u.nickname.toLowerCase().includes(cleanInput.toLowerCase())
    );

    if (!found) {
      setErrorMsg(`Инструктор со Static ID или Nickname "${cleanInput}" не найден. Пройдите регистрацию.`);
      return;
    }

    // Check password if set on user profile
    if (found.password && found.password !== cleanPass) {
      setErrorMsg('Неверный пароль доступа. Попробуйте снова.');
      return;
    }

    // Save password on first login if not set yet
    const loggedInUser = found.password ? found : { ...found, password: cleanPass };
    onLogin(loggedInUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNick = regNickname.trim();
    const cleanStatic = regStaticId.trim();
    const cleanDiscord = regDiscord.trim();
    const cleanPass = regPassword.trim();

    if (!cleanNick || !cleanStatic || !cleanDiscord || !cleanPass) {
      setErrorMsg('Пожалуйста, заполните все обязательные поля');
      return;
    }

    // Check that name and surname are in Russian
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(cleanNick);
    const hasLatin = /[a-zA-Z]/.test(cleanNick);
    if (!hasCyrillic || hasLatin) {
      setErrorMsg('Имя и Фамилия должны быть написаны только на русском языке (например: Иван Петров)');
      return;
    }

    const words = cleanNick.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setErrorMsg('Укажите Имя и Фамилию через пробел (например: Иван Петров)');
      return;
    }

    const passValidation = validatePassword(cleanPass);
    if (!passValidation.isValid) {
      setErrorMsg(passValidation.message || 'Укажите надежный пароль');
      return;
    }

    if (cleanPass !== regConfirmPassword.trim()) {
      setErrorMsg('Введённые пароли не совпадают!');
      return;
    }

    // Check if Static ID already exists
    const exists = users.some((u) => u.staticId === cleanStatic);
    if (exists) {
      setErrorMsg(`Инструктор со Static ID #${cleanStatic} уже зарегистрирован в базе данных!`);
      return;
    }

    const newUser: User = {
      nickname: cleanNick,
      staticId: cleanStatic,
      discord: cleanDiscord,
      password: cleanPass,
      avatarUrl: regAvatarUrl.trim() || undefined,
      role: cleanStatic === SUPER_ADMIN_ID ? 'superadmin' : 'instructor',
      createdAt: new Date().toISOString(),
    };

    onRegister(newUser);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors duration-200 relative overflow-hidden">
      {/* Subtle ambient contrast grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top right theme switch */}
      <div className="absolute top-4 right-4 z-10">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Переключить тему"
        >
          {isDark ? <Sun className="w-5 h-5 text-zinc-100" /> : <Moon className="w-5 h-5 text-zinc-400" />}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 text-zinc-100"
      >
        {/* Department Tactical Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3.5">
            <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl border border-zinc-200">
              <Shield className="w-8 h-8 fill-black stroke-black stroke-1" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black border border-zinc-700 text-white px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase">
              V
            </div>
          </div>
          
          <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase mb-1">
            Отдел кадров и боевой подготовки
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight font-['Syne']">
            УПРАВЛЕНИЕ «В»
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Автоматизированный терминал отчётности инструкторов
          </p>
        </div>

        {/* Tab switch between Login and Register */}
        <div className="grid grid-cols-2 p-1 bg-black rounded-xl mb-5 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              !isRegister
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-600'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-zinc-200" />
            <span>Вход в терминал</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              isRegister
                ? 'bg-zinc-800 text-white shadow-xs border border-zinc-600'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-zinc-200" />
            <span>Регистрация</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 flex items-start space-x-2.5 text-xs text-zinc-200 font-mono"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* LOGIN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                Static ID или Имя Фамилия
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={loginStaticId}
                  onChange={(e) => setLoginStaticId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  placeholder="21358 или Станислав Яров"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 font-mono">
                Пароль доступа
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 cursor-pointer font-['Syne']"
            >
              <LogIn className="w-4 h-4 stroke-2 text-black" />
              <span>Авторизоваться в системе</span>
            </motion.button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Имя и Фамилия
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Строго на русском
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regNickname}
                  onChange={(e) => setRegNickname(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                  placeholder="Иван Петров"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Например: Станислав Яров (кириллицей через пробел)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Static ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regStaticId}
                    onChange={(e) => setRegStaticId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-mono bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                    placeholder="45192"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                  Discord Tag
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regDiscord}
                    onChange={(e) => setRegDiscord(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                    placeholder="ivan_v#001"
                  />
                </div>
              </div>
            </div>

            {/* Avatar URL / Upload */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                Аватарка (ссылка или файл)
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-black border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                    {regAvatarUrl ? (
                      <img src={regAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={regAvatarUrl}
                    onChange={(e) => setRegAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                    placeholder="https://imgur.com/your-photo.png"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <label className="cursor-pointer text-zinc-300 hover:text-white flex items-center space-x-1 font-mono">
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Загрузить фото с устройства</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {regAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setRegAvatarUrl('')}
                      className="text-zinc-500 hover:text-zinc-300 text-[10px] font-mono"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                Пароль доступа
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  placeholder="Буквы и цифры, мин. 6 символов"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                Повтор пароля
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-black border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                  placeholder="Повторите пароль"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-sm text-black bg-white hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2 cursor-pointer font-['Syne']"
            >
              <UserPlus className="w-4 h-4 stroke-2 text-black" />
              <span>Зарегистрировать личное дело</span>
            </motion.button>
          </form>
        )}

        <div className="mt-5 text-center text-[10px] text-zinc-500 font-mono flex items-center justify-center space-x-2">
          <span>Штабная база данных</span>
          <span aria-hidden="true">·</span>
          <span>Защищённый протокол</span>
        </div>
      </motion.div>
    </div>
  );
};

