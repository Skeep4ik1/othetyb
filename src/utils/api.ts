import { User, Report, WeeklyArchive } from '../types';

export interface DbData {
  users: User[];
  reports: Report[];
  admins: string[];
  archives: WeeklyArchive[];
  onlineUsers?: string[];
}

export async function apiSendHeartbeat(staticId: string): Promise<string[] | null> {
  try {
    const res = await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staticId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.onlineUsers || [];
    }
  } catch (err) {
    console.error('Failed to send heartbeat:', err);
  }
  return null;
}

export async function apiUpdateUserRole(staticId: string, role: string): Promise<DbData | null> {
  try {
    const res = await fetch('/api/users/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staticId, role }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to update user role via API:', err);
  }
  return null;
}

export async function apiDeleteUser(staticId: string): Promise<DbData | null> {
  try {
    const res = await fetch(`/api/users/${staticId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to delete user via API:', err);
  }
  return null;
}

export async function fetchDbData(): Promise<DbData | null> {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data: DbData = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to fetch DB data from server:', err);
  }
  return null;
}

export async function apiSaveUser(user: User): Promise<DbData | null> {
  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to save user via API:', err);
  }
  return null;
}

export async function apiUpdateAvatar(staticId: string, avatarUrl: string): Promise<DbData | null> {
  try {
    const res = await fetch('/api/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staticId, avatarUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to update avatar via API:', err);
  }
  return null;
}

export async function apiAddReport(report: Report): Promise<DbData | null> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to add report via API:', err);
  }
  return null;
}

export async function apiDeleteReport(id: string): Promise<DbData | null> {
  try {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to delete report via API:', err);
  }
  return null;
}

export async function apiSaveAdmins(admins: string[]): Promise<DbData | null> {
  try {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admins }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to save admins via API:', err);
  }
  return null;
}

export async function apiSaveArchive(archive: WeeklyArchive): Promise<DbData | null> {
  try {
    const res = await fetch('/api/archives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archive }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to save archive via API:', err);
  }
  return null;
}

export async function apiArchiveWeek(title?: string, closedBy?: string): Promise<DbData | null> {
  try {
    const res = await fetch('/api/archive-week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, closedBy }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to archive week via API:', err);
  }
  return null;
}

export async function apiDeleteArchive(id: string): Promise<DbData | null> {
  try {
    const res = await fetch(`/api/archives/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to delete archive via API:', err);
  }
  return null;
}

export async function apiResetData(): Promise<DbData | null> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('Failed to reset DB data via API:', err);
  }
  return null;
}
