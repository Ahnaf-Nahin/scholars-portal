import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { VerificationRequestRecord, NotificationItem, UserRecord } from '../types/database';
import { findPreRegisteredStudent, isPlaceholderStudentName } from '../data/studentCredentials';

function sanitizeEnvValue(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim();
}

function normalizeSupabaseUrl(rawInput: unknown): {
  url: string;
  isValid: boolean;
  diagnostic?: string;
} {
  const cleaned = sanitizeEnvValue(rawInput).replace(/\/+$/, '');
  if (!cleaned) {
    return {
      url: '',
      isValid: false,
      diagnostic:
        'VITE_SUPABASE_URL is not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Netlify Environment Variables (or .env file) and redeploy.'
    };
  }

  let candidate = cleaned;
  if (/^[a-z0-9]{15,30}$/i.test(candidate)) {
    candidate = `https://${candidate.toLowerCase()}.supabase.co`;
  } else if (!/^https?:\/\//i.test(candidate) && candidate.includes('.supabase.co')) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();

    const isPlaceholder =
      host.includes('your-project-ref') ||
      host.includes('your-project') ||
      host.includes('your_project') ||
      host.includes('example.supabase') ||
      host.includes('placeholder') ||
      host === 'supabase.co' ||
      host.startsWith('<') ||
      !host.includes('.');

    if (isPlaceholder) {
      return {
        url: candidate,
        isValid: false,
        diagnostic: `VITE_SUPABASE_URL is currently set to a placeholder ("${cleaned}"). Replace it with your real Supabase Project URL (e.g. https://<project-ref>.supabase.co) in Netlify Environment Variables and trigger a new deploy.`
      };
    }

    return { url: `${parsed.protocol}//${parsed.host}`, isValid: true };
  } catch {
    return {
      url: candidate,
      isValid: false,
      diagnostic: `VITE_SUPABASE_URL ("${cleaned}") is not a valid URL. Use the format https://<project-ref>.supabase.co.`
    };
  }
}

const envObj =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : typeof process !== 'undefined' && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};

const urlInfo = normalizeSupabaseUrl(envObj.VITE_SUPABASE_URL);
const cleanAnonKey = sanitizeEnvValue(envObj.VITE_SUPABASE_ANON_KEY);

const isKeyValid =
  Boolean(cleanAnonKey) &&
  cleanAnonKey !== 'your-public-anon-key' &&
  cleanAnonKey !== 'MY_SUPABASE_ANON_KEY' &&
  cleanAnonKey.length > 20;

export const resolvedSupabaseUrl = urlInfo.url;
export const isSupabaseConfigured = urlInfo.isValid && isKeyValid;
export const supabaseConfigDiagnostic: string | null = !urlInfo.isValid
  ? urlInfo.diagnostic || 'VITE_SUPABASE_URL is invalid.'
  : !isKeyValid
  ? 'VITE_SUPABASE_ANON_KEY is missing or set to a placeholder. Add your Supabase anon/publishable public key in Netlify Environment Variables and redeploy.'
  : null;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(resolvedSupabaseUrl, cleanAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'ssc-supabase-auth-session'
      }
    })
  : null;

export function extractExactSupabaseError(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const obj = err as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
      error_description?: unknown;
    };
    const parts: string[] = [];
    if (obj.code) parts.push(`[Code: ${String(obj.code)}]`);
    if (obj.message) parts.push(String(obj.message));
    else if (obj.error_description) parts.push(String(obj.error_description));
    if (obj.details) parts.push(`Details: ${String(obj.details)}`);
    if (obj.hint) parts.push(`Hint: ${String(obj.hint)}`);
    if (parts.length > 0) return parts.join(' | ');
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export function isNetworkFetchError(err: unknown): boolean {
  const exact = extractExactSupabaseError(err);
  return (
    exact.includes('Failed to fetch') ||
    exact.includes('ERR_NAME_NOT_RESOLVED') ||
    exact.includes('NetworkError') ||
    exact.includes('Load failed') ||
    exact.includes('AbortError') ||
    exact.includes('networkerror')
  );
}

let backgroundPollCooldownUntil = 0;

export function formatSupabaseError(err: unknown, fallbackMsg: string): string {
  const exact = extractExactSupabaseError(err);

  if (isNetworkFetchError(err)) {
    return `Unable to reach Supabase host (${resolvedSupabaseUrl || 'unconfigured URL'}). Please check your internet connection and verify that VITE_SUPABASE_URL points to an active Supabase project.`;
  }
  if (
    exact.includes('PGRST205') ||
    exact.toLowerCase().includes("could not find the table 'public.verification_requests'")
  ) {
    return `${exact} — Table public.verification_requests does not exist in your Supabase database yet. Open Supabase -> SQL Editor -> New query, paste the full SQL from supabase/schema.sql, and click Run.`;
  }
  if (exact.includes('infinite recursion detected in policy')) {
    return `Supabase Error: ${exact} — Please run the updated supabase/schema.sql in your Supabase SQL Editor to replace recursive RLS policies.`;
  }
  return exact || fallbackMsg;
}

export interface SupabaseProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'class_teacher' | 'admin';
  class_name: string | null;
  section: string | null;
  student_id: string | null;
  subject_code?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string | null;
  created_at: string;
}

export interface StudentRegistrationDebugTrace {
  timestamp: string;
  registrationData: {
    fullName: string;
    email: string;
    className: string;
    section: string;
    studentCode: string;
    classTeacherCode: string;
    classTeacherName: string;
  };
  authenticatedStudentUserId: string | null;
  hasActiveSession: boolean;
  studentProfileId: string | null;
  profileInsertResult: Record<string, unknown> | null;
  profileInsertError: string | null;
  verificationRequestInsertPayload: Record<string, unknown> | null;
  verificationRequestInsertResult: Record<string, unknown> | null;
  verificationRequestInsertError: string | null;
  createdVerificationRequestId: string | null;
  confirmedRowAfterInsert: Record<string, unknown> | null;
  confirmSelectError: string | null;
  insertSucceeded: boolean;
  rowFoundAfterward: boolean;
}

export interface TeacherQueryDebugTrace {
  timestamp: string;
  authenticatedTeacherUserId: string | null;
  teacherEmail: string | null;
  teacherProfileData: Record<string, unknown> | null;
  teacherProfileError: string | null;
  teacherClass: string;
  teacherSection: string;
  teacherSubjectCode: string;
  verificationRequestSelectQuery: string;
  returnedRowsCount: number;
  returnedRows: Array<Record<string, unknown>>;
  selectError: string | null;
  studentProfilesReturnedCount: number;
  studentProfilesSelectError: string | null;
}

let latestStudentRegTrace: StudentRegistrationDebugTrace | null = null;
let latestTeacherQueryTrace: TeacherQueryDebugTrace | null = null;

export function getLatestStudentRegistrationTrace(): StudentRegistrationDebugTrace | null {
  return latestStudentRegTrace;
}

export function getLatestTeacherQueryTrace(): TeacherQueryDebugTrace | null {
  return latestTeacherQueryTrace;
}

export function normalizeAuthPassword(rawPassword: string): string {
  const trimmed = rawPassword.trim();
  if (trimmed.length >= 6) return trimmed;
  return `ssc_${trimmed}_auth`;
}

export function mapProfileRowToUserRecord(row: SupabaseProfileRow): UserRecord {
  const isTeacher =
    row.role === 'teacher' || row.role === 'class_teacher' || row.role === 'admin';
  const emailCode =
    !isTeacher && row.email?.toLowerCase().startsWith('student_')
      ? row.email.toLowerCase().replace('student_', '').replace('@ssc.edu', '').toUpperCase()
      : undefined;
  const candidateCode = row.student_id || emailCode;
  const preReg = !isTeacher && candidateCode ? findPreRegisteredStudent(candidateCode) : null;
  const resolvedName =
    preReg?.name ||
    (!isPlaceholderStudentName(row.full_name) ? row.full_name : row.full_name);

  return {
    id: row.id,
    name: resolvedName,
    email: row.email,
    passwordHash: '',
    role: isTeacher ? 'teacher' : 'student',
    profileImage: '',
    phone: row.phone || undefined,
    approvalStatus: row.status,
    studentClass: preReg?.className || row.class_name || undefined,
    section: preReg?.section || row.section || undefined,
    studentIdCode: preReg?.code || candidateCode || undefined,
    teacherCode: row.subject_code || undefined,
    createdAt: row.created_at
  };
}

