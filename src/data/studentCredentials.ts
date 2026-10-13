export interface PreRegisteredStudent {
  code: string;
  name: string;
  className: string;
  section: string;
  roll: number;
}

export interface ClassSectionConfig {
  id: string;
  className: string;
  section: string;
  codePrefix: string;
  room: string;
  teacherId: string;
}

export const ALL_CLASS_SECTIONS: ClassSectionConfig[] = [
  { id: 'cls-6-b1', className: 'Class 6', section: 'B1', codePrefix: '61', room: 'Room 101 (Junior Block)', teacherId: 'tch-9' },
  { id: 'cls-6-b2', className: 'Class 6', section: 'B2', codePrefix: '62', room: 'Room 102 (Junior Block)', teacherId: 'tch-10' },
  { id: 'cls-7-b1', className: 'Class 7', section: 'B1', codePrefix: '70', room: 'Room 201 (Middle Block)', teacherId: 'tch-4' },
  { id: 'cls-7-b2', className: 'Class 7', section: 'B2', codePrefix: '72', room: 'Room 202 (Middle Block)', teacherId: 'tch-6' },
  { id: 'cls-8-b1', className: 'Class 8', section: 'B1', codePrefix: '80', room: 'Room 204 (Middle Block)', teacherId: 'tch-5' },
  { id: 'cls-8-b2', className: 'Class 8', section: 'B2', codePrefix: '82', room: 'Room 205 (Middle Block)', teacherId: 'tch-7' },
  { id: 'cls-9-bs1', className: 'Class 9', section: 'BS1', codePrefix: '91', room: 'Room 302 (Science Block)', teacherId: 'tch-2' },
  { id: 'cls-9-bs2', className: 'Class 9', section: 'BS1', codePrefix: '90', room: 'Room 304 (Science Block)', teacherId: 'tch-12' },
  { id: 'cls-10-bs1', className: 'Class 10', section: 'BS1', codePrefix: '10', room: 'Room 402 (Science Block)', teacherId: 'tch-1' },
  { id: 'cls-10-bs2', className: 'Class 10', section: 'BS1', codePrefix: '12', room: 'Room 404 (Science Block)', teacherId: 'tch-11' }
];

export const EXPLICIT_LOGIN_STUDENT_DIRECTORY: PreRegisteredStudent[] = [
  { code: '90001', name: 'Ahnaf Nahin Shahariar', className: 'Class 9', section: 'BS1', roll: 1 },
  { code: '90002', name: 'Rushaid Mujtahid Chowdhury', className: 'Class 9', section: 'BS1', roll: 2 },
  { code: '90003', name: 'Takrim Muhtadi', className: 'Class 9', section: 'BS1', roll: 3 },
  { code: '90004', name: 'Mansif Alam', className: 'Class 9', section: 'BS1', roll: 4 },
  { code: '90005', name: 'Ahnaf Alam Faiyaz', className: 'Class 9', section: 'BS1', roll: 5 },
  { code: '90006', name: 'Cristiano Ronaldo', className: 'Class 9', section: 'BS1', roll: 6 }
];

// Explicit primary student names per class so specific student codes always map to their exact names
const EXPLICIT_CLASS_7_B1_NAMES: string[] = [
  'Mohammad Rafi',
  'Farhan Patwary',
  'Shadik Bin Towhid',
  'Arosh Khan',
  'Mamun Haque',
  'Said Kuddus'
];

const EXPLICIT_CLASS_8_B1_NAMES: string[] = [
  'Rafi Hossain',
  'Dewan Nihan',
  'Shahariar Rafi',
  'Araf Hossain',
  'Lakib Muntasir',
  'Khalid Bin Rana'
];

const EXPLICIT_CLASS_9_BS2_NAMES: string[] = [
  'Ahnaf Nahin Shahariar',
  'Rushaid Mujtahid Chowdhury',
  'Takrim Muhtadi',
  'Mansif Alam',
  'Ahnaf Alam Faiyaz',
  'Cristiano Ronaldo'
];

const EXPLICIT_CLASS_10_BS1_NAMES: string[] = [
  'Ayaan Khondokar',
  'Jabid Hossain',
  'Rahat Turjo',
  'Arshil Haque',
  'Lionel Messi',
  'Korim Khan'
];

