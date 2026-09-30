import { Report, User } from '../types';

export const SUPER_ADMIN_ID = '21358'; // Станислав Яров

export const DEFAULT_USERS: User[] = [
  {
    nickname: 'Станислав Яров',
    staticId: '21358',
    discord: 'nensikq',
    password: 'admin',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEMO_USERS = DEFAULT_USERS;

export const INITIAL_REPORTS: Report[] = [];

export const loadStoredData = () => {
  try {
    const rawUser = localStorage.getItem('depV_user');
    const rawUsers = localStorage.getItem('depV_users');
    const rawReports = localStorage.getItem('depV_reports');
    const rawAdmins = localStorage.getItem('depV_admins');

    let users: User[] = DEFAULT_USERS;
    if (rawUsers) {
      try {
        const parsed: User[] = JSON.parse(rawUsers);
        const normalized = parsed.map((u) => 
          u.staticId === SUPER_ADMIN_ID || u.nickname.toLowerCase().includes('станислав яров')
            ? { ...u, nickname: 'Станислав Яров', role: 'superadmin' as const }
            : u
        );
        const hasStanislav = normalized.some((u) => u.staticId === SUPER_ADMIN_ID);
        users = hasStanislav ? normalized : [DEFAULT_USERS[0], ...normalized];
      } catch {
        users = DEFAULT_USERS;
      }
    } else {
      localStorage.setItem('depV_users', JSON.stringify(DEFAULT_USERS));
    }

    let currentUser: User | null = rawUser ? JSON.parse(rawUser) : null;
    if (currentUser) {
      const matched = users.find((u) => u.staticId === currentUser?.staticId);
      if (matched) {
        currentUser = matched;
      }
    }

    let reports: Report[] = [];
    if (rawReports) {
      try {
        const parsed: any[] = JSON.parse(rawReports);
        // Normalize fields and names for older reports if any
        reports = parsed.map((r) => ({
          ...r,
          nickname: r.nickname === 'Stanislav Yarov' ? 'Станислав Яров' : r.nickname,
          checkedReports: r.checkedReports ?? r.checked ?? 0,
          gatherings: r.gatherings ?? r.gathered ?? 0,
          arrests: r.arrests ?? 0,
          events: r.events ?? r.trainings ?? 0,
          status: 'approved', // all reports are immediately approved!
        }));
      } catch {
        reports = [];
      }
    }

    let admins: string[] = [SUPER_ADMIN_ID];
    if (rawAdmins) {
      try {
        const parsed: string[] = JSON.parse(rawAdmins);
        admins = parsed.includes(SUPER_ADMIN_ID) ? parsed : [SUPER_ADMIN_ID, ...parsed];
      } catch {
        admins = [SUPER_ADMIN_ID];
      }
    }

    return { currentUser, users, reports, admins };
  } catch (error) {
    console.error('Failed to load storage data:', error);
    return {
      currentUser: null,
      users: DEFAULT_USERS,
      reports: [],
      admins: [SUPER_ADMIN_ID],
    };
  }
};

export const calculatePoints = (r: {
  checkedReports?: number;
  gatherings?: number;
  arrests?: number;
  events?: number;
  checked?: number;
  gathered?: number;
  trainings?: number;
}) => {
  // Official point values:
  // 1. Проверенный отчёт на повышение - 3 балла
  // 2. Сборы людей на бизаки, тайники и т.д - 15 баллов
  // 3. Задержание - 2 балла
  // 4. Присутствие на мероприятии от фракции - 10 баллов
  const checked = (r.checkedReports ?? r.checked ?? 0) * 3;
  const gatherings = (r.gatherings ?? r.gathered ?? 0) * 15;
  const arrests = (r.arrests ?? 0) * 2;
  const events = (r.events ?? r.trainings ?? 0) * 10;

  return checked + gatherings + arrests + events;
};

export const exportReportsToCSV = (reports: Report[]) => {
  const headers = [
    'ID',
    'Инструктор',
    'Static ID',
    'Discord',
    'Дата',
    'Проверено отчетов (3 б.)',
    'Сборы на бизаки/тайники (15 б.)',
    'Задержания (2 б.)',
    'Мероприятия фракции (10 б.)',
    'Итого баллов',
    'Статус',
    'Доказательства',
    'Примечание',
  ];

  const rows = reports.map((r) => [
    r.id,
    `"${r.nickname.replace(/"/g, '""')}"`,
    r.userId,
    `"${r.discord.replace(/"/g, '""')}"`,
    `"${new Date(r.date).toLocaleString('ru-RU')}"`,
    r.checkedReports ?? r.checked ?? 0,
    r.gatherings ?? r.gathered ?? 0,
    r.arrests ?? 0,
    r.events ?? r.trainings ?? 0,
    calculatePoints(r),
    'Принят',
    `"${(r.proofUrl || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `otchety_upravlenie_v_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