export async function supabaseFetchPendingSectionCounts(): Promise<Record<string, number>> {
  if (!supabase || !isSupabaseConfigured) return {};
  if (Date.now() < backgroundPollCooldownUntil) return {};

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_pending_section_counts');
    if (rpcError && isNetworkFetchError(rpcError)) {
      backgroundPollCooldownUntil = Date.now() + 30000;
      return {};
    }

    if (!rpcError && Array.isArray(rpcData)) {
      const counts: Record<string, number> = {};
      rpcData.forEach((row: { section_key?: string; pending_count?: number }) => {
        if (row.section_key) {
          counts[String(row.section_key).toLowerCase()] = Number(row.pending_count || 0);
        }
      });
      return counts;
    }

    const { data: reqData, error: reqError } = await supabase
      .from('verification_requests')
      .select('class_name, section, status')
      .eq('status', 'pending');

    if (reqError) {
      if (isNetworkFetchError(reqError)) {
        backgroundPollCooldownUntil = Date.now() + 30000;
        return {};
      }
      console.warn('[VERIFICATION DEBUG] Pending section counts query warning:', reqError);
      return {};
    }

    if (Array.isArray(reqData)) {
      const counts: Record<string, number> = {};
      reqData.forEach((r: { class_name?: string; section?: string }) => {
        if (r.class_name && r.section) {
          const key = `${r.class_name.trim()} — ${r.section.trim().toUpperCase()}`.toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      return counts;
    }
  } catch (err) {
    if (isNetworkFetchError(err)) {
      backgroundPollCooldownUntil = Date.now() + 30000;
    } else {
      console.warn('[VERIFICATION DEBUG] Unexpected warning in supabaseFetchPendingSectionCounts:', err);
    }
  }
  return {};
}

export async function supabaseRegisterStudent(params: {
  fullName: string;
  email: string;
  password: string;
  className: string;
  section: string;
  studentCode: string;
  classTeacherCode: string;
  classTeacherName: string;
}): Promise<{
  ok: boolean;
  error?: string;
  profile?: SupabaseProfileRow;
  verificationRequest?: VerificationRequestRecord;
  debugTrace?: StudentRegistrationDebugTrace;
}> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim();
  const cleanClass = params.className.trim();
  const cleanSection = params.section.trim().toUpperCase();
  const authPassword = normalizeAuthPassword(params.password);
  const nowIso = new Date().toISOString();

  const trace: StudentRegistrationDebugTrace = {
    timestamp: nowIso,
    registrationData: {
      fullName: cleanName,
      email: cleanEmail,
      className: cleanClass,
      section: cleanSection,
      studentCode: params.studentCode,
      classTeacherCode: params.classTeacherCode,
      classTeacherName: params.classTeacherName
    },
    authenticatedStudentUserId: null,
    hasActiveSession: false,
    studentProfileId: null,
    profileInsertResult: null,
    profileInsertError: null,
    verificationRequestInsertPayload: null,
    verificationRequestInsertResult: null,
    verificationRequestInsertError: null,
    createdVerificationRequestId: null,
    confirmedRowAfterInsert: null,
    confirmSelectError: null,
    insertSucceeded: false,
    rowFoundAfterward: false
  };
  latestStudentRegTrace = trace;

  // STEP 1: Log registration data
  console.log('[VERIFICATION DEBUG] 1. Student registration data:', trace.registrationData);

  if (!supabase) {
    const diag =
      supabaseConfigDiagnostic ||
      'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    trace.verificationRequestInsertError = diag;
    console.warn('[VERIFICATION DEBUG] Supabase client not initialized:', diag);
    return { ok: false, error: diag, debugTrace: trace };
  }

  try {
    // STEP 2: Create or authenticate Supabase Auth user
    let userId: string | undefined;
    let hasActiveSession = false;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: authPassword,
      options: {
        data: {
          full_name: cleanName,
          role: 'student',
          class_name: cleanClass,
          section: cleanSection,
          student_id: params.studentCode,
          class_teacher_code: params.classTeacherCode
        }
      }
    });

    if (signUpError) {
      console.warn('[VERIFICATION DEBUG] 2. auth.signUp returned error:', signUpError);
      const msg = signUpError.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        // Attempt to sign in with password so if a previous registration attempt failed mid-way,
        // we can still create/verify their profile and verification_requests row!
        const { data: recoverSignIn, error: recoverErr } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: authPassword
          });
        if (!recoverErr && recoverSignIn?.user) {
          userId = recoverSignIn.user.id;
          hasActiveSession = Boolean(recoverSignIn.session);
          console.log(
            '[VERIFICATION DEBUG] 2. Recovered existing Auth user via signInWithPassword:',
            userId
          );
        } else {
          const exactErr =
            'An account with this email already exists in Supabase Auth. Please switch to Log In.';
          trace.verificationRequestInsertError = exactErr;
          return { ok: false, error: exactErr, debugTrace: trace };
        }
      } else {
        const exactErr = formatSupabaseError(signUpError, 'Supabase Auth signUp failed.');
        trace.verificationRequestInsertError = exactErr;
        return { ok: false, error: exactErr, debugTrace: trace };
      }
    } else {
      if (
        signUpData.user &&
        Array.isArray(signUpData.user.identities) &&
        signUpData.user.identities.length === 0
      ) {
        const { data: recoverSignIn, error: recoverErr } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: authPassword
          });
        if (!recoverErr && recoverSignIn?.user) {
          userId = recoverSignIn.user.id;
          hasActiveSession = Boolean(recoverSignIn.session);
        } else {
          const exactErr =
            'An account with this email already exists. Please switch to Log In.';
          trace.verificationRequestInsertError = exactErr;
          return { ok: false, error: exactErr, debugTrace: trace };
        }
      } else {
        userId = signUpData.user?.id;
        hasActiveSession = Boolean(signUpData.session);
      }
    }

    if (!userId) {
      const noIdErr = 'Registration failed: no user ID returned from Supabase Auth.';
      trace.verificationRequestInsertError = noIdErr;
      console.warn('[VERIFICATION DEBUG] 2. No user ID returned:', signUpData);
      return { ok: false, error: noIdErr, debugTrace: trace };
    }

    if (!hasActiveSession) {
      const { data: signInTry, error: signInTryErr } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: authPassword
        });
      if (signInTry?.session) {
        hasActiveSession = true;
      } else if (signInTryErr) {
        console.warn(
          '[VERIFICATION DEBUG] 2. Post-signUp signInWithPassword did not establish session:',
          extractExactSupabaseError(signInTryErr),
          signInTryErr
        );
      }
    }

    trace.authenticatedStudentUserId = userId;
    trace.hasActiveSession = hasActiveSession;
    console.log('[VERIFICATION DEBUG] 2. Authenticated student user ID:', {
      authenticatedStudentUserId: userId,
      hasActiveSession
    });

    // STEP 3: Create / Verify Student Profile in public.profiles
    // Note: We omit subject_code on student profile inserts so tables without subject_code never fail with PGRST204.
    const coreProfilePayload = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      role: 'student' as const,
      class_name: cleanClass,
      section: cleanSection,
      student_id: params.studentCode,
      status: 'pending' as const
    };

    let confirmedProfile: SupabaseProfileRow | null = null;
    let lastProfileError: unknown = null;

    // 3a. Check if trigger already created the profile row
    const { data: existingProf, error: existingProfCheckErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfCheckErr) {
      console.warn(
        '[VERIFICATION DEBUG] 3. Initial profiles SELECT check error:',
        existingProfCheckErr
      );
      lastProfileError = existingProfCheckErr;
    }

    if (existingProf) {
      // Update existing profile row to ensure exact class_name and section are saved
      const { data: updatedProf, error: updateProfErr } = await supabase
        .from('profiles')
        .update({
          full_name: cleanName,
          class_name: cleanClass,
          section: cleanSection,
          student_id: params.studentCode
        })
        .eq('id', userId)
        .select('*')
        .maybeSingle();

      if (updateProfErr) {
        console.warn(
          '[VERIFICATION DEBUG] 3. Profile update error (using existing trigger profile):',
          updateProfErr
        );
      }
      confirmedProfile = (updatedProf || existingProf) as SupabaseProfileRow;
    } else {
      // Insert new student profile row using .insert() + .select('*')
      const { data: insertedProf, error: insertProfErr } = await supabase
        .from('profiles')
        .insert(coreProfilePayload)
        .select('*')
        .maybeSingle();

      if (insertProfErr) {
        console.warn('[VERIFICATION DEBUG] 3. Student profile INSERT error:', insertProfErr);
        lastProfileError = insertProfErr;

        // If duplicate key (trigger created it concurrently), read it back
        const { data: retryReadProf, error: retryReadProfErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (retryReadProfErr) {
          console.warn(
            '[VERIFICATION DEBUG] 3. Retry profiles SELECT error:',
            retryReadProfErr
          );
        }
        if (retryReadProf) {
          confirmedProfile = retryReadProf as SupabaseProfileRow;
          lastProfileError = null;
        }
      } else if (insertedProf) {
        confirmedProfile = insertedProf as SupabaseProfileRow;
      }
    }

    // If profile still not confirmed, try ensure_student_registration RPC
    if (!confirmedProfile) {
      const { data: rpcRegData, error: rpcRegErr } = await supabase.rpc(
        'ensure_student_registration',
        {
          p_student_id: userId,
          p_email: cleanEmail,
          p_full_name: cleanName,
          p_class_name: cleanClass,
          p_section: cleanSection,
          p_student_code: params.studentCode,
          p_teacher_code: params.classTeacherCode
        }
      );
      if (rpcRegErr) {
        console.warn(
          '[VERIFICATION DEBUG] 3. ensure_student_registration RPC error:',
          rpcRegErr
        );
      } else {
        console.log(
          '[VERIFICATION DEBUG] 3. ensure_student_registration RPC succeeded:',
          rpcRegData
        );
      }

      const { data: afterRpcProf, error: afterRpcProfErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (afterRpcProfErr) {
        console.warn(
          '[VERIFICATION DEBUG] 3. Post-RPC profiles SELECT error:',
          afterRpcProfErr
        );
      }
      if (afterRpcProf) {
        confirmedProfile = afterRpcProf as SupabaseProfileRow;
        lastProfileError = null;
      }
    }

    trace.studentProfileId = confirmedProfile?.id || null;
    trace.profileInsertResult = confirmedProfile
      ? (confirmedProfile as unknown as Record<string, unknown>)
      : null;
    trace.profileInsertError = lastProfileError
      ? extractExactSupabaseError(lastProfileError)
      : null;

    console.log('[VERIFICATION DEBUG] 3. Student profile ID & result:', {
      studentProfileId: trace.studentProfileId,
      profileInsertResult: trace.profileInsertResult,
      profileInsertError: trace.profileInsertError
    });

    // STEP 4: Create Verification Request in public.verification_requests
    const fullReqPayload = {
      student_id: userId,
      student_code: params.studentCode,
      student_name: cleanName,
      student_email: cleanEmail,
      class_name: cleanClass,
      section: cleanSection,
      class_teacher_code: params.classTeacherCode,
      status: 'pending' as const
    };

    trace.verificationRequestInsertPayload = fullReqPayload;
    console.log(
      '[VERIFICATION DEBUG] 4. verification_requests INSERT payload:',
      fullReqPayload
    );

    let insertedOrUpdatedReqRow: Record<string, unknown> | null = null;
    let lastReqInsertError: unknown = null;

    // 4a. Check if trigger or RPC already inserted the verification_requests row
    const { data: preExistingReq, error: preCheckErr } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('student_id', userId)
      .maybeSingle();

    if (preCheckErr) {
      console.warn(
        '[VERIFICATION DEBUG] 4. Pre-insert verification_requests SELECT error:',
        preCheckErr
      );
    }

    if (preExistingReq) {
      console.log(
        '[VERIFICATION DEBUG] 4. Found existing verification_requests row from trigger/RPC, syncing class & section:',
        preExistingReq
      );
      const { data: syncedReq, error: syncErr } = await supabase
        .from('verification_requests')
        .update({
          student_name: cleanName,
          student_email: cleanEmail,
          class_name: cleanClass,
          section: cleanSection
        })
        .eq('student_id', userId)
        .select('*')
        .maybeSingle();

      if (syncErr) {
        console.warn('[VERIFICATION DEBUG] 4. Sync update error:', syncErr);
      }
      insertedOrUpdatedReqRow = (syncedReq || preExistingReq) as Record<string, unknown>;
    } else {
      // 4b. Perform explicit INSERT into public.verification_requests
      const { data: insData1, error: insErr1 } = await supabase
        .from('verification_requests')
        .insert(fullReqPayload)
        .select('*')
        .maybeSingle();

      if (!insErr1 && insData1) {
        insertedOrUpdatedReqRow = insData1 as Record<string, unknown>;
        lastReqInsertError = null;
      } else {
        lastReqInsertError = insErr1;
        console.warn(
          '[VERIFICATION DEBUG] 4. Primary verification_requests INSERT error:',
          insErr1
        );

        const errText1 = extractExactSupabaseError(insErr1).toLowerCase();

        // Fallback A: If class_teacher_code or student_code column is missing in user's table
        if (
          errText1.includes('column') ||
          errText1.includes('pgrst204') ||
          errText1.includes('42703') ||
          errText1.includes('schema cache')
        ) {
          const coreReqPayload = {
            student_id: userId,
            student_name: cleanName,
            student_email: cleanEmail,
            class_name: cleanClass,
            section: cleanSection,
            status: 'pending' as const
          };
          console.log(
            '[VERIFICATION DEBUG] 4. Retrying verification_requests INSERT with core columns:',
            coreReqPayload
          );
          const { data: insData2, error: insErr2 } = await supabase
            .from('verification_requests')
            .insert(coreReqPayload)
            .select('*')
            .maybeSingle();

          if (!insErr2 && insData2) {
            insertedOrUpdatedReqRow = insData2 as Record<string, unknown>;
            lastReqInsertError = null;
          } else {
            lastReqInsertError = insErr2 || insErr1;
            console.warn(
              '[VERIFICATION DEBUG] 4. Core verification_requests INSERT error:',
              insErr2
            );
          }
        }

        // Fallback B: If duplicate key error, read and update the existing row
        if (!insertedOrUpdatedReqRow && errText1.includes('duplicate')) {
          const { data: dupRow, error: dupReadErr } = await supabase
            .from('verification_requests')
            .select('*')
            .eq('student_id', userId)
            .maybeSingle();
          if (dupReadErr) {
            console.warn(
              '[VERIFICATION DEBUG] 4. Duplicate row SELECT recovery error:',
              dupReadErr
            );
          }
          if (dupRow) {
            insertedOrUpdatedReqRow = dupRow as Record<string, unknown>;
            lastReqInsertError = null;
          } else if (dupReadErr) {
            lastReqInsertError = dupReadErr;
          }
        }
      }
    }

    trace.verificationRequestInsertResult = insertedOrUpdatedReqRow;
    trace.verificationRequestInsertError = lastReqInsertError
      ? extractExactSupabaseError(lastReqInsertError)
      : null;

    console.log('[VERIFICATION DEBUG] 4. verification_requests INSERT result:', {
      insertResult: trace.verificationRequestInsertResult,
      insertError: trace.verificationRequestInsertError
    });

    // STEP 5 & STEP 6: Confirm the INSERT actually succeeded and confirm the inserted row can be found afterward
    const { data: confirmedReqRow, error: confirmSelectErr } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('student_id', userId)
      .maybeSingle();

    if (confirmSelectErr) {
      console.warn(
        '[VERIFICATION DEBUG] 5 & 6. Post-insert verification_requests SELECT error:',
        confirmSelectErr
      );
      trace.confirmSelectError = extractExactSupabaseError(confirmSelectErr);
    }

    const finalVerifiedRow =
      (confirmedReqRow as Record<string, unknown> | null) || insertedOrUpdatedReqRow;

    trace.confirmedRowAfterInsert = finalVerifiedRow;
    trace.createdVerificationRequestId = finalVerifiedRow?.id
      ? String(finalVerifiedRow.id)
      : null;
    trace.insertSucceeded = Boolean(finalVerifiedRow);
    trace.rowFoundAfterward = Boolean(confirmedReqRow);

    console.log(
      '[VERIFICATION DEBUG] 5 & 6. Confirm verification_requests row in Supabase:',
      {
        insertSucceeded: trace.insertSucceeded,
        rowFoundAfterward: trace.rowFoundAfterward,
        createdVerificationRequestId: trace.createdVerificationRequestId,
        confirmedRow: trace.confirmedRowAfterInsert,
        confirmSelectError: trace.confirmSelectError
      }
    );

    // CRITICAL: If the verification request row was NOT created in Supabase, fail loudly with the exact Supabase error!
    if (!finalVerifiedRow) {
      const exactFailureReason =
        trace.verificationRequestInsertError ||
        trace.confirmSelectError ||
        trace.profileInsertError ||
        (!hasActiveSession
          ? 'Supabase Auth did not return an active session because "Confirm email" is enabled in your Supabase project, blocking RLS INSERTs. Please run supabase/schema.sql in your Supabase SQL Editor or disable "Confirm email" under Authentication -> Providers -> Email.'
          : 'verification_requests INSERT returned no row.');

      const formattedReason = formatSupabaseError(
        exactFailureReason,
        'Supabase verification_requests INSERT failed.'
      );

      console.warn(
        '[VERIFICATION DEBUG] REGISTRATION FAILED — verification_requests row was not created:',
        formattedReason
      );

      if (hasActiveSession) {
        await supabase.auth.signOut().catch(() => {});
      }

      return {
        ok: false,
        error: `Supabase verification_requests INSERT failed: ${formattedReason}`,
        debugTrace: trace
      };
    }

    // Best-effort teacher notification insert with .select('*')
    const { data: notifData, error: notifErr } = await supabase
      .from('notifications')
      .insert({
        target_role: 'teacher',
        class_name: cleanClass,
        section: cleanSection,
        student_user_id: userId,
        title: `Student Sign-Up Approval Required (${cleanClass} — ${cleanSection})`,
        message: `${cleanName} (${cleanEmail} · ID: ${params.studentCode}) registered for ${cleanClass} — ${cleanSection} and is waiting for Class Teacher verification.`,
        category: 'class',
        read: false
      })
      .select('*');

    if (notifErr) {
      console.warn(
        '[VERIFICATION DEBUG] Teacher notification insert error (non-fatal):',
        notifErr
      );
    } else {
      console.log(
        '[VERIFICATION DEBUG] Teacher notification insert succeeded:',
        notifData
      );
    }

    const finalProfile: SupabaseProfileRow = confirmedProfile || {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      role: 'student',
      class_name: cleanClass,
      section: cleanSection,
      student_id: params.studentCode,
      subject_code: null,
      status: 'pending',
      created_at: nowIso
    };

    const finalVerificationReq: VerificationRequestRecord = {
      id: String(finalVerifiedRow.id || `vr-${userId}`),
      student_id: String(finalVerifiedRow.student_id || userId),
      student_code: String(finalVerifiedRow.student_code || params.studentCode),
      student_name: String(finalVerifiedRow.student_name || cleanName),
      student_email: String(finalVerifiedRow.student_email || cleanEmail),
      class_name: String(finalVerifiedRow.class_name || cleanClass),
      section: String(finalVerifiedRow.section || cleanSection),
      class_teacher_code: String(
        finalVerifiedRow.class_teacher_code || params.classTeacherCode
      ),
      status:
        (finalVerifiedRow.status as 'pending' | 'approved' | 'rejected') || 'pending',
      created_at: String(finalVerifiedRow.created_at || nowIso)
    };

    return {
      ok: true,
      profile: finalProfile,
      verificationRequest: finalVerificationReq,
      debugTrace: trace
    };
  } catch (err: unknown) {
    const exactErr = formatSupabaseError(
      err,
      'Unexpected error during student registration.'
    );
    trace.verificationRequestInsertError = exactErr;
    console.warn(
      '[VERIFICATION DEBUG] Unexpected exception in supabaseRegisterStudent:',
      err
    );
    return {
      ok: false,
      error: exactErr,
      debugTrace: trace
    };
  }
}

