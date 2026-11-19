export const LOCKOUT_MAX = 5
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000

export function isLockedOut(failures: Date[], now: Date): boolean {
  const recent = failures.filter(t => now.getTime() - t.getTime() < LOCKOUT_WINDOW_MS)
  return recent.length >= LOCKOUT_MAX
}
