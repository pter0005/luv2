'use client';
import { usePresence } from '@/hooks/usePresence';
export function PresenceTracker({ userEmail }: { userEmail?: string | null }) {
  usePresence(userEmail);
  return null;
}
