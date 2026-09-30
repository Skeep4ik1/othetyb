import { db } from './index.ts';
import { users, reports, archives, admins } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

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

export const isDbAvailable = () => {
  return Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME) ||
    (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB)
  );
};

export async function seedInitialAdmin() {
  if (!isDbAvailable()) return;
  try {
    const { createPool } = await import('./index.ts');
    const pool = createPool();

    // Ensure database tables exist
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
  } catch (err) {
    console.error('Error seeding initial admin or creating tables in PostgreSQL:', err);
  }
}

export async function getDbData(): Promise<AppDataType> {
  if (!isDbAvailable()) {
    throw new Error('Database not configured');
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

    return {
      users: mappedUsers,
      reports: mappedReports,
      admins: adminList,
      archives: mappedArchives,
    };
  } catch (err) {
    console.error('Error fetching data from Cloud SQL:', err);
    throw err;
  }
}

export async function upsertUserInDb(user: UserType) {
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
  if (!isDbAvailable()) return;
  try {
    await db.update(users).set({ avatarUrl: avatarUrl || null }).where(eq(users.staticId, staticId));
  } catch (err) {
    console.error('Error updating user avatar in Cloud SQL:', err);
  }
}

export async function createReportInDb(report: ReportType) {
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
  if (!isDbAvailable()) return;
  try {
    await db.delete(reports).where(eq(reports.id, id));
  } catch (err) {
    console.error('Error deleting report in Cloud SQL:', err);
  }
}

export async function saveArchiveInDb(archive: WeeklyArchiveType) {
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
  if (!isDbAvailable()) return;
  try {
    await db.delete(archives).where(eq(archives.id, id));
  } catch (err) {
    console.error('Error deleting archive in Cloud SQL:', err);
  }
}

export async function deleteUserFromDb(staticId: string) {
  if (!isDbAvailable()) return;
  try {
    await db.delete(users).where(eq(users.staticId, staticId));
    await db.delete(admins).where(eq(admins.staticId, staticId));
  } catch (err) {
    console.error('Error deleting user from Cloud SQL:', err);
  }
}

