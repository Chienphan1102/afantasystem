import { create } from 'zustand';

const TTL_MS = 30 * 60 * 1000; // 30 minutes

type MasterPasswordState = {
  password: string | null;
  expiresAt: number | null;
  set: (password: string) => void;
  clear: () => void;
  /** Returns valid password OR null nếu hết hạn / chưa set */
  get: () => string | null;
};

/**
 * Phase 1: Master password lưu IN-MEMORY only (KHÔNG persist).
 * Auto-clear sau 30 phút từ lần set gần nhất.
 * Phase 3: client derive UDK rồi mới gửi lên API → password rời client tối thiểu.
 */
export const useMasterPasswordStore = create<MasterPasswordState>((set, get) => ({
  password: null,
  expiresAt: null,
  set: (password) => {
    set({ password, expiresAt: Date.now() + TTL_MS });
  },
  clear: () => set({ password: null, expiresAt: null }),
  get: () => {
    const { password, expiresAt } = get();
    if (!password || !expiresAt) return null;
    if (Date.now() > expiresAt) {
      set({ password: null, expiresAt: null });
      return null;
    }
    return password;
  },
}));
