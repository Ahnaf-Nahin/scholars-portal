import React, { useState, useMemo, useEffect } from 'react';
import {
  usePlatform,
  StudentTab,
  SUBJECT_SEQUENCE,
  getClassTeacherForSection,
  calculateGradeAndGpa
} from '../context/PlatformContext';
import { getAuthoritativeStudentName, findPreRegisteredStudent } from '../data/studentCredentials';
import { PortalHeaderBar } from './PortalHeaderBar';
import { StudentAcademicOverview } from './StudentAcademicOverview';
import { StudentAcademicCalendar } from './StudentAcademicCalendar';
import { StudentDigitalLibrary } from './StudentDigitalLibrary';
import { Floating3DShapesLayer, Cube3DObject, Square3DObject } from './Animated3DObjectsBanner';
import {
  DayOfWeek,
  PreviousQuestionRecord,
  ResultRecord,
  ComplaintCategory,
  ComplaintSeverity
} from '../types/database';
import brainifyLabImg from '../assets/images/brainify_science_lab_1791271489506.jpg';
import {
  LayoutDashboard,
  Award,
  CalendarCheck,
  BookOpen,
  Clock,
  FileSpreadsheet,
  Archive,
  Trophy,
  Bell,
  ClipboardList,
  CalendarDays,
  Atom,
  User,
  Settings,
  Download,
  Eye,
  Upload,
  Menu,
  X,
  CheckCircle2,
  MessageSquareWarning,
  Send,
  Inbox,
  Trash2,
  Library
} from 'lucide-react';

