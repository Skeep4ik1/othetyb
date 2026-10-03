import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isDbAvailable,
  seedInitialAdmin,
  getDbData,
  getInMemoryStore,
  upsertUserInDb,
  updateUserRoleInDb,
  updateUserAvatarInDb,
  createReportInDb,
  deleteReportFromDb,
  saveArchiveInDb,
  upsertArchiveInDb,
  deleteArchiveFromDb,
  deleteUserFromDb,
} from './src/db/operations.ts';

const getAppDirname = () => {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    try {
      return path.dirname(fileURLToPath(import.meta.url));
    } catch {
      // fallback
    }
  }
  return process.cwd();
};
const appDirname = getAppDirname();

const DATA_FILE = path.join(process.env.TMPDIR || '/tmp', 'server_data.json');
const LOCAL_DATA_FILE = path.join(appDirname, 'server_data.json');

interface User {
  nickname: string;
  staticId: string;
  discord: string;
  password?: string;
  role?: 'superadmin' | 'admin' | 'senior_instructor' | 'instructor';
  rank?: string;
  callsign?: string;
  avatarUrl?: string;
  createdAt?: string;
}

interface Report {
  id: string;
  userId: string;
  nickname: string;
  discord: string;
  date: string;
  checkedReports: number;
  gatherings: number;
  arrests: number;
  events: number;
  checked?: number;
  gathered?: number;
  trainings?: number;
  proofUrl?: string;
  notes?: string;
  status: 'approved' | 'rejected' | 'pending';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

interface WeeklyArchive {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  closedBy: string;
  closedAt: string;
  reportsCount: number;
  totalPoints: number;
  totalCheckedReports: number;
  totalGatherings: number;
  totalArrests: number;
  totalEvents: number;
  archivedReports: Report[];
  instructorSummary: {
    nickname: string;
    staticId: string;
    discord: string;
    points: number;
    reportsCount: number;
    checkedReports: number;
    gatherings: number;
    arrests: number;
    events: number;
  }[];
}

interface AppData {
  users: User[];
  reports: Report[];
  admins: string[];
  archives: WeeklyArchive[];
}

const DEFAULT_DATA: AppData = {
  users: [
    {
      nickname: 'Станислав Яров',
      staticId: '21358',
      discord: 'nensikq',
      password: 'admin',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    },
  ],
  reports: [],
  admins: ['21358'],
  archives: [],
};

function readData(): AppData {
  try {
    const targetFile = fs.existsSync(LOCAL_DATA_FILE) ? LOCAL_DATA_FILE : DATA_FILE;
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(content);
      const rawUsers: User[] = Array.isArray(parsed.users) ? parsed.users : DEFAULT_DATA.users;

      const users = rawUsers.map((u) => {
        if (u.staticId === '21358' || u.nickname.toLowerCase().includes('станислав яров')) {
          return { ...u, nickname: 'Станислав Яров', role: 'superadmin' as const };
        }
        return u;
      });

      if (!users.some((u) => u.staticId === '21358')) {
        users.unshift({
          nickname: 'Станислав Яров',
          staticId: '21358',
          discord: 'nensikq',
          password: 'admin',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
        });
      }

      const rawAdmins: string[] = Array.isArray(parsed.admins) ? parsed.admins : DEFAULT_DATA.admins;
      const admins = rawAdmins.includes('21358') ? rawAdmins : ['21358', ...rawAdmins];

      const rawReports: Report[] = Array.isArray(parsed.reports) ? parsed.reports : DEFAULT_DATA.reports;
      const uniqueReportsMap = new Map<string, Report>();
      rawReports.forEach((r) => {
        if (r && r.id) uniqueReportsMap.set(r.id, r);
      });

      return {
        users,
        reports: Array.from(uniqueReportsMap.values()),
        admins,
        archives: Array.isArray(parsed.archives) ? parsed.archives : DEFAULT_DATA.archives,
      };
    }
  } catch (err) {
    console.error('Error reading DATA_FILE:', err);
  }
  return DEFAULT_DATA;
}

function writeData(data: AppData) {
  try {
    const targetFile = fs.existsSync(LOCAL_DATA_FILE) ? LOCAL_DATA_FILE : DATA_FILE;
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DATA_FILE:', err);
  }
}

export const app = express();

// Initialize DB seed if database is available
if (isDbAvailable()) {
  seedInitialAdmin().catch(console.error);
}

// Security Headers & CORS Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DDoS-Protection', 'active; rate-limit=120/min');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-Memory Rate Limiter
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 120;

