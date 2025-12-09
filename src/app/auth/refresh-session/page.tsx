'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function RefreshSessionPage() {
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    const refreshSession = async () => {
      try {
        await update();
        router.back();
      } catch (error) {
        console.error('Error refreshing session:', error);
        router.push('/auth/login');
      }
    };
    refreshSession();
  }, [update, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <p className="text-[var(--foreground-secondary)]">Refreshing session...</p>
    </div>
  );
}
