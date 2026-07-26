'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAppearancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="p-8 font-mono text-xs text-emerald-400">
      REDIRECTING_TO_ADMIN_DASHBOARD...
    </div>
  );
}
