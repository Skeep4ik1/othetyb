import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Report, 
  ActiveTab, 
  ReportStatus,
  WeeklyArchive
} from './types';
import { 
  SUPER_ADMIN_ID, 
  DEFAULT_USERS, 
  INITIAL_REPORTS, 
  loadStoredData 
} from './utils/storage';
import {
  fetchDbData,
  apiSaveUser,
  apiUpdateAvatar,
  apiAddReport,
  apiDeleteReport,
  apiSaveAdmins,
  apiResetData,
  apiArchiveWeek,
  apiSaveArchive,
  apiDeleteArchive,
  apiSendHeartbeat,
  apiUpdateUserRole,
  apiDeleteUser
} from './utils/api';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { MobileDrawer } from './components/MobileDrawer';
import { AuthScreen } from './components/AuthScreen';
import { NewReportTab } from './components/NewReportTab';
import { HistoryTab } from './components/HistoryTab';
import { InstructorsTab } from './components/InstructorsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { AdminPanelTab } from './components/AdminPanelTab';
import { WeeklyArchivesTab } from './components/WeeklyArchivesTab';
import { InfoTab } from './components/InfoTab';
import { ReportDetailModal } from './components/ReportDetailModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ToastContainer, ToastData } from './components/Toast';

function MainApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [reports, setReports] = useState<Report[]>([]);
  const [archives, setArchives] = useState<WeeklyArchive[]>([]);
  const [admins, setAdmins] = useState<string[]>([SUPER_ADMIN_ID]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('new');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Toast notification helper
  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize data and polling from Server
  useEffect(() => {
    // 1. Initial local load
    const stored = loadStoredData();
    if (stored.currentUser) {
      setCurrentUser(stored.currentUser);
    }
    setUsers(stored.users);
    setReports(stored.reports);
    setAdmins(stored.admins);
    if (stored.archives && stored.archives.length > 0) {
      setArchives(stored.archives);
    }

    // 2. Initial server load
    const syncWithServer = async () => {
      const serverDb = await fetchDbData();
      if (serverDb) {
        if (serverDb.users && serverDb.users.length > 0) {
          const userMap = new Map<string, User>();
          serverDb.users.forEach((u) => {
            if (u && u.staticId) {
              const av = u.avatarUrl || (u as any).avatar_url;
              userMap.set(u.staticId, { ...u, avatarUrl: av });
            }
          });

          // Check if stored local users have any missing users or avatars that server doesn't have yet
          if (stored.users) {
            for (const localU of stored.users) {
              if (localU && localU.staticId) {
                const existing = userMap.get(localU.staticId);
                const localAvatar = localU.avatarUrl || (localU as any).avatar_url;
                if (!existing) {
                  userMap.set(localU.staticId, localU);
                  apiSaveUser(localU);
                } else if (!existing.avatarUrl && localAvatar) {
                  const merged = { ...existing, avatarUrl: localAvatar };
                  userMap.set(localU.staticId, merged);
                  apiUpdateAvatar(localU.staticId, localAvatar);
                }
              }
            }
          }

          const mergedUsers = Array.from(userMap.values());

          setUsers(mergedUsers);
          localStorage.setItem('depV_users', JSON.stringify(mergedUsers));

          // Refresh current user if exists
          const currentStatic = stored.currentUser?.staticId;
          if (currentStatic) {
            const updatedCurrent = mergedUsers.find((u) => u.staticId === currentStatic);
            if (updatedCurrent) {
              setCurrentUser(updatedCurrent);
              localStorage.setItem('depV_user', JSON.stringify(updatedCurrent));
            }
          }
        }

        if (serverDb.reports) {
          const uniqueRepMap = new Map<string, Report>();
          serverDb.reports.forEach((r) => { if (r && r.id) uniqueRepMap.set(r.id, r); });
          const uniqueReports = Array.from(uniqueRepMap.values());
          setReports(uniqueReports);
          localStorage.setItem('depV_reports', JSON.stringify(uniqueReports));
        }

        if (serverDb.archives) {
          setArchives(serverDb.archives);
          localStorage.setItem('depV_archives', JSON.stringify(serverDb.archives));
        }

        if (serverDb.admins) {
          setAdmins(serverDb.admins);
          localStorage.setItem('depV_admins', JSON.stringify(serverDb.admins));
        }

        if (serverDb.onlineUsers) {
          setOnlineUsers(serverDb.onlineUsers);
        }
      }
    };

    syncWithServer();

    // 3. Live Polling every 3 seconds for multi-user / multi-device sync
    const interval = setInterval(async () => {
      const serverDb = await fetchDbData();
      if (serverDb) {
        if (serverDb.users && serverDb.users.length > 0) {
          const pollingUserMap = new Map<string, User>();
          serverDb.users.forEach((u) => { if (u && u.staticId) pollingUserMap.set(u.staticId, u); });
          const uniqueUsers = Array.from(pollingUserMap.values());

          setUsers(uniqueUsers);
          localStorage.setItem('depV_users', JSON.stringify(uniqueUsers));

          // Real-time synchronization of currentUser when role / nickname / avatar changes
          setCurrentUser((prevCurrent) => {
            if (!prevCurrent?.staticId) return prevCurrent;
            const freshMe = uniqueUsers.find((u) => u.staticId === prevCurrent.staticId);
            if (freshMe) {
              if (
                freshMe.role !== prevCurrent.role ||
                freshMe.nickname !== prevCurrent.nickname ||
                freshMe.avatarUrl !== prevCurrent.avatarUrl
              ) {
                localStorage.setItem('depV_user', JSON.stringify(freshMe));
                return freshMe;
              }
            }
            return prevCurrent;
          });
        }
        if (serverDb.reports) {
          const uniqueRepMap = new Map<string, Report>();
          serverDb.reports.forEach((r) => { if (r && r.id) uniqueRepMap.set(r.id, r); });
          const uniqueReports = Array.from(uniqueRepMap.values());
          setReports(uniqueReports);
          localStorage.setItem('depV_reports', JSON.stringify(uniqueReports));
        }
        if (serverDb.archives) setArchives(serverDb.archives);
        if (serverDb.admins) {
          setAdmins(serverDb.admins);
          localStorage.setItem('depV_admins', JSON.stringify(serverDb.admins));
        }
        if (serverDb.onlineUsers) setOnlineUsers(serverDb.onlineUsers);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Heartbeat timer for active user presence
  useEffect(() => {
    if (!currentUser?.staticId) return;

    const sendPing = async () => {
      const online = await apiSendHeartbeat(currentUser.staticId);
      if (online) setOnlineUsers(online);
    };

    sendPing();
    const heartbeatInterval = setInterval(sendPing, 5000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUser?.staticId]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('depV_user', JSON.stringify(user));
    showToast(`Добро пожаловать, ${user.nickname}!`, 'success');
  };

  const handleRegister = async (newUser: User) => {
    const updatedUsers = [...users.filter((u) => u.staticId !== newUser.staticId), newUser];
    setUsers(updatedUsers);
    localStorage.setItem('depV_users', JSON.stringify(updatedUsers));
    handleLogin(newUser);

    // Sync to Server
    const res = await apiSaveUser(newUser);
    if (res && res.users && res.users.length > 0) {
      setUsers(res.users);
      localStorage.setItem('depV_users', JSON.stringify(res.users));
    }
    showToast(`Регистрация успешна! Добро пожаловать, ${newUser.nickname}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('depV_user');
    setActiveTab('new');
    showToast('Вы вышли из системы', 'info');
  };

  const handleUpdateUserAvatar = async (targetStaticId: string, avatarUrl: string) => {
    const updatedUsers = users.map((u) =>
      u.staticId === targetStaticId ? { ...u, avatarUrl: avatarUrl || undefined } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('depV_users', JSON.stringify(updatedUsers));

    if (currentUser && currentUser.staticId === targetStaticId) {
      const updatedCurrent = { ...currentUser, avatarUrl: avatarUrl || undefined };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('depV_user', JSON.stringify(updatedCurrent));
    }

    // Sync to Server
    await apiUpdateAvatar(targetStaticId, avatarUrl);
    showToast('Аватарка успешно обновлена!', 'success');
  };

  const handleUpdateUserRole = async (targetStaticId: string, role: string) => {
    const newRole = role as User['role'];
    const updatedUsers = users.map((u) =>
      u.staticId === targetStaticId ? { ...u, role: newRole } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('depV_users', JSON.stringify(updatedUsers));

    if (currentUser && currentUser.staticId === targetStaticId) {
      const updatedCurrent = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrent);
      localStorage.setItem('depV_user', JSON.stringify(updatedCurrent));
    }

    let newAdmins = [...admins];
    if (newRole === 'admin' || newRole === 'superadmin' || newRole === 'senior_instructor') {
      if (!newAdmins.includes(targetStaticId)) {
        newAdmins.push(targetStaticId);
      }
    } else {
      if (targetStaticId !== SUPER_ADMIN_ID) {
        newAdmins = newAdmins.filter((id) => id !== targetStaticId);
      }
    }
    setAdmins(newAdmins);
    localStorage.setItem('depV_admins', JSON.stringify(newAdmins));

    await apiUpdateUserRole(targetStaticId, role);
    showToast('Должность сотрудника успешно обновлена!', 'success');
  };

  const handleDeleteUser = async (targetStaticId: string) => {
    if (currentUser?.staticId === targetStaticId) {
      showToast('Вы не можете удалить собственный аккаунт!', 'error');
      return;
    }

    const updatedUsers = users.filter((u) => u.staticId !== targetStaticId);
    const updatedAdmins = admins.filter((id) => id !== targetStaticId);
    setUsers(updatedUsers);
    setAdmins(updatedAdmins);
    localStorage.setItem('depV_users', JSON.stringify(updatedUsers));
    localStorage.setItem('depV_admins', JSON.stringify(updatedAdmins));

    await apiDeleteUser(targetStaticId);
    showToast(`Пользователь #${targetStaticId} успешно удалён из базы данных!`, 'success');
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('depV_user', JSON.stringify(user));
  };

  const handleResetSeedData = async () => {
    setReports(INITIAL_REPORTS);
    setAdmins([SUPER_ADMIN_ID]);
    setUsers(DEFAULT_USERS);
    localStorage.setItem('depV_reports', JSON.stringify(INITIAL_REPORTS));
    localStorage.setItem('depV_admins', JSON.stringify([SUPER_ADMIN_ID]));
    localStorage.setItem('depV_users', JSON.stringify(DEFAULT_USERS));

    await apiResetData();
  };

  const handleAddReport = async (report: Report) => {
    setReports((prev) => [report, ...prev]);
    await apiAddReport(report);
  };

  const handleArchiveWeek = async (title?: string) => {
    if (reports.length === 0) {
      showToast('Нет активных рапортов для архивации', 'info');
      return;
    }

    const res = await apiArchiveWeek(title, currentUser?.nickname || 'Руководство');
    if (res && res.archives) {
      setReports([]);
      setArchives(res.archives);
      localStorage.setItem('depV_reports', JSON.stringify([]));
      localStorage.setItem('depV_archives', JSON.stringify(res.archives));
      showToast('Неделя успешно закрыта! Рапорты сохранены в архиве.', 'success');
      setActiveTab('archive');
    } else {
      // Fallback local archive creation
      showToast('Еженедельный отчёт сохранён', 'success');
      setReports([]);
      setActiveTab('archive');
    }
  };

  const handleDeleteArchive = async (archiveId: string) => {
    setArchives((prev) => {
      const updated = prev.filter((a) => a.id !== archiveId);
      localStorage.setItem('depV_archives', JSON.stringify(updated));
      return updated;
    });
    await apiDeleteArchive(archiveId);
    showToast('Архив за неделю удалён', 'info');
  };

  const handleDeleteReport = async (reportId: string) => {
    setReports((prev) => {
      const updated = prev.filter((r) => r.id !== reportId);
      localStorage.setItem('depV_reports', JSON.stringify(updated));
      return updated;
    });
    await apiDeleteReport(reportId);
    showToast('Рапорт удалён', 'info');
  };

  const handleUpdateReportStatus = (
    reportId: string,
    status: ReportStatus,
    comment?: string
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status,
            reviewedBy: currentUser?.nickname || 'Администратор',
            reviewedAt: new Date().toISOString(),
            reviewComment: comment || (status === 'approved' ? 'Одобрено' : 'Отклонено'),
          };
        }
        return r;
      })
    );

    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport((prev) =>
        prev
          ? {
              ...prev,
              status,
              reviewedBy: currentUser?.nickname || 'Администратор',
              reviewedAt: new Date().toISOString(),
              reviewComment: comment,
            }
          : null
      );
    }
  };

  // Determine if current user is admin / leadership
  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return (
      admins.includes(currentUser.staticId) ||
      currentUser.staticId === SUPER_ADMIN_ID ||
      currentUser.role === 'superadmin' ||
      currentUser.role === 'admin' ||
      currentUser.role === 'senior_instructor'
    );
  }, [currentUser, admins]);

  const myReportsCount = useMemo(() => {
    if (!currentUser) return 0;
    const activeCount = reports.filter((r) => r.userId === currentUser.staticId).length;
    const archivedCount = archives.reduce(
      (acc, a) =>
        acc + (a.archivedReports?.filter((r) => r.userId === currentUser.staticId).length || 0),
      0
    );
    return activeCount + archivedCount;
  }, [reports, archives, currentUser]);

  const activeOnlineUsers = useMemo(() => {
    if (!currentUser?.staticId) return onlineUsers;
    return onlineUsers.includes(currentUser.staticId)
      ? onlineUsers
      : [currentUser.staticId, ...onlineUsers];
  }, [onlineUsers, currentUser]);

  const pendingReportsCount = 0;

  if (!currentUser) {
    return (
      <>
        <AuthScreen 
          users={users} 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080808] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        myReportsCount={myReportsCount}
        pendingReportsCount={pendingReportsCount}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onUpdateAvatar={(url) => handleUpdateUserAvatar(currentUser.staticId, url)}
        allReports={reports}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        onlineUsers={activeOnlineUsers}
        users={users}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {activeTab === 'new' && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NewReportTab
                currentUser={currentUser}
                onAddReport={handleAddReport}
                showToast={showToast}
                onViewHistory={() => setActiveTab('history')}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryTab
                currentUser={currentUser}
                reports={reports}
                archives={archives}
                onSelectReport={setSelectedReport}
                onDeleteReport={handleDeleteReport}
                onGoToNewReport={() => setActiveTab('new')}
              />
            </motion.div>
          )}

          {activeTab === 'instructors' && (
            <motion.div
              key="instructors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InstructorsTab
                users={users}
                reports={reports}
                admins={admins}
                currentUser={currentUser}
                onSelectReport={setSelectedReport}
                onDeleteReport={handleDeleteReport}
                showToast={showToast}
                onUpdateUserAvatar={handleUpdateUserAvatar}
                onlineUsers={activeOnlineUsers}
                onUpdateUserRole={handleUpdateUserRole}
                onDeleteUser={handleDeleteUser}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsTab reports={reports} showToast={showToast} />
            </motion.div>
          )}

          {activeTab === 'archive' && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WeeklyArchivesTab
                archives={archives}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onSelectReport={setSelectedReport}
                onDeleteArchive={handleDeleteArchive}
                showToast={showToast}
                onGoToNewReport={() => setActiveTab('new')}
              />
            </motion.div>
          )}

          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <InfoTab />
            </motion.div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanelTab
                reports={reports}
                admins={admins}
                setAdmins={setAdmins}
                users={users}
                currentUser={currentUser}
                onUpdateReportStatus={handleUpdateReportStatus}
                onSelectReport={setSelectedReport}
                onDeleteReport={handleDeleteReport}
                showToast={showToast}
                onResetSeedData={handleResetSeedData}
                onArchiveWeek={handleArchiveWeek}
                onlineUsers={activeOnlineUsers}
                onUpdateUserRole={handleUpdateUserRole}
                onDeleteUser={handleDeleteUser}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        myReportsCount={myReportsCount}
        pendingReportsCount={pendingReportsCount}
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        reports={reports}
        onResetSeedData={handleResetSeedData}
        showToast={showToast}
        onNavigateTab={(tab) => setActiveTab(tab)}
        isAdmin={isAdmin}
      />

      {/* Report Details Modal */}
      <ReportDetailModal
        report={selectedReport}
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onDeleteReport={handleDeleteReport}
        onStatusChange={(id, status, comment) =>
          handleUpdateReportStatus(id, status, comment)
        }
        onCopyNotice={() => showToast('Текст рапорта скопирован', 'info')}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        isAdmin={isAdmin}
        myReportsCount={myReportsCount}
        onOpenAvatarModal={() => {
          setActiveTab('history');
        }}
        onNavigateHistory={() => setActiveTab('history')}
        onUpdateAvatar={(url) => handleUpdateUserAvatar(currentUser.staticId, url)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