export async function supabaseCheckStudentStatusByEmail(email: string): Promise<{
  found: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  profile?: UserRecord;
}> {
  if (!supabase) return { found: false };

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { found: false };

  try {
    // 1. Try security-definer RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'check_student_status_by_email',
      { p_email: cleanEmail }
    );

    if (rpcError) {
      if (isNetworkFetchError(rpcError)) {
        return { found: false };
      }
      console.warn('[VERIFICATION DEBUG] check_student_status_by_email RPC warning:', rpcError);
    }

    if (!rpcError && rpcData && rpcData.found) {
      const status = (rpcData.status as 'pending' | 'approved' | 'rejected') || 'pending';
      return {
        found: true,
        status,
        profile: {
          id: String(rpcData.id),
          name: String(rpcData.full_name || cleanEmail),
          email: String(rpcData.email || cleanEmail),
          passwordHash: '',
          role: 'student',
          profileImage: '',
          approvalStatus: status,
          studentClass: String(rpcData.class_name || 'Class 9'),
          section: String(rpcData.section || 'BS2'),
          studentIdCode: String(rpcData.student_id || 'SSC-2026-0901'),
          createdAt: String(rpcData.created_at || new Date().toISOString())
        }
      };
    }

    // 2. Fallback: query verification_requests and profiles directly
    const { data: reqRow, error: reqRowErr } = await supabase
      .from('verification_requests')
      .select('*')
      .ilike('student_email', cleanEmail)
      .maybeSingle();

    if (reqRowErr) {
      console.warn(
        '[VERIFICATION DEBUG] supabaseCheckStudentStatusByEmail verification_requests .select() warning:',
        reqRowErr
      );
    }

    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (profErr) {
      console.warn(
        '[VERIFICATION DEBUG] supabaseCheckStudentStatusByEmail profiles .select() warning:',
        profErr
      );
    }

    if (prof || reqRow) {
      const typedProf = prof as SupabaseProfileRow | null;
      const reqStatus = reqRow?.status as 'pending' | 'approved' | 'rejected' | undefined;
      const resolvedStatus =
        reqStatus && reqStatus !== 'pending'
          ? reqStatus
          : typedProf?.status || reqStatus || 'pending';

      const userRec: UserRecord = typedProf
        ? {
            ...mapProfileRowToUserRecord(typedProf),
            approvalStatus: resolvedStatus
          }
        : {
            id: String(reqRow.student_id),
            name: String(reqRow.student_name || cleanEmail),
            email: cleanEmail,
            passwordHash: '',
            role: 'student',
            profileImage: '',
            approvalStatus: resolvedStatus,
            studentClass: String(reqRow.class_name || 'Class 9'),
            section: String(reqRow.section || 'BS2'),
            studentIdCode: String(reqRow.student_code || 'SSC-2026-0901'),
            createdAt: String(reqRow.created_at || new Date().toISOString())
          };

      return {
        found: true,
        status: resolvedStatus,
        profile: userRec
      };
    }
  } catch (err) {
    console.warn('[VERIFICATION DEBUG] Warning in supabaseCheckStudentStatusByEmail:', err);
  }

  return { found: false };
}

