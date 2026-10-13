import type { PlatformDatabase, UserRecord, StudentRecord, ClassRecord, AttendanceRecord, ResultRecord } from '../types/database.ts';
import { ALL_CLASS_SECTIONS, PRE_REGISTERED_STUDENTS } from './studentCredentials.ts';
import { INITIAL_LEADERSHIP_ACCOUNTS, toLeadershipUserRecord } from './leadershipCredentials.ts';
const studentAvatar = new URL('../assets/images/avatar_student_demo_1791271505121.jpg', import.meta.url).href;
const teacherAvatar = new URL('../assets/images/avatar_teacher_demo_1791271527973.jpg', import.meta.url).href;

// Simple deterministic hash helper so passwords are never stored in plain text
export function hashCredential(raw: string): string {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'sha256_sim_' + (h >>> 0).toString(16).padStart(8, '0');
}

// Generate 30 consecutive dates ending on 2026-10-06 (2026-09-07 through 2026-10-06)
export const PAST_30_DATES: string[] = Array.from({ length: 30 }, (_, idx) => {
  const base = new Date('2026-10-06T00:00:00Z');
  base.setUTCDate(base.getUTCDate() - (29 - idx));
  return base.toISOString().slice(0, 10);
});

const CORE_SUBJECT_DEFINITIONS = [
  { id: 'sub-phy', name: 'Physics', fullMarks: 100, offset: 0 },
  { id: 'sub-bio', name: 'Biology', fullMarks: 100, offset: 3 },
  { id: 'sub-che', name: 'Chemistry', fullMarks: 100, offset: 5 },
  { id: 'sub-ban', name: 'Bangla', fullMarks: 100, offset: 8 },
  { id: 'sub-eng', name: 'English', fullMarks: 100, offset: 4 },
  { id: 'sub-ict', name: 'ICT', fullMarks: 50, offset: 2 },
  { id: 'sub-bgs', name: 'BGS', fullMarks: 100, offset: 2 },
  { id: 'sub-rel', name: 'Religion', fullMarks: 100, offset: 1 }
] as const;

