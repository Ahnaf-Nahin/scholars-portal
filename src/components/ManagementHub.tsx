import React, { useState, useMemo, useEffect } from 'react';
import {
  usePlatform,
  ORDERED_TEACHER_LIST,
  getClassTeacherForSection
} from '../context/PlatformContext';
import { getAuthoritativeStudentName } from '../data/studentCredentials';
import { PortalHeaderBar } from './PortalHeaderBar';
import { Floating3DShapesLayer, Cube3DObject, Square3DObject } from './Animated3DObjectsBanner';
import type { ComplaintStatus, TeacherCallRecord, NoticeCategory, ExamRecord } from '../types/database';
import {
  ShieldCheck,
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  MessageSquareWarning,
  Users,
  History,
  Lock,
  CheckCircle2,
  Clock,
  Send,
  Settings,
  Atom,
  PhoneCall,
  BellRing,
  CalendarClock,
  FilePlus2,
  ClipboardCheck,
  Megaphone,
  UserCheck,
  Menu,
  X,
  Trash2,
  ShieldAlert
} from 'lucide-react';

type HubTab =
  | 'overview'
  | 'call-teacher'
  | 'attendance'
  | 'reports'
  | 'complaints'
  | 'approvals'
  | 'directory'
  | 'routine'
  | 'exams'
  | 'assignments'
  | 'notices'
  | 'audit'
  | 'security';