// Curated pool of authentic Bangladeshi student names to populate rolls up to 35 in every class & section
const STUDENT_FIRST_NAMES = [
  'Ahnaf', 'Tawsif', 'Muntasir', 'Shafin', 'Abrar', 'Zahin', 'Nabil', 'Rayhan',
  'Fahim', 'Sakib', 'Tamim', 'Mushfiq', 'Miraz', 'Taskin', 'Soumya', 'Liton',
  'Afif', 'Mahedi', 'Shoriful', 'Ebadot', 'Najmul', 'Yasir', 'Mahmudul', 'Parvez',
  'Tanzid', 'Towhid', 'Rishad', 'Jaker', 'Tanvir', 'Nahid', 'Maruf', 'Sadman',
  'Ishraq', 'Adnan', 'imran'
];

const STUDENT_LAST_NAMES = [
  'Rahman', 'Hossain', 'Ahmed', 'Islam', 'Khan', 'Chowdhury', 'Uddin', 'Alam',
  'Kabir', 'Mahmud', 'Hasan', 'Karim', 'Bhuiyan', 'Talukder', 'Sarker', 'Sikder',
  'Patwary', 'Miah', 'Siddique', 'Mustafa', 'Zaman', 'Ferdous', 'Anwar', 'Bashar',
  'Haider', 'Khandaker', 'Mazumder', 'Munshi', 'Qureshi', 'rezwan', 'Sharif', 'Tareq',
  'Wahid', 'Yousuf', 'Zia'
];

function generateDeterministicName(classIndex: number, roll: number): string {
  const firstIdx = (classIndex * 7 + (roll - 1)) % STUDENT_FIRST_NAMES.length;
  const lastIdx = (classIndex * 11 + (roll - 1) * 3) % STUDENT_LAST_NAMES.length;
  const first = STUDENT_FIRST_NAMES[firstIdx];
  const last = STUDENT_LAST_NAMES[lastIdx];
  return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
}

function buildAllPreRegisteredStudents(): PreRegisteredStudent[] {
  const list: PreRegisteredStudent[] = [];

  ALL_CLASS_SECTIONS.forEach((cls, classIdx) => {
    for (let roll = 1; roll <= 35; roll++) {
      const rollPadded = String(roll).padStart(3, '0');
      const code = `${cls.codePrefix}${rollPadded}`;

      let name = generateDeterministicName(classIdx, roll);

      if (cls.className === 'Class 7' && cls.section === 'B1' && roll <= EXPLICIT_CLASS_7_B1_NAMES.length) {
        name = EXPLICIT_CLASS_7_B1_NAMES[roll - 1];
      } else if (cls.className === 'Class 8' && cls.section === 'B1' && roll <= EXPLICIT_CLASS_8_B1_NAMES.length) {
        name = EXPLICIT_CLASS_8_B1_NAMES[roll - 1];
      } else if (cls.className === 'Class 9' && cls.codePrefix === '90' && roll <= EXPLICIT_CLASS_9_BS2_NAMES.length) {
        name = EXPLICIT_CLASS_9_BS2_NAMES[roll - 1];
      } else if (cls.className === 'Class 10' && cls.codePrefix === '10' && roll <= EXPLICIT_CLASS_10_BS1_NAMES.length) {
        name = EXPLICIT_CLASS_10_BS1_NAMES[roll - 1];
      }

      list.push({
        code,
        name,
        className: cls.className,
        section: cls.section === 'BS2' ? 'BS1' : cls.section,
        roll
      });
    }
  });

  return list;
}

export const PRE_REGISTERED_STUDENTS: PreRegisteredStudent[] = buildAllPreRegisteredStudents();

export const STUDENT_CODES_MAP: Record<string, PreRegisteredStudent> = (() => {
  const map: Record<string, PreRegisteredStudent> = {};
  for (const st of PRE_REGISTERED_STUDENTS) {
    map[st.code.toUpperCase()] = st;
    if (st.className === 'Class 6' && st.section === 'B1' && st.roll <= 35) {
      map[`63${String(st.roll).padStart(3, '0')}`] = st;
      map[`6B1${String(st.roll).padStart(2, '0')}`] = st;
      map[`SSC-2026-6B1${String(st.roll).padStart(2, '0')}`] = st;
    }
    if (st.className === 'Class 6' && st.section === 'B2' && st.roll <= 35) {
      map[`64${String(st.roll).padStart(3, '0')}`] = st;
      map[`6B2${String(st.roll).padStart(2, '0')}`] = st;
      map[`SSC-2026-6B2${String(st.roll).padStart(2, '0')}`] = st;
    }
    if (st.className === 'Class 9' && st.code.startsWith('90') && st.roll <= 35) {
      const legacyCode = `SSC-2026-09${String(st.roll).padStart(2, '0')}`;
      map[legacyCode] = st;
    }
    if (st.className === 'Class 7' && st.section === 'B1' && st.roll <= 35) {
      const legacyCode = `SSC-2026-07${String(st.roll).padStart(2, '0')}`;
      map[legacyCode] = st;
    }
    if (st.className === 'Class 8' && st.section === 'B1' && st.roll <= 35) {
      const legacyCode = `SSC-2026-08${String(st.roll).padStart(2, '0')}`;
      map[legacyCode] = st;
    }
    if (st.className === 'Class 10' && st.section === 'BS1' && st.roll <= 35) {
      const sixDigitCode = `100${String(st.roll).padStart(3, '0')}`;
      map[sixDigitCode] = st;
    }
  }
  return map;
})();