function buildSeedRoster(): {
  users: UserRecord[];
  students: StudentRecord[];
  classes: ClassRecord[];
  attendance: AttendanceRecord[];
  extraResults: ResultRecord[];
} {
  const users: UserRecord[] = [
    ...INITIAL_LEADERSHIP_ACCOUNTS.map((l) => toLeadershipUserRecord(l)),
    {
      id: 'usr-teacher-1',
      name: 'Saif Chowdhury',
      email: 'teacher_18887@ssc.edu',
      passwordHash: hashCredential('18887'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000101]',
      teacherCode: '18887',
      studentClass: 'Class 10',
      section: 'BS1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-2',
      name: 'MD. MAHFUJUL HAQUE',
      email: 'teacher_15539@ssc.edu',
      passwordHash: hashCredential('15539'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000102]',
      teacherCode: '15539',
      studentClass: 'Class 9',
      section: 'BS1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-3',
      name: 'MD. RAISUL ISLAM',
      email: 'teacher_18886@ssc.edu',
      passwordHash: hashCredential('18886'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000103]',
      teacherCode: '18886',
      studentClass: 'Class 9',
      section: 'BS1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-4',
      name: 'MD. RONY KHAN',
      email: 'teacher_10908@ssc.edu',
      passwordHash: hashCredential('10908'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000104]',
      teacherCode: '10908',
      studentClass: 'Class 7',
      section: 'B1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-5',
      name: 'ANONNO IBNE RAZZAK',
      email: 'teacher_16678@ssc.edu',
      passwordHash: hashCredential('16678'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000105]',
      teacherCode: '16678',
      studentClass: 'Class 8',
      section: 'B1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-6',
      name: 'MUHAMMAD MOKHLESUR RAHMAN',
      email: 'teacher_17724@ssc.edu',
      passwordHash: hashCredential('17724'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000106]',
      teacherCode: '17724',
      studentClass: 'Class 7',
      section: 'B2',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-7',
      name: 'MD. AMIR HOSSAIN',
      email: 'teacher_19940@ssc.edu',
      passwordHash: hashCredential('19940'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000107]',
      teacherCode: '19940',
      studentClass: 'Class 8',
      section: 'B2',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-8',
      name: 'FAYSAL AHMED',
      email: 'teacher_12215@ssc.edu',
      passwordHash: hashCredential('12215'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000108]',
      teacherCode: '12215',
      studentClass: 'Class 8',
      section: 'B2',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-9',
      name: 'MOHAMMAD ANISUZZAMAN',
      email: 'teacher_16101@ssc.edu',
      passwordHash: hashCredential('16101'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000109]',
      teacherCode: '16101',
      studentClass: 'Class 6',
      section: 'B1',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-10',
      name: 'MD. ARIFUR RAHMAN',
      email: 'teacher_16202@ssc.edu',
      passwordHash: hashCredential('16202'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000110]',
      teacherCode: '16202',
      studentClass: 'Class 6',
      section: 'B2',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-11',
      name: 'MD. MEHRAZ',
      email: 'teacher_16303@ssc.edu',
      passwordHash: hashCredential('16303'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000111]',
      teacherCode: '16303',
      studentClass: 'Class 10',
      section: 'BS2',
      approvalStatus: 'approved'
    },
    {
      id: 'usr-teacher-12',
      name: 'MD SHAHIDUL ISLAM',
      email: 'teacher_16404@ssc.edu',
      passwordHash: hashCredential('16404'),
      role: 'teacher',
      profileImage: teacherAvatar,
      phone: '[Demo Phone: +880-0000-000112]',
      teacherCode: '16404',
      studentClass: 'Class 9',
      section: 'BS1',
      approvalStatus: 'approved'
    }
  ];

  const students: StudentRecord[] = [];
  const attendance: AttendanceRecord[] = [];
  const extraResults: ResultRecord[] = [];

  const classes: ClassRecord[] = ALL_CLASS_SECTIONS.map((cls) => ({
    id: cls.id,
    class_name: cls.className,
    section: cls.section,
    academic_year: '2026',
    class_teacher_id: cls.teacherId,
    room: cls.room,
    studentCount: 35
  }));

  const EXPLICIT_MARKS_BY_STUDENT_ID: Record<string, number[]> = {
    // [Physics(100), Biology(100), Chemistry(100), Bangla(100), English(100), ICT(50), BGS(100), Religion(100)]
    'std-1': [94, 84, 89, 78, 86, 48, 92, 91], // 90001 Ahnaf Nahin Shahariar -> 7 A+, 1 A -> Total GPA 4.88
    'std-2': [92, 88, 91, 84, 89, 47, 90, 93], // 90002 Rushaid Mujtahid Chowdhury -> 8 A+ -> Total GPA 5.00
    'std-3': [85, 76, 82, 74, 83, 43, 78, 88], // 90003 Takrim Muhtadi -> 5 A+, 3 A -> Total GPA 4.63
    'std-4': [81, 73, 77, 68, 82, 41, 75, 84], // 90004 Mansif Alam -> 4 A+, 3 A, 1 A- -> Total GPA 4.44
    'std-5': [88, 82, 86, 75, 84, 45, 77, 90], // 90005 Ahnaf Alam Faiyaz -> 6 A+, 2 A -> Total GPA 4.75
    'std-6': [83, 72, 67, 74, 81, 37, 68, 85]  // 90006 Cristiano Ronaldo -> 3 A+, 3 A, 2 A- -> Total GPA 4.25
  };

  PRE_REGISTERED_STUDENTS.forEach((pre, studentIdx) => {
    const isClass9Bs2Primary = pre.className === 'Class 9' && pre.code.startsWith('90') && pre.roll <= 6;
    const userId = isClass9Bs2Primary ? `usr-student-${pre.roll}` : `usr-student-${pre.code}`;
    const studentId = isClass9Bs2Primary ? `std-${pre.roll}` : `std-${pre.code}`;
    const clsIdx = ALL_CLASS_SECTIONS.findIndex(
      (c) => c.className === pre.className && c.section === pre.section
    );
    const clsObj = clsIdx >= 0 ? ALL_CLASS_SECTIONS[clsIdx] : ALL_CLASS_SECTIONS[7];
    const classId = clsObj ? clsObj.id : 'cls-9-bs2';

    users.push({
      id: userId,
      name: pre.name,
      email: `student_${pre.code.toLowerCase()}@ssc.edu`,
      passwordHash: hashCredential(pre.code),
      role: 'student',
      profileImage: studentAvatar,
      phone: `[Guardian Contact: +880-1700-${pre.code.padStart(6, '0').slice(-6)}]`,
      approvalStatus: 'approved',
      studentClass: pre.className,
      section: pre.section,
      studentIdCode: pre.code
    });

    students.push({
      id: studentId,
      user_id: userId,
      student_id: pre.code,
      name: pre.name,
      roll: pre.roll,
      class: pre.className,
      section: pre.section,
      academic_year: '2026',
      streakDays: ((pre.roll * 3 + Math.max(0, clsIdx)) % 18) + 3
    });

    // Generate 30 days of previous attendance records for every student with distinct attendance rates per class & teacher
    const safeClsIdx = Math.max(0, clsIdx);
    const absentRollsByClass: number[][] = [
      [8, 19, 27],            // cls 0: Class 6 B1 (3 absent)
      [5, 12, 23, 31],        // cls 1: Class 6 B2 (4 absent)
      [14, 29],               // cls 2: Class 7 B1 (2 absent)
      [3, 10, 18, 25, 33],    // cls 3: Class 7 B2 (5 absent)
      [21],                   // cls 4: Class 8 B1 (1 absent)
      [2, 9, 16, 22, 28, 34], // cls 5: Class 8 B2 (6 absent)
      [7, 18, 26],            // cls 6: Class 9 BS1 (3 absent)
      [11, 24],               // cls 7: Class 9 BS2 (2 absent)
      [15],                   // cls 8: Class 10 BS1 (1 absent)
      [6, 14, 22, 30]         // cls 9: Class 10 BS2 (4 absent)
    ];
    const lateRollsByClass: number[][] = [
      [4],        // cls 0
      [9, 17],    // cls 1
      [7],        // cls 2
      [15],       // cls 3
      [11],       // cls 4
      [6, 19],    // cls 5
      [12, 30],   // cls 6
      [3, 18],    // cls 7
      [],         // cls 8
      [10, 25]    // cls 9
    ];

    PAST_30_DATES.forEach((dateStr, dayIdx) => {
      const dayOfWeek = new Date(dateStr + 'T00:00:00Z').getUTCDay();
      let status: AttendanceRecord['status'] = 'Present';

      if (dayOfWeek === 5) {
        status = 'Holiday';
      } else if (dateStr === '2026-10-06') {
        const absList = absentRollsByClass[safeClsIdx % absentRollsByClass.length];
        const lateList = lateRollsByClass[safeClsIdx % lateRollsByClass.length];
        if (absList.includes(pre.roll)) {
          status = 'Absent';
        } else if (lateList.includes(pre.roll)) {
          status = 'Late';
        } else {
          status = 'Present';
        }
      } else {
        const modBase = 22 + (safeClsIdx % 11);
        const hashVal = (pre.roll * 13 + dayIdx * 7 + safeClsIdx * 5) % modBase;
        if (hashVal === 0 || (safeClsIdx % 3 === 1 && hashVal === 9)) {
          status = 'Absent';
        } else if (hashVal === 4 || (safeClsIdx % 2 === 0 && hashVal === 15)) {
          status = 'Late';
        } else {
          status = 'Present';
        }
      }

      attendance.push({
        id: `att-${dateStr}-${studentId}`,
        student_id: studentId,
        class_id: classId,
        date: dateStr,
        status,
        marked_by: clsObj ? clsObj.teacherId : 'tch-12'
      });
    });

    if (studentId !== 'std-1') {
      const explicitMarks = EXPLICIT_MARKS_BY_STUDENT_ID[studentId];
      CORE_SUBJECT_DEFINITIONS.forEach((sub, subIdx) => {
        let marks: number;
        if (explicitMarks && explicitMarks[subIdx] !== undefined) {
          marks = explicitMarks[subIdx];
        } else {
          // Deterministic varied marks using roll, class index, and subject index so every student has a distinct GPA
          const base = 95 - ((pre.roll * 7 + Math.max(0, clsIdx) * 11 + subIdx * 9 + sub.offset) % 39);
          const rawPct = Math.max(54, Math.min(98, base));
          marks = sub.fullMarks === 50 ? Math.round((rawPct / 100) * 50) : rawPct;
        }

        const pct = (marks / sub.fullMarks) * 100;
        const grade =
          pct >= 80
            ? 'A+'
            : pct >= 70
            ? 'A'
            : pct >= 60
            ? 'A-'
            : pct >= 50
            ? 'B'
            : pct >= 40
            ? 'C'
            : pct >= 33
            ? 'D'
            : 'F';
        const gpa =
          pct >= 80
            ? 5.0
            : pct >= 70
            ? 4.0
            : pct >= 60
            ? 3.5
            : pct >= 50
            ? 3.0
            : pct >= 40
            ? 2.0
            : pct >= 33
            ? 1.0
            : 0.0;

        extraResults.push({
          id: `res-${sub.id}-${studentId}`,
          student_id: studentId,
          subject_id: sub.id,
          subjectName: sub.name,
          exam_id: 'ex-hy-2026',
          examName: 'Half-Yearly Examination 2026',
          fullMarks: sub.fullMarks,
          marks,
          grade,
          gpa,
          highestInClass: sub.fullMarks === 50 ? 49 : 98,
          positionInSubject: ((pre.roll + subIdx + Math.max(0, clsIdx)) % 35) + 1,
          remarks:
            pct >= 80
              ? 'Excellent mastery of core concepts and analytical problem-solving.'
              : pct >= 70
              ? 'Strong academic performance; continue practicing structured questions.'
              : 'Consistent progress; focus on chapter review and conceptual clarity.'
        });
      });
    }
  });

  return { users, students, classes, attendance, extraResults };
}

const SEED_ROSTER = buildSeedRoster();

