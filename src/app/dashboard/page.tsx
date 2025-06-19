import { Suspense } from 'react';
import DashboardPage from './DashboardPage';

// บังคับให้หน้าเป็นแบบไดนามิก
export const dynamic = 'force-dynamic';

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">กำลังโหลด...</div>}>
      <DashboardPage />
    </Suspense>
  );
}