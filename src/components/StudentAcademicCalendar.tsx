import React, { useState, useMemo } from 'react';
import type { ExamRecord, AssignmentRecord, NoticeRecord } from '../types/database';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Sparkles,
  Flag,
  Award,
  Clock,
  MapPin,
  CheckCircle2,
  Filter
} from 'lucide-react';

export type CalendarEventCategory =
  | 'holiday-eid'
  | 'holiday-puja'
  | 'holiday-national'
  | 'holiday-other'
  | 'exam'
  | 'event'
  | 'assignment';

export interface AcademicCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  title: string;
  category: CalendarEventCategory;
  categoryLabel: string;
  subCategory?: string;
  description: string;
  location?: string;
  time?: string;
  classScope?: string;
  isHoliday?: boolean;
}

// Comprehensive 2026 Bangladesh Government, Religious (Eid, Puja, Buddha Purnima, Christmas) & Institutional Calendar
export const BANGLADESH_2026_HOLIDAYS_AND_EVENTS: AcademicCalendarEvent[] = [
  // JANUARY 2026
  {
    id: 'bd-jan-01',
    date: '2026-01-01',
    title: 'New Year Academic Orientation & Book Distribution Festival',
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Annual textbook distribution and new session orientation across Class 6–10.',
    location: 'Main Auditorium & Classrooms',
    time: '09:00 AM – 12:30 PM',
    isHoliday: false
  },
  {
    id: 'bd-jan-17',
    date: '2026-01-17',
    title: 'Shab-e-Meraj (Holy Night of Ascension)',
    category: 'holiday-other',
    categoryLabel: 'Religious Holiday (BD)',
    description: 'Observance of Lailatul Meraj across Bangladesh. Academic classes remain closed.',
    isHoliday: true
  },
  {
    id: 'bd-jan-23',
    date: '2026-01-23',
    title: 'Sri Sri Saraswati Puja (Vasant Panchami)',
    category: 'holiday-puja',
    categoryLabel: 'Puja Holiday (BD)',
    description: 'Festival celebrating the Goddess of Knowledge, Wisdom, and Learning.',
    location: 'Campus Cultural Pavilion',
    isHoliday: true
  },

  // FEBRUARY 2026
  {
    id: 'bd-feb-04',
    date: '2026-02-04',
    title: 'Holy Shab-e-Barat',
    category: 'holiday-other',
    categoryLabel: 'Religious Holiday (BD)',
    description: 'Public & school holiday in Bangladesh observing the night of forgiveness (Mid-Shaban).',
    isHoliday: true
  },
  {
    id: 'bd-feb-12',
    date: '2026-02-12',
    title: 'Annual Inter-House Sports & Athletics Championship',
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Track and field athletics, relay races, and house trophy competition.',
    location: 'School Central Playground',
    time: '08:30 AM – 03:30 PM',
    isHoliday: false
  },
  {
    id: 'bd-feb-21',
    date: '2026-02-21',
    title: 'Shaheed Day & International Mother Language Day (Ekushey February)',
    category: 'holiday-national',
    categoryLabel: 'National Holiday (BD)',
    description: 'National holiday honoring the 1952 Bengali Language Movement martyrs. Probhat Pheri & floral tribute at Shaheed Minar.',
    location: 'Campus Shaheed Minar',
    isHoliday: true
  },

  // MARCH 2026
  {
    id: 'bd-mar-17',
    date: '2026-03-17',
    title: 'Holy Shab-e-Qadr (Lailatul Qadr)',
    category: 'holiday-eid',
    categoryLabel: 'Eid & Ramadan Holiday',
    description: 'Night of Power during the final ten days of Ramadan. School holiday in Bangladesh.',
    isHoliday: true
  },
  {
    id: 'bd-mar-19',
    date: '2026-03-19',
    endDate: '2026-03-25',
    title: 'Ramadan & Eid-ul-Fitr Institutional Vacation Begins',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Fitr Holiday',
    description: 'Official school vacation for Jumatul Bidah and holy Eid-ul-Fitr celebrations.',
    isHoliday: true
  },
  {
    id: 'bd-mar-20',
    date: '2026-03-20',
    title: 'Jumatul Bidah (Last Friday of Ramadan)',
    category: 'holiday-eid',
    categoryLabel: 'Eid & Ramadan Holiday',
    description: 'Special congregational prayers on the final Friday of holy Ramadan.',
    isHoliday: true
  },
  {
    id: 'bd-mar-21',
    date: '2026-03-21',
    title: 'Holy Eid-ul-Fitr (Main Festival Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Fitr Holiday',
    description: 'Biggest religious festival celebrating the completion of holy Ramadan across Bangladesh.',
    isHoliday: true
  },
  {
    id: 'bd-mar-22',
    date: '2026-03-22',
    title: 'Eid-ul-Fitr Holiday (2nd Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Fitr Holiday',
    description: 'National public holiday for Eid-ul-Fitr.',
    isHoliday: true
  },
  {
    id: 'bd-mar-23',
    date: '2026-03-23',
    title: 'Eid-ul-Fitr Holiday (3rd Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Fitr Holiday',
    description: 'Continuation of Eid-ul-Fitr vacation.',
    isHoliday: true
  },
  {
    id: 'bd-mar-26',
    date: '2026-03-26',
    title: 'Independence & National Day of Bangladesh',
    category: 'holiday-national',
    categoryLabel: 'National Holiday (BD)',
    description: 'Commemoration of the Declaration of Independence of Bangladesh in 1971.',
    location: 'Main Campus Parade Ground',
    isHoliday: true
  },

  // APRIL 2026
  {
    id: 'bd-apr-13',
    date: '2026-04-13',
    title: 'Chaitra Sankranti Cultural Program',
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Traditional Bengali year-end cultural celebration by students.',
    location: 'Main Auditorium',
    isHoliday: false
  },
  {
    id: 'bd-apr-14',
    date: '2026-04-14',
    title: 'Pahela Baishakh — Bangla Nababarsha 1433 (Bengali New Year)',
    category: 'holiday-national',
    categoryLabel: 'National & Cultural Holiday (BD)',
    description: 'National holiday celebrating the first day of the Bengali Calendar 1433 with Mangal Shobhajatra and Boishakhi fair.',
    isHoliday: true
  },

  // MAY 2026
  {
    id: 'bd-may-01',
    date: '2026-05-01',
    title: 'May Day (International Workers’ Day) & Buddha Purnima',
    category: 'holiday-national',
    categoryLabel: 'National & Religious Holiday (BD)',
    description: 'Public holiday in Bangladesh observing International Workers’ Day and Buddha Purnima (Vesak).',
    isHoliday: true
  },
  {
    id: 'bd-may-26',
    date: '2026-05-26',
    endDate: '2026-06-02',
    title: 'Holy Eid-ul-Adha & Summer Vacation Begins',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Adha Holiday',
    description: 'School closure for Eid-ul-Adha (Festival of Sacrifice) and institutional summer break.',
    isHoliday: true
  },
  {
    id: 'bd-may-27',
    date: '2026-05-27',
    title: 'Holy Eid-ul-Adha (Main Festival Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Adha Holiday',
    description: 'Major Islamic festival of sacrifice observed nationwide across Bangladesh.',
    isHoliday: true
  },
  {
    id: 'bd-may-28',
    date: '2026-05-28',
    title: 'Eid-ul-Adha Holiday (2nd Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Adha Holiday',
    description: 'National public holiday for Eid-ul-Adha.',
    isHoliday: true
  },
  {
    id: 'bd-may-29',
    date: '2026-05-29',
    title: 'Eid-ul-Adha Holiday (3rd Day)',
    category: 'holiday-eid',
    categoryLabel: 'Eid-ul-Adha Holiday',
    description: 'National public holiday for Eid-ul-Adha.',
    isHoliday: true
  },

  // JUNE 2026
  {
    id: 'bd-jun-15',
    date: '2026-06-15',
    title: 'Half-Yearly Examination 2026 Commences',
    category: 'exam',
    categoryLabel: 'Major Examination',
    description: 'Half-Yearly written and practical examinations for Class 6–8 (B1/B2) and Class 9–10 (BS1/BS2).',
    location: 'All Examination Halls',
    time: '09:30 AM – 12:30 PM',
    isHoliday: false
  },
  {
    id: 'bd-jun-26',
    date: '2026-06-26',
    title: 'Holy Ashura (10th of Muharram)',
    category: 'holiday-other',
    categoryLabel: 'Religious Holiday (BD)',
    description: 'Public holiday in Bangladesh observing the 10th day of Muharram.',
    isHoliday: true
  },

  // AUGUST 2026
  {
    id: 'bd-aug-05',
    date: '2026-08-05',
    title: 'July Mass Uprising & Student-People’s Memorial Day',
    category: 'holiday-national',
    categoryLabel: 'National Observance (BD)',
    description: 'Special national commemoration and discussion program.',
    isHoliday: true
  },
  {
    id: 'bd-aug-26',
    date: '2026-08-26',
    title: 'Holy Eid-e-Miladunnabi (SM)',
    category: 'holiday-other',
    categoryLabel: 'Religious Holiday (BD)',
    description: 'National public holiday in Bangladesh observing the birth and passing of Prophet Muhammad (SM).',
    isHoliday: true
  },

  // SEPTEMBER 2026
  {
    id: 'bd-sep-04',
    date: '2026-09-04',
    title: 'Shuva Janmashtami',
    category: 'holiday-puja',
    categoryLabel: 'Puja & Religious Holiday (BD)',
    description: 'Public holiday in Bangladesh celebrating the birth of Lord Krishna.',
    isHoliday: true
  },
  {
    id: 'bd-sep-16',
    date: '2026-09-16',
    title: 'Fateha-i-Yazdaham',
    category: 'holiday-other',
    categoryLabel: 'Religious Holiday (BD)',
    description: 'Institutional holiday in Bangladesh.',
    isHoliday: true
  },

  // OCTOBER 2026
  {
    id: 'bd-oct-02',
    date: '2026-10-02',
    title: 'Autumn Institutional Holiday',
    category: 'holiday-other',
    categoryLabel: 'School Holiday',
    description: 'Scheduled institutional autumn break for all sections.',
    isHoliday: true
  },
  {
    id: 'bd-oct-11',
    date: '2026-10-11',
    title: 'Shubo Mahalaya (Heralding of Sharadiya Durga Puja)',
    category: 'holiday-puja',
    categoryLabel: 'Puja Observance (BD)',
    description: 'Auspicious beginning of Devipaksha leading into Sharadiya Durga Puja.',
    isHoliday: false
  },
  {
    id: 'bd-oct-19',
    date: '2026-10-19',
    endDate: '2026-10-22',
    title: 'Sharadiya Durga Puja — Maha Ashtami & Kumari Puja Holiday',
    category: 'holiday-puja',
    categoryLabel: 'Durga Puja Holiday (BD)',
    description: 'Official school vacation for Sharadiya Durga Puja (Maha Ashtami). All classes and labs remain closed.',
    isHoliday: true
  },
  {
    id: 'bd-oct-20',
    date: '2026-10-20',
    title: 'Sharadiya Durga Puja — Maha Navami Holiday',
    category: 'holiday-puja',
    categoryLabel: 'Durga Puja Holiday (BD)',
    description: 'Sharadiya Durga Puja Maha Navami holiday across Bangladesh.',
    isHoliday: true
  },
  {
    id: 'bd-oct-21',
    date: '2026-10-21',
    title: 'Sharadiya Durga Puja — Bijoya Dashami (National Public Holiday)',
    category: 'holiday-puja',
    categoryLabel: 'Durga Puja Holiday (BD)',
    description: 'Main public holiday in Bangladesh for Bijoya Dashami marking the culmination of Sharadiya Durga Puja.',
    isHoliday: true
  },
  {
    id: 'bd-oct-24',
    date: '2026-10-24',
    title: "Scholar's Annual Science, Robotics & Innovation Fair 2026",
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Exhibition of physics circuits, ReactiMix chemistry syntheses, biology models, and robotics projects.',
    location: 'Science Block & Main Auditorium',
    time: '09:00 AM – 04:00 PM',
    isHoliday: false
  },
  {
    id: 'bd-oct-25',
    date: '2026-10-25',
    title: 'Sri Sri Lakshmi Puja Holiday',
    category: 'holiday-puja',
    categoryLabel: 'Puja Holiday (BD)',
    description: 'School holiday observing Kojagori Sri Sri Lakshmi Puja following Durga Puja.',
    isHoliday: true
  },
  {
    id: 'bd-oct-29',
    date: '2026-10-29',
    title: 'Parent–Teacher Academic Progress Consultation (Class 6–10)',
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Section-wise review of Class Test performance and attendance with Class Teachers.',
    location: 'Respective Section Classrooms',
    time: '10:00 AM – 01:30 PM',
    isHoliday: false
  },

  // NOVEMBER 2026
  {
    id: 'bd-nov-07',
    date: '2026-11-07',
    title: 'National Revolution & Solidarity Day Observance',
    category: 'holiday-national',
    categoryLabel: 'National Observance (BD)',
    description: 'Historical discussion and observance in Bangladesh.',
    isHoliday: false
  },
  {
    id: 'bd-nov-08',
    date: '2026-11-08',
    title: 'Sri Sri Shyama Puja (Kali Puja) Holiday',
    category: 'holiday-puja',
    categoryLabel: 'Puja Holiday (BD)',
    description: 'Institutional holiday in Bangladesh for Sri Sri Kali Puja / Deepabali.',
    isHoliday: true
  },
  {
    id: 'bd-nov-18',
    date: '2026-11-18',
    endDate: '2026-11-30',
    title: 'Annual Final Examination 2026 Commences (Class 6–10)',
    category: 'exam',
    categoryLabel: 'Final Examination',
    description: 'Year-end written and practical examinations across all 8 subjects for Class 6–8 (B1/B2) and Class 9–10 (BS1/BS2).',
    location: 'Academic Block Exam Halls',
    time: '09:30 AM – 12:30 PM',
    isHoliday: false
  },

  // DECEMBER 2026
  {
    id: 'bd-dec-14',
    date: '2026-12-14',
    title: 'Martyred Intellectuals Day (Shaheed Buddhijibi Dibosh)',
    category: 'holiday-national',
    categoryLabel: 'National Observance (BD)',
    description: 'Solemn commemoration of the martyred intellectuals of 1971.',
    location: 'Main Auditorium',
    isHoliday: false
  },
  {
    id: 'bd-dec-16',
    date: '2026-12-16',
    title: 'Victory Day of Bangladesh ( মহান বিজয় দিবস / Bijoy Dibosh )',
    category: 'holiday-national',
    categoryLabel: 'National Holiday (BD)',
    description: 'National public holiday celebrating the 1971 Liberation War Victory of Bangladesh. Parade, cultural program & flag hoisting.',
    location: 'Campus Central Ground',
    isHoliday: true
  },
  {
    id: 'bd-dec-22',
    date: '2026-12-22',
    title: 'Annual Final Result Publication & Merit Award Ceremony',
    category: 'event',
    categoryLabel: 'School Event',
    description: 'Official publication of Annual Final Exam results and GPA merit awards.',
    location: 'Main Auditorium',
    time: '10:00 AM – 01:00 PM',
    isHoliday: false
  },
  {
    id: 'bd-dec-25',
    date: '2026-12-25',
    endDate: '2026-12-31',
    title: 'Christmas Day (Boro Din) & Winter Vacation',
    category: 'holiday-other',
    categoryLabel: 'National & Religious Holiday (BD)',
    description: 'Public holiday for Christmas Day and year-end institutional winter vacation.',
    isHoliday: true
  }
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface StudentAcademicCalendarProps {
  studentClass: string;
  studentSection: string;
  exams: ExamRecord[];
  assignments: AssignmentRecord[];
  notices: NoticeRecord[];
}

export const StudentAcademicCalendar: React.FC<StudentAcademicCalendarProps> = ({
  studentClass,
  studentSection,
  exams,
  assignments
}) => {
  // Default to October 2026 (current academic month in the portal)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(9); // 0 = Jan, 9 = Oct
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'exams' | 'holidays' | 'eid-puja' | 'events' | 'assignments'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const year = 2026;

  // Combine static Bangladesh Holidays & Events with live Exams and Assignments from the portal database
  const allEvents = useMemo<AcademicCalendarEvent[]>(() => {
    const myClassBase = (studentClass || 'Class 9').split('—')[0].trim().toLowerCase();

    const examEvents: AcademicCalendarEvent[] = exams
      .filter((ex) => {
        if (!ex.class || ex.class === 'All Classes') return true;
        return ex.class.toLowerCase().includes(myClassBase);
      })
      .map((ex) => ({
        id: `cal-ex-${ex.id}`,
        date: ex.date,
        title: `${ex.name} (${ex.subject})`,
        category: 'exam',
        categoryLabel: ex.type || 'Class Test / Exam',
        subCategory: ex.subject,
        description: `Syllabus: ${ex.syllabus} · Class: ${ex.class}`,
        location: ex.room || 'Academic Block',
        time: ex.time || '09:30 AM – 10:15 AM',
        classScope: ex.class,
        isHoliday: false
      }));

    const assignmentEvents: AcademicCalendarEvent[] = assignments.map((asg) => ({
      id: `cal-asg-${asg.id}`,
      date: asg.due_date,
      title: `Assignment Due: ${asg.title} (${asg.subject})`,
      category: 'assignment',
      categoryLabel: 'Assignment Deadline',
      subCategory: asg.subject,
      description: asg.description || `Assigned by ${asg.teacher}`,
      location: asg.class,
      isHoliday: false
    }));

    // Merge and deduplicate by date + title
    const combined = [
      ...BANGLADESH_2026_HOLIDAYS_AND_EVENTS,
      ...examEvents,
      ...assignmentEvents
    ];

    const seen = new Set<string>();
    return combined
      .filter((ev) => {
        const key = `${ev.date}__${ev.title.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [exams, assignments, studentClass]);

  const matchesFilter = (ev: AcademicCalendarEvent) => {
    if (activeFilter === 'exams') return ev.category === 'exam';
    if (activeFilter === 'holidays') return Boolean(ev.isHoliday);
    if (activeFilter === 'eid-puja') {
      return ev.category === 'holiday-eid' || ev.category === 'holiday-puja';
    }
    if (activeFilter === 'events') return ev.category === 'event';
    if (activeFilter === 'assignments') return ev.category === 'assignment';
    return true;
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEvents.filter((ev) => {
      if (!matchesFilter(ev)) return false;
      if (!q) return true;
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.categoryLabel.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.date.includes(q)
      );
    });
  }, [allEvents, activeFilter, searchQuery]);

  // Events indexed by date (YYYY-MM-DD) for fast calendar cell lookup
  const eventsByDateMap = useMemo(() => {
    const map: Record<string, AcademicCalendarEvent[]> = {};
    allEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [allEvents]);

  // Build calendar grid cells for the selected month in 2026
  const calendarGridDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, selectedMonthIdx, 1).getDay();
    const daysInMonth = new Date(year, selectedMonthIdx + 1, 0).getDate();
    const cells: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      isWeekendFriday: boolean;
      events: AcademicCalendarEvent[];
    }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dayNumber: null, dateStr: null, isWeekendFriday: false, events: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(selectedMonthIdx + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      const dayOfWeek = new Date(year, selectedMonthIdx, day).getDay();
      // In Bangladesh, Friday (5) is the weekly holiday
      const isWeekendFriday = dayOfWeek === 5;
      const dayEvents = (eventsByDateMap[dateStr] || []).filter(matchesFilter);
      cells.push({
        dayNumber: day,
        dateStr,
        isWeekendFriday,
        events: dayEvents
      });
    }

    return cells;
  }, [selectedMonthIdx, eventsByDateMap, activeFilter]);

  const monthPrefix = `${year}-${String(selectedMonthIdx + 1).padStart(2, '0')}`;

  const displayedEventsList = useMemo(() => {
    if (selectedDateStr) {
      return filteredEvents.filter((ev) => ev.date === selectedDateStr);
    }
    if (searchQuery.trim()) {
      return filteredEvents;
    }
    return filteredEvents.filter((ev) => ev.date.startsWith(monthPrefix));
  }, [filteredEvents, selectedDateStr, monthPrefix, searchQuery]);

  // Summary counts across 2026
  const stats = useMemo(() => {
    const totalHolidays = allEvents.filter((e) => e.isHoliday).length;
    const eidAndPujaCount = allEvents.filter(
      (e) => e.category === 'holiday-eid' || e.category === 'holiday-puja'
    ).length;
    const examCount = allEvents.filter((e) => e.category === 'exam').length;
    const schoolEventsCount = allEvents.filter((e) => e.category === 'event').length;
    return { totalHolidays, eidAndPujaCount, examCount, schoolEventsCount };
  }, [allEvents]);

  const getCategoryStyle = (cat: CalendarEventCategory) => {
    switch (cat) {
      case 'holiday-eid':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          cellBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
          dot: 'bg-emerald-400'
        };
      case 'holiday-puja':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          cellBg: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
          dot: 'bg-amber-400'
        };
      case 'holiday-national':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          cellBg: 'bg-rose-500/15 border-rose-500/40 text-rose-200',
          dot: 'bg-rose-400'
        };
      case 'holiday-other':
        return {
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          cellBg: 'bg-teal-500/15 border-teal-500/40 text-teal-200',
          dot: 'bg-teal-400'
        };
      case 'exam':
        return {
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          cellBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200',
          dot: 'bg-cyan-400'
        };
      case 'assignment':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          cellBg: 'bg-purple-500/15 border-purple-500/40 text-purple-200',
          dot: 'bg-purple-400'
        };
      default:
        return {
          badge: 'bg-white/15 text-white border-white/30',
          cellBg: 'bg-white/10 border-white/30 text-white',
          dot: 'bg-white'
        };
    }
  };

  return (
    <div className="space-y-6 animate-smooth-in">
      {/* Header & Summary Strip */}
      <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <CalendarIcon className="w-5 h-5 text-white shrink-0" />
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Interactive Academic &amp; Bangladesh Holiday Calendar 2026
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {studentClass} — {studentSection} · Complete schedule of Class Tests (CTs), Term Exams, School Events, and all Official Bangladesh Holidays (Eid-ul-Fitr, Eid-ul-Adha, Sharadiya Durga Puja, Saraswati Puja, Lakshmi Puja, Kali Puja, Buddha Purnima, Christmas &amp; National Days).
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) setSelectedDateStr(null);
              }}
              placeholder="Search Eid, Puja, CT, Victory Day..."
              className="w-full bg-black border border-white/20 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => {
              setActiveFilter('exams');
              setSelectedDateStr(null);
            }}
            className="p-3.5 rounded-xl bg-black border border-white/15 hover:border-cyan-400/50 cursor-pointer transition-all"
          >
            <div className="text-[11px] text-neutral-400">Scheduled Exams &amp; CTs</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-300 mt-0.5 tabular-nums">
              {stats.examCount}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              Class Tests &amp; Finals
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilter('eid-puja');
              setSelectedDateStr(null);
            }}
            className="p-3.5 rounded-xl bg-black border border-white/15 hover:border-amber-400/50 cursor-pointer transition-all"
          >
            <div className="text-[11px] text-neutral-400">Eid &amp; Puja Holidays</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-amber-300 mt-0.5 tabular-nums">
              {stats.eidAndPujaCount} Days
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              Eid-ul-Fitr · Eid-ul-Adha · Durga Puja
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilter('holidays');
              setSelectedDateStr(null);
            }}
            className="p-3.5 rounded-xl bg-black border border-white/15 hover:border-emerald-400/50 cursor-pointer transition-all"
          >
            <div className="text-[11px] text-neutral-400">Total BD Holidays (2026)</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-300 mt-0.5 tabular-nums">
              {stats.totalHolidays}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              National, Religious &amp; Festival
            </div>
          </div>

          <div
            onClick={() => {
              setActiveFilter('events');
              setSelectedDateStr(null);
            }}
            className="p-3.5 rounded-xl bg-black border border-white/15 hover:border-white/40 cursor-pointer transition-all"
          >
            <div className="text-[11px] text-neutral-400">Campus Events</div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-0.5 tabular-nums">
              {stats.schoolEventsCount}
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              Science Fair, Sports &amp; PTM
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: `All Schedule (${allEvents.length})` },
            { id: 'exams', label: `Exams & CTs (${stats.examCount})` },
            { id: 'holidays', label: `All BD Holidays (${stats.totalHolidays})` },
            { id: 'eid-puja', label: `Eid & Puja Festivals (${stats.eidAndPujaCount})` },
            { id: 'events', label: `School Events (${stats.schoolEventsCount})` },
            { id: 'assignments', label: 'Assignment Deadlines' }
          ].map((tab) => {
            const active = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.id as typeof activeFilter);
                  setSelectedDateStr(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                  active
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-black text-neutral-300 hover:bg-white/10 hover:text-white border border-white/15'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 12-Month Quick Selector Bar */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
          {MONTH_NAMES.map((mName, idx) => {
            const mPref = `${year}-${String(idx + 1).padStart(2, '0')}`;
            const countInMonth = allEvents.filter(
              (ev) => ev.date.startsWith(mPref) && matchesFilter(ev)
            ).length;
            const isSelected = selectedMonthIdx === idx;
            return (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setSelectedMonthIdx(idx);
                  setSelectedDateStr(null);
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex flex-col items-center justify-center border ${
                  isSelected
                    ? 'bg-white text-black border-white font-extrabold'
                    : 'bg-black text-neutral-300 border-white/10 hover:border-white/35'
                }`}
              >
                <span>{mName.slice(0, 3)}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-black/80 font-bold' : 'text-neutral-500'
                  }`}
                >
                  {countInMonth} {countInMonth === 1 ? 'item' : 'items'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Interactive Monthly Grid (Left 7 cols) + Event Details & Holiday Feed (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Calendar Month Grid */}
        <div className="lg:col-span-7 bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                {MONTH_NAMES[selectedMonthIdx]} {year}
              </h3>
              <p className="text-xs text-neutral-400">
                Click any highlighted date to inspect exams, school events, or Bangladesh holidays
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonthIdx((prev) => (prev === 0 ? 11 : prev - 1));
                  setSelectedDateStr(null);
                }}
                className="p-2 rounded-xl bg-black border border-white/20 hover:bg-white/10 text-white cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonthIdx(9); // October
                  setSelectedDateStr(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-semibold text-white cursor-pointer"
              >
                Current Term (Oct)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMonthIdx((prev) => (prev === 11 ? 0 : prev + 1));
                  setSelectedDateStr(null);
                }}
                className="p-2 rounded-xl bg-black border border-white/20 hover:bg-white/10 text-white cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-xs font-mono font-bold uppercase ${
                  idx === 5 ? 'text-rose-400' : 'text-neutral-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarGridDays.map((cell, i) => {
              if (!cell.dayNumber || !cell.dateStr) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="h-20 sm:h-24 rounded-xl bg-white/[0.01] border border-white/5"
                  />
                );
              }

              const isSelected = selectedDateStr === cell.dateStr;
              const primaryEvent = cell.events[0];
              const hasHoliday = cell.events.some((e) => e.isHoliday);
              const hasExam = cell.events.some((e) => e.category === 'exam');

              let cellStyle = 'bg-black border-white/15 hover:border-white/40 text-white';
              if (isSelected) {
                cellStyle = 'bg-white text-black border-white ring-2 ring-white/50';
              } else if (primaryEvent) {
                cellStyle = getCategoryStyle(primaryEvent.category).cellBg;
              } else if (cell.isWeekendFriday) {
                cellStyle = 'bg-rose-950/20 border-rose-500/20 text-rose-200/80';
              }

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() =>
                    setSelectedDateStr((prev) =>
                      prev === cell.dateStr ? null : cell.dateStr
                    )
                  }
                  className={`h-20 sm:h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${cellStyle}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
                        isSelected
                          ? 'text-black'
                          : cell.isWeekendFriday && !primaryEvent
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {String(cell.dayNumber).padStart(2, '0')}
                    </span>
                    {cell.events.length > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-black text-white'
                            : 'bg-black/60 text-white'
                        }`}
                      >
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 w-full">
                    {cell.events.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] leading-tight font-medium truncate ${
                          isSelected ? 'text-black font-bold' : 'text-white'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {cell.events.length === 0 && cell.isWeekendFriday && (
                      <div
                        className={`text-[9px] font-mono ${
                          isSelected ? 'text-black/70' : 'text-rose-300/70'
                        }`}
                      >
                        Fri Holiday
                      </div>
                    )}
                    {(hasHoliday || hasExam) && cell.events.length > 2 && (
                      <div className="text-[9px] font-mono opacity-80">
                        +{cell.events.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-neutral-300">
            <span className="font-mono text-[11px] text-neutral-400">Legend:</span>
            <span>Eid Holidays (Green)</span>
            <span>·</span>
            <span>Durga / Saraswati / Lakshmi / Kali Puja (Amber)</span>
            <span>·</span>
            <span>National Days (Crimson)</span>
            <span>·</span>
            <span>Exams &amp; CTs (Cyan)</span>
          </div>
        </div>

        {/* RIGHT: Selected Date / Month Schedule & Holiday Details */}
        <div className="lg:col-span-5 bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                {selectedDateStr
                  ? `Events on ${selectedDateStr}`
                  : searchQuery.trim()
                  ? `Search Results (${displayedEventsList.length})`
                  : `${MONTH_NAMES[selectedMonthIdx]} ${year} Schedule (${displayedEventsList.length})`}
              </h3>
              <p className="text-xs text-neutral-400">
                {selectedDateStr
                  ? 'Showing events for your selected date'
                  : 'Exams, school events, and Bangladesh holidays in this period'}
              </p>
            </div>
            {selectedDateStr && (
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold cursor-pointer shrink-0"
              >
                Show Full Month
              </button>
            )}
          </div>

          {displayedEventsList.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-black border border-white/10 space-y-2">
              <CalendarIcon className="w-7 h-7 text-neutral-400 mx-auto" />
              <div className="font-display text-sm font-bold text-white">
                No Scheduled Events Found
              </div>
              <p className="text-xs text-neutral-400">
                Select another month or click &ldquo;All Schedule&rdquo; to view all exams and Bangladesh holidays.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {displayedEventsList.map((ev) => {
                const style = getCategoryStyle(ev.category);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      const monthNum = Number(ev.date.split('-')[1]) - 1;
                      if (!Number.isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
                        setSelectedMonthIdx(monthNum);
                      }
                      setSelectedDateStr(ev.date);
                    }}
                    className="p-4 rounded-xl bg-black border border-white/15 hover:border-white/35 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-white font-bold tabular-nums">
                        {ev.date}
                        {ev.endDate ? ` → ${ev.endDate}` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${style.badge}`}>
                        {ev.categoryLabel}
                      </span>
                    </div>

                    <h4 className="font-display text-sm sm:text-base font-bold text-white">
                      {ev.title}
                    </h4>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {ev.description}
                    </p>

                    {(ev.location || ev.time) && (
                      <div className="pt-1.5 border-t border-white/10 flex flex-wrap items-center gap-3 text-[11px] font-mono text-neutral-400">
                        {ev.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{ev.time}</span>
                          </span>
                        )}
                        {ev.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{ev.location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Complete 2026 Bangladesh National, Eid & Puja Holidays Directory Table */}
      <div className="bg-[#0A0A0A] border border-white/15 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3.5">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Complete 2026 Bangladesh Holidays &amp; Major Academic Dates Directory
            </h3>
            <p className="text-xs text-neutral-400">
              Click any row to jump directly to that month and date on the interactive calendar above
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/15 bg-black">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/15 text-neutral-400 font-mono text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Holiday / Exam / Event Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Details &amp; Observance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {allEvents.map((ev) => {
                const style = getCategoryStyle(ev.category);
                return (
                  <tr
                    key={ev.id}
                    onClick={() => {
                      const monthNum = Number(ev.date.split('-')[1]) - 1;
                      if (!Number.isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
                        setSelectedMonthIdx(monthNum);
                      }
                      setSelectedDateStr(ev.date);
                    }}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 font-mono font-bold text-white whitespace-nowrap tabular-nums">
                      {ev.date}
                      {ev.endDate ? ` – ${ev.endDate}` : ''}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">
                      {ev.title}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${style.badge}`}>
                        {ev.categoryLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
                      {ev.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
