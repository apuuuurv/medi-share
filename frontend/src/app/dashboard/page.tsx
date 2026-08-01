'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    const role = user.role?.toUpperCase();

    switch (role) {
      case 'NGO_ADMIN':
      case 'NGO':
      case 'ADMIN':
        router.push('/ngo/requests');
        break;
      case 'VOLUNTEER':
      case 'LOGISTICS':
      case 'DRIVER':
        router.push('/logistics/tasks');
        break;
      default:
        router.push('/request');
        break;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans text-sm">
      Redirecting to your workspace...
    </div>
  );
}