import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { usePlatform, SUBJECT_SEQUENCE } from '../context/PlatformContext';
import { PAST_30_DATES } from '../data/seedDatabase';
import { TrendingUp, Award, CalendarCheck, Users } from 'lucide-react';

interface TeacherAnalyticsChartsProps {
  selectedClassId: string;
  onSelectClassId?: (classId: string) => void;
  onSelectDate?: (dateStr: string) => void;
}

export const TeacherAnalyticsCharts: React.FC<TeacherAnalyticsChartsProps> = ({
  selectedClassId,
  onSelectClassId,
  onSelectDate
}) => {
  const { db } = usePlatform();
  const [dayWindow, setDayWindow] = useState<'30d' | '14d'>('30d');

  const selectedClassObj = useMemo(
    () => db.classes.find((c) => c.id === selectedClassId) || db.classes[0],
    [db.classes, selectedClassId]
  );

  const classStudents = useMemo(() => {
    if (!selectedClassObj) return db.students.slice(0, 35);
    return db.students.filter(
      (st) =>
        st.class.toLowerCase() === selectedClassObj.class_name.toLowerCase() &&
        st.section.toLowerCase() === selectedClassObj.section.toLowerCase()
    );
  }, [db.students, selectedClassObj]);

  const classStudentIdSet = useMemo(
    () => new Set(classStudents.map((s) => s.id)),
    [classStudents]
  );

  // Build 30-day attendance trend data for the selected class
  const attendanceTrend30Days = useMemo(() => {
    const classAtt = db.attendance.filter((a) => a.class_id === selectedClassId);
    const distinctDates = Array.from(
      new Set([...PAST_30_DATES, ...classAtt.map((a) => a.date)])
    )
      .sort((a, b) => a.localeCompare(b))
      .slice(-30);

    return distinctDates.map((dateStr) => {
      const recordsForDay = classAtt.filter((a) => a.date === dateStr);
      const isHoliday =
        recordsForDay.length > 0 && recordsForDay.every((r) => r.status === 'Holiday');

      const present = recordsForDay.filter((r) => r.status === 'Present').length;
      const absent = recordsForDay.filter((r) => r.status === 'Absent').length;
      const late = recordsForDay.filter((r) => r.status === 'Late').length;
      const totalActive = present + absent + late;

      const attendanceRate = isHoliday
        ? 100
        : totalActive > 0
        ? Math.round(((present + late * 0.5) / totalActive) * 100)
        : 94;

      const shortDate = dateStr.slice(5); // MM-DD
      return {
        date: dateStr,
        shortDate,
        present: isHoliday ? 0 : present,
        absent: isHoliday ? 0 : absent,
        late: isHoliday ? 0 : late,
        attendanceRate,
        isHoliday
      };
    });
  }, [db.attendance, selectedClassId]);

  const displayedAttendanceTrend = useMemo(() => {
    const schoolDaysOnly = attendanceTrend30Days.filter((d) => !d.isHoliday);
    if (dayWindow === '14d') {
      return schoolDaysOnly.slice(-14);
    }
    return schoolDaysOnly;
  }, [attendanceTrend30Days, dayWindow]);

  const attendanceSummary30d = useMemo(() => {
    const schoolDays = attendanceTrend30Days.filter((d) => !d.isHoliday);
    const avgRate = schoolDays.length
      ? Math.round(
          schoolDays.reduce((acc, d) => acc + d.attendanceRate, 0) / schoolDays.length
        )
      : 94;
    const totalPresent = schoolDays.reduce((acc, d) => acc + d.present, 0);
    const totalAbsent = schoolDays.reduce((acc, d) => acc + d.absent, 0);
    const totalLate = schoolDays.reduce((acc, d) => acc + d.late, 0);
    return {
      storedDays: attendanceTrend30Days.length,
      schoolDays: schoolDays.length,
      avgRate,
      totalPresent,
      totalAbsent,
      totalLate
    };
  }, [attendanceTrend30Days]);

  // Build average subject grades over the current term for the selected class
  const subjectGradeAnalytics = useMemo(() => {
    return SUBJECT_SEQUENCE.map((subjName) => {
      const subObj = db.subjects.find((s) => s.name === subjName);
      const subId = subObj?.id || '';
      const classSubResults = db.results.filter(
        (r) =>
          (r.subject_id === subId || r.subjectName === subjName) &&
          classStudentIdSet.has(r.student_id)
      );

      if (classSubResults.length === 0) {
        return {
          subject: subjName,
          avgPercentage: 84,
          highestPercentage: 96,
          avgGpa: 4.65,
          letterGrade: 'A+'
        };
      }

      const pctValues = classSubResults.map((r) =>
        Math.round((r.marks / (r.fullMarks || 100)) * 100)
      );
      const avgPercentage = Math.round(
        pctValues.reduce((a, b) => a + b, 0) / pctValues.length
      );
      const highestPercentage = Math.max(...pctValues);
      const avgGpa = Number(
        (
          classSubResults.reduce((a, b) => a + b.gpa, 0) / classSubResults.length
        ).toFixed(2)
      );
      const letterGrade =
        avgPercentage >= 80
          ? 'A+'
          : avgPercentage >= 70
          ? 'A'
          : avgPercentage >= 60
          ? 'A-'
          : 'B';

      return {
        subject: subjName,
        avgPercentage,
        highestPercentage,
        avgGpa,
        letterGrade
      };
    });
  }, [db.subjects, db.results, classStudentIdSet]);

  const termOverallAvg = useMemo(() => {
    if (subjectGradeAnalytics.length === 0) return { pct: 85, gpa: '4.75' };
    const pct = Math.round(
      subjectGradeAnalytics.reduce((a, b) => a + b.avgPercentage, 0) /
        subjectGradeAnalytics.length
    );
    const gpa = (
      subjectGradeAnalytics.reduce((a, b) => a + b.avgGpa, 0) /
      subjectGradeAnalytics.length
    ).toFixed(2);
    return { pct, gpa };
  }, [subjectGradeAnalytics]);

  const subjectBarColors = [
    '#ef4444', // Physics (Crimson)
    '#10b981', // Biology (Emerald)
    '#06b6d4', // Chemistry (Cyan)
    '#f59e0b', // Bangla (Amber)
    '#8b5cf6', // English (Violet)
    '#3b82f6', // ICT (Blue)
    '#ec4899', // BGS (Pink)
    '#14b8a6'  // Religion (Teal)
  ];

  return (
    <div className="bg-[#0A0A0A] border border-white/20 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Header & Class Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold uppercase">
              Term Analytics · 30-Day Archive
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Class Attendance Trends &amp; Average Subject Grades —{' '}
              {selectedClassObj?.class_name} ({selectedClassObj?.section})
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Interactive Recharts visualization of the 30-day rolling attendance archive and current term subject grade averages across all 35 students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSelectClassId && (
            <select
              value={selectedClassId}
              onChange={(e) => onSelectClassId(e.target.value)}
              className="bg-black border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-semibold cursor-pointer"
            >
              {db.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} — {cls.section} ({cls.studentCount} Students)
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex items-center p-1 rounded-xl bg-black border border-white/15">
            <button
              type="button"
              onClick={() => setDayWindow('30d')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                dayWindow === '30d'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              30-Day History
            </button>
            <button
              type="button"
              onClick={() => setDayWindow('14d')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                dayWindow === '14d'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              14-Day View
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400">30-Day Stored Window</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
              {attendanceSummary30d.storedDays} Days Stored
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
              {attendanceSummary30d.schoolDays} Active Class Days
            </div>
          </div>
          <CalendarCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400">30-Day Attendance Avg</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
              {attendanceSummary30d.avgRate}%
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              {attendanceSummary30d.totalPresent} Present · {attendanceSummary30d.totalAbsent} Absent
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400">Term Subject Average</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
              {termOverallAvg.pct}%
            </div>
            <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
              Class Score Benchmark
            </div>
          </div>
          <Award className="w-5 h-5 text-cyan-400 shrink-0" />
        </div>

        <div className="p-3.5 rounded-xl bg-black border border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400">Enrolled Cohort</div>
            <div className="font-mono text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
              {classStudents.length} Students
            </div>
            <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
              8 Core Term Subjects
            </div>
          </div>
          <Users className="w-5 h-5 text-white shrink-0" />
        </div>
      </div>

      {/* Two-Column Recharts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CHART 1: CLASS ATTENDANCE TRENDS OVER 30 DAYS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-sm sm:text-base font-bold text-white">
                Class Attendance Trend (Previous 30 Days)
              </h4>
              <p className="text-[11px] text-neutral-400">
                Daily Present vs Absent/Late count &amp; Attendance Rate (%)
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-[10px] font-bold">
              Avg {attendanceSummary30d.avgRate}%
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={displayedAttendanceTrend}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                onClick={(state: unknown) => {
                  const chartState = state as { activePayload?: Array<{ payload?: { date?: string } }> } | null;
                  if (
                    onSelectDate &&
                    chartState &&
                    chartState.activePayload &&
                    chartState.activePayload[0]?.payload?.date
                  ) {
                    onSelectDate(chartState.activePayload[0].payload.date);
                  }
                }}
              >
                <defs>
                  <linearGradient id="attRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="shortDate"
                  stroke="#a3a3a3"
                  tick={{ fill: '#a3a3a3', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 35]}
                  stroke="#a3a3a3"
                  tick={{ fill: '#a3a3a3', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[50, 100]}
                  unit="%"
                  stroke="#10b981"
                  tick={{ fill: '#10b981', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  labelFormatter={(label, payload) => {
                    const fullDate = payload?.[0]?.payload?.date || label;
                    return `Date: ${fullDate}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="present"
                  name="Present Students"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                />
                <Bar
                  yAxisId="left"
                  dataKey="absent"
                  name="Absent"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  barSize={6}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="attendanceRate"
                  name="Attendance Rate (%)"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#attRateGrad)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: AVERAGE SUBJECT GRADES OVER CURRENT TERM */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/15 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-display text-sm sm:text-base font-bold text-white">
                Average Subject Grades (Current Term)
              </h4>
              <p className="text-[11px] text-neutral-400">
                Class average score (%) vs highest score (%) across 8 core subjects
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-mono text-[10px] font-bold">
              Avg {termOverallAvg.pct}%
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectGradeAnalytics}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="subject"
                  stroke="#a3a3a3"
                  tick={{ fill: '#e5e5e5', fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  stroke="#a3a3a3"
                  tick={{ fill: '#a3a3a3', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#ffffff'
                  }}
                  formatter={(value: unknown, name: unknown, props: { payload?: { letterGrade?: string } }) => {
                    const numVal = Number(value ?? 0);
                    const strName = String(name ?? '');
                    if (strName === 'Average Score (%)') {
                      const g = props?.payload?.letterGrade || 'A+';
                      return [`${numVal}% (Grade ${g})`, strName];
                    }
                    return [`${numVal}%`, strName];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  dataKey="avgPercentage"
                  name="Average Score (%)"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                >
                  {subjectGradeAnalytics.map((entry, idx) => (
                    <Cell
                      key={entry.subject}
                      fill={subjectBarColors[idx % subjectBarColors.length]}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="highestPercentage"
                  name="Highest in Class (%)"
                  fill="rgba(255,255,255,0.22)"
                  radius={[6, 6, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
