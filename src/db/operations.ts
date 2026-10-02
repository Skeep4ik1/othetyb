import { db } from './index.ts';
import { users, reports, archives, admins } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const getDbDirname = () => {
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
const dbDirname = getDbDirname();
const LOCAL_DATA_FILE = path.join(dbDirname, '../../server_data.json');

export interface UserType {
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

export interface ReportType {
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

export interface WeeklyArchiveType {
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
  archivedReports: ReportType[];
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

export interface AppDataType {
  users: UserType[];
  reports: ReportType[];
  admins: string[];
  archives: WeeklyArchiveType[];
}

let inMemoryStore: AppDataType = {
  users: [
    {
      nickname: 'Станислав Яров',
      staticId: '21358',
      discord: 'nensikq',
      password: 'admin',
      role: 'superadmin',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  reports: [],
  admins: ['21358'],
  archives: [],
};

const initInMemoryStore = () => {
  const candidates = [
    path.join(process.cwd(), 'server_data.json'),
    path.join(dbDirname, '../../server_data.json'),
    path.join(dbDirname, '../server_data.json'),
    path.join(dbDirname, 'server_data.json'),
    '/app/server_data.json',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
        inMemoryStore = {
          users: Array.isArray(parsed.users) ? parsed.users : inMemoryStore.users,
          reports: Array.isArray(parsed.reports) ? parsed.reports : [],
          admins: Array.isArray(parsed.admins) ? parsed.admins : ['21358'],
          archives: Array.isArray(parsed.archives) ? parsed.archives : [],
        };
        break;
      } catch {
        // ignore
      }
    }
  }
};
initInMemoryStore();

export const updateInMemoryStore = (updater: (prev: AppDataType) => AppDataType) => {
  inMemoryStore = updater(inMemoryStore);
  try {
    const targetFile = path.join(process.cwd(), 'server_data.json');
    fs.writeFileSync(targetFile, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch {
    // ignore
  }
  return inMemoryStore;
};

export const getLocalJsonFallback = (): AppDataType => {
  return inMemoryStore;
};

export const getInMemoryStore = (): AppDataType => {
  return inMemoryStore;
};

export const isDbAvailable = () => {
  return true;
};

export async function seedInitialAdmin() {
  if (!isDbAvailable()) return;
  try {
    const { createPool } = await import('./index.ts');
    const pool = createPool();

    // Ensure database tables exist (ignore permission errors if user lacks DDL permissions or tables exist from backup)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          static_id TEXT PRIMARY KEY,
          nickname TEXT NOT NULL,
          discord TEXT NOT NULL,
          password TEXT,
          role TEXT NOT NULL DEFAULT 'instructor',
          rank TEXT,
          callsign TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          nickname TEXT NOT NULL,
          discord TEXT NOT NULL,
          date TEXT NOT NULL,
          checked_reports INTEGER NOT NULL DEFAULT 0,
          gatherings INTEGER NOT NULL DEFAULT 0,
          arrests INTEGER NOT NULL DEFAULT 0,
          events INTEGER NOT NULL DEFAULT 0,
          proof_url TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          reviewed_by TEXT,
          reviewed_at TEXT,
          review_comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS archives (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          closed_by TEXT NOT NULL,
          closed_at TEXT NOT NULL,
          reports_count INTEGER NOT NULL DEFAULT 0,
          total_points INTEGER NOT NULL DEFAULT 0,
          total_checked_reports INTEGER NOT NULL DEFAULT 0,
          total_gatherings INTEGER NOT NULL DEFAULT 0,
          total_arrests INTEGER NOT NULL DEFAULT 0,
          total_events INTEGER NOT NULL DEFAULT 0,
          archived_reports JSONB NOT NULL,
          instructor_summary JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS admins (
          static_id TEXT PRIMARY KEY
        );
      `);
    } catch (tableErr) {
      console.warn('Notice: CREATE TABLE skipped (tables likely already exist or DDL permission restricted):', (tableErr as Error).message);
    }

    // Auto-migrate JSON data into fresh PostgreSQL DB ONLY if users table is empty
    let userCount = -1;
    try {
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      userCount = parseInt(userCountRes.rows[0].count, 10);
    } catch (countErr) {
      console.warn('Notice: Could not count users table:', (countErr as Error).message);
    }

    const findServerDataJson = () => {
      const candidates = [
        path.join(process.cwd(), 'server_data.json'),
        path.join(dbDirname, '../../server_data.json'),
        path.join(dbDirname, '../server_data.json'),
        path.join(dbDirname, 'server_data.json'),
        '/app/server_data.json',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      return null;
    };

    const jsonFileToUse = findServerDataJson();

    if (userCount === 0 && jsonFileToUse) {
      try {
        const rawContent = fs.readFileSync(jsonFileToUse, 'utf-8');
        const jsonAppData = JSON.parse(rawContent);

        if (Array.isArray(jsonAppData.users)) {
          for (const u of jsonAppData.users) {
            await pool.query(
              `INSERT INTO users (static_id, nickname, discord, password, role, rank, callsign, avatar_url, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (static_id) DO NOTHING`,
              [u.staticId, u.nickname, u.discord, u.password || null, u.role || 'instructor', u.rank || null, u.callsign || null, u.avatarUrl || null, u.createdAt ? new Date(u.createdAt) : new Date()]
            );
          }
        }

        if (Array.isArray(jsonAppData.reports)) {
          for (const r of jsonAppData.reports) {
            await pool.query(
              `INSERT INTO reports (id, user_id, nickname, discord, date, checked_reports, gatherings, arrests, events, proof_url, notes, status, reviewed_by, reviewed_at, review_comment)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
               ON CONFLICT (id) DO NOTHING`,
              [r.id, r.userId, r.nickname, r.discord, r.date, r.checkedReports || r.checked || 0, r.gatherings || r.gathered || 0, r.arrests || 0, r.events || r.trainings || 0, r.proofUrl || null, r.notes || null, r.status || 'pending', r.reviewedBy || null, r.reviewedAt || null, r.reviewComment || null]
            );
          }
        }

        if (Array.isArray(jsonAppData.archives)) {
          for (const a of jsonAppData.archives) {
            await pool.query(
              `INSERT INTO archives (id, title, start_date, end_date, closed_by, closed_at, reports_count, total_points, total_checked_reports, total_gatherings, total_arrests, total_events, archived_reports, instructor_summary)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
               ON CONFLICT (id) DO NOTHING`,
              [a.id, a.title, a.startDate, a.endDate, a.closedBy, a.closedAt, a.reportsCount, a.totalPoints, a.totalCheckedReports, a.totalGatherings, a.totalArrests, a.totalEvents, JSON.stringify(a.archivedReports || []), JSON.stringify(a.instructorSummary || [])]
            );
          }
        }

        if (Array.isArray(jsonAppData.admins)) {
          for (const adminId of jsonAppData.admins) {
            await pool.query(
              `INSERT INTO admins (static_id) VALUES ($1) ON CONFLICT DO NOTHING`,
              [String(adminId)]
            );
          }
        }
      } catch (migrateErr) {
        console.error('Error auto-migrating JSON data to PostgreSQL:', migrateErr);
      }
    }

    try {
      const existingStanislav = await db.select().from(users).where(eq(users.staticId, '21358'));
      if (existingStanislav.length === 0) {
        await db.insert(users).values({
          staticId: '21358',
          nickname: 'Станислав Яров',
          discord: 'nensikq',
          password: 'admin',
          role: 'superadmin',
        }).onConflictDoNothing();
      }
      const existingAdmin = await db.select().from(admins).where(eq(admins.staticId, '21358'));
      if (existingAdmin.length === 0) {
        await db.insert(admins).values({ staticId: '21358' }).onConflictDoNothing();
      }
    } catch (adminSeedErr) {
      console.warn('Notice: Superadmin seed check skipped:', (adminSeedErr as Error).message);
    }
  } catch (err) {
    console.error('Error during seedInitialAdmin:', err);
  }
}

export async function getDbData(): Promise<AppDataType> {
  if (!isDbAvailable()) {
    throw new Error('Database not configured');
  }

  // Ensure tables and JSON data seeding are complete before reading DB
  try {
    await seedInitialAdmin();
  } catch {
    // Ignore seed errors when DB is unreachable in preview
  }

  try {
    const dbUsers = await db.select().from(users);
    const dbReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    const dbArchives = await db.select().from(archives).orderBy(desc(archives.createdAt));
    const dbAdmins = await db.select().from(admins);

    const mappedUsers: UserType[] = dbUsers.map((u) => ({
      staticId: u.staticId,
      nickname: u.nickname,
      discord: u.discord,
      password: u.password || undefined,
      role: (u.role as UserType['role']) || 'instructor',
      rank: u.rank || undefined,
      callsign: u.callsign || undefined,
      avatarUrl: u.avatarUrl || undefined,
      createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
    }));

    if (!mappedUsers.some((u) => u.staticId === '21358')) {
      mappedUsers.unshift({
        nickname: 'Станислав Яров',
        staticId: '21358',
        discord: 'nensikq',
        password: 'admin',
        role: 'superadmin',
      });
    }

    const mappedReports: ReportType[] = dbReports.map((r) => ({
      id: r.id,
      userId: r.userId,
      nickname: r.nickname,
      discord: r.discord,
      date: r.date,
      checkedReports: r.checkedReports,
      gatherings: r.gatherings,
      arrests: r.arrests,
      events: r.events,
      proofUrl: r.proofUrl || undefined,
      notes: r.notes || undefined,
      status: (r.status as ReportType['status']) || 'pending',
      reviewedBy: r.reviewedBy || undefined,
      reviewedAt: r.reviewedAt || undefined,
      reviewComment: r.reviewComment || undefined,
    }));

    const mappedArchives: WeeklyArchiveType[] = dbArchives.map((a) => ({
      id: a.id,
      title: a.title,
      startDate: a.startDate,
      endDate: a.endDate,
      closedBy: a.closedBy,
      closedAt: a.closedAt,
      reportsCount: a.reportsCount,
      totalPoints: a.totalPoints,
      totalCheckedReports: a.totalCheckedReports,
      totalGatherings: a.totalGatherings,
      totalArrests: a.totalArrests,
      totalEvents: a.totalEvents,
      archivedReports: (a.archivedReports as ReportType[]) || [],
      instructorSummary: (a.instructorSummary as WeeklyArchiveType['instructorSummary']) || [],
    }));

    const adminList = dbAdmins.map((a) => a.staticId);

    const freshResult = {
      users: mappedUsers,
      reports: mappedReports,
      admins: adminList,
      archives: mappedArchives,
    };

    updateInMemoryStore(() => freshResult);

    return freshResult;
  } catch (err) {
    return getLocalJsonFallback();
  }
}

export async function upsertUserInDb(user: UserType) {
  updateInMemoryStore((prev) => {
    const idx = prev.users.findIndex((u) => u.staticId === user.staticId);
    const updatedUsers = [...prev.users];
    if (idx >= 0) {
      updatedUsers[idx] = { ...updatedUsers[idx], ...user };
    } else {
      updatedUsers.push(user);
    }
    return { ...prev, users: updatedUsers };
  });

  if (!isDbAvailable()) return;
  try {
    await db.insert(users).values({
      staticId: user.staticId,
      nickname: user.nickname,
      discord: user.discord,
      password: user.password,
      role: user.role || 'instructor',
      rank: user.rank,
      callsign: user.callsign,
      avatarUrl: user.avatarUrl,
    }).onConflictDoUpdate({
      target: users.staticId,
      set: {
        nickname: user.nickname,
        discord: user.discord,
        password: user.password,
        role: user.role || 'instructor',
        rank: user.rank,
        callsign: user.callsign,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Error upserting user in Cloud SQL:', err);
  }
}

export async function updateUserRoleInDb(staticId: string, role: string) {
  updateInMemoryStore((prev) => {
    const updatedUsers = prev.users.map((u) => (u.staticId === staticId ? { ...u, role: role as UserType['role'] } : u));
    const updatedAdmins = [...prev.admins];
    if ((role === 'admin' || role === 'superadmin') && !updatedAdmins.includes(staticId)) {
      updatedAdmins.push(staticId);
    }
    return { ...prev, users: updatedUsers, admins: updatedAdmins };
  });

  if (!isDbAvailable()) return;
  try {
    await db.update(users).set({ role }).where(eq(users.staticId, staticId));
    if (role === 'admin' || role === 'superadmin') {
      await db.insert(admins).values({ staticId }).onConflictDoNothing();
    }
  } catch (err) {
    console.error('Error updating user role in Cloud SQL:', err);
  }
}

export async function updateUserAvatarInDb(staticId: string, avatarUrl?: string) {
  const cleanUrl = avatarUrl && avatarUrl.trim() ? avatarUrl.trim() : null;

  updateInMemoryStore((prev) => ({
    ...prev,
    users: prev.users.map((u) => (u.staticId === staticId ? { ...u, avatarUrl: cleanUrl || undefined } : u)),
  }));

  if (!isDbAvailable()) return;
  try {
    await db.update(users).set({ avatarUrl: cleanUrl }).where(eq(users.staticId, staticId));
  } catch (err) {
    console.error('Error updating user avatar in Cloud SQL:', err);
  }
}

export async function createReportInDb(report: ReportType) {
  updateInMemoryStore((prev) => {
    const idx = prev.reports.findIndex((r) => r.id === report.id);
    const updatedReports = [...prev.reports];
    if (idx >= 0) {
      updatedReports[idx] = { ...updatedReports[idx], ...report };
    } else {
      updatedReports.unshift(report);
    }
    return { ...prev, reports: updatedReports };
  });

  if (!isDbAvailable()) return;
  try {
    await db.insert(reports).values({
      id: report.id,
      userId: report.userId,
      nickname: report.nickname,
      discord: report.discord,
      date: report.date,
      checkedReports: report.checkedReports || report.checked || 0,
      gatherings: report.gatherings || report.gathered || 0,
      arrests: report.arrests || 0,
      events: report.events || report.trainings || 0,
      proofUrl: report.proofUrl,
      notes: report.notes,
      status: report.status || 'pending',
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      reviewComment: report.reviewComment,
    }).onConflictDoUpdate({
      target: reports.id,
      set: {
        status: report.status,
        reviewedBy: report.reviewedBy,
        reviewedAt: report.reviewedAt,
        reviewComment: report.reviewComment,
      },
    });
  } catch (err) {
    console.error('Error creating report in Cloud SQL:', err);
  }
}

export async function deleteReportFromDb(id: string) {
  updateInMemoryStore((prev) => ({
    ...prev,
    reports: prev.reports.filter((r) => r.id !== id),
  }));

  if (!isDbAvailable()) return;
  try {
    await db.delete(reports).where(eq(reports.id, id));
  } catch (err) {
    console.error('Error deleting report in Cloud SQL:', err);
  }
}

export async function saveArchiveInDb(archive: WeeklyArchiveType) {
  updateInMemoryStore((prev) => ({
    ...prev,
    archives: [archive, ...prev.archives],
    reports: [],
  }));

  if (!isDbAvailable()) return;
  try {
    await db.insert(archives).values({
      id: archive.id,
      title: archive.title,
      startDate: archive.startDate,
      endDate: archive.endDate,
      closedBy: archive.closedBy,
      closedAt: archive.closedAt,
      reportsCount: archive.reportsCount,
      totalPoints: archive.totalPoints,
      totalCheckedReports: archive.totalCheckedReports,
      totalGatherings: archive.totalGatherings,
      totalArrests: archive.totalArrests,
      totalEvents: archive.totalEvents,
      archivedReports: archive.archivedReports,
      instructorSummary: archive.instructorSummary,
    });
    // Clear active reports table
    await db.delete(reports);
  } catch (err) {
    console.error('Error saving archive in Cloud SQL:', err);
  }
}

export async function deleteArchiveFromDb(id: string) {
  updateInMemoryStore((prev) => ({
    ...prev,
    archives: prev.archives.filter((a) => a.id !== id),
  }));

  if (!isDbAvailable()) return;
  try {
    await db.delete(archives).where(eq(archives.id, id));
  } catch (err) {
    console.error('Error deleting archive in Cloud SQL:', err);
  }
}

export async function deleteUserFromDb(staticId: string) {
  updateInMemoryStore((prev) => ({
    ...prev,
    users: prev.users.filter((u) => u.staticId !== staticId),
    admins: prev.admins.filter((a) => a !== staticId),
  }));

  if (!isDbAvailable()) return;
  try {
    await db.delete(users).where(eq(users.staticId, staticId));
    await db.delete(admins).where(eq(admins.staticId, staticId));
  } catch (err) {
    console.error('Error deleting user from Cloud SQL:', err);
  }
}

