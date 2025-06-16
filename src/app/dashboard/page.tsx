import { Suspense } from 'react';
import DashboardPage from './DashboardPage';

// บังคับให้หน้าเป็นแบบไดนามิก
export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">กำลังโหลด...</div>}>
      <DashboardPage emailFromUrl={email} />
    </Suspense>
  );
}