const DAYS_ORDER: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export const StudentPortal: React.FC = () => {
  const {
    db,
    currentUser,
    studentTab,
    setStudentTab,
    openBrainify,
    submitStudentAssignment,
    submitStudentComplaint,
    deleteStudentComplaint,
    markComplaintReplyViewed,
    markComplaintSeenByTeacher,
    changeAccountPassword,
    updateProfile,
    soundEnabled,
    toggleSound,
    resetDemoData
  } = usePlatform();

  // Retrieve current student record (matches by studentIdCode, email code, or user_id)
  const studentRec = useMemo(() => {
    const emailExtractedCode =
      currentUser?.email?.toLowerCase().startsWith('student_')
        ? currentUser.email.toLowerCase().replace('student_', '').replace('@ssc.edu', '').toUpperCase()
        : '';
    const candidateCode = (currentUser?.studentIdCode || emailExtractedCode || '').trim().toUpperCase();
    const preReg = candidateCode ? findPreRegisteredStudent(candidateCode) : null;
    const effectiveCode = preReg?.code || candidateCode;

    const matched =
      db.students.find(
        (s) =>
          (effectiveCode && s.student_id.toUpperCase() === effectiveCode.toUpperCase()) ||
          s.user_id === currentUser?.id
      ) || db.students[0];

    const resolvedName = getAuthoritativeStudentName(matched, currentUser);

    return {
      ...matched,
      name: resolvedName,
      student_id: effectiveCode || matched.student_id,
      class: preReg?.className || currentUser?.studentClass || matched.class,
      section: preReg?.section || currentUser?.section || matched.section
    };
  }, [db.students, currentUser]);

  // Student results (ensure every subject's grade and gpa is synchronized with its marks & fullMarks)
  const myResults = useMemo(() => {
    const raw = db.results.filter((r) => r.student_id === studentRec.id);
    return raw.map((r) => {
      const { grade, gpa } = calculateGradeAndGpa(r.marks, r.fullMarks);
      return {
        ...r,
        grade,
        gpa
      };
    });
  }, [db.results, studentRec.id]);

  // Student attendance
  const myAttendance = useMemo(
    () => db.attendance.filter((a) => a.student_id === studentRec.id),
    [db.attendance, studentRec.id]
  );

  // Attendance stats
  const attStats = useMemo(() => {
    const schoolDays = myAttendance.filter((a) => a.status !== 'Holiday');
    const present = schoolDays.filter((a) => a.status === 'Present').length;
    const late = schoolDays.filter((a) => a.status === 'Late').length;
    const absent = schoolDays.filter((a) => a.status === 'Absent').length;
    const total = schoolDays.length || 1;
    const pct = Math.round(((present + late * 0.5) / total) * 100);
    return { present, late, absent, total: schoolDays.length, pct };
  }, [myAttendance]);

  // Dynamic Merit Position in Section based on all students in this class & section
  const sectionMeritInfo = useMemo(() => {
    const peers = db.students.filter(
      (s) =>
        s.class.toLowerCase() === studentRec.class.toLowerCase() &&
        s.section.toLowerCase() === studentRec.section.toLowerCase()
    );
    const rankings = peers
      .map((peer) => {
        const peerRes = db.results.filter((r) => r.student_id === peer.id);
        const count = peerRes.length || 1;
        const sumGpa = peerRes.reduce((acc, r) => {
          const { gpa } = calculateGradeAndGpa(r.marks, r.fullMarks);
          return acc + gpa;
        }, 0);
        const avgGpa = sumGpa / count;
        const totalMarks = peerRes.reduce((acc, r) => acc + r.marks, 0);
        return {
          studentId: peer.id,
          roll: peer.roll,
          avgGpa,
          totalMarks
        };
      })
      .sort((a, b) => {
        if (Math.abs(b.avgGpa - a.avgGpa) > 0.001) return b.avgGpa - a.avgGpa;
        if (b.totalMarks !== a.totalMarks) return b.totalMarks - a.totalMarks;
        return a.roll - b.roll;
      });

    const idx = rankings.findIndex((r) => r.studentId === studentRec.id);
    const rank = idx >= 0 ? idx + 1 : 1;
    const suffix =
      rank % 10 === 1 && rank % 100 !== 11
        ? 'st'
        : rank % 10 === 2 && rank % 100 !== 12
        ? 'nd'
        : rank % 10 === 3 && rank % 100 !== 13
        ? 'rd'
        : 'th';
    return {
      rank,
      totalPeers: peers.length || 35,
      label: `${rank}${suffix} in Section`
    };
  }, [db.students, db.results, studentRec.id, studentRec.class, studentRec.section]);

  // Result summary stats with transparent GPA calculation breakdown
  const resultSummary = useMemo(() => {
    if (myResults.length === 0) {
      return {
        totalObtained: 0,
        totalFull: 0,
        avgPct: 0,
        totalGradePoints: '0.00',
        maxGradePoints: '40.00',
        subjectCount: 0,
        gpa: '0.00',
        overallLetterGrade: 'N/A',
        highest: null,
        weakest: null
      };
    }
    const totalObtained = myResults.reduce((acc, r) => acc + r.marks, 0);
    const totalFull = myResults.reduce((acc, r) => acc + r.fullMarks, 0);
    const avgPct = Math.round((totalObtained / (totalFull || 1)) * 100);
    const rawTotalGp = myResults.reduce((acc, r) => acc + r.gpa, 0);
    const subjectCount = myResults.length;
    const numericGpa = rawTotalGp / subjectCount;
    const avgGpa = numericGpa.toFixed(2);
    const overallLetterGrade =
      numericGpa >= 5.0
        ? 'A+'
        : numericGpa >= 4.0
        ? 'A'
        : numericGpa >= 3.5
        ? 'A-'
        : numericGpa >= 3.0
        ? 'B'
        : numericGpa >= 2.0
        ? 'C'
        : numericGpa >= 1.0
        ? 'D'
        : 'F';
    const sortedByPct = [...myResults].sort(
      (a, b) => b.marks / b.fullMarks - a.marks / a.fullMarks
    );
    return {
      totalObtained,
      totalFull,
      avgPct,
      totalGradePoints: rawTotalGp.toFixed(2),
      maxGradePoints: (subjectCount * 5).toFixed(2),
      subjectCount,
      gpa: avgGpa,
      overallLetterGrade,
      highest: sortedByPct[0],
      weakest: sortedByPct[sortedByPct.length - 1]
    };
  }, [myResults]);

  const getGradingScaleTier = (pct: number) => {
    if (pct >= 80) return '80% – 100% (A+ · 5.00)';
    if (pct >= 70) return '70% – 79% (A · 4.00)';
    if (pct >= 60) return '60% – 69% (A- · 3.50)';
    if (pct >= 50) return '50% – 59% (B · 3.00)';
    if (pct >= 40) return '40% – 49% (C · 2.00)';
    if (pct >= 33) return '33% – 39% (D · 1.00)';
    return '0% – 32% (F · 0.00)';
  };

  // Local UI state for modals & filters
  const [selectedResultDetail, setSelectedResultDetail] = useState<ResultRecord | null>(null);
  const [syllabusSubjectFilter, setSyllabusSubjectFilter] = useState<string>('All');
  const [pqSubjectFilter, setPqSubjectFilter] = useState<string>('All');
  const [pqYearFilter, setPqYearFilter] = useState<string>('All');
  const [pqSearch, setPqSearch] = useState<string>('');
  const [previewPaper, setPreviewPaper] = useState<PreviousQuestionRecord | null>(null);
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<string>('All');
  const [uploadModalAsgId, setUploadModalAsgId] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('Aryan_Class9_BS2_LabReport.pdf');
  const [profileName, setProfileName] = useState(currentUser?.name || 'Ahnaf Nahin Shahariar');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '[Demo Phone: +880-0000-000001]');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Student Complaint Form State (Direct to Respective Class Teacher's Complaint Box)
  const [stdComplaintCategory, setStdComplaintCategory] =
    useState<ComplaintCategory>('Academic / Subject Issue');
  const [stdComplaintSeverity, setStdComplaintSeverity] =
    useState<ComplaintSeverity>('Medium');
  const [stdComplaintTitle, setStdComplaintTitle] = useState<string>('');
  const [stdComplaintMessage, setStdComplaintMessage] = useState<string>('');
  const [stdComplaintBanner, setStdComplaintBanner] = useState<string | null>(null);
  const [stdComplaintReadFilter, setStdComplaintReadFilter] = useState<'unread' | 'read'>('unread');
  const [localReadComplaintIds, setLocalReadComplaintIds] = useState<Record<string, boolean>>({});

  const myClassTeacherMeta = useMemo(
    () => getClassTeacherForSection(studentRec.class, studentRec.section),
    [studentRec.class, studentRec.section]
  );

  const isStudentComplaintRead = (c: (typeof db.complaints)[number]) =>
    Boolean(
      localReadComplaintIds[c.id] ||
        c.seen_by_teacher ||
        c.read_by_teacher ||
        c.status === 'Replied' ||
        c.status === 'Resolved'
    );

  const myStudentComplaints = useMemo(() => {
    const filtered = (db.complaints || []).filter(
      (c) =>
        c.student_code.toUpperCase() === studentRec.student_id.toUpperCase() ||
        c.student_id === studentRec.id
    );
    // Always sort Unread first, then by created_at descending
    return [...filtered].sort((a, b) => {
      const aRead = Boolean(
        localReadComplaintIds[a.id] ||
          a.seen_by_teacher ||
          a.read_by_teacher ||
          a.status === 'Replied' ||
          a.status === 'Resolved'
      );
      const bRead = Boolean(
        localReadComplaintIds[b.id] ||
          b.seen_by_teacher ||
          b.read_by_teacher ||
          b.status === 'Replied' ||
          b.status === 'Resolved'
      );
      if (aRead !== bRead) return aRead ? 1 : -1;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [db.complaints, studentRec.student_id, studentRec.id, localReadComplaintIds]);

  const unreadStudentComplaints = useMemo(
    () => myStudentComplaints.filter((c) => !isStudentComplaintRead(c)),
    [myStudentComplaints, localReadComplaintIds]
  );

  const readStudentComplaints = useMemo(
    () => myStudentComplaints.filter((c) => isStudentComplaintRead(c)),
    [myStudentComplaints, localReadComplaintIds]
  );

  // Step 4 of Complaint Notification Bug:
  // When the student opens the Complaints tab and views replies, mark their reply notifications as read
  useEffect(() => {
    if (studentTab === 'complaints') {
      myStudentComplaints.forEach((c) => {
        if (c.class_teacher_note || c.status === 'Replied' || c.status === 'Resolved') {
          markComplaintReplyViewed(c.id);
        }
      });
    }
  }, [studentTab, myStudentComplaints, markComplaintReplyViewed]);

  const [currPassInput, setCurrPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [passChangeStatus, setPassChangeStatus] = useState<string | null>(null);
  const [librarySubjectPreset, setLibrarySubjectPreset] = useState<string>('All');

  const handleStudentSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitStudentComplaint({
      studentId: studentRec.id,
      category: stdComplaintCategory,
      severity: stdComplaintSeverity,
      subjectTitle: stdComplaintTitle,
      complaintText: stdComplaintMessage
    });
    if (res.ok) {
      setStdComplaintBanner(res.message);
      setStdComplaintTitle('');
      setStdComplaintMessage('');
    } else {
      setStdComplaintBanner(res.message);
    }
  };

  useEffect(() => {
    if (currentUser?.name) setProfileName(currentUser.name);
    if (currentUser?.phone) setProfilePhone(currentUser.phone);
  }, [currentUser?.name, currentUser?.phone]);

  const pendingAssignmentsCount = db.assignments.filter((a) => a.status !== 'Submitted').length;

  // All students of a class see CTs/Exams published for their class (or All Classes)
  const myClassExams = useMemo(() => {
    const myClassBase = (studentRec.class || 'Class 9').split('—')[0].trim();
    return db.exams.filter((ex) => {
      if (!ex.class || ex.class === 'All Classes') return true;
      const exClassBase = ex.class.split('—')[0].trim();
      return (
        exClassBase.toLowerCase() === myClassBase.toLowerCase() ||
        ex.class.toLowerCase().includes(myClassBase.toLowerCase())
      );
    });
  }, [db.exams, studentRec.class]);

  const nextExam = myClassExams[0];

  const navItems: Array<{
    id: StudentTab | 'brainify-launch';
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'complaints',
      label: 'Complaint Box',
      icon: <MessageSquareWarning className="w-4 h-4" />,
      badge: myStudentComplaints.length
    },
    { id: 'results', label: 'My Results', icon: <Award className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'syllabus', label: 'Syllabus', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'library', label: 'Digital Library', icon: <Library className="w-4 h-4" /> },
    { id: 'routine', label: 'Class Routine', icon: <Clock className="w-4 h-4" /> },
    { id: 'exams', label: 'Exams & CTs', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'questions', label: 'Previous Questions', icon: <Archive className="w-4 h-4" /> },
    { id: 'activities', label: 'Extracurricular', icon: <Trophy className="w-4 h-4" /> },
    { id: 'notices', label: 'Notices', icon: <Bell className="w-4 h-4" /> },
    { id: 'assignments', label: 'Assignments', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'calendar', label: 'School Calendar', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'brainify-launch', label: 'Chronos (Interactive Learning)', icon: <Atom className="w-4 h-4 text-purple-400" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  const handleDownloadQuestionPaper = (pq: PreviousQuestionRecord) => {
    const content = [
      '====================================================================',
      "                   SCHOLAR'S SCHOOL & COLLEGE                       ",
      `          ${pq.title.toUpperCase()}`,
      '====================================================================',
      `Class: ${pq.class} | Subject: ${pq.subject} | Year: ${pq.year}`,
      `Exam: ${pq.exam} | Syllabus: ${pq.chapter}`,
      `Duration: ${pq.duration} | Full Marks: ${pq.fullMarks}`,
      '--------------------------------------------------------------------',
      '',
      ...pq.questionsText,
      '',
      '--------------------------------------------------------------------',
      `Uploaded by: ${pq.uploadedBy} · Scholar's School & College Archive`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pq.year}_${pq.subject}_${pq.exam.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const computeDaysRemaining = (dateStr: string) => {
    const ref = new Date('2026-10-06T00:00:00');
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} Days Remaining` : diff === 0 ? 'Today' : 'Completed';
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <PortalHeaderBar
        portalTitle="SCHOLAR'S SCHOOL & COLLEGE · STUDENT PORTAL"
        accentMode="crimson"
        onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        isMenuOpen={isMenuOpen}
      />

      <div className="flex-1 flex flex-col max-w-[1440px] w-full mx-auto relative">
        {/* Left-Side Slide-Out Navigation Drawer (Opened after clicking Menu) */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0A] border-r border-white/15 p-5 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header + Student Identity */}
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/15">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center font-display text-base font-bold text-white shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-white truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] font-mono text-white font-semibold truncate">
                  Student ID: {studentRec.student_id}
                </p>
                <p className="text-[11px] font-mono text-neutral-400 truncate">
                  {studentRec.class} — {studentRec.section} · Roll {String(studentRec.roll).padStart(2, '0')}
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

          {/* Vertical Left Navigation List */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isBrainify = item.id === 'brainify-launch';
              const isActive = !isBrainify && studentTab === item.id;
              if (isBrainify) {
                return (
                  <a
                    key={item.id}
                    href="https://chronotoolkit.netlify.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 border border-purple-500/35 mt-1"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setStudentTab(item.id as StudentTab);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
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
                        isActive ? 'bg-black text-white' : 'bg-white text-black'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Viewport */}
        <main key={studentTab} className="flex-1 p-3 sm:p-5 md:p-8 pb-10 min-w-0 animate-smooth-in relative">
          {/* Ambient 3D Squares & Cubes scattered across different places in Student Portal */}
          <Floating3DShapesLayer variant="student" />

          {/* STUDENT HEADER BANNER */}
          <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-3.5 sm:p-5 mb-4 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center font-display text-base sm:text-xl font-bold text-white shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-base sm:text-xl md:text-2xl font-bold text-white truncate">
                    {currentUser?.name}
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white text-black font-mono text-xs font-extrabold tracking-tight">
                    Student ID: {studentRec.student_id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-neutral-300 mt-1 font-mono">
                  <span>{studentRec.class}</span>
                  <span>·</span>
                  <span>Section {studentRec.section}</span>
                  <span>·</span>
                  <span>Roll {String(studentRec.roll).padStart(2, '0')}</span>
                  <span>·</span>
                  <span className="text-neutral-400">
                    Class Teacher: <strong className="text-white">{myClassTeacherMeta.defaultName}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 1. DASHBOARD VIEW */}
          {studentTab === 'dashboard' && (
            <div className="space-y-6 sm:space-y-8 relative z-20">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div
                  onClick={() => setStudentTab('attendance')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-3.5 sm:p-4 cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs text-neutral-400 mb-1">Attendance</div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {attStats.pct}%
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                    {attStats.present} Present · {attStats.absent} Absent
                  </div>
                </div>

                <div
                  onClick={() => setStudentTab('results')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-3.5 sm:p-4 cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs text-neutral-400 mb-1">Average Result</div>
                  <div className="font-mono text-lg sm:text-2xl font-bold text-white tabular-nums">
                    {resultSummary.avgPct}% · GPA {resultSummary.gpa}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                    Section Position: 2nd
                  </div>
                </div>

                <div
                  onClick={() => setStudentTab('exams')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-3.5 sm:p-4 cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs text-neutral-400 mb-1">Upcoming Exam</div>
                  <div className="font-display text-sm sm:text-base font-bold text-white truncate">
                    {nextExam ? nextExam.name : 'All Caught Up'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono text-neutral-300 mt-1">
                    {nextExam ? computeDaysRemaining(nextExam.date) : 'No pending CTs'}
                  </div>
                </div>

                <div
                  onClick={() => setStudentTab('assignments')}
                  className="bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-3.5 sm:p-4 cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs text-neutral-400 mb-1">Active Tasks</div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {pendingAssignmentsCount}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                    Class Assignments
                  </div>
                </div>

                <div
                  onClick={() => openBrainify('progress')}
                  className="col-span-2 sm:col-span-1 bg-[#0A0A0A] border border-white/15 hover:border-white/35 rounded-2xl p-3.5 sm:p-4 cursor-pointer"
                >
                  <div className="text-[11px] sm:text-xs text-neutral-400 mb-1">Current Streak</div>
                  <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {db.brainify.streak} Days
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                    {db.brainify.xp.toLocaleString()} Learning XP
                  </div>
                </div>
              </div>

              {/* ACADEMIC PERFORMANCE OVERVIEW VISUAL CHARTS COMPONENT */}
              <StudentAcademicOverview
                studentName={studentRec.name}
                studentClass={studentRec.class}
                studentSection={studentRec.section}
                studentRoll={studentRec.roll}
                results={myResults}
                attendance={myAttendance}
                overallGpa={resultSummary.gpa}
                attendancePct={attStats.pct}
                presentDays={attStats.present}
                lateDays={attStats.late}
                absentDays={attStats.absent}
                onViewFullResults={() => setStudentTab('results')}
                onViewFullAttendance={() => setStudentTab('attendance')}
              />

              {/* STUDENT CLASS TEACHER COMPLAINT & MESSAGE QUICK PANEL ON DASHBOARD */}
              <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <MessageSquareWarning className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-sm sm:text-base font-bold text-white">
                        Class Teacher Complaint &amp; Direct Message Box
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-[10px] text-white">
                        To: {myClassTeacherMeta.defaultName} ({studentRec.class} — {studentRec.section})
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Submit academic concerns, classroom issues, or direct messages straight to your Class Teacher&apos;s Complaint Box.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 self-start sm:self-center">
                  <Cube3DObject size={34} accent="cyan" speedSeconds={10} />
                  <button
                    type="button"
                    onClick={() => setStudentTab('complaints')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    Open Complaint Box ({myStudentComplaints.length}) →
                  </button>
                </div>
              </div>

              {/* SUBJECT-WISE GRADE & TOTAL GPA CALCULATION BREAKDOWN DATA TABLE ON DASHBOARD */}
              {myResults.length > 0 && (
                <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display text-base sm:text-lg font-bold text-white">
                          Subject-by-Subject Grade &amp; Total GPA Calculation Breakdown
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-md bg-white text-black font-mono text-xs font-extrabold">
                          Total GPA: {resultSummary.gpa} / 5.00 ({resultSummary.overallLetterGrade})
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Full transparency on how each subject&apos;s marks, percentage, letter grade, and Grade Point (GP) combine to calculate your cumulative GPA:{" "}
                        <span className="font-mono text-white font-semibold">
                          {resultSummary.totalGradePoints} Total GP ÷ {resultSummary.subjectCount} Subjects = {resultSummary.gpa} GPA
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStudentTab('results')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold cursor-pointer shrink-0 self-start sm:self-center"
                    >
                      Open Full Results Table →
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/15 bg-black">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#090A0F] border-b border-white/15 text-[11px] font-mono text-neutral-400">
                          <th className="py-3 px-3.5">Subject &amp; Code</th>
                          <th className="py-3 px-3.5 text-right">Marks / Full</th>
                          <th className="py-3 px-3.5 text-right">Percentage</th>
                          <th className="py-3 px-3.5">Grading Scale Tier</th>
                          <th className="py-3 px-3.5 text-center">Letter Grade</th>
                          <th className="py-3 px-3.5 text-right">Subject GP</th>
                          <th className="py-3 px-3.5 text-right">GPA Share (÷{resultSummary.subjectCount})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {myResults.map((r) => {
                          const subjMeta = db.subjects.find((s) => s.id === r.subject_id);
                          const pct = Math.round((r.marks / r.fullMarks) * 100);
                          const gpaShare = r.gpa / (resultSummary.subjectCount || 8);
                          return (
                            <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                              <td className="py-2.5 px-3.5 whitespace-nowrap">
                                <div className="font-semibold text-white">{r.subjectName}</div>
                                <div className="text-[10px] font-mono text-neutral-400">
                                  {subjMeta?.code || r.subject_id.toUpperCase()} · {subjMeta?.teacherName || 'Subject Teacher'}
                                </div>
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-white tabular-nums whitespace-nowrap">
                                {r.marks} / {r.fullMarks}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-neutral-200 tabular-nums whitespace-nowrap">
                                {pct}%
                              </td>
                              <td className="py-2.5 px-3.5 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                                {getGradingScaleTier(pct)}
                              </td>
                              <td className="py-2.5 px-3.5 text-center font-mono whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                    r.grade === 'A+'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : r.grade === 'A'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {r.grade}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-white tabular-nums whitespace-nowrap">
                                {r.gpa.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-emerald-400 tabular-nums whitespace-nowrap">
                                +{gpaShare.toFixed(3)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#11131C] border-t-2 border-white/25 font-mono text-xs text-white">
                          <td className="py-3 px-3.5 font-bold">
                            TOTAL ({resultSummary.subjectCount} Core Subjects)
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold tabular-nums">
                            {resultSummary.totalObtained} / {resultSummary.totalFull}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-emerald-400 tabular-nums">
                            {resultSummary.avgPct}% Avg
                          </td>
                          <td className="py-3 px-3.5 text-[11px] text-neutral-300">
                            Formula: Sum(GP) ÷ {resultSummary.subjectCount} = {resultSummary.totalGradePoints} ÷ {resultSummary.subjectCount}
                          </td>
                          <td className="py-3 px-3.5 text-center font-extrabold text-white">
                            {resultSummary.overallLetterGrade}
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-neutral-200 tabular-nums">
                            {resultSummary.totalGradePoints} GP
                          </td>
                          <td className="py-3 px-3.5 text-right font-extrabold text-emerald-400 tabular-nums">
                            = {resultSummary.gpa} GPA
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* STUDENT PROGRESS TRACKER */}
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-3">
                    <Square3DObject size={32} accent="purple" speedSeconds={12} />
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        Progress Tracker
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Real-time academic &amp; Chronos progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Cube3DObject size={30} accent="emerald" speedSeconds={9} reverse />
                    <button
                      type="button"
                      onClick={() => openBrainify('progress')}
                      className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold cursor-pointer"
                    >
                      Full Chronos Tracker →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    {
                      label: 'Academic Mastery',
                      pct: resultSummary.avgPct,
                      meta: `GPA ${resultSummary.gpa} / 5.00`
                    },
                    {
                      label: 'Attendance Rate',
                      pct: attStats.pct,
                      meta: `${attStats.present} of ${attStats.total} Days`
                    },
                    {
                      label: 'ReactiMix & Chemistry',
                      pct: Math.min(100, Math.round(db.brainify.activityProgress?.['reactimix'] || 0)),
                      meta:
                        (db.brainify.activityProgress?.['reactimix'] || 0) === 0
                          ? 'Not Started'
                          : 'In Progress'
                    },
                    {
                      label: 'Science & Math Quizzes',
                      pct: Math.min(
                        100,
                        Math.round(
                          ((db.brainify.activityProgress?.['science-quiz'] || 0) +
                            (db.brainify.activityProgress?.['math-quiz'] || 0)) /
                            2
                        )
                      ),
                      meta: `${db.brainify.quizzesCompleted} Quizzes Completed`
                    }
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3.5 rounded-xl bg-black border border-white/15 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{item.label}</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {item.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-all duration-500"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400">{item.meta}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-Column Overview: Upcoming CTs & Today's Routine */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base font-bold text-white">
                      Upcoming CTs &amp; Examinations
                    </h3>
                    <button
                      onClick={() => setStudentTab('exams')}
                      className="text-xs text-white hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {myClassExams.slice(0, 3).map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3.5 rounded-lg bg-black border border-white/15 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-display text-sm font-bold text-white">
                            {ex.name}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {ex.subject} · {ex.class} · {ex.syllabus}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-semibold text-white">
                            {computeDaysRemaining(ex.date)}
                          </div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            {ex.date}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base font-bold text-white">
                      Latest Class &amp; School Notices
                    </h3>
                    <button
                      onClick={() => setStudentTab('notices')}
                      className="text-xs text-white hover:underline cursor-pointer"
                    >
                      All Notices →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {db.notices.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        className="p-3.5 rounded-lg bg-black border border-white/15"
                      >
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-1">
                          {n.important && <span className="text-white font-semibold">★ Important</span>}
                          <span>{n.category}</span>
                          <span>·</span>
                          <span className="font-mono">{n.date}</span>
                        </div>
                        <div className="font-display text-sm font-bold text-white">
                          {n.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DIGITAL LIBRARY & PDF LECTURE NOTES QUICK ACCESS */}
              <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-white">
                      Digital Library &amp; Course PDF Lecture Notes
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Browse course-specific lecture notes, formula sheets, and solved booklets across all 8 subjects
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLibrarySubjectPreset('All');
                      setStudentTab('library');
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Library className="w-3.5 h-3.5" />
                    <span>Open Digital Library →</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {SUBJECT_SEQUENCE.map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => {
                        setLibrarySubjectPreset(subj);
                        setStudentTab('library');
                      }}
                      className="p-3 rounded-xl bg-black border border-white/15 hover:border-white/40 text-left transition-all cursor-pointer group"
                    >
                      <div className="font-display text-xs font-bold text-white group-hover:underline">
                        {subj}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        PDF Notes →
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. STUDENT RESULTS VIEW */}
          {studentTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Academic Results &amp; Transparent GPA Breakdown
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Half-Yearly Examination 2026 · {studentRec.name} (ID: {studentRec.student_id}) · {studentRec.class} ({studentRec.section}) · Roll {String(studentRec.roll).padStart(2, '0')}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/25 font-mono text-xs text-white self-start">
                  <span>Formula:</span>
                  <strong className="text-emerald-400">
                    {resultSummary.totalGradePoints} GP ÷ {resultSummary.subjectCount} = {resultSummary.gpa} GPA
                  </strong>
                </div>
              </div>

              {myResults.length === 0 ? (
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-10 text-center">
                  <h3 className="font-display text-lg font-bold text-white mb-1">
                    No Results Yet
                  </h3>
                  <p className="text-xs text-slate-400">
                    You don&apos;t have any published results yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Result Summary Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                      <div className="text-xs text-slate-400">Total Marks</div>
                      <div className="font-mono text-xl font-bold text-white mt-1 tabular-nums">
                        {resultSummary.totalObtained} / {resultSummary.totalFull}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Across {resultSummary.subjectCount} Subjects
                      </div>
                    </div>
                    <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                      <div className="text-xs text-slate-400">Average Marks</div>
                      <div className="font-mono text-xl font-bold text-white mt-1 tabular-nums">
                        {resultSummary.avgPct}%
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Weighted by Full Marks
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-emerald-500/35 rounded-xl p-4">
                      <div className="text-xs text-emerald-300">Cumulative GPA</div>
                      <div className="font-mono text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                        {resultSummary.gpa} / 5.00
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        {resultSummary.totalGradePoints} / {resultSummary.maxGradePoints} GP ({resultSummary.overallLetterGrade})
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-4">
                      <div className="text-xs text-neutral-400">Merit Position</div>
                      <div className="font-mono text-xl font-bold text-white mt-1">
                        {sectionMeritInfo.label}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        Among {sectionMeritInfo.totalPeers} Students
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-4">
                      <div className="text-xs text-neutral-400">Highest Subject</div>
                      <div className="font-display text-sm font-bold text-white mt-1 truncate">
                        {resultSummary.highest?.subjectName} ({resultSummary.highest?.marks}/{resultSummary.highest?.fullMarks})
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                        Grade {resultSummary.highest?.grade} ({resultSummary.highest?.gpa.toFixed(2)})
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-4">
                      <div className="text-xs text-neutral-400">Focus Area</div>
                      <div className="font-display text-sm font-bold text-white mt-1 truncate">
                        {resultSummary.weakest?.subjectName} ({resultSummary.weakest?.marks}/{resultSummary.weakest?.fullMarks})
                      </div>
                      <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                        Grade {resultSummary.weakest?.grade} ({resultSummary.weakest?.gpa.toFixed(2)})
                      </div>
                    </div>
                  </div>

                  {/* GPA Calculation Transparency & NCTB Grading Scale Reference */}
                  <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-white">
                          How Your Total GPA ({resultSummary.gpa} / 5.00) Is Calculated
                        </h3>
                        <p className="text-xs text-neutral-400 mt-1">
                          Each subject is converted to a percentage <span className="font-mono text-white">(Marks ÷ Full Marks × 100)</span>, mapped to an official NCTB Letter Grade and Grade Point (GP), and averaged equally across all {resultSummary.subjectCount} subjects.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-black border border-white/20 font-mono text-xs text-white shrink-0">
                        <div className="text-[10px] text-neutral-400 uppercase mb-1">
                          Exact Mathematical Calculation
                        </div>
                        <div>
                          Total GPA = ({myResults.map((r) => r.gpa.toFixed(1)).join(' + ')}) ÷ {resultSummary.subjectCount} ={' '}
                          <strong className="text-emerald-400">
                            {resultSummary.totalGradePoints} ÷ {resultSummary.subjectCount} = {resultSummary.gpa}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px] font-mono">
                      {[
                        { range: '80% – 100%', grade: 'A+', gp: '5.00', color: 'text-emerald-400 border-emerald-500/30' },
                        { range: '70% – 79%', grade: 'A', gp: '4.00', color: 'text-cyan-400 border-cyan-500/30' },
                        { range: '60% – 69%', grade: 'A-', gp: '3.50', color: 'text-amber-300 border-amber-500/30' },
                        { range: '50% – 59%', grade: 'B', gp: '3.00', color: 'text-neutral-200 border-white/15' },
                        { range: '40% – 49%', grade: 'C', gp: '2.00', color: 'text-neutral-300 border-white/15' },
                        { range: '33% – 39%', grade: 'D', gp: '1.00', color: 'text-neutral-400 border-white/15' },
                        { range: '0% – 32%', grade: 'F', gp: '0.00', color: 'text-red-400 border-red-500/30' }
                      ].map((tier) => (
                        <div
                          key={tier.grade}
                          className={`p-2.5 rounded-lg bg-black border ${tier.color} flex flex-col justify-between`}
                        >
                          <div className="text-neutral-400 text-[10px]">{tier.range}</div>
                          <div className="font-bold text-xs mt-0.5">
                            {tier.grade} = {tier.gp} GP
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete Subject-by-Subject Grade & GPA Breakdown Data Table (Visible on All Viewports) */}
                  <div className="bg-[#0E1018] border border-white/15 rounded-2xl overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-[#090A0F]">
                      <div>
                        <h3 className="font-display text-base font-bold text-white">
                          Subject-by-Subject Grade &amp; GPA Breakdown Data Table
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Detailed marks, normalized percentages, grading tiers, individual Grade Points (GP), and exact contribution to Total GPA
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-white text-black font-mono text-xs font-extrabold">
                        Cumulative GPA: {resultSummary.gpa} / 5.00
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[11px] font-mono text-slate-400 bg-[#090A0F]">
                            <th className="py-3.5 px-4">Code</th>
                            <th className="py-3.5 px-4">Subject &amp; Examiner</th>
                            <th className="py-3.5 px-4 text-right">Full Marks</th>
                            <th className="py-3.5 px-4 text-right">Marks Obtained</th>
                            <th className="py-3.5 px-4 text-right">Percentage (%)</th>
                            <th className="py-3.5 px-4">Grading Scale Tier</th>
                            <th className="py-3.5 px-4 text-center">Letter Grade</th>
                            <th className="py-3.5 px-4 text-right">Grade Point (GP)</th>
                            <th className="py-3.5 px-4 text-right">GPA Contribution</th>
                            <th className="py-3.5 px-4 text-right">Class Highest</th>
                            <th className="py-3.5 px-4 text-right">Position</th>
                            <th className="py-3.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                          {myResults.map((r) => {
                            const subjMeta = db.subjects.find((s) => s.id === r.subject_id);
                            const pct = Math.round((r.marks / r.fullMarks) * 100);
                            const gpaContribution = r.gpa / (resultSummary.subjectCount || 8);
                            return (
                              <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                                <td className="py-3 px-4 font-mono text-neutral-400 whitespace-nowrap">
                                  {subjMeta?.code || r.subject_id.toUpperCase()}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="font-semibold text-white">{r.subjectName}</div>
                                  <div className="text-[11px] text-neutral-400">
                                    {subjMeta?.teacherName || 'Subject Teacher'}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums whitespace-nowrap">
                                  {r.fullMarks}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums whitespace-nowrap">
                                  {r.marks}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-white tabular-nums whitespace-nowrap">
                                  {pct}%
                                </td>
                                <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                                  {getGradingScaleTier(pct)}
                                </td>
                                <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                                  <span
                                    className={`px-2.5 py-0.5 rounded font-bold text-xs ${
                                      r.grade === 'A+'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : r.grade === 'A'
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    }`}
                                  >
                                    {r.grade}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-white tabular-nums whitespace-nowrap">
                                  {r.gpa.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-emerald-400 tabular-nums whitespace-nowrap">
                                  +{gpaContribution.toFixed(3)}{' '}
                                  <span className="text-neutral-500 text-[10px]">
                                    (1/{resultSummary.subjectCount})
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums whitespace-nowrap">
                                  {r.highestInClass} / {r.fullMarks}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-neutral-400 tabular-nums whitespace-nowrap">
                                  #{r.positionInSubject}
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedResultDetail(r)}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white hover:text-black text-xs text-white font-semibold cursor-pointer transition-colors"
                                  >
                                    Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#090A0F] border-t-2 border-white/20 font-mono text-xs text-white">
                            <td colSpan={2} className="py-3.5 px-4 font-bold">
                              CUMULATIVE TOTAL ({resultSummary.subjectCount} Subjects)
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                              {resultSummary.totalFull}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-white tabular-nums">
                              {resultSummary.totalObtained}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-400 tabular-nums">
                              {resultSummary.avgPct}%
                            </td>
                            <td className="py-3.5 px-4 text-[11px] text-neutral-300">
                              Sum of GP ({resultSummary.totalGradePoints}) ÷ {resultSummary.subjectCount} Subjects
                            </td>
                            <td className="py-3.5 px-4 text-center font-extrabold text-white">
                              {resultSummary.overallLetterGrade}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-white tabular-nums">
                              {resultSummary.totalGradePoints} / {resultSummary.maxGradePoints}
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 tabular-nums">
                              = {resultSummary.gpa} GPA
                            </td>
                            <td colSpan={3} className="py-3.5 px-4 text-right text-neutral-300">
                              Merit Rank: <strong className="text-white">{sectionMeritInfo.label}</strong>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Subject Performance Visual Chart */}
                  <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6">
                    <h3 className="font-display text-base font-bold text-white mb-4">
                      Subject Percentage &amp; Grade Point Visual Chart
                    </h3>
                    <div className="space-y-3">
                      {myResults.map((r) => {
                        const pct = Math.round((r.marks / r.fullMarks) * 100);
                        return (
                          <div key={r.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-neutral-200">{r.subjectName}</span>
                              <span className="font-mono text-neutral-400 tabular-nums">
                                {r.marks}/{r.fullMarks} ({pct}%) · Grade {r.grade} · GP {r.gpa.toFixed(2)}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-black rounded-full overflow-hidden border border-white/10">
                              <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Result Details Modal */}
              {selectedResultDetail && (
                <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
                  <div className="bg-[#121521] border border-white/15 rounded-xl max-w-md w-full p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h3 className="font-display text-lg font-bold text-white">
                        {selectedResultDetail.subjectName} — Result Breakdown
                      </h3>
                      <button
                        onClick={() => setSelectedResultDetail(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Examination</span>
                        <span className="text-white font-medium">{selectedResultDetail.examName}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Marks Obtained</span>
                        <span className="font-mono text-white font-bold">
                          {selectedResultDetail.marks} / {selectedResultDetail.fullMarks}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Highest Mark in Class</span>
                        <span className="font-mono text-emerald-400">
                          {selectedResultDetail.highestInClass} / {selectedResultDetail.fullMarks}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-white/5">
                        <span className="text-slate-400">Letter Grade &amp; GPA</span>
                        <span className="font-mono text-white">
                          {selectedResultDetail.grade} ({selectedResultDetail.gpa.toFixed(2)})
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-slate-400 block mb-1">Examiner Remarks:</span>
                        <p className="p-3 rounded-lg bg-[#090A0F] border border-white/10 text-slate-200 leading-relaxed">
                          {selectedResultDetail.remarks}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedResultDetail(null)}
                      className="w-full py-2 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black cursor-pointer"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. STUDENT ATTENDANCE VIEW (Read-Only for Student) */}
          {studentTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Attendance Record — {attStats.pct}%
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Read-only view · Attendance is recorded by your Class Teacher ({getClassTeacherForSection(studentRec.class, studentRec.section).defaultName}).
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  ● Good Standing (&ge; 85% Required)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Overall Rate</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                    {attStats.pct}%
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Present Days</div>
                  <div className="font-mono text-2xl font-bold text-white mt-1 tabular-nums">
                    {attStats.present}
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Absent Days</div>
                  <div className="font-mono text-2xl font-bold text-red-400 mt-1 tabular-nums">
                    {attStats.absent}
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Late Arrivals</div>
                  <div className="font-mono text-2xl font-bold text-amber-400 mt-1 tabular-nums">
                    {attStats.late}
                  </div>
                </div>
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Total Logged Days</div>
                  <div className="font-mono text-2xl font-bold text-slate-200 mt-1 tabular-nums">
                    {attStats.total}
                  </div>
                </div>
              </div>

              {/* Attendance Calendar Grid */}
              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      30-Day Previous Attendance Archive ({myAttendance.length} Days Stored)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Complete 30-day rolling attendance history recorded by your Class Teacher
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <span className="text-emerald-400">● Present</span>
                    <span className="text-red-400">✕ Absent</span>
                    <span className="text-amber-400">▲ Late</span>
                    <span className="text-slate-400">◆ Holiday</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {[...myAttendance]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((rec) => {
                      const statusMeta =
                        rec.status === 'Present'
                          ? { symbol: '● Present', border: 'border-emerald-500/35', text: 'text-emerald-300' }
                          : rec.status === 'Absent'
                          ? { symbol: '✕ Absent', border: 'border-red-500/40', text: 'text-red-300' }
                          : rec.status === 'Late'
                          ? { symbol: '▲ Late', border: 'border-amber-500/40', text: 'text-amber-300' }
                          : { symbol: '◆ Holiday', border: 'border-white/10', text: 'text-slate-400' };
                      return (
                        <div
                          key={rec.id}
                          className={`p-3 rounded-lg bg-[#090A0F] border ${statusMeta.border}`}
                        >
                          <div className="font-mono text-xs text-slate-400 mb-1">
                            {rec.date}
                          </div>
                          <div className={`text-xs font-semibold ${statusMeta.text}`}>
                            {statusMeta.symbol}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 4. SYLLABUS VIEW */}
          {studentTab === 'syllabus' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Academic Syllabus &amp; Chapter Completion
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {studentRec.class} · Half-Yearly &amp; Annual Term Curriculum
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#0A0A0A] border border-white/15 rounded-lg overflow-x-auto">
                  {['All', ...SUBJECT_SEQUENCE].map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSyllabusSubjectFilter(subj)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        syllabusSubjectFilter === subj
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {db.syllabus
                  .filter((s) =>
                    syllabusSubjectFilter === 'All' ? true : s.subject === syllabusSubjectFilter
                  )
                  .map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-[#0E1018] border border-white/10 rounded-xl p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-red-400 font-semibold">{ch.subject}</span>
                          <span>·</span>
                          <span>{ch.term}</span>
                          <span>·</span>
                          <span className="font-mono">{ch.chapterNumber}</span>
                        </div>
                        <span
                          className={`text-xs font-mono font-semibold ${
                            ch.status === 'Completed'
                              ? 'text-emerald-400'
                              : ch.status === 'In Progress'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {ch.status === 'Completed'
                            ? '✓ Completed'
                            : ch.status === 'In Progress'
                            ? '◐ In Progress'
                            : '○ Not Started'}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-white mb-2">
                        {ch.chapterNumber} — {ch.chapterName}
                      </h3>

                      <div className="text-xs text-slate-300 mb-3">
                        <span className="text-slate-400 mr-2">Core Topics:</span>
                        {ch.topics.join(' · ')}
                      </div>

                      {ch.teacherNotes && (
                        <div className="p-3 rounded-lg bg-[#090A0F] border border-white/10 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <strong className="text-white">Teacher Note: </strong>
                            {ch.teacherNotes}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setLibrarySubjectPreset(ch.subject);
                              setStudentTab('library');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Library className="w-3.5 h-3.5" />
                            <span>Open {ch.subject} PDF Lecture Notes →</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 4B. DIGITAL LIBRARY VIEW (COURSE-SPECIFIC STUDY RESOURCES & PDF LECTURE NOTES) */}
          {studentTab === 'library' && (
            <StudentDigitalLibrary
              key={librarySubjectPreset}
              studentName={studentRec.name}
              studentClass={studentRec.class}
              studentSection={studentRec.section}
              syllabus={db.syllabus}
              initialSubject={librarySubjectPreset}
            />
          )}

          {/* 5. CLASS ROUTINE VIEW */}
          {studentTab === 'routine' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Weekly Class Routine — {studentRec.class} ({studentRec.section})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Saturday to Thursday · Periods 1–7 · Current active slot highlighted in crimson
                </p>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-[#090A0F] border-b border-white/10 text-xs font-mono text-slate-400">
                        <th className="py-3 px-4 w-28">Period</th>
                        {DAYS_ORDER.map((day) => (
                          <th key={day} className="py-3 px-4">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                        <tr key={period}>
                          <td className="py-3.5 px-4 font-mono text-slate-300 bg-[#090A0F]/60">
                            <div className="font-bold text-white">Period {period}</div>
                            <div className="text-[11px] text-slate-400">
                              {db.routines.find((r) => r.period === period)?.timeRange}
                            </div>
                          </td>
                          {DAYS_ORDER.map((day) => {
                            const slot = db.routines.find(
                              (r) => r.day === day && r.period === period
                            );
                            const isCurrentHighlight = day === 'Tuesday' && period === 1;
                            return (
                              <td
                                key={day}
                                className={`py-3 px-3.5 align-top border-l border-white/5 ${
                                  isCurrentHighlight
                                    ? 'bg-red-950/35 border border-red-500/50'
                                    : ''
                                }`}
                              >
                                {slot ? (
                                  <div>
                                    <div className="font-display font-bold text-white flex items-center justify-between gap-1">
                                      <span>{slot.subject}</span>
                                      {isCurrentHighlight && (
                                        <span className="text-[10px] font-mono text-red-400">
                                          ● NOW
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                      {slot.teacher.replace(' (Demo)', '')}
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                                      {slot.room}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. UPCOMING CTs & EXAMS VIEW */}
          {studentTab === 'exams' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Upcoming CTs &amp; Examinations — {studentRec.class}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  All CTs and Examinations published for {studentRec.class} students
                </p>
              </div>

              {myClassExams.length === 0 ? (
                <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-10 text-center">
                  <h3 className="font-display text-lg font-bold text-white mb-1">
                    No Upcoming Exams for {studentRec.class}
                  </h3>
                  <p className="text-xs text-neutral-400">You&apos;re all caught up.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {myClassExams.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs mb-2">
                          <span className="text-neutral-400">
                            {ex.type} · {ex.subject} · <strong className="text-white">{ex.class}</strong>
                          </span>
                          <span className="font-mono font-bold text-white">
                            {computeDaysRemaining(ex.date)}
                          </span>
                        </div>
                        <h3 className="font-display text-xl font-bold text-white mb-2">
                          {ex.name}
                        </h3>
                        <p className="text-xs text-neutral-300 mb-4">
                          <strong className="text-white">Syllabus: </strong>
                          {ex.syllabus}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
                        <span>Date: {ex.date}</span>
                        <span>·</span>
                        <span>{ex.time}</span>
                        <span>·</span>
                        <span>{ex.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. PREVIOUS QUESTIONS ARCHIVE VIEW */}
          {studentTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    Previous Question Papers Archive
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Search, preview full question stems, and download authentic structured question sheets
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="search"
                    value={pqSearch}
                    onChange={(e) => setPqSearch(e.target.value)}
                    placeholder="Search chapter or topic..."
                    className="bg-[#0E1018] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                  <select
                    value={pqSubjectFilter}
                    onChange={(e) => setPqSubjectFilter(e.target.value)}
                    className="bg-[#0E1018] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Subjects</option>
                    {SUBJECT_SEQUENCE.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <select
                    value={pqYearFilter}
                    onChange={(e) => setPqYearFilter(e.target.value)}
                    className="bg-[#0E1018] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="All">All Years</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {db.previous_questions
                  .filter((pq) =>
                    pqSubjectFilter === 'All' ? true : pq.subject === pqSubjectFilter
                  )
                  .filter((pq) =>
                    pqYearFilter === 'All' ? true : String(pq.year) === pqYearFilter
                  )
                  .filter((pq) =>
                    !pqSearch.trim()
                      ? true
                      : pq.title.toLowerCase().includes(pqSearch.toLowerCase()) ||
                        pq.chapter.toLowerCase().includes(pqSearch.toLowerCase())
                  )
                  .map((pq) => (
                    <div
                      key={pq.id}
                      className="bg-[#0E1018] border border-white/10 rounded-xl p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                          <span className="text-red-400 font-semibold">{pq.subject}</span>
                          <span>·</span>
                          <span className="font-mono">{pq.year}</span>
                          <span>·</span>
                          <span>{pq.exam}</span>
                          <span>·</span>
                          <span>{pq.chapter}</span>
                        </div>
                        <h3 className="font-display text-base font-bold text-white mb-2">
                          {pq.title}
                        </h3>
                        <p className="text-xs text-slate-400 mb-4 font-mono">
                          Duration: {pq.duration} · Full Marks: {pq.fullMarks}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setPreviewPaper(pq)}
                          className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Paper</span>
                        </button>
                        <button
                          onClick={() => handleDownloadQuestionPaper(pq)}
                          className="px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Sheet (.txt)</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {previewPaper && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-[#121521] border border-white/15 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-white">
                          {previewPaper.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {previewPaper.class} · {previewPaper.duration} · Full Marks: {previewPaper.fullMarks}
                        </p>
                      </div>
                      <button
                        onClick={() => setPreviewPaper(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 rounded-lg bg-[#090A0F] border border-white/10 space-y-2 font-mono text-xs text-slate-200 leading-relaxed">
                      {previewPaper.questionsText.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleDownloadQuestionPaper(previewPaper)}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Question Sheet</span>
                      </button>
                      <button
                        onClick={() => setPreviewPaper(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. EXTRACURRICULAR ACTIVITIES & MY ACHIEVEMENTS */}
          {studentTab === 'activities' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Extracurricular Activities &amp; My Achievements
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified co-curricular participation, awards, and digital certificates
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {db.activities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-[#0E1018] border border-white/10 rounded-xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span className="text-red-400 font-semibold">{act.category}</span>
                        <span>·</span>
                        <span className="font-mono">{act.date}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-white mb-1">
                        {act.activity}
                      </h3>
                      <p className="text-xs text-slate-300 mb-3">{act.roleOrParticipation}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">★ {act.achievement}</span>
                      <span className="font-mono text-slate-400">{act.certificateCode}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SCHOOL NOTICES FEED */}
          {studentTab === 'notices' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    School &amp; Class Notice Feed
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Includes institutional bulletins and announcements from your teachers
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[#0A0A0A] border border-white/15 rounded-lg">
                  {['All', 'Important', 'Academic', 'Exam', 'Event', 'General'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNoticeCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        noticeCategoryFilter === cat
                          ? 'bg-white text-black font-semibold'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {db.notices
                  .filter((n) =>
                    noticeCategoryFilter === 'All'
                      ? true
                      : noticeCategoryFilter === 'Important'
                      ? n.important
                      : n.category === noticeCategoryFilter
                  )
                  .map((n) => (
                    <div
                      key={n.id}
                      className="bg-[#0E1018] border border-white/10 rounded-xl p-5"
                    >
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        {n.important && <span className="text-red-400 font-semibold">★ Important</span>}
                        <span className="text-slate-200">{n.category}</span>
                        <span>·</span>
                        <span className="font-mono">{n.date}</span>
                        <span>·</span>
                        <span>By {n.created_by}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-white mb-1.5">
                        {n.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {n.content}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 10. ASSIGNMENTS VIEW */}
          {studentTab === 'assignments' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Class Assignments &amp; Work Submissions
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track deadlines and upload your completed laboratory or homework files
                </p>
              </div>

              {db.assignments.length === 0 ? (
                <div className="bg-[#0E1018] border border-white/10 rounded-xl p-10 text-center">
                  <h3 className="font-display text-lg font-bold text-white mb-1">
                    No Assignments
                  </h3>
                  <p className="text-xs text-slate-400">No assignments have been posted.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {db.assignments.map((asg) => (
                    <div
                      key={asg.id}
                      className="bg-[#0E1018] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="text-red-400 font-semibold">{asg.subject}</span>
                          <span>·</span>
                          <span>{asg.teacher}</span>
                          <span>·</span>
                          <span className="font-mono">Due: {asg.due_date}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-white">
                          {asg.title}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {asg.description}
                        </p>
                        {asg.submittedFileName && (
                          <p className="text-xs font-mono text-emerald-400 pt-1">
                            ✓ Submitted File: {asg.submittedFileName} ({asg.submittedAt})
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono font-semibold ${
                            asg.status === 'Submitted'
                              ? 'text-emerald-400'
                              : asg.status === 'In Progress'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {asg.status === 'Submitted'
                            ? '✓ Submitted'
                            : asg.status === 'In Progress'
                            ? '◐ In Progress'
                            : '○ Not Started'}
                        </span>

                        {asg.status !== 'Submitted' && (
                          <button
                            onClick={() => setUploadModalAsgId(asg.id)}
                            className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Submit Work</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadModalAsgId && (
                <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
                  <div className="bg-[#121521] border border-white/15 rounded-xl max-w-md w-full p-6 space-y-4">
                    <h3 className="font-display text-lg font-bold text-white">
                      Submit Assignment Work
                    </h3>
                    <p className="text-xs text-slate-400">
                      Attach your completed PDF/document filename to record your submission in the class gradebook.
                    </p>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1.5">
                        Submission Filename
                      </label>
                      <input
                        type="text"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setUploadModalAsgId(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-xs text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          submitStudentAssignment(uploadModalAsgId, uploadFileName);
                          setUploadModalAsgId(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Submission</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 10B. STUDENT COMPLAINT SYSTEM (DIRECT MESSAGE TO RESPECTIVE CLASS TEACHER) */}
          {studentTab === 'complaints' && (
            <div className="space-y-6 animate-smooth-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                    Student Complaint &amp; Class Teacher Message Box
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Submit complaints, academic requests, or classroom concerns directly to your respective Class Teacher ({myClassTeacherMeta.defaultName} · {studentRec.class} — {studentRec.section}).
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/25 font-mono text-xs text-white font-bold self-start">
                  <span>Class Teacher: {myClassTeacherMeta.defaultName}</span>
                </span>
              </div>

              {stdComplaintBanner && (
                <div className="p-4 rounded-xl bg-white/10 border border-white/30 text-white text-xs font-semibold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>{stdComplaintBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStdComplaintBanner(null)}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: SUBMIT MESSAGE / COMPLAINT TO CLASS TEACHER */}
                <form
                  onSubmit={handleStudentSubmitComplaint}
                  className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4"
                >
                  <div className="flex items-center gap-2.5 border-b border-white/15 pb-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white">
                        Submit Message to Class Teacher
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Delivered directly to {myClassTeacherMeta.defaultName}&apos;s Complaint Box
                      </p>
                    </div>
                  </div>

                  {/* Automatic Student & Class Teacher Routing Info */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/25 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>RESPECTIVE CLASS TEACHER</span>
                      <span className="px-2 py-0.5 rounded bg-white text-black font-bold">
                        DIRECT ROUTE
                      </span>
                    </div>
                    <div className="font-display text-sm font-bold text-white">
                      To: {myClassTeacherMeta.defaultName} ({myClassTeacherMeta.subject} Teacher)
                    </div>
                    <div className="text-[11px] font-mono text-neutral-300">
                      Class Teacher of <strong className="text-white">{studentRec.class} — {studentRec.section}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-white/10 text-[11px] font-mono text-neutral-400">
                      From Student: <strong className="text-white">{currentUser?.name}</strong> · ID:{' '}
                      <strong className="text-white">{studentRec.student_id}</strong> · Roll{' '}
                      {String(studentRec.roll).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Category
                        </label>
                        <select
                          value={stdComplaintCategory}
                          onChange={(e) =>
                            setStdComplaintCategory(e.target.value as ComplaintCategory)
                          }
                          className="w-full bg-black border border-white/20 rounded-xl px-3 py-2.5 text-white"
                        >
                          <option value="Academic / Subject Issue">Academic / Subject Issue</option>
                          <option value="Schedule / Exam Query">Schedule / Exam Query</option>
                          <option value="Facility / Lab Issue">Facility / Lab Issue</option>
                          <option value="Peer / Classroom Concern">Peer / Classroom Concern</option>
                          <option value="Classroom Conduct">Classroom Conduct</option>
                          <option value="General Observation">General Observation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-neutral-300 font-medium mb-1">
                          Priority / Urgency
                        </label>
                        <select
                          value={stdComplaintSeverity}
                          onChange={(e) =>
                            setStdComplaintSeverity(e.target.value as ComplaintSeverity)
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

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Subject / Headline
                      </label>
                      <input
                        type="text"
                        required
                        value={stdComplaintTitle}
                        onChange={(e) => setStdComplaintTitle(e.target.value)}
                        placeholder="e.g. Request for extra review class / Classroom bench repair"
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">
                        Your Message / Complaint Details
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={stdComplaintMessage}
                        onChange={(e) => setStdComplaintMessage(e.target.value)}
                        placeholder="Write your message or complaint clearly for your Class Teacher..."
                        className="w-full bg-black border border-white/20 rounded-xl px-3.5 py-2.5 text-white placeholder:text-neutral-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        Send to {myClassTeacherMeta.defaultName}&apos;s Complaint Box
                      </span>
                    </button>
                  </div>
                </form>

                {/* RIGHT COLUMN: MY SUBMITTED MESSAGES & CLASS TEACHER REPLIES */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/15">
                      <div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-white">
                          My Messages &amp; Class Teacher Updates
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Unread complaints are shown first. Click any unread complaint to mark it as read and transfer it to Read.
                        </p>
                      </div>

                      {/* Two Options: Unread (First) and Read */}
                      <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-black border border-white/20">
                        <button
                          type="button"
                          onClick={() => setStdComplaintReadFilter('unread')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                            stdComplaintReadFilter === 'unread'
                              ? 'bg-white text-black'
                              : 'text-neutral-300 hover:text-white'
                          }`}
                        >
                          <span>Unread</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                              stdComplaintReadFilter === 'unread'
                                ? 'bg-black text-white'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {unreadStudentComplaints.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStdComplaintReadFilter('read')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                            stdComplaintReadFilter === 'read'
                              ? 'bg-white text-black'
                              : 'text-neutral-300 hover:text-white'
                          }`}
                        >
                          <span>Read</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                              stdComplaintReadFilter === 'read'
                                ? 'bg-black text-white'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {readStudentComplaints.length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const displayedList =
                        stdComplaintReadFilter === 'unread'
                          ? unreadStudentComplaints
                          : readStudentComplaints;

                      if (displayedList.length === 0) {
                        return (
                          <div className="p-8 text-center rounded-xl bg-black border border-white/10 space-y-2">
                            <Inbox className="w-7 h-7 text-neutral-400 mx-auto" />
                            <div className="font-display text-sm font-bold text-white">
                              {stdComplaintReadFilter === 'unread'
                                ? 'No Unread Complaints'
                                : 'No Read Complaints Yet'}
                            </div>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto">
                              {stdComplaintReadFilter === 'unread'
                                ? readStudentComplaints.length > 0
                                  ? 'All your complaints have been read and transferred to the Read tab.'
                                  : `Use the form on the left to submit a message or complaint directly to your Class Teacher (${myClassTeacherMeta.defaultName}).`
                                : 'Click on any complaint in the Unread tab to mark it as read and transfer it here.'}
                            </p>
                            {stdComplaintReadFilter === 'unread' && readStudentComplaints.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setStdComplaintReadFilter('read')}
                                className="mt-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white cursor-pointer"
                              >
                                View Read Complaints ({readStudentComplaints.length}) →
                              </button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3.5">
                          {displayedList.map((cmp) => {
                            const isRead = isStudentComplaintRead(cmp);
                            return (
                              <div
                                key={cmp.id}
                                onClick={() => {
                                  if (!isRead) {
                                    setLocalReadComplaintIds((prev) => ({ ...prev, [cmp.id]: true }));
                                    markComplaintSeenByTeacher(cmp.id);
                                    markComplaintReplyViewed(cmp.id);
                                  }
                                }}
                                className={`p-4 sm:p-5 rounded-2xl bg-black border transition-all space-y-3 ${
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
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                          cmp.submitted_by_role === 'student'
                                            ? 'bg-white text-black'
                                            : 'bg-white/15 text-white border border-white/25'
                                        }`}
                                      >
                                        {cmp.submitted_by_role === 'student'
                                          ? 'Sent by You (Student)'
                                          : `Teacher Report (${cmp.from_teacher_name})`}
                                      </span>
                                      <span className="text-xs font-mono text-neutral-400">
                                        To Class Teacher: <strong className="text-white">{cmp.class_teacher_name}</strong>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {!isRead && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLocalReadComplaintIds((prev) => ({ ...prev, [cmp.id]: true }));
                                          markComplaintSeenByTeacher(cmp.id);
                                          markComplaintReplyViewed(cmp.id);
                                        }}
                                        className="px-2.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-mono font-bold cursor-pointer"
                                      >
                                        Mark Read →
                                      </button>
                                    )}
                                    <span className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono text-neutral-300 uppercase">
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
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteStudentComplaint(cmp.id);
                                      }}
                                      className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[10px] font-mono font-semibold inline-flex items-center gap-1 cursor-pointer"
                                      title="Delete Complaint"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-400">
                                    <span>{cmp.category}</span>
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
                                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/35 text-xs text-emerald-100">
                                    <strong className="text-emerald-300 font-mono">
                                      Class Teacher Reply ({cmp.class_teacher_name}):{' '}
                                    </strong>
                                    {cmp.class_teacher_note}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 11. STUDENT INTERACTIVE ACADEMIC CALENDAR VIEW (EXAMS, EVENTS & ALL BANGLADESH HOLIDAYS INCLUDING EID & PUJA) */}
          {studentTab === 'calendar' && (
            <StudentAcademicCalendar
              studentClass={studentRec.class}
              studentSection={studentRec.section}
              exams={myClassExams}
              assignments={db.assignments}
              notices={db.notices}
            />
          )}

          {/* 12. STUDENT PROFILE VIEW */}
          {studentTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Student Profile
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  View academic registration details and update personal contact fields
                </p>
              </div>

              <div className="bg-[#0E1018] border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="font-display text-lg font-bold text-white">
                      {currentUser?.name}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      Verified Pre-Registered Student Account
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white text-black font-mono text-xs sm:text-sm font-extrabold">
                    Student ID: {studentRec.student_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs border-b border-white/10 pb-4">
                  <div>
                    <span className="text-slate-400 block">Student ID</span>
                    <span className="font-mono text-white font-bold text-sm">{studentRec.student_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Class &amp; Section</span>
                    <span className="font-mono text-white font-bold text-sm">
                      {studentRec.class} — {studentRec.section} (Roll {String(studentRec.roll).padStart(2, '0')})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Guardian / Student Contact Placeholder
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-[#090A0F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={() => updateProfile(profileName, profilePhone)}
                  className="px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-xs font-semibold text-black cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          )}

          {/* 13. SETTINGS VIEW */}
          {studentTab === 'settings' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  Portal Settings &amp; Preferences
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Manage demonstration database state
                </p>
              </div>

              <div className="bg-[#0A0A0A] border border-white/15 rounded-xl p-6 space-y-5">
                <div>
                  <div className="font-display text-sm font-bold text-white mb-1">
                    Change Account Password
                  </div>
                  <p className="text-xs text-neutral-400 mb-3">
                    Update your login password securely.
                  </p>
                  {passChangeStatus && (
                    <div className="mb-3 p-2.5 rounded-lg bg-white/5 border border-white/15 text-xs text-emerald-300">
                      {passChangeStatus}
                    </div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const res = await changeAccountPassword(currPassInput, newPassInput);
                      setPassChangeStatus(res.message);
                      if (res.ok) {
                        setCurrPassInput('');
                        setNewPassInput('');
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    <input
                      type="password"
                      value={currPassInput}
                      onChange={(e) => setCurrPassInput(e.target.value)}
                      placeholder="Current password"
                      required
                      className="px-3 py-2 rounded-lg bg-black border border-white/15 text-xs text-white"
                    />
                    <input
                      type="password"
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
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
                  <div>
                    <div className="font-display text-sm font-bold text-white">
                      Reset Demonstration Database
                    </div>
                    <div className="text-xs text-neutral-400">
                      Restore all sample attendance, results, exams, and Chronos XP to factory defaults
                    </div>
                  </div>
                  <button
                    onClick={resetDemoData}
                    className="px-4 py-2 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold cursor-pointer"
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