export function findPreRegisteredStudent(rawCode: string): PreRegisteredStudent | null {
  const clean = rawCode.trim().toUpperCase();
  if (!clean) return null;
  if (STUDENT_CODES_MAP[clean]) {
    return STUDENT_CODES_MAP[clean];
  }

  // Fallback for any custom numeric student code so it always resolves a proper name and class
  const digits = clean.replace(/\D/g, '');
  if (digits.length >= 4) {
    const rollNum = Math.max(1, Math.min(35, parseInt(digits.slice(-2), 10) || 1));
    let className = 'Class 9';
    let section = 'BS1';
    let classIdx = 6;

    if (digits.startsWith('6')) {
      className = 'Class 6';
      if (digits.startsWith('62') || digits.startsWith('64') || clean.includes('B2')) {
        section = 'B2';
        classIdx = 1;
      } else {
        section = 'B1';
        classIdx = 0;
      }
    } else if (digits.startsWith('7')) {
      className = 'Class 7';
      section = digits.startsWith('72') || clean.includes('B2') ? 'B2' : 'B1';
      classIdx = section === 'B2' ? 3 : 2;
    } else if (digits.startsWith('8')) {
      className = 'Class 8';
      section = digits.startsWith('82') || clean.includes('B2') ? 'B2' : 'B1';
      classIdx = section === 'B2' ? 5 : 4;
    } else if (digits.startsWith('9')) {
      className = 'Class 9';
      section = 'BS1';
      classIdx = 6;
    } else if (digits.startsWith('10') || digits.startsWith('12')) {
      className = 'Class 10';
      section = 'BS1';
      classIdx = 8;
    }

    return {
      code: clean,
      name: generateDeterministicName(classIdx, rollNum),
      className,
      section,
      roll: rollNum
    };
  }

  return null;
}

export function isPlaceholderStudentName(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (/^Student\s*\(/i.test(trimmed)) return true;
  if (/^student_/i.test(trimmed)) return true;
  if (/^Student$/i.test(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  return false;
}

export function getAuthoritativeStudentName(
  student?: {
    student_id?: string;
    name?: string;
    class?: string;
    section?: string;
    roll?: number;
  } | null,
  user?: {
    name?: string;
    studentIdCode?: string;
    email?: string;
  } | null
): string {
  const codeCandidates = [
    student?.student_id,
    user?.studentIdCode,
    user?.email?.startsWith('student_')
      ? user.email.replace('student_', '').replace('@ssc.edu', '').toUpperCase()
      : undefined
  ].filter(Boolean) as string[];

  for (const rawCode of codeCandidates) {
    const clean = rawCode.trim().toUpperCase();
    if (STUDENT_CODES_MAP[clean]) {
      return STUDENT_CODES_MAP[clean].name;
    }
    const found = findPreRegisteredStudent(clean);
    if (found && !isPlaceholderStudentName(found.name)) {
      return found.name;
    }
  }

  if (student?.name && !isPlaceholderStudentName(student.name)) {
    return student.name.trim();
  }

  if (user?.name && !isPlaceholderStudentName(user.name)) {
    return user.name.trim();
  }

  if (student?.class && student?.roll) {
    const byClassRoll = PRE_REGISTERED_STUDENTS.find(
      (p) =>
        p.className.toLowerCase() === student.class!.toLowerCase() &&
        (!student.section || p.section.toLowerCase() === student.section.toLowerCase()) &&
        p.roll === student.roll
    );
    if (byClassRoll) return byClassRoll.name;
  }

  return 'Ahnaf Nahin Shahariar';
}

