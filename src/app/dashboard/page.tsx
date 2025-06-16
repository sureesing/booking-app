
import { Suspense } from 'react';
import DashboardPage from './DashboardPage'; // ลบ { DashboardPageProps }

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