export const INITIAL_DATABASE: PlatformDatabase = {
  users: SEED_ROSTER.users,

  students: SEED_ROSTER.students,

  teachers: [
    {
      id: 'tch-1',
      user_id: 'usr-teacher-1',
      employee_id: 'EMP-SSC-18887',
      department: 'Department of Physical Sciences',
      designation: 'Physics Teacher & Class Teacher (Class 10 — BS1)',
      assignedClasses: ['Class 10 — BS1'],
      authorizedSubjects: ['Physics'],
      classTeacherOf: 'Class 10 — BS1',
      personalAttendanceRate: 97
    },
    {
      id: 'tch-2',
      user_id: 'usr-teacher-2',
      employee_id: 'EMP-SSC-15539',
      department: 'Department of Biological Sciences',
      designation: 'Biology Teacher & Class Teacher (Class 9 — BS1)',
      assignedClasses: ['Class 9 — BS1'],
      authorizedSubjects: ['Biology'],
      classTeacherOf: 'Class 9 — BS1',
      personalAttendanceRate: 95
    },
    {
      id: 'tch-3',
      user_id: 'usr-teacher-3',
      employee_id: 'EMP-SSC-18886',
      department: 'Department of Physical Sciences',
      designation: 'Chemistry Teacher (Class 9 — BS1)',
      assignedClasses: ['Class 9 — BS1'],
      authorizedSubjects: ['Chemistry'],
      classTeacherOf: 'Class 9 — BS1',
      personalAttendanceRate: 92
    },
    {
      id: 'tch-4',
      user_id: 'usr-teacher-4',
      employee_id: 'EMP-SSC-10908',
      department: 'Department of Languages & Humanities',
      designation: 'Bangla Teacher & Class Teacher (Class 7 — B1)',
      assignedClasses: ['Class 7 — B1'],
      authorizedSubjects: ['Bangla'],
      classTeacherOf: 'Class 7 — B1',
      personalAttendanceRate: 93
    },
    {
      id: 'tch-5',
      user_id: 'usr-teacher-5',
      employee_id: 'EMP-SSC-16678',
      department: 'Department of Languages & Humanities',
      designation: 'English Teacher & Class Teacher (Class 8 — B1)',
      assignedClasses: ['Class 8 — B1'],
      authorizedSubjects: ['English'],
      classTeacherOf: 'Class 8 — B1',
      personalAttendanceRate: 96
    },
    {
      id: 'tch-6',
      user_id: 'usr-teacher-6',
      employee_id: 'EMP-SSC-17724',
      department: 'Department of Computer & Information Technology',
      designation: 'ICT Teacher & Class Teacher (Class 7 — B2)',
      assignedClasses: ['Class 7 — B2'],
      authorizedSubjects: ['ICT'],
      classTeacherOf: 'Class 7 — B2',
      personalAttendanceRate: 88
    },
    {
      id: 'tch-7',
      user_id: 'usr-teacher-7',
      employee_id: 'EMP-SSC-19940',
      department: 'Department of Social Sciences',
      designation: 'BGS Teacher & Class Teacher (Class 8 — B2)',
      assignedClasses: ['Class 8 — B2'],
      authorizedSubjects: ['BGS'],
      classTeacherOf: 'Class 8 — B2',
      personalAttendanceRate: 85
    },
    {
      id: 'tch-8',
      user_id: 'usr-teacher-8',
      employee_id: 'EMP-SSC-12215',
      department: 'Department of Humanities & Ethics',
      designation: 'Religion Teacher (Class 8 — B2)',
      assignedClasses: ['Class 8 — B2'],
      authorizedSubjects: ['Religion'],
      classTeacherOf: 'Class 8 — B2',
      personalAttendanceRate: 91
    },
    {
      id: 'tch-9',
      user_id: 'usr-teacher-9',
      employee_id: 'EMP-SSC-16101',
      department: 'Department of Physical Sciences',
      designation: 'Physics Teacher & Class Teacher (Class 6 — B1)',
      assignedClasses: ['Class 6 — B1'],
      authorizedSubjects: ['Physics'],
      classTeacherOf: 'Class 6 — B1',
      personalAttendanceRate: 94
    },
    {
      id: 'tch-10',
      user_id: 'usr-teacher-10',
      employee_id: 'EMP-SSC-16202',
      department: 'Department of Social Sciences',
      designation: 'BGS Teacher & Class Teacher (Class 6 — B2)',
      assignedClasses: ['Class 6 — B2'],
      authorizedSubjects: ['BGS'],
      classTeacherOf: 'Class 6 — B2',
      personalAttendanceRate: 89
    },
    {
      id: 'tch-11',
      user_id: 'usr-teacher-11',
      employee_id: 'EMP-SSC-16303',
      department: 'Department of Biological Sciences',
      designation: 'Biology Teacher & Class Teacher (Class 10 — BS1)',
      assignedClasses: ['Class 10 — BS1'],
      authorizedSubjects: ['Biology'],
      classTeacherOf: 'Class 10 — BS1',
      personalAttendanceRate: 96
    },
    {
      id: 'tch-12',
      user_id: 'usr-teacher-12',
      employee_id: 'EMP-SSC-16404',
      department: 'Department of Mathematics',
      designation: 'Higher Math Teacher & Class Teacher (Class 9 — BS1)',
      assignedClasses: ['Class 9 — BS1'],
      authorizedSubjects: ['Higher Math'],
      classTeacherOf: 'Class 9 — BS1',
      personalAttendanceRate: 99
    }
  ],

  classes: SEED_ROSTER.classes,

  // Exact subject sequence: Physics -> Biology -> Chemistry -> Higher Math -> Bangla -> English -> ICT -> BGS -> Religion
  subjects: [
    { id: 'sub-phy', name: 'Physics', code: 'PHY-136', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'Saif Chowdhury' },
    { id: 'sub-bio', name: 'Biology', code: 'BIO-138', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'MD. MAHFUJUL HAQUE' },
    { id: 'sub-che', name: 'Chemistry', code: 'CHE-137', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'MD. RAISUL ISLAM' },
    { id: 'sub-hm', name: 'Higher Math', code: 'HM-126', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'MD SHAHIDUL ISLAM' },
    { id: 'sub-ban', name: 'Bangla', code: 'BAN-101', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'MD. RONY KHAN' },
    { id: 'sub-eng', name: 'English', code: 'ENG-107', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'ANONNO IBNE RAZZAK' },
    { id: 'sub-ict', name: 'ICT', code: 'ICT-154', class: 'Class 9 — BS1', fullMarks: 50, teacherName: 'MUHAMMAD MOKHLESUR RAHMAN' },
    { id: 'sub-bgs', name: 'BGS', code: 'BGS-150', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'MD. AMIR HOSSAIN' },
    { id: 'sub-rel', name: 'Religion', code: 'REL-111', class: 'Class 9 — BS1', fullMarks: 100, teacherName: 'FAYSAL Ahmed' }
  ],

  attendance: SEED_ROSTER.attendance,

  // Exact subject sequence: Physics -> Biology -> Chemistry -> Bangla -> English -> ICT -> BGS -> Religion
  results: [
    {
      id: 'res-1',
      student_id: 'std-1',
      subject_id: 'sub-phy',
      subjectName: 'Physics',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 94,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 96,
      positionInSubject: 2,
      remarks: 'Outstanding mastery of vector mechanics and energy conservation.'
    },
    {
      id: 'res-2',
      student_id: 'std-1',
      subject_id: 'sub-bio',
      subjectName: 'Biology',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 84,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 91,
      positionInSubject: 5,
      remarks: 'Clear cellular diagrams; review plant vascular tissue transport.'
    },
    {
      id: 'res-3',
      student_id: 'std-1',
      subject_id: 'sub-che',
      subjectName: 'Chemistry',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 89,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 93,
      positionInSubject: 3,
      remarks: 'Strong stoichiometric calculations and periodic trends analysis.'
    },
    {
      id: 'res-4',
      student_id: 'std-1',
      subject_id: 'sub-ban',
      subjectName: 'Bangla',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 78,
      grade: 'A',
      gpa: 4.0,
      highestInClass: 88,
      positionInSubject: 9,
      remarks: 'Good prose analysis; focus on classical poetry commentary.'
    },
    {
      id: 'res-5',
      student_id: 'std-1',
      subject_id: 'sub-eng',
      subjectName: 'English',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 86,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 90,
      positionInSubject: 4,
      remarks: 'Articulate analytical writing and grammar precision.'
    },
    {
      id: 'res-6',
      student_id: 'std-1',
      subject_id: 'sub-ict',
      subjectName: 'ICT',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 50,
      marks: 48,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 49,
      positionInSubject: 2,
      remarks: 'Excellent digital logic gate & algorithm implementation.'
    },
    {
      id: 'res-7',
      student_id: 'std-1',
      subject_id: 'sub-bgs',
      subjectName: 'BGS',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 92,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 95,
      positionInSubject: 1,
      remarks: 'Comprehensive analysis of national history, economics, and civic governance.'
    },
    {
      id: 'res-8',
      student_id: 'std-1',
      subject_id: 'sub-rel',
      subjectName: 'Religion',
      exam_id: 'ex-hy-2026',
      examName: 'Half-Yearly Examination 2026',
      fullMarks: 100,
      marks: 91,
      grade: 'A+',
      gpa: 5.0,
      highestInClass: 95,
      positionInSubject: 3,
      remarks: 'Thoughtful ethical reflections and complete citations.'
    },
    ...SEED_ROSTER.extraResults
  ],

  exams: [
    {
      id: 'ex-1',
      name: 'Physics CT 03',
      type: 'Class Test',
      subject: 'Physics',
      class: 'Class 9 — BS1',
      date: '2026-10-15',
      time: '09:30 AM – 10:15 AM',
      syllabus: 'Chapter 1–3 (Measurement, Motion & Force)',
      room: 'Room 304 (Science Block)',
      instructions: 'Bring a non-programmable scientific calculator and geometric instruments.'
    },
    {
      id: 'ex-2',
      name: 'Biology CT 03',
      type: 'Class Test',
      subject: 'Biology',
      class: 'Class 9 — BS1',
      date: '2026-10-18',
      time: '08:45 AM – 09:30 AM',
      syllabus: 'Chapter 2 & 4 (Cell Structure & Bioenergetics)',
      room: 'Room 304 (Science Block)',
      instructions: 'Label all cellular organelle diagrams clearly.'
    },
    {
      id: 'ex-3',
      name: 'Chemistry Monthly Assessment',
      type: 'Monthly Test',
      subject: 'Chemistry',
      class: 'Class 9 — BS1',
      date: '2026-10-21',
      time: '10:30 AM – 11:30 AM',
      syllabus: 'Chapter 4–5 (Periodic Table & Chemical Bonding)',
      room: 'Chemistry Lecture Hall 201',
      instructions: 'Periodic table values will be provided for heavy elements.'
    },
    {
      id: 'ex-4',
      name: 'Annual Final Examination 2026',
      type: 'Final Examination',
      subject: 'All Core Subjects',
      class: 'Class 9 — BS1',
      date: '2026-11-18',
      time: '09:00 AM – 12:00 PM',
      syllabus: 'Full Annual Curriculum (Chapters 1–12)',
      room: 'Main Examination Auditorium',
      instructions: 'Admit card and student ID badge are mandatory for entry.'
    }
  ],

  routines: [
    // Saturday (Exact sequence: Physics -> Biology -> Chemistry -> Bangla -> English -> ICT -> BGS)
    { id: 'rt-sat-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Saturday', period: 1, timeRange: '08:00 – 08:45', room: 'Room 304' },
    { id: 'rt-sat-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Saturday', period: 2, timeRange: '08:45 – 09:30', room: 'Bio Lab 1' },
    { id: 'rt-sat-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Saturday', period: 3, timeRange: '09:30 – 10:15', room: 'Chem Lab 2' },
    { id: 'rt-sat-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Saturday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-sat-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Saturday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-sat-6', class: 'Class 9 — BS1', subject: 'ICT', teacher: 'MUHAMMAD MOKHLESUR RAHMAN', teacher_id: 'tch-6', day: 'Saturday', period: 6, timeRange: '12:15 – 13:00', room: 'Digital Lab 1' },
    { id: 'rt-sat-7', class: 'Class 9 — BS1', subject: 'BGS', teacher: 'MD. AMIR HOSSAIN', teacher_id: 'tch-7', day: 'Saturday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' },

    // Sunday
    { id: 'rt-sun-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Sunday', period: 1, timeRange: '08:00 – 08:45', room: 'Physics Lab 1' },
    { id: 'rt-sun-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Sunday', period: 2, timeRange: '08:45 – 09:30', room: 'Room 304' },
    { id: 'rt-sun-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Sunday', period: 3, timeRange: '09:30 – 10:15', room: 'Room 304' },
    { id: 'rt-sun-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Sunday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-sun-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Sunday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-sun-6', class: 'Class 9 — BS1', subject: 'BGS', teacher: 'MD. AMIR HOSSAIN', teacher_id: 'tch-7', day: 'Sunday', period: 6, timeRange: '12:15 – 13:00', room: 'Room 304' },
    { id: 'rt-sun-7', class: 'Class 9 — BS1', subject: 'Religion', teacher: 'FAYSAL AHMED', teacher_id: 'tch-8', day: 'Sunday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' },

    // Monday
    { id: 'rt-mon-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Monday', period: 1, timeRange: '08:00 – 08:45', room: 'Room 304' },
    { id: 'rt-mon-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Monday', period: 2, timeRange: '08:45 – 09:30', room: 'Bio Lab 1' },
    { id: 'rt-mon-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Monday', period: 3, timeRange: '09:30 – 10:15', room: 'Room 304' },
    { id: 'rt-mon-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Monday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-mon-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Monday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-mon-6', class: 'Class 9 — BS1', subject: 'ICT', teacher: 'MUHAMMAD MOKHLESUR RAHMAN', teacher_id: 'tch-6', day: 'Monday', period: 6, timeRange: '12:15 – 13:00', room: 'Digital Lab 1' },
    { id: 'rt-mon-7', class: 'Class 9 — BS1', subject: 'Religion', teacher: 'FAYSAL AHMED', teacher_id: 'tch-8', day: 'Monday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' },

    // Tuesday
    { id: 'rt-tue-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Tuesday', period: 1, timeRange: '08:00 – 08:45', room: 'Room 304' },
    { id: 'rt-tue-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Tuesday', period: 2, timeRange: '08:45 – 09:30', room: 'Room 304' },
    { id: 'rt-tue-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Tuesday', period: 3, timeRange: '09:30 – 10:15', room: 'Chem Lab 2' },
    { id: 'rt-tue-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Tuesday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-tue-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Tuesday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-tue-6', class: 'Class 9 — BS1', subject: 'BGS', teacher: 'MD. AMIR HOSSAIN', teacher_id: 'tch-7', day: 'Tuesday', period: 6, timeRange: '12:15 – 13:00', room: 'Room 304' },
    { id: 'rt-tue-7', class: 'Class 9 — BS1', subject: 'Religion', teacher: 'FAYSAL AHMED', teacher_id: 'tch-8', day: 'Tuesday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' },

    // Wednesday
    { id: 'rt-wed-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Wednesday', period: 1, timeRange: '08:00 – 08:45', room: 'Physics Lab 1' },
    { id: 'rt-wed-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Wednesday', period: 2, timeRange: '08:45 – 09:30', room: 'Room 304' },
    { id: 'rt-wed-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Wednesday', period: 3, timeRange: '09:30 – 10:15', room: 'Room 304' },
    { id: 'rt-wed-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Wednesday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-wed-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Wednesday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-wed-6', class: 'Class 9 — BS1', subject: 'ICT', teacher: 'MUHAMMAD MOKHLESUR RAHMAN', teacher_id: 'tch-6', day: 'Wednesday', period: 6, timeRange: '12:15 – 13:00', room: 'Digital Lab 1' },
    { id: 'rt-wed-7', class: 'Class 9 — BS1', subject: 'BGS', teacher: 'MD. AMIR HOSSAIN', teacher_id: 'tch-7', day: 'Wednesday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' },

    // Thursday
    { id: 'rt-thu-1', class: 'Class 9 — BS1', subject: 'Physics', teacher: 'Saif Chowdhury', teacher_id: 'tch-1', day: 'Thursday', period: 1, timeRange: '08:00 – 08:45', room: 'Room 304' },
    { id: 'rt-thu-2', class: 'Class 9 — BS1', subject: 'Biology', teacher: 'MD. MAHFUJUL HAQUE', teacher_id: 'tch-2', day: 'Thursday', period: 2, timeRange: '08:45 – 09:30', room: 'Room 304' },
    { id: 'rt-thu-3', class: 'Class 9 — BS1', subject: 'Chemistry', teacher: 'MD. RAISUL ISLAM', teacher_id: 'tch-3', day: 'Thursday', period: 3, timeRange: '09:30 – 10:15', room: 'Room 304' },
    { id: 'rt-thu-4', class: 'Class 9 — BS1', subject: 'Bangla', teacher: 'MD. RONY KHAN', teacher_id: 'tch-4', day: 'Thursday', period: 4, timeRange: '10:15 – 11:00', room: 'Room 304' },
    { id: 'rt-thu-5', class: 'Class 9 — BS1', subject: 'English', teacher: 'ANONNO IBNE RAZZAK', teacher_id: 'tch-5', day: 'Thursday', period: 5, timeRange: '11:30 – 12:15', room: 'Room 304' },
    { id: 'rt-thu-6', class: 'Class 9 — BS1', subject: 'ICT', teacher: 'MUHAMMAD MOKHLESUR RAHMAN', teacher_id: 'tch-6', day: 'Thursday', period: 6, timeRange: '12:15 – 13:00', room: 'Digital Lab 1' },
    { id: 'rt-thu-7', class: 'Class 9 — BS1', subject: 'Religion', teacher: 'FAYSAL AHMED', teacher_id: 'tch-8', day: 'Thursday', period: 7, timeRange: '13:00 – 13:45', room: 'Room 304' }
  ],

  assignments: [
    {
      id: 'asg-1',
      teacher: 'Saif Chowdhury',
      teacher_id: 'tch-1',
      class: 'Class 9 — BS1',
      subject: 'Physics',
      title: 'Kinematic Equations & Free-Fall Acceleration Lab Report',
      description: 'Plot velocity-time and displacement-time graphs for a freely falling sphere and verify g = 9.81 m/s² using Brainify Physics Lab data.',
      due_date: '2026-10-12',
      status: 'In Progress',
      totalSubmissions: 28,
      pendingCount: 10,
      lateCount: 2
    },
    {
      id: 'asg-2',
      teacher: 'MD. MAHFUJUL HAQUE',
      teacher_id: 'tch-2',
      class: 'Class 9 — BS1',
      subject: 'Biology',
      title: 'Eukaryotic Organelles & Bioenergetics Diagram Portfolio',
      description: 'Prepare labeled cross-sectional diagrams of the mitochondrion and chloroplast and summarize ATP synthesis.',
      due_date: '2026-10-13',
      status: 'Submitted',
      submittedFileName: 'Aryan_Roll01_Biology_Portfolio.pdf',
      submittedAt: '2026-10-02 18:40',
      totalSubmissions: 39,
      pendingCount: 0,
      lateCount: 1
    },
    {
      id: 'asg-3',
      teacher: 'MD. RAISUL ISLAM',
      teacher_id: 'tch-3',
      class: 'Class 9 — BS1',
      subject: 'Chemistry',
      title: 'Ionic vs Covalent Bonding Lewis Dot Structures',
      description: 'Draw complete electron-dot diagrams for NaCl, MgO, H₂O, CO₂, NH₃, and CH₄ and compare their melting points.',
      due_date: '2026-10-14',
      status: 'Not Started',
      totalSubmissions: 19,
      pendingCount: 21,
      lateCount: 0
    }
  ],

  notices: [
    {
      id: 'not-1',
      title: 'Annual Science & Innovation Fair 2026 — Project Registration Open',
      content: 'Students of Classes 6–10 are invited to register their interactive hardware, software, and laboratory research models for the SSC Annual Science Fair. Chronos digital simulations qualify for the Computational Science track.',
      category: 'Event',
      target: 'public',
      created_by: 'Academic Council',
      date: '2026-10-05',
      important: true
    },
    {
      id: 'not-2',
      title: 'Physics CT 03 Schedule & Syllabus Confirmation (Class 9 — BS1)',
      content: 'Tomorrow’s physics review session will cover free-body diagrams and conservation of momentum ahead of Physics CT 03 on 15 October (Chapters 1–3).',
      category: 'Exam',
      target: 'Class 9 — BS1',
      created_by: 'Saif Chowdhury',
      date: '2026-10-06',
      important: true
    },
    {
      id: 'not-3',
      title: 'Autumn Mid-Term Library Extended Hours',
      content: 'The central reference library and digital research terminals will remain open until 06:30 PM from Saturday to Thursday throughout October.',
      category: 'Academic',
      target: 'public',
      created_by: 'Office of the Principal',
      date: '2026-10-01',
      important: false
    },
    {
      id: 'not-4',
      title: '2027 Academic Session Admission Circular (Classes 6, 9 & 11)',
      content: 'Prospective students and guardians may download the admission prospectus and submit online applications starting 01 November 2026.',
      category: 'Admission',
      target: 'public',
      created_by: 'Admissions Office',
      date: '2026-09-28',
      important: false
    },
    {
      id: 'not-5',
      title: 'National Autumn Observatory Night & Telescope Workshop',
      content: 'The SSC Astronomy & Space Club will host a rooftop Saturn and Jupiter observation session this Thursday at 07:00 PM.',
      category: 'General',
      target: 'public',
      created_by: 'SSC Science Club',
      date: '2026-09-25',
      important: false
    }
  ],

  // Ordered in exact sequence: Physics -> Biology -> Chemistry -> Bangla -> English -> ICT -> BGS -> Religion
  previous_questions: [
    {
      id: 'pq-1',
      title: '2026 Physics CT — Measurement, Kinematics & Dynamics',
      subject: 'Physics',
      class: 'Class 9',
      year: 2026,
      exam: 'Class Test',
      chapter: 'Chapter 1–3',
      duration: '45 Minutes',
      fullMarks: 25,
      uploadedBy: 'Saif Chowdhury',
      questionsText: [
        '1. [Stem] A 1,200 kg test vehicle accelerates uniformly from rest to 25 m/s in 10 seconds along a horizontal track, after which a braking force of 3,600 N is applied.',
        '   (a) Define vernier constant and state its SI unit. [1 Mark]',
        '   (b) Why can velocity-time graph slope never be vertical for a physical object? [2 Marks]',
        '   (c) Calculate the net driving force acting on the vehicle during the first 10 seconds. [3 Marks]',
        '   (d) Determine the total stopping distance of the vehicle and analyze whether kinetic energy is conserved during braking. [4 Marks]',
        '2. [Short Numericals — 5 × 3 = 15 Marks]',
        '   (i) A stone dropped into a well hits the water after 3.2 s. Find the depth of the well (g = 9.8 m/s²).',
        '   (ii) Prove s = ut + ½at² graphically using a velocity-time trapezium.'
      ]
    },
    {
      id: 'pq-2',
      title: '2025 Biology Half-Yearly — Cell Structure & Bioenergetics',
      subject: 'Biology',
      class: 'Class 9',
      year: 2025,
      exam: 'Half-Yearly Examination',
      chapter: 'Chapter 2 & 4',
      duration: '2 Hours 30 Minutes',
      fullMarks: 75,
      uploadedBy: 'MD. MAHFUJUL HAQUE',
      questionsText: [
        '1. Observe the cellular organelles: Organelle P (Chloroplast) and Organelle Q (Mitochondrion):',
        '   (a) What is oxysome? [1 Mark]',
        '   (b) Why is the mitochondrion called the powerhouse of the eukaryotic cell? [2 Marks]',
        '   (c) Explain how Organelle P converts solar photon energy into chemical ATP and NADPH. [3 Marks]',
        '   (d) Analyze the interdependence of Organelles P and Q in maintaining atmospheric O₂/CO₂ balance. [4 Marks]'
      ]
    },
    {
      id: 'pq-3',
      title: '2025 Chemistry CT — Atomic Structure & Periodic Table',
      subject: 'Chemistry',
      class: 'Class 9',
      year: 2025,
      exam: 'Class Test',
      chapter: 'Chapter 3–4',
      duration: '45 Minutes',
      fullMarks: 25,
      uploadedBy: 'MD. RAISUL ISLAM',
      questionsText: [
        '1. Element X has atomic number Z = 19 and Element Y has atomic number Z = 17:',
        '   (a) Write the full subshell electronic configurations of X and Y. [2 Marks]',
        '   (b) Explain why Element X is placed in Period 4, Group 1 of the Periodic Table. [3 Marks]',
        '   (c) Compare the atomic radius and first ionization energy of X and Y. [4 Marks]',
        '   (d) Illustrate the ionic bond formation between X and Y using orbital diagrams. [6 Marks]'
      ]
    },
    {
      id: 'pq-4',
      title: '2025 Bangla Half-Yearly — Classical Prose & Grammar',
      subject: 'Bangla',
      class: 'Class 9',
      year: 2025,
      exam: 'Half-Yearly Examination',
      chapter: 'Prose & Poetry Selections',
      duration: '2 Hours 30 Minutes',
      fullMarks: 100,
      uploadedBy: 'MD. RONY KHAN',
      questionsText: [
        '1. Analyze the central theme and historical context of the selected classical prose passage.',
        '2. Identify the grammatical compound structures and sandhi transformations in the given lines.'
      ]
    }
  ],

  activities: [
    {
      id: 'act-1',
      student_id: 'std-1',
      category: 'Science',
      activity: 'SSC Annual Science & Robotics Fair',
      roleOrParticipation: 'Lead Presenter — Automated Smart Grid & Chronos Lab',
      achievement: '1st Place Gold Medal (Junior Division)',
      certificateCode: 'CERT-SSC-SCI-2026-01',
      date: '2026-08-19'
    },
    {
      id: 'act-2',
      student_id: 'std-1',
      category: 'Programming',
      activity: 'Inter-House Algorithmic Problem Solving Olympiad',
      roleOrParticipation: 'Finalist Competitor (Class 9 Category)',
      achievement: 'Honorary Mention — Fastest Dynamic Programming Solution',
      certificateCode: 'CERT-SSC-PRG-2026-14',
      date: '2026-07-11'
    },
    {
      id: 'act-3',
      student_id: 'std-1',
      category: 'Debate',
      activity: 'SSC Parliamentary Debate Championship',
      roleOrParticipation: 'Prime Minister Speaker — House Crimson',
      achievement: 'Best Speaker Runner-Up',
      certificateCode: 'CERT-SSC-DEB-2026-08',
      date: '2026-05-24'
    },
    {
      id: 'act-4',
      student_id: 'std-1',
      category: 'Football',
      activity: 'Inter-Section Autumn Football Tournament',
      roleOrParticipation: 'Central Midfielder — Class 9 BS2 Squad',
      achievement: 'Semi-Finalist Team Distinction',
      certificateCode: 'CERT-SSC-SPT-2026-22',
      date: '2026-09-10'
    }
  ],

  // Ordered in exact sequence: Physics -> Biology -> Chemistry -> Bangla -> English -> ICT -> BGS -> Religion
  syllabus: [
    {
      id: 'syl-phy-1',
      subject: 'Physics',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 01',
      chapterName: 'Physical Quantities and Measurement',
      topics: ['SI Base & Derived Units', 'Dimensional Analysis', 'Vernier Calipers & Screw Gauge', 'Error Propagation'],
      status: 'Completed',
      teacherNotes: 'Instructor: Saif Chowdhury · All practical lab measurements verified in Physics Lab 1.'
    },
    {
      id: 'syl-phy-2',
      subject: 'Physics',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 02',
      chapterName: 'Motion (Kinematics)',
      topics: ['Scalar vs Vector Quantities', 'Equations of Uniformly Accelerated Motion', 'Free-Fall Motion under Gravity', 'v–t and s–t Graph Analysis'],
      status: 'In Progress',
      teacherNotes: 'Instructor: Saif Chowdhury · Practice graphical derivations for Physics CT 03 on 15 October.'
    },
    {
      id: 'syl-bio-1',
      subject: 'Biology',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 04',
      chapterName: 'Bioenergetics (Photosynthesis & Respiration)',
      topics: ['ATP Structure & Cycle', 'Light & Dark Reactions (C3/C4)', 'Aerobic Glycolysis & Krebs Cycle'],
      status: 'In Progress',
      teacherNotes: 'Instructor: MD. MAHFUJUL HAQUE · Lab practical on leaf chlorophyll chromatography scheduled next week.'
    },
    {
      id: 'syl-che-1',
      subject: 'Chemistry',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 04',
      chapterName: 'Periodic Table & Periodicity',
      topics: ['Electronic Configurations & Blocks (s, p, d, f)', 'Atomic Radius & Ionization Energy Trends', 'Electronegativity', 'Alkali, Halogen & Noble Gas Families'],
      status: 'Completed',
      teacherNotes: 'Instructor: MD. RAISUL ISLAM · Use Brainify Interactive 118-Element Periodic Table to review orbital shells.'
    },
    {
      id: 'syl-ban-1',
      subject: 'Bangla',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 01',
      chapterName: 'Classical & Modern Bengali Prose and Grammar',
      topics: ['Literary Analysis', 'Sandhi & Samas', 'Formal Essay Composition'],
      status: 'Completed',
      teacherNotes: 'Instructor: MD. RONY KHAN · Review prose commentary and grammar exercises.'
    },
    {
      id: 'syl-eng-1',
      subject: 'English',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Unit 03',
      chapterName: 'Reading Comprehension, Transformation & Analytical Writing',
      topics: ['Clause Synthesis', 'Narrative & Expository Writing', 'Academic Vocabulary'],
      status: 'Completed',
      teacherNotes: 'Instructor: ANONNO IBNE RAZZAK · Practice analytical summary writing.'
    },
    {
      id: 'syl-ict-1',
      subject: 'ICT',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 03',
      chapterName: 'Number Systems & Digital Logic Circuits',
      topics: ['Binary, Octal & Hexadecimal Conversions', 'Boolean Algebra', 'AND, OR, NOT, NAND & XOR Logic Gates'],
      status: 'Completed',
      teacherNotes: 'Instructor: MUHAMMAD MOKHLESUR RAHMAN · Digital logic gate lab completed.'
    },
    {
      id: 'syl-bgs-1',
      subject: 'BGS',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 02',
      chapterName: 'Independent Bangladesh, Constitution & Economic Development',
      topics: ['Historical Milestones', 'Civic Responsibilities', 'National Economic Indicators'],
      status: 'Completed',
      teacherNotes: 'Instructor: MD. AMIR HOSSAIN · Review timeline and constitutional framework.'
    },
    {
      id: 'syl-rel-1',
      subject: 'Religion',
      class: 'Class 9',
      term: 'Half-Yearly Term',
      chapterNumber: 'Chapter 01',
      chapterName: 'Foundations of Faith, Moral Values & Ethical Conduct',
      topics: ['Core Ethical Principles', 'Social Responsibility', 'Textual Reflections'],
      status: 'Completed',
      teacherNotes: 'Instructor: FAYSAL AHMED · Complete chapter reflections.'
    }
  ],

  notifications: [
    {
      id: 'notif-std-cmp-reply-2',
      eventKey: 'cmp_reply_cmp-std-2_Replied',
      title: 'Complaint Reply Received',
      message: 'Class Teacher Saif Chowdhury replied to "Broken Bench & Microscope Light in Row 2": "Maintenance team has been informed to repair Row 2 bench and Station 4 light today."',
      timestamp: '20 minutes ago',
      read: false,
      resolved: false,
      targetRole: 'student',
      category: 'complaint',
      notificationType: 'complaint_reply',
      studentCode: '90003',
      studentClass: 'Class 9',
      studentSection: 'BS2',
      complaintId: 'cmp-std-2'
    },
    {
      id: 'notif-1',
      eventKey: 'exam_ex-1_scheduled',
      title: 'Upcoming Class Test (CT)',
      message: 'Physics CT 03 is scheduled for 15 October (Chapters 1–3).',
      timestamp: '10 minutes ago',
      read: false,
      targetRole: 'both',
      category: 'exam',
      notificationType: 'exam',
      studentClass: 'Class 9',
      studentSection: 'BS2',
      subject: 'Physics',
      recipientTeacherCode: '18887'
    },
    {
      id: 'notif-2',
      eventKey: 'att_2026-10-06_cls-9-bs2',
      title: 'Attendance Updated',
      message: 'Your attendance for today (06 Oct 2026) was marked Present by Saif Chowdhury.',
      timestamp: '1 hour ago',
      read: false,
      targetRole: 'student',
      category: 'attendance',
      notificationType: 'attendance',
      studentClass: 'Class 9',
      studentSection: 'BS2'
    },
    {
      id: 'notif-4',
      eventKey: 'res_sub-phy_std-1_hy2026',
      title: 'Subject Result Published',
      message: 'Physics & Half-Yearly Examination 2026 results updated (94/100 · Grade A+ · GPA 5.00).',
      timestamp: '2 hours ago',
      read: false,
      targetRole: 'student',
      category: 'result',
      notificationType: 'result',
      studentCode: '90001',
      studentClass: 'Class 9',
      studentSection: 'BS2'
    },
    {
      id: 'notif-3',
      eventKey: 'asg_asg-1_posted',
      title: 'New Assignment Posted',
      message: 'Physics: Kinematic Equations & Free-Fall Acceleration Lab Report due 12 Oct.',
      timestamp: '3 hours ago',
      read: false,
      targetRole: 'student',
      category: 'assignment',
      notificationType: 'assignment',
      studentClass: 'Class 9',
      studentSection: 'BS1'
    },
    {
      id: 'notif-notice-2',
      eventKey: 'notice_not-2_published',
      title: 'Teacher Announcement: Physics CT 03 Syllabus',
      message: 'Saif Chowdhury posted an announcement for Class 9 — BS1: Physics review session ahead of Physics CT 03 on 15 October.',
      timestamp: '4 hours ago',
      read: false,
      targetRole: 'student',
      category: 'general',
      notificationType: 'announcement',
      studentClass: 'Class 9',
      studentSection: 'BS1'
    },
    {
      id: 'notif-cmp-std-1-rev',
      eventKey: 'cmp_new_cmp-std-1',
      title: 'New Complaint Submitted (90001)',
      message: 'Ahnaf Nahin Shahariar (Class 9 — BS1, Roll 01) submitted "Request for Extra Doubt-Solving Session Before Physics CT 03".',
      timestamp: '15 minutes ago',
      read: false,
      resolved: false,
      targetRole: 'teacher',
      category: 'complaint',
      notificationType: 'complaint_submitted',
      studentClass: 'Class 9',
      studentSection: 'BS1',
      recipientTeacherCode: '16404',
      complaintId: 'cmp-std-1'
    },
    {
      id: 'notif-6',
      eventKey: 'cmp_new_cmp-1',
      title: 'New Student Complaint in Box',
      message: 'MD. RAISUL ISLAM (Chemistry) sent a complaint regarding Takrim Muhtadi (ID: 90003) to Class 9 — BS1 Complaint Box.',
      timestamp: '25 minutes ago',
      read: false,
      resolved: false,
      targetRole: 'teacher',
      category: 'complaint',
      notificationType: 'complaint_submitted',
      studentClass: 'Class 9',
      studentSection: 'BS1',
      recipientTeacherCode: '16404',
      complaintId: 'cmp-1'
    }
  ],

  complaints: [
    {
      id: 'cmp-std-1',
      student_id: 'std-1',
      student_code: '90001',
      student_name: 'Ahnaf Nahin Shahariar',
      student_roll: 1,
      class_name: 'Class 9',
      section: 'BS1',
      target_class_section: 'Class 9 — BS1',
      class_teacher_code: '16404',
      class_teacher_name: 'MD SHAHIDUL ISLAM',
      from_teacher_code: '90001',
      from_teacher_name: 'Ahnaf Nahin Shahariar (Student)',
      from_teacher_subject: 'Class 9 — BS1',
      submitted_by_role: 'student',
      category: 'Academic / Subject Issue',
      severity: 'Medium',
      subject_title: 'Request for Extra Doubt-Solving Session Before Physics CT 03',
      complaint_text:
        'Respected Class Teacher, several students in Class 9 — BS1 are facing difficulty with non-uniform acceleration graphs in Chapter 02. Could we have a 20-minute review session before Physics CT 03?',
      status: 'Submitted',
      created_at: '2026-10-08T09:30:00Z'
    },
    {
      id: 'cmp-std-2',
      student_id: 'std-3',
      student_code: '90003',
      student_name: 'Takrim Muhtadi',
      student_roll: 3,
      class_name: 'Class 9',
      section: 'BS1',
      target_class_section: 'Class 9 — BS1',
      class_teacher_code: '16404',
      class_teacher_name: 'MD SHAHIDUL ISLAM',
      from_teacher_code: '90003',
      from_teacher_name: 'Takrim Muhtadi (Student)',
      from_teacher_subject: 'Class 9 — BS1',
      submitted_by_role: 'student',
      category: 'Facility / Lab Issue',
      severity: 'Low',
      subject_title: 'Broken Bench & Microscope Light in Row 2',
      complaint_text:
        'Sir, the third bench in Row 2 of Room 304 has a loose frame and the lab microscope light on Station 4 is flickering during practicals.',
      status: 'Replied',
      class_teacher_note: 'Maintenance team has been informed to repair Row 2 bench and Station 4 light today.',
      replied_by: 'MD SHAHIDUL ISLAM',
      replied_at: '2026-10-08T09:20:00Z',
      created_at: '2026-10-08T09:05:00Z',
      seen_by_teacher: true
    },
    {
      id: 'cmp-1',
      student_id: 'std-3',
      student_code: '90003',
      student_name: 'Takrim Muhtadi',
      student_roll: 3,
      class_name: 'Class 9',
      section: 'BS1',
      target_class_section: 'Class 9 — BS1',
      class_teacher_code: '16404',
      class_teacher_name: 'MD SHAHIDUL ISLAM',
      from_teacher_code: '18886',
      from_teacher_name: 'MD. RAISUL ISLAM',
      from_teacher_subject: 'Chemistry',
      submitted_by_role: 'teacher',
      category: 'Lab Safety / Equipment',
      severity: 'High',
      subject_title: 'Unattended Bunsen Burner & Lab Coat Missing in Chemistry Practical',
      complaint_text:
        'During 3rd Period Chemistry Practical in Lab 2, Takrim Muhtadi (ID: 90003) did not bring his lab coat and left his station burner unattended during titration setup. Please counsel him regarding strict laboratory safety rules.',
      status: 'Submitted',
      created_at: '2026-10-08T08:45:00Z'
    },
    {
      id: 'cmp-2',
      student_id: 'std-4',
      student_code: '90004',
      student_name: 'Mansif Alam',
      student_roll: 4,
      class_name: 'Class 9',
      section: 'BS1',
      target_class_section: 'Class 9 — BS1',
      class_teacher_code: '16404',
      class_teacher_name: 'MD SHAHIDUL ISLAM',
      from_teacher_code: '16678',
      from_teacher_name: 'ANONNO IBNE RAZZAK',
      from_teacher_subject: 'English',
      submitted_by_role: 'teacher',
      category: 'Late / Homework Incomplete',
      severity: 'Medium',
      subject_title: 'Incomplete Analytical Essay Assignment for Two Consecutive Classes',
      complaint_text:
        'Mansif Alam (ID: 90004) has not submitted his Unit 03 analytical summary worksheet despite two reminders in English class. Requesting Class Teacher follow-up with the student.',
      status: 'Under Review',
      created_at: '2026-10-07T11:20:00Z'
    },
    {
      id: 'cmp-3',
      student_id: 'std-80002',
      student_code: '80002',
      student_name: 'Dewan Nihan',
      student_roll: 2,
      class_name: 'Class 8',
      section: 'B1',
      target_class_section: 'Class 8 — B1',
      class_teacher_code: '16678',
      class_teacher_name: 'ANONNO IBNE RAZZAK',
      from_teacher_code: '18887',
      from_teacher_name: 'Saif Chowdhury',
      from_teacher_subject: 'Physics',
      submitted_by_role: 'teacher',
      category: 'Classroom Conduct',
      severity: 'Medium',
      subject_title: 'Talking During Guest Science Demonstration',
      complaint_text:
        'Dewan Nihan (ID: 80002) was repeatedly talking with back-bench students during the inter-class Physics optics demonstration. Sent directly to Class 8 — B1 Class Teacher complaint box.',
      status: 'Resolved',
      class_teacher_note: 'Spoke with Dewan Nihan after assembly; student apologized and promised full attention.',
      replied_by: 'ANONNO IBNE RAZZAK',
      replied_at: '2026-10-06T12:00:00Z',
      resolved_at: '2026-10-06T14:00:00Z',
      created_at: '2026-10-06T10:15:00Z',
      seen_by_teacher: true
    },
    {
      id: 'cmp-4',
      student_id: 'std-12002',
      student_code: '12002',
      student_name: 'Jabid Hossain',
      student_roll: 2,
      class_name: 'Class 10',
      section: 'BS1',
      target_class_section: 'Class 10 — BS1',
      class_teacher_code: '16303',
      class_teacher_name: 'MD. MEHRAZ',
      from_teacher_code: '17724',
      from_teacher_name: 'MUHAMMAD MOKHLESUR RAHMAN',
      from_teacher_subject: 'ICT',
      submitted_by_role: 'teacher',
      category: 'Late / Homework Incomplete',
      severity: 'Medium',
      subject_title: 'Missed Digital Logic Gate Practical Submission',
      complaint_text:
        'Jabid Hossain (ID: 12002) missed the ICT practical lab submission deadline. Forwarding to Class 10 — BS1 Class Teacher for review.',
      status: 'Submitted',
      created_at: '2026-10-08T09:10:00Z'
    }
  ],

  audit_logs: [
    {
      id: 'aud-1',
      timestamp: '2026-10-08T08:00:00Z',
      actorId: 'usr-leadership-principal',
      actorName: 'Md Abul Hannan',
      actorRole: 'principal',
      actorPosition: 'Principal',
      action: 'School Academic Term Review',
      category: 'management',
      target: 'All Classes & Sections',
      details: 'Verified Half-Yearly Examination 2026 GPA distributions and 30-day attendance archives across 12 sections.'
    },
    {
      id: 'aud-2',
      timestamp: '2026-10-08T08:15:00Z',
      actorId: 'usr-teacher-9',
      actorName: 'MOHAMMAD ANISUZZAMAN',
      actorRole: 'teacher',
      action: 'Teacher Session Authenticated',
      category: 'auth',
      target: 'Class 6 — B1',
      details: 'Logged into Teacher Portal as Physics Teacher & Class Teacher for Class 6 — Section B1.'
    },
    {
      id: 'aud-3',
      timestamp: '2026-10-08T08:20:00Z',
      actorId: 'usr-teacher-10',
      actorName: 'MD. ARIFUR RAHMAN',
      actorRole: 'teacher',
      action: 'Teacher Session Authenticated',
      category: 'auth',
      target: 'Class 6 — B2',
      details: 'Logged into Teacher Portal as BGS Teacher & Class Teacher for Class 6 — Section B2.'
    },
    {
      id: 'aud-4',
      timestamp: '2026-10-08T09:20:00Z',
      actorId: 'usr-teacher-1',
      actorName: 'Saif Chowdhury',
      actorRole: 'teacher',
      action: 'Replied to Student Complaint',
      category: 'complaint',
      target: 'cmp-std-2 (Student ID: 90003)',
      details: 'Sent Class Teacher reply and updated status to Replied; cleared active reviewer notification.'
    }
  ],

  chief_advisor_permissions: {
    masterAccess: true,
    viewAttendance: true,
    viewReports: true,
    viewAcademicSummaries: true,
    viewAuditLogs: true,
    manageComplaints: true,
    manageDirectory: true,
    updatedBy: 'School Administrator',
    updatedAt: '2026-10-08T08:00:00Z'
  },

  teacher_calls: [],

  brainify: {
    xp: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    quizzesCompleted: 0,
    streak: 1,
    topicsExplored: [],
    quizHistory: [],
    unlockedAchievements: [],
    activityProgress: {}
  }
};
