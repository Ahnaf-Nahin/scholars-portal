export type UserRole = 'student' | 'teacher' | 'chairman' | 'chief_advisor' | 'principal';

export type LeadershipPosition = 'Chairman' | 'Chief Advisor' | 'Principal';

export interface ChiefAdvisorPermissions {
  masterAccess: boolean;
  viewAttendance: boolean;
  viewReports: boolean;
  viewAuditLogs: boolean;
  manageComplaints: boolean;
  viewAcademicSummaries: boolean;
  manageDirectory: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorPosition?: string;
  action: string;
  category: 'auth' | 'attendance' | 'result' | 'complaint' | 'approval' | 'management' | 'security';
  target?: string;
  details: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  position?: LeadershipPosition;
  profileImage: string;
  phone?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  studentClass?: string;
  section?: string;
  studentIdCode?: string;
  createdAt?: string;
  teacherCode?: string;
  passwordChanged?: boolean;
}

export interface VerificationRequestRecord {
  id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  student_email: string;
  class_name: string;
  section: string;
  class_teacher_code: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface StudentRecord {
  id: string;
  user_id: string;
  student_id: string;
  name?: string;
  roll: number;
  class: string;
  section: string;
  academic_year: string;
  streakDays: number;
}

export interface TeacherRecord {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  designation: string;
  assignedClasses: string[];
  authorizedSubjects: string[];
  classTeacherOf?: string; // e.g., "Class 9 — BS2"
  personalAttendanceRate?: number;
}

export interface ClassRecord {
  id: string;
  class_name: string;
  section: string;
  academic_year: string;
  class_teacher_id: string;
  room: string;
  studentCount: number;
}

export interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  class: string;
  fullMarks: number;
  teacherName: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Holiday';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_by: string;
}

export interface ResultRecord {
  id: string;
  student_id: string;
  subject_id: string;
  subjectName: string;
  exam_id: string;
  examName: string;
  fullMarks: number;
  marks: number;
  grade: string;
  gpa: number;
  highestInClass: number;
  positionInSubject: number;
  remarks: string;
}

export interface ExamRecord {
  id: string;
  name: string;
  type: 'Class Test' | 'Monthly Test' | 'Half-Yearly Examination' | 'Pre-Test' | 'Final Examination';
  subject: string;
  class: string;
  date: string; // YYYY-MM-DD
  time: string;
  syllabus: string;
  room: string;
  instructions?: string;
}

export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';

export interface RoutineRecord {
  id: string;
  class: string;
  subject: string;
  teacher: string;
  teacher_id: string;
  day: DayOfWeek;
  period: number; // 1 to 7
  timeRange: string;
  room: string;
}

export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Late';

export interface AssignmentRecord {
  id: string;
  teacher: string;
  teacher_id: string;
  class: string;
  subject: string;
  title: string;
  description: string;
  due_date: string;
  status: AssignmentStatus;
  submittedFileName?: string;
  submittedAt?: string;
  totalSubmissions?: number;
  pendingCount?: number;
  lateCount?: number;
}

export type NoticeCategory = 'Important' | 'Academic' | 'Event' | 'General' | 'Exam' | 'Holiday' | 'Admission' | 'Urgent';

export interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  target: 'public' | 'all' | 'Class 9 — BS1' | 'Class 9 — BS2' | 'teachers' | string;
  created_by: string;
  date: string;
  important: boolean;
}

export interface PreviousQuestionRecord {
  id: string;
  title: string;
  subject: string;
  class: string;
  year: number;
  exam: string;
  chapter: string;
  duration: string;
  fullMarks: number;
  questionsText: string[];
  uploadedBy: string;
}

export interface ActivityRecord {
  id: string;
  student_id: string;
  category: 'Football' | 'Cricket' | 'Debate' | 'Art' | 'Science' | 'Programming' | 'Cultural' | 'Music' | 'Writing' | 'Volunteer';
  activity: string;
  roleOrParticipation: string;
  achievement: string;
  certificateCode: string;
  date: string;
}

