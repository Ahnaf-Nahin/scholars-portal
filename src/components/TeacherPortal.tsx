import React, { useState, useMemo, useEffect } from 'react';
import {
  usePlatform,
  TeacherTab,
  calculateGradeAndGpa,
  getClassTeacherForSection,
  ORDERED_TEACHER_LIST,
  TEACHER_CODES
} from '../context/PlatformContext';
import {
  getAuthoritativeStudentName,
  EXPLICIT_LOGIN_STUDENT_DIRECTORY
} from '../data/studentCredentials';
import { PortalHeaderBar } from './PortalHeaderBar';
import { TeacherAnalyticsCharts } from './TeacherAnalyticsCharts';
import { Floating3DShapesLayer, Cube3DObject, Square3DObject } from './Animated3DObjectsBanner';
import { PAST_30_DATES } from '../data/seedDatabase';
import {
  AttendanceStatus,
  ExamRecord,
  NoticeCategory,
  ComplaintCategory,
  ComplaintSeverity,
  TeacherCallRecord
} from '../types/database';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarClock,
  BellRing,
  Award,
  FilePlus2,
  ClipboardCheck,
  Megaphone,
  FileUp,
  BarChart3,
  User,
  Settings,
  CheckCircle2,
  AlertTriangle,
  MessageSquareWarning,
  Send,
  Inbox,
  Menu,
  X,
  Trash2,
  PhoneCall
} from 'lucide-react';