export async function supabaseLoginStudent(
  email: string,
  password: string
): Promise<{
  ok: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  error?: string;
  user?: UserRecord;
  notifications?: NotificationItem[];
}> {
  if (!supabase) {
    return {
      ok: false,
      error:
        supabaseConfigDiagnostic ||
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const authPassword = normalizeAuthPassword(password);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: authPassword
    });

    if (signInError || !signInData.user) {
      console.warn('[VERIFICATION DEBUG] Student signInWithPassword error:', signInError);
      const msg = (signInError?.message || '').toLowerCase();
      if (msg.includes('email not confirmed')) {
        const statusCheck = await supabaseCheckStudentStatusByEmail(cleanEmail);
        if (statusCheck.found && statusCheck.status === 'pending') {
          return {
            ok: false,
            status: 'pending',
            user: statusCheck.profile,
            error: 'Your account is waiting for Class Teacher verification.'
          };
        }
        if (statusCheck.found && statusCheck.status === 'rejected') {
          return {
            ok: false,
            status: 'rejected',
            user: statusCheck.profile,
            error: 'Your registration was rejected by the Class Teacher.'
          };
        }
        return {
          ok: false,
          error:
            'Email confirmation is enabled in your Supabase Auth settings. Run supabase/schema.sql in your Supabase SQL Editor or disable "Confirm email" under Authentication -> Providers -> Email.'
        };
      }

      return {
        ok: false,
        error: formatSupabaseError(signInError, 'Invalid email or password.')
      };
    }

    const authUser = signInData.user;
    const userId = authUser.id;
    const meta = authUser.user_metadata || {};

    // Query both profiles and verification_requests for this authenticated student
    const [profRes, reqRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('verification_requests')
        .select('*')
        .eq('student_id', userId)
        .maybeSingle()
    ]);

    if (profRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] Error reading student profile during login:',
        profRes.error
      );
    }
    if (reqRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] Error reading student verification_requests during login:',
        reqRes.error
      );
    }

    let profile = profRes.data as SupabaseProfileRow | null;
    let verifReq = reqRes.data as Record<string, unknown> | null;

    // Reconstruct profile if missing in database
    if (!profile) {
      const nowIso = new Date().toISOString();
      const coreReconstructed = {
        id: userId,
        email: cleanEmail,
        full_name: String(
          verifReq?.student_name || meta.full_name || cleanEmail.split('@')[0]
        ),
        role: 'student' as const,
        class_name: String(verifReq?.class_name || meta.class_name || 'Class 9').trim(),
        section: String(verifReq?.section || meta.section || 'BS2')
          .trim()
          .toUpperCase(),
        student_id: String(verifReq?.student_code || meta.student_id || 'SSC-2026-0901'),
        status:
          (verifReq?.status as 'pending' | 'approved' | 'rejected') || ('pending' as const)
      };
      const { data: insertedProf, error: reconErr } = await supabase
        .from('profiles')
        .insert(coreReconstructed)
        .select('*')
        .maybeSingle();
      if (reconErr) {
        console.warn(
          '[VERIFICATION DEBUG] Error reconstructing missing student profile:',
          reconErr
        );
      }
      profile = (insertedProf as SupabaseProfileRow | null) || {
        ...coreReconstructed,
        created_at: authUser.created_at || nowIso
      };
    }

    // Reconstruct verification_request if missing in database while student is pending
    if (!verifReq && profile.status === 'pending') {
      const teacherCode = String(meta.class_teacher_code || '18887');
      const fullBackfill = {
        student_id: userId,
        student_code: profile.student_id || 'SSC-2026-0901',
        student_name: profile.full_name,
        student_email: cleanEmail,
        class_name: (profile.class_name || 'Class 9').trim(),
        section: (profile.section || 'BS2').trim().toUpperCase(),
        class_teacher_code: teacherCode,
        status: 'pending' as const
      };
      const { data: bfData, error: backfillReqErr } = await supabase
        .from('verification_requests')
        .insert(fullBackfill)
        .select('*')
        .maybeSingle();

      if (!backfillReqErr && bfData) {
        verifReq = bfData as Record<string, unknown>;
      } else if (backfillReqErr) {
        console.warn(
          '[VERIFICATION DEBUG] Full backfill on student login failed, trying core columns:',
          backfillReqErr
        );
        const { data: bfCoreData, error: bfCoreErr } = await supabase
          .from('verification_requests')
          .insert({
            student_id: userId,
            student_name: profile.full_name,
            student_email: cleanEmail,
            class_name: (profile.class_name || 'Class 9').trim(),
            section: (profile.section || 'BS2').trim().toUpperCase(),
            status: 'pending'
          })
          .select('*')
          .maybeSingle();
        if (!bfCoreErr && bfCoreData) {
          verifReq = bfCoreData as Record<string, unknown>;
        } else if (bfCoreErr) {
          console.warn(
            '[VERIFICATION DEBUG] Core backfill on student login failed:',
            bfCoreErr
          );
        }
      }
    }

    // Resolve authoritative status across both tables
    const reqStatus = verifReq?.status as 'pending' | 'approved' | 'rejected' | undefined;
    const profStatus = profile.status;

    let effectiveStatus: 'pending' | 'approved' | 'rejected' = profStatus || 'pending';
    if (reqStatus && reqStatus !== 'pending' && profStatus === 'pending') {
      effectiveStatus = reqStatus;
      const { error: syncProfErr } = await supabase
        .from('profiles')
        .update({ status: effectiveStatus })
        .eq('id', userId)
        .select('*');
      if (syncProfErr) {
        console.warn(
          '[VERIFICATION DEBUG] Error syncing profile status from verification_requests:',
          syncProfErr
        );
      }
      profile.status = effectiveStatus;
    } else if (profStatus && profStatus !== 'pending') {
      effectiveStatus = profStatus;
    } else if (reqStatus) {
      effectiveStatus = reqStatus;
    }

    const mappedUser = mapProfileRowToUserRecord({
      ...profile,
      class_name: String(verifReq?.class_name || profile.class_name || 'Class 9'),
      section: String(verifReq?.section || profile.section || 'BS2'),
      status: effectiveStatus
    });

    if (effectiveStatus === 'pending') {
      return {
        ok: false,
        status: 'pending',
        user: mappedUser,
        error: 'Your account is waiting for Class Teacher verification.'
      };
    }

    if (effectiveStatus === 'rejected') {
      return {
        ok: false,
        status: 'rejected',
        user: mappedUser,
        error: 'Your registration was rejected by the Class Teacher.'
      };
    }

    // Fetch student's notifications
    const { data: notifRows, error: notifErr } = await supabase
      .from('notifications')
      .select('*')
      .or(`recipient_id.eq.${userId},student_user_id.eq.${userId},target_role.eq.both`)
      .order('created_at', { ascending: false })
      .limit(40);

    if (notifErr) {
      console.warn('[VERIFICATION DEBUG] Error fetching student notifications:', notifErr);
    }

    const notifications: NotificationItem[] = (notifRows || []).map(
      (n: Record<string, unknown>) => ({
        id: String(n.id),
        title: String(n.title || ''),
        message: String(n.message || ''),
        timestamp: n.created_at
          ? new Date(String(n.created_at)).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Just now',
        read: Boolean(n.read),
        targetRole: (n.target_role as 'student' | 'teacher' | 'both') || 'student',
        category: (n.category as NotificationItem['category']) || 'class',
        studentUserId: n.student_user_id ? String(n.student_user_id) : undefined,
        studentClass: n.class_name ? String(n.class_name) : undefined,
        studentSection: n.section ? String(n.section) : undefined
      })
    );

    return {
      ok: true,
      status: 'approved',
      user: mappedUser,
      notifications
    };
  } catch (err: unknown) {
    console.warn('[VERIFICATION DEBUG] Unexpected error in supabaseLoginStudent:', err);
    return {
      ok: false,
      error: formatSupabaseError(err, 'Network error while signing in.')
    };
  }
}

