export type UserStatusCode = 'INACTIVE' | 'ACTIVE' | 'DISABLED' | 'REACTIVATED';

export const UserStatusId = {
  INACTIVE: 0,
  ACTIVE: 1,
  DISABLED: 2,
  REACTIVATED: 3,
} as const;

export const UserStatusLabel: Record<UserStatusCode, string> = {
  INACTIVE: 'Inactive',
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
  REACTIVATED: 'Reactivated',
};

export function idToCode(id: number | string | null | undefined): UserStatusCode {
  const n = typeof id === 'string' ? Number(id) : id ?? 0;
  switch (n) {
    case 1: return 'ACTIVE';
    case 2: return 'DISABLED';
    case 3: return 'REACTIVATED';
    case 0:
    default:
      return 'INACTIVE';
  }
}

export function codeToId(code: UserStatusCode | string): number {
  const up = String(code).toUpperCase() as UserStatusCode;
  switch (up) {
    case 'ACTIVE': return 1;
    case 'DISABLED': return 2;
    case 'REACTIVATED': return 3;
    case 'INACTIVE':
    default:
      return 0;
  }
}

export function codeToLabel(code: UserStatusCode | string): string {
  const up = String(code).toUpperCase() as UserStatusCode;
  return UserStatusLabel[up] ?? String(code);
}

export function normalizeStatus(input: number | string): UserStatusCode {
  if (typeof input === 'number' || /^\d+$/.test(String(input))) return idToCode(input as any);
  return String(input).toUpperCase() as UserStatusCode;
}
