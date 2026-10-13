import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  ArrowRight,
  KeyRound,
  UserPlus,
  Mail,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { ALL_CLASS_SECTIONS } from '../data/studentCredentials';
import { sound } from '../utils/sound';
import { Floating3DShapesLayer, Cube3DObject, Square3DObject } from './Animated3DObjectsBanner';

export const LoginModal: React.FC = () => {
  const {
    loginWithCredentials,
    registerWithEmail,
    studentVerificationView,
    clearStudentVerificationView
  } = usePlatform();

  const [loginRole, setLoginRole] = useState<'student' | 'teacher'>('student');
  const [studentMode, setStudentMode] = useState<'signin' | 'register'>('signin');

  // Sign-In Fields
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // Student Registration Fields
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regClassSectionKey, setRegClassSectionKey] = useState<string>('Class 6|B1');

  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const switchRole = (nextRole: 'student' | 'teacher') => {
    sound.playClick();
    setLoginRole(nextRole);
    setAuthError(null);
    setIdentifierInput('');
    setPasswordInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (loginRole === 'student' && studentMode === 'register') {
        const [chosenClass, chosenSection] = regClassSectionKey.split('|');
        const res = await registerWithEmail({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: 'student',
          studentClass: chosenClass || 'Class 6',
          section: chosenSection || 'B1'
        });
        if (!res.ok) {
          setAuthError(res.error || 'Unable to submit registration.');
        } else {
          setRegName('');
          setRegEmail('');
          setRegPassword('');
        }
        return;
      }

      const res = await loginWithCredentials(identifierInput, passwordInput, loginRole);
      if (!res.ok) {
        setAuthError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.75rem)] bg-black text-white flex flex-col justify-between relative overflow-hidden">
      {/* Main Minimal Centered Container */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col justify-center relative z-20">
        {/* Institution Header */}
        <div className="text-center mb-8 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-neutral-300 text-[11px] font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Scholars School &amp; College
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Academic Portal Sign In
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Authorized access for students, faculty, and school leadership.
          </p>
        </div>

        {/* Pending / Verification Status Banner for Unapproved Students */}
        {studentVerificationView && (
          <div className="mb-6 rounded-2xl bg-[#0A0A0A] border border-amber-500/30 p-5 space-y-3 shadow-xl">
            <div className="flex items-start gap-3">
              {studentVerificationView.status === 'pending' ? (
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : studentVerificationView.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-300">
                    {studentVerificationView.status === 'pending'
                      ? 'Pending Class Teacher Approval'
                      : studentVerificationView.status === 'approved'
                      ? 'Registration Approved'
                      : 'Registration Declined'}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {studentVerificationView.message}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white">
                    {studentVerificationView.studentName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {studentVerificationView.className} — {studentVerificationView.section}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-300">
                    ID: {studentVerificationView.studentIdCode}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  clearStudentVerificationView();
                  setStudentMode('signin');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Minimal Login Card */}
        <motion.div
          key={`${loginRole}-${studentMode}`}
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl bg-[#0A0A0A] border border-white/15 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
        >
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => switchRole('student')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-display font-bold text-xs transition-all ${
                loginRole === 'student'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => switchRole('teacher')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-display font-bold text-xs transition-all ${
                loginRole === 'teacher'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Faculty &amp; Leadership</span>
            </button>
          </div>

          {/* Student Sub-mode Toggle (Sign In vs Registration) */}
          {loginRole === 'student' && (
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div className="text-xs font-semibold text-white">
                {studentMode === 'signin' ? 'Student Sign In' : 'New Student Registration'}
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAuthError(null);
                  setStudentMode(studentMode === 'signin' ? 'register' : 'signin');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {studentMode === 'signin' ? (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Account</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Existing Student Login</span>
                  </>
                )}
              </button>
            </div>
          )}

          {loginRole === 'teacher' && (
            <div className="border-b border-white/10 pb-4 mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">
                  Authorized Faculty &amp; Leadership Sign In
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Enter your assigned faculty or leadership access code (e.g. 18887, 111111, 222222, 333333).
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {authError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 leading-relaxed">
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginRole === 'student' && studentMode === 'register' ? (
              <>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="student@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Class &amp; Section
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={regClassSectionKey}
                      onChange={(e) => setRegClassSectionKey(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white focus:outline-none transition-all"
                    >
                      {ALL_CLASS_SECTIONS.map((sec) => (
                        <option key={sec.id} value={`${sec.className}|${sec.section}`}>
                          {sec.className} — Section {sec.section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={4}
                      placeholder="Minimum 4 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    {loginRole === 'teacher' ? 'Access Code' : 'Student ID or Email'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => {
                        setIdentifierInput(e.target.value);
                        setAuthError(null);
                      }}
                      required
                      autoComplete="username"
                      placeholder={
                        loginRole === 'teacher'
                          ? 'Enter authorized access code'
                          : 'Enter Student ID or email'
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setAuthError(null);
                      }}
                      required
                      autoComplete="current-password"
                      placeholder="Enter password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-white/15 focus:border-white text-sm text-white font-mono placeholder:text-neutral-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-display font-bold text-sm text-black bg-white hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? 'Verifying...'
                  : loginRole === 'student' && studentMode === 'register'
                  ? 'Submit Registration Request'
                  : 'Sign In'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 bg-[#050505] py-5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <div>Scholars School &amp; College — Academic Portal</div>
          <div className="font-mono text-[11px]">Dhaka, Bangladesh</div>
        </div>
      </footer>
    </div>
  );
};