export interface SyllabusChapter {
  id: string;
  subject: string;
  class: string;
  term: 'Half-Yearly Term' | 'Final Term';
  chapterNumber: string;
  chapterName: string;
  topics: string[];
  status: 'Completed' | 'In Progress' | 'Not Started';
  teacherNotes: string;
}

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintCategory =
  | 'Academic / Subject Issue'
  | 'Schedule / Exam Query'
  | 'Facility / Lab Issue'
  | 'Peer / Classroom Concern'
  | 'Classroom Conduct'
  | 'Late / Homework Incomplete'
  | 'Lab Safety / Equipment'
  | 'Academic Integrity'
  | 'Attendance / Truancy'
  | 'General Observation';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Replied' | 'Resolved';

export interface StudentComplaintRecord {
  id: string;
  student_id: string;
  student_code: string;
  student_name: string;
  student_roll: number;
  class_name: string;
  section: string;
  target_class_section: string; // e.g., "Class 9 — BS2"
  class_teacher_code: string;
  class_teacher_name: string;
  from_teacher_code: string;
  from_teacher_name: string;
  from_teacher_subject: string;
  submitted_by_role?: 'student' | 'teacher';
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  subject_title: string;
  complaint_text: string;
  status: ComplaintStatus;
  class_teacher_note?: string;
  replied_by?: string;
  replied_at?: string;
  created_at: string;
  resolved_at?: string;
  seen_by_teacher?: boolean;
  seen_at?: string;
  read_by_teacher?: boolean;
  read_by_leadership?: boolean;
}

export interface TeacherCallRecord {
  id: string;
  teacher_id: string;
  teacher_code: string;
  teacher_name: string;
  teacher_subject: string;
  teacher_class_section: string;
  called_by_id: string;
  called_by_name: string;
  called_by_role: UserRole;
  called_by_position: LeadershipPosition;
  room: string;
  urgency: 'Immediate' | 'Within 15 Minutes' | 'After Current Period' | 'Scheduled';
  reason: string;
  status: 'Called' | 'Acknowledged' | 'Completed';
  created_at: string;
  acknowledged_at?: string;
}

export interface NotificationItem {
  id: string;
  eventKey?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  resolved?: boolean;
  targetRole: 'student' | 'teacher' | 'both' | 'leadership';
  category: 'exam' | 'attendance' | 'assignment' | 'result' | 'class' | 'complaint' | 'general' | 'approval';
  notificationType?:
    | 'complaint_submitted'
    | 'complaint_reply'
    | 'registration_request'
    | 'registration_reviewed'
    | 'attendance'
    | 'result'
    | 'exam'
    | 'assignment'
    | 'announcement'
    | 'teacher_call';
  studentUserId?: string;
  studentCode?: string;
  studentClass?: string;
  studentSection?: string;
  subject?: string;
  recipientTeacherCode?: string;
  complaintId?: string;
}

export interface BrainifyQuizHistory {
  id: string;
  category: string;
  subTopic: string;
  difficulty: string;
  score: number;
  total: number;
  accuracy: number;
  timeSeconds: number;
  date: string;
}

export interface BrainifyProgress {
  xp: number;
  questionsAnswered: number;
  correctAnswers: number;
  quizzesCompleted: number;
  streak: number;
  topicsExplored: string[];
  quizHistory: BrainifyQuizHistory[];
  unlockedAchievements: string[];
  dailyChallengeCompletedDate?: string;
  activityProgress?: Record<string, number>;
}

export interface PlatformDatabase {
  users: UserRecord[];
  students: StudentRecord[];
  teachers: TeacherRecord[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  attendance: AttendanceRecord[];
  results: ResultRecord[];
  exams: ExamRecord[];
  routines: RoutineRecord[];
  assignments: AssignmentRecord[];
  notices: NoticeRecord[];
  previous_questions: PreviousQuestionRecord[];
  activities: ActivityRecord[];
  syllabus: SyllabusChapter[];
  notifications: NotificationItem[];
  complaints: StudentComplaintRecord[];
  verification_requests?: VerificationRequestRecord[];
  audit_logs?: AuditLogRecord[];
  chief_advisor_permissions?: ChiefAdvisorPermissions;
  teacher_calls?: TeacherCallRecord[];
  brainify: BrainifyProgress;
}