export async function supabaseLoginTeacher(params: {
  code: string;
  password: string;
  defaultName: string;
  subject: string;
  department: string;
  className: string;
  section: string;
}): Promise<{
  ok: boolean;
  error?: string;
  user?: UserRecord;
}> {
  if (!supabase) {
    return {
      ok: false,
      error:
        supabaseConfigDiagnostic ||
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    };
  }

  try {
    const teacherEmail = `teacher_${params.code}@ssc.edu`;
    const authPassword = normalizeAuthPassword(params.password);
    const cleanClass = params.className.trim();
    const cleanSec = params.section.trim().toUpperCase();

    // STEP 7: Teacher logs in with Supabase Auth
    let authUser = null;
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: authPassword
    });

    if (signInError || !signInData.user) {
      const errMsg = (signInError?.message || '').toLowerCase();
      if (errMsg.includes('email not confirmed')) {
        console.warn(
          '[VERIFICATION DEBUG] 7. Teacher login blocked by email confirmation:',
          signInError
        );
        return {
          ok: false,
          error:
            'Email confirmation is enabled in your Supabase Auth settings. Please run supabase/schema.sql in your Supabase SQL Editor or disable "Confirm email" under Authentication -> Providers -> Email.'
        };
      }

      // First time this Class Teacher logs in on this Supabase project: provision their Supabase Auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: teacherEmail,
        password: authPassword,
        options: {
          data: {
            full_name: params.defaultName,
            role: 'teacher',
            class_name: cleanClass,
            section: cleanSec,
            subject_code: params.code
          }
        }
      });

      if (signUpError || !signUpData.user) {
        console.warn(
          '[VERIFICATION DEBUG] 7. Teacher provisioning signUp failed:',
          signUpError || signInError
        );
        return {
          ok: false,
          error: formatSupabaseError(
            signUpError || signInError,
            'Teacher authentication failed.'
          )
        };
      }

      if (!signUpData.session) {
        const retrySignIn = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: authPassword
        });
        if (retrySignIn.error || !retrySignIn.data.user) {
          console.warn(
            '[VERIFICATION DEBUG] 7. Teacher retry signIn failed:',
            retrySignIn.error
          );
          return {
            ok: false,
            error:
              'Teacher account created, but Supabase "Confirm email" is blocking login. Please run supabase/schema.sql in your Supabase SQL Editor or disable "Confirm email" in Supabase Authentication -> Providers -> Email.'
          };
        }
        authUser = retrySignIn.data.user;
      } else {
        authUser = signUpData.user;
      }
    } else {
      authUser = signInData.user;
      await supabase.auth
        .updateUser({
          data: {
            full_name: params.defaultName,
            role: 'teacher',
            class_name: cleanClass,
            section: cleanSec,
            subject_code: params.code
          }
        })
        .catch((e) =>
          console.warn('[VERIFICATION DEBUG] 7. Teacher updateUser metadata warning:', e)
        );
    }

    console.log('[VERIFICATION DEBUG] 7. Authenticated teacher user ID:', {
      authenticatedTeacherUserId: authUser.id,
      teacherEmail,
      subjectCode: params.code,
      expectedClass: cleanClass,
      expectedSection: cleanSec
    });

    // STEP 8: Ensure teacher profile row exists in public.profiles with exact class_name and section.
    // Note: We use role: 'teacher' because 'teacher' is accepted by all versions of profiles_role_check
    // AND all RLS policies check role IN ('teacher', 'class_teacher', 'admin').
    const coreTeacherProfile = {
      id: authUser.id,
      email: teacherEmail,
      full_name: params.defaultName,
      role: 'teacher' as const,
      class_name: cleanClass,
      section: cleanSec,
      status: 'approved' as const
    };

    const { data: existingProf, error: readExistingErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (readExistingErr) {
      console.warn(
        '[VERIFICATION DEBUG] 8. Error reading existing teacher profile from public.profiles:',
        readExistingErr
      );
    }

    let dbTeacherProfile: SupabaseProfileRow | null = existingProf as SupabaseProfileRow | null;

    if (existingProf) {
      const { data: updatedProf, error: updateProfErr } = await supabase
        .from('profiles')
        .update({
          full_name: params.defaultName,
          role: 'teacher',
          class_name: cleanClass,
          section: cleanSec,
          status: 'approved'
        })
        .eq('id', authUser.id)
        .select('*')
        .maybeSingle();

      if (updateProfErr) {
        console.warn(
          '[VERIFICATION DEBUG] 8. Teacher profile UPDATE error:',
          updateProfErr
        );
      } else if (updatedProf) {
        dbTeacherProfile = updatedProf as SupabaseProfileRow;
      }
    } else {
      const { data: insertedProf, error: insertProfErr } = await supabase
        .from('profiles')
        .insert(coreTeacherProfile)
        .select('*')
        .maybeSingle();

      if (insertProfErr) {
        console.warn(
          '[VERIFICATION DEBUG] 8. Teacher profile INSERT error:',
          insertProfErr
        );
      } else if (insertedProf) {
        dbTeacherProfile = insertedProf as SupabaseProfileRow;
      }
    }

    // Re-read teacher profile from DB to confirm what is actually stored in public.profiles
    const { data: verifiedProfile, error: readProfErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (readProfErr) {
      console.warn(
        '[VERIFICATION DEBUG] 8. Teacher profile read-back error:',
        readProfErr
      );
    }
    if (verifiedProfile) {
      dbTeacherProfile = verifiedProfile as SupabaseProfileRow;
    }

    console.log('[VERIFICATION DEBUG] 8. Teacher profile data & class/section:', {
      authenticatedTeacherUserId: authUser.id,
      teacherProfileDataInDatabase: dbTeacherProfile,
      teacherClassInDatabase: dbTeacherProfile?.class_name || null,
      teacherSectionInDatabase: dbTeacherProfile?.section || null,
      assignedClass: cleanClass,
      assignedSection: cleanSec
    });

    const finalProfile: SupabaseProfileRow = dbTeacherProfile
      ? {
          ...dbTeacherProfile,
          full_name: params.defaultName,
          class_name: dbTeacherProfile.class_name || cleanClass,
          section: dbTeacherProfile.section || cleanSec,
          subject_code: dbTeacherProfile.subject_code || params.code
        }
      : {
          ...coreTeacherProfile,
          student_id: null,
          subject_code: params.code,
          created_at: authUser.created_at || new Date().toISOString()
        };

    return {
      ok: true,
      user: mapProfileRowToUserRecord(finalProfile)
    };
  } catch (err: unknown) {
    console.warn('[VERIFICATION DEBUG] Unexpected exception in supabaseLoginTeacher:', err);
    return {
      ok: false,
      error: formatSupabaseError(err, 'Teacher sign-in failed.')
    };
  }
}

