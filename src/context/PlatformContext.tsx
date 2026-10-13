import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  PlatformDatabase,
  UserRecord,
  UserRole,
  AttendanceStatus,
  ExamRecord,
  AssignmentRecord,
  NoticeRecord,
  PreviousQuestionRecord,
  BrainifyQuizHistory,
  VerificationRequestRecord,
  NotificationItem,
  StudentComplaintRecord,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  ChiefAdvisorPermissions,
  AuditLogRecord,
  TeacherCallRecord
} from '../types/database';
import { INITIAL_DATABASE, hashCredential } from '../data/seedDatabase';
import {
  findPreRegisteredStudent,
  PRE_REGISTERED_STUDENTS,
  ALL_CLASS_SECTIONS,
  isPlaceholderStudentName,
  getAuthoritativeStudentName
} from '../data/studentCredentials';
import { sound } from '../utils/sound';
import {
  findLeadershipAccount,
  toLeadershipUserRecord,
  INITIAL_LEADERSHIP_ACCOUNTS,
  LEADERSHIP_CODES
} from '../data/leadershipCredentials';
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigDiagnostic,
  supabaseFetchPendingSectionCounts,
  supabaseRegisterStudent,
  supabaseLoginStudentByCode,
  supabaseLoginTeacher,
  supabaseRestoreUserSession,
  supabaseCheckStudentStatusByEmail,
  supabaseFetchSectionVerificationData,
  supabaseReviewStudentStatus,
  subscribeToSupabaseVerificationChanges,
  StudentRegistrationDebugTrace,
  TeacherQueryDebugTrace,
  getLatestStudentRegistrationTrace,
  getLatestTeacherQueryTrace
} from '../lib/supabase';

const SSC_PERSISTED_SESSION_KEY = 'ssc_authenticated_session_v2';
const SSC_PERSISTED_COMPLAINTS_KEY = 'ssc_student_complaints_v5';
const SSC_PERSISTED_ATTENDANCE_OVERRIDES_KEY = 'ssc_attendance_30d_overrides_v2';
const SSC_PERSISTED_RESULTS_OVERRIDES_KEY = 'ssc_results_overrides_v2';
const SSC_PERSISTED_NOTIFICATIONS_KEY = 'ssc_notifications_v5';
const SSC_PERSISTED_VERIFICATION_KEY = 'ssc_verification_requests_v3';
const SSC_STAFF_TOKEN_KEY = 'ssc_staff_auth_token_v1';

