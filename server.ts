import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATABASE, hashCredential } from './src/data/seedDatabase.ts';
import type {
  PlatformDatabase,
  UserRecord,
  TeacherRecord,
  AuditLogRecord,
  ChiefAdvisorPermissions,
  ComplaintStatus,
  NotificationItem
} from './src/types/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE_PATH = path.join(DATA_DIR, 'platform_db_v10.json');

import {
  INITIAL_LEADERSHIP_ACCOUNTS,
  type LeadershipAccountConfig
} from './src/data/leadershipCredentials.ts';

interface ServerPersistedState {
  db: PlatformDatabase;
  leadershipAccounts: LeadershipAccountConfig[];
}

function parseClassSectionLabel(label?: string): { className: string; section: string } {
  if (!label) return { className: '', section: '' };
  const parts = label.split(/—|-/).map((p) => p.trim());
  return {
    className: parts[0] || '',
    section: (parts[1] || '').toUpperCase()
  };
}

function loadOrInitializeState(): ServerPersistedState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as ServerPersistedState;
      if (parsed && parsed.db && Array.isArray(parsed.leadershipAccounts)) {
        return ensureMigrations(parsed);
      }
    }
  } catch (err) {
    console.warn('[Server DB] Failed to load persisted DB, initializing fresh state:', err);
  }

  const freshState: ServerPersistedState = {
    db: structuredClone(INITIAL_DATABASE),
    leadershipAccounts: INITIAL_LEADERSHIP_ACCOUNTS
  };
  saveState(freshState);
  return freshState;
}

function saveState(state: ServerPersistedState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Server DB] Failed to write state to disk:', err);
  }
}

function ensureMigrations(state: ServerPersistedState): ServerPersistedState {
  const seed = structuredClone(INITIAL_DATABASE);
  const db = state.db;

  // Ensure all teachers exist and have updated class assignments & personalAttendanceRate
  for (const seedTeacher of seed.teachers) {
    const existing = db.teachers.find((t) => t.id === seedTeacher.id || t.user_id === seedTeacher.user_id);
    if (!existing) {
      db.teachers.push(seedTeacher);
    } else {
      existing.classTeacherOf = seedTeacher.classTeacherOf;
      existing.assignedClasses = seedTeacher.assignedClasses;
      existing.authorizedSubjects = seedTeacher.authorizedSubjects;
      existing.department = seedTeacher.department;
      existing.designation = seedTeacher.designation;
      existing.personalAttendanceRate = seedTeacher.personalAttendanceRate;
    }
  }

  for (const seedUser of seed.users) {
    if (seedUser.role === 'teacher') {
      const existingUser = db.users.find((u) => u.id === seedUser.id || u.teacherCode === seedUser.teacherCode);
      if (!existingUser) {
        db.users.push(seedUser);
      } else {
        existingUser.name = seedUser.name;
        existingUser.studentClass = seedUser.studentClass;
        existingUser.section = seedUser.section;
      }
    }
  }

  // Sync class definitions (Class 6-8 B1/B2, Class 9-10 BS1/BS2)
  db.classes = seed.classes;

  // Ensure students and data exist
  for (const seedStudent of seed.students) {
    const existingSt = db.students.find((s) => s.id === seedStudent.id);
    if (!existingSt) {
      db.students.push(seedStudent);
    } else {
      existingSt.class = seedStudent.class;
      existingSt.section = seedStudent.section;
    }
  }
  for (const seedUser of seed.users) {
    if (seedUser.role === 'student') {
      const existingU = db.users.find((u) => u.id === seedUser.id);
      if (!existingU) {
        db.users.push(seedUser);
      } else {
        existingU.studentClass = seedUser.studentClass;
        existingU.section = seedUser.section;
      }
    }
  }
  for (const seedSub of seed.subjects) {
    if (!db.subjects.some((s) => s.id === seedSub.id)) {
      db.subjects.push(seedSub);
    }
  }
  for (const seedRes of seed.results) {
    if (!db.results.some((r) => r.id === seedRes.id)) {
      db.results.push(seedRes);
    }
  }
  for (const seedRoutine of seed.routines) {
    if (!db.routines.some((r) => r.id === seedRoutine.id)) {
      db.routines.push(seedRoutine);
    }
  }
  for (const seedAssign of seed.assignments) {
    if (!db.assignments.some((a) => a.id === seedAssign.id)) {
      db.assignments.push(seedAssign);
    }
  }

  if (!Array.isArray(db.audit_logs)) {
    db.audit_logs = seed.audit_logs || [];
  }
  if (!Array.isArray(db.teacher_calls)) {
    db.teacher_calls = seed.teacher_calls || [];
  }
  if (!db.chief_advisor_permissions) {
    db.chief_advisor_permissions = seed.chief_advisor_permissions || {
      masterAccess: true,
      viewAttendance: true,
      viewReports: true,
      viewAuditLogs: true,
      manageComplaints: true,
      viewAcademicSummaries: true,
      manageDirectory: true
    };
  }

  // Migrate complaint statuses from legacy values to Submitted / Under Review / Replied / Resolved
  if (Array.isArray(db.complaints)) {
    db.complaints = db.complaints.map((c) => {
      let status = String(c.status);
      if (status === 'New') status = 'Submitted';
      else if (status === 'Reviewed') status = c.class_teacher_note ? 'Replied' : 'Under Review';
      return {
        ...c,
        status: status as ComplaintStatus
      };
    });
  }

  // Deduplicate notifications by eventKey or id
  if (Array.isArray(db.notifications)) {
    const seenKeys = new Set<string>();
    const deduped: NotificationItem[] = [];
    for (const n of db.notifications) {
      const key = n.eventKey || n.id;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduped.push(n);
      }
    }
    db.notifications = deduped;
  }

  return state;
}

