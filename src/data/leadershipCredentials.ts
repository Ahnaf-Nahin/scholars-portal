import type { LeadershipPosition, UserRecord, UserRole } from '../types/database';

// Simple deterministic hash helper so passwords are never stored in plain text
export function hashCredential(raw: string): string {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 'sha256_sim_' + (h >>> 0).toString(16).padStart(8, '0');
}

export interface LeadershipAccountConfig {
  id: string;
  code: string;
  name: string;
  email: string;
  role: 'chairman' | 'chief_advisor' | 'principal';
  position: LeadershipPosition;
  profileImage: string;
  passwordHash: string;
}

export const INITIAL_LEADERSHIP_ACCOUNTS: LeadershipAccountConfig[] = [
  {
    id: 'usr-leader-chairman',
    code: '111111',
    name: 'Shanaz Huda',
    email: 'chairman@scholars.edu.bd',
    role: 'chairman',
    position: 'Chairman',
    profileImage:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    passwordHash: hashCredential('111111')
  },
  {
    id: 'usr-leader-advisor',
    code: '222222',
    name: 'Md Abul Kasem',
    email: 'chief.advisor@scholars.edu.bd',
    role: 'chief_advisor',
    position: 'Chief Advisor',
    profileImage:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80',
    passwordHash: hashCredential('222222')
  },
  {
    id: 'usr-leader-principal',
    code: '333333',
    name: 'Md Abul Hannan',
    email: 'principal@scholars.edu.bd',
    role: 'principal',
    position: 'Principal',
    profileImage:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    passwordHash: hashCredential('333333')
  }
];

export const LEADERSHIP_CODES: Record<string, LeadershipAccountConfig> =
  INITIAL_LEADERSHIP_ACCOUNTS.reduce(
    (acc, accnt) => {
      acc[accnt.code] = accnt;
      return acc;
    },
    {} as Record<string, LeadershipAccountConfig>
  );

export function findLeadershipAccount(identifier: string): LeadershipAccountConfig | undefined {
  const clean = identifier.trim().toLowerCase();
  return (
    LEADERSHIP_CODES[clean] ||
    INITIAL_LEADERSHIP_ACCOUNTS.find(
      (acc) =>
        acc.code === clean ||
        acc.name.toLowerCase() === clean ||
        acc.email.toLowerCase() === clean
    )
  );
}

export function toLeadershipUserRecord(
  config: LeadershipAccountConfig,
  currentHash?: string
): UserRecord {
  return {
    id: config.id,
    name: config.name,
    email: config.email,
    passwordHash: currentHash || config.passwordHash,
    role: config.role as UserRole,
    position: config.position,
    profileImage: config.profileImage,
    approvalStatus: 'approved'
  };
}