export function deduplicateNotifications(list: NotificationItem[]): NotificationItem[] {
  const seen = new Set<string>();
  const result: NotificationItem[] = [];
  for (const item of list) {
    const key = item.eventKey || item.id;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function loadPersistedVerificationRequests(): VerificationRequestRecord[] {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_VERIFICATION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VerificationRequestRecord[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return [];
}

function savePersistedVerificationRequests(reqs: VerificationRequestRecord[]): void {
  try {
    localStorage.setItem(SSC_PERSISTED_VERIFICATION_KEY, JSON.stringify(reqs));
  } catch {
    // Ignore storage write errors
  }
}

function loadPersistedResultsOverrides(): PlatformDatabase['results'] | null {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_RESULTS_OVERRIDES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlatformDatabase['results'];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function savePersistedResultsOverrides(records: PlatformDatabase['results']): void {
  try {
    localStorage.setItem(SSC_PERSISTED_RESULTS_OVERRIDES_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage write errors
  }
}

function loadPersistedComplaints(): StudentComplaintRecord[] | null {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_COMPLAINTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentComplaintRecord[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function savePersistedComplaints(complaints: StudentComplaintRecord[]): void {
  try {
    localStorage.setItem(SSC_PERSISTED_COMPLAINTS_KEY, JSON.stringify(complaints));
  } catch {
    // Ignore storage write errors
  }
}

function loadPersistedAttendanceOverrides(): PlatformDatabase['attendance'] | null {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_ATTENDANCE_OVERRIDES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlatformDatabase['attendance'];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function savePersistedAttendanceOverrides(records: PlatformDatabase['attendance']): void {
  try {
    localStorage.setItem(SSC_PERSISTED_ATTENDANCE_OVERRIDES_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage write errors
  }
}

function pruneClassAttendanceTo30Days(
  allRecords: PlatformDatabase['attendance'],
  classId: string
): PlatformDatabase['attendance'] {
  const classRecords = allRecords.filter((a) => a.class_id === classId);
  const otherRecords = allRecords.filter((a) => a.class_id !== classId);
  const distinctDatesDesc = Array.from(new Set(classRecords.map((a) => a.date))).sort((a, b) =>
    b.localeCompare(a)
  );
  const allowedDates = new Set(distinctDatesDesc.slice(0, 30));
  const keptClassRecords = classRecords.filter((a) => allowedDates.has(a.date));
  return [...otherRecords, ...keptClassRecords];
}

function loadPersistedNotifications(): NotificationItem[] | null {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_NOTIFICATIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotificationItem[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function savePersistedNotifications(notifs: NotificationItem[]): void {
  try {
    localStorage.setItem(SSC_PERSISTED_NOTIFICATIONS_KEY, JSON.stringify(notifs.slice(0, 80)));
  } catch {
    // Ignore storage write errors
  }
}

interface PersistedSessionPayload {
  user: UserRecord;
  surface: AppSurface;
}

function loadPersistedSession(): PersistedSessionPayload | null {
  try {
    const raw = localStorage.getItem(SSC_PERSISTED_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSessionPayload;
    if (parsed && parsed.user && parsed.user.id && parsed.user.role) {
      if (parsed.user.section === 'BS2') {
        parsed.user.section = 'BS1';
      }
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function savePersistedSession(user: UserRecord, surface: AppSurface): void {
  try {
    localStorage.setItem(
      SSC_PERSISTED_SESSION_KEY,
      JSON.stringify({ user, surface })
    );
  } catch {
    // Ignore storage write errors
  }
}

function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SSC_PERSISTED_SESSION_KEY);
  } catch {
    // Ignore storage remove errors
  }
}

export type AppSurface = 'login' | 'student' | 'teacher' | 'leadership' | 'brainify';

export type StudentTab =
  | 'dashboard'
  | 'results'
  | 'attendance'
  | 'syllabus'
  | 'library'
  | 'routine'
  | 'exams'
  | 'questions'
  | 'activities'
  | 'notices'
  | 'assignments'
  | 'complaints'
  | 'calendar'
  | 'profile'
  | 'settings';

export type TeacherTab =
  | 'dashboard'
  | 'approvals'
  | 'classes'
  | 'attendance'
  | 'complaints'
  | 'routine'
  | 'next-class'
  | 'results'
  | 'exams'
  | 'assignments'
  | 'notices'
  | 'questions'
  | 'performance'
  | 'profile'
  | 'settings';

export type BrainifyTab =
  | 'home'
  | 'gk-quiz'
  | 'science-quiz'
  | 'math-quiz'
  | 'iq-quiz'
  | 'english-quiz'
  | 'circuit-maker'
  | 'periodic-table'
  | 'reactimix'
  | 'physics-lab'
  | 'chemistry-lab'
  | 'math-lab'
  | 'space-explorer'
  | 'human-body'
  | 'progress';

export interface StudentVerificationStatusView {
  status: 'pending' | 'rejected' | 'approved';
  message: string;
  studentName: string;
  studentEmail: string;
  studentIdCode: string;
  className: string;
  section: string;
  createdAt: string;
  classTeacherName: string;
  classTeacherSubject: string;
  classTeacherCode: string;
}

interface AuthActionResult {
  ok: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  error?: string;
  pendingApproval?: boolean;
  message?: string;
  debugTrace?: StudentRegistrationDebugTrace;
}

interface PlatformContextType {
  db: PlatformDatabase;
  currentUser: UserRecord | null;
  surface: AppSurface;
  studentTab: StudentTab;
  teacherTab: TeacherTab;
  brainifyTab: BrainifyTab;
  scienceFairMode: boolean;
  soundEnabled: boolean;
  toastMessage: string | null;
  verificationRequests: VerificationRequestRecord[];
  pendingBySection: Record<string, number>;
  studentVerificationView: StudentVerificationStatusView | null;
  studentDebugTrace: StudentRegistrationDebugTrace | null;
  teacherDebugTrace: TeacherQueryDebugTrace | null;
  isRefreshingVerification: boolean;
  isRestoringSession: boolean;
  supabaseConnected: boolean;
  supabaseDiagnostic: string | null;
  clearStudentVerificationView: () => void;
  checkStudentVerificationStatus: (email?: string) => Promise<void>;
  refreshVerificationRequests: () => Promise<void>;
  setSurface: (s: AppSurface) => void;
  setStudentTab: (t: StudentTab) => void;
  setTeacherTab: (t: TeacherTab) => void;
  setBrainifyTab: (t: BrainifyTab) => void;
  setScienceFairMode: (v: boolean) => void;
  toggleSound: () => void;
  showToast: (msg: string) => void;
  loginWithCredentials: (
    email: string,
    pass: string,
    expectedRole: UserRole
  ) => Promise<AuthActionResult>;
  registerWithEmail: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    studentClass?: string;
    section?: string;
    roll?: number;
    teacherCode?: string;
  }) => Promise<AuthActionResult>;
  approveStudentAccount: (studentUserId: string) => Promise<void>;
  rejectStudentAccount: (studentUserId: string) => Promise<void>;
  quickDemoLogin: (role: UserRole, targetSurface?: AppSurface) => void;
  logout: () => void;
  openBrainify: (initialTab?: BrainifyTab) => void;
  exitBrainify: () => void;
  saveClassAttendance: (
    date: string,
    classId: string,
    statusMap: Record<string, AttendanceStatus>
  ) => { ok: boolean; message: string };
  saveStudentResult: (
    studentId: string,
    subjectId: string,
    marks: number,
    remarks: string
  ) => { ok: boolean; message: string };
  createExamOrCT: (exam: Omit<ExamRecord, 'id'>) => void;
  createAssignment: (
    asg: Omit<
      AssignmentRecord,
      'id' | 'status' | 'totalSubmissions' | 'pendingCount' | 'lateCount'
    >
  ) => void;
  submitStudentAssignment: (assignmentId: string, fileName: string) => void;
  createNotice: (notice: Omit<NoticeRecord, 'id' | 'date'>) => void;
  uploadPreviousQuestion: (pq: Omit<PreviousQuestionRecord, 'id'>) => void;
  submitStudentComplaint: (params: {
    studentId?: string;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    subjectTitle: string;
    complaintText: string;
    fromTeacherCode?: string;
  }) => { ok: boolean; message: string; complaint?: StudentComplaintRecord };
  updateStudentComplaintStatus: (
    complaintId: string,
    status: ComplaintStatus,
    classTeacherNote?: string
  ) => void;
  deleteStudentComplaint: (complaintId: string) => void;
  triggerNextClassNotification: (customLeadMinutes?: number) => void;
  updateProfile: (name: string, phone: string) => void;
  markAllNotificationsRead: (silent?: boolean) => void;
  markNotificationRead: (notificationId: string) => void;
  markComplaintReplyViewed: (complaintId: string) => void;
  markComplaintSeenByTeacher: (complaintId: string) => void;
  markAllComplaintsReadForCurrentUser: () => void;
  callTeacherToRoom: (params: {
    teacherCode: string;
    room: string;
    urgency: TeacherCallRecord['urgency'];
    reason: string;
  }) => { ok: boolean; message: string };
  acknowledgeTeacherCall: (callId: string, status?: 'Acknowledged' | 'Completed') => void;
  deleteTeacherCall: (callId: string) => void;
  changeAccountPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; message: string }>;
  updateChiefAdvisorPermissions: (
    permissions: Partial<ChiefAdvisorPermissions>
  ) => Promise<{ ok: boolean; message: string }>;
  assignTeacherToClassSection: (
    teacherId: string,
    className: string,
    section: string,
    grantAdditionalClass?: boolean
  ) => Promise<{ ok: boolean; message: string }>;
  recordBrainifyQuiz: (entry: Omit<BrainifyQuizHistory, 'id' | 'date'>, xpGained: number) => void;
  recordBrainifyInteraction: (xpGained: number, topic: string, achievement?: string) => void;
  updateActivityProgress: (activityId: string, value: number, mode?: 'max' | 'add') => void;
  resetDemoData: () => void;
}

export const SUBJECT_SEQUENCE = [
  'Physics',
  'Biology',
  'Chemistry',
  'Bangla',
  'English',
  'ICT',
  'BGS',
  'Religion'
] as const;

export interface TeacherCodeMeta {
  code: string;
  subject: string;
  department: string;
  defaultName: string;
  className: string;
  section: string;
  classTeacherSection: string;
}

// Preserved in exact sequence:
// 1. Physics -> 2. Biology -> 3. Chemistry -> 4. Bangla -> 5. English -> 6. ICT -> 7. BGS -> 8. Religion
export const ORDERED_TEACHER_LIST: TeacherCodeMeta[] = [
  {
    code: '18887',
    subject: 'Physics',
    department: 'Department of Physical Sciences',
    defaultName: 'Saif Chowdhury',
    className: 'Class 10',
    section: 'BS1',
    classTeacherSection: 'Class 10 — BS1'
  },
  {
    code: '15539',
    subject: 'Biology',
    department: 'Department of Biological Sciences',
    defaultName: 'MD. MAHFUJUL HAQUE',
    className: 'Class 9',
    section: 'BS1',
    classTeacherSection: 'Class 9 — BS1'
  },
  {
    code: '18886',
    subject: 'Chemistry',
    department: 'Department of Physical Sciences',
    defaultName: 'MD. RAISUL ISLAM',
    className: 'Class 7',
    section: 'B2',
    classTeacherSection: 'Class 7 — B2'
  },
  {
    code: '10908',
    subject: 'Bangla',
    department: 'Department of Languages & Humanities',
    defaultName: 'MD. RONY KHAN',
    className: 'Class 7',
    section: 'B1',
    classTeacherSection: 'Class 7 — B1'
  },
  {
    code: '16678',
    subject: 'English',
    department: 'Department of Languages & Humanities',
    defaultName: 'ANONNO IBNE RAZZAK',
    className: 'Class 8',
    section: 'B1',
    classTeacherSection: 'Class 8 — B1'
  },
  {
    code: '16303',
    subject: 'Biology',
    department: 'Department of Biological Sciences',
    defaultName: 'MD. MEHRAZ',
    className: 'Class 10',
    section: 'BS1',
    classTeacherSection: 'Class 10 — BS1'
  },
  {
    code: '19940',
    subject: 'BGS',
    department: 'Department of Social Sciences',
    defaultName: 'MD. AMIR HOSSAIN',
    className: 'Class 8',
    section: 'B2',
    classTeacherSection: 'Class 8 — B2'
  },
  {
    code: '16404',
    subject: 'Higher Math',
    department: 'Department of Mathematics',
    defaultName: 'MD SHAHIDUL ISLAM',
    className: 'Class 9',
    section: 'BS1',
    classTeacherSection: 'Class 9 — BS1'
  },
  {
    code: '12215',
    subject: 'Religion',
    department: 'Department of Humanities & Ethics',
    defaultName: 'FAYSAL AHMED',
    className: 'Class 8',
    section: 'B2',
    classTeacherSection: 'Class 8 — B2'
  },
  {
    code: '17724',
    subject: 'ICT',
    department: 'Department of Computer & Information Technology',
    defaultName: 'MUHAMMAD MOKHLESUR RAHMAN',
    className: 'Class 7',
    section: 'B2',
    classTeacherSection: 'Class 7 — B2'
  },
  {
    code: '16101',
    subject: 'Physics',
    department: 'Department of Physical Sciences',
    defaultName: 'MOHAMMAD ANISUZZAMAN',
    className: 'Class 6',
    section: 'B1',
    classTeacherSection: 'Class 6 — B1'
  },
  {
    code: '16202',
    subject: 'BGS',
    department: 'Department of Social Sciences',
    defaultName: 'MD. ARIFUR RAHMAN',
    className: 'Class 6',
    section: 'B2',
    classTeacherSection: 'Class 6 — B2'
  }
];

export const TEACHER_CODES: Record<string, TeacherCodeMeta> = ORDERED_TEACHER_LIST.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<string, TeacherCodeMeta>
);

export function getClassTeacherForSection(studentClass = 'Class 9', section = 'BS1'): TeacherCodeMeta {
  const cleanClass = studentClass.trim();
  const rawSec = section.trim().toUpperCase() || 'BS1';
  const cleanSec = rawSec === 'BS2' ? 'BS1' : rawSec;
  const sectionLabel = `${cleanClass} — ${cleanSec}`;
  return (
    ORDERED_TEACHER_LIST.find(
      (t) => t.classTeacherSection.toLowerCase() === sectionLabel.toLowerCase()
    ) ||
    ORDERED_TEACHER_LIST.find((t) =>
      t.classTeacherSection.toLowerCase().startsWith(cleanClass.toLowerCase())
    ) ||
    TEACHER_CODES['16404'] ||
    TEACHER_CODES['18887']
  );
}

export function calculateGradeAndGpa(marks: number, fullMarks: number): { grade: string; gpa: number } {
  const pct = (marks / fullMarks) * 100;
  if (pct >= 80) return { grade: 'A+', gpa: 5.0 };
  if (pct >= 70) return { grade: 'A', gpa: 4.0 };
  if (pct >= 60) return { grade: 'A-', gpa: 3.5 };
  if (pct >= 50) return { grade: 'B', gpa: 3.0 };
  if (pct >= 40) return { grade: 'C', gpa: 2.0 };
  if (pct >= 33) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<PlatformDatabase>(() => {
    const persistedComplaints = loadPersistedComplaints();
    const persistedNotifs = loadPersistedNotifications();
    const attendanceOverrides = loadPersistedAttendanceOverrides();
    const resultsOverrides = loadPersistedResultsOverrides();

    let mergedAttendance = INITIAL_DATABASE.attendance;
    if (attendanceOverrides && attendanceOverrides.length > 0) {
      const overrideKeys = new Set(
        attendanceOverrides.map((a) => `${a.class_id}__${a.date}__${a.student_id}`)
      );
      mergedAttendance = [
        ...INITIAL_DATABASE.attendance.filter(
          (a) => !overrideKeys.has(`${a.class_id}__${a.date}__${a.student_id}`)
        ),
        ...attendanceOverrides
      ];
    }

    let mergedResults = INITIAL_DATABASE.results;
    if (resultsOverrides && resultsOverrides.length > 0) {
      const overrideResKeys = new Set(
        resultsOverrides.map((r) => `${r.student_id}__${r.subject_id}`)
      );
      mergedResults = [
        ...INITIAL_DATABASE.results.filter(
          (r) => !overrideResKeys.has(`${r.student_id}__${r.subject_id}`)
        ),
        ...resultsOverrides
      ];
    }

    const persistedVerifs = loadPersistedVerificationRequests();

    return {
      ...INITIAL_DATABASE,
      attendance: mergedAttendance,
      results: mergedResults,
      notifications: deduplicateNotifications(
        persistedNotifs && persistedNotifs.length > 0
          ? persistedNotifs
          : INITIAL_DATABASE.notifications
      ),
      complaints:
        persistedComplaints && persistedComplaints.length > 0
          ? persistedComplaints
          : INITIAL_DATABASE.complaints,
      verification_requests:
        persistedVerifs && persistedVerifs.length > 0
          ? persistedVerifs
          : INITIAL_DATABASE.verification_requests || []
    };
  });
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [surface, setSurfaceState] = useState<AppSurface>('login');
  const [studentTab, setStudentTab] = useState<StudentTab>('dashboard');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('dashboard');
  const [brainifyTab, setBrainifyTab] = useState<BrainifyTab>('home');
  const [scienceFairMode, setScienceFairMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.isEnabled());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestRecord[]>(
    () => loadPersistedVerificationRequests()
  );
  const [pendingBySection, setPendingBySection] = useState<Record<string, number>>({});
  const [studentVerificationView, setStudentVerificationView] =
    useState<StudentVerificationStatusView | null>(null);
  const [studentDebugTrace, setStudentDebugTrace] =
    useState<StudentRegistrationDebugTrace | null>(() => getLatestStudentRegistrationTrace());
  const [teacherDebugTrace, setTeacherDebugTrace] =
    useState<TeacherQueryDebugTrace | null>(() => getLatestTeacherQueryTrace());
  const [isRefreshingVerification, setIsRefreshingVerification] = useState<boolean>(false);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => isSupabaseConfigured);

  const currentUserRef = useRef<UserRecord | null>(null);
  currentUserRef.current = currentUser;
  const studentVerificationRef = useRef<StudentVerificationStatusView | null>(null);
  studentVerificationRef.current = studentVerificationView;

  const hydrateApprovedStudentState = useCallback(
    (rawUser: UserRecord, notifications?: NotificationItem[]) => {
      const candidateCode =
        rawUser.studentIdCode ||
        (rawUser.email?.startsWith('student_')
          ? rawUser.email.replace('student_', '').replace('@ssc.edu', '').toUpperCase()
          : '') ||
        '90001';
      const preMatch = findPreRegisteredStudent(candidateCode);
      const resolvedCode = preMatch?.code || candidateCode;
      const resolvedName =
        preMatch?.name ||
        (!isPlaceholderStudentName(rawUser.name) ? rawUser.name : rawUser.name);
      const resolvedClass = preMatch?.className || rawUser.studentClass || 'Class 9';
      const rawSec = (preMatch?.section || rawUser.section || 'BS1').toUpperCase();
      const resolvedSection = rawSec === 'BS2' ? 'BS1' : rawSec;
      const resolvedRoll = preMatch?.roll || 1;

      const studentUser: UserRecord = {
        ...rawUser,
        name: resolvedName,
        role: 'student',
        approvalStatus: 'approved',
        phone: rawUser.phone || `[Guardian Contact: +880-1700-${resolvedCode.padStart(6, '0').slice(-6)}]`,
        studentClass: resolvedClass,
        section: resolvedSection,
        studentIdCode: resolvedCode
      };

      setDb((prev) => {
        const existingStudentByCodeOrUser = prev.students.find(
          (s) =>
            s.user_id === studentUser.id ||
            s.student_id.toUpperCase() === resolvedCode.toUpperCase()
        );
        const existingIds = new Set(prev.notifications.map((n) => n.id));
        const mergedIncoming = (notifications || []).filter((n) => !existingIds.has(n.id));
        const nextNotifs = [...mergedIncoming, ...prev.notifications];

        if (existingStudentByCodeOrUser) {
          const canonicalUserId = existingStudentByCodeOrUser.user_id;
          const updatedStudents = prev.students.map((s) =>
            s.id === existingStudentByCodeOrUser.id
              ? {
                  ...s,
                  name: resolvedName,
                  student_id: resolvedCode,
                  roll: preMatch?.roll || s.roll,
                  class: resolvedClass,
                  section: resolvedSection
                }
              : s
          );

          const canonicalUser: UserRecord = {
            ...studentUser,
            id: canonicalUserId,
            name: resolvedName
          };

          const dedupedUsers = prev.users.filter(
            (u) => u.id !== studentUser.id && u.id !== canonicalUserId
          );

          return {
            ...prev,
            users:
              studentUser.id === canonicalUserId
                ? [canonicalUser, ...dedupedUsers]
                : [studentUser, canonicalUser, ...dedupedUsers],
            students: updatedStudents,
            notifications: nextNotifs
          };
        }

        const newStudentId = `std-${studentUser.id}`;
        const newStudentRec = {
          id: newStudentId,
          user_id: studentUser.id,
          student_id: resolvedCode,
          name: resolvedName,
          roll: resolvedRoll,
          class: resolvedClass,
          section: resolvedSection,
          academic_year: '2026',
          streakDays: 7
        };

        const generatedResults = prev.subjects.map((sub, subIdx) => {
          const rawPct = Math.max(
            60,
            Math.min(97, 93 - ((resolvedRoll * 7 + subIdx * 9) % 32))
          );
          const marks = sub.fullMarks === 50 ? Math.round((rawPct / 100) * 50) : rawPct;
          const { grade, gpa } = calculateGradeAndGpa(marks, sub.fullMarks);
          return {
            id: `res-${newStudentId}-${sub.id}`,
            student_id: newStudentId,
            subject_id: sub.id,
            subjectName: sub.name,
            exam_id: 'ex-hy-2026',
            examName: 'Half-Yearly Examination 2026',
            fullMarks: sub.fullMarks,
            marks,
            grade,
            gpa,
            highestInClass: sub.fullMarks === 50 ? 49 : 98,
            positionInSubject: ((resolvedRoll + subIdx) % 35) + 1,
            remarks: 'Consistent academic and laboratory performance.'
          };
        });
        const clonedAttendance = prev.attendance
          .filter((a) => a.student_id === 'std-1')
          .map((a, idx) => ({
            ...a,
            id: `att-${newStudentId}-${idx}`,
            student_id: newStudentId
          }));

        return {
          ...prev,
          users: [...prev.users.filter((u) => u.id !== studentUser.id), studentUser],
          students: [...prev.students, newStudentRec],
          results: [...prev.results, ...generatedResults],
          attendance: [...prev.attendance, ...clonedAttendance],
          notifications: nextNotifs
        };
      });

      setStudentVerificationView(null);
      setCurrentUser(studentUser);
      setSurfaceState('student');
      savePersistedSession(studentUser, 'student');
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const fetchPublicSectionCounts = useCallback(async () => {
    // Students are pre-registered; no pending verification counts required
    setPendingBySection({});
  }, []);

  const refreshVerificationRequests = useCallback(async () => {
    const activeUser = currentUserRef.current;
    if (!activeUser || activeUser.role !== 'teacher') {
      await fetchPublicSectionCounts();
      return;
    }

    const teacherCode =
      activeUser.teacherCode ||
      activeUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    const meta = TEACHER_CODES[teacherCode] || TEACHER_CODES['18887'];

    setIsRefreshingVerification(true);
    try {
      const supaData = await supabaseFetchSectionVerificationData({
        className: meta.className,
        section: meta.section,
        teacherCode: meta.code
      });

      setVerificationRequests(supaData.requests);
      if (supaData.debugTrace) {
        setTeacherDebugTrace(supaData.debugTrace);
      }

      // Update pending count for this teacher's section
      const pendingCount = supaData.requests.filter((r) => r.status === 'pending').length;
      setPendingBySection((prev) => ({
        ...prev,
        [meta.classTeacherSection.toLowerCase()]: pendingCount
      }));

      setDb((prev) => {
        const sanitizedSectionStudents = supaData.sectionStudents.map((u) => ({
          ...u,
          name: getAuthoritativeStudentName(null, u)
        }));
        const studentIdsInSection = new Set(sanitizedSectionStudents.map((u) => u.id));
        const nonSectionUsers = prev.users.filter((u) => !studentIdsInSection.has(u.id));
        return {
          ...prev,
          users: [...nonSectionUsers, ...sanitizedSectionStudents],
          verification_requests: supaData.requests,
          notifications:
            supaData.notifications.length > 0 ? supaData.notifications : prev.notifications
        };
      });
    } finally {
      setIsRefreshingVerification(false);
    }
  }, [fetchPublicSectionCounts]);

  const checkStudentVerificationStatus = useCallback(async (overrideEmail?: string) => {
    const targetEmail = (
      overrideEmail ||
      studentVerificationRef.current?.studentEmail ||
      ''
    )
      .trim()
      .toLowerCase();
    if (!targetEmail || !isSupabaseConfigured) return;

    const checkRes = await supabaseCheckStudentStatusByEmail(targetEmail);
    if (!checkRes.found || !checkRes.profile || !checkRes.status) return;

    const latestStatus = checkRes.status;
    const prof = checkRes.profile;
    const rawProfSec = (prof.section || 'BS1').trim().toUpperCase();
    const cleanProfSec = rawProfSec === 'BS2' ? 'BS1' : rawProfSec;
    const ct = getClassTeacherForSection(prof.studentClass || 'Class 9', cleanProfSec);

    // If the student was just approved and has an active Supabase session on this browser, transition straight into Student Portal
    if (latestStatus === 'approved' && supabase) {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionEmail = sessionData.session?.user?.email?.trim().toLowerCase();
      if (sessionEmail && sessionEmail === prof.email.trim().toLowerCase()) {
        hydrateApprovedStudentState(prof);
        sound.playComplete();
        showToast(`Account approved by ${ct.defaultName}! Welcome to the Student Portal.`);
        return;
      }
    }

    setStudentVerificationView({
      status: latestStatus,
      message:
        latestStatus === 'approved'
          ? 'Your account has been approved by your Class Teacher! You can now log in to access the Student Dashboard.'
          : latestStatus === 'rejected'
          ? 'Your registration was rejected by the Class Teacher.'
          : 'Your account is waiting for Class Teacher verification.',
      studentName: prof.name,
      studentEmail: prof.email,
      studentIdCode: prof.studentIdCode || 'SSC-2026-0901',
      className: prof.studentClass || 'Class 9',
      section: cleanProfSec,
      createdAt: prof.createdAt || new Date().toISOString(),
      classTeacherName: ct.defaultName,
      classTeacherSubject: ct.subject,
      classTeacherCode: ct.code
    });
  }, [hydrateApprovedStudentState, showToast]);

  // Restore active session on reload (from localStorage + Supabase) and subscribe to changes
  useEffect(() => {
    let mounted = true;
    const persisted = loadPersistedSession();

    if (persisted && persisted.user) {
      if (persisted.user.role === 'student') {
        hydrateApprovedStudentState(persisted.user);
      } else if (
        persisted.user.role === 'chairman' ||
        persisted.user.role === 'chief_advisor' ||
        persisted.user.role === 'principal'
      ) {
        setDb((prev) => ({
          ...prev,
          users: [persisted.user, ...prev.users.filter((u) => u.id !== persisted.user.id)]
        }));
        setCurrentUser(persisted.user);
        setSurfaceState('leadership');
        setIsRestoringSession(false);
      } else if (persisted.user.role === 'teacher') {
        const code =
          persisted.user.teacherCode ||
          persisted.user.email.replace('teacher_', '').replace('@ssc.edu', '') ||
          '18887';
        const meta =
          TEACHER_CODES[code] ||
          ORDERED_TEACHER_LIST.find(
            (t) => t.defaultName.toLowerCase() === (persisted.user.name || '').toLowerCase()
          ) ||
          TEACHER_CODES['18887'];
        const teacherUser: UserRecord = {
          ...persisted.user,
          name: meta.defaultName,
          role: 'teacher',
          approvalStatus: 'approved',
          teacherCode: meta.code,
          studentClass: meta.className,
          section: meta.section
        };
        setDb((prev) => {
          const existingTeacherRec = prev.teachers.find((t) => t.user_id === teacherUser.id);
          return {
            ...prev,
            users: [teacherUser, ...prev.users.filter((u) => u.id !== teacherUser.id)],
            teachers: [
              {
                id: existingTeacherRec?.id || `tch-${meta.code}`,
                user_id: teacherUser.id,
                employee_id: `EMP-SSC-${meta.code}`,
                department: meta.department,
                designation: `${meta.subject} Teacher & Class Teacher (${meta.classTeacherSection})`,
                assignedClasses: existingTeacherRec?.assignedClasses?.length
                  ? existingTeacherRec.assignedClasses
                  : [meta.classTeacherSection],
                authorizedSubjects: [meta.subject],
                classTeacherOf: meta.classTeacherSection
              },
              ...prev.teachers.filter((t) => t.user_id !== teacherUser.id)
            ]
          };
        });
        setCurrentUser(teacherUser);
        setSurfaceState(persisted.surface === 'login' ? 'teacher' : persisted.surface);
      }
    }

    // Fetch latest persisted DB from backend server (if available)
    fetch('/api/db')
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (!mounted || !payload?.ok || !payload.db) return;
        const srvDb = payload.db as PlatformDatabase;
        setDb((prev) => ({
          ...prev,
          teachers: srvDb.teachers?.length ? srvDb.teachers : prev.teachers,
          complaints: srvDb.complaints?.length ? srvDb.complaints : prev.complaints,
          notifications: deduplicateNotifications(
            srvDb.notifications?.length ? srvDb.notifications : prev.notifications
          ),
          verification_requests: srvDb.verification_requests || prev.verification_requests,
          audit_logs: srvDb.audit_logs || prev.audit_logs,
          teacher_calls: srvDb.teacher_calls || prev.teacher_calls,
          chief_advisor_permissions:
            srvDb.chief_advisor_permissions || prev.chief_advisor_permissions
        }));
        if (Array.isArray(srvDb.verification_requests) && srvDb.verification_requests.length > 0) {
          setVerificationRequests(srvDb.verification_requests);
        }
      })
      .catch(() => {});

    // If an executive leadership session is active, finalize restoration immediately
    // and skip Supabase student session restore so leadership is never overwritten or stalled
    const isLeadershipActive =
      persisted?.user?.role === 'chairman' ||
      persisted?.user?.role === 'chief_advisor' ||
      persisted?.user?.role === 'principal';

    if (isLeadershipActive) {
      setIsRestoringSession(false);
      return;
    }

    const client = supabase;
    if (!client || !isSupabaseConfigured) {
      setIsRestoringSession(false);
      return;
    }

    const restoreSession = async () => {
      try {
        // Enforce 3.5s timeout on Supabase session restore to prevent infinite loading screen
        const timeoutPromise = new Promise<{ hasSession: false }>((resolve) =>
          setTimeout(() => resolve({ hasSession: false }), 3500)
        );
        const restored = await Promise.race([supabaseRestoreUserSession(), timeoutPromise]);
        if (!mounted) return;

        // If leadership logged in while session was checking, do not overwrite
        if (
          currentUserRef.current?.role === 'chairman' ||
          currentUserRef.current?.role === 'chief_advisor' ||
          currentUserRef.current?.role === 'principal'
        ) {
          return;
        }

        if (!restored.hasSession || !restored.user) {
          fetchPublicSectionCounts();
          return;
        }

        if (restored.role === 'teacher') {
          const code =
            restored.user.teacherCode ||
            restored.user.email.replace('teacher_', '').replace('@ssc.edu', '') ||
            '18887';
          const meta = TEACHER_CODES[code] || TEACHER_CODES['18887'];
          const teacherUser: UserRecord = {
            ...restored.user,
            name: meta.defaultName,
            role: 'teacher',
            approvalStatus: 'approved',
            teacherCode: meta.code,
            studentClass: meta.className,
            section: meta.section
          };

          const sectionData = await supabaseFetchSectionVerificationData({
            className: meta.className,
            section: meta.section,
            teacherCode: meta.code
          });

          if (!mounted) return;

          setVerificationRequests(sectionData.requests);
          if (sectionData.debugTrace) {
            setTeacherDebugTrace(sectionData.debugTrace);
          }

          setDb((prev) => {
            const sanitizedSectionStudents = sectionData.sectionStudents.map((u) => ({
              ...u,
              name: getAuthoritativeStudentName(null, u)
            }));
            const supaIds = new Set(sanitizedSectionStudents.map((u) => u.id));
            const keptUsers = prev.users.filter(
              (u) => u.id !== teacherUser.id && !supaIds.has(u.id)
            );
            return {
              ...prev,
              users: [teacherUser, ...keptUsers, ...sanitizedSectionStudents],
              teachers: [
                {
                  id: 'tch-1',
                  user_id: teacherUser.id,
                  employee_id: `EMP-SSC-${meta.code}`,
                  department: meta.department,
                  designation: `${meta.subject} Teacher & Class Teacher (${meta.classTeacherSection})`,
                  assignedClasses: ALL_CLASS_SECTIONS.map((c) => `${c.className} — ${c.section}`),
                  authorizedSubjects: [meta.subject],
                  classTeacherOf: meta.classTeacherSection
                },
                ...prev.teachers.filter((t) => t.user_id !== teacherUser.id)
              ],
              verification_requests: sectionData.requests,
              notifications:
                sectionData.notifications.length > 0
                  ? sectionData.notifications
                  : prev.notifications
            };
          });

          setStudentVerificationView(null);
          setCurrentUser(teacherUser);
          setSurfaceState('teacher');
          savePersistedSession(teacherUser, 'teacher');
        } else {
          const mappedUser: UserRecord = {
            ...restored.user,
            approvalStatus: 'approved'
          };
          hydrateApprovedStudentState(mappedUser, restored.notifications);
        }
      } catch (err) {
        console.warn('[VERIFICATION DEBUG] Warning restoring Supabase session:', err);
      } finally {
        if (mounted) {
          setIsRestoringSession(false);
        }
      }
    };

    restoreSession();

    const { data: authListener } = client.auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' && !loadPersistedSession()) {
        setCurrentUser(null);
        setVerificationRequests([]);
        setSurfaceState('login');
      }
    });

    const unsubscribeRealtime = subscribeToSupabaseVerificationChanges(() => {
      fetchPublicSectionCounts();
      if (currentUserRef.current?.role === 'teacher') {
        refreshVerificationRequests();
      }
      if (studentVerificationRef.current) {
        checkStudentVerificationStatus();
      }
    });

    const pollInterval = setInterval(() => {
      if (currentUserRef.current?.role === 'teacher') {
        refreshVerificationRequests();
      } else {
        fetchPublicSectionCounts();
        if (studentVerificationRef.current) {
          checkStudentVerificationStatus();
        }
      }
    }, 10000);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      unsubscribeRealtime();
      clearInterval(pollInterval);
    };
  }, [
    fetchPublicSectionCounts,
    refreshVerificationRequests,
    checkStudentVerificationStatus,
    hydrateApprovedStudentState
  ]);

  const clearStudentVerificationView = () => {
    if (supabase && !currentUser) {
      supabase.auth.signOut().catch(() => {});
    }
    setStudentVerificationView(null);
  };

  // Enforce strict role-based & approval-based access control on surface transitions
  const setSurface = (target: AppSurface) => {
    sound.playClick();
    if (target === 'student') {
      if (!currentUser || currentUser.role !== 'student') {
        showToast('Access Restricted: Please sign in with an approved Student account.');
        setSurfaceState('login');
        return;
      }
      if (currentUser.approvalStatus === 'pending') {
        showToast('Your account is waiting for Class Teacher verification.');
        setSurfaceState('login');
        return;
      }
      if (currentUser.approvalStatus === 'rejected') {
        showToast('Your registration was rejected by the Class Teacher.');
        setSurfaceState('login');
        return;
      }
    }
    if (target === 'teacher') {
      if (!currentUser || currentUser.role !== 'teacher') {
        showToast('Access Restricted: Teachers only. Unauthorized access prevented.');
        setSurfaceState('login');
        return;
      }
    }
    if (target === 'leadership') {
      if (
        !currentUser ||
        (currentUser.role !== 'chairman' &&
          currentUser.role !== 'chief_advisor' &&
          currentUser.role !== 'principal')
      ) {
        showToast('Access Restricted: Authorized Leadership accounts only.');
        setSurfaceState('login');
        return;
      }
    }
    setSurfaceState(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync database changes to backend server
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db })
      }).catch(() => {});
    }, 350);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [db]);

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.setEnabled(next);
    setSoundEnabled(next);
    if (next) sound.playClick();
    showToast(`Platform Audio ${next ? 'Enabled' : 'Muted'}`);
  };

  const loginWithCredentials = async (
    emailOrCode: string,
    pass: string,
    expectedRole: UserRole
  ): Promise<AuthActionResult> => {
    if (
      expectedRole === 'teacher' ||
      expectedRole === 'chairman' ||
      expectedRole === 'chief_advisor' ||
      expectedRole === 'principal'
    ) {
      const rawInput = emailOrCode.trim();
      const rawPass = pass.trim();

      if (!rawInput || !rawPass) {
        sound.playWrong();
        return {
          ok: false,
          error: 'Please enter both your authorized access code and password.'
        };
      }

      // 1. Authenticate against Backend Staff & Leadership Auth Endpoint (/api/auth/staff-login)
      try {
        const resp = await fetch('/api/auth/staff-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: rawInput, password: rawPass })
        });
        const data = await resp.json();

        if (resp.ok && data.ok && data.user) {
          const authUser = data.user as UserRecord;
          if (data.token) {
            try {
              sessionStorage.setItem(SSC_STAFF_TOKEN_KEY, String(data.token));
            } catch {
              // ignore storage errors
            }
          }

          if (
            authUser.role === 'chairman' ||
            authUser.role === 'chief_advisor' ||
            authUser.role === 'principal'
          ) {
            setDb((prev) => ({
              ...prev,
              users: [authUser, ...prev.users.filter((u) => u.id !== authUser.id)],
              chief_advisor_permissions:
                data.chiefAdvisorPermissions || prev.chief_advisor_permissions,
              audit_logs: data.auditLogs || prev.audit_logs
            }));
            setCurrentUser(authUser);
            setSurfaceState('leadership');
            savePersistedSession(authUser, 'leadership');
            sound.playComplete();
            showToast(
              `Authenticated as ${authUser.position || 'Leadership'}: ${authUser.name}`
            );
            return { ok: true, status: 'approved' };
          }
        } else if (resp.status === 401 && !TEACHER_CODES[rawInput]) {
          // Check if it was a teacher login by name before failing
          const byName = ORDERED_TEACHER_LIST.find(
            (t) => t.defaultName.toLowerCase() === rawInput.toLowerCase()
          );
          if (!byName) {
            sound.playWrong();
            return {
              ok: false,
              error: data?.error || 'Invalid access code or password.'
            };
          }
        }
      } catch {
        // Fallback if backend endpoint is temporarily unreachable (e.g. on Netlify or client-only builds)
      }

      // Check Executive Leadership Directory (Chairman: Shanaz Huda [111111], Chief Advisor: Md Abul Kasem [222222], Principal: Md Abul Hannan [333333])
      const leaderMeta = findLeadershipAccount(rawInput);
      if (leaderMeta) {
        const existingLeaderUser = db.users.find(
          (u) =>
            (u.role === 'chairman' || u.role === 'chief_advisor' || u.role === 'principal') &&
            (u.id === leaderMeta.id || u.email.toLowerCase() === leaderMeta.email.toLowerCase())
        );

        const inputPassHash = hashCredential(rawPass);
        const isInitialMatch = rawPass === leaderMeta.code;
        const isStoredHashMatch =
          existingLeaderUser?.passwordHash && existingLeaderUser.passwordHash === inputPassHash;
        const isDefaultHashMatch = leaderMeta.passwordHash === inputPassHash;

        if (existingLeaderUser?.passwordChanged) {
          if (!isStoredHashMatch) {
            sound.playWrong();
            return {
              ok: false,
              error: 'Incorrect password. Please enter your updated leadership password.'
            };
          }
        } else if (!isInitialMatch && !isStoredHashMatch && !isDefaultHashMatch) {
          sound.playWrong();
          return {
            ok: false,
            error: 'Incorrect password for this leadership account.'
          };
        }

        const authUser: UserRecord =
          existingLeaderUser || toLeadershipUserRecord(leaderMeta, inputPassHash);

        const loginAudit: AuditLogRecord = {
          id: `log-lead-auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          actorId: authUser.id,
          actorName: authUser.name,
          actorRole: authUser.role,
          actorPosition: authUser.position,
          action: 'LEADERSHIP_PORTAL_SIGNIN',
          category: 'auth',
          target: `${authUser.position} Dashboard`,
          details: `${authUser.position} (${authUser.name}) successfully authenticated to Management Hub.`
        };

        setDb((prev) => ({
          ...prev,
          users: [authUser, ...prev.users.filter((u) => u.id !== authUser.id)],
          audit_logs: [loginAudit, ...(prev.audit_logs || [])]
        }));
        setCurrentUser(authUser);
        setSurfaceState('leadership');
        savePersistedSession(authUser, 'leadership');
        setIsRestoringSession(false);
        sound.playComplete();
        showToast(
          `Authenticated as ${authUser.position || 'Leadership'}: ${authUser.name}`
        );
        return { ok: true, status: 'approved' };
      }

      // Check Teacher Directory (by code or by name)
      const meta =
        TEACHER_CODES[rawInput] ||
        ORDERED_TEACHER_LIST.find(
          (t) => t.defaultName.toLowerCase() === rawInput.toLowerCase()
        );

      if (!meta) {
        sound.playWrong();
        return {
          ok: false,
          error: 'Invalid access code or credentials. Unauthorized access prevented.'
        };
      }

      // Check stored password hash in db.users (supports changed passwords)
      const existingTeacherUser = db.users.find(
        (u) =>
          u.role === 'teacher' &&
          (u.teacherCode === meta.code || u.name.toLowerCase() === meta.defaultName.toLowerCase())
      );

      const inputPassHash = hashCredential(rawPass);
      const isInitialMatch =
        rawPass === meta.code || rawPass.toLowerCase() === meta.defaultName.toLowerCase();
      const isStoredHashMatch =
        existingTeacherUser?.passwordHash && existingTeacherUser.passwordHash === inputPassHash;

      if (existingTeacherUser?.passwordChanged) {
        if (!isStoredHashMatch) {
          sound.playWrong();
          return {
            ok: false,
            error: 'Incorrect password. Please enter your updated teacher password.'
          };
        }
      } else if (!isInitialMatch && !isStoredHashMatch) {
        sound.playWrong();
        return {
          ok: false,
          error: 'Incorrect password for this teacher account.'
        };
      }

      const supaRes = await supabaseLoginTeacher({
        code: meta.code,
        password: meta.code,
        defaultName: meta.defaultName,
        subject: meta.subject,
        department: meta.department,
        className: meta.className,
        section: meta.section
      });

      const baseTeacherUser: UserRecord = supaRes.user ||
        existingTeacherUser || {
          id: `usr-teacher-${meta.code}`,
          name: meta.defaultName,
          email: `teacher_${meta.code}@ssc.edu`,
          passwordHash: hashCredential(rawPass),
          role: 'teacher',
          profileImage: '',
          approvalStatus: 'approved',
          studentClass: meta.className,
          section: meta.section,
          teacherCode: meta.code
        };

      const teacherUser: UserRecord = {
        ...baseTeacherUser,
        name: meta.defaultName,
        role: 'teacher',
        approvalStatus: 'approved',
        studentClass: meta.className,
        section: meta.section,
        teacherCode: meta.code
      };

      const sectionData = await supabaseFetchSectionVerificationData({
        className: meta.className,
        section: meta.section,
        teacherCode: meta.code
      });

      setDb((prev) => {
        const existingTeacherRec = prev.teachers.find(
          (t) =>
            t.user_id === teacherUser.id ||
            t.classTeacherOf?.toLowerCase() === meta.classTeacherSection.toLowerCase()
        );

        // Assign each teacher ONLY to their authorized class and section unless an administrator grants additional permissions
        const authorizedClassesList =
          existingTeacherRec?.assignedClasses && existingTeacherRec.assignedClasses.length > 0
            ? existingTeacherRec.assignedClasses
            : [meta.classTeacherSection];

        const updatedTeacher = {
          id: existingTeacherRec?.id || `tch-${meta.code}`,
          user_id: teacherUser.id,
          employee_id: `EMP-SSC-${meta.code}`,
          department: meta.department,
          designation: `${meta.subject} Teacher & Class Teacher (${meta.classTeacherSection})`,
          assignedClasses: authorizedClassesList,
          authorizedSubjects: [meta.subject],
          classTeacherOf: meta.classTeacherSection
        };

        const mergedVerifRequests = [
          ...(prev.verification_requests || []),
          ...sectionData.requests.filter(
            (sr) => !(prev.verification_requests || []).some((pr) => pr.student_id === sr.student_id)
          )
        ];
        setVerificationRequests(mergedVerifRequests);
        savePersistedVerificationRequests(mergedVerifRequests);

        const auditEntry: AuditLogRecord = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: teacherUser.id,
          actorName: teacherUser.name,
          actorRole: 'teacher',
          action: 'Teacher Login',
          category: 'auth',
          details: `${teacherUser.name} (${meta.subject} · Class Teacher ${meta.classTeacherSection}) logged in.`
        };

        const sanitizedSectionStudents = sectionData.sectionStudents.map((u) => ({
          ...u,
          name: getAuthoritativeStudentName(null, u)
        }));
        const supaIds = new Set(sanitizedSectionStudents.map((u) => u.id));
        const keptUsers = prev.users.filter(
          (u) => u.id !== teacherUser.id && !supaIds.has(u.id)
        );
        return {
          ...prev,
          users: [teacherUser, ...keptUsers, ...sanitizedSectionStudents],
          teachers: [
            updatedTeacher,
            ...prev.teachers.filter(
              (t) => t.user_id !== teacherUser.id && t.id !== updatedTeacher.id
            )
          ],
          verification_requests: mergedVerifRequests,
          audit_logs: [auditEntry, ...(prev.audit_logs || [])],
          notifications: deduplicateNotifications(
            sectionData.notifications.length > 0
              ? [...sectionData.notifications, ...prev.notifications]
              : prev.notifications
          )
        };
      });

      if (sectionData.debugTrace) {
        setTeacherDebugTrace(sectionData.debugTrace);
      }
      setStudentVerificationView(null);
      setCurrentUser(teacherUser);
      setSurfaceState('teacher');
      savePersistedSession(teacherUser, 'teacher');
      sound.playComplete();
      showToast(`Signed in as ${meta.defaultName} (Class Teacher: ${meta.classTeacherSection})`);
      return { ok: true, status: 'approved' };
    }

    // Student Login: First check if this is a newly registered student whose account is pending or approved
    const cleanCode = emailOrCode.trim();
    const cleanPass = pass.trim();
    if (!cleanCode || !cleanPass) {
      sound.playWrong();
      return { ok: false, error: 'Please enter both your Student ID / Email and Password.' };
    }

    const matchingRegisteredReq = (db.verification_requests || verificationRequests).find(
      (r) =>
        r.student_email.toLowerCase() === cleanCode.toLowerCase() ||
        r.student_code.toLowerCase() === cleanCode.toLowerCase()
    );
    const matchingRegisteredUser = db.users.find(
      (u) =>
        u.role === 'student' &&
        (u.email.toLowerCase() === cleanCode.toLowerCase() ||
          (u.studentIdCode && u.studentIdCode.toLowerCase() === cleanCode.toLowerCase()))
    );

    if (matchingRegisteredReq || (matchingRegisteredUser && matchingRegisteredUser.approvalStatus !== 'approved')) {
      const effectiveStatus = matchingRegisteredReq?.status || matchingRegisteredUser?.approvalStatus || 'pending';
      const stClass = matchingRegisteredReq?.class_name || matchingRegisteredUser?.studentClass || 'Class 6';
      const stSec = matchingRegisteredReq?.section || matchingRegisteredUser?.section || 'B1';
      const ct = getClassTeacherForSection(stClass, stSec);

      if (effectiveStatus === 'pending') {
        const pendingMsg = `Your registration for ${stClass} — ${stSec} is waiting for approval from Class Teacher ${ct.defaultName}.`;
        setStudentVerificationView({
          status: 'pending',
          message: pendingMsg,
          studentName: matchingRegisteredReq?.student_name || matchingRegisteredUser?.name || 'Student',
          studentEmail: matchingRegisteredReq?.student_email || matchingRegisteredUser?.email || cleanCode,
          studentIdCode: matchingRegisteredReq?.student_code || matchingRegisteredUser?.studentIdCode || 'Pending',
          className: stClass,
          section: stSec,
          createdAt: matchingRegisteredReq?.created_at || new Date().toISOString(),
          classTeacherName: ct.defaultName,
          classTeacherSubject: ct.subject,
          classTeacherCode: ct.code
        });
        sound.playWrong();
        return {
          ok: false,
          status: 'pending',
          pendingApproval: true,
          error: pendingMsg
        };
      }

      if (effectiveStatus === 'rejected') {
        const rejectedMsg = `Your registration for ${stClass} — ${stSec} was declined by Class Teacher ${ct.defaultName}.`;
        sound.playWrong();
        return {
          ok: false,
          status: 'rejected',
          error: rejectedMsg
        };
      }

      if (effectiveStatus === 'approved' && matchingRegisteredUser) {
        const passHash = hashCredential(cleanPass);
        if (
          matchingRegisteredUser.passwordHash &&
          matchingRegisteredUser.passwordHash !== passHash &&
          cleanPass.toUpperCase() !== (matchingRegisteredUser.studentIdCode || '').toUpperCase()
        ) {
          sound.playWrong();
          return { ok: false, error: 'Invalid password for your student account.' };
        }
        hydrateApprovedStudentState(matchingRegisteredUser);
        setCurrentUser(matchingRegisteredUser);
        setSurfaceState('student');
        savePersistedSession(matchingRegisteredUser, 'student');
        sound.playComplete();
        showToast(`Welcome, ${matchingRegisteredUser.name}!`);
        return { ok: true, status: 'approved' };
      }
    }

    // Pre-registered Student Login using Student Code + Password
    if (cleanCode.toUpperCase() !== cleanPass.toUpperCase()) {
      // Check if student changed their password
      if (matchingRegisteredUser?.passwordChanged) {
        if (matchingRegisteredUser.passwordHash !== hashCredential(cleanPass)) {
          sound.playWrong();
          return {
            ok: false,
            error: 'Invalid Student Code or Password. Please check your credentials.'
          };
        }
      } else {
        sound.playWrong();
        return {
          ok: false,
          error: 'Invalid Student Code or Password. Please check your credentials.'
        };
      }
    }

    const preRegistered =
      findPreRegisteredStudent(cleanCode) ||
      PRE_REGISTERED_STUDENTS.find(
        (s) => s.code.toLowerCase() === cleanCode.toLowerCase()
      );

    if (!preRegistered && !matchingRegisteredUser) {
      sound.playWrong();
      return {
        ok: false,
        error: 'Student ID not found. New students must register and receive Class Teacher approval before accessing the portal.'
      };
    }

    const defaultName = preRegistered ? preRegistered.name : matchingRegisteredUser?.name || `Student (${cleanCode})`;
    const defaultClass = preRegistered ? preRegistered.className : matchingRegisteredUser?.studentClass || 'Class 9';
    const rawDefaultSec = preRegistered ? preRegistered.section : matchingRegisteredUser?.section || 'BS1';
    const defaultSection = rawDefaultSec === 'BS2' ? 'BS1' : rawDefaultSec;

    const supaStudentRes = await supabaseLoginStudentByCode({
      code: preRegistered ? preRegistered.code : cleanCode,
      password: cleanPass,
      defaultName,
      className: defaultClass,
      section: defaultSection
    });

    hydrateApprovedStudentState(supaStudentRes.user, supaStudentRes.notifications);
    setCurrentUser(supaStudentRes.user);
    setSurfaceState('student');
    savePersistedSession(supaStudentRes.user, 'student');
    sound.playComplete();
    showToast(
      `Welcome, ${supaStudentRes.user.name} · Student ID: ${supaStudentRes.user.studentIdCode || cleanCode}`
    );
    return { ok: true, status: 'approved' };
  };

  const registerWithEmail = async (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    studentClass?: string;
    section?: string;
    roll?: number;
    teacherCode?: string;
  }): Promise<AuthActionResult> => {
    if (params.role === 'teacher') {
      return loginWithCredentials(params.teacherCode || '', params.password, 'teacher');
    }

    const cleanName = params.name.trim();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPassword = params.password.trim();
    const chosenClass = (params.studentClass || 'Class 6').trim();
    const chosenSection = (params.section || 'B1').trim().toUpperCase();

    if (!cleanName || !cleanEmail.includes('@') || cleanPassword.length < 4) {
      sound.playWrong();
      return {
        ok: false,
        error:
          'Please enter a valid full name, email address, and password (minimum 4 characters).'
      };
    }

    // Automatically assign the correct Class Teacher for the selected Class & Section
    // (Class 6 B1 -> MOHAMMAD ANISUZZAMAN, Class 6 B2 -> MD. ARIFUR RAHMAN, etc.)
    const matchedTeacher = getClassTeacherForSection(chosenClass, chosenSection);
    const classDigits = chosenClass.replace(/\D/g, '').padStart(2, '0') || '06';
    const randomSuffix = String(Math.floor(10 + Math.random() * 89));
    const generatedStudentCode = `SSC-2026-${classDigits}${randomSuffix}`;
    const nowIso = new Date().toISOString();
    const newStudentUserId = `usr-reg-${Date.now()}`;

    const pendingUserRecord: UserRecord = {
      id: newStudentUserId,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashCredential(cleanPassword),
      role: 'student',
      profileImage: '',
      approvalStatus: 'pending',
      studentClass: chosenClass,
      section: chosenSection,
      studentIdCode: generatedStudentCode,
      createdAt: nowIso
    };

    const newVerifReq: VerificationRequestRecord = {
      id: `vr-${Date.now()}`,
      student_id: newStudentUserId,
      student_code: generatedStudentCode,
      student_name: cleanName,
      student_email: cleanEmail,
      class_name: chosenClass,
      section: chosenSection,
      class_teacher_code: matchedTeacher.code,
      status: 'pending',
      created_at: nowIso
    };

    const teacherApprovalNotif: NotificationItem = {
      id: `notif-reg-${newStudentUserId}`,
      eventKey: `reg-req-${newStudentUserId}`,
      title: `Registration Approval Required (${chosenClass} — ${chosenSection})`,
      message: `${cleanName} (${cleanEmail} · ID: ${generatedStudentCode}) registered for ${chosenClass} — ${chosenSection} and is waiting for approval from Class Teacher ${matchedTeacher.defaultName}.`,
      timestamp: 'Just now',
      read: false,
      resolved: false,
      targetRole: 'teacher',
      category: 'approval',
      notificationType: 'registration_request',
      studentUserId: newStudentUserId,
      studentCode: generatedStudentCode,
      studentClass: chosenClass,
      studentSection: chosenSection,
      recipientTeacherCode: matchedTeacher.code
    };

    // If Supabase is configured, also register in Supabase
    if (isSupabaseConfigured) {
      const supaReg = await supabaseRegisterStudent({
        fullName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        className: chosenClass,
        section: chosenSection,
        studentCode: generatedStudentCode,
        classTeacherCode: matchedTeacher.code,
        classTeacherName: matchedTeacher.defaultName
      });
      if (supaReg.debugTrace) {
        setStudentDebugTrace(supaReg.debugTrace);
      }
      if (supaReg.verificationRequest) {
        newVerifReq.id = supaReg.verificationRequest.id;
        newVerifReq.student_id = supaReg.verificationRequest.student_id;
        pendingUserRecord.id = supaReg.verificationRequest.student_id;
      }
    }

    setDb((prev) => {
      const existingReqs = (prev.verification_requests || []).filter(
        (r) => r.student_email.toLowerCase() !== cleanEmail
      );
      const nextReqs = [newVerifReq, ...existingReqs];
      savePersistedVerificationRequests(nextReqs);
      setVerificationRequests(nextReqs);

      const nextNotifs = deduplicateNotifications([teacherApprovalNotif, ...prev.notifications]);
      savePersistedNotifications(nextNotifs);

      const auditEntry: AuditLogRecord = {
        id: `audit-reg-${Date.now()}`,
        timestamp: nowIso,
        actorId: pendingUserRecord.id,
        actorName: cleanName,
        actorRole: 'student',
        action: 'Student Registration Submitted',
        category: 'approval',
        details: `${cleanName} registered for ${chosenClass} — ${chosenSection}. Routed to Class Teacher ${matchedTeacher.defaultName}.`
      };

      return {
        ...prev,
        users: [
          pendingUserRecord,
          ...prev.users.filter((u) => u.email.toLowerCase() !== cleanEmail)
        ],
        verification_requests: nextReqs,
        notifications: nextNotifs,
        audit_logs: [auditEntry, ...(prev.audit_logs || [])]
      };
    });

    const exactPendingMsg = `Registration submitted for ${chosenClass} — ${chosenSection}. Routed to Class Teacher ${matchedTeacher.defaultName} (${matchedTeacher.subject}) for approval.`;

    setStudentVerificationView({
      status: 'pending',
      message: exactPendingMsg,
      studentName: cleanName,
      studentEmail: cleanEmail,
      studentIdCode: generatedStudentCode,
      className: chosenClass,
      section: chosenSection,
      createdAt: nowIso,
      classTeacherName: matchedTeacher.defaultName,
      classTeacherSubject: matchedTeacher.subject,
      classTeacherCode: matchedTeacher.code
    });

    sound.playNotification();
    showToast(exactPendingMsg);

    return {
      ok: true,
      status: 'pending',
      pendingApproval: true,
      message: exactPendingMsg
    };
  };

  const approveStudentAccount = async (studentUserId: string) => {
    const allReqs = db.verification_requests?.length ? db.verification_requests : verificationRequests;
    const reqItem = allReqs.find((r) => r.student_id === studentUserId);
    const targetUser = db.users.find((u) => u.id === studentUserId);
    const studentName = reqItem?.student_name || targetUser?.name || 'Student';
    const className = (reqItem?.class_name || targetUser?.studentClass || 'Class 6').trim();
    const section = (reqItem?.section || targetUser?.section || 'B1').trim().toUpperCase();

    // Enforce class teacher permission: teacher can ONLY approve their assigned class and section
    if (currentUser?.role === 'teacher') {
      const myClass = (currentUser.studentClass || '').trim().toLowerCase();
      const mySection = (currentUser.section || '').trim().toUpperCase();
      if (myClass !== className.toLowerCase() || mySection !== section) {
        sound.playWrong();
        showToast(
          `Permission Denied: Only the assigned Class Teacher for ${className} — ${section} can approve this registration.`
        );
        return;
      }
    }

    // Call backend enforcement endpoint
    try {
      const token = sessionStorage.getItem(SSC_STAFF_TOKEN_KEY) || '';
      const resp = await fetch('/api/teacher/review-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          studentUserId,
          newStatus: 'approved',
          reviewerName: currentUser?.name,
          reviewerClass: currentUser?.studentClass,
          reviewerSection: currentUser?.section,
          reviewerRole: currentUser?.role
        })
      });
      if (resp.status === 403) {
        const errData = await resp.json();
        sound.playWrong();
        showToast(errData.error || 'Unauthorized to approve this registration.');
        return;
      }
    } catch {
      // continue local update
    }

    if (isSupabaseConfigured) {
      await supabaseReviewStudentStatus({
        studentUserId,
        newStatus: 'approved',
        studentName,
        className,
        section
      }).catch(() => {});
    }

    const nowIso = new Date().toISOString();
    setDb((prev) => {
      const nextReqs = (prev.verification_requests || verificationRequests).map((r) =>
        r.student_id === studentUserId
          ? {
              ...r,
              status: 'approved' as const,
              reviewed_by: currentUser?.name || 'Class Teacher',
              reviewed_at: nowIso
            }
          : r
      );
      savePersistedVerificationRequests(nextReqs);
      setVerificationRequests(nextReqs);

      const nextUsers = prev.users.map((u) =>
        u.id === studentUserId ? { ...u, approvalStatus: 'approved' as const } : u
      );

      // Add student to db.students if not present
      const hasStudentRec = prev.students.some((s) => s.user_id === studentUserId);
      const sectionCount = prev.students.filter(
        (s) =>
          s.class.toLowerCase() === className.toLowerCase() &&
          s.section.toUpperCase() === section
      ).length;

      const nextStudents = hasStudentRec
        ? prev.students
        : [
            ...prev.students,
            {
              id: `std-${studentUserId}`,
              user_id: studentUserId,
              student_id: reqItem?.student_code || targetUser?.studentIdCode || `SSC-2026-0699`,
              name: studentName,
              roll: sectionCount + 1,
              class: className,
              section,
              academic_year: '2026',
              streakDays: 1
            }
          ];

      // Mark the teacher's pending registration notification as read and resolved
      const clearedNotifs = prev.notifications.map((n) =>
        n.studentUserId === studentUserId &&
        (n.notificationType === 'registration_request' || n.targetRole === 'teacher')
          ? { ...n, read: true, resolved: true }
          : n
      );

      const approvedNotif: NotificationItem = {
        id: `notif-reg-dec-${studentUserId}-approved`,
        eventKey: `reg-dec-${studentUserId}-approved`,
        title: 'Account Approved by Class Teacher',
        message: `Welcome ${studentName}! Your registration for ${className} — ${section} has been approved by ${currentUser?.name || 'your Class Teacher'}.`,
        timestamp: 'Just now',
        read: false,
        targetRole: 'student',
        category: 'approval',
        notificationType: 'registration_reviewed',
        studentUserId,
        studentCode: reqItem?.student_code || targetUser?.studentIdCode,
        studentClass: className,
        studentSection: section
      };

      const nextNotifs = deduplicateNotifications([approvedNotif, ...clearedNotifs]);
      savePersistedNotifications(nextNotifs);

      return {
        ...prev,
        users: nextUsers,
        students: nextStudents,
        verification_requests: nextReqs,
        notifications: nextNotifs
      };
    });

    sound.playComplete();
    showToast(`Approved ${studentName} for ${className} — ${section}!`);
  };

  const rejectStudentAccount = async (studentUserId: string) => {
    const allReqs = db.verification_requests?.length ? db.verification_requests : verificationRequests;
    const reqItem = allReqs.find((r) => r.student_id === studentUserId);
    const targetUser = db.users.find((u) => u.id === studentUserId);
    const studentName = reqItem?.student_name || targetUser?.name || 'Student';
    const className = (reqItem?.class_name || targetUser?.studentClass || 'Class 6').trim();
    const section = (reqItem?.section || targetUser?.section || 'B1').trim().toUpperCase();

    if (currentUser?.role === 'teacher') {
      const myClass = (currentUser.studentClass || '').trim().toLowerCase();
      const mySection = (currentUser.section || '').trim().toUpperCase();
      if (myClass !== className.toLowerCase() || mySection !== section) {
        sound.playWrong();
        showToast(
          `Permission Denied: Only the assigned Class Teacher for ${className} — ${section} can reject this registration.`
        );
        return;
      }
    }

    try {
      const token = sessionStorage.getItem(SSC_STAFF_TOKEN_KEY) || '';
      const resp = await fetch('/api/teacher/review-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          studentUserId,
          newStatus: 'rejected',
          reviewerName: currentUser?.name,
          reviewerClass: currentUser?.studentClass,
          reviewerSection: currentUser?.section,
          reviewerRole: currentUser?.role
        })
      });
      if (resp.status === 403) {
        const errData = await resp.json();
        sound.playWrong();
        showToast(errData.error || 'Unauthorized to reject this registration.');
        return;
      }
    } catch {
      // continue local update
    }

    if (isSupabaseConfigured) {
      await supabaseReviewStudentStatus({
        studentUserId,
        newStatus: 'rejected',
        studentName,
        className,
        section
      }).catch(() => {});
    }

    const nowIso = new Date().toISOString();
    setDb((prev) => {
      const nextReqs = (prev.verification_requests || verificationRequests).map((r) =>
        r.student_id === studentUserId
          ? {
              ...r,
              status: 'rejected' as const,
              reviewed_by: currentUser?.name || 'Class Teacher',
              reviewed_at: nowIso
            }
          : r
      );
      savePersistedVerificationRequests(nextReqs);
      setVerificationRequests(nextReqs);

      const nextUsers = prev.users.map((u) =>
        u.id === studentUserId ? { ...u, approvalStatus: 'rejected' as const } : u
      );

      const clearedNotifs = prev.notifications.map((n) =>
        n.studentUserId === studentUserId &&
        (n.notificationType === 'registration_request' || n.targetRole === 'teacher')
          ? { ...n, read: true, resolved: true }
          : n
      );

      const rejectedNotif: NotificationItem = {
        id: `notif-reg-dec-${studentUserId}-rejected`,
        eventKey: `reg-dec-${studentUserId}-rejected`,
        title: 'Registration Declined by Class Teacher',
        message: `Your registration request for ${className} — ${section} was declined by ${currentUser?.name || 'your Class Teacher'}.`,
        timestamp: 'Just now',
        read: false,
        targetRole: 'student',
        category: 'approval',
        notificationType: 'registration_reviewed',
        studentUserId,
        studentCode: reqItem?.student_code || targetUser?.studentIdCode,
        studentClass: className,
        studentSection: section
      };

      const nextNotifs = deduplicateNotifications([rejectedNotif, ...clearedNotifs]);
      savePersistedNotifications(nextNotifs);

      return {
        ...prev,
        users: nextUsers,
        verification_requests: nextReqs,
        notifications: nextNotifs
      };
    });

    sound.playClick();
    showToast(`Rejected registration request for ${studentName}.`);
  };

  const quickDemoLogin = (role: UserRole, targetSurface?: AppSurface) => {
    const userId = role === 'student' ? 'usr-student-1' : 'usr-teacher-1';
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    setCurrentUser(user);
    sound.playComplete();
    if (targetSurface) {
      setSurfaceState(targetSurface);
    } else {
      setSurfaceState(role === 'student' ? 'student' : 'teacher');
    }
    showToast(`Signed in as ${user.name}`);
  };

  const logout = () => {
    sound.playClick();
    clearPersistedSession();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setVerificationRequests([]);
    setSurfaceState('login');
    showToast('Signed out securely.');
  };

  const openBrainify = (_initialTab: BrainifyTab = 'home') => {
    sound.playCircuitActivate();
    const a = document.createElement('a');
    a.href = 'https://chronotoolkit.netlify.app/';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exitBrainify = () => {
    sound.playClick();
    if (currentUser?.role === 'student') {
      setSurfaceState('student');
    } else if (currentUser?.role === 'teacher') {
      setSurfaceState('teacher');
    } else if (
      currentUser?.role === 'chairman' ||
      currentUser?.role === 'chief_advisor' ||
      currentUser?.role === 'principal'
    ) {
      setSurfaceState('leadership');
    } else {
      setSurfaceState('login');
    }
  };

  const saveClassAttendance = (
    date: string,
    classId: string,
    statusMap: Record<string, AttendanceStatus>
  ) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      return {
        ok: false,
        message: 'Unauthorized: Only authenticated teachers can mark attendance.'
      };
    }
    const teacherRec = db.teachers.find((t) => t.user_id === currentUser.id) || db.teachers[0];
    const classRec = db.classes.find((c) => c.id === classId);
    if (!teacherRec || !classRec) {
      sound.playWrong();
      return {
        ok: false,
        message: 'Class section not found.'
      };
    }

    setDb((prev) => {
      const filtered = prev.attendance.filter(
        (a) => !(a.class_id === classId && a.date === date)
      );
      const additions = Object.entries(statusMap).map(([student_id, status]) => ({
        id: `att-${date}-${student_id}`,
        student_id,
        class_id: classId,
        date,
        status,
        marked_by: teacherRec.id
      }));

      const nextAttendance = pruneClassAttendanceTo30Days([...filtered, ...additions], classId);

      // Persist overrides for the last 30 days
      const existingOverrides = loadPersistedAttendanceOverrides() || [];
      const keptOverrides = existingOverrides.filter(
        (a) => !(a.class_id === classId && a.date === date)
      );
      const nextOverrides = pruneClassAttendanceTo30Days([...keptOverrides, ...additions], classId);
      savePersistedAttendanceOverrides(nextOverrides);

      // Create notifications for students in this class
      const presentCount = Object.values(statusMap).filter((s) => s === 'Present').length;
      const absentCount = Object.values(statusMap).filter((s) => s === 'Absent').length;
      const lateCount = Object.values(statusMap).filter((s) => s === 'Late').length;

      const classAttNotif: NotificationItem = {
        id: `notif-att-${Date.now()}`,
        title: `Attendance Recorded (${date})`,
        message: `${classRec.class_name} — ${classRec.section} attendance for ${date} was saved by ${currentUser.name} (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late).`,
        timestamp: 'Just now',
        read: false,
        targetRole: 'student',
        category: 'attendance',
        studentClass: classRec.class_name,
        studentSection: classRec.section
      };

      const nextNotifications = [classAttNotif, ...prev.notifications];
      savePersistedNotifications(nextNotifications);

      return {
        ...prev,
        attendance: nextAttendance,
        notifications: nextNotifications
      };
    });

    sound.playComplete();
    showToast(`Attendance for ${date} saved to 30-day archive & student notifications sent.`);
    return {
      ok: true,
      message: `Attendance for ${date} saved to 30-day history & students notified.`
    };
  };

  const saveStudentResult = (
    studentId: string,
    subjectId: string,
    marks: number,
    remarks: string
  ) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      return { ok: false, message: 'Unauthorized action.' };
    }
    const subject = db.subjects.find((s) => s.id === subjectId);
    if (!subject) return { ok: false, message: 'Subject not found.' };

    const teacherRec = db.teachers.find((t) => t.user_id === currentUser.id);
    if (!teacherRec || !teacherRec.authorizedSubjects.includes(subject.name)) {
      sound.playWrong();
      return {
        ok: false,
        message: `Permission Denied: You are not authorized to enter marks for ${subject.name}.`
      };
    }

    const clamped = Math.max(0, Math.min(subject.fullMarks, marks));
    const { grade, gpa } = calculateGradeAndGpa(clamped, subject.fullMarks);
    const targetStudent = db.students.find((s) => s.id === studentId);
    const targetStudentUser = targetStudent
      ? db.users.find((u) => u.id === targetStudent.user_id)
      : undefined;

    setDb((prev) => {
      const existingIdx = prev.results.findIndex(
        (r) => r.student_id === studentId && r.subject_id === subjectId
      );
      const nextResults = [...prev.results];
      if (existingIdx >= 0) {
        nextResults[existingIdx] = {
          ...nextResults[existingIdx],
          marks: clamped,
          grade,
          gpa,
          remarks: remarks || nextResults[existingIdx].remarks
        };
      } else {
        nextResults.push({
          id: `res-${Date.now()}`,
          student_id: studentId,
          subject_id: subjectId,
          subjectName: subject.name,
          exam_id: 'ex-hy-2026',
          examName: 'Half-Yearly Examination 2026',
          fullMarks: subject.fullMarks,
          marks: clamped,
          grade,
          gpa,
          highestInClass: Math.max(96, clamped),
          positionInSubject: 1,
          remarks: remarks || 'Updated by subject teacher.'
        });
      }

      const existingOverrides = loadPersistedResultsOverrides() || [];
      const keptOverrides = existingOverrides.filter(
        (r) => !(r.student_id === studentId && r.subject_id === subjectId)
      );
      const updatedRecord = nextResults.find(
        (r) => r.student_id === studentId && r.subject_id === subjectId
      );
      if (updatedRecord) {
        savePersistedResultsOverrides([...keptOverrides, updatedRecord]);
      }

      const resultNotif: NotificationItem = {
        id: `notif-res-${Date.now()}`,
        title: `Result Published: ${subject.name}`,
        message: `${getAuthoritativeStudentName(targetStudent, targetStudentUser)} (ID: ${targetStudent?.student_id}): ${subject.name} marks updated to ${clamped}/${subject.fullMarks} (Grade ${grade}, GPA ${gpa.toFixed(2)}) by ${currentUser.name}.`,
        timestamp: 'Just now',
        read: false,
        targetRole: 'student',
        category: 'result',
        studentUserId: targetStudent?.user_id,
        studentCode: targetStudent?.student_id,
        studentClass: targetStudent?.class,
        studentSection: targetStudent?.section
      };

      const nextNotifications = [resultNotif, ...prev.notifications];
      savePersistedNotifications(nextNotifications);

      return {
        ...prev,
        results: nextResults,
        notifications: nextNotifications
      };
    });

    sound.playComplete();
    showToast(`${subject.name} result saved (${clamped}/${subject.fullMarks} · Grade ${grade}) & student notified.`);
    return { ok: true, message: 'Result updated and student notified.' };
  };

  const createExamOrCT = (exam: Omit<ExamRecord, 'id'>) => {
    const newExam: ExamRecord = { ...exam, id: `ex-${Date.now()}` };
    const matchingSubjectTeacher = ORDERED_TEACHER_LIST.find(
      (t) => t.subject.toLowerCase() === exam.subject.toLowerCase()
    );
    setDb((prev) => {
      const ctNotif: NotificationItem = {
        id: `notif-ex-${Date.now()}`,
        title: `New ${exam.type} Scheduled: ${exam.name}`,
        message: `${exam.name} (${exam.subject} · ${exam.class}) on ${exam.date} at ${exam.time} — Syllabus: ${exam.syllabus}.`,
        timestamp: 'Just now',
        read: false,
        targetRole: 'both',
        category: 'exam',
        notificationType: 'exam',
        studentClass: exam.class,
        subject: exam.subject,
        recipientTeacherCode: currentUser?.teacherCode || matchingSubjectTeacher?.code
      };
      const nextNotifications = [ctNotif, ...prev.notifications];
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        exams: [newExam, ...prev.exams],
        notifications: nextNotifications
      };
    });
    sound.playNotification();
    showToast(`${exam.name} scheduled and notification sent to students.`);
  };

  const createAssignment = (
    asg: Omit<
      AssignmentRecord,
      'id' | 'status' | 'totalSubmissions' | 'pendingCount' | 'lateCount'
    >
  ) => {
    const newAsg: AssignmentRecord = {
      ...asg,
      id: `asg-${Date.now()}`,
      status: 'Not Started',
      totalSubmissions: 0,
      pendingCount: 40,
      lateCount: 0
    };
    setDb((prev) => ({
      ...prev,
      assignments: [newAsg, ...prev.assignments],
      notifications: [
        {
          id: `notif-asg-${Date.now()}`,
          title: 'New Assignment Posted',
          message: `${asg.subject}: "${asg.title}" due on ${asg.due_date}.`,
          timestamp: 'Just now',
          read: false,
          targetRole: 'student',
          category: 'assignment',
          notificationType: 'assignment',
          studentClass: asg.class.split(' — ')[0],
          studentSection: asg.class.split(' — ')[1],
          subject: asg.subject
        },
        ...prev.notifications
      ]
    }));
    sound.playNotification();
    showToast(`Assignment "${asg.title}" posted to ${asg.class}.`);
  };

  const submitStudentAssignment = (assignmentId: string, fileName: string) => {
    setDb((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'Submitted',
              submittedFileName: fileName,
              submittedAt: new Date().toLocaleString(),
              totalSubmissions: (a.totalSubmissions || 0) + 1,
              pendingCount: Math.max(0, (a.pendingCount || 1) - 1)
            }
          : a
      )
    }));
    sound.playComplete();
    showToast(`Assignment work "${fileName}" submitted successfully.`);
  };

  const createNotice = (notice: Omit<NoticeRecord, 'id' | 'date'>) => {
    const today = new Date().toISOString().slice(0, 10);
    const newNotice: NoticeRecord = { ...notice, id: `not-${Date.now()}`, date: today };
    setDb((prev) => ({
      ...prev,
      notices: [newNotice, ...prev.notices],
      notifications: [
        {
          id: `notif-not-${Date.now()}`,
          title: `New Notice: ${notice.category}`,
          message: notice.title,
          timestamp: 'Just now',
          read: false,
          targetRole: 'both',
          category: 'general',
          notificationType: 'announcement',
          studentClass: notice.target.startsWith('Class') ? notice.target.split(' — ')[0] : undefined,
          studentSection: notice.target.includes(' — ') ? notice.target.split(' — ')[1] : undefined,
          recipientTeacherCode: currentUser?.teacherCode
        },
        ...prev.notifications
      ]
    }));
    sound.playNotification();
    showToast('Notice broadcast to target recipients.');
  };

  const uploadPreviousQuestion = (pq: Omit<PreviousQuestionRecord, 'id'>) => {
    const newPq: PreviousQuestionRecord = { ...pq, id: `pq-${Date.now()}` };
    setDb((prev) => ({
      ...prev,
      previous_questions: [newPq, ...prev.previous_questions]
    }));
    sound.playComplete();
    showToast(`Question paper "${pq.title}" added to archive.`);
  };

  const submitStudentComplaint = (params: {
    studentId?: string;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    subjectTitle: string;
    complaintText: string;
    fromTeacherCode?: string;
  }) => {
    if (!currentUser) {
      return { ok: false, message: 'Please sign in first to submit a complaint.' };
    }

    const cleanSubject = params.subjectTitle.trim();
    const cleanText = params.complaintText.trim();
    if (!cleanSubject || !cleanText) {
      sound.playWrong();
      return {
        ok: false,
        message: 'Please provide both a complaint subject/headline and your message.'
      };
    }

    // Student submitting a complaint / message to their respective Class Teacher
    if (currentUser.role === 'student') {
      const matchedStudentRec =
        db.students.find(
          (s) =>
            (params.studentId && s.id === params.studentId) ||
            s.user_id === currentUser.id ||
            (currentUser.studentIdCode &&
              s.student_id.toUpperCase() === currentUser.studentIdCode.toUpperCase())
        ) || db.students[0];

      const studentCode = currentUser.studentIdCode || matchedStudentRec.student_id || '90001';
      const studentName = currentUser.name || `Student (${studentCode})`;
      const studentClass = currentUser.studentClass || matchedStudentRec.class || 'Class 9';
      const rawSec = currentUser.section || matchedStudentRec.section || 'BS1';
      const studentSection = rawSec === 'BS2' ? 'BS1' : rawSec;
      const targetClassTeacher = getClassTeacherForSection(studentClass, studentSection);

      const newComplaintId = `cmp-std-${Date.now()}`;
      const newComplaint: StudentComplaintRecord = {
        id: newComplaintId,
        student_id: matchedStudentRec.id,
        student_code: studentCode,
        student_name: studentName,
        student_roll: matchedStudentRec.roll || 1,
        class_name: studentClass,
        section: studentSection,
        target_class_section: `${studentClass} — ${studentSection}`,
        class_teacher_code: targetClassTeacher.code,
        class_teacher_name: targetClassTeacher.defaultName,
        from_teacher_code: studentCode,
        from_teacher_name: `${studentName} (Student)`,
        from_teacher_subject: `${studentClass} — ${studentSection}`,
        submitted_by_role: 'student',
        category: params.category,
        severity: params.severity,
        subject_title: cleanSubject,
        complaint_text: cleanText,
        status: 'Submitted',
        created_at: new Date().toISOString()
      };

      setDb((prev) => {
        const nextComplaints = [newComplaint, ...prev.complaints];
        savePersistedComplaints(nextComplaints);
        // 1. A new complaint generates ONE notification for the authorized reviewer
        const reviewerNotif: NotificationItem = {
          id: `notif-cmp-rev-${newComplaintId}`,
          eventKey: `complaint-submitted-${newComplaintId}`,
          title: `New Complaint Submitted: ${cleanSubject}`,
          message: `Student ${studentName} (${studentClass} — ${studentSection}, Roll ${String(newComplaint.student_roll).padStart(2, '0')}) submitted a complaint to ${targetClassTeacher.defaultName}: "${cleanSubject}".`,
          timestamp: 'Just now',
          read: false,
          resolved: false,
          targetRole: 'teacher',
          category: 'complaint',
          notificationType: 'complaint_submitted',
          studentUserId: currentUser.id,
          studentCode,
          studentClass,
          studentSection,
          recipientTeacherCode: targetClassTeacher.code,
          complaintId: newComplaint.id
        };
        const nextNotifications = deduplicateNotifications([reviewerNotif, ...prev.notifications]);
        savePersistedNotifications(nextNotifications);
        return {
          ...prev,
          complaints: nextComplaints,
          notifications: nextNotifications
        };
      });

      sound.playNotification();
      const msg = `Your complaint has been submitted to Class Teacher ${targetClassTeacher.defaultName} (${studentClass} — ${studentSection}).`;
      showToast(msg);
      return { ok: true, message: msg, complaint: newComplaint };
    }

    // Teacher submitting a complaint about a student to that student's Class Teacher
    const studentRec = db.students.find((s) => s.id === params.studentId);
    if (!studentRec) {
      sound.playWrong();
      return { ok: false, message: 'Selected student record not found.' };
    }

    const studentUser = db.users.find((u) => u.id === studentRec.user_id);
    const studentName = studentUser?.name || studentRec.name || `Student (${studentRec.student_id})`;
    const targetClassTeacher = getClassTeacherForSection(studentRec.class, studentRec.section);

    const activeTeacherCode =
      params.fromTeacherCode ||
      currentUser.teacherCode ||
      currentUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    const reportingTeacherMeta = TEACHER_CODES[activeTeacherCode] || TEACHER_CODES['18887'];

    const newComplaintId = `cmp-${Date.now()}`;
    const newComplaint: StudentComplaintRecord = {
      id: newComplaintId,
      student_id: studentRec.id,
      student_code: studentRec.student_id,
      student_name: studentName,
      student_roll: studentRec.roll,
      class_name: studentRec.class,
      section: studentRec.section,
      target_class_section: `${studentRec.class} — ${studentRec.section}`,
      class_teacher_code: targetClassTeacher.code,
      class_teacher_name: targetClassTeacher.defaultName,
      from_teacher_code: reportingTeacherMeta.code,
      from_teacher_name: reportingTeacherMeta.defaultName,
      from_teacher_subject: reportingTeacherMeta.subject,
      submitted_by_role: 'teacher',
      category: params.category,
      severity: params.severity,
      subject_title: cleanSubject,
      complaint_text: cleanText,
      status: 'Submitted',
      created_at: new Date().toISOString()
    };

    setDb((prev) => {
      const nextComplaints = [newComplaint, ...prev.complaints];
      savePersistedComplaints(nextComplaints);
      // 1. A new complaint generates ONE notification for the authorized reviewer (and notifies student if reported)
      const reviewerNotif: NotificationItem = {
        id: `notif-cmp-tch-${newComplaintId}`,
        eventKey: `complaint-submitted-${newComplaintId}`,
        title: `New Complaint Submitted (${newComplaint.severity})`,
        message: `${newComplaint.from_teacher_name} (${newComplaint.from_teacher_subject}) submitted a complaint regarding ${newComplaint.student_name} (ID: ${newComplaint.student_code}) to ${newComplaint.target_class_section} Complaint Box.`,
        timestamp: 'Just now',
        read: false,
        resolved: false,
        targetRole: 'teacher',
        category: 'complaint',
        notificationType: 'complaint_submitted',
        studentClass: newComplaint.class_name,
        studentSection: newComplaint.section,
        recipientTeacherCode: targetClassTeacher.code,
        complaintId: newComplaint.id
      };
      const nextNotifications = deduplicateNotifications([reviewerNotif, ...prev.notifications]);
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        complaints: nextComplaints,
        notifications: nextNotifications
      };
    });

    sound.playNotification();
    const msg = `Complaint submitted to ${targetClassTeacher.defaultName} (${studentRec.class} — ${studentRec.section} Complaint Box).`;
    showToast(msg);
    return { ok: true, message: msg, complaint: newComplaint };
  };

  const triggerNextClassNotification = (customLeadMinutes: number = 15) => {
    const myCode =
      currentUser?.teacherCode ||
      currentUser?.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    const teacherRec =
      db.teachers.find((t) => t.user_id === currentUser?.id || t.employee_id.endsWith(myCode)) ||
      db.teachers[0];
    const subjectName = teacherRec?.authorizedSubjects?.[0] || 'Physics';
    const classSection = teacherRec?.classTeacherOf || 'Class 10 — BS1';
    const teacherName = currentUser?.name || 'Saif Chowdhury';

    const newNotif: NotificationItem = {
      id: `notif-next-class-${Date.now()}`,
      title: `🔔 Next Class Alert (${customLeadMinutes} Mins Remaining)`,
      message: `${teacherName}: Your next lecture (${subjectName} — ${classSection}, 09:30 AM – 10:15 AM) starts in ${customLeadMinutes} minutes.`,
      timestamp: 'Just now',
      read: false,
      targetRole: 'teacher',
      category: 'class',
      recipientTeacherCode: myCode
    };

    setDb((prev) => {
      const nextNotifications = [newNotif, ...prev.notifications];
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        notifications: nextNotifications
      };
    });

    sound.playNotification();
    showToast(
      `🔔 Next Class Notification: ${subjectName} (${classSection}, Room 304) starts in ${customLeadMinutes} minutes!`
    );
  };

  const updateStudentComplaintStatus = (
    complaintId: string,
    status: ComplaintStatus,
    classTeacherNote?: string
  ) => {
    const cleanReply = classTeacherNote !== undefined ? classTeacherNote.trim() : undefined;
    const nowIso = new Date().toISOString();

    setDb((prev) => {
      const targetCmp = prev.complaints.find((c) => c.id === complaintId);
      const effectiveStatus: ComplaintStatus =
        cleanReply && status !== 'Resolved' ? 'Replied' : status;

      const nextComplaints = prev.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              status: effectiveStatus,
              class_teacher_note:
                cleanReply !== undefined && cleanReply.length > 0
                  ? cleanReply
                  : c.class_teacher_note,
              replied_by:
                cleanReply !== undefined && cleanReply.length > 0
                  ? currentUser?.name || c.class_teacher_name
                  : c.replied_by,
              replied_at:
                cleanReply !== undefined && cleanReply.length > 0 ? nowIso : c.replied_at,
              resolved_at: effectiveStatus === 'Resolved' ? nowIso : c.resolved_at
            }
          : c
      );
      savePersistedComplaints(nextComplaints);

      // Step 3 of Complaint Notification Bug:
      // Clear/resolve the reviewer's outstanding complaint_submitted notification once a reply is sent or complaint is Resolved
      let nextNotifications = prev.notifications.map((n) => {
        if (n.complaintId === complaintId) {
          if (
            (effectiveStatus === 'Replied' || effectiveStatus === 'Resolved' || Boolean(cleanReply)) &&
            (n.notificationType === 'complaint_submitted' || n.targetRole === 'teacher')
          ) {
            return { ...n, read: true, resolved: true };
          }
          if (effectiveStatus === 'Resolved') {
            return { ...n, read: true, resolved: true };
          }
        }
        return n;
      });

      // Step 2 of Complaint Notification Bug:
      // When reviewer replies (or resolves), send ONE notification to the complainant
      if (targetCmp && (cleanReply || effectiveStatus === 'Replied' || effectiveStatus === 'Resolved')) {
        const isTeacherComplainant = targetCmp.submitted_by_role === 'teacher';
        const replyEventKey = `complaint-reply-${targetCmp.id}-${effectiveStatus}`;

        // Remove any older unread reply notification for this same complaint so only one active reply notification exists
        nextNotifications = nextNotifications.filter(
          (n) => !(n.complaintId === complaintId && n.notificationType === 'complaint_reply')
        );

        const replyNotif: NotificationItem = {
          id: `notif-cmp-reply-${targetCmp.id}-${effectiveStatus.toLowerCase().replace(/\s+/g, '-')}`,
          eventKey: replyEventKey,
          title:
            effectiveStatus === 'Resolved'
              ? `Complaint Resolved: ${targetCmp.subject_title}`
              : `Reply Received on Complaint: ${targetCmp.subject_title}`,
          message: `${currentUser?.name || targetCmp.class_teacher_name} (${effectiveStatus}): ${
            cleanReply || targetCmp.class_teacher_note || `Marked "${targetCmp.subject_title}" as ${effectiveStatus}.`
          }`,
          timestamp: 'Just now',
          read: false,
          resolved: false,
          targetRole: isTeacherComplainant ? 'teacher' : 'student',
          category: 'complaint',
          notificationType: 'complaint_reply',
          studentCode: targetCmp.student_code,
          studentClass: targetCmp.class_name,
          studentSection: targetCmp.section,
          recipientTeacherCode: isTeacherComplainant ? targetCmp.from_teacher_code : undefined,
          complaintId: targetCmp.id
        };

        nextNotifications = deduplicateNotifications([replyNotif, ...nextNotifications]);
      }

      savePersistedNotifications(nextNotifications);

      return {
        ...prev,
        complaints: nextComplaints,
        notifications: nextNotifications
      };
    });
    sound.playComplete();
    showToast(`Complaint updated (${cleanReply && status !== 'Resolved' ? 'Replied' : status}).`);
  };

  // Step 4 of Complaint Notification Bug:
  // Complainant's reply notification becomes read when the reply is viewed
  const markComplaintReplyViewed = (complaintId: string) => {
    setDb((prev) => {
      let changed = false;
      const nextNotifications = prev.notifications.map((n) => {
        if (n.complaintId === complaintId && !n.read) {
          if (
            currentUser?.role === 'student' &&
            (n.notificationType === 'complaint_reply' || n.targetRole === 'student')
          ) {
            changed = true;
            return { ...n, read: true };
          }
          if (
            currentUser?.role === 'teacher' &&
            n.notificationType === 'complaint_reply' &&
            n.recipientTeacherCode === currentUser.teacherCode
          ) {
            changed = true;
            return { ...n, read: true };
          }
        }
        return n;
      });
      if (!changed) return prev;
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        notifications: nextNotifications
      };
    });
  };

  const markComplaintSeenByTeacher = (complaintId: string) => {
    const nowIso = new Date().toISOString();
    setDb((prev) => {
      const target = prev.complaints.find((c) => c.id === complaintId);
      if (!target) return prev;
      const nextComplaints = prev.complaints.map((c) =>
        c.id === complaintId
          ? {
              ...c,
              seen_by_teacher: true,
              read_by_teacher: true,
              read_by_leadership: true,
              seen_at: c.seen_at || nowIso,
              status: c.status === 'Submitted' ? ('Under Review' as ComplaintStatus) : c.status
            }
          : c
      );
      savePersistedComplaints(nextComplaints);
      const nextNotifications = prev.notifications.map((n) => {
        if (
          n.complaintId === complaintId &&
          (n.notificationType === 'complaint_submitted' || n.targetRole === 'teacher')
        ) {
          return { ...n, read: true, resolved: true };
        }
        return n;
      });
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        complaints: nextComplaints,
        notifications: nextNotifications
      };
    });
  };

  const markAllComplaintsReadForCurrentUser = () => {
    if (!currentUser) return;
    const role = currentUser.role;
    const isLeadership =
      role === 'chairman' || role === 'chief_advisor' || role === 'principal';
    const myCode =
      currentUser.teacherCode ||
      currentUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    const teacherRec = db.teachers.find(
      (t) => t.user_id === currentUser.id || t.employee_id.endsWith(myCode)
    );
    const mySection = (teacherRec?.classTeacherOf || 'Class 10 — BS1').toLowerCase();

    setDb((prev) => {
      let complaintsChanged = false;
      const nextComplaints = prev.complaints.map((c) => {
        if (isLeadership) {
          if (!c.read_by_leadership || c.status === 'Submitted') {
            complaintsChanged = true;
            return {
              ...c,
              read_by_leadership: true,
              status: c.status === 'Submitted' ? ('Under Review' as ComplaintStatus) : c.status
            };
          }
        } else if (role === 'teacher') {
          const isMine =
            c.class_teacher_code === myCode ||
            c.target_class_section.toLowerCase() === mySection;
          if (isMine && (!c.read_by_teacher || c.status === 'Submitted')) {
            complaintsChanged = true;
            return {
              ...c,
              read_by_teacher: true,
              status: c.status === 'Submitted' ? ('Under Review' as ComplaintStatus) : c.status
            };
          }
        }
        return c;
      });

      let notifsChanged = false;
      const nextNotifications = prev.notifications.map((n) => {
        if (n.read) return n;
        const isComplaintNotif =
          n.category === 'complaint' ||
          Boolean(n.complaintId) ||
          n.notificationType === 'complaint_submitted' ||
          n.notificationType === 'complaint_reply';
        if (!isComplaintNotif) return n;

        if (isLeadership) {
          notifsChanged = true;
          return { ...n, read: true };
        }
        if (role === 'teacher') {
          const cmp = n.complaintId
            ? prev.complaints.find((c) => c.id === n.complaintId)
            : undefined;
          const isForMe =
            n.recipientTeacherCode === myCode ||
            cmp?.class_teacher_code === myCode ||
            cmp?.target_class_section.toLowerCase() === mySection ||
            cmp?.from_teacher_code === myCode;
          if (isForMe) {
            notifsChanged = true;
            return { ...n, read: true };
          }
        }
        if (role === 'student' && (n.targetRole === 'student' || n.targetRole === 'both')) {
          notifsChanged = true;
          return { ...n, read: true };
        }
        return n;
      });

      if (!complaintsChanged && !notifsChanged) return prev;
      if (complaintsChanged) savePersistedComplaints(nextComplaints);
      if (notifsChanged) savePersistedNotifications(nextNotifications);

      return {
        ...prev,
        complaints: complaintsChanged ? nextComplaints : prev.complaints,
        notifications: notifsChanged ? nextNotifications : prev.notifications
      };
    });
  };

  const deleteStudentComplaint = (complaintId: string) => {
    setDb((prev) => {
      const nextComplaints = prev.complaints.filter((c) => c.id !== complaintId);
      savePersistedComplaints(nextComplaints);
      const nextNotifications = prev.notifications.filter((n) => n.complaintId !== complaintId);
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        complaints: nextComplaints,
        notifications: nextNotifications
      };
    });
    sound.playClick();
    showToast('Complaint deleted permanently.');
  };

  const callTeacherToRoom = (params: {
    teacherCode: string;
    room: string;
    urgency: TeacherCallRecord['urgency'];
    reason: string;
  }): { ok: boolean; message: string } => {
    if (
      !currentUser ||
      (currentUser.role !== 'chairman' &&
        currentUser.role !== 'chief_advisor' &&
        currentUser.role !== 'principal' &&
        currentUser.role !== 'teacher')
    ) {
      sound.playWrong();
      return {
        ok: false,
        message: 'Unauthorized: Please sign in as Leadership or Faculty to call a teacher.'
      };
    }

    const meta = TEACHER_CODES[params.teacherCode] || ORDERED_TEACHER_LIST[0];
    const teacherRec = db.teachers.find((t) => t.employee_id.endsWith(meta.code)) || db.teachers[0];
    const callerTitle =
      currentUser.position ||
      (currentUser.role === 'chairman'
        ? 'Chairman'
        : currentUser.role === 'chief_advisor'
        ? 'Chief Advisor'
        : currentUser.role === 'principal'
        ? 'Principal'
        : 'Principal');
    const cleanRoom = params.room.trim() || `${callerTitle}'s Office / Faculty Room`;
    const cleanReason = params.reason.trim() || 'Administrative / Academic Consultation';
    const nowIso = new Date().toISOString();
    const callId = `call-${Date.now()}`;

    const newCall: TeacherCallRecord = {
      id: callId,
      teacher_id: teacherRec?.id || `tch-${meta.code}`,
      teacher_code: meta.code,
      teacher_name: meta.defaultName,
      teacher_subject: meta.subject,
      teacher_class_section: meta.classTeacherSection,
      called_by_id: currentUser.id,
      called_by_name: currentUser.name,
      called_by_role: currentUser.role,
      called_by_position: callerTitle,
      room: cleanRoom,
      urgency: params.urgency,
      reason: cleanReason,
      status: 'Called',
      created_at: nowIso
    };

    const callNotif: NotificationItem = {
      id: `notif-call-${callId}`,
      eventKey: `teacher-call-${callId}`,
      title: `Office Summons from ${newCall.called_by_position} (${newCall.urgency})`,
      message: `${newCall.called_by_name} (${newCall.called_by_position}) has requested your presence at ${cleanRoom}. Note: "${cleanReason}"`,
      timestamp: 'Just now',
      read: false,
      resolved: false,
      targetRole: 'teacher',
      category: 'general',
      notificationType: 'teacher_call',
      recipientTeacherCode: meta.code
    };

    const auditEntry: AuditLogRecord = {
      id: `audit-call-${Date.now()}`,
      timestamp: nowIso,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorPosition: newCall.called_by_position,
      action: 'Called Teacher to Room',
      category: 'management',
      target: meta.defaultName,
      details: `${newCall.called_by_position} (${currentUser.name}) called ${meta.defaultName} (${meta.classTeacherSection}) to ${cleanRoom} [${params.urgency}]: "${cleanReason}".`
    };

    setDb((prev) => {
      const nextNotifs = deduplicateNotifications([callNotif, ...prev.notifications]);
      savePersistedNotifications(nextNotifs);
      return {
        ...prev,
        teacher_calls: [newCall, ...(prev.teacher_calls || [])],
        notifications: nextNotifs,
        audit_logs: [auditEntry, ...(prev.audit_logs || [])]
      };
    });

    sound.playNotification();
    const msg = `Summons sent to ${meta.defaultName} (${meta.classTeacherSection}) for ${cleanRoom}.`;
    showToast(msg);
    return { ok: true, message: msg };
  };

  const acknowledgeTeacherCall = (
    callId: string,
    status: 'Acknowledged' | 'Completed' = 'Acknowledged'
  ) => {
    const nowIso = new Date().toISOString();
    setDb((prev) => {
      const nextCalls = (prev.teacher_calls || []).map((c) =>
        c.id === callId
          ? {
              ...c,
              status,
              acknowledged_at: c.acknowledged_at || nowIso
            }
          : c
      );
      const nextNotifs = prev.notifications.map((n) =>
        n.eventKey === `teacher-call-${callId}`
          ? { ...n, read: true, resolved: status === 'Completed' }
          : n
      );
      savePersistedNotifications(nextNotifs);
      return {
        ...prev,
        teacher_calls: nextCalls,
        notifications: nextNotifs
      };
    });
    sound.playComplete();
    showToast(`Office call marked as ${status}.`);
  };

  const deleteTeacherCall = (callId: string) => {
    setDb((prev) => {
      const nextCalls = (prev.teacher_calls || []).filter((c) => c.id !== callId);
      const nextNotifs = prev.notifications.filter((n) => n.eventKey !== `teacher-call-${callId}`);
      savePersistedNotifications(nextNotifs);
      return {
        ...prev,
        teacher_calls: nextCalls,
        notifications: nextNotifs
      };
    });
    sound.playClick();
    showToast('Teacher call record deleted.');
  };

  const changeAccountPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ ok: boolean; message: string }> => {
    if (!currentUser) {
      return { ok: false, message: 'You must be signed in to change your password.' };
    }
    const cleanCurr = currentPassword.trim();
    const cleanNew = newPassword.trim();
    if (!cleanCurr || !cleanNew) {
      sound.playWrong();
      return { ok: false, message: 'Please enter both your current password and new password.' };
    }
    if (cleanNew.length < 6) {
      sound.playWrong();
      return { ok: false, message: 'New password must be at least 6 characters long.' };
    }

    try {
      const token = sessionStorage.getItem(SSC_STAFF_TOKEN_KEY) || '';
      const resp = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: currentUser.id,
          currentPassword: cleanCurr,
          newPassword: cleanNew
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        sound.playWrong();
        return { ok: false, message: data.error || 'Failed to change password.' };
      }
    } catch {
      // Fallback local verification
      const currHash = hashCredential(cleanCurr);
      if (currentUser.passwordHash && currentUser.passwordHash !== currHash) {
        sound.playWrong();
        return { ok: false, message: 'Current password is incorrect.' };
      }
    }

    const newHash = hashCredential(cleanNew);
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === currentUser.id ? { ...u, passwordHash: newHash, passwordChanged: true } : u
      )
    }));
    setCurrentUser((prev) =>
      prev ? { ...prev, passwordHash: newHash, passwordChanged: true } : null
    );
    sound.playComplete();
    showToast('Password updated securely.');
    return { ok: true, message: 'Your password has been updated securely.' };
  };

  const updateChiefAdvisorPermissions = async (
    permissions: Partial<ChiefAdvisorPermissions>
  ): Promise<{ ok: boolean; message: string }> => {
    if (
      !currentUser ||
      (currentUser.role !== 'chairman' && currentUser.role !== 'principal')
    ) {
      sound.playWrong();
      return {
        ok: false,
        message: 'Unauthorized: Only the Chairman or Principal can configure Chief Advisor permissions.'
      };
    }

    try {
      const token = sessionStorage.getItem(SSC_STAFF_TOKEN_KEY) || '';
      const resp = await fetch('/api/leadership/chief-advisor-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          actorRole: currentUser.role,
          permissions
        })
      });
      const data = await resp.json();
      if (resp.ok && data.ok && data.chiefAdvisorPermissions) {
        setDb((prev) => ({
          ...prev,
          chief_advisor_permissions: data.chiefAdvisorPermissions,
          audit_logs: data.auditLogs || prev.audit_logs
        }));
        sound.playComplete();
        showToast('Chief Advisor permissions updated.');
        return { ok: true, message: 'Chief Advisor permissions updated.' };
      }
    } catch {
      // Fallback local update
    }

    setDb((prev) => {
      const currentPerms = prev.chief_advisor_permissions || {
        masterAccess: false,
        viewAttendance: true,
        viewReports: true,
        viewAuditLogs: false,
        manageComplaints: false,
        viewAcademicSummaries: true,
        manageDirectory: false
      };
      const merged: ChiefAdvisorPermissions = {
        ...currentPerms,
        ...permissions,
        updatedBy: currentUser.name,
        updatedAt: new Date().toISOString()
      };
      if (merged.masterAccess) {
        merged.viewAttendance = true;
        merged.viewReports = true;
        merged.viewAuditLogs = true;
        merged.manageComplaints = true;
        merged.viewAcademicSummaries = true;
        merged.manageDirectory = true;
      }
      return {
        ...prev,
        chief_advisor_permissions: merged
      };
    });
    sound.playComplete();
    showToast('Chief Advisor permissions updated.');
    return { ok: true, message: 'Chief Advisor permissions updated.' };
  };

  const assignTeacherToClassSection = async (
    teacherId: string,
    className: string,
    section: string,
    grantAdditionalClass = false
  ): Promise<{ ok: boolean; message: string }> => {
    const canManage =
      currentUser?.role === 'chairman' ||
      currentUser?.role === 'principal' ||
      (currentUser?.role === 'chief_advisor' &&
        (db.chief_advisor_permissions?.masterAccess ||
          db.chief_advisor_permissions?.manageDirectory));

    if (!canManage) {
      sound.playWrong();
      return {
        ok: false,
        message: 'Unauthorized: Master access is required to manage teacher assignments.'
      };
    }

    try {
      const token = sessionStorage.getItem(SSC_STAFF_TOKEN_KEY) || '';
      await fetch('/api/leadership/manage-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          actorRole: currentUser?.role,
          entityType: 'teacher',
          action: 'assign_class',
          payload: { teacherId, className, section, grantAdditionalClass }
        })
      });
    } catch {
      // continue local update
    }

    const label = `${className} — ${section}`;
    setDb((prev) => {
      const targetTeacher = prev.teachers.find((t) => t.id === teacherId);
      const nextTeachers = prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const nextAssigned = Array.from(new Set([...(t.assignedClasses || []), label]));
        return {
          ...t,
          assignedClasses: nextAssigned,
          classTeacherOf: grantAdditionalClass ? t.classTeacherOf : label
        };
      });
      const nextUsers = grantAdditionalClass
        ? prev.users
        : prev.users.map((u) =>
            u.id === targetTeacher?.user_id
              ? { ...u, studentClass: className, section }
              : u
          );
      return {
        ...prev,
        teachers: nextTeachers,
        users: nextUsers
      };
    });

    sound.playComplete();
    showToast(`Updated teacher assignment for ${label}.`);
    return { ok: true, message: `Updated teacher assignment for ${label}.` };
  };

  const updateProfile = (name: string, phone: string) => {
    if (!currentUser) return;
    if (supabase && !currentUser.id.startsWith('usr-')) {
      supabase
        .from('profiles')
        .update({ full_name: name, phone, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id)
        .then(() => {});
    }
    setDb((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === currentUser.id ? { ...u, name, phone } : u))
    }));
    setCurrentUser((prev) => (prev ? { ...prev, name, phone } : null));
    sound.playComplete();
    showToast('Profile information updated.');
  };

  const markAllNotificationsRead = (silent = false) => {
    if (!silent) {
      sound.playClick();
    }
    if (supabase && currentUser && !currentUser.id.startsWith('usr-')) {
      supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', currentUser.id)
        .then(() => {});
    }
    setDb((prev) => {
      const nextNotifications = prev.notifications.map((n) => ({ ...n, read: true }));
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        notifications: nextNotifications
      };
    });
    if (!silent) {
      showToast('All notifications marked as read.');
    }
  };

  const markNotificationRead = (notificationId: string) => {
    setDb((prev) => {
      const nextNotifications = prev.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      savePersistedNotifications(nextNotifications);
      return {
        ...prev,
        notifications: nextNotifications
      };
    });
  };

  const recordBrainifyQuiz = (
    entry: Omit<BrainifyQuizHistory, 'id' | 'date'>,
    xpGained: number
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    setDb((prev) => {
      const nextTopics = prev.brainify.topicsExplored.includes(entry.subTopic)
        ? prev.brainify.topicsExplored
        : [...prev.brainify.topicsExplored, entry.subTopic];
      const nextAch = [...prev.brainify.unlockedAchievements];
      if (
        entry.accuracy === 100 &&
        !nextAch.includes('Perfect Flawless Quiz (100% Accuracy)')
      ) {
        nextAch.push('Perfect Flawless Quiz (100% Accuracy)');
      }
      return {
        ...prev,
        brainify: {
          ...prev.brainify,
          xp: prev.brainify.xp + xpGained,
          questionsAnswered: prev.brainify.questionsAnswered + entry.total,
          correctAnswers: prev.brainify.correctAnswers + entry.score,
          quizzesCompleted: prev.brainify.quizzesCompleted + 1,
          topicsExplored: nextTopics,
          unlockedAchievements: nextAch,
          quizHistory: [
            { ...entry, id: `qh-${Date.now()}`, date: today },
            ...prev.brainify.quizHistory
          ]
        }
      };
    });
  };

  const recordBrainifyInteraction = (
    xpGained: number,
    topic: string,
    achievement?: string
  ) => {
    setDb((prev) => {
      const nextTopics = prev.brainify.topicsExplored.includes(topic)
        ? prev.brainify.topicsExplored
        : [...prev.brainify.topicsExplored, topic];
      const nextAch =
        achievement && !prev.brainify.unlockedAchievements.includes(achievement)
          ? [...prev.brainify.unlockedAchievements, achievement]
          : prev.brainify.unlockedAchievements;

      const topicMap: Record<string, string> = {
        'Circuit Maker': 'circuit-maker',
        'Periodic Table': 'periodic-table',
        ReactiMix: 'reactimix',
        'Physics Lab': 'physics-lab',
        'Chemistry Lab': 'chemistry-lab',
        'Math Lab': 'math-lab',
        'Space Explorer': 'space-explorer',
        'Human Body': 'human-body'
      };
      const actKey = topicMap[topic];
      const prevProg = prev.brainify.activityProgress || {};
      const nextProg = actKey
        ? {
            ...prevProg,
            [actKey]: Math.min(
              100,
              (prevProg[actKey] || 0) + (actKey === 'periodic-table' ? 5 : 15)
            )
          }
        : prevProg;

      return {
        ...prev,
        brainify: {
          ...prev.brainify,
          xp: prev.brainify.xp + xpGained,
          topicsExplored: nextTopics,
          unlockedAchievements: nextAch,
          activityProgress: nextProg
        }
      };
    });
  };

  const updateActivityProgress = (
    activityId: string,
    value: number,
    mode: 'max' | 'add' = 'max'
  ) => {
    setDb((prev) => {
      const prevMap = prev.brainify.activityProgress || {};
      const current = prevMap[activityId] || 0;
      const updated =
        mode === 'add'
          ? Math.min(100, Math.round(current + value))
          : Math.min(100, Math.max(current, Math.round(value)));
      return {
        ...prev,
        brainify: {
          ...prev.brainify,
          activityProgress: {
            ...prevMap,
            [activityId]: updated
          }
        }
      };
    });
  };

  const resetDemoData = () => {
    savePersistedComplaints(INITIAL_DATABASE.complaints);
    savePersistedAttendanceOverrides([]);
    savePersistedNotifications(INITIAL_DATABASE.notifications);
    setDb({
      ...INITIAL_DATABASE,
      verification_requests: []
    });
    sound.playComplete();
    showToast('Activity data reset.');
  };

  return (
    <PlatformContext.Provider
      value={{
        db,
        currentUser,
        surface,
        studentTab,
        teacherTab,
        brainifyTab,
        scienceFairMode,
        soundEnabled,
        toastMessage,
        verificationRequests,
        pendingBySection,
        studentVerificationView,
        studentDebugTrace,
        teacherDebugTrace,
        isRefreshingVerification,
        isRestoringSession,
        supabaseConnected: isSupabaseConfigured,
        supabaseDiagnostic: supabaseConfigDiagnostic,
        clearStudentVerificationView,
        checkStudentVerificationStatus,
        refreshVerificationRequests,
        setSurface,
        setStudentTab,
        setTeacherTab,
        setBrainifyTab,
        setScienceFairMode,
        toggleSound,
        showToast,
        loginWithCredentials,
        registerWithEmail,
        approveStudentAccount,
        rejectStudentAccount,
        quickDemoLogin,
        logout,
        openBrainify,
        exitBrainify,
        saveClassAttendance,
        saveStudentResult,
        createExamOrCT,
        createAssignment,
        submitStudentAssignment,
        createNotice,
        uploadPreviousQuestion,
        submitStudentComplaint,
        updateStudentComplaintStatus,
        deleteStudentComplaint,
        triggerNextClassNotification,
        updateProfile,
        markAllNotificationsRead,
        markNotificationRead,
        markComplaintReplyViewed,
        markComplaintSeenByTeacher,
        markAllComplaintsReadForCurrentUser,
        callTeacherToRoom,
        acknowledgeTeacherCall,
        deleteTeacherCall,
        changeAccountPassword,
        updateChiefAdvisorPermissions,
        assignTeacherToClassSection,
        recordBrainifyQuiz,
        recordBrainifyInteraction,
        updateActivityProgress,
        resetDemoData
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
};