export async function supabaseFetchSectionVerificationData(params: {
  className: string;
  section: string;
  teacherCode: string;
}): Promise<{
  requests: VerificationRequestRecord[];
  sectionStudents: UserRecord[];
  notifications: NotificationItem[];
  debugTrace?: TeacherQueryDebugTrace;
}> {
  const cleanClass = params.className.trim();
  const cleanSec = params.section.trim().toUpperCase();
  const nowIso = new Date().toISOString();

  const trace: TeacherQueryDebugTrace = {
    timestamp: nowIso,
    authenticatedTeacherUserId: null,
    teacherEmail: null,
    teacherProfileData: null,
    teacherProfileError: null,
    teacherClass: cleanClass,
    teacherSection: cleanSec,
    teacherSubjectCode: params.teacherCode,
    verificationRequestSelectQuery:
      'SELECT * FROM public.verification_requests ORDER BY created_at DESC',
    returnedRowsCount: 0,
    returnedRows: [],
    selectError: null,
    studentProfilesReturnedCount: 0,
    studentProfilesSelectError: null
  };
  latestTeacherQueryTrace = trace;

  if (!supabase) {
    trace.selectError = 'Supabase client not configured.';
    return { requests: [], sectionStudents: [], notifications: [], debugTrace: trace };
  }

  try {
    // Check active teacher session & DB profile for Step 7 & Step 8 logging
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUser = sessionData.session?.user || null;
    trace.authenticatedTeacherUserId = sessionUser?.id || null;
    trace.teacherEmail = sessionUser?.email || null;

    if (sessionUser?.id) {
      const { data: tProf, error: tProfErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();
      trace.teacherProfileData = (tProf as Record<string, unknown> | null) || null;
      trace.teacherProfileError = tProfErr ? extractExactSupabaseError(tProfErr) : null;
    }

    // STEP 9: Teacher portal queries the verification_requests table
    console.log('[VERIFICATION DEBUG] 9. Executing verification_requests SELECT query:', {
      authenticatedTeacherUserId: trace.authenticatedTeacherUserId,
      teacherEmail: trace.teacherEmail,
      teacherProfileData: trace.teacherProfileData,
      teacherClass: cleanClass,
      teacherSection: cleanSec,
      teacherSubjectCode: params.teacherCode,
      query: trace.verificationRequestSelectQuery
    });

    const [reqRes, profRes, notifRes] = await Promise.all([
      supabase
        .from('verification_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false }),
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    const rawReqRows = (reqRes.data || []) as Array<Record<string, unknown>>;
    const rawProfRows = (profRes.data || []) as SupabaseProfileRow[];

    trace.returnedRowsCount = rawReqRows.length;
    trace.returnedRows = rawReqRows;
    trace.selectError = reqRes.error ? extractExactSupabaseError(reqRes.error) : null;
    trace.studentProfilesReturnedCount = rawProfRows.length;
    trace.studentProfilesSelectError = profRes.error
      ? extractExactSupabaseError(profRes.error)
      : null;

    // STEP 10: Log returned rows and SELECT error
    console.log('[VERIFICATION DEBUG] 10. verification_requests SELECT returned rows:', {
      returnedRowsCount: trace.returnedRowsCount,
      returnedRows: trace.returnedRows,
      selectError: trace.selectError,
      studentProfilesReturnedCount: trace.studentProfilesReturnedCount,
      studentProfiles: rawProfRows,
      studentProfilesSelectError: trace.studentProfilesSelectError
    });

    if (reqRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] 10. verification_requests SELECT error:',
        reqRes.error
      );
    }
    if (profRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] 10. student profiles SELECT error:',
        profRes.error
      );
    }

    const reqMap = new Map<string, VerificationRequestRecord>();

    // Include ALL rows returned from verification_requests so no pending request is hidden by client-side filtering
    rawReqRows.forEach((r: Record<string, unknown>) => {
      const studentId = String(r.student_id || r.id || '');
      if (!studentId) return;

      const rowClass = String(r.class_name || cleanClass).trim();
      const rowSec = String(r.section || cleanSec).trim().toUpperCase();
      const rowCode = String(r.class_teacher_code || params.teacherCode).trim();

      reqMap.set(studentId, {
        id: String(r.id || `vr-${studentId}`),
        student_id: studentId,
        student_code: String(r.student_code || 'SSC-2026-0901'),
        student_name: String(r.student_name || r.full_name || 'Student'),
        student_email: String(r.student_email || r.email || ''),
        class_name: rowClass,
        section: rowSec,
        class_teacher_code: rowCode,
        status: (r.status as 'pending' | 'approved' | 'rejected') || 'pending',
        reviewed_by: r.reviewed_by ? String(r.reviewed_by) : undefined,
        reviewed_at: r.reviewed_at ? String(r.reviewed_at) : undefined,
        created_at: String(r.created_at || nowIso)
      });
    });

    // Also synthesize from any student rows in public.profiles if missing in verification_requests
    const sectionStudents: UserRecord[] = rawProfRows.map((row) => {
      const studentId = String(row.id);
      const existingReq = reqMap.get(studentId);

      if (!existingReq) {
        const synthesized: VerificationRequestRecord = {
          id: `vr-${studentId}`,
          student_id: studentId,
          student_code: String(row.student_id || 'SSC-2026-0901'),
          student_name: row.full_name,
          student_email: row.email,
          class_name: String(row.class_name || cleanClass).trim(),
          section: String(row.section || cleanSec).trim().toUpperCase(),
          class_teacher_code: params.teacherCode,
          status: row.status || 'pending',
          created_at: row.created_at || nowIso
        };
        reqMap.set(studentId, synthesized);
      } else {
        if (existingReq.status === 'pending' && row.status && row.status !== 'pending') {
          existingReq.status = row.status;
        }
      }
      return mapProfileRowToUserRecord(row);
    });

    const requests = Array.from(reqMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const notifications: NotificationItem[] = (notifRes.data || []).map(
      (n: Record<string, unknown>) => ({
        id: String(n.id),
        title: String(n.title || ''),
        message: String(n.message || ''),
        timestamp: n.created_at
          ? new Date(String(n.created_at)).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Just now',
        read: Boolean(n.read),
        targetRole: (n.target_role as 'student' | 'teacher' | 'both') || 'both',
        category: (n.category as NotificationItem['category']) || 'class',
        studentUserId: n.student_user_id ? String(n.student_user_id) : undefined,
        studentClass: n.class_name ? String(n.class_name) : undefined,
        studentSection: n.section ? String(n.section) : undefined
      })
    );

    return { requests, sectionStudents, notifications, debugTrace: trace };
  } catch (err) {
    const exactErr = extractExactSupabaseError(err);
    trace.selectError = exactErr;
    console.warn(
      '[VERIFICATION DEBUG] Unexpected error in supabaseFetchSectionVerificationData:',
      err
    );
    return { requests: [], sectionStudents: [], notifications: [], debugTrace: trace };
  }
}

export async function supabaseReviewStudentStatus(params: {
  studentUserId: string;
  newStatus: 'approved' | 'rejected';
  studentName: string;
  className: string;
  section: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    return {
      ok: false,
      error:
        supabaseConfigDiagnostic ||
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    };
  }

  try {
    const nowIso = new Date().toISOString();
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewerId = sessionData.session?.user?.id || null;

    console.log('[VERIFICATION DEBUG] Teacher reviewing student verification request:', {
      reviewerId,
      studentUserId: params.studentUserId,
      newStatus: params.newStatus,
      studentName: params.studentName,
      className: params.className,
      section: params.section
    });

    // 1. Try security-definer RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'review_student_verification',
      {
        p_student_id: params.studentUserId,
        p_new_status: params.newStatus
      }
    );

    if (rpcError) {
      console.warn(
        '[VERIFICATION DEBUG] review_student_verification RPC error, falling back to direct RLS table updates:',
        rpcError
      );
    }

    // 2. Also execute direct table updates with .select() so we verify the database state is updated
    const [profUpdateRes, reqUpdateRes] = await Promise.all([
      supabase
        .from('profiles')
        .update({ status: params.newStatus })
        .eq('id', params.studentUserId)
        .select('id, status'),
      supabase
        .from('verification_requests')
        .update({
          status: params.newStatus,
          reviewed_by: reviewerId,
          reviewed_at: nowIso
        })
        .eq('student_id', params.studentUserId)
        .select('id, status')
    ]);

    if (profUpdateRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] Direct profiles status update error:',
        profUpdateRes.error
      );
    }
    if (reqUpdateRes.error) {
      console.warn(
        '[VERIFICATION DEBUG] Direct verification_requests status update error:',
        reqUpdateRes.error
      );
    }

    const rpcSucceeded = !rpcError && rpcData && rpcData.ok;
    const profileUpdated =
      Array.isArray(profUpdateRes.data) && profUpdateRes.data.length > 0;
    const requestUpdated =
      Array.isArray(reqUpdateRes.data) && reqUpdateRes.data.length > 0;

    console.log('[VERIFICATION DEBUG] Review update results:', {
      rpcSucceeded,
      profileUpdated,
      requestUpdated,
      profUpdateData: profUpdateRes.data,
      reqUpdateData: reqUpdateRes.data
    });

    if (!rpcSucceeded && !profileUpdated && !requestUpdated) {
      const errDetail =
        reqUpdateRes.error ||
        profUpdateRes.error ||
        rpcError ||
        new Error(
          '0 rows updated in Supabase. Please run the updated supabase/schema.sql in your Supabase SQL Editor so Class Teacher RLS policies are active.'
        );
      console.warn(
        '[VERIFICATION DEBUG] Student verification update failed completely:',
        errDetail
      );
      return {
        ok: false,
        error: formatSupabaseError(
          errDetail,
          'Failed to update student verification status in Supabase.'
        )
      };
    }

    if (!rpcSucceeded) {
      const { error: markReadErr } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('student_user_id', params.studentUserId)
        .eq('target_role', 'teacher')
        .select('*');

      if (markReadErr) {
        console.warn(
          '[VERIFICATION DEBUG] Teacher notification mark-read update error:',
          markReadErr
        );
      }

      const { error: notifInsErr } = await supabase
        .from('notifications')
        .insert({
          recipient_id: params.studentUserId,
          target_role: 'student',
          class_name: params.className,
          section: params.section,
          student_user_id: params.studentUserId,
          title:
            params.newStatus === 'approved'
              ? 'Account Approved by Class Teacher'
              : 'Registration Rejected by Class Teacher',
          message:
            params.newStatus === 'approved'
              ? `Welcome ${params.studentName}! Your registration for ${params.className} — ${params.section} has been approved.`
              : `Your registration for ${params.className} — ${params.section} was rejected by the Class Teacher.`,
          category: 'class',
          read: false
        })
        .select('*');

      if (notifInsErr) {
        console.warn(
          '[VERIFICATION DEBUG] Student approval notification insert error:',
          notifInsErr
        );
      }
    }

    return { ok: true };
  } catch (err: unknown) {
    console.warn('[VERIFICATION DEBUG] Unexpected error in supabaseReviewStudentStatus:', err);
    return {
      ok: false,
      error: formatSupabaseError(err, 'Failed to update verification status.')
    };
  }
}

