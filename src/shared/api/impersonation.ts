import { STORAGE_KEYS } from "../config/constants";

/** Who the super admin is acting as; shown by the impersonation banner. */
export interface ImpersonationSession {
  targetName: string;
  organizationName: string;
  expiresAt: string;
}

const K = STORAGE_KEYS;

export const readImpersonation = (): ImpersonationSession | null => {
  try {
    const raw = localStorage.getItem(K.IMPERSONATION);
    return raw && localStorage.getItem(K.IMPERSONATOR_TOKEN) ? (JSON.parse(raw) as ImpersonationSession) : null;
  } catch {
    return null;
  }
};

/** Parks the super admin's own session and makes the impersonation token the active one. */
export const beginImpersonation = (token: string, session: ImpersonationSession): void => {
  localStorage.setItem(K.IMPERSONATOR_TOKEN, localStorage.getItem(K.AUTH_TOKEN) ?? "");
  localStorage.setItem(K.IMPERSONATOR_USER, localStorage.getItem(K.AUTH_USER) ?? "");
  localStorage.setItem(K.IMPERSONATION, JSON.stringify(session));
  localStorage.setItem(K.AUTH_TOKEN, token);
};

/** Puts the super admin's own session back; false when there was no impersonation to end. */
export const endImpersonation = (): boolean => {
  const token = localStorage.getItem(K.IMPERSONATOR_TOKEN);
  const user = localStorage.getItem(K.IMPERSONATOR_USER);
  clearImpersonation();
  if (!token || !user) return false;
  localStorage.setItem(K.AUTH_TOKEN, token);
  localStorage.setItem(K.AUTH_USER, user);
  return true;
};

export const clearImpersonation = (): void => {
  localStorage.removeItem(K.IMPERSONATOR_TOKEN);
  localStorage.removeItem(K.IMPERSONATOR_USER);
  localStorage.removeItem(K.IMPERSONATION);
};

/**
 * Full reload after a session swap: every provider (permissions, notifications, AI chat, config) starts over for the
 * new identity instead of keeping the previous one's state.
 */
export const reloadAt = (hashPath: string): void => {
  window.location.hash = hashPath;
  window.location.reload();
};