const rateLimiter = (maxRequests = MAX_REQUESTS_PER_MIN) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = rateLimitMap.get(clientIp) || { count: 0, windowStart: now };

    if (now - record.windowStart > WINDOW_MS) {
      record.count = 1;
      record.windowStart = now;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(clientIp, record);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        error: 'Превышен лимит запросов. Защита от DDoS активирована.',
        retryAfter: 60,
      });
    }

    next();
  };
};

app.use('/api', rateLimiter(120));

// Presence tracker
const activePresence = new Map<string, number>();

const getOnlineStaticIds = (): string[] => {
  const now = Date.now();
  const online: string[] = [];
  activePresence.forEach((timestamp, staticId) => {
    if (now - timestamp < 15000) {
      online.push(staticId);
    }
  });
  return online;
};

// Debug endpoint for database inspection
app.get('/api/debug', async (req, res) => {
  const inMem = getInMemoryStore();
  const online = getOnlineStaticIds();

  let dbStatus = 'unknown';
  let dbData: AppData | null = null;

  try {
    dbData = await getDbData();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${(err as Error).message}`;
  }

  const activeData = dbData || inMem;

  res.json({
    timestamp: new Date().toISOString(),
    dbStatus,
    onlineUsersCount: online.length,
    onlineUsers: online,
    summary: {
      usersCount: activeData.users.length,
      reportsCount: activeData.reports.length,
      archivesCount: activeData.archives.length,
      inMemoryUsersCount: inMem.users.length,
      inMemoryReportsCount: inMem.reports.length,
      inMemoryArchivesCount: inMem.archives.length,
    },
    users: activeData.users.map((u) => ({
      staticId: u.staticId,
      nickname: u.nickname,
      discord: u.discord,
      role: u.role,
      rank: u.rank,
      callsign: u.callsign,
      hasAvatar: Boolean(u.avatarUrl),
      createdAt: u.createdAt,
    })),
    reports: activeData.reports.map((r) => ({
      id: r.id,
      userId: r.userId,
      nickname: r.nickname,
      discord: r.discord,
      date: r.date,
      status: r.status,
      checkedReports: r.checkedReports,
      gatherings: r.gatherings,
      arrests: r.arrests,
      events: r.events,
      proofUrl: r.proofUrl,
      notes: r.notes,
    })),
    archives: activeData.archives.map((a) => ({
      id: a.id,
      title: a.title,
      startDate: a.startDate,
      endDate: a.endDate,
      closedBy: a.closedBy,
      closedAt: a.closedAt,
      reportsCount: a.reportsCount,
      totalPoints: a.totalPoints,
    })),
  });
});

// API Routes
app.get('/api/db', async (req, res) => {
  if (isDbAvailable()) {
    try {
      const data = await getDbData();
      return res.json({
        ...data,
        onlineUsers: getOnlineStaticIds(),
      });
    } catch (err) {
      console.error('Error serving /api/db from Cloud SQL, falling back to JSON:', err);
    }
  }
  const data = readData();
  res.json({
    ...data,
    onlineUsers: getOnlineStaticIds(),
  });
});

app.post('/api/heartbeat', async (req, res) => {
  const { staticId } = req.body;
  if (staticId) {
    activePresence.set(String(staticId), Date.now());
  }

  res.json({ success: true, onlineUsers: getOnlineStaticIds() });
});

app.post('/api/users/role', async (req, res) => {
  const { staticId, role } = req.body;
  if (!staticId || !role) {
    return res.status(400).json({ error: 'staticId and role are required' });
  }

  const data = readData();
  const user = data.users.find((u) => u.staticId === String(staticId));

  if (user) {
    user.role = role;
    if (role === 'admin' || role === 'superadmin' || role === 'senior_instructor') {
      if (!data.admins.includes(user.staticId)) {
        data.admins.push(user.staticId);
      }
    } else if (user.staticId !== '21358') {
      data.admins = data.admins.filter((id) => id !== user.staticId);
    }
    writeData(data);
  }

  if (isDbAvailable()) {
    try {
      await updateUserRoleInDb(String(staticId), role);
      const freshData = await getDbData();
      const freshUser = freshData.users.find((u) => u.staticId === String(staticId));
      return res.json({ success: true, user: freshUser || user, users: freshData.users, admins: freshData.admins });
    } catch (err) {
      console.error('Error updating role in Cloud SQL:', err);
    }
  }

  if (user) {
    return res.json({ success: true, user, users: data.users, admins: data.admins });
  }

  return res.status(404).json({ error: 'User not found' });
});

app.post('/api/users', async (req, res) => {
  const { user } = req.body;
  if (!user || !user.staticId) {
    return res.status(400).json({ error: 'User and staticId are required' });
  }

  const data = readData();
  const existingIndex = data.users.findIndex((u) => u.staticId === user.staticId);

  if (existingIndex >= 0) {
    // Preserve existing role!
    const existingRole = data.users[existingIndex].role || 'instructor';
    const roleToKeep = (user.role && user.role !== 'instructor') ? user.role : existingRole;
    data.users[existingIndex] = { ...data.users[existingIndex], ...user, role: roleToKeep };
  } else {
    data.users.push(user);
  }
  writeData(data);

  if (isDbAvailable()) {
    try {
      await upsertUserInDb(user);
      const freshData = await getDbData();
      return res.json({ success: true, user, users: freshData.users });
    } catch (err) {
      console.error('Error updating user in Cloud SQL:', err);
    }
  }

  res.json({ success: true, user, users: data.users });
});

app.delete('/api/users/:staticId', async (req, res) => {
  const { staticId } = req.params;
  if (!staticId) {
    return res.status(400).json({ error: 'staticId is required' });
  }

  if (isDbAvailable()) {
    try {
      await deleteUserFromDb(staticId);
      const freshData = await getDbData();
      return res.json({ success: true, users: freshData.users, admins: freshData.admins });
    } catch (err) {
      console.error('Error deleting user from Cloud SQL:', err);
    }
  }

  const data = readData();
  data.users = data.users.filter((u) => u.staticId !== staticId);
  data.admins = data.admins.filter((id) => id !== staticId);
  writeData(data);
  res.json({ success: true, users: data.users, admins: data.admins });
});

app.post('/api/avatar', async (req, res) => {
  const { staticId, avatarUrl } = req.body;
  if (!staticId) {
    return res.status(400).json({ error: 'staticId is required' });
  }

  if (isDbAvailable()) {
    try {
      await updateUserAvatarInDb(String(staticId), avatarUrl);
      const freshData = await getDbData();
      const user = freshData.users.find((u) => u.staticId === String(staticId));
      return res.json({ success: true, user, users: freshData.users });
    } catch (err) {
      console.error('Error updating avatar in Cloud SQL:', err);
    }
  }

  const data = readData();
  const user = data.users.find((u) => u.staticId === staticId);
  if (user) {
    user.avatarUrl = avatarUrl || undefined;
    writeData(data);
    return res.json({ success: true, user, users: data.users });
  }

  return res.status(404).json({ error: 'User not found' });
});

app.post('/api/reports', async (req, res) => {
  const { report } = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ error: 'Report object is required' });
  }

  if (isDbAvailable()) {
    try {
      await createReportInDb(report);
      const freshData = await getDbData();
      return res.json({ success: true, report, reports: freshData.reports });
    } catch (err) {
      console.error('Error creating report in Cloud SQL:', err);
    }
  }

  const data = readData();
  const existingIdx = data.reports.findIndex((r) => r.id === report.id);
  if (existingIdx >= 0) {
    data.reports[existingIdx] = { ...data.reports[existingIdx], ...report };
  } else {
    data.reports.unshift(report);
  }
  
  const map = new Map<string, Report>();
  data.reports.forEach((r) => { if (r && r.id) map.set(r.id, r); });
  data.reports = Array.from(map.values());

  writeData(data);
  res.json({ success: true, report, reports: data.reports });
});

app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;

  if (isDbAvailable()) {
    try {
      await deleteReportFromDb(id);
      const freshData = await getDbData();
      return res.json({ success: true, reports: freshData.reports });
    } catch (err) {
      console.error('Error deleting report from Cloud SQL:', err);
    }
  }

  const data = readData();
  data.reports = data.reports.filter((r) => r.id !== id);
  writeData(data);
  res.json({ success: true, reports: data.reports });
});

app.post('/api/admins', (req, res) => {
  const { admins } = req.body;
  if (!Array.isArray(admins)) {
    return res.status(400).json({ error: 'Admins array is required' });
  }

  const data = readData();
  data.admins = admins;
  writeData(data);
  res.json({ success: true, admins: data.admins });
});

app.post('/api/archive-week', async (req, res) => {
  const { title, closedBy } = req.body;
  let data: AppData;

  if (isDbAvailable()) {
    try {
      data = await getDbData();
    } catch {
      data = readData();
    }
  } else {
    data = readData();
  }

  if (data.reports.length === 0) {
    return res.status(400).json({ error: 'Нет активных рапортов для архивации' });
  }

  const calcPoints = (r: Report) => {
    const checked = r.checkedReports ?? r.checked ?? 0;
    const gathered = r.gatherings ?? r.gathered ?? 0;
    const arr = r.arrests ?? 0;
    const ev = r.events ?? r.trainings ?? 0;
    return checked * 3 + gathered * 15 + arr * 2 + ev * 10;
  };

  const activeReports = [...data.reports];
  const totalReportsCount = activeReports.length;
  const totalCheckedReports = activeReports.reduce((sum, r) => sum + (r.checkedReports ?? r.checked ?? 0), 0);
  const totalGatherings = activeReports.reduce((sum, r) => sum + (r.gatherings ?? r.gathered ?? 0), 0);
  const totalArrests = activeReports.reduce((sum, r) => sum + (r.arrests ?? 0), 0);
  const totalEvents = activeReports.reduce((sum, r) => sum + (r.events ?? r.trainings ?? 0), 0);
  const totalPoints = activeReports.reduce((sum, r) => sum + calcPoints(r), 0);

  const instMap = new Map<string, {
    nickname: string;
    staticId: string;
    discord: string;
    points: number;
    reportsCount: number;
    checkedReports: number;
    gatherings: number;
    arrests: number;
    events: number;
  }>();

  activeReports.forEach((r) => {
    const prev = instMap.get(r.userId) || {
      nickname: r.nickname,
      staticId: r.userId,
      discord: r.discord,
      points: 0,
      reportsCount: 0,
      checkedReports: 0,
      gatherings: 0,
      arrests: 0,
      events: 0,
    };

    prev.points += calcPoints(r);
    prev.reportsCount += 1;
    prev.checkedReports += (r.checkedReports ?? r.checked ?? 0);
    prev.gatherings += (r.gatherings ?? r.gathered ?? 0);
    prev.arrests += (r.arrests ?? 0);
    prev.events += (r.events ?? r.trainings ?? 0);

    instMap.set(r.userId, prev);
  });

  const instructorSummary = Array.from(instMap.values()).sort((a, b) => b.points - a.points);

  const dates = activeReports.map((r) => new Date(r.date).getTime()).sort((a, b) => a - b);
  const minDate = dates.length > 0 ? new Date(dates[0]).toISOString() : new Date().toISOString();
  const maxDate = new Date().toISOString();

  const archiveTitle = title || `Еженедельный отчёт (с ${new Date(minDate).toLocaleDateString('ru-RU')} по ${new Date(maxDate).toLocaleDateString('ru-RU')})`;

  const newArchive: WeeklyArchive = {
    id: `arch-${Date.now()}`,
    title: archiveTitle,
    startDate: minDate,
    endDate: maxDate,
    closedBy: closedBy || 'Руководство отдела',
    closedAt: maxDate,
    reportsCount: totalReportsCount,
    totalPoints,
    totalCheckedReports,
    totalGatherings,
    totalArrests,
    totalEvents,
    archivedReports: activeReports,
    instructorSummary,
  };

  if (isDbAvailable()) {
    try {
      await saveArchiveInDb(newArchive);
      const freshData = await getDbData();
      return res.json({
        success: true,
        archive: newArchive,
        archives: freshData.archives,
        reports: freshData.reports,
      });
    } catch (err) {
      console.error('Error saving archive in Cloud SQL:', err);
    }
  }

  data.archives.unshift(newArchive);
  data.reports = [];

  writeData(data);
  res.json({
    success: true,
    archive: newArchive,
    archives: data.archives,
    reports: data.reports,
  });
});

app.post('/api/archives', async (req, res) => {
  const { archive } = req.body;
  if (!archive || !archive.id) {
    return res.status(400).json({ error: 'Archive object and id are required' });
  }

  if (isDbAvailable()) {
    try {
      await upsertArchiveInDb(archive);
      const freshData = await getDbData();
      return res.json({ success: true, archive, archives: freshData.archives });
    } catch (err) {
      console.error('Error saving archive in Cloud SQL:', err);
    }
  }

  const data = readData();
  const idx = data.archives.findIndex((a) => a.id === archive.id);
  if (idx >= 0) {
    data.archives[idx] = archive;
  } else {
    data.archives.unshift(archive);
  }
  writeData(data);
  res.json({ success: true, archive, archives: data.archives });
});

app.delete('/api/archives/:id', async (req, res) => {
  const { id } = req.params;

  if (isDbAvailable()) {
    try {
      await deleteArchiveFromDb(id);
      const freshData = await getDbData();
      return res.json({ success: true, archives: freshData.archives });
    } catch (err) {
      console.error('Error deleting archive from Cloud SQL:', err);
    }
  }

  const data = readData();
  data.archives = data.archives.filter((a) => a.id !== id);
  writeData(data);
  res.json({ success: true, archives: data.archives });
});

app.post('/api/reset', (req, res) => {
  writeData(DEFAULT_DATA);
  res.json({ success: true, ...DEFAULT_DATA });
});