export const ManagementHub: React.FC = () => {
  const {
    db,
    currentUser,
    setSurface,
    updateStudentComplaintStatus,
    markComplaintSeenByTeacher,
    markAllComplaintsReadForCurrentUser,
    deleteStudentComplaint,
    callTeacherToRoom,
    acknowledgeTeacherCall,
    deleteTeacherCall,
    approveStudentAccount,
    rejectStudentAccount,
    verificationRequests,
    createExamOrCT,
    createAssignment,
    createNotice,
    changeAccountPassword,
    updateChiefAdvisorPermissions,
    assignTeacherToClassSection,
    openBrainify,
    showToast
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-06');
  const [complaintReadTab, setComplaintReadTab] = useState<'unread' | 'read'>('unread');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<string>('ALL');
  const [complaintTeacherFilter, setComplaintTeacherFilter] = useState<string>('ALL');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Call Teacher to Room State
  const defaultOfficeRoom = useMemo(() => {
    if (currentUser?.role === 'chairman') return "Chairman's Chamber (Admin Block, 2nd Floor)";
    if (currentUser?.role === 'chief_advisor') return "Chief Advisor's Office (Room 202, Admin Block)";
    return "Principal's Office (Room 101, Admin Block)";
  }, [currentUser]);

  const [callTeacherCode, setCallTeacherCode] = useState<string>(ORDERED_TEACHER_LIST[0].code);
  const [callRoom, setCallRoom] = useState<string>(defaultOfficeRoom);
  const [callUrgency, setCallUrgency] = useState<TeacherCallRecord['urgency']>('Immediate');
  const [callReason, setCallReason] = useState<string>(
    'Academic performance review and section coordination meeting.'
  );

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Teacher Assignment State
  const [assignTeacherId, setAssignTeacherId] = useState<string>('tch-9');
  const [assignClass, setAssignClass] = useState<string>('Class 6');
  const [assignSection, setAssignSection] = useState<string>('B1');
  const [grantAdditional, setGrantAdditional] = useState<boolean>(true);

  // Quick Notice / Exam / Assignment State (same capabilities as Teacher Portal)
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('Important');

  const [ctName, setCtName] = useState('Special Assessment Test');
  const [ctType, setCtType] = useState<ExamRecord['type']>('Class Test');
  const [ctSubject, setCtSubject] = useState('Physics');
  const [ctClass, setCtClass] = useState('Class 10');
  const [ctDate, setCtDate] = useState('2026-11-10');
  const [ctTime, setCtTime] = useState('09:30 AM – 10:15 AM');
  const [ctSyllabus, setCtSyllabus] = useState('Chapters 1–4');

  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubject, setAsgSubject] = useState('Physics');
  const [asgClass, setAsgClass] = useState('Class 10 — BS1');
  const [asgDue, setAsgDue] = useState('2026-10-28');
  const [asgDesc, setAsgDesc] = useState('');

  const isChairmanOrPrincipal =
    currentUser?.role === 'chairman' || currentUser?.role === 'principal';
  const isChiefAdvisor = currentUser?.role === 'chief_advisor';

  const advisorPerms = db.chief_advisor_permissions || {
    masterAccess: true,
    viewAttendance: true,
    viewReports: true,
    viewAuditLogs: true,
    manageComplaints: true,
    viewAcademicSummaries: true,
    manageDirectory: true
  };

  // Chairman, Chief Advisor, and Principal all have access to all features
  const hasMasterAccess = true;
  const canViewAttendance = true;
  const canViewReports = true;
  const canViewAuditLogs = true;
  const canManageComplaints = true;
  const canManageDirectory = true;

  // Pending student registration approvals across all sections
  const allVerificationRequests = useMemo(() => {
    return db.verification_requests?.length ? db.verification_requests : verificationRequests;
  }, [db.verification_requests, verificationRequests]);

  const pendingApprovalsCount = useMemo(
    () => allVerificationRequests.filter((r) => r.status === 'pending').length,
    [allVerificationRequests]
  );

  // School-wide Attendance Summary per Class & Section (distinct per section)
  const sectionAttendanceBreakdown = useMemo(() => {
    return (db.classes || []).map((cls) => {
      const recordsForDay = (db.attendance || []).filter(
        (a) => a.class_id === cls.id && a.date === selectedDate
      );
      const present = recordsForDay.filter((r) => r.status === 'Present').length;
      const absent = recordsForDay.filter((r) => r.status === 'Absent').length;
      const late = recordsForDay.filter((r) => r.status === 'Late').length;
      const total = recordsForDay.length || cls.studentCount || 35;
      const rate = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

      // Also compute 30-day distinct average for this class
      const allClassAtt = (db.attendance || []).filter(
        (a) => a.class_id === cls.id && a.status !== 'Holiday'
      );
      const p30 = allClassAtt.filter((r) => r.status === 'Present').length;
      const l30 = allClassAtt.filter((r) => r.status === 'Late').length;
      const avg30Rate =
        allClassAtt.length > 0
          ? Math.round(((p30 + l30 * 0.5) / allClassAtt.length) * 100)
          : rate;

      const ctMeta = getClassTeacherForSection(cls.class_name, cls.section);
      const teacherRec = (db.teachers || []).find((t) => t.id === cls.class_teacher_id);

      return {
        ...cls,
        present,
        absent,
        late,
        total,
        rate,
        avg30Rate,
        teacherAttendanceRate: teacherRec?.personalAttendanceRate || 95,
        classTeacherName: ctMeta.defaultName,
        classTeacherSubject: ctMeta.subject,
        classTeacherCode: ctMeta.code
      };
    });
  }, [db.classes, db.attendance, db.teachers, selectedDate]);

  // Distinct Per-Teacher Attendance & Section Summary
  const teacherDirectoryRows = useMemo(() => {
    return ORDERED_TEACHER_LIST.map((meta, idx) => {
      const teacherRec = (db.teachers || []).find(
        (t) =>
          t.employee_id.endsWith(meta.code) ||
          t.classTeacherOf?.toLowerCase() === meta.classTeacherSection.toLowerCase()
      );
      const distinctTeacherAtt =
        teacherRec?.personalAttendanceRate || [98, 95, 92, 96, 94, 97, 91, 99, 93, 96][idx % 10];
      const sectionStats = sectionAttendanceBreakdown.find(
        (s) =>
          `${s.class_name} — ${s.section}`.toLowerCase() ===
          meta.classTeacherSection.toLowerCase()
      );
      const teacherComplaintsCount = (db.complaints || []).filter(
        (c) =>
          c.class_teacher_code === meta.code ||
          c.target_class_section.toLowerCase() === meta.classTeacherSection.toLowerCase()
      ).length;

      return {
        meta,
        teacherRec,
        distinctTeacherAtt,
        sectionClassRate: sectionStats?.avg30Rate ?? 92,
        sectionTodayPresent: sectionStats?.present ?? 32,
        sectionTotal: sectionStats?.total ?? 35,
        teacherComplaintsCount
      };
    });
  }, [db.teachers, db.complaints, sectionAttendanceBreakdown]);

  // Class Academic Performance Summary (No teacher GPA; student academic metrics only)
  const classAcademicSummaries = useMemo(() => {
    return (db.classes || []).map((cls) => {
      const classStudents = (db.students || []).filter(
        (s) =>
          s.class.toLowerCase() === cls.class_name.toLowerCase() &&
          s.section.toUpperCase() === cls.section.toUpperCase()
      );
      const studentIds = new Set(classStudents.map((s) => s.id));
      const classResults = (db.results || []).filter((r) => studentIds.has(r.student_id));

      let totalScorePct = 0;
      let aPlusStudents = 0;

      classStudents.forEach((st) => {
        const stRes = classResults.filter((r) => r.student_id === st.id);
        if (stRes.length > 0) {
          const pct =
            stRes.reduce((acc, r) => acc + (r.marks / r.fullMarks) * 100, 0) / stRes.length;
          totalScorePct += pct;
          if (pct >= 80) aPlusStudents++;
        }
      });

      const avgScorePct =
        classStudents.length > 0 ? Math.round(totalScorePct / classStudents.length) : 84;
      const ctMeta = getClassTeacherForSection(cls.class_name, cls.section);

      return {
        ...cls,
        enrolledCount: classStudents.length,
        avgScorePct,
        aPlusStudents,
        classTeacherName: ctMeta.defaultName,
        classTeacherSubject: ctMeta.subject
      };
    });
  }, [db.classes, db.students, db.results]);

  const isLeadershipComplaintRead = (c: (typeof db.complaints)[number]) =>
    Boolean(
      c.read_by_leadership ||
        c.seen_by_teacher ||
        c.read_by_teacher ||
        c.status === 'Replied' ||
        c.status === 'Resolved'
    );

  // Filtered Complaints for Chairman, Chief Advisor, and Principal (Unread sorted first)
  const baseFilteredComplaints = useMemo(() => {
    const filtered = (db.complaints || []).filter((c) => {
      if (complaintStatusFilter !== 'ALL' && c.status !== complaintStatusFilter) {
        return false;
      }
      if (complaintTeacherFilter !== 'ALL' && c.class_teacher_code !== complaintTeacherFilter) {
        return false;
      }
      return true;
    });
    return [...filtered].sort((a, b) => {
      const aRead = isLeadershipComplaintRead(a);
      const bRead = isLeadershipComplaintRead(b);
      if (aRead !== bRead) return aRead ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [db.complaints, complaintStatusFilter, complaintTeacherFilter]);

  const unreadLeadershipComplaints = useMemo(
    () => baseFilteredComplaints.filter((c) => !isLeadershipComplaintRead(c)),
    [baseFilteredComplaints]
  );

  const readLeadershipComplaints = useMemo(
    () => baseFilteredComplaints.filter((c) => isLeadershipComplaintRead(c)),
    [baseFilteredComplaints]
  );

  const filteredComplaints = useMemo(
    () =>
      complaintReadTab === 'unread'
        ? unreadLeadershipComplaints
        : readLeadershipComplaints,
    [complaintReadTab, unreadLeadershipComplaints, readLeadershipComplaints]
  );

  const activeComplaintsCount = useMemo(
    () => (db.complaints || []).filter((c) => !isLeadershipComplaintRead(c)).length,
    [db.complaints]
  );

  const activeTeacherCallsCount = useMemo(
    () => (db.teacher_calls || []).filter((c) => c.status !== 'Completed').length,
    [db.teacher_calls]
  );

  const handleCallTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    callTeacherToRoom({
      teacherCode: callTeacherCode,
      room: callRoom,
      urgency: callUrgency,
      reason: callReason
    });
    setCallReason('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        text: 'New password and confirmation do not match.'
      });
      return;
    }
    const res = await changeAccountPassword(currentPassword, newPassword);
    setPasswordFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message
    });
    if (res.ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const navItems: { id: HubTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'call-teacher',
      label: 'Call Teacher to Room',
      icon: <PhoneCall className="w-4 h-4" />,
      badge: activeTeacherCallsCount
    },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    {
      id: 'complaints',
      label: 'All Complaints',
      icon: <MessageSquareWarning className="w-4 h-4" />,
      badge: activeComplaintsCount
    },
    {
      id: 'approvals',
      label: 'Student Approvals',
      icon: <UserCheck className="w-4 h-4" />,
      badge: pendingApprovalsCount
    },
    { id: 'reports', label: 'Class Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'directory', label: 'Teachers & Sections', icon: <Users className="w-4 h-4" /> },
    { id: 'routine', label: 'Class Routine', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'exams', label: 'CT & Exams', icon: <FilePlus2 className="w-4 h-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'notices', label: 'Notices', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Settings', icon: <Lock className="w-4 h-4" /> }
  ];

  if (
    !currentUser ||
    (currentUser.role !== 'chairman' &&
      currentUser.role !== 'chief_advisor' &&
      currentUser.role !== 'principal')
  ) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">Access Restricted</h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
            This workspace is reserved for authorized Scholars School &amp; College leadership (Chairman, Chief Advisor, and Principal).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSurface('login')}
          className="px-4 py-2 rounded-xl bg-white text-black font-display font-bold text-xs cursor-pointer hover:bg-neutral-200 transition-all"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070B] text-slate-100 flex flex-col">
      {/* Shared PortalHeaderBar — identical UI to Student & Teacher Portals */}
      <PortalHeaderBar
        portalTitle={`LEADERSHIP PORTAL · ${(currentUser?.position || 'MANAGEMENT HUB').toUpperCase()}`}
        accentMode="crimson"
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar Navigation — identical layout to Student & Teacher Portals */}
        <aside className="hidden md:flex w-64 shrink-0 bg-[#090B11] border-r border-white/10 p-4 flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              {currentUser?.position || 'Leadership'} Workspace
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Sticky Navigation Strip */}
        <div className="md:hidden sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/10">
          <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] text-neutral-300 truncate">
                {currentUser?.position}: <strong className="text-white">{currentUser?.name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              <span>{mobileMenuOpen ? 'Close' : 'All Tools'}</span>
            </button>
          </div>

          <div className="px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-white/[0.04] text-neutral-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main key={activeTab} className="flex-1 p-3 sm:p-5 md:p-8 pb-10 min-w-0 space-y-6 animate-smooth-in">
          {/* Leadership Welcome Banner — matches Student & Teacher Portal header card */}
          <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-white">
                    {currentUser?.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white text-black font-mono text-xs font-extrabold uppercase">
                    {currentUser?.position || 'Leadership'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  SCHOLARS SCHOOL &amp; COLLEGE · 10 Class Sections (Class 6–8 B1/B2 · Class 9–10 BS1/BS2) · 10 Class Teachers
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('call-teacher')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Teacher to Room</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  markAllComplaintsReadForCurrentUser();
                  setActiveTab('complaints');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
              >
                <MessageSquareWarning className="w-3.5 h-3.5" />
                <span>Complaints</span>
                {activeComplaintsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-black font-mono text-[10px] font-bold">
                    {activeComplaintsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 relative z-20">
              {/* Top KPI Cards (5 cards — 6th card removed per user request) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div
                  onClick={() => setActiveTab('directory')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Enrolled Students</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {db.students.length}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">10 Active Sections</div>
                </div>

                <div
                  onClick={() => setActiveTab('directory')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Authorized Teachers</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {ORDERED_TEACHER_LIST.length}
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1">Distinct Attendance</div>
                </div>

                <div
                  onClick={() => setActiveTab('call-teacher')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Call Teacher to Room</div>
                  <div className="font-mono text-2xl font-bold text-amber-400 mt-1 tabular-nums">
                    {activeTeacherCallsCount} Active
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">Send Office Summons</div>
                </div>

                <div
                  onClick={() => {
                    markAllComplaintsReadForCurrentUser();
                    setActiveTab('complaints');
                  }}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">All Complaints</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {db.complaints.length}
                  </div>
                  <div className="text-[11px] text-amber-300 mt-1">
                    {activeComplaintsCount > 0 ? `${activeComplaintsCount} Unread` : 'All Read'}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('approvals')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Student Approvals</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {pendingApprovalsCount}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">Pending Verification</div>
                </div>
              </div>

              {/* Quick Call Teacher to Room Panel + Teacher Attendance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Quick Call Teacher Widget (5 cols) */}
                <form
                  onSubmit={handleCallTeacherSubmit}
                  className="lg:col-span-5 bg-[#0A0A0A] border border-white/20 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-white">
                          Call Specific Teacher to Your Room
                        </h3>
                        <p className="text-[11px] text-neutral-400">
                          Instant notification sent to the selected teacher&apos;s portal
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Select Teacher
                      </label>
                      <select
                        value={callTeacherCode}
                        onChange={(e) => setCallTeacherCode(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white font-semibold"
                      >
                        {ORDERED_TEACHER_LIST.map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.defaultName} — {t.subject} (CT: {t.classTeacherSection})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Meeting Room / Office
                        </label>
                        <input
                          type="text"
                          value={callRoom}
                          onChange={(e) => setCallRoom(e.target.value)}
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Urgency
                        </label>
                        <select
                          value={callUrgency}
                          onChange={(e) =>
                            setCallUrgency(e.target.value as TeacherCallRecord['urgency'])
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="Immediate">Immediate</option>
                          <option value="Within 15 Minutes">Within 15 Minutes</option>
                          <option value="After Current Period">After Current Period</option>
                          <option value="Scheduled">Scheduled</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Reason / Agenda Note
                      </label>
                      <input
                        type="text"
                        required
                        value={callReason}
                        onChange={(e) => setCallReason(e.target.value)}
                        placeholder="e.g. Discuss Class 9/10 section attendance and exam readiness..."
                        className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Send Room Summons to Teacher</span>
                    </button>
                  </div>
                </form>

                {/* All 10 Teachers & Class Sections Live Status Table (7 cols) */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Faculty &amp; Section Attendance Overview (Class 6–8 B1/B2 · Class 9–10 BS1/BS2)
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Individual teacher attendance rates and assigned class section attendance
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('call-teacher')}
                      className="text-xs font-bold text-white underline cursor-pointer"
                    >
                      Call Any Teacher →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-neutral-400 font-mono">
                          <th className="py-2.5 px-3">Teacher Name</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Class Teacher Of</th>
                          <th className="py-2.5 px-3">Teacher Att.</th>
                          <th className="py-2.5 px-3">Class Att.</th>
                          <th className="py-2.5 px-3 text-right">Quick Call</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {teacherDirectoryRows.map((row) => (
                          <tr key={row.meta.code} className="hover:bg-white/[0.03]">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {row.meta.defaultName}
                            </td>
                            <td className="py-2.5 px-3 text-neutral-300">{row.meta.subject}</td>
                            <td className="py-2.5 px-3 font-mono text-white font-semibold">
                              {row.meta.classTeacherSection}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                                {row.distinctTeacherAtt}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-neutral-300">
                              <strong className="text-white">{row.sectionClassRate}%</strong> ({row.sectionTodayPresent}/{row.sectionTotal})
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setCallTeacherCode(row.meta.code);
                                  setActiveTab('call-teacher');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white hover:text-black text-white text-[11px] font-semibold cursor-pointer transition-colors"
                              >
                                Call to Room
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CALL TEACHER TO ROOM TAB */}
          {activeTab === 'call-teacher' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Dispatch Room Call Form */}
                <form
                  onSubmit={handleCallTeacherSubmit}
                  className="lg:col-span-5 bg-[#0A0A0A] border border-white/20 rounded-2xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-white">
                        Call Specific Teacher to Your Room
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Issued by {currentUser?.position} ({currentUser?.name})
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        1. Select Teacher to Summon
                      </label>
                      <select
                        value={callTeacherCode}
                        onChange={(e) => setCallTeacherCode(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white font-semibold"
                      >
                        {ORDERED_TEACHER_LIST.map((t) => (
                          <option key={t.code} value={t.code}>
                            {t.defaultName} — {t.subject} Teacher ({t.classTeacherSection})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        2. Destination Room / Office
                      </label>
                      <input
                        type="text"
                        required
                        value={callRoom}
                        onChange={(e) => setCallRoom(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        3. Urgency Level
                      </label>
                      <select
                        value={callUrgency}
                        onChange={(e) =>
                          setCallUrgency(e.target.value as TeacherCallRecord['urgency'])
                        }
                        className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white"
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="Within 15 Minutes">Within 15 Minutes</option>
                        <option value="After Current Period">After Current Period</option>
                        <option value="Scheduled">Scheduled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        4. Purpose / Message for Teacher
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={callReason}
                        onChange={(e) => setCallReason(e.target.value)}
                        placeholder="Enter reason for summoning the teacher to your room..."
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Call Selected Teacher to Room</span>
                    </button>
                  </div>
                </form>

                {/* Right: Quick Teacher Cards + Active Summons Log */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
                    <h3 className="font-display text-base font-bold text-white">
                      Quick 1-Click Teacher Room Summons
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teacherDirectoryRows.map((row) => (
                        <div
                          key={row.meta.code}
                          className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-display text-sm font-bold text-white truncate">
                              {row.meta.defaultName}
                            </div>
                            <div className="text-[11px] font-mono text-neutral-400">
                              {row.meta.subject} · CT: <strong className="text-white">{row.meta.classTeacherSection}</strong>
                            </div>
                            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                              Faculty Att: {row.distinctTeacherAtt}%
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              callTeacherToRoom({
                                teacherCode: row.meta.code,
                                room: callRoom,
                                urgency: 'Immediate',
                                reason: `Requested by ${currentUser?.position} (${currentUser?.name}) for immediate consultation.`
                              })
                            }
                            className="px-3 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shrink-0 cursor-pointer active:scale-95"
                          >
                            Call Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active & Past Teacher Room Calls History */}
                  <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-white">
                        Room Call Dispatch Log ({(db.teacher_calls || []).length})
                      </h3>
                    </div>

                    {(db.teacher_calls || []).length === 0 ? (
                      <p className="text-xs text-neutral-400 font-mono">
                        No teacher calls dispatched yet. Select any teacher above to call them to your room.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {(db.teacher_calls || []).map((call) => (
                          <div
                            key={call.id}
                            className="p-3.5 rounded-xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-sm font-bold text-white">
                                  {call.teacher_name}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                                  {call.teacher_subject} · {call.teacher_class_section}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                                    call.status === 'Called'
                                      ? 'bg-amber-500 text-black'
                                      : call.status === 'Acknowledged'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}
                                >
                                  {call.status}
                                </span>
                              </div>
                              <div className="text-xs text-neutral-300">
                                Room: <strong className="text-white">{call.room}</strong> · Urgency:{' '}
                                <strong className="text-amber-300">{call.urgency}</strong> · Called by{' '}
                                {call.called_by_position} ({call.called_by_name})
                              </div>
                              <div className="text-xs text-neutral-400">
                                Note: &ldquo;{call.reason}&rdquo;
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {call.status !== 'Completed' && (
                                <button
                                  type="button"
                                  onClick={() => acknowledgeTeacherCall(call.id, 'Completed')}
                                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0 cursor-pointer"
                                >
                                  Mark Completed
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteTeacherCall(call.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                title="Delete Call Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. ATTENDANCE ACROSS ALL CLASSES & TEACHERS */}
          {activeTab === 'attendance' && canViewAttendance && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    School-Wide Class &amp; Teacher Attendance Monitor
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Class 6–8 (Sections B1 &amp; B2) and Class 9–10 (Sections BS1 &amp; BS2) with distinct class and faculty attendance
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ALL">All 10 Class Sections</option>
                    {db.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.class_name} — {c.section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionAttendanceBreakdown
                  .filter((c) => selectedClassFilter === 'ALL' || c.id === selectedClassFilter)
                  .map((sec) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-2xl bg-black border border-white/15 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-base font-bold text-white font-display">
                            {sec.class_name} — {sec.section}
                          </span>
                          <p className="text-xs text-neutral-400">{sec.room}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Class: {sec.rate}%
                        </span>
                      </div>

                      <div className="text-xs text-neutral-300 space-y-1 font-mono">
                        <div>
                          Class Teacher: <strong className="text-white">{sec.classTeacherName}</strong> ({sec.classTeacherSubject})
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-neutral-400">Teacher Personal Attendance:</span>
                          <span className="text-emerald-400 font-bold">{sec.teacherAttendanceRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400">30-Day Section Average:</span>
                          <span className="text-cyan-300 font-bold">{sec.avg30Rate}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-sm font-bold text-emerald-300 font-mono">{sec.present}</div>
                          <div className="text-[10px] text-neutral-400">Present</div>
                        </div>
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          <div className="text-sm font-bold text-rose-300 font-mono">{sec.absent}</div>
                          <div className="text-[10px] text-neutral-400">Absent</div>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="text-sm font-bold text-amber-300 font-mono">{sec.late}</div>
                          <div className="text-[10px] text-neutral-400">Late</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 4. ALL COMPLAINTS MANAGEMENT (Chairman, Chief Advisor & Principal Only) */}
          {activeTab === 'complaints' && canManageComplaints && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white font-display">
                    Master Student &amp; Teacher Complaints Box
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Unread complaints are shown first. Click any unread complaint to automatically mark it as read and transfer it to Read.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Two Options: Unread (First) and Read */}
                  <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black border border-white/20">
                    <button
                      type="button"
                      onClick={() => setComplaintReadTab('unread')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                        complaintReadTab === 'unread'
                          ? 'bg-white text-black'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span>Unread</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          complaintReadTab === 'unread'
                            ? 'bg-black text-white'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {unreadLeadershipComplaints.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplaintReadTab('read')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                        complaintReadTab === 'read'
                          ? 'bg-white text-black'
                          : 'text-neutral-300 hover:text-white'
                      }`}
                    >
                      <span>Read</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          complaintReadTab === 'read'
                            ? 'bg-black text-white'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {readLeadershipComplaints.length}
                      </span>
                    </button>
                  </div>

                  <select
                    value={complaintTeacherFilter}
                    onChange={(e) => setComplaintTeacherFilter(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ALL">All Recipient Class Teachers</option>
                    {ORDERED_TEACHER_LIST.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.defaultName} ({t.classTeacherSection})
                      </option>
                    ))}
                  </select>
                  <select
                    value={complaintStatusFilter}
                    onChange={(e) => setComplaintStatusFilter(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="ALL">All Statuses ({db.complaints.length})</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Replied">Replied</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {filteredComplaints.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-black border border-white/10 space-y-2">
                  <div className="font-display text-sm font-bold text-white">
                    {complaintReadTab === 'unread'
                      ? 'No Unread Complaints'
                      : 'No Read Complaints Yet'}
                  </div>
                  <p className="text-xs text-neutral-400">
                    {complaintReadTab === 'unread'
                      ? readLeadershipComplaints.length > 0
                        ? 'All complaints have been read and transferred to the Read tab.'
                        : 'No complaints match the current filter.'
                      : 'Click on any unread complaint to mark it as read and transfer it here.'}
                  </p>
                  {complaintReadTab === 'unread' && readLeadershipComplaints.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setComplaintReadTab('read')}
                      className="mt-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white cursor-pointer"
                    >
                      View Read Complaints ({readLeadershipComplaints.length}) →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredComplaints.map((cmp) => {
                    const draft = replyDrafts[cmp.id] ?? cmp.class_teacher_note ?? '';
                    const isRead = isLeadershipComplaintRead(cmp);
                    return (
                      <div
                        key={cmp.id}
                        onClick={() => {
                          if (!isRead) {
                            markComplaintSeenByTeacher(cmp.id);
                            showToast('Complaint marked as read and transferred to Read.');
                          }
                        }}
                        className={`p-4 rounded-2xl bg-black border transition-all space-y-3 ${
                          !isRead
                            ? 'border-white/35 hover:border-white cursor-pointer'
                            : 'border-white/15'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                  !isRead
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {!isRead ? '● Unread' : '✓ Read'}
                              </span>
                              <span className="text-sm font-bold text-white">{cmp.subject_title}</span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-white/10 text-white">
                                {cmp.target_class_section}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {cmp.status}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1 font-mono">
                              Student: <strong className="text-white">{cmp.student_name}</strong> ({cmp.student_code}) · Sent Exclusively To:{' '}
                              <strong className="text-white">{cmp.class_teacher_name}</strong> · From: {cmp.from_teacher_name}
                            </p>
                          </div>
                          {!isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markComplaintSeenByTeacher(cmp.id);
                                showToast('Complaint marked as read and transferred to Read.');
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold cursor-pointer"
                            >
                              Mark Read →
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-neutral-200 bg-[#0A0A0A] p-3 rounded-xl border border-white/10">
                          {cmp.complaint_text}
                        </p>

                        {cmp.class_teacher_note && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                            <span className="font-semibold">Official Response: </span>
                            {cmp.class_teacher_note}
                          </div>
                        )}

                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col sm:flex-row gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={draft}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({ ...prev, [cmp.id]: e.target.value }))
                            }
                            placeholder="Write an official response or resolution note..."
                            className="flex-1 bg-[#0A0A0A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <div className="flex flex-wrap gap-2">
                            {(['Under Review', 'Replied', 'Resolved'] as ComplaintStatus[]).map(
                              (st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    updateStudentComplaintStatus(cmp.id, st, draft);
                                    markComplaintSeenByTeacher(cmp.id);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                                    st === 'Resolved'
                                      ? 'bg-white text-black font-bold'
                                      : 'bg-white/10 hover:bg-white/20 text-white'
                                  }`}
                                >
                                  {st === 'Replied' ? 'Send Reply' : `Mark ${st}`}
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => deleteStudentComplaint(cmp.id)}
                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-all"
                              title="Delete Complaint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Complaint</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. STUDENT APPROVALS TAB */}
          {activeTab === 'approvals' && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Student Registration Approvals Across All Sections
                </h2>
                <p className="text-xs text-neutral-400">
                  Review and approve or decline student registrations for Class 6–8 (B1/B2) and Class 9–10 (BS1/BS2)
                </p>
              </div>

              {allVerificationRequests.length === 0 ? (
                <p className="text-xs text-neutral-400 font-mono">
                  No pending student registration requests at this moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {allVerificationRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-white">
                          {req.student_name} ({req.student_code})
                        </div>
                        <div className="text-xs font-mono text-neutral-400">
                          {req.class_name} — {req.section} · Email: {req.student_email} · Status:{' '}
                          <strong className="text-white uppercase">{req.status}</strong>
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => approveStudentAccount(req.student_id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-bold text-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectStudentAccount(req.student_id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-xs cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. CLASS REPORTS TAB (No teacher GPA; shows class score & attendance) */}
          {activeTab === 'reports' && canViewReports && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Class Reports &amp; Student Performance Summary
                </h2>
                <p className="text-xs text-neutral-400">
                  Academic score averages and A+ counts across Class 6–8 (B1/B2) and Class 9–10 (BS1/BS2)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 font-mono">
                      <th className="py-3 px-4">Class &amp; Section</th>
                      <th className="py-3 px-4">Assigned Class Teacher</th>
                      <th className="py-3 px-4">Students</th>
                      <th className="py-3 px-4">Average Marks (%)</th>
                      <th className="py-3 px-4">Top Score (80%+)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {classAcademicSummaries.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.03]">
                        <td className="py-3 px-4 font-bold text-white">
                          {item.class_name} — {item.section}
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          {item.classTeacherName} ({item.classTeacherSubject})
                        </td>
                        <td className="py-3 px-4 font-mono text-white">{item.enrolledCount}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {item.avgScorePct}%
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-300">
                          {item.aPlusStudents} Students
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. TEACHERS & SECTIONS DIRECTORY TAB */}
          {activeTab === 'directory' && canManageDirectory && (
            <div className="space-y-6">
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
                <h2 className="text-lg font-bold text-white font-display">
                  Assign or Grant Additional Class Section Permissions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    {db.teachers.map((t) => {
                      const u = db.users.find((usr) => usr.id === t.user_id);
                      return (
                        <option key={t.id} value={t.id}>
                          {u?.name || t.id} ({t.authorizedSubjects.join(', ')})
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={assignClass}
                    onChange={(e) => {
                      const nextCls = e.target.value;
                      setAssignClass(nextCls);
                      const isJunior =
                        nextCls === 'Class 6' || nextCls === 'Class 7' || nextCls === 'Class 8';
                      setAssignSection(isJunior ? 'B1' : 'BS1');
                    }}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                  <select
                    value={assignSection}
                    onChange={(e) => setAssignSection(e.target.value)}
                    className="bg-black border border-white/20 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    {assignClass === 'Class 6' ||
                    assignClass === 'Class 7' ||
                    assignClass === 'Class 8' ? (
                      <>
                        <option value="B1">Section B1</option>
                        <option value="B2">Section B2</option>
                      </>
                    ) : (
                      <>
                        <option value="BS1">Section BS1</option>
                        <option value="BS2">Section BS2</option>
                      </>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      assignTeacherToClassSection(
                        assignTeacherId,
                        assignClass,
                        assignSection,
                        grantAdditional
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer"
                  >
                    Save Assignment
                  </button>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5">
                <h3 className="text-base font-bold text-white mb-4">
                  Authorized Teachers Directory (Distinct Attendance &amp; Class Assignments)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teacherDirectoryRows.map((row) => (
                    <div
                      key={row.meta.code}
                      className="p-4 rounded-xl bg-black border border-white/15 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{row.meta.defaultName}</div>
                        <div className="text-xs text-neutral-400">
                          Subject: <strong className="text-white">{row.meta.subject}</strong> · Class Teacher:{' '}
                          <strong className="text-emerald-300">{row.meta.classTeacherSection}</strong>
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-1">
                          Personal Attendance: <strong className="text-emerald-400">{row.distinctTeacherAtt}%</strong> · Section Avg: <strong className="text-white">{row.sectionClassRate}%</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCallTeacherCode(row.meta.code);
                          setActiveTab('call-teacher');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white hover:text-black text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Call to Room
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. ROUTINE TAB (Same as Teacher Portal) */}
          {activeTab === 'routine' && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white font-display">
                Master School Class Routine
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 font-mono text-neutral-400">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Period &amp; Time</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Teacher</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {db.routines.slice(0, 18).map((r) => (
                      <tr key={r.id} className="hover:bg-white/[0.03]">
                        <td className="py-2.5 px-4 font-semibold text-white">{r.day}</td>
                        <td className="py-2.5 px-4 font-mono text-neutral-300">
                          Period {r.period} ({r.timeRange})
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">{r.subject}</td>
                        <td className="py-2.5 px-4 text-neutral-300">{r.teacher}</td>
                        <td className="py-2.5 px-4 font-mono text-white">{r.class}</td>
                        <td className="py-2.5 px-4 text-neutral-400">{r.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. CT & EXAMS TAB (Same as Teacher Portal) */}
          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createExamOrCT({
                    name: ctName,
                    type: ctType,
                    subject: ctSubject,
                    class: ctClass,
                    date: ctDate,
                    time: ctTime,
                    syllabus: ctSyllabus,
                    room: 'Academic Block'
                  });
                }}
                className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3.5 text-xs"
              >
                <h3 className="font-display text-base font-bold text-white">
                  Schedule New CT or Examination
                </h3>
                <div>
                  <label className="block text-neutral-300 mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={ctName}
                    onChange={(e) => setCtName(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={ctSubject}
                      onChange={(e) => setCtSubject(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Class</label>
                    <select
                      value={ctClass}
                      onChange={(e) => setCtClass(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Class 6">Class 6</option>
                      <option value="Class 7">Class 7</option>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={ctDate}
                      onChange={(e) => setCtDate(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Syllabus</label>
                    <input
                      type="text"
                      value={ctSyllabus}
                      onChange={(e) => setCtSyllabus(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold cursor-pointer"
                >
                  Publish Exam Schedule
                </button>
              </form>

              <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-white">
                  Scheduled Examinations ({db.exams.length})
                </h3>
                <div className="space-y-2.5">
                  {db.exams.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-white">{ex.name}</div>
                        <div className="text-xs font-mono text-neutral-400">
                          {ex.subject} · {ex.class} · Syllabus: {ex.syllabus}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono text-xs text-white">
                        {ex.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 10. ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!asgTitle.trim()) return;
                  createAssignment({
                    teacher: `${currentUser?.name} (${currentUser?.position})`,
                    teacher_id: currentUser?.id || 'leadership',
                    class: asgClass,
                    subject: asgSubject,
                    title: asgTitle,
                    description: asgDesc || 'Complete the assigned analytical exercises.',
                    due_date: asgDue
                  });
                  setAsgTitle('');
                  setAsgDesc('');
                }}
                className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3.5 text-xs"
              >
                <h3 className="font-display text-base font-bold text-white">
                  Post Class Assignment
                </h3>
                <div>
                  <label className="block text-neutral-300 mb-1">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={asgTitle}
                    onChange={(e) => setAsgTitle(e.target.value)}
                    placeholder="e.g. Chapter Review Problem Set"
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 mb-1">Target Class Section</label>
                    <select
                      value={asgClass}
                      onChange={(e) => setAsgClass(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    >
                      {db.classes.map((c) => (
                        <option key={c.id} value={`${c.class_name} — ${c.section}`}>
                          {c.class_name} — {c.section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={asgDue}
                      onChange={(e) => setAsgDue(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Instructions</label>
                  <textarea
                    rows={3}
                    value={asgDesc}
                    onChange={(e) => setAsgDesc(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold cursor-pointer"
                >
                  Publish Assignment
                </button>
              </form>

              <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-white">
                  Active Assignments ({db.assignments.length})
                </h3>
                <div className="space-y-2.5">
                  {db.assignments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-display text-sm font-bold text-white">{a.title}</div>
                        <div className="text-xs font-mono text-neutral-400">
                          {a.subject} · {a.class} · By {a.teacher}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white/10 font-mono text-xs text-white">
                        Due {a.due_date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 11. NOTICES TAB */}
          {activeTab === 'notices' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noticeTitle.trim() || !noticeContent.trim()) return;
                  createNotice({
                    title: noticeTitle,
                    content: noticeContent,
                    category: noticeCategory,
                    target: 'all',
                    created_by: `${currentUser?.name} (${currentUser?.position})`,
                    important: true
                  });
                  setNoticeTitle('');
                  setNoticeContent('');
                }}
                className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3.5 text-xs"
              >
                <h3 className="font-display text-base font-bold text-white">
                  Broadcast Official Notice
                </h3>
                <div>
                  <label className="block text-neutral-300 mb-1">Notice Headline</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Official announcement title..."
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Category</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Important">Important</option>
                    <option value="Academic">Academic</option>
                    <option value="Exam">Exam</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Notice Details</label>
                  <textarea
                    rows={4}
                    required
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="Write official notice content..."
                    className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold cursor-pointer"
                >
                  Publish Official Notice
                </button>
              </form>

              <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-white">
                  Published Notices ({db.notices.length})
                </h3>
                <div className="space-y-2.5">
                  {db.notices.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-black border border-white/15 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-bold text-white">{n.title}</span>
                        <span className="text-[11px] font-mono text-neutral-400">{n.date}</span>
                      </div>
                      <p className="text-xs text-neutral-300">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 12. AUDIT LOGS */}
          {activeTab === 'audit' && canViewAuditLogs && (
            <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-bold text-white font-display">
                Teacher Activity, Room Summons &amp; Login Audit Logs
              </h2>
              <div className="space-y-2.5">
                {(db.audit_logs || []).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{log.action}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-white/10 text-neutral-300">
                          {log.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{log.details}</p>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 13. SECURITY & PASSWORD SETTINGS */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white font-display mb-1">
                  Change Leadership Account Password
                </h2>
                <p className="text-xs text-neutral-400 mb-5">
                  Update your password from your initial 6-digit access code to a custom password.
                </p>

                {passwordFeedback && (
                  <div
                    className={`mb-4 p-3 rounded-xl text-xs font-medium border ${
                      passwordFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {passwordFeedback.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      New Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer"
                  >
                    Update Password Securely
                  </button>
                </form>
              </div>

              {isChairmanOrPrincipal && (
                <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-white" />
                    <h2 className="text-lg font-bold text-white font-display">
                      Chief Advisor Access Controls (Md Abul Kasem)
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {(
                      [
                        { key: 'masterAccess', label: 'Grant Full Master Access' },
                        { key: 'viewAttendance', label: 'View School-Wide Attendance' },
                        { key: 'viewReports', label: 'View Class Reports & Performance' },
                        { key: 'viewAuditLogs', label: 'View Teacher Activity & Login Audit Logs' },
                        { key: 'manageComplaints', label: 'View & Manage All Complaints' },
                        { key: 'manageDirectory', label: 'Manage Teachers, Students & Sections' }
                      ] as const
                    ).map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between p-3 rounded-xl bg-black border border-white/15 cursor-pointer"
                      >
                        <span className="text-xs font-medium text-neutral-200">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(advisorPerms[item.key])}
                          onChange={(e) =>
                            updateChiefAdvisorPermissions({
                              ...advisorPerms,
                              [item.key]: e.target.checked
                            })
                          }
                          className="w-4 h-4 accent-white"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