export const TeacherPortal: React.FC = () => {
  const {
    db,
    currentUser,
    teacherTab,
    setTeacherTab,
    saveClassAttendance,
    saveStudentResult,
    createExamOrCT,
    createAssignment,
    createNotice,
    uploadPreviousQuestion,
    submitStudentComplaint,
    updateStudentComplaintStatus,
    markComplaintReplyViewed,
    markComplaintSeenByTeacher,
    markAllComplaintsReadForCurrentUser,
    deleteStudentComplaint,
    callTeacherToRoom,
    acknowledgeTeacherCall,
    deleteTeacherCall,
    approveStudentAccount,
    rejectStudentAccount,
    verificationRequests,
    changeAccountPassword,
    triggerNextClassNotification,
    updateProfile,
    resetDemoData,
    showToast
  } = usePlatform();

  const activeTeacherCode = useMemo(() => {
    return (
      currentUser?.teacherCode ||
      currentUser?.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887'
    );
  }, [currentUser]);

  const teacherRec = useMemo(() => {
    const meta = TEACHER_CODES[activeTeacherCode];
    return (
      db.teachers.find(
        (t) =>
          t.user_id === currentUser?.id ||
          t.employee_id.endsWith(activeTeacherCode) ||
          (meta && t.classTeacherOf?.toLowerCase() === meta.classTeacherSection.toLowerCase())
      ) || db.teachers[0]
    );
  }, [db.teachers, currentUser, activeTeacherCode]);

  // Active Office Summons / Room Calls for this specific teacher from Chairman, Chief Advisor, or Principal
  const myActiveRoomCalls = useMemo(() => {
    return (db.teacher_calls || []).filter(
      (c) => c.teacher_code === activeTeacherCode && c.status !== 'Completed'
    );
  }, [db.teacher_calls, activeTeacherCode]);

  // Helper to check if a complaint has been read by the Class Teacher
  const isTeacherComplaintRead = (c: (typeof db.complaints)[number]) =>
    Boolean(
      c.read_by_teacher ||
        c.seen_by_teacher ||
        c.status === 'Replied' ||
        c.status === 'Resolved'
    );

  // Class Teacher Complaint Box Filtering:
  // ONLY this specific teacher can see complaints sent to them. Unread complaints are sorted first, and read complaints are transferred to Read.
  const myClassComplaints = useMemo(() => {
    const mySection = (teacherRec.classTeacherOf || 'Class 10 — BS1').toLowerCase();
    const matched = (db.complaints || []).filter(
      (c) =>
        c.class_teacher_code === activeTeacherCode ||
        c.target_class_section.toLowerCase() === mySection
    );
    return [...matched].sort((a, b) => {
      const aRead = Boolean(
        a.read_by_teacher ||
          a.seen_by_teacher ||
          a.status === 'Replied' ||
          a.status === 'Resolved'
      );
      const bRead = Boolean(
        b.read_by_teacher ||
          b.seen_by_teacher ||
          b.status === 'Replied' ||
          b.status === 'Resolved'
      );
      if (aRead !== bRead) return aRead ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [db.complaints, teacherRec.classTeacherOf, activeTeacherCode]);

  const unreadMyClassComplaints = useMemo(
    () => myClassComplaints.filter((c) => !isTeacherComplaintRead(c)),
    [myClassComplaints]
  );

  const readMyClassComplaints = useMemo(
    () => myClassComplaints.filter((c) => isTeacherComplaintRead(c)),
    [myClassComplaints]
  );

  const newMyClassComplaintsCount = unreadMyClassComplaints.length;

  const sentByMeComplaints = useMemo(
    () => (db.complaints || []).filter((c) => c.from_teacher_code === activeTeacherCode),
    [db.complaints, activeTeacherCode]
  );

  // Student Registration Requests scoped ONLY to this teacher's assigned class and section
  const myAssignedSectionRequests = useMemo(() => {
    const allReqs = db.verification_requests?.length
      ? db.verification_requests
      : verificationRequests;
    const mySectionLabel = (teacherRec.classTeacherOf || 'Class 9 — BS1').toLowerCase();
    return allReqs.filter((r) => {
      const reqLabel = `${r.class_name.trim()} — ${r.section.trim().toUpperCase()}`.toLowerCase();
      return reqLabel === mySectionLabel || r.class_teacher_code === activeTeacherCode;
    });
  }, [db.verification_requests, verificationRequests, teacherRec.classTeacherOf, activeTeacherCode]);

  const pendingSectionApprovalsCount = useMemo(
    () => myAssignedSectionRequests.filter((r) => r.status === 'pending').length,
    [myAssignedSectionRequests]
  );

  // Organize Class Teacher Complaint Box messages by Student (filtered by active dashboard read/unread toggle, with Unread shown first)
  const [dashboardComplaintReadTab, setDashboardComplaintReadTab] = useState<'unread' | 'read'>('unread');

  const myClassComplaintsByStudent = useMemo(() => {
    const sourceList =
      dashboardComplaintReadTab === 'unread'
        ? unreadMyClassComplaints
        : readMyClassComplaints;

    const map = new Map<
      string,
      {
        studentId: string;
        studentCode: string;
        studentName: string;
        studentRoll: number;
        classSection: string;
        newCount: number;
        messages: typeof myClassComplaints;
      }
    >();

    sourceList.forEach((cmp) => {
      const key = cmp.student_code || cmp.student_id;
      const existing = map.get(key);
      const isUnread = !isTeacherComplaintRead(cmp);
      if (existing) {
        existing.messages.push(cmp);
        if (isUnread) existing.newCount += 1;
      } else {
        map.set(key, {
          studentId: cmp.student_id,
          studentCode: cmp.student_code,
          studentName: cmp.student_name,
          studentRoll: cmp.student_roll,
          classSection: cmp.target_class_section,
          newCount: isUnread ? 1 : 0,
          messages: [cmp]
        });
      }
    });

    return Array.from(map.values());
  }, [unreadMyClassComplaints, readMyClassComplaints, dashboardComplaintReadTab]);

  // Attendance Management State
  const defaultTeacherClassId = useMemo(() => {
    const label = (teacherRec.classTeacherOf || 'Class 9 — BS1').toLowerCase();
    const matched = db.classes.find(
      (c) => `${c.class_name} — ${c.section}`.toLowerCase() === label
    );
    return matched ? matched.id : 'cls-9-bs1';
  }, [db.classes, teacherRec.classTeacherOf]);

  const [selectedClassId, setSelectedClassId] = useState<string>(defaultTeacherClassId);

  useEffect(() => {
    setSelectedClassId(defaultTeacherClassId);
  }, [defaultTeacherClassId]);

  const selectedClassObj = useMemo(
    () => db.classes.find((c) => c.id === selectedClassId) || db.classes[0],
    [db.classes, selectedClassId]
  );

  const selectedClassStudents = useMemo(() => {
    if (!selectedClassObj) return db.students.slice(0, 35);
    return db.students
      .filter(
        (st) =>
          st.class.toLowerCase() === selectedClassObj.class_name.toLowerCase() &&
          st.section.toLowerCase() === selectedClassObj.section.toLowerCase()
      )
      .sort((a, b) => a.roll - b.roll);
  }, [db.students, selectedClassObj]);

  const [attendanceDate, setAttendanceDate] = useState<string>('2026-10-06');
  const [attendanceSearch, setAttendanceSearch] = useState<string>('');
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    db.students.forEach((st) => {
      const existing = db.attendance.find(
        (a) => a.student_id === st.id && a.date === '2026-10-06'
      );
      map[st.id] = existing ? existing.status : 'Present';
    });
    return map;
  });
  const [attendanceSavedBanner, setAttendanceSavedBanner] = useState<string | null>(null);

  // Sync statusMap whenever attendanceDate or selectedClassId changes so any of the 30 stored days loads accurately
  useEffect(() => {
    setStatusMap((prev) => {
      const next = { ...prev };
      selectedClassStudents.forEach((st) => {
        const existing = db.attendance.find(
          (a) =>
            a.student_id === st.id &&
            a.class_id === selectedClassId &&
            a.date === attendanceDate
        );
        next[st.id] = existing ? existing.status : 'Present';
      });
      return next;
    });
  }, [attendanceDate, selectedClassId, selectedClassStudents, db.attendance]);

  // Compute 30-day stored dates summary for the selected class
  const class30DayArchive = useMemo(() => {
    const classAtt = db.attendance.filter((a) => a.class_id === selectedClassId);
    const distinctDates = Array.from(
      new Set([...PAST_30_DATES, ...classAtt.map((a) => a.date)])
    )
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 30);

    return distinctDates.map((d) => {
      const dayRecs = classAtt.filter((a) => a.date === d);
      const isHoliday = dayRecs.length > 0 && dayRecs.every((r) => r.status === 'Holiday');
      const present = dayRecs.filter((r) => r.status === 'Present').length;
      const absent = dayRecs.filter((r) => r.status === 'Absent').length;
      const late = dayRecs.filter((r) => r.status === 'Late').length;
      return {
        date: d,
        isHoliday,
        present,
        absent,
        late
      };
    });
  }, [db.attendance, selectedClassId]);

  // Per-student 30-day attendance rate for the selected class
  const student30DayStatsMap = useMemo(() => {
    const map: Record<string, { present: number; absent: number; late: number; total: number; pct: number }> = {};
    const classAtt = db.attendance.filter((a) => a.class_id === selectedClassId);
    selectedClassStudents.forEach((st) => {
      const recs = classAtt.filter((a) => a.student_id === st.id && a.status !== 'Holiday');
      const present = recs.filter((r) => r.status === 'Present').length;
      const absent = recs.filter((r) => r.status === 'Absent').length;
      const late = recs.filter((r) => r.status === 'Late').length;
      const total = recs.length || 1;
      const pct = Math.round(((present + late * 0.5) / total) * 100);
      map[st.id] = { present, absent, late, total: recs.length, pct };
    });
    return map;
  }, [db.attendance, selectedClassId, selectedClassStudents]);

  const filteredAttendanceStudents = useMemo(() => {
    const q = attendanceSearch.trim().toLowerCase();
    if (!q) return selectedClassStudents;
    return selectedClassStudents.filter((st) => {
      const usr = db.users.find((u) => u.id === st.user_id);
      const authoritativeName = getAuthoritativeStudentName(st, usr);
      return (
        authoritativeName.toLowerCase().includes(q) ||
        st.student_id.toLowerCase().includes(q) ||
        String(st.roll).padStart(2, '0').includes(q)
      );
    });
  }, [selectedClassStudents, attendanceSearch, db.users]);

  // Per-student overall CGPA map across all 8 subjects
  const studentOverallGpaMap = useMemo(() => {
    const map: Record<string, { gpa: string; grade: string; avgPct: number }> = {};
    db.students.forEach((st) => {
      const stRes = db.results.filter((r) => r.student_id === st.id);
      if (stRes.length === 0) {
        map[st.id] = { gpa: '0.00', grade: 'F', avgPct: 0 };
        return;
      }
      const sumGpa = stRes.reduce((acc, r) => {
        const calc = calculateGradeAndGpa(r.marks, r.fullMarks);
        return acc + calc.gpa;
      }, 0);
      const totalMarks = stRes.reduce((acc, r) => acc + r.marks, 0);
      const totalFull = stRes.reduce((acc, r) => acc + r.fullMarks, 0) || 1;
      const avgGpa = sumGpa / stRes.length;
      const gradeLetter =
        avgGpa >= 5.0
          ? 'A+'
          : avgGpa >= 4.0
          ? 'A'
          : avgGpa >= 3.5
          ? 'A-'
          : avgGpa >= 3.0
          ? 'B'
          : avgGpa >= 2.0
          ? 'C'
          : avgGpa >= 1.0
          ? 'D'
          : 'F';
      map[st.id] = {
        gpa: avgGpa.toFixed(2),
        grade: gradeLetter,
        avgPct: Math.round((totalMarks / totalFull) * 100)
      };
    });
    return map;
  }, [db.students, db.results]);

  const selectedClassAttendanceStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    selectedClassStudents.forEach((st) => {
      const s = statusMap[st.id] || 'Present';
      if (s === 'Present') present++;
      else if (s === 'Absent') absent++;
      else if (s === 'Late') late++;
    });
    return {
      total: selectedClassStudents.length,
      present,
      absent,
      late
    };
  }, [selectedClassStudents, statusMap]);

  // Next Class Reminder State
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(42);

  const primarySubjectName = teacherRec.authorizedSubjects[0] || 'Physics';
  const primarySubjectObj =
    db.subjects.find((s) => s.name === primarySubjectName) || db.subjects[0];

  // Results Management State
  const [resSubjectId, setResSubjectId] = useState<string>(primarySubjectObj.id);
  const resSubjectObj = useMemo(
    () => db.subjects.find((s) => s.id === resSubjectId) || primarySubjectObj,
    [db.subjects, resSubjectId, primarySubjectObj]
  );
  const resSubjectFullMarks = resSubjectObj?.fullMarks || 100;

  const [marksDraft, setMarksDraft] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    db.students.forEach((st) => {
      const found = db.results.find(
        (r) => r.student_id === st.id && r.subject_id === primarySubjectObj.id
      );
      initial[st.id] = found ? found.marks : 80;
    });
    return initial;
  });

  useEffect(() => {
    const updated: Record<string, number> = {};
    db.students.forEach((st) => {
      const found = db.results.find(
        (r) => r.student_id === st.id && r.subject_id === resSubjectId
      );
      updated[st.id] = found ? found.marks : 80;
    });
    setMarksDraft(updated);
  }, [resSubjectId, db.results, db.students]);

  // CT & Exam Form State
  const [ctName, setCtName] = useState(`${primarySubjectName} CT 04`);
  const [ctType, setCtType] = useState<ExamRecord['type']>('Class Test');
  const [ctSubject, setCtSubject] = useState(primarySubjectName);
  const [ctClass, setCtClass] = useState('Class 9');
  const [ctDate, setCtDate] = useState('2026-11-04');
  const [ctTime, setCtTime] = useState('09:30 AM – 10:15 AM');
  const [ctSyllabus, setCtSyllabus] = useState('Chapter 4');
  const [ctRoom, setCtRoom] = useState('Room 304 (Science Block)');

  // Assignment Form State
  const [asgTitle, setAsgTitle] = useState(`${primarySubjectName} Problem Set & Lab Analysis`);
  const [asgSubject, setAsgSubject] = useState(primarySubjectName);
  const [asgDue, setAsgDue] = useState('2026-10-22');
  const [asgDesc, setAsgDesc] = useState(
    'Construct a series-parallel circuit in Brainify Circuit Maker and record current and voltage drops.'
  );

  // Notice / Announcement Form State
  const [noticeTitle, setNoticeTitle] = useState('Tomorrow’s Physics Class Quiz Notice');
  const [noticeContent, setNoticeContent] = useState(
    'Tomorrow’s physics class will begin with a short 10-minute quiz on kinematic equations.'
  );
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('Academic');
  const [noticeTarget, setNoticeTarget] = useState<'Class 9 — BS1' | 'public'>('Class 9 — BS1');
  const [noticeImportant, setNoticeImportant] = useState<boolean>(true);

  // Previous Question Upload Form State
  const [pqTitle, setPqTitle] = useState('2026 Physics Monthly Test — Newton’s Laws');
  const [pqSubject, setPqSubject] = useState('Physics');
  const [pqYear, setPqYear] = useState(2026);
  const [pqExam, setPqExam] = useState('Monthly Test');
  const [pqChapter, setPqChapter] = useState('Chapter 03');
  const [pqText, setPqText] = useState(
    '1. State Newton’s Second Law of Motion and derive F = ma.\n2. Two blocks of masses 4 kg and 6 kg are connected by a light string over a frictionless pulley. Calculate the acceleration and tension.'
  );

  // Student Performance Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>('std-1');

  // Teacher Profile State
  const [profName, setProfName] = useState(currentUser?.name || 'Saif Chowdhury');
  const [profPhone, setProfPhone] = useState(currentUser?.phone || '[Demo Phone: +880-0000-000101]');

  // Complaint Feature State (Report a student directly to their Class Teacher's Complaint Box)
  const [complaintViewFilter, setComplaintViewFilter] = useState<'unread' | 'read' | 'sent'>('unread');
  const [complaintClassFilter, setComplaintClassFilter] = useState<string>('All');
  const [complaintStudentSearch, setComplaintStudentSearch] = useState<string>('');
  const [complaintTargetStudentId, setComplaintTargetStudentId] = useState<string>('std-80001');
  const [complaintFromTeacherCode, setComplaintFromTeacherCode] = useState<string>(activeTeacherCode);
  const [complaintCategory, setComplaintCategory] =
    useState<ComplaintCategory>('Classroom Conduct');
  const [complaintSeverity, setComplaintSeverity] = useState<ComplaintSeverity>('Medium');
  const [complaintSubjectTitle, setComplaintSubjectTitle] = useState<string>('');
  const [complaintBodyText, setComplaintBodyText] = useState<string>('');
  const [complaintBanner, setComplaintBanner] = useState<string | null>(null);
  const [noteDraftByComplaint, setNoteDraftByComplaint] = useState<Record<string, string>>({});

  // Call a Teacher to Room / Faculty Consultation State
  const [callTargetTeacherCode, setCallTargetTeacherCode] = useState<string>(
    ORDERED_TEACHER_LIST.find((t) => t.code !== activeTeacherCode)?.code || '18887'
  );
  const [callMeetingRoom, setCallMeetingRoom] = useState<string>('Faculty Consultation Room / Lab');
  const [callUrgencyLevel, setCallUrgencyLevel] =
    useState<TeacherCallRecord['urgency']>('After Current Period');
  const [callReasonText, setCallReasonText] = useState<string>('');

  useEffect(() => {
    setComplaintFromTeacherCode(activeTeacherCode);
  }, [activeTeacherCode]);

  const filteredComplaintCandidateStudents = useMemo(() => {
    const q = complaintStudentSearch.trim().toLowerCase();
    return db.students.filter((st) => {
      const sectionLabel = `${st.class} — ${st.section}`;
      if (complaintClassFilter !== 'All' && sectionLabel !== complaintClassFilter) {
        return false;
      }
      if (!q) return true;
      const usr = db.users.find((u) => u.id === st.user_id);
      const authoritativeName = getAuthoritativeStudentName(st, usr);
      return (
        authoritativeName.toLowerCase().includes(q) ||
        st.student_id.toLowerCase().includes(q) ||
        String(st.roll).padStart(2, '0').includes(q) ||
        sectionLabel.toLowerCase().includes(q)
      );
    });
  }, [db.students, db.users, complaintClassFilter, complaintStudentSearch]);

  const selectedComplaintStudentObj = useMemo(() => {
    return (
      db.students.find((s) => s.id === complaintTargetStudentId) ||
      filteredComplaintCandidateStudents[0] ||
      db.students[0]
    );
  }, [db.students, complaintTargetStudentId, filteredComplaintCandidateStudents]);

  const selectedComplaintStudentUser = useMemo(() => {
    if (!selectedComplaintStudentObj) return null;
    const foundUser = db.users.find((u) => u.id === selectedComplaintStudentObj.user_id) || null;
    const resolvedName = getAuthoritativeStudentName(selectedComplaintStudentObj, foundUser);
    return foundUser ? { ...foundUser, name: resolvedName } : ({ name: resolvedName } as any);
  }, [db.users, selectedComplaintStudentObj]);

  const recipientClassTeacherMeta = useMemo(() => {
    if (!selectedComplaintStudentObj) return TEACHER_CODES['18887'];
    return getClassTeacherForSection(
      selectedComplaintStudentObj.class,
      selectedComplaintStudentObj.section
    );
  }, [selectedComplaintStudentObj]);

  const handleOpenComplaintForStudent = (studentId: string) => {
    const st = db.students.find((s) => s.id === studentId);
    if (st) {
      setComplaintClassFilter(`${st.class} — ${st.section}`);
      setComplaintTargetStudentId(st.id);
    }
    setTeacherTab('complaints');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendStudentComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintStudentObj) return;
    const res = submitStudentComplaint({
      studentId: selectedComplaintStudentObj.id,
      category: complaintCategory,
      severity: complaintSeverity,
      subjectTitle: complaintSubjectTitle,
      complaintText: complaintBodyText,
      fromTeacherCode: complaintFromTeacherCode
    });
    if (res.ok) {
      setComplaintBanner(res.message);
      setComplaintSubjectTitle('');
      setComplaintBodyText('');
      // If the complaint was sent to this teacher's own class section, show inbox; otherwise show 'sent'
      if (
        `${selectedComplaintStudentObj.class} — ${selectedComplaintStudentObj.section}`.toLowerCase() ===
        (teacherRec.classTeacherOf || '').toLowerCase()
      ) {
        setComplaintViewFilter('unread');
      } else {
        setComplaintViewFilter('sent');
      }
    } else {
      setComplaintBanner(res.message);
    }
  };

  const navItems: Array<{ id: TeacherTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'approvals',
      label: 'Student Approvals',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badge: pendingSectionApprovalsCount
    },
    { id: 'classes', label: 'My Classes', icon: <Users className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-4 h-4" /> },
    {
      id: 'complaints',
      label: 'Complaint Box',
      icon: <MessageSquareWarning className="w-4 h-4" />,
      badge: newMyClassComplaintsCount
    },
    { id: 'routine', label: 'Class Routine', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'next-class', label: 'Next Class', icon: <BellRing className="w-4 h-4" /> },
    { id: 'results', label: 'Results Management', icon: <Award className="w-4 h-4" /> },
    { id: 'exams', label: 'CT & Exam Mgmt', icon: <FilePlus2 className="w-4 h-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'notices', label: 'Notices & Alerts', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'questions', label: 'Previous Questions', icon: <FileUp className="w-4 h-4" /> },
    { id: 'performance', label: 'Student Performance', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleMarkAllPresent = () => {
    setStatusMap((prev) => {
      const next = { ...prev };
      selectedClassStudents.forEach((s) => {
        next[s.id] = 'Present';
      });
      return next;
    });
    setAttendanceSavedBanner(null);
  };

  const handleSaveAttendance = () => {
    const classStatusSubset: Record<string, AttendanceStatus> = {};
    selectedClassStudents.forEach((s) => {
      classStatusSubset[s.id] = statusMap[s.id] || 'Present';
    });
    const res = saveClassAttendance(attendanceDate, selectedClassId, classStatusSubset);
    setAttendanceSavedBanner(res.message);
  };

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [tchCurrPass, setTchCurrPass] = useState<string>('');
  const [tchNewPass, setTchNewPass] = useState<string>('');
  const [tchPassMsg, setTchPassMsg] = useState<string | null>(null);

  // When teacher views Complaints tab, mark reply notifications on sent complaints as read
  useEffect(() => {
    if (teacherTab === 'complaints') {
      sentByMeComplaints.forEach((c) => {
        if (c.class_teacher_note || c.status === 'Replied' || c.status === 'Resolved') {
          markComplaintReplyViewed(c.id);
        }
      });
    }
  }, [teacherTab, sentByMeComplaints, markComplaintReplyViewed]);

  // Class Result Statistics
  const classResultStats = useMemo(() => {
    const values = selectedClassStudents.map((st) => marksDraft[st.id] ?? 80);
    const highest = values.length ? Math.max(...values) : 0;
    const lowest = values.length ? Math.min(...values) : 0;
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));
    const passCount = values.filter((v) => v >= 33).length;
    const passRate = Math.round((passCount / (values.length || 1)) * 100);
    return { highest, lowest, avg, passRate };
  }, [selectedClassStudents, marksDraft]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <PortalHeaderBar
        portalTitle="SCHOLAR'S SCHOOL & COLLEGE · TEACHER PORTAL"
        accentMode="crimson"
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        isMenuOpen={isMenuOpen}
      />

      <div className="flex-1 flex flex-col max-w-[1440px] w-full mx-auto relative">
        {/* Left-Side Slide-Out Navigation Drawer (Opened after clicking Menu) */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A] border-r border-white/15 p-5 shadow-2xl overflow-y-auto transform transition-transform duration-200 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/15">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center font-display text-base font-bold text-white shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'T'}
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 truncate">
                  {teacherRec.employee_id} · Class Teacher
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white cursor-pointer shrink-0"
              aria-label="Close Navigation Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setTeacherTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  teacherTab === item.id
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      teacherTab === item.id ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Smooth Mobile & Desktop Horizontal Quick Navigation Bar */}
        <div className="sticky top-0 z-20 bg-[#070707]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-5 md:px-8 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map((item) => {
              const isActive = teacherTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTeacherTab(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-white/[0.04] text-neutral-300 hover:bg-white/10 hover:text-white border border-white/10'
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
        <main key={teacherTab} className="flex-1 p-3 sm:p-5 md:p-8 pb-10 min-w-0 animate-smooth-in relative">
          {/* Ambient 3D Squares & Cubes scattered across different places in Teacher Portal */}
          <Floating3DShapesLayer variant="teacher" />

          {/* Teacher Welcome Header */}
          <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-3.5 sm:p-5 mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-base sm:text-xl md:text-2xl font-bold text-white">
                Welcome, {currentUser?.name}
              </h1>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-1 font-mono leading-relaxed">
                {teacherRec.department} · Class Teacher:{' '}
                <strong className="text-white">{teacherRec.classTeacherOf}</strong> · Subject:{' '}
                <strong className="text-white">{teacherRec.authorizedSubjects.join(', ')}</strong>
              </p>
            </div>
            <div className="grid grid-cols-3 sm:flex items-center gap-2">
              <button
                onClick={() => setTeacherTab('attendance')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-[11px] sm:text-xs font-bold text-black cursor-pointer whitespace-nowrap text-center active:scale-95 transition-all"
              >
                Attendance
              </button>
              <button
                onClick={() => {
                  markAllComplaintsReadForCurrentUser();
                  setTeacherTab('complaints');
                }}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] sm:text-xs font-semibold text-white cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>Complaints</span>
                {newMyClassComplaintsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-black font-mono text-[10px] font-bold">
                    {newMyClassComplaintsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTeacherTab('exams')}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] sm:text-xs font-semibold text-white cursor-pointer whitespace-nowrap text-center active:scale-95 transition-all"
              >
                + Schedule CT
              </button>
            </div>
          </div>

          {/* 1. TEACHER DASHBOARD */}
          {teacherTab === 'dashboard' && (
            <div className="space-y-6 relative z-20">
              {/* Leadership Office Summons / Room Call Alert Banner */}
              {myActiveRoomCalls.length > 0 && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <BellRing className="w-5 h-5" />
                      </span>
                      <div>
                        <h3 className="font-display text-sm sm:text-base font-bold text-white">
                          Leadership Office Summons ({myActiveRoomCalls.length} Active)
                        </h3>
                        <p className="text-xs text-amber-200/80">
                          You have been requested to report to a leadership room
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {myActiveRoomCalls.map((call) => (
                      <div
                        key={call.id}
                        className="p-3.5 rounded-xl bg-black/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[10px] font-extrabold uppercase">
                              {call.urgency}
                            </span>
                            <span className="font-display text-sm font-bold text-white">
                              Called by {call.called_by_position} ({call.called_by_name})
                            </span>
                            <span className="text-xs font-mono text-amber-300">
                              → Location: {call.room}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-200">
                            Note: &ldquo;{call.reason}&rdquo;
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {call.status === 'Called' && (
                            <button
                              type="button"
                              onClick={() => acknowledgeTeacherCall(call.id, 'Acknowledged')}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                            >
                              Acknowledge (On My Way)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => acknowledgeTeacherCall(call.id, 'Completed')}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
                          >
                            Mark Attended
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Teacher Complaint Box Panel — Organized by Student */}
              <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-white/10 pb-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base sm:text-lg font-bold text-white">
                          Complaint Box (Organized by Student) — {teacherRec.classTeacherOf}
                        </h3>
                        {newMyClassComplaintsCount > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white text-black font-mono text-[10px] font-extrabold">
                            {newMyClassComplaintsCount} New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Messages submitted by students in your class ({teacherRec.classTeacherOf}) and reports filed by subject teachers, grouped by student.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Two Options in Dashboard Complaint Box: Unread (Shown First) & Read */}
                    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black border border-white/20">
                      <button
                        type="button"
                        onClick={() => setDashboardComplaintReadTab('unread')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                          dashboardComplaintReadTab === 'unread'
                            ? 'bg-white text-black'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        <span>Unread</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            dashboardComplaintReadTab === 'unread'
                              ? 'bg-black text-white'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {unreadMyClassComplaints.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashboardComplaintReadTab('read')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                          dashboardComplaintReadTab === 'read'
                            ? 'bg-white text-black'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      >
                        <span>Read</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            dashboardComplaintReadTab === 'read'
                              ? 'bg-black text-white'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {readMyClassComplaints.length}
                        </span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setComplaintViewFilter('unread');
                        setTeacherTab('complaints');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      Open Full Complaint Box ({myClassComplaints.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherTab('complaints');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer active:scale-95 transition-all"
                    >
                      + Complain to a Class Teacher
                    </button>
                  </div>
                </div>

                {myClassComplaintsByStudent.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-neutral-400 font-mono">
                      {dashboardComplaintReadTab === 'unread'
                        ? `No unread complaints in your ${teacherRec.classTeacherOf} Complaint Box.`
                        : `No read complaints in your ${teacherRec.classTeacherOf} Complaint Box yet.`}
                    </p>
                    {dashboardComplaintReadTab === 'unread' && readMyClassComplaints.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDashboardComplaintReadTab('read')}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                      >
                        View Read Complaints ({readMyClassComplaints.length}) →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {myClassComplaintsByStudent.map((group) => (
                      <div
                        key={group.studentCode}
                        className="p-4 rounded-2xl bg-black border border-white/15 space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Student Group Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-sm sm:text-base font-bold text-white">
                                  {group.studentName}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white text-black font-mono text-[10px] font-extrabold">
                                  ID: {group.studentCode}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                                {group.classSection} · Roll {String(group.studentRoll).padStart(2, '0')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {group.newCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
                                  {group.newCount} New
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/20 font-mono text-[10px] text-white font-semibold">
                                {group.messages.length} {group.messages.length === 1 ? 'Message' : 'Messages'}
                              </span>
                            </div>
                          </div>

                          {/* Student's Messages */}
                          <div className="space-y-2.5">
                            {group.messages.map((cmp) => (
                              <div
                                key={cmp.id}
                                onClick={() => {
                                  markComplaintSeenByTeacher(cmp.id);
                                  showToast('Complaint marked as read and transferred to Read.');
                                }}
                                className="p-3 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/35 transition-all cursor-pointer space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      cmp.submitted_by_role === 'student'
                                        ? 'bg-white text-black'
                                        : 'bg-white/15 text-white border border-white/25'
                                    }`}
                                  >
                                    {cmp.submitted_by_role === 'student'
                                      ? 'Student Direct Message'
                                      : `Teacher Report (${cmp.from_teacher_subject})`}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      cmp.status === 'Submitted'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                        : cmp.status === 'Under Review'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : cmp.status === 'Replied'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    }`}
                                  >
                                    {cmp.status}
                                  </span>
                                </div>
                                <div className="font-display text-xs sm:text-sm font-bold text-white">
                                  {cmp.subject_title}
                                </div>
                                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                                  {cmp.complaint_text}
                                </p>
                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1">
                                  <span>{cmp.category}</span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markComplaintSeenByTeacher(cmp.id);
                                        showToast('Complaint marked as seen and cleared from active box.');
                                      }}
                                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
                                    >
                                      ✓ Mark Seen (Dismiss)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteStudentComplaint(cmp.id);
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold inline-flex items-center gap-1 cursor-pointer"
                                      title="Delete Complaint"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-neutral-400">
                            Assigned Class Teacher: {currentUser?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTeacherTab('complaints')}
                            className="text-xs font-bold text-white hover:underline cursor-pointer"
                          >
                            Review &amp; Reply →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div
                  onClick={() => setTeacherTab('classes')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Assigned Classes</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {teacherRec.assignedClasses.length}
                  </div>
                </div>
                <div
                  onClick={() => setTeacherTab('routine')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Today&apos;s Classes</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    4 Periods
                  </div>
                </div>
                <div
                  onClick={() => setTeacherTab('attendance')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">My Attendance Rate</div>
                  <div className="font-mono text-lg font-bold text-emerald-400 mt-1 tabular-nums">
                    {teacherRec.personalAttendanceRate || 96}% Present
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    ● {teacherRec.classTeacherOf}
                  </div>
                </div>
                <div
                  onClick={() => setTeacherTab('exams')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Upcoming CTs</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {db.exams.length}
                  </div>
                </div>
                <div
                  onClick={() => setTeacherTab('assignments')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-xl p-4 cursor-pointer"
                >
                  <div className="text-xs text-neutral-400">Active Assignments</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {db.assignments.length}
                  </div>
                </div>
              </div>

              {/* Call a Teacher & Quick Consultation Bar */}
              <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold text-white">
                        Call a Teacher (Instant Room / Consultation Request)
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Send an instant room call notification to any Class Teacher or Subject Teacher
                      </p>
                    </div>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const res = callTeacherToRoom({
                      teacherCode: callTargetTeacherCode,
                      room: callMeetingRoom,
                      urgency: callUrgencyLevel,
                      reason:
                        callReasonText.trim() ||
                        `Consultation requested by ${currentUser?.name} (${teacherRec.classTeacherOf})`
                    });
                    if (res.ok) {
                      setCallReasonText('');
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end text-xs"
                >
                  <div className="lg:col-span-3">
                    <label className="block text-neutral-400 mb-1">Select Teacher to Call</label>
                    <select
                      value={callTargetTeacherCode}
                      onChange={(e) => setCallTargetTeacherCode(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white font-semibold"
                    >
                      {ORDERED_TEACHER_LIST.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.defaultName} ({t.subject} · {t.classTeacherSection})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-neutral-400 mb-1">Room / Location</label>
                    <input
                      type="text"
                      value={callMeetingRoom}
                      onChange={(e) => setCallMeetingRoom(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-neutral-400 mb-1">Urgency</label>
                    <select
                      value={callUrgencyLevel}
                      onChange={(e) =>
                        setCallUrgencyLevel(e.target.value as TeacherCallRecord['urgency'])
                      }
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="Within 15 Minutes">Within 15 Minutes</option>
                      <option value="After Current Period">After Current Period</option>
                      <option value="Scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-neutral-400 mb-1">Reason / Note</label>
                    <input
                      type="text"
                      value={callReasonText}
                      onChange={(e) => setCallReasonText(e.target.value)}
                      placeholder="Student / exam discussion..."
                      className="w-full bg-black border border-white/20 rounded-xl px-3 py-2 text-white placeholder:text-neutral-500"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Teacher</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Next Class Live Widget */}
                <div className="lg:col-span-5 bg-[#0A0A0A] border border-white/25 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
                      <span>NEXT CLASS NOTIFICATION</span>
                      <span className="text-white">● LIVE COUNTDOWN</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl font-bold text-white mb-1">
                        {primarySubjectName} — {teacherRec.classTeacherOf}
                      </h3>
                      <Cube3DObject size={36} accent="crimson" speedSeconds={10} />
                    </div>
                    <div className="text-xs text-neutral-300 space-y-1 mt-3 font-mono">
                      <div>Teacher: {currentUser?.name}</div>
                      <div>Room: {selectedClassObj?.room || 'Academic Block'}</div>
                      <div>Time: 09:30 AM – 10:15 AM</div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-white">
                      Starts in {countdownMinutes} minutes
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCountdownMinutes(15);
                          triggerNextClassNotification(15);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold cursor-pointer"
                      >
                        🔔 Notify Now
                      </button>
                      <button
                        onClick={() => setTeacherTab('next-class')}
                        className="text-xs text-white underline cursor-pointer"
                      >
                        Configure →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Class Management Cards */}
                <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-xl p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="font-display text-base font-bold text-white">
                      Assigned Classes Overview
                    </h3>
                    <Square3DObject size={30} accent="cyan" speedSeconds={12} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {db.classes.map((cls) => {
                      const isClassTeacher = cls.class_teacher_id === teacherRec.id;
                      return (
                        <div
                          key={cls.id}
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setTeacherTab('attendance');
                          }}
                          className="p-4 rounded-xl bg-black border border-white/15 hover:border-white/40 cursor-pointer"
                        >
                          <div className="font-display text-base font-bold text-white">
                            {cls.class_name} — {cls.section}
                          </div>
                          <div className="text-xs text-neutral-300 mt-1">
                            {isClassTeacher ? 'Role: Class Teacher' : 'Role: Subject Teacher'}
                          </div>
                          <div className="text-xs font-mono text-neutral-400 mt-2">
                            Students: {cls.studentCount} · {cls.room}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RECHARTS DATA VISUALIZATION: CLASS ATTENDANCE TRENDS (30 DAYS) & AVERAGE SUBJECT GRADES */}
              <TeacherAnalyticsCharts
                selectedClassId={selectedClassId}
                onSelectClassId={setSelectedClassId}
                onSelectDate={(dateStr) => {
                  setAttendanceDate(dateStr);
                  setTeacherTab('attendance');
                }}
              />
            </div>
          )}

          {/* 2. MY CLASSES */}
          {teacherTab === 'classes' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  My Assigned Classes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click a class card to open its attendance or result management workspace
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {db.classes.map((cls) => {
                  const isClassTeacher = cls.class_teacher_id === teacherRec.id;
                  return (
                    <div
                      key={cls.id}
                      className="bg-[#0E1018] border border-white/10 rounded-xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="font-display text-xl font-bold text-white mb-2">
                          {cls.class_name} — {cls.section}
                        </h3>
                        <div className="space-y-1.5 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-400">Subject: </span>
                            {teacherRec.authorizedSubjects.join(', ') || 'Physics'}
                          </div>
                          <div>
                            <span className="text-slate-400">Role: </span>
                            <span className={isClassTeacher ? 'text-emerald-400 font-semibold' : 'text-slate-200'}>
                              {isClassTeacher ? 'Class Teacher (Full Attendance Access)' : 'Subject Teacher'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Students: </span>
                            <span className="font-mono">{cls.studentCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Room: </span>
                            {cls.room}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setTeacherTab('attendance');
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black cursor-pointer"
                        >
                          Manage Attendance
                        </button>
                        <button
                          onClick={() => setTeacherTab('results')}
                          className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                        >
                          Results
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. ATTENDANCE MANAGEMENT (Part 6 Section 2) */}
          {teacherTab === 'attendance' && (
            <div className="space-y-5 sm:space-y-6 animate-smooth-in">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Roll-Call Attendance — {selectedClassObj?.class_name} ({selectedClassObj?.section})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    35 Students Enrolled in {selectedClassObj?.class_name} — {selectedClassObj?.section} · Designated Section: {teacherRec.classTeacherOf}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={selectedClassId}
                    onChange={(e) => {
                      setSelectedClassId(e.target.value);
                      setAttendanceSavedBanner(null);
                    }}
                    className="bg-[#0E1018] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-semibold cursor-pointer"
                  >
                    {db.classes.map((c) => {
                      const isPrimary =
                        `${c.class_name} — ${c.section}`.toLowerCase() ===
                        (teacherRec.classTeacherOf || '').toLowerCase();
                      return (
                        <option key={c.id} value={c.id}>
                          {c.class_name} — {c.section} ({c.studentCount} Students){' '}
                          {isPrimary ? '★ Class Teacher' : ''}
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      setAttendanceSavedBanner(null);
                    }}
                    className="bg-[#0E1018] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />

                  <button
                    onClick={handleMarkAllPresent}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer active:scale-95"
                  >
                    Mark All 35 Present
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-xs font-bold text-black cursor-pointer active:scale-95"
                  >
                    Save Attendance
                  </button>
                </div>
              </div>

              {/* 30-Day Previous Attendance Archive Selector */}
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-sm sm:text-base font-bold text-white">
                      30-Day Previous Attendance Storage ({class30DayArchive.length} Days Stored)
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Click any date from the past 30 days to inspect or update stored attendance for {selectedClassObj?.class_name} — {selectedClassObj?.section}.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 font-mono text-[11px] text-white font-semibold">
                    Viewing Date: {attendanceDate}
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                  {class30DayArchive.map((dayItem) => {
                    const isSelected = dayItem.date === attendanceDate;
                    return (
                      <button
                        key={dayItem.date}
                        type="button"
                        onClick={() => {
                          setAttendanceDate(dayItem.date);
                          setAttendanceSavedBanner(null);
                        }}
                        className={`px-3 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black border-white font-bold shadow-sm'
                            : dayItem.isHoliday
                            ? 'bg-white/[0.02] text-neutral-500 border-white/10 hover:border-white/25'
                            : 'bg-black text-white border-white/15 hover:border-white/40'
                        }`}
                      >
                        <div className="font-mono text-[11px] font-bold">
                          {dayItem.date.slice(5)}
                        </div>
                        <div
                          className={`text-[10px] font-mono mt-0.5 ${
                            isSelected
                              ? 'text-neutral-800'
                              : dayItem.isHoliday
                              ? 'text-neutral-500'
                              : 'text-emerald-400'
                          }`}
                        >
                          {dayItem.isHoliday
                            ? 'Holiday'
                            : `${dayItem.present}P · ${dayItem.absent}A`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live 35-Student Attendance Summary Row + Quick Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-3.5">
                  <div className="text-[11px] text-neutral-400">Section Roster</div>
                  <div className="font-mono text-xl font-bold text-white mt-0.5 tabular-nums">
                    {selectedClassAttendanceStats.total} Students
                  </div>
                </div>
                <div className="bg-[#0A0A0A] border border-emerald-500/30 rounded-xl p-3.5">
                  <div className="text-[11px] text-emerald-300">Present Today</div>
                  <div className="font-mono text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
                    {selectedClassAttendanceStats.present}
                  </div>
                </div>
                <div className="bg-[#0A0A0A] border border-red-500/30 rounded-xl p-3.5">
                  <div className="text-[11px] text-red-300">Absent Today</div>
                  <div className="font-mono text-xl font-bold text-red-400 mt-0.5 tabular-nums">
                    {selectedClassAttendanceStats.absent}
                  </div>
                </div>
                <div className="bg-[#0A0A0A] border border-amber-500/30 rounded-xl p-3.5">
                  <div className="text-[11px] text-amber-300">Late Arrivals</div>
                  <div className="font-mono text-xl font-bold text-amber-400 mt-0.5 tabular-nums">
                    {selectedClassAttendanceStats.late}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0A0A] border border-white/15 rounded-xl p-3">
                <input
                  type="search"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Filter 35 students by Roll, Name, or Student ID..."
                  className="w-full sm:w-80 bg-black border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
                />
                <span className="text-xs font-mono text-neutral-400">
                  Showing {filteredAttendanceStudents.length} of {selectedClassStudents.length} students in {selectedClassObj?.class_name} — {selectedClassObj?.section}
                </span>
              </div>

              {/* Quick Verified Student Login Roster Strip (Class 9 BS1 Login Students 90001-90006 & Section Switcher) */}
              <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                    Verified Student Login Roster in {selectedClassObj?.class_name} ({selectedClassObj?.section}) — Roll 01 to 06
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassId('cls-9-bs1');
                      setAttendanceSearch('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                      selectedClassId === 'cls-9-bs1'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-white/10 text-white hover:bg-white hover:text-black'
                    }`}
                  >
                    Jump to Class 9 (BS1) · IDs 90001–90006
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {selectedClassStudents.slice(0, 6).map((st) => {
                    const usr = db.users.find((u) => u.id === st.user_id);
                    const fullName = getAuthoritativeStudentName(st, usr);
                    const current = statusMap[st.id] || 'Present';
                    const gpaInfo = studentOverallGpaMap[st.id];
                    return (
                      <div
                        key={st.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black border border-white/10 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">
                            <span className="font-mono text-emerald-400 mr-1.5">{st.student_id}</span>
                            {fullName}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            Roll {String(st.roll).padStart(2, '0')} · {st.class} ({st.section})
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            current === 'Present'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                              : current === 'Absent'
                              ? 'bg-red-950/80 text-red-300 border border-red-500/30'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {current}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {attendanceSavedBanner && (
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                    attendanceSavedBanner.includes('Permission Denied')
                      ? 'bg-red-950/50 border-red-500/40 text-red-200'
                      : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  {attendanceSavedBanner.includes('Permission Denied') ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{attendanceSavedBanner}</span>
                </div>
              )}

              {/* Mobile Cards for 35-Student Roll Call + Desktop Table */}
              <div className="md:hidden space-y-2.5">
                {filteredAttendanceStudents.map((st) => {
                  const usr = db.users.find((u) => u.id === st.user_id);
                  const studentFullName = getAuthoritativeStudentName(st, usr);
                  const current = statusMap[st.id] || 'Present';
                  const gpaInfo = studentOverallGpaMap[st.id];
                  return (
                    <div
                      key={st.id}
                      className="p-3.5 rounded-xl bg-[#0A0A0A] border border-white/15 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-display text-xs sm:text-sm font-bold text-white truncate">
                            Roll {String(st.roll).padStart(2, '0')} · {studentFullName}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            ID: <strong className="text-white">{st.student_id}</strong> · {st.class} ({st.section})
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold shrink-0">
                          {current === 'Present' && <span className="text-emerald-400">● Present</span>}
                          {current === 'Absent' && <span className="text-red-400">● Absent</span>}
                          {current === 'Late' && <span className="text-amber-400">● Late</span>}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setStatusMap((prev) => ({ ...prev, [st.id]: 'Present' }))
                          }
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            current === 'Present'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStatusMap((prev) => ({ ...prev, [st.id]: 'Absent' }))
                          }
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            current === 'Absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStatusMap((prev) => ({ ...prev, [st.id]: 'Late' }))
                          }
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            current === 'Late'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenComplaintForStudent(st.id)}
                          className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white hover:text-black text-[11px] font-semibold text-white cursor-pointer"
                        >
                          Complain
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block bg-[#0E1018] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#090A0F] border-b border-white/10 text-xs font-mono text-slate-400">
                        <th className="py-3.5 px-4">Roll</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Student ID</th>
                        <th className="py-3.5 px-4">Class &amp; Sec</th>
                        <th className="py-3.5 px-4">30-Day Record</th>
                        <th className="py-3.5 px-4">Current Status ({attendanceDate})</th>
                        <th className="py-3.5 px-4 text-right">Mark Status Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {filteredAttendanceStudents.map((st) => {
                        const usr = db.users.find((u) => u.id === st.user_id);
                        const studentFullName = getAuthoritativeStudentName(st, usr);
                        const current = statusMap[st.id] || 'Present';
                        const st30 = student30DayStatsMap[st.id] || {
                          present: 24,
                          absent: 1,
                          late: 1,
                          total: 26,
                          pct: 94
                        };
                        const gpaInfo = studentOverallGpaMap[st.id];
                        return (
                          <tr key={st.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-white tabular-nums whitespace-nowrap">
                              Roll {String(st.roll).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                              <div>{studentFullName}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-white font-semibold whitespace-nowrap">
                              {st.student_id}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                              {st.class} — {st.section}
                            </td>
                            <td className="py-3 px-4 font-mono whitespace-nowrap">
                              <span className="text-emerald-400 font-bold">{st30.pct}%</span>{' '}
                              <span className="text-slate-400 text-[11px]">
                                ({st30.present}P/{st30.absent}A/{st30.late}L)
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-semibold whitespace-nowrap">
                              {current === 'Present' && (
                                <span className="text-emerald-400">🟢 Present</span>
                              )}
                              {current === 'Absent' && (
                                <span className="text-red-400">🔴 Absent</span>
                              )}
                              {current === 'Late' && (
                                <span className="text-amber-400">🟡 Late</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    setStatusMap((prev) => ({ ...prev, [st.id]: 'Present' }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 ${
                                    current === 'Present'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() =>
                                    setStatusMap((prev) => ({ ...prev, [st.id]: 'Absent' }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 ${
                                    current === 'Absent'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() =>
                                    setStatusMap((prev) => ({ ...prev, [st.id]: 'Late' }))
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 ${
                                    current === 'Late'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenComplaintForStudent(st.id)}
                                  title="Send complaint about this student to their Class Teacher"
                                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-black text-[11px] font-semibold text-white cursor-pointer active:scale-95 transition-colors"
                                >
                                  Complain
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3B. COMPLAINT BOX & INTER-TEACHER STUDENT COMPLAINT SYSTEM */}
          {teacherTab === 'complaints' && (
            <div className="space-y-6 animate-smooth-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Student Complaint Center &amp; Class Teacher Complaint Box
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Write a complaint about any student to send it directly to their Class Teacher&apos;s Complaint Box, or review complaints sent to your class ({teacherRec.classTeacherOf}).
                  </p>
                </div>
                <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#0A0A0A] border border-white/15 self-start">
                  <button
                    type="button"
                    onClick={() => setComplaintViewFilter('unread')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                      complaintViewFilter === 'unread'
                        ? 'bg-white text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <span>Unread</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        complaintViewFilter === 'unread'
                          ? 'bg-black text-white'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {unreadMyClassComplaints.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplaintViewFilter('read')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                      complaintViewFilter === 'read'
                        ? 'bg-white text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    <span>Read</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        complaintViewFilter === 'read'
                          ? 'bg-black text-white'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {readMyClassComplaints.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplaintViewFilter('sent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      complaintViewFilter === 'sent'
                        ? 'bg-white text-black font-bold'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Sent by Me ({sentByMeComplaints.length})
                  </button>
                </div>
              </div>

              {complaintBanner && (
                <div className="p-4 rounded-xl bg-white/10 border border-white/30 text-white text-xs font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>{complaintBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setComplaintBanner(null)}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: WRITE A COMPLAINT TO A STUDENT'S CLASS TEACHER */}
                <form
                  onSubmit={handleSendStudentComplaint}
                  className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <div className="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        Complain to Student&apos;s Class Teacher
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Select any student; your written report goes directly to their Class Teacher&apos;s Complaint Box
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Filter by Class & Section or Search Student */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          1. Filter Student&apos;s Class
                        </label>
                        <select
                          value={complaintClassFilter}
                          onChange={(e) => {
                            const nextFilter = e.target.value;
                            setComplaintClassFilter(nextFilter);
                            const firstMatch = db.students.find((st) =>
                              nextFilter === 'All'
                                ? true
                                : `${st.class} — ${st.section}` === nextFilter
                            );
                            if (firstMatch) {
                              setComplaintTargetStudentId(firstMatch.id);
                            }
                          }}
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white font-semibold"
                        >
                          <option value="All">All Classes &amp; Sections (350 Students)</option>
                          {db.classes.map((c) => {
                            const label = `${c.class_name} — ${c.section}`;
                            const ct = getClassTeacherForSection(c.class_name, c.section);
                            return (
                              <option key={c.id} value={label}>
                                {label} (CT: {ct.defaultName})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Search Name / Student ID
                        </label>
                        <input
                          type="search"
                          value={complaintStudentSearch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setComplaintStudentSearch(val);
                            const q = val.trim().toLowerCase();
                            if (q) {
                              const match = db.students.find((st) => {
                                const usr = db.users.find((u) => u.id === st.user_id);
                                const fullName = getAuthoritativeStudentName(st, usr);
                                return (
                                  fullName.toLowerCase().includes(q) ||
                                  st.student_id.toLowerCase().includes(q)
                                );
                              });
                              if (match) setComplaintTargetStudentId(match.id);
                            }
                          }}
                          placeholder="e.g. 90001, Ahnaf Nahin, Rushaid..."
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder:text-neutral-500"
                        />
                      </div>
                    </div>

                    {/* Select Specific Student */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        2. Select Specific Student ({filteredComplaintCandidateStudents.length} matching)
                      </label>
                      <select
                        value={selectedComplaintStudentObj?.id || ''}
                        onChange={(e) => setComplaintTargetStudentId(e.target.value)}
                        className="w-full bg-black border border-white/25 rounded-xl px-3 py-2.5 text-white font-mono"
                      >
                        {filteredComplaintCandidateStudents.map((st) => {
                          const usr = db.users.find((u) => u.id === st.user_id);
                          const fullName = getAuthoritativeStudentName(st, usr);
                          return (
                            <option key={st.id} value={st.id}>
                              {st.class} ({st.section}) · Roll {String(st.roll).padStart(2, '0')} — {fullName} (ID: {st.student_id})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Automatic Routing Destination Box */}
                    {selectedComplaintStudentObj && (
                      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/25 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                          <span>DIRECT DESTINATION (CLASS TEACHER BOX)</span>
                          <span className="px-2 py-0.5 rounded bg-white text-black font-bold">
                            AUTO-ROUTED
                          </span>
                        </div>
                        <div className="font-display text-sm font-bold text-white">
                          To: {recipientClassTeacherMeta.defaultName} ({recipientClassTeacherMeta.subject} Teacher)
                        </div>
                        <div className="text-[11px] font-mono text-neutral-300">
                          Class Teacher of{' '}
                          <strong className="text-white">
                            {selectedComplaintStudentObj.class} — {selectedComplaintStudentObj.section}
                          </strong>{' '}
                          · Subject Code: {recipientClassTeacherMeta.code}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          Student:{' '}
                          <strong className="text-white">
                            {selectedComplaintStudentUser?.name}
                          </strong>{' '}
                          · ID: <strong className="text-white">{selectedComplaintStudentObj.student_id}</strong> · Roll{' '}
                          {String(selectedComplaintStudentObj.roll).padStart(2, '0')}
                        </div>
                      </div>
                    )}

                    {/* Reporting Teacher (From) - Locked to Authenticated Teacher */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        3. Reporting Subject Teacher (From)
                      </label>
                      <div className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white font-mono text-xs">
                        {currentUser?.name} — {primarySubjectName} Teacher (Class Teacher: {teacherRec.classTeacherOf})
                      </div>
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Category
                        </label>
                        <select
                          value={complaintCategory}
                          onChange={(e) =>
                            setComplaintCategory(e.target.value as ComplaintCategory)
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white"
                        >
                          <option value="Classroom Conduct">Classroom Conduct</option>
                          <option value="Late / Homework Incomplete">
                            Late / Homework Incomplete
                          </option>
                          <option value="Lab Safety / Equipment">Lab Safety / Equipment</option>
                          <option value="Academic Integrity">Academic Integrity</option>
                          <option value="Attendance / Truancy">Attendance / Truancy</option>
                          <option value="General Observation">General Observation</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Urgency / Severity
                        </label>
                        <select
                          value={complaintSeverity}
                          onChange={(e) =>
                            setComplaintSeverity(e.target.value as ComplaintSeverity)
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    {/* Complaint Headline */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        4. Complaint Headline / Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={complaintSubjectTitle}
                        onChange={(e) => setComplaintSubjectTitle(e.target.value)}
                        placeholder="e.g. Disruptive behavior during lecture / Missing homework"
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    {/* Detailed Written Complaint */}
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        5. Write Detailed Complaint for Class Teacher
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={complaintBodyText}
                        onChange={(e) => setComplaintBodyText(e.target.value)}
                        placeholder="Write what happened in class/lab and any action requested from the student's Class Teacher..."
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        Send Directly to {recipientClassTeacherMeta.defaultName}&apos;s Complaint Box
                      </span>
                    </button>
                  </div>
                </form>

                {/* RIGHT COLUMN: CLASS TEACHER'S COMPLAINT BOX INBOX */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/15">
                      <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-white">
                          {complaintViewFilter === 'unread'
                            ? `${teacherRec.classTeacherOf} — Unread Complaints (Shown First)`
                            : complaintViewFilter === 'read'
                            ? `${teacherRec.classTeacherOf} — Read Complaints`
                            : `Complaints Sent by ${currentUser?.name}`}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {complaintViewFilter === 'unread'
                            ? `Click any unread complaint to automatically mark it as read and transfer it to the Read tab.`
                            : complaintViewFilter === 'read'
                            ? `Complaints for ${teacherRec.classTeacherOf} that have been read or resolved.`
                            : 'Complaints you wrote and routed to other Class Teachers'}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 font-mono text-xs text-white font-bold">
                        {
                          (complaintViewFilter === 'unread'
                            ? unreadMyClassComplaints
                            : complaintViewFilter === 'read'
                            ? readMyClassComplaints
                            : sentByMeComplaints
                          ).length
                        }{' '}
                        Records
                      </span>
                    </div>

                    {(() => {
                      const list =
                        complaintViewFilter === 'sent'
                          ? sentByMeComplaints
                          : complaintViewFilter === 'read'
                          ? readMyClassComplaints
                          : unreadMyClassComplaints;

                      if (list.length === 0) {
                        return (
                          <div className="p-8 text-center rounded-xl bg-black border border-white/10 space-y-2">
                            <Inbox className="w-7 h-7 text-neutral-400 mx-auto" />
                            <div className="font-display text-sm font-bold text-white">
                              {complaintViewFilter === 'unread'
                                ? 'No Unread Complaints'
                                : complaintViewFilter === 'read'
                                ? 'No Read Complaints Yet'
                                : 'No Sent Complaints'}
                            </div>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto">
                              {complaintViewFilter === 'unread'
                                ? readMyClassComplaints.length > 0
                                  ? 'All complaints have been read and transferred to the Read option.'
                                  : 'Use the form on the left to write a complaint about any student; it will be delivered directly to their Class Teacher’s Complaint Box.'
                                : complaintViewFilter === 'read'
                                ? 'Unread complaints that you click or mark as read are automatically transferred here.'
                                : 'Use the form on the left to write a complaint about any student.'}
                            </p>
                            {complaintViewFilter === 'unread' && readMyClassComplaints.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setComplaintViewFilter('read')}
                                className="mt-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white cursor-pointer"
                              >
                                View Read Complaints ({readMyClassComplaints.length}) →
                              </button>
                            )}
                          </div>
                        );
                      }

                      // Group list by student so messages are organized by student
                      const groupedMap = new Map<
                        string,
                        {
                          studentCode: string;
                          studentName: string;
                          studentRoll: number;
                          targetClassSection: string;
                          items: typeof list;
                        }
                      >();

                      list.forEach((cmp) => {
                        const key = cmp.student_code || cmp.student_id;
                        const existing = groupedMap.get(key);
                        if (existing) {
                          existing.items.push(cmp);
                        } else {
                          groupedMap.set(key, {
                            studentCode: cmp.student_code,
                            studentName: cmp.student_name,
                            studentRoll: cmp.student_roll,
                            targetClassSection: cmp.target_class_section,
                            items: [cmp]
                          });
                        }
                      });

                      const groupedStudents = Array.from(groupedMap.values());

                      return (
                        <div className="space-y-5">
                          {groupedStudents.map((stGroup) => (
                            <div
                              key={stGroup.studentCode}
                              className="p-4 sm:p-5 rounded-2xl bg-black border border-white/25 space-y-3.5"
                            >
                              {/* Student Group Header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/15">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-display text-base sm:text-lg font-bold text-white">
                                    {stGroup.studentName}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-white text-black font-mono text-xs font-extrabold">
                                    Student ID: {stGroup.studentCode}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">
                                    {stGroup.targetClassSection} · Roll{' '}
                                    {String(stGroup.studentRoll).padStart(2, '0')}
                                  </span>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 font-mono text-xs text-white font-bold">
                                  {stGroup.items.length}{' '}
                                  {stGroup.items.length === 1 ? 'Message' : 'Messages'}
                                </span>
                              </div>

                              {/* Messages for this Student */}
                              <div className="space-y-3">
                                {stGroup.items.map((cmp) => {
                                  const draftNote =
                                    noteDraftByComplaint[cmp.id] !== undefined
                                      ? noteDraftByComplaint[cmp.id]
                                      : cmp.class_teacher_note || '';
                                  const isCmpRead = isTeacherComplaintRead(cmp);
                                  return (
                                    <div
                                      key={cmp.id}
                                      onClick={() => {
                                        if (!isCmpRead && complaintViewFilter !== 'sent') {
                                          markComplaintSeenByTeacher(cmp.id);
                                          showToast('Complaint marked as read and transferred to Read.');
                                        }
                                      }}
                                      className={`p-3.5 sm:p-4 rounded-xl bg-[#0A0A0A] border transition-all space-y-3 ${
                                        !isCmpRead && complaintViewFilter !== 'sent'
                                          ? 'border-white/35 hover:border-white cursor-pointer'
                                          : 'border-white/15'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                !isCmpRead
                                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                              }`}
                                            >
                                              {!isCmpRead ? '● Unread' : '✓ Read'}
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                cmp.submitted_by_role === 'student'
                                                  ? 'bg-white text-black'
                                                  : 'bg-white/15 text-white border border-white/30'
                                              }`}
                                            >
                                              {cmp.submitted_by_role === 'student'
                                                ? 'Student Direct Message'
                                                : 'Teacher Report'}
                                            </span>
                                            <span className="text-[11px] font-mono text-neutral-300">
                                              From:{' '}
                                              <strong className="text-white">
                                                {cmp.from_teacher_name}
                                              </strong>{' '}
                                              ({cmp.from_teacher_subject}) → Class Teacher:{' '}
                                              <strong className="text-white">
                                                {cmp.class_teacher_name}
                                              </strong>
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                              cmp.severity === 'Urgent' || cmp.severity === 'High'
                                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                                : 'bg-white/10 text-neutral-300 border border-white/20'
                                            }`}
                                          >
                                            {cmp.severity}
                                          </span>
                                          <span
                                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                              cmp.status === 'Submitted'
                                                ? 'bg-white text-black'
                                                : cmp.status === 'Under Review'
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                : cmp.status === 'Replied'
                                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            }`}
                                          >
                                            {cmp.status}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
                                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                                          <span>Category: {cmp.category}</span>
                                          <span>{new Date(cmp.created_at).toLocaleString()}</span>
                                        </div>
                                        <h4 className="font-display text-sm font-bold text-white">
                                          {cmp.subject_title}
                                        </h4>
                                        <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-line">
                                          {cmp.complaint_text}
                                        </p>
                                      </div>

                                      {cmp.class_teacher_note && (
                                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/15 text-xs text-neutral-200">
                                          <strong className="text-white font-mono">
                                            Class Teacher Reply / Note ({cmp.class_teacher_name}):{' '}
                                          </strong>
                                          {cmp.class_teacher_note}
                                        </div>
                                      )}

                                      {/* Class Teacher Action Controls */}
                                      {complaintViewFilter !== 'sent' && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                                        >
                                          <input
                                            type="text"
                                            value={draftNote}
                                            onChange={(e) =>
                                              setNoteDraftByComplaint((prev) => ({
                                                ...prev,
                                                [cmp.id]: e.target.value
                                              }))
                                            }
                                            placeholder="Write Class Teacher reply for this complaint..."
                                            className="flex-1 bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500"
                                          />
                                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                            {!isCmpRead && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  markComplaintSeenByTeacher(cmp.id);
                                                  showToast('Complaint marked as read and transferred to Read.');
                                                }}
                                                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-semibold cursor-pointer active:scale-95"
                                              >
                                                Mark as Read
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                updateStudentComplaintStatus(
                                                  cmp.id,
                                                  'Replied',
                                                  draftNote
                                                );
                                                markComplaintSeenByTeacher(cmp.id);
                                              }}
                                              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-semibold cursor-pointer active:scale-95"
                                            >
                                              Send Reply &amp; Transfer to Read
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                updateStudentComplaintStatus(
                                                  cmp.id,
                                                  'Resolved',
                                                  draftNote
                                                );
                                                markComplaintSeenByTeacher(cmp.id);
                                              }}
                                              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer active:scale-95"
                                            >
                                              Mark Resolved
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => deleteStudentComplaint(cmp.id)}
                                              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer active:scale-95"
                                              title="Delete Complaint"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                              <span>Delete Complaint</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      {complaintViewFilter === 'sent' && (
                                        <div className="pt-2 border-t border-white/10 flex items-center justify-end">
                                          <button
                                            type="button"
                                            onClick={() => deleteStudentComplaint(cmp.id)}
                                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete Complaint</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TEACHER CLASS ROUTINE */}
          {teacherTab === 'routine' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Teacher Weekly Schedule
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  All periods assigned to {currentUser?.name} · Next Class highlighted
                </p>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090A0F] border-b border-white/10 font-mono text-slate-400">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Period &amp; Time</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {db.routines
                      .filter((r) => r.teacher_id === 'tch-1')
                      .map((r, idx) => (
                        <tr
                          key={r.id}
                          className={idx === 0 ? 'bg-red-950/30 border-l-2 border-red-500' : ''}
                        >
                          <td className="py-3 px-4 font-semibold text-white">{r.day}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            Period {r.period} ({r.timeRange})
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {r.subject}
                            {idx === 0 && (
                              <span className="ml-2 text-[11px] font-mono text-red-400">
                                ● NEXT CLASS
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{r.class}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{r.room}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. NEXT CLASS NOTIFICATION WIDGET */}
          {teacherTab === 'next-class' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Next Class Notification &amp; Reminder Control
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure automated 15-minute lead reminders prior to your scheduled lecture
                </p>
              </div>

              <div className="bg-[#0E1018] border border-red-500/40 rounded-xl p-6 space-y-4">
                <div className="text-xs font-mono text-red-400">NEXT CLASS</div>
                <h3 className="font-display text-3xl font-bold text-white">Physics</h3>
                <div className="space-y-1.5 text-sm text-slate-300">
                  <div>
                    <strong className="text-white">Teacher: </strong>
                    {currentUser?.name}
                  </div>
                  <div>
                    <strong className="text-white">Class: </strong>
                    {teacherRec.classTeacherOf || 'Class 9 — BS1'}
                  </div>
                  <div>
                    <strong className="text-white">Room: </strong>
                    Room 304 (Science Block)
                  </div>
                  <div>
                    <strong className="text-white">Time: </strong>
                    09:30 AM – 10:15 AM
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#090A0F] border border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Live Countdown</span>
                  <span className="font-mono text-lg font-bold text-emerald-400">
                    Starts in {countdownMinutes} minutes
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      15-Minute Prior Notification Alert
                    </div>
                    <div className="text-[11px] text-slate-400">
                      “Your next class starts in 15 minutes.”
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReminderEnabled(!reminderEnabled);
                      showToast(
                        !reminderEnabled
                          ? 'Reminder Enabled: “Your next class starts in 15 minutes.”'
                          : 'Next class reminder disabled.'
                      );
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      reminderEnabled ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {reminderEnabled ? 'Reminders ON' : 'Reminders OFF'}
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCountdownMinutes(15);
                      triggerNextClassNotification(15);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold cursor-pointer active:scale-95 transition-all"
                  >
                    🔔 Send Next Class Notification Alert Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 6. RESULTS MANAGEMENT */}
          {teacherTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Results Management &amp; Automated GPA Calculator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authorized subjects for {currentUser?.name}: {teacherRec.authorizedSubjects.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={resSubjectId}
                    onChange={(e) => setResSubjectId(e.target.value)}
                    className="bg-[#0E1018] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    {db.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {teacherRec.authorizedSubjects.includes(s.name) ? '✓ Authorized' : '🔒 Unauthorized'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Statistics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Highest Mark</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {classResultStats.highest} / 100
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Lowest Mark</div>
                  <div className="font-mono text-2xl font-bold text-amber-400 mt-1 tabular-nums">
                    {classResultStats.lowest} / 100
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Class Average</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {classResultStats.avg}%
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Pass Rate</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {classResultStats.passRate}%
                  </div>
                </div>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090A0F] border-b border-white/10 font-mono text-slate-400">
                      <th className="py-3 px-4">Roll &amp; Student</th>
                      <th className="py-3 px-4">Enter Marks ({resSubjectFullMarks})</th>
                      <th className="py-3 px-4">Subject Grade</th>
                      <th className="py-3 px-4">Subject GP</th>
                      <th className="py-3 px-4">Overall Term CGPA</th>
                      <th className="py-3 px-4 text-right">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedClassStudents.map((st) => {
                      const usr = db.users.find((u) => u.id === st.user_id);
                      const studentFullName = getAuthoritativeStudentName(st, usr);
                      const val = marksDraft[st.id] ?? 80;
                      const { grade, gpa } = calculateGradeAndGpa(val, resSubjectFullMarks);
                      const overallGpaInfo = studentOverallGpaMap[st.id];
                      return (
                        <tr key={st.id}>
                          <td className="py-3 px-4 font-semibold text-white">
                            Roll {String(st.roll).padStart(2, '0')} · {studentFullName} ({st.student_id})
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              max={resSubjectFullMarks}
                              value={val}
                              onChange={(e) =>
                                setMarksDraft((prev) => ({
                                  ...prev,
                                  [st.id]: Number(e.target.value)
                                }))
                              }
                              className="w-24 bg-[#090A0F] border border-white/15 rounded px-2.5 py-1 font-mono text-white"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {grade}
                          </td>
                          <td className="py-3 px-4 font-mono text-white tabular-nums">
                            {gpa.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400 tabular-nums">
                            {overallGpaInfo?.gpa || gpa.toFixed(2)} ({overallGpaInfo?.grade || grade})
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() =>
                                saveStudentResult(
                                  st.id,
                                  resSubjectId,
                                  val,
                                  'Updated via Teacher Results Portal'
                                )
                              }
                              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                            >
                              Save Result
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. CT & EXAM MANAGEMENT */}
          {teacherTab === 'exams' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-[#0A0A0A] border border-white/15 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-white">
                  Schedule New CT or Examination
                </h2>
                <p className="text-xs text-neutral-400">
                  Published tests immediately appear for all students of the selected class in their Student Portal.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-300 mb-1">Exam / CT Title</label>
                    <input
                      type="text"
                      value={ctName}
                      onChange={(e) => setCtName(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-300 mb-1">Target Class</label>
                      <select
                        value={ctClass}
                        onChange={(e) => setCtClass(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Class 6">Class 6 (All Students)</option>
                        <option value="Class 7">Class 7 (All Students)</option>
                        <option value="Class 8">Class 8 (All Students)</option>
                        <option value="Class 9">Class 9 (All Students)</option>
                        <option value="Class 10">Class 10 (All Students)</option>
                        <option value="All Classes">All Classes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-300 mb-1">Category</label>
                      <select
                        value={ctType}
                        onChange={(e) => setCtType(e.target.value as ExamRecord['type'])}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Class Test">Class Test</option>
                        <option value="Monthly Test">Monthly Test</option>
                        <option value="Half-Yearly Examination">Half-Yearly Examination</option>
                        <option value="Pre-Test">Pre-Test</option>
                        <option value="Final Examination">Final Examination</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-300 mb-1">Subject</label>
                      <input
                        type="text"
                        value={ctSubject}
                        onChange={(e) => setCtSubject(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={ctDate}
                        onChange={(e) => setCtDate(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-300 mb-1">Time Slot</label>
                      <input
                        type="text"
                        value={ctTime}
                        onChange={(e) => setCtTime(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Syllabus Chapters</label>
                    <input
                      type="text"
                      value={ctSyllabus}
                      onChange={(e) => setCtSyllabus(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Room</label>
                    <input
                      type="text"
                      value={ctRoom}
                      onChange={(e) => setCtRoom(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <button
                    onClick={() =>
                      createExamOrCT({
                        name: ctName,
                        type: ctType,
                        subject: ctSubject,
                        class: ctClass,
                        date: ctDate,
                        time: ctTime,
                        syllabus: ctSyllabus,
                        room: ctRoom
                      })
                    }
                    className="w-full py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold cursor-pointer mt-2"
                  >
                    Publish CT / Exam to All {ctClass} Students
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-3">
                <h3 className="font-display text-lg font-bold text-white">
                  Active Scheduled CTs &amp; Exams ({db.exams.length})
                </h3>
                {db.exams.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-[#0A0A0A] border border-white/15 rounded-xl p-4"
                  >
                    <div className="flex justify-between text-xs text-neutral-400 mb-1">
                      <span>{ex.type} · {ex.subject} · <strong className="text-white">{ex.class}</strong></span>
                      <span className="font-mono text-white">{ex.date}</span>
                    </div>
                    <div className="font-display text-base font-bold text-white">
                      {ex.name}
                    </div>
                    <div className="text-xs text-neutral-300 mt-1">
                      Syllabus: {ex.syllabus} · {ex.room}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. ASSIGNMENT MANAGEMENT */}
          {teacherTab === 'assignments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#0E1018] border border-white/10 rounded-xl p-6 space-y-4">
                <h2 className="font-display text-xl font-bold text-white">
                  Create Class Assignment
                </h2>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Assignment Title</label>
                    <input
                      type="text"
                      value={asgTitle}
                      onChange={(e) => setAsgTitle(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Subject</label>
                      <input
                        type="text"
                        value={asgSubject}
                        onChange={(e) => setAsgSubject(e.target.value)}
                        className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={asgDue}
                        onChange={(e) => setAsgDue(e.target.value)}
                        className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Instructions</label>
                    <textarea
                      rows={3}
                      value={asgDesc}
                      onChange={(e) => setAsgDesc(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <button
                    onClick={() =>
                      createAssignment({
                        teacher: currentUser?.name || 'Saif Chowdhury',
                        teacher_id: 'tch-1',
                        class: teacherRec.classTeacherOf || 'Class 9 — BS1',
                        subject: asgSubject,
                        title: asgTitle,
                        description: asgDesc,
                        due_date: asgDue
                      })
                    }
                    className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                  >
                    Post Assignment to {teacherRec.classTeacherOf || 'Class 9 — BS1'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Submission Tracking
                </h3>
                {db.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-[#0E1018] border border-white/10 rounded-xl p-5"
                  >
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{a.subject} · {a.class}</span>
                      <span className="font-mono">Due: {a.due_date}</span>
                    </div>
                    <h4 className="font-display text-base font-bold text-white mb-2">
                      {a.title}
                    </h4>
                    <div className="flex items-center gap-6 text-xs font-mono pt-2 border-t border-white/10">
                      <span className="text-emerald-400">
                        ✓ Submitted: {a.totalSubmissions ?? 0}
                      </span>
                      <span className="text-amber-400">
                        ◐ Pending: {a.pendingCount ?? 0}
                      </span>
                      <span className="text-red-400">
                        ▲ Late: {a.lateCount ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. NOTICES & CLASS ANNOUNCEMENTS */}
          {teacherTab === 'notices' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Broadcast Notice / Class Announcement
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send announcements directly to {teacherRec.classTeacherOf || 'Class 9 — BS1'} or the public school bulletin
                </p>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Announcement Headline</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Category</label>
                    <select
                      value={noticeCategory}
                      onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Exam">Exam</option>
                      <option value="Important">Important</option>
                      <option value="Event">Event</option>
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Target Audience</label>
                    <select
                      value={noticeTarget}
                      onChange={(e) => setNoticeTarget(e.target.value as 'Class 9 — BS1' | 'public')}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Class 9 — BS1">Class 9 — BS1</option>
                      <option value="public">Entire School (Public &amp; Portals)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeImportant}
                    onChange={(e) => setNoticeImportant(e.target.checked)}
                  />
                  <span>Mark with ★ Important Priority Indicator</span>
                </label>
                <button
                  onClick={() =>
                    createNotice({
                      title: noticeTitle,
                      content: noticeContent,
                      category: noticeCategory,
                      target: noticeTarget,
                      created_by: currentUser?.name || 'Saif Chowdhury',
                      important: noticeImportant
                    })
                  }
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                >
                  Send Notice Now
                </button>
              </div>
            </div>
          )}

          {/* 10. PREVIOUS QUESTIONS UPLOAD */}
          {teacherTab === 'questions' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Upload Previous Question Paper
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add structured past papers to the Student Question Library
                </p>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Paper Title</label>
                  <input
                    type="text"
                    value={pqTitle}
                    onChange={(e) => setPqTitle(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={pqSubject}
                      onChange={(e) => setPqSubject(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Year</label>
                    <input
                      type="number"
                      value={pqYear}
                      onChange={(e) => setPqYear(Number(e.target.value))}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Chapter</label>
                    <input
                      type="text"
                      value={pqChapter}
                      onChange={(e) => setPqChapter(e.target.value)}
                      className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    Question Paper Content (One question per line)
                  </label>
                  <textarea
                    rows={5}
                    value={pqText}
                    onChange={(e) => setPqText(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <button
                  onClick={() =>
                    uploadPreviousQuestion({
                      title: pqTitle,
                      subject: pqSubject,
                      class: 'Class 9',
                      year: pqYear,
                      exam: pqExam,
                      chapter: pqChapter,
                      duration: '45 Minutes',
                      fullMarks: 25,
                      questionsText: pqText.split('\n').filter(Boolean),
                      uploadedBy: currentUser?.name || 'Saif Chowdhury'
                    })
                  }
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                >
                  Publish Question Paper to Student Archive
                </button>
              </div>
            </div>
          )}

          {/* 11. STUDENT PERFORMANCE ANALYTICS */}
          {teacherTab === 'performance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Student Performance &amp; Diagnostic Analytics
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect individual student academic trajectory, attendance, and Brainify quiz accuracy
                  </p>
                </div>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-[#0E1018] border border-white/15 rounded-lg px-3.5 py-2 text-xs text-white"
                >
                  {db.students.map((st) => {
                    const u = db.users.find((usr) => usr.id === st.user_id);
                    const fullName = getAuthoritativeStudentName(st, u);
                    const gpaInfo = studentOverallGpaMap[st.id];
                    return (
                      <option key={st.id} value={st.id}>
                        Roll {st.roll} — {fullName} ({st.student_id}) · GPA {gpaInfo?.gpa}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Section Average</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1">86.4%</div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Student Attendance</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">93%</div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Brainify Quiz Accuracy</div>
                  <div className="font-mono text-2xl font-bold text-cyan-400 mt-1">
                    {Math.round(
                      (db.brainify.correctAnswers / (db.brainify.questionsAnswered || 1)) * 100
                    )}
                    %
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Recommended Focus</div>
                  <div className="font-display text-sm font-bold text-amber-300 mt-2">
                    Bangla Prose &amp; Plant Vascular Tissue
                  </div>
                </div>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6">
                <h3 className="font-display text-base font-bold text-white mb-4">
                  Comparative Subject Mastery
                </h3>
                <div className="space-y-3">
                  {db.results
                    .filter((r) => r.student_id === selectedStudentId)
                    .map((r) => {
                      const pct = Math.round((r.marks / r.fullMarks) * 100);
                      return (
                        <div key={r.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-medium">{r.subjectName}</span>
                            <span className="font-mono text-slate-400">
                              {r.marks}/{r.fullMarks} ({pct}%) · Grade {r.grade}
                            </span>
                          </div>
                          <div className="h-2.5 bg-[#090A0F] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <TeacherAnalyticsCharts
                selectedClassId={selectedClassId}
                onSelectClassId={setSelectedClassId}
                onSelectDate={(dateStr) => {
                  setAttendanceDate(dateStr);
                  setTeacherTab('attendance');
                }}
              />
            </div>
          )}

          {/* 1B. CLASS TEACHER STUDENT REGISTRATION APPROVALS */}
          {teacherTab === 'approvals' && (
            <div className="space-y-6 animate-smooth-in">
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-white/15">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      Class Teacher Student Approvals — {teacherRec.classTeacherOf}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Review and approve or reject student registration requests routed to {currentUser?.name} ({teacherRec.classTeacherOf}).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 font-mono text-xs text-white font-bold">
                    {pendingSectionApprovalsCount} Pending
                  </span>
                </div>

                {myAssignedSectionRequests.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-black border border-white/10 space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <div className="font-display text-sm font-bold text-white">
                      No Registration Requests for {teacherRec.classTeacherOf}
                    </div>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      When a new student registers and selects {teacherRec.classTeacherOf}, their approval request is automatically routed here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myAssignedSectionRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-black border border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-sm text-white">
                              {req.student_name}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">
                              {req.class_name} — {req.section}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs text-emerald-300">
                              ID: {req.student_code}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                                req.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : req.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-400 font-mono">
                            Email: {req.student_email} · Submitted:{' '}
                            {new Date(req.created_at).toLocaleString()}
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => approveStudentAccount(req.student_id)}
                              className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer"
                            >
                              Approve Student
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectStudentAccount(req.student_id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-xs cursor-pointer"
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
            </div>
          )}

          {/* 12. TEACHER PROFILE */}
          {teacherTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-display text-2xl font-bold text-white">
                Teacher Profile
              </h2>
              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-slate-400 block">Employee ID</span>
                    <span className="font-mono text-white font-bold">{teacherRec.employee_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department</span>
                    <span className="text-white font-bold">{teacherRec.department}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Contact Placeholder</label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={() => updateProfile(profName, profPhone)}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </div>
          )}

          {/* 13. SETTINGS */}
          {teacherTab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <h2 className="font-display text-2xl font-bold text-white">
                Teacher Portal Settings
              </h2>
              <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6 space-y-5">
                <div>
                  <div className="font-display text-sm font-bold text-white mb-1">
                    Change Account Password
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">
                    Update your teacher access password securely.
                  </p>
                  {tchPassMsg && (
                    <div className="mb-3 p-2.5 rounded-lg bg-white/5 border border-white/15 text-xs text-emerald-300">
                      {tchPassMsg}
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const res = await changeAccountPassword(tchCurrPass, tchNewPass);
                      setTchPassMsg(res.message);
                      if (res.ok) {
                        setTchCurrPass('');
                        setTchNewPass('');
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    <input
                      type="password"
                      value={tchCurrPass}
                      onChange={(e) => setTchCurrPass(e.target.value)}
                      placeholder="Current password"
                      required
                      className="px-3 py-2 rounded-lg bg-black border border-white/15 text-xs text-white"
                    />
                    <input
                      type="password"
                      value={tchNewPass}
                      onChange={(e) => setTchNewPass(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      required
                      minLength={6}
                      className="px-3 py-2 rounded-lg bg-black border border-white/15 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold cursor-pointer"
                    >
                      Update Password
                    </button>
                  </form>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white font-medium">Reset Demo Database</span>
                  <button
                    onClick={resetDemoData}
                    className="px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold cursor-pointer"
                  >
                    Reset Demo Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
