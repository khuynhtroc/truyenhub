'use client';

import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable GA4 on admin pages
      (window as any)['ga-disable-G-0CBF77MVXY'] = true;
    }
  }, []);

  return <>{children}</>;
}