interface ActiveSession {
  token: string;
  userId: string;
  role: UserRecord['role'];
  name: string;
  code: string;
  assignedClass?: string;
  assignedSection?: string;
  createdAt: string;
}

const activeSessions = new Map<string, ActiveSession>();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const state = loadOrInitializeState();

  function getSessionFromReq(req: express.Request): ActiveSession | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice('Bearer '.length).trim();
    return activeSessions.get(token) || null;
  }

  function recordAuditLog(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRecord['role'];
    actorPosition?: string;
    category: AuditLogRecord['category'];
    action: string;
    details: string;
  }) {
    const entry: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      actorPosition: params.actorPosition,
      category: params.category,
      action: params.action,
      details: params.details,
      timestamp: new Date().toISOString()
    };
    state.db.audit_logs = [entry, ...(state.db.audit_logs || []).slice(0, 299)];
  }

  function addNotificationOnce(notif: NotificationItem) {
    if (notif.eventKey) {
      const existingIdx = state.db.notifications.findIndex((n) => n.eventKey === notif.eventKey);
      if (existingIdx !== -1) {
        return state.db.notifications[existingIdx];
      }
    }
    state.db.notifications = [notif, ...state.db.notifications];
    return notif;
  }

  // GET /api/db - Return synchronized database state
  app.get('/api/db', (_req, res) => {
    res.json({
      ok: true,
      db: state.db
    });
  });

  // POST /api/db/sync - Synchronize client database updates with server persistence
  app.post('/api/db/sync', (req, res) => {
    const incomingDb = req.body?.db as PlatformDatabase | undefined;
    if (!incomingDb || typeof incomingDb !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid database payload.' });
    }

    const existingUserHashes = new Map<string, string>();
    for (const u of state.db.users) {
      if (u.passwordHash) {
        existingUserHashes.set(u.id, u.passwordHash);
      }
    }

    // Deduplicate notifications by eventKey or id so page refreshes never duplicate notifications
    const mergedNotifs: NotificationItem[] = [];
    const seenEventKeys = new Set<string>();
    const sourceNotifs = Array.isArray(incomingDb.notifications)
      ? incomingDb.notifications
      : state.db.notifications;

    for (const n of sourceNotifs) {
      const key = n.eventKey || n.id;
      if (!seenEventKeys.has(key)) {
        seenEventKeys.add(key);
        mergedNotifs.push(n);
      }
    }

    state.db = {
      ...state.db,
      ...incomingDb,
      users: (incomingDb.users || state.db.users).map((u) => ({
        ...u,
        passwordHash: existingUserHashes.get(u.id) || u.passwordHash
      })),
      notifications: mergedNotifs,
      audit_logs:
        Array.isArray(incomingDb.audit_logs) &&
        incomingDb.audit_logs.length >= (state.db.audit_logs?.length || 0)
          ? incomingDb.audit_logs
          : state.db.audit_logs,
      chief_advisor_permissions:
        incomingDb.chief_advisor_permissions || state.db.chief_advisor_permissions
    };

    saveState(state);
    return res.json({ ok: true, db: state.db });
  });

  // POST /api/auth/staff-login - Authenticate Teacher or Leadership (Chairman, Chief Advisor, Principal)
  app.post('/api/auth/staff-login', (req, res) => {
    const rawCode = String(req.body?.code || '').trim();
    const rawPassword = String(req.body?.password || '').trim();

    if (!rawCode || !rawPassword) {
      return res.status(400).json({
        ok: false,
        error: 'Please enter both your authorized access code and password.'
      });
    }

    const passwordHash = hashCredential(rawPassword);

    // 1. Check Leadership Accounts (111111, 222222, 333333)
    const leader = state.leadershipAccounts.find((l) => l.code === rawCode);
    if (leader) {
      if (leader.passwordHash !== passwordHash) {
        return res.status(401).json({
          ok: false,
          error: 'Invalid credentials. Please verify your access code and password.'
        });
      }

      const token = crypto.randomBytes(24).toString('hex');
      const userRecord: UserRecord = {
        id: leader.id,
        name: leader.name,
        email: leader.email,
        passwordHash: leader.passwordHash,
        role: leader.role,
        position: leader.position,
        teacherCode: leader.code,
        profileImage: leader.profileImage,
        approvalStatus: 'approved',
        createdAt: '2025-01-01T08:00:00.000Z'
      };

      activeSessions.set(token, {
        token,
        userId: leader.id,
        role: leader.role,
        name: leader.name,
        code: leader.code,
        createdAt: new Date().toISOString()
      });

      recordAuditLog({
        actorId: leader.id,
        actorName: leader.name,
        actorRole: leader.role,
        actorPosition: leader.position,
        category: 'auth',
        action: 'Leadership Login',
        details: `${leader.position} (${leader.name}) authenticated into the Management Hub.`
      });
      saveState(state);

      return res.json({
        ok: true,
        token,
        user: userRecord,
        chiefAdvisorPermissions: state.db.chief_advisor_permissions,
        auditLogs: state.db.audit_logs
      });
    }

    // 2. Check Teacher Accounts
    const teacherUser = state.db.users.find(
      (u) =>
        u.role === 'teacher' &&
        (u.teacherCode === rawCode || u.name.toLowerCase() === rawCode.toLowerCase())
    );

    if (!teacherUser) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid credentials. Access code is not recognized.'
      });
    }

    const teacherProfile: TeacherRecord | undefined = state.db.teachers.find(
      (t) => t.user_id === teacherUser.id
    );

    const expectedInitialHash = hashCredential(teacherUser.teacherCode || rawCode);
    const storedHash = teacherUser.passwordHash || expectedInitialHash;

    if (passwordHash !== storedHash) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid password for this teacher account.'
      });
    }

    const parsedClassSec = parseClassSectionLabel(teacherProfile?.classTeacherOf);
    const assignedClass = teacherUser.studentClass || parsedClassSec.className || 'Class 9';
    const assignedSection = teacherUser.section || parsedClassSec.section || 'BS2';

    const token = crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, {
      token,
      userId: teacherUser.id,
      role: 'teacher',
      name: teacherUser.name,
      code: teacherUser.teacherCode || rawCode,
      assignedClass,
      assignedSection,
      createdAt: new Date().toISOString()
    });

    recordAuditLog({
      actorId: teacherUser.id,
      actorName: teacherUser.name,
      actorRole: 'teacher',
      category: 'auth',
      action: 'Teacher Login',
      details: `${teacherUser.name} (${teacherProfile?.authorizedSubjects?.[0] || 'Faculty'} · Class Teacher ${assignedClass} — ${assignedSection}) logged in.`
    });
    saveState(state);

    return res.json({
      ok: true,
      token,
      user: teacherUser,
      teacherProfile
    });
  });

  // POST /api/auth/change-password - Change password securely for authenticated user
  app.post('/api/auth/change-password', (req, res) => {
    const session = getSessionFromReq(req);
    const { userId, currentPassword, newPassword } = req.body || {};

    const targetUserId = session?.userId || String(userId || '').trim();
    const cleanCurrent = String(currentPassword || '').trim();
    const cleanNew = String(newPassword || '').trim();

    if (!targetUserId || !cleanCurrent || !cleanNew) {
      return res.status(400).json({
        ok: false,
        error: 'Current password and new password are required.'
      });
    }

    if (cleanNew.length < 6) {
      return res.status(400).json({
        ok: false,
        error: 'New password must be at least 6 characters.'
      });
    }

    const currentHash = hashCredential(cleanCurrent);
    const newHash = hashCredential(cleanNew);

    // Check if leadership account
    const leader = state.leadershipAccounts.find((l) => l.id === targetUserId);
    if (leader) {
      if (leader.passwordHash !== currentHash) {
        return res.status(403).json({
          ok: false,
          error: 'Current password is incorrect.'
        });
      }
      leader.passwordHash = newHash;
      const dbUser = state.db.users.find((u) => u.id === leader.id);
      if (dbUser) {
        dbUser.passwordHash = newHash;
        dbUser.passwordChanged = true;
      }
      recordAuditLog({
        actorId: leader.id,
        actorName: leader.name,
        actorRole: leader.role,
        actorPosition: leader.position,
        category: 'security',
        action: 'Password Changed',
        details: `${leader.position} (${leader.name}) updated their account password.`
      });
      saveState(state);
      return res.json({ ok: true });
    }

    // Check regular user / teacher
    const userRecord = state.db.users.find((u) => u.id === targetUserId);
    if (!userRecord) {
      return res.status(404).json({ ok: false, error: 'Account not found.' });
    }

    if (userRecord.passwordHash !== currentHash) {
      return res.status(403).json({
        ok: false,
        error: 'Current password is incorrect.'
      });
    }

    userRecord.passwordHash = newHash;
    userRecord.passwordChanged = true;
    recordAuditLog({
      actorId: userRecord.id,
      actorName: userRecord.name,
      actorRole: userRecord.role,
      category: 'security',
      action: 'Password Changed',
      details: `${userRecord.name} updated their account password.`
    });
    saveState(state);

    return res.json({ ok: true });
  });

  // POST /api/leadership/chief-advisor-permissions - Configure Chief Advisor permissions (Chairman/Principal only)
  app.post('/api/leadership/chief-advisor-permissions', (req, res) => {
    const session = getSessionFromReq(req);
    const actorRole = session?.role || req.body?.actorRole;
    if (actorRole !== 'chairman' && actorRole !== 'principal') {
      return res.status(403).json({
        ok: false,
        error: 'Only the Chairman or Principal can configure Chief Advisor permissions.'
      });
    }

    const incoming = req.body?.permissions as Partial<ChiefAdvisorPermissions> | undefined;
    if (!incoming) {
      return res.status(400).json({ ok: false, error: 'Missing permissions payload.' });
    }

    const updated: ChiefAdvisorPermissions = {
      masterAccess: Boolean(incoming.masterAccess),
      viewAttendance: incoming.masterAccess ? true : Boolean(incoming.viewAttendance),
      viewReports: incoming.masterAccess ? true : Boolean(incoming.viewReports),
      viewAuditLogs: incoming.masterAccess ? true : Boolean(incoming.viewAuditLogs),
      manageComplaints: incoming.masterAccess ? true : Boolean(incoming.manageComplaints),
      viewAcademicSummaries: incoming.masterAccess ? true : Boolean(incoming.viewAcademicSummaries),
      manageDirectory: incoming.masterAccess ? true : Boolean(incoming.manageDirectory),
      updatedBy: session?.name || 'Administrator',
      updatedAt: new Date().toISOString()
    };

    state.db.chief_advisor_permissions = updated;

    recordAuditLog({
      actorId: session?.userId || 'usr-leader-chairman',
      actorName: session?.name || 'Administrator',
      actorRole: (actorRole as UserRecord['role']) || 'chairman',
      category: 'management',
      action: 'Updated Chief Advisor Permissions',
      details: `Configured Chief Advisor access permissions (Master Access: ${updated.masterAccess ? 'Enabled' : 'Restricted'}).`
    });

    saveState(state);
    return res.json({
      ok: true,
      chiefAdvisorPermissions: state.db.chief_advisor_permissions,
      auditLogs: state.db.audit_logs
    });
  });

  // POST /api/teacher/review-registration - Enforce class teacher approval permissions on backend
  app.post('/api/teacher/review-registration', (req, res) => {
    const session = getSessionFromReq(req);
    const { studentUserId, newStatus, reviewerName, reviewerClass, reviewerSection, reviewerRole } = req.body || {};

    if (!studentUserId || (newStatus !== 'approved' && newStatus !== 'rejected')) {
      return res.status(400).json({ ok: false, error: 'Invalid review parameters.' });
    }

    const verifList = state.db.verification_requests || [];
    const targetReq = verifList.find((r) => r.student_id === studentUserId);
    const targetUser = state.db.users.find((u) => u.id === studentUserId);

    const studentClass = (targetReq?.class_name || targetUser?.studentClass || '').trim();
    const studentSection = (targetReq?.section || targetUser?.section || '').trim().toUpperCase();

    const effectiveRole = session?.role || reviewerRole || 'teacher';
    const isMaster =
      effectiveRole === 'chairman' ||
      effectiveRole === 'principal' ||
      (effectiveRole === 'chief_advisor' &&
        (state.db.chief_advisor_permissions?.masterAccess ||
          state.db.chief_advisor_permissions?.manageDirectory));

    if (!isMaster) {
      const assignedClass = (session?.assignedClass || reviewerClass || '').trim();
      const assignedSection = (session?.assignedSection || reviewerSection || '').trim().toUpperCase();

      if (
        studentClass &&
        studentSection &&
        (assignedClass.toLowerCase() !== studentClass.toLowerCase() ||
          assignedSection.toUpperCase() !== studentSection.toUpperCase())
      ) {
        return res.status(403).json({
          ok: false,
          error: `Unauthorized: Only the assigned Class Teacher for ${studentClass} ${studentSection} can review this registration.`
        });
      }
    }

    const nowIso = new Date().toISOString();
    if (targetUser) {
      targetUser.approvalStatus = newStatus;
    }
    if (targetReq) {
      targetReq.status = newStatus;
      targetReq.reviewed_by = session?.name || reviewerName || 'Class Teacher';
      targetReq.reviewed_at = nowIso;
    }

    // Mark the teacher's pending registration notification as read & resolved
    state.db.notifications = state.db.notifications.map((n) => {
      if (
        (n.studentUserId === studentUserId && n.targetRole === 'teacher') ||
        n.eventKey === `reg-req-${studentUserId}`
      ) {
        return { ...n, read: true, resolved: true };
      }
      return n;
    });

    // Create/update student record in db.students if approved
    if (newStatus === 'approved' && targetUser) {
      const existingSt = state.db.students.find((s) => s.user_id === studentUserId);
      if (!existingSt) {
        const classStudents = state.db.students.filter(
          (s) =>
            s.class.toLowerCase() === studentClass.toLowerCase() &&
            s.section.toUpperCase() === studentSection.toUpperCase()
        );
        state.db.students.push({
          id: `st-${studentUserId}`,
          user_id: studentUserId,
          student_id: targetUser.studentIdCode || targetReq?.student_code || `SSC-2026-${Date.now().toString().slice(-4)}`,
          name: targetUser.name,
          roll: classStudents.length + 1,
          class: studentClass,
          section: studentSection,
          academic_year: '2026',
          streakDays: 1
        });
      }
    }

    // Create exactly one notification for the student
    const studentName = targetReq?.student_name || targetUser?.name || 'Student';
    addNotificationOnce({
      id: `notif-reg-dec-${studentUserId}-${newStatus}`,
      eventKey: `reg-dec-${studentUserId}-${newStatus}`,
      title:
        newStatus === 'approved'
          ? 'Registration Approved by Class Teacher'
          : 'Registration Declined by Class Teacher',
      message:
        newStatus === 'approved'
          ? `Welcome ${studentName}! Your registration for ${studentClass} — ${studentSection} has been approved.`
          : `Your registration request for ${studentClass} — ${studentSection} was declined.`,
      timestamp: 'Just now',
      read: false,
      targetRole: 'student',
      category: 'approval',
      notificationType: 'registration_reviewed',
      studentUserId,
      studentClass,
      studentSection
    });

    recordAuditLog({
      actorId: session?.userId || 'teacher',
      actorName: session?.name || reviewerName || 'Class Teacher',
      actorRole: effectiveRole as UserRecord['role'],
      category: 'approval',
      action: `Student Registration ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
      details: `${studentName} (${studentClass} — ${studentSection}) registration was ${newStatus}.`
    });

    saveState(state);
    return res.json({ ok: true, db: state.db });
  });

  // POST /api/leadership/manage-entity - Manage teachers, students, classes/sections (Chairman/Principal/Authorized Advisor)
  app.post('/api/leadership/manage-entity', (req, res) => {
    const session = getSessionFromReq(req);
    const actorRole = session?.role || req.body?.actorRole;
    const canManage =
      actorRole === 'chairman' ||
      actorRole === 'principal' ||
      (actorRole === 'chief_advisor' &&
        (state.db.chief_advisor_permissions?.masterAccess ||
          state.db.chief_advisor_permissions?.manageDirectory));

    if (!canManage) {
      return res.status(403).json({
        ok: false,
        error: 'Unauthorized: Master access is required to manage school entities.'
      });
    }

    const { entityType, action, payload } = req.body || {};

    if (entityType === 'teacher' && action === 'assign_class') {
      const { teacherId, className, section, grantAdditionalClass } = payload || {};
      const teacher = state.db.teachers.find((t) => t.id === teacherId);
      if (!teacher) {
        return res.status(404).json({ ok: false, error: 'Teacher not found.' });
      }
      const userRec = state.db.users.find((u) => u.id === teacher.user_id);
      const label = `${className} — ${section}`;

      if (grantAdditionalClass) {
        const current = new Set(teacher.assignedClasses || []);
        current.add(label);
        teacher.assignedClasses = Array.from(current);
      } else {
        teacher.classTeacherOf = label;
        const current = new Set(teacher.assignedClasses || []);
        current.add(label);
        teacher.assignedClasses = Array.from(current);

        if (userRec) {
          userRec.studentClass = className;
          userRec.section = section;
        }
      }

      recordAuditLog({
        actorId: session?.userId || 'leadership',
        actorName: session?.name || 'Leadership',
        actorRole: (actorRole as UserRecord['role']) || 'chairman',
        category: 'management',
        action: 'Updated Teacher Assignment',
        details: `Assigned ${userRec?.name || teacher.id} to ${label}.`
      });
      saveState(state);
      return res.json({ ok: true, db: state.db });
    }

    return res.json({ ok: true, db: state.db });
  });

  // Health check endpoint for Cloud Run deployment probes
  app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  // Vite middleware in dev, static in production (only serve dist when NODE_ENV=production and dist/index.html exists)
  const distPath = path.join(__dirname, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distIndexPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scholars School & College Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
