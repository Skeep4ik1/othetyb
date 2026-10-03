import { Report, User } from '../types';

export const SUPER_ADMIN_ID = '21358'; // Станислав Яров

export const parseReportDate = (dateStr?: string | null): number => {
  if (!dateStr) return 0;
  if (/^\d{10,13}$/.test(dateStr)) {
    const num = Number(dateStr);
    return num < 1e11 ? num * 1000 : num;
  }
  const parsed = new Date(dateStr).getTime();
  if (!isNaN(parsed)) return parsed;

  const ruMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ruMatch) {
    const day = parseInt(ruMatch[1], 10);
    const month = parseInt(ruMatch[2], 10) - 1;
    const year = parseInt(ruMatch[3], 10);
    return new Date(year, month, day).getTime();
  }

  return 0;
};

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

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-19119-01',
    userId: '19119',
    nickname: 'Алексей Мордашев',
    discord: 'ahh063',
    date: '2026-10-03T12:00:00.000Z',
    checkedReports: 0,
    gatherings: 3,
    arrests: 0,
    events: 14,
    status: 'approved',
    proofUrl: 'https://imgur.com/gallery/example1',
    notes: 'Сборы и участие в мероприятиях',
  },
  {
    id: 'rep-15453-01',
    userId: '15453',
    nickname: 'Стас Невский',
    discord: 'stragj',
    date: '2026-10-03T10:00:00.000Z',
    checkedReports: 2,
    gatherings: 0,
    arrests: 0,
    events: 7,
    status: 'approved',
    proofUrl: 'https://imgur.com/gallery/example2',
    notes: 'Проверенные отчёты и фракционные мероприятия',
  },
  {
    id: 'rep-73336-01',
    userId: '73336',
    nickname: 'Вячеслав Никитин',
    discord: 'evolu7ioni',
    date: '2026-10-02T18:00:00.000Z',
    checkedReports: 1,
    gatherings: 0,
    arrests: 14,
    events: 2,
    status: 'approved',
    proofUrl: 'https://imgur.com/gallery/example3',
    notes: 'Задержания нарушителей и меропрятия',
  },
  {
    id: 'rep-56808-01',
    userId: '56808',
    nickname: 'Максим Ватковский',
    discord: 'qweatr',
    date: '2026-10-02T15:00:00.000Z',
    checkedReports: 4,
    gatherings: 0,
    arrests: 0,
    events: 0,
    status: 'approved',
    proofUrl: 'https://imgur.com/gallery/example4',
    notes: 'Проверка квалификационных отчётов',
  },
  {
    id: 'rep-21358-01',
    userId: '21358',
    nickname: 'Станислав Яров',
    discord: 'nensikq',
    date: '2026-09-28T21:47:34.000Z',
    checkedReports: 5,
    gatherings: 3,
    arrests: 5,
    events: 2,
    status: 'approved',
    proofUrl: 'https://imgur.com/gallery/example5',
    notes: 'Работа Куратора',
  },
];

export const loadStoredData = () => {
  try {
    const rawUser = localStorage.getItem('depV_user');
    const rawUsers = localStorage.getItem('depV_users');
    const rawReports = localStorage.getItem('depV_reports');
    const rawAdmins = localStorage.getItem('depV_admins');
    const rawArchives = localStorage.getItem('depV_archives');

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
        currentUser = {
          ...currentUser,
          ...matched,
          role: matched.role || currentUser.role || 'instructor',
        };
      }
    }

    let reports: Report[] = INITIAL_REPORTS;
    if (rawReports) {
      try {
        const parsed: any[] = JSON.parse(rawReports);
        if (parsed.length > 0) {
          const repMap = new Map<string, Report>();
          parsed.forEach((r) => {
            if (r && r.id) {
              repMap.set(r.id, {
                ...r,
                nickname: r.nickname === 'Stanislav Yarov' ? 'Станислав Яров' : r.nickname,
                checkedReports: r.checkedReports ?? r.checked ?? 0,
                gatherings: r.gatherings ?? r.gathered ?? 0,
                arrests: r.arrests ?? 0,
                events: r.events ?? r.trainings ?? 0,
                status: 'approved',
              });
            }
          });
          reports = Array.from(repMap.values());
        } else {
          reports = INITIAL_REPORTS;
        }
      } catch {
        reports = INITIAL_REPORTS;
      }
    } else {
      localStorage.setItem('depV_reports', JSON.stringify(INITIAL_REPORTS));
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

    let archives: any[] = [];
    if (rawArchives) {
      try {
        archives = JSON.parse(rawArchives);
      } catch {
        archives = [];
      }
    }

    return { currentUser, users, reports, admins, archives };
  } catch (error) {
    console.error('Failed to load storage data:', error);
    return {
      currentUser: null,
      users: DEFAULT_USERS,
      reports: [],
      admins: [SUPER_ADMIN_ID],
      archives: [],
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
