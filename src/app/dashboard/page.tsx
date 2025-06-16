import { Suspense } from 'react';
import DashboardPage, { DashboardPageProps } from './DashboardPage'; // ต้องอยู่ในโฟลเดอร์เดียวกัน

// บังคับให้หน้าเป็นแบบไดนามิก
export const dynamic = 'force-dynamic';

const Dashboard = ({ searchParams }: { searchParams: { email?: string } }) => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">กำลังโหลด...</div>}>
      <DashboardPage emailFromUrl={searchParams.email || ''} />
    </Suspense>
  );
};

export default Dashboard;