export async function supabaseLoginStudentByCode(params: {
  code: string;
  password: string;
  defaultName: string;
  className: string;
  section: string;
}): Promise<{
  ok: boolean;
  user: UserRecord;
  notifications?: NotificationItem[];
}> {
  const cleanCode = params.code.trim();
  const safeSlug = cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const studentEmail = `student_${safeSlug}@ssc.edu`;
  const cleanClass = params.className.trim() || 'Class 9';
  const cleanSec = params.section.trim().toUpperCase() || 'BS2';

  const fallbackUser: UserRecord = {
    id: `usr-student-${safeSlug}`,
    name: params.defaultName,
    email: studentEmail,
    passwordHash: '',
    role: 'student',
    profileImage: '',
    approvalStatus: 'approved',
    studentClass: cleanClass,
    section: cleanSec,
    studentIdCode: cleanCode,
    createdAt: new Date().toISOString()
  };

  if (!supabase || !isSupabaseConfigured || Date.now() < backgroundPollCooldownUntil) {
    return { ok: true, user: fallbackUser };
  }

  try {
    // 1. Check if a profile with this student_id already exists in public.profiles
    const { data: existingByCode, error: codeLookupErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('student_id', cleanCode)
      .maybeSingle();

    if (codeLookupErr && isNetworkFetchError(codeLookupErr)) {
      backgroundPollCooldownUntil = Date.now() + 30000;
      return { ok: true, user: fallbackUser };
    }

    const matchedProfile = existingByCode as SupabaseProfileRow | null;
    const preReg = findPreRegisteredStudent(cleanCode);
    const resolvedName =
      preReg?.name ||
      (matchedProfile?.full_name && !isPlaceholderStudentName(matchedProfile.full_name)
        ? matchedProfile.full_name
        : params.defaultName);
    const resolvedClass = preReg?.className || matchedProfile?.class_name || cleanClass;
    const resolvedSection = (preReg?.section || matchedProfile?.section || cleanSec)
      .trim()
      .toUpperCase();

    const authPassword = normalizeAuthPassword(params.password);
    let authUser = null;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: authPassword
    });

    if (signInError || !signInData.user) {
      if (signInError && isNetworkFetchError(signInError)) {
        backgroundPollCooldownUntil = Date.now() + 30000;
        return {
          ok: true,
          user: {
            ...fallbackUser,
            name: resolvedName,
            studentClass: resolvedClass,
            section: resolvedSection
          }
        };
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: studentEmail,
        password: authPassword,
        options: {
          data: {
            full_name: resolvedName,
            role: 'student',
            class_name: resolvedClass,
            section: resolvedSection,
            student_id: cleanCode
          }
        }
      });

      if (!signUpError && signUpData.user) {
        authUser = signUpData.user;
      }
    } else {
      authUser = signInData.user;
    }

    if (!authUser) {
      return {
        ok: true,
        user: {
          ...fallbackUser,
          name: resolvedName,
          studentClass: resolvedClass,
          section: resolvedSection
        }
      };
    }

    const coreProfile = {
      id: authUser.id,
      email: studentEmail,
      full_name: resolvedName,
      role: 'student' as const,
      class_name: resolvedClass,
      section: resolvedSection,
      student_id: cleanCode,
      status: 'approved' as const
    };

    const { data: upsertedProf } = await supabase
      .from('profiles')
      .upsert(coreProfile, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    const finalProfile: SupabaseProfileRow = (upsertedProf as SupabaseProfileRow | null) || {
      ...coreProfile,
      subject_code: null,
      created_at: authUser.created_at || new Date().toISOString()
    };

    return {
      ok: true,
      user: {
        ...mapProfileRowToUserRecord(finalProfile),
        name: resolvedName,
        studentClass: resolvedClass,
        section: resolvedSection,
        studentIdCode: cleanCode,
        approvalStatus: 'approved'
      }
    };
  } catch (err) {
    if (isNetworkFetchError(err)) {
      backgroundPollCooldownUntil = Date.now() + 30000;
    }
    return { ok: true, user: fallbackUser };
  }
}

