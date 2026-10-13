import React, { useState, useMemo } from 'react';
import { usePlatform, getClassTeacherForSection } from '../context/PlatformContext';
import { PERIODIC_ELEMENTS } from '../data/periodicElements';
import {
  Search,
  Bell,
  LogOut,
  CheckCheck,
  Sparkles,
  ArrowUpRight,
  Menu,
  X,
  Globe,
  BellRing,
  MessageSquareWarning
} from 'lucide-react';

interface PortalHeaderBarProps {
  portalTitle: string;
  accentMode?: 'crimson' | 'cyan';
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export const PortalHeaderBar: React.FC<PortalHeaderBarProps> = ({
  portalTitle,
  onToggleMenu,
  isMenuOpen = false
}) => {
  const {
    db,
    currentUser,
    surface,
    teacherTab,
    markAllNotificationsRead,
    markNotificationRead,
    markAllComplaintsReadForCurrentUser,
    logout,
    setStudentTab,
    setTeacherTab,
    openBrainify,
    triggerNextClassNotification
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [justSeenNotifIds, setJustSeenNotifIds] = useState<string[]>([]);

  const currentTeacherRec = useMemo(() => {
    if (currentUser?.role !== 'teacher') return null;
    const myCode =
      currentUser.teacherCode ||
      currentUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    return (
      db.teachers.find(
        (t) => t.user_id === currentUser.id || t.employee_id.endsWith(myCode)
      ) || db.teachers[0]
    );
  }, [db.teachers, currentUser]);

  const currentStudentRec = useMemo(
    () =>
      currentUser?.role === 'student'
        ? db.students.find(
            (s) =>
              s.user_id === currentUser.id ||
              (currentUser.studentIdCode &&
                s.student_id.toUpperCase() === currentUser.studentIdCode.toUpperCase())
          ) || db.students[0]
        : null,
    [db.students, currentUser]
  );

  const displayStudentId =
    currentUser?.studentIdCode || currentStudentRec?.student_id || '90001';

  const studentClassSection = useMemo(() => {
    const cls = currentUser?.studentClass || currentStudentRec?.class || 'Class 9';
    const rawSec = currentUser?.section || currentStudentRec?.section || 'BS1';
    const sec = rawSec === 'BS2' ? 'BS1' : rawSec;
    return { cls, sec, label: `${cls} — ${sec}` };
  }, [currentUser, currentStudentRec]);

  const studentClassTeacherMeta = useMemo(
    () => getClassTeacherForSection(studentClassSection.cls, studentClassSection.sec),
    [studentClassSection]
  );

  const myStudentComplaintsCount = useMemo(() => {
    if (currentUser?.role !== 'student') return 0;
    return (db.complaints || []).filter(
      (c) =>
        c.student_code.toUpperCase() === displayStudentId.toUpperCase() ||
        c.student_id === currentStudentRec?.id
    ).length;
  }, [db.complaints, currentUser, displayStudentId, currentStudentRec]);

  const teacherInboxComplaintsCount = useMemo(() => {
    if (currentUser?.role !== 'teacher') return 0;
    const mySection = (currentTeacherRec?.classTeacherOf || 'Class 10 — BS1').toLowerCase();
    const myCode =
      currentUser.teacherCode ||
      currentUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    return (db.complaints || []).filter(
      (c) =>
        !c.seen_by_teacher &&
        (c.target_class_section.toLowerCase() === mySection ||
          c.class_teacher_code === myCode)
    ).length;
  }, [db.complaints, currentUser, currentTeacherRec]);

  const teacherNewComplaintsCount = useMemo(() => {
    if (currentUser?.role !== 'teacher') return 0;
    const mySection = (currentTeacherRec?.classTeacherOf || 'Class 10 — BS1').toLowerCase();
    const myCode =
      currentUser.teacherCode ||
      currentUser.email.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';
    return (db.complaints || []).filter(
      (c) =>
        !c.seen_by_teacher &&
        !c.read_by_teacher &&
        (c.target_class_section.toLowerCase() === mySection ||
          c.class_teacher_code === myCode) &&
        (c.status === 'Submitted' || c.status === 'Under Review')
    ).length;
  }, [db.complaints, currentUser, currentTeacherRec]);

  const shortPortalLabel = useMemo(() => {
    if (portalTitle.toUpperCase().includes('STUDENT')) return 'Student Portal';
    if (portalTitle.toUpperCase().includes('TEACHER')) return 'Teacher Portal';
    return portalTitle;
  }, [portalTitle]);

  const visibleNotifications = useMemo(() => {
    const role = currentUser?.role || 'student';
    const isLeadership =
      role === 'chairman' || role === 'chief_advisor' || role === 'principal';
    const myCode =
      currentUser?.teacherCode ||
      currentUser?.email?.replace('teacher_', '').replace('@ssc.edu', '') ||
      '18887';

    return db.notifications.filter((n) => {
      if (n.resolved) return false;
      if (isLeadership) {
        return (
          n.targetRole === 'both' ||
          n.targetRole === 'leadership' ||
          n.targetRole === 'teacher'
        );
      }
      if (n.targetRole !== 'both' && n.targetRole !== role) return false;

      if (role === 'student') {
        if (n.studentUserId && currentUser?.id && n.studentUserId !== currentUser.id) {
          if (!n.studentCode || n.studentCode.toUpperCase() !== displayStudentId.toUpperCase()) {
            return false;
          }
        }
        if (n.studentCode && n.studentCode.toUpperCase() !== displayStudentId.toUpperCase()) {
          return false;
        }
        if (
          n.studentClass &&
          n.studentClass.toLowerCase() !== studentClassSection.cls.toLowerCase()
        ) {
          return false;
        }
        if (
          n.studentSection &&
          n.studentSection.toUpperCase() !== studentClassSection.sec.toUpperCase()
        ) {
          return false;
        }
      }

      if (role === 'teacher') {
        const mySubjects = (currentTeacherRec?.authorizedSubjects || []).map((s) => s.toLowerCase());
        const myClasses = Array.from(
          new Set(
            [
              currentTeacherRec?.classTeacherOf || '',
              ...(currentTeacherRec?.assignedClasses || [])
            ]
              .map((c) => c.toLowerCase().trim())
              .filter(Boolean)
          )
        );
        const myClassSectionOnly = (currentTeacherRec?.classTeacherOf || '').toLowerCase().trim();

        // 1. If tied to a complaint, must be addressed to this teacher (or sent by this teacher) and not dismissed
        if (n.complaintId) {
          const cmp = (db.complaints || []).find((c) => c.id === n.complaintId);
          if (!cmp) return false;
          if (n.notificationType === 'complaint_submitted' && cmp.seen_by_teacher) return false;
          const isForMe =
            cmp.class_teacher_code === myCode ||
            cmp.target_class_section.toLowerCase().trim() === myClassSectionOnly;
          const isReplyToMyReport =
            n.notificationType === 'complaint_reply' && cmp.from_teacher_code === myCode;
          return isForMe || isReplyToMyReport;
        }

        // 2. If explicitly addressed to a specific teacher code, must match myCode
        if (n.recipientTeacherCode) {
          return n.recipientTeacherCode === myCode;
        }

        // 3. Check subject match if notification has a subject or mentions a subject in title/message
        const notifSubject = (n.subject || '').toLowerCase().trim();
        let matchesMySubject = false;
        if (notifSubject) {
          matchesMySubject = mySubjects.some((sub) => sub === notifSubject);
          if (!matchesMySubject) return false;
        } else {
          const textLower = `${n.title} ${n.message}`.toLowerCase();
          matchesMySubject = mySubjects.some((sub) => textLower.includes(sub));
        }

        // 4. Check class & section match
        let matchesMyClass = false;
        if (n.studentClass && n.studentSection) {
          const fullSec = `${n.studentClass} — ${n.studentSection}`.toLowerCase().trim();
          matchesMyClass =
            myClassSectionOnly === fullSec || myClasses.some((c) => c === fullSec);
          if (!matchesMyClass && !matchesMySubject) return false;
        } else if (n.studentClass) {
          const clsLower = n.studentClass.toLowerCase().trim();
          matchesMyClass = myClasses.some((c) => c.startsWith(clsLower));
          if (!matchesMyClass && !matchesMySubject) return false;
        }

        // Only allow notifications that match this teacher's assigned classes or subject
        return matchesMyClass || matchesMySubject;
      }
      return true;
    });
  }, [db.notifications, db.complaints, currentUser, currentTeacherRec, displayStudentId, studentClassSection]);

  const unreadCount = visibleNotifications.filter((n) => !n.read && !n.resolved).length;

  // Global role-aware search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{
      id: string;
      title: string;
      meta: string;
      onSelect: () => void;
    }> = [];

    const role = currentUser?.role || 'student';

    // Teachers can search student records
    if (role === 'teacher') {
      db.students.forEach((st) => {
        const usr = db.users.find((u) => u.id === st.user_id);
        if (
          usr &&
          (usr.name.toLowerCase().includes(q) ||
            st.student_id.toLowerCase().includes(q))
        ) {
          results.push({
            id: `st-${st.id}`,
            title: usr.name,
            meta: `Student · ${st.class} ${st.section} · Roll ${st.roll}`,
            onSelect: () => {
              setTeacherTab('performance');
              setSearchQuery('');
            }
          });
        }
      });
    }

    // Subjects
    db.subjects.forEach((sub) => {
      if (
        sub.name.toLowerCase().includes(q) ||
        sub.code.toLowerCase().includes(q)
      ) {
        results.push({
          id: `sub-${sub.id}`,
          title: `${sub.name} (${sub.code})`,
          meta: `Subject · ${sub.class} · ${sub.teacherName}`,
          onSelect: () => {
            if (role === 'teacher') setTeacherTab('results');
            else setStudentTab('syllabus');
            setSearchQuery('');
          }
        });
      }
    });

    // Exams
    db.exams.forEach((ex) => {
      if (
        ex.name.toLowerCase().includes(q) ||
        ex.subject.toLowerCase().includes(q) ||
        ex.syllabus.toLowerCase().includes(q)
      ) {
        results.push({
          id: `ex-${ex.id}`,
          title: ex.name,
          meta: `Exam · ${ex.date} · ${ex.room}`,
          onSelect: () => {
            if (role === 'teacher') setTeacherTab('exams');
            else setStudentTab('exams');
            setSearchQuery('');
          }
        });
      }
    });

    // Notices
    db.notices.forEach((not) => {
      if (
        not.title.toLowerCase().includes(q) ||
        not.content.toLowerCase().includes(q)
      ) {
        results.push({
          id: `not-${not.id}`,
          title: not.title,
          meta: `Notice · ${not.category} · ${not.date}`,
          onSelect: () => {
            if (role === 'teacher') setTeacherTab('notices');
            else setStudentTab('notices');
            setSearchQuery('');
          }
        });
      }
    });

    // Previous Questions
    db.previous_questions.forEach((pq) => {
      if (
        pq.title.toLowerCase().includes(q) ||
        pq.subject.toLowerCase().includes(q) ||
        String(pq.year).includes(q)
      ) {
        results.push({
          id: `pq-${pq.id}`,
          title: pq.title,
          meta: `Question Archive · ${pq.year} · ${pq.exam}`,
          onSelect: () => {
            if (role === 'teacher') setTeacherTab('questions');
            else setStudentTab('questions');
            setSearchQuery('');
          }
        });
      }
    });

    // Brainify Elements
    PERIODIC_ELEMENTS.forEach((el) => {
      if (
        el.name.toLowerCase().includes(q) ||
        el.symbol.toLowerCase() === q
      ) {
        results.push({
          id: `el-${el.atomicNumber}`,
          title: `${el.name} (${el.symbol}) — Z = ${el.atomicNumber}`,
          meta: `Interactive Learning · Periodic Table · ${el.category} · ${el.atomicMass} u`,
          onSelect: () => {
            openBrainify('periodic-table');
            setSearchQuery('');
          }
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, db, currentUser, setStudentTab, setTeacherTab, openBrainify]);

  return (
    <div className="relative z-30">
      {/* VERY TOP BAR: SCHOLARS: SCHOOL AND COLLEGE + VISIT MAIN WEBSITE (OPENS NEW TAB) */}
      <div className="bg-black border-b border-white/15 px-3 sm:px-5 md:px-8 py-2 flex items-center justify-between gap-2">
        <span className="font-display text-xs sm:text-sm md:text-base font-extrabold tracking-tight text-white truncate">
          SCHOLAR&apos;S SCHOOL &amp; COLLEGE
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {currentUser && surface !== 'brainify' && (
            <a
              href="https://chronotoolkit.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white border border-purple-300/50 text-[11px] sm:text-xs font-display font-bold transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-100 shrink-0" />
              <span>Launch Chronos</span>
            </a>
          )}
          <a
            href="https://scholars.edu.bd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black border border-white/25 text-[11px] sm:text-xs font-semibold transition-all shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Visit Main Website</span>
          </a>
        </div>
      </div>

      {/* NOTICEABLE VERY TOP BAR FOR TEACHERS: NEXT CLASS LIVE NOTIFICATION + COMPLAINT BOX BAR */}
      {currentUser && currentUser.role === 'teacher' && (
        <div className="bg-gradient-to-r from-[#1A0508] via-[#2B080E] to-[#1A0508] border-b border-red-500/40 px-3 sm:px-5 md:px-8 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500 text-white font-mono text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shrink-0 shadow-sm">
              <BellRing className="w-3.5 h-3.5 animate-pulse shrink-0" />
              <span>NEXT CLASS ALERT</span>
            </span>
            <div className="text-xs sm:text-sm text-white font-medium truncate">
              <strong className="font-display font-bold text-white">
                {currentTeacherRec?.authorizedSubjects?.[0] || 'Higher Math'}
              </strong>{' '}
              <span className="text-red-200 font-mono text-[11px] sm:text-xs">
                · {currentTeacherRec?.classTeacherOf || 'Class 9 — BS1'} · Room 304 · 09:30 AM (Starts in 15m)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerNextClassNotification(15)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-[11px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5 shrink-0" />
              <span>Notify Next Class</span>
            </button>

            <button
              type="button"
              onClick={() => setTeacherTab('next-class')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                teacherTab === 'next-class'
                  ? 'bg-red-500 text-white border-red-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
              }`}
            >
              <span>Schedule Alert</span>
            </button>

            <button
              type="button"
              onClick={() => {
                markAllComplaintsReadForCurrentUser();
                setTeacherTab('complaints');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-all cursor-pointer ${
                teacherTab === 'complaints'
                  ? 'bg-white text-black border-white'
                  : 'bg-black/60 hover:bg-white hover:text-black text-white border-white/30'
              }`}
            >
              <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" />
              <span>Complaint Box ({teacherInboxComplaintsCount})</span>
              {teacherNewComplaintsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-extrabold">
                  {teacherNewComplaintsCount} New
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* COMPACT CHRONOS TOP BAR (FOR STUDENTS — ONLY LAUNCH CHRONOS IN TOP) */}
      {currentUser && currentUser.role === 'student' && surface !== 'brainify' && (
        <div className="bg-gradient-to-r from-[#0F0722] via-[#210D4A] to-[#0F0722] border-b border-purple-400/40 px-3 py-2 sm:px-5 sm:py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <a
              href="https://chronotoolkit.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-display font-extrabold tracking-wide border border-purple-300/50 transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-100 shrink-0" />
              <span>Launch Chronos</span>
            </a>
          </div>
        </div>
      )}

      <header className="bg-[#080808] border-b border-white/15 px-3 sm:px-5 md:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white hover:text-black border border-white/20 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shrink-0"
              aria-label="Open Left Navigation Menu"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
              <span>Menu</span>
            </button>
          )}
          <span className="font-display text-xs sm:text-sm md:text-base font-bold text-white truncate">
            <span className="sm:hidden">{shortPortalLabel}</span>
            <span className="hidden sm:inline">{portalTitle}</span>
          </span>
        </div>

        {/* Right Action Cluster (Identity Badge, Search Icon Only, Notifications, Sign Out) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentUser && currentUser.role === 'student' && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 border border-white/25 text-[10px] sm:text-xs font-mono text-white">
              <span className="hidden sm:inline font-sans font-bold text-white truncate max-w-[140px]">
                {currentUser.name}
              </span>
              <span className="hidden sm:inline text-neutral-400">·</span>
              <span className="px-1.5 py-0.5 rounded bg-white text-black font-extrabold tracking-tight">
                ID: {displayStudentId}
              </span>
            </div>
          )}

          {/* Search Icon Only (No Box in Header Bar) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSearch((prev) => !prev);
                setShowNotifs(false);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {showSearch && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-80 bg-[#0C0C0C] border border-white/20 rounded-xl shadow-2xl p-2.5 z-50 animate-smooth-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="search"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search subjects, exams, 118 elements..."
                    className="w-full bg-black border border-white/20 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 border-t border-white/15 pt-1 max-h-64 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onSelect();
                          setShowSearch(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-neutral-400 truncate">{item.meta}</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell — Automatically marks notifications as seen when clicked */}
          <div className="relative">
            <button
              onClick={() => {
                const nextOpen = !showNotifs;
                setShowNotifs(nextOpen);
                setShowSearch(false);
                if (nextOpen) {
                  const unreadIds = visibleNotifications.filter((n) => !n.read).map((n) => n.id);
                  if (unreadIds.length > 0) {
                    setJustSeenNotifIds(unreadIds);
                    markAllNotificationsRead(true);
                  } else {
                    setJustSeenNotifIds([]);
                  }
                }
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-[10px] font-mono font-bold text-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-96 bg-[#0C0C0C] border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-smooth-in">
                <div className="px-4 py-3 border-b border-white/15 flex items-center justify-between">
                  <span className="font-display text-xs font-bold text-white">
                    Notifications ({visibleNotifications.length})
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 inline-flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Automatically seen</span>
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                  {visibleNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400">
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    visibleNotifications.map((n) => {
                      const wasJustSeen = justSeenNotifIds.includes(n.id);
                      const categoryBadge =
                        n.category === 'complaint'
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : n.category === 'attendance'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : n.category === 'result'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : n.category === 'exam'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-white/10 text-neutral-300 border-white/20';

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markNotificationRead(n.id);
                            if (currentUser?.role === 'student') {
                              if (n.category === 'complaint') setStudentTab('complaints');
                              else if (n.category === 'attendance') setStudentTab('attendance');
                              else if (n.category === 'result') setStudentTab('results');
                              else if (n.category === 'exam') setStudentTab('exams');
                              else if (n.category === 'assignment') setStudentTab('assignments');
                              else setStudentTab('notices');
                            } else if (currentUser?.role === 'teacher') {
                              if (n.category === 'complaint') setTeacherTab('complaints');
                              else if (n.category === 'class') setTeacherTab('next-class');
                              else if (n.category === 'attendance') setTeacherTab('attendance');
                              else if (n.category === 'result') setTeacherTab('results');
                              else if (n.category === 'exam') setTeacherTab('exams');
                            }
                            setShowNotifs(false);
                          }}
                          className={`px-4 py-3 hover:bg-white/[0.06] transition-colors cursor-pointer ${
                            wasJustSeen ? 'bg-white/[0.04]' : 'opacity-85'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-white flex items-center gap-1.5 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[9px] font-mono uppercase shrink-0 ${categoryBadge}`}
                              >
                                {n.category === 'exam' ? 'CT / Exam' : n.category}
                              </span>
                              <span className="truncate">{n.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                              {wasJustSeen ? '✓ Seen now' : n.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed">{n.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {currentUser && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white hover:text-black text-xs text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>
    </div>
  );
};
