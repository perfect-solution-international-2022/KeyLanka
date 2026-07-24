import type { AuthUser } from "./api";

export function isLocksmithAuthorized(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.locksmithStatus === "approved";
}