export async function supabaseRestoreUserSession(): Promise<{
  hasSession: boolean;
  role?: 'teacher' | 'student';
  status?: 'pending' | 'approved' | 'rejected';
  user?: UserRecord;
  notifications?: NotificationItem[];
}> {
  if (!supabase || !isSupabaseConfigured) {
    return { hasSession: false };
  }

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      console.warn('[VERIFICATION DEBUG] supabaseRestoreUserSession getSession warning:', sessionErr);
    }

    const sessionUser = sessionData.session?.user;
    if (!sessionUser) {
      return { hasSession: false };
    }

    const userId = sessionUser.id;
    const cleanEmail = (sessionUser.email || '').trim().toLowerCase();
    const meta = sessionUser.user_metadata || {};

    const [profRes, reqRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('verification_requests')
        .select('*')
        .eq('student_id', userId)
        .maybeSingle()
    ]);

    if (profRes.error && !isNetworkFetchError(profRes.error)) {
      console.warn('[VERIFICATION DEBUG] Restore session profiles .select() warning:', profRes.error);
    }
    if (reqRes.error && !isNetworkFetchError(reqRes.error)) {
      console.warn(
        '[VERIFICATION DEBUG] Restore session verification_requests .select() warning:',
        reqRes.error
      );
    }

    const profile = profRes.data as SupabaseProfileRow | null;
    const verifReq = reqRes.data as Record<string, unknown> | null;

    const isTeacherAccount =
      cleanEmail.startsWith('teacher_') ||
      meta.role === 'teacher' ||
      meta.role === 'class_teacher' ||
      meta.role === 'admin' ||
      profile?.role === 'teacher' ||
      profile?.role === 'class_teacher' ||
      profile?.role === 'admin';

    if (isTeacherAccount) {
      const code = String(
        profile?.subject_code ||
          meta.subject_code ||
          cleanEmail.replace('teacher_', '').replace('@ssc.edu', '') ||
          '18887'
      );
      const teacherRow: SupabaseProfileRow = profile || {
        id: userId,
        email: cleanEmail,
        full_name: String(meta.full_name || 'Class Teacher'),
        role: 'teacher',
        class_name: String(meta.class_name || 'Class 9'),
        section: String(meta.section || 'BS2'),
        student_id: null,
        subject_code: code,
        status: 'approved',
        created_at: sessionUser.created_at || new Date().toISOString()
      };

      const mappedTeacher = mapProfileRowToUserRecord({
        ...teacherRow,
        subject_code: code,
        status: 'approved'
      });

      return {
        hasSession: true,
        role: 'teacher',
        status: 'approved',
        user: mappedTeacher
      };
    }

    // Student session restoration
    const reqStatus = verifReq?.status as 'pending' | 'approved' | 'rejected' | undefined;
    const profStatus = profile?.status;

    let effectiveStatus: 'pending' | 'approved' | 'rejected' = profStatus || 'pending';
    if (reqStatus && reqStatus !== 'pending' && (!profStatus || profStatus === 'pending')) {
      effectiveStatus = reqStatus;
    } else if (profStatus && profStatus !== 'pending') {
      effectiveStatus = profStatus;
    } else if (reqStatus) {
      effectiveStatus = reqStatus;
    }

    const extractedCodeFromEmail = cleanEmail.startsWith('student_')
      ? cleanEmail.replace('student_', '').replace('@ssc.edu', '').toUpperCase()
      : '';
    const candidateStudentCode = String(
      profile?.student_id ||
        verifReq?.student_code ||
        meta.student_id ||
        extractedCodeFromEmail ||
        '90001'
    );
    const preRegMatch = findPreRegisteredStudent(candidateStudentCode);

    const rawCandidateName = String(
      profile?.full_name ||
        verifReq?.student_name ||
        meta.full_name ||
        cleanEmail.split('@')[0] ||
        'Student'
    );
    const resolvedStudentName =
      preRegMatch?.name ||
      (!isPlaceholderStudentName(rawCandidateName)
        ? rawCandidateName
        : rawCandidateName);

    const studentRow: SupabaseProfileRow = {
      id: userId,
      email: cleanEmail,
      full_name: resolvedStudentName,
      role: 'student',
      class_name: String(
        preRegMatch?.className || profile?.class_name || verifReq?.class_name || meta.class_name || 'Class 9'
      ).trim(),
      section: String(
        preRegMatch?.section || profile?.section || verifReq?.section || meta.section || 'BS2'
      )
        .trim()
        .toUpperCase(),
      student_id: preRegMatch?.code || candidateStudentCode,
      subject_code: null,
      status: preRegMatch ? 'approved' : effectiveStatus,
      created_at: profile?.created_at || sessionUser.created_at || new Date().toISOString()
    };

    const mappedStudent = mapProfileRowToUserRecord({
      ...studentRow,
      class_name: studentRow.class_name || 'Class 9',
      section: studentRow.section || 'BS2',
      status: preRegMatch ? 'approved' : effectiveStatus
    });

    let notifications: NotificationItem[] = [];
    if (effectiveStatus === 'approved') {
      const { data: notifRows } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${userId},student_user_id.eq.${userId},target_role.eq.both`)
        .order('created_at', { ascending: false })
        .limit(40);

      notifications = (notifRows || []).map((n: Record<string, unknown>) => ({
        id: String(n.id),
        title: String(n.title || ''),
        message: String(n.message || ''),
        timestamp: n.created_at
          ? new Date(String(n.created_at)).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Just now',
        read: Boolean(n.read),
        targetRole: (n.target_role as 'student' | 'teacher' | 'both') || 'student',
        category: (n.category as NotificationItem['category']) || 'class',
        studentUserId: n.student_user_id ? String(n.student_user_id) : undefined,
        studentClass: n.class_name ? String(n.class_name) : undefined,
        studentSection: n.section ? String(n.section) : undefined
      }));
    }

    return {
      hasSession: true,
      role: 'student',
      status: effectiveStatus,
      user: mappedStudent,
      notifications
    };
  } catch (err) {
    console.warn('[VERIFICATION DEBUG] Unexpected warning in supabaseRestoreUserSession:', err);
    return { hasSession: false };
  }
}

export function subscribeToSupabaseVerificationChanges(onChange: () => void): () => void {
  if (!supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel('ssc-verification-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'verification_requests' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        onChange();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications' },
      () => {
        onChange();
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(
          '[Supabase Realtime] Channel error on ssc-verification-realtime. Falling back to automatic polling.'
        );
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
