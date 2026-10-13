import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import type { ResultRecord, AttendanceRecord } from '../types/database';

interface StudentAcademicOverviewProps {
  studentName: string;
  studentClass: string;
  studentSection: string;
  studentRoll: number;
  results: ResultRecord[];
  attendance: AttendanceRecord[];
  overallGpa: string;
  attendancePct: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  onViewFullResults: () => void;
  onViewFullAttendance: () => void;
}

export const StudentAcademicOverview: React.FC<StudentAcademicOverviewProps> = ({
  studentClass,
  studentSection,
  results,
  attendance,
  overallGpa,
  attendancePct,
  presentDays,
  lateDays,
  absentDays,
  onViewFullResults,
  onViewFullAttendance
}) => {
  const [chartMode, setChartMode] = useState<'percentage' | 'gpa'>('percentage');

  const totalSessions = Math.max(1, presentDays + lateDays + absentDays);
  const presentShare = Math.round((presentDays / totalSessions) * 100);
  const lateShare = Math.round((lateDays / totalSessions) * 100);
  const absentShare = Math.max(0, 100 - presentShare - lateShare);

  // Recent 14 attendance sessions sorted chronologically for visual timeline chart
  const recentAttendance = [...attendance]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  // Group attendance into weekly buckets for weekly attendance % bar chart
  const weeklyBuckets = (() => {
    const sorted = [...attendance].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return [];
    const chunkSize = Math.max(1, Math.ceil(sorted.length / 5));
    const buckets: { label: string; pct: number; present: number; total: number }[] = [];
    for (let i = 0; i < sorted.length; i += chunkSize) {
      const slice = sorted.slice(i, i + chunkSize);
      const pCount = slice.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const pct = Math.round((pCount / slice.length) * 100);
      const startLabel = slice[0]?.date.slice(5) || `W${buckets.length + 1}`;
      buckets.push({
        label: `Wk ${buckets.length + 1} (${startLabel})`,
        pct,
        present: pCount,
        total: slice.length
      });
    }
    return buckets.slice(-5);
  })();

  // SVG Donut chart parameters
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const presentStroke = (presentShare / 100) * circumference;
  const lateStroke = (lateShare / 100) * circumference;
  const absentStroke = (absentShare / 100) * circumference;

  const avgPercentage =
    results.length > 0
      ? Math.round(
          results.reduce((acc, r) => acc + (r.marks / r.fullMarks) * 100, 0) / results.length
        )
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-3xl p-6 border border-white/10 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Visual Analytics
            </span>
            <span className="text-xs text-slate-400">
              {studentClass} — {studentSection}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white font-display mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Academic Performance & Attendance Overview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visual breakdown of subject grades, GPA contribution, and attendance trends
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setChartMode('percentage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartMode === 'percentage'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Marks %
            </button>
            <button
              type="button"
              onClick={() => setChartMode('gpa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                chartMode === 'gpa'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              GPA Scale
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Subject Grades Visual Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Recent Grades by Subject ({ chartMode === 'percentage' ? 'Score % vs Class Highest' : 'GPA Point Breakdown' })
                </h4>
                <p className="text-[11px] text-slate-400">
                  Half-Yearly Examination · Average Score: <span className="text-emerald-300 font-semibold">{avgPercentage}%</span> · Cumulative GPA: <span className="text-indigo-300 font-semibold">{overallGpa}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onViewFullResults}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Full Transcript <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertical Bar Chart SVG + Interactive Bars */}
            <div className="pt-2 pb-1">
              <div className="grid grid-cols-8 gap-2 sm:gap-3 items-end h-48 pt-6 px-2 border-b border-white/10 relative">
                {/* Horizontal Reference Lines */}
                <div className="absolute inset-x-0 top-6 border-t border-dashed border-white/5 pointer-events-none flex justify-end pr-1">
                  <span className="text-[9px] text-slate-600 -mt-3">
                    {chartMode === 'percentage' ? '100%' : '5.00'}
                  </span>
                </div>
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/5 pointer-events-none flex justify-end pr-1">
                  <span className="text-[9px] text-slate-600 -mt-3">
                    {chartMode === 'percentage' ? '50%' : '2.50'}
                  </span>
                </div>

                {results.map((r) => {
                  const scorePct = Math.round((r.marks / r.fullMarks) * 100);
                  const highestPct = Math.round((r.highestInClass / r.fullMarks) * 100);
                  const barHeightPct =
                    chartMode === 'percentage'
                      ? Math.max(12, Math.min(100, scorePct))
                      : Math.max(12, Math.min(100, Math.round((r.gpa / 5.0) * 100)));

                  const barColor =
                    r.gpa >= 5.0
                      ? 'from-emerald-500 to-teal-400'
                      : r.gpa >= 4.0
                      ? 'from-indigo-500 to-sky-400'
                      : r.gpa >= 3.5
                      ? 'from-amber-500 to-yellow-400'
                      : 'from-rose-500 to-orange-400';

                  return (
                    <div
                      key={r.id}
                      className="flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Value Label above bar */}
                      <span className="text-[10px] font-bold text-slate-200 mb-1">
                        {chartMode === 'percentage' ? `${scorePct}%` : r.gpa.toFixed(1)}
                      </span>

                      {/* Bar Container */}
                      <div className="w-full max-w-[30px] h-32 bg-slate-800/70 rounded-t-lg relative flex items-end overflow-hidden border border-white/5">
                        {/* Class Highest Ghost Marker in percentage mode */}
                        {chartMode === 'percentage' && (
                          <div
                            className="w-full bg-white/10 absolute bottom-0 left-0 right-0 transition-all"
                            style={{ height: `${highestPct}%` }}
                            title={`Class Highest: ${r.highestInClass}/${r.fullMarks} (${highestPct}%)`}
                          />
                        )}
                        {/* Student Score Bar */}
                        <div
                          className={`w-full bg-gradient-to-t ${barColor} rounded-t-md relative z-10 transition-all duration-500 group-hover:brightness-110`}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>

                      {/* Grade Pill */}
                      <span
                        className={`mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          r.grade === 'A+'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.grade === 'A'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.grade}
                      </span>

                      {/* Subject Short Label */}
                      <span
                        className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-full"
                        title={r.subjectName}
                      >
                        {r.subjectName.slice(0, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                    A+ (80%–100%)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                    A (70%–79%)
                  </span>
                  {chartMode === 'percentage' && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white/20 inline-block" />
                      Class Highest Benchmark
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-medium">
                  Total Marks: <strong className="text-white">{results.reduce((s, r) => s + r.marks, 0)}</strong> / {results.reduce((s, r) => s + r.fullMarks, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Percentage Visual Donut & Weekly Trend Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Attendance Distribution & Trend
              </h4>
              <p className="text-[11px] text-slate-400">
                30-Day Academic Attendance Record ({totalSessions} Sessions)
              </p>
            </div>
            <button
              type="button"
              onClick={onViewFullAttendance}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Radial Donut Gauge + Breakdown Metrics */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/50 rounded-xl p-4 border border-white/5">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="14"
                />
                {/* Present Arc */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${presentStroke} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
                {/* Late Arc */}
                {lateShare > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray={`${lateStroke} ${circumference}`}
                    strokeDashoffset={-presentStroke}
                  />
                )}
                {/* Absent Arc */}
                {absentShare > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#f43f5e"
                    strokeWidth="14"
                    strokeDasharray={`${absentStroke} ${circumference}`}
                    strokeDashoffset={-(presentStroke + lateStroke)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-white font-display">
                  {attendancePct}%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                  Present
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Present Days
                </span>
                <span className="font-bold text-white">
                  {presentDays} <span className="text-slate-400 font-normal">({presentShare}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${presentShare}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Late Arrivals
                </span>
                <span className="font-bold text-white">
                  {lateDays} <span className="text-slate-400 font-normal">({lateShare}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${lateShare}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Absent Days
                </span>
                <span className="font-bold text-white">
                  {absentDays} <span className="text-slate-400 font-normal">({absentShare}%)</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${absentShare}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weekly Attendance Rate Bars + Last 14 Sessions Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                Weekly Attendance Rate
              </span>
              <span className="text-slate-400">
                Recent {recentAttendance.length} Sessions
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {weeklyBuckets.map((b) => (
                <div
                  key={b.label}
                  className="bg-slate-950/60 border border-white/5 rounded-xl p-2 text-center"
                >
                  <div className="text-xs font-bold text-emerald-300">{b.pct}%</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden my-1">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
