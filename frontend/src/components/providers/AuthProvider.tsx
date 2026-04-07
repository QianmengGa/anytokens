'use client';

import { SessionProvider } from 'next-auth/react';

// NextAuth Session Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
