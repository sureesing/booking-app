'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      router.replace(`/dashboard?email=${encodeURIComponent(storedEmail)}`);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null; // ไม่ render อะไร เพราะ redirect ทันที
}