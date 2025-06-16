'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, LogOut, Moon, Sun, LayoutDashboard } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// ลงทะเบียนคอมโพเนนต์ Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// อินเทอร์เฟซสำหรับ Booking
interface Booking {
  email: string;
  firstName: string;
  lastName: string;
  timeSlot: string;
}

// ส่งออกอินเทอร์เฟซ DashboardPageProps
export interface DashboardPageProps {
  emailFromUrl: string;
}

export default function DashboardPage({ emailFromUrl }: DashboardPageProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState(emailFromUrl);

  // ตรวจสอบอีเมลที่เก็บไว้และยืนยันเซสชัน
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!emailFromUrl && storedEmail) {
      setEmail(storedEmail);
      router.replace(`/dashboard?email=${encodeURIComponent(storedEmail)}`);
    } else if (!emailFromUrl && !storedEmail) {
      setError('กรุณาเข้าสู่ระบบเพื่อเข้าถึงแดชบอร์ด');
      router.push('/');
    }
  }, [emailFromUrl, router]);

  // จัดการโหมดมืด
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDark]);

  // ดึงข้อมูลการจอง
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const url = `${
          process.env.NEXT_PUBLIC_SCRIPT_URL ||
          'https://script.google.com/macros/s/AKfycbxOAMq6q5ir0e_j1_2Pc_2KG9r_LovObThQlaO8-LUrHij9zzmGR-mYbtzEgwnjhoNl/exec'
        }?action=getBookings`;
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลการจองได้');
          setBookings([]);
        }
      } catch (err) {
        console.error('API error:', err);
        setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่ภายหลัง');
      } finally {
        setIsLoading(false);
      }
    };

    if (email) {
      fetchBookings();
    } else {
      setIsLoading(false);
    }
  }, [email]);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  // คำนวณสถิติ
  const totalBookings = bookings.length;
  const uniqueEmails = [...new Set(bookings.map((b) => b.email?.toLowerCase() || ''))].length;

  // การกระจายตัวของช่วงเวลา
  const timeSlotCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    acc[booking.timeSlot] = (acc[booking.timeSlot] || 0) + 1;
    return acc;
  }, {});
  const timeSlotData = {
    labels: Object.keys(timeSlotCounts),
    datasets: [
      {
        label: 'การจองตามช่วงเวลา',
        data: Object.values(timeSlotCounts),
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(59, 130, 246, 0.6)',
        borderColor: isDark ? 'rgba(99, 102, 241, 1)' : 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // การจองรายวัน (จำลอง)
  const dailyBookings = bookings.reduce((acc: Record<string, number>) => {
    const date = '16/6/2025'; // แทนที่ด้วยการแยกวันที่จริงถ้ามีข้อมูล
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
  const dailyData = {
    labels: Object.keys(dailyBookings),
    datasets: [
      {
        label: 'การจองตามวัน',
        data: Object.values(dailyBookings),
        backgroundColor: isDark ? ['rgba(239, 68, 68, 0.6)'] : ['rgba(236, 72, 153, 0.6)'],
        borderColor: isDark ? ['rgba(239, 68, 68, 1)'] : ['rgba(236, 72, 153, 1)'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-red-100 dark:from-indigo-950 dark:via-gray-900 dark:to-red-950 transition-colors duration-700">
      {/* ส่วนหัว (เมนูบาร์) */}
      <motion.nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl shadow-md border-b border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
              <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400">
              iMedReserve
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium">{email || 'ผู้เยี่ยมชม'}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 cursor-default flex items-center space-x-2"
              disabled
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/booking?email=${encodeURIComponent(email)}`)}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>จอง</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/bookings?email=${encodeURIComponent(email)}`)}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>ประวัติการจอง</span>
            </motion.button>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" checked={isDark} onChange={handleToggle} className="sr-only peer" />
              <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                <motion.div className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500">
                  {isDark ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </motion.div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
              </span>
            </label>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-700 dark:to-red-700 text-white text-sm font-medium py-2 px-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </motion.button>
          </div>
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-950 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </motion.button>
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl border-t border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
            >
              <div className="px-4 py-4 flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium">{email || 'ผู้เยี่ยมชม'}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 cursor-default flex items-center space-x-2"
                  disabled
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>แดชบอร์ด</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/booking?email=${encodeURIComponent(email)}`)}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>จอง</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/bookings?email=${encodeURIComponent(email)}`)}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>ประวัติการจอง</span>
                </motion.button>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" checked={isDark} onChange={handleToggle} className="sr-only peer" />
                  <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                    <motion.div className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-600" />
                      )}
                    </motion.div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                  </span>
                </label>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-indigo-600 to-red-600 dark:from-indigo-700 dark:to-red-700 text-white text-sm font-medium py-2 px-5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* เนื้อหาหลัก */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-4xl p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500"
        >
          <h2 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-8 tracking-tight">
            แดชบอร์ดสถิติการจอง
          </h2>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center text-sm text-red-600 dark:text-red-400 mb-6 bg-red-100/50 dark:bg-red-900/50 rounded-lg p-3 shadow-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-8">
              {/* การ์ดสรุป */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-lg bg-white/90 dark:bg-gray-700/80 border border-gray-300 dark:border-indigo-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100">จำนวนการจองทั้งหมด</h3>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalBookings}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-lg bg-white/90 dark:bg-gray-700/80 border border-gray-300 dark:border-indigo-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100">จำนวนผู้ใช้ที่ไม่ซ้ำ</h3>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{uniqueEmails}</p>
                </motion.div>
              </div>

              {/* กราฟ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-lg bg-white/90 dark:bg-gray-700/80 border border-gray-300 dark:border-indigo-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-4">การจองตามช่วงเวลา</h3>
                  <Bar
                    data={timeSlotData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top', labels: { color: isDark ? '#F3F4F6' : '#111827' } },
                        title: { display: true, text: 'การกระจายตัวของช่วงเวลา', color: isDark ? '#F3F4F6' : '#111827' },
                      },
                      scales: {
                        y: { ticks: { color: isDark ? '#F3F4F6' : '#111827' } },
                        x: { ticks: { color: isDark ? '#F3F4F6' : '#111827' } },
                      },
                    }}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-lg bg-white/90 dark:bg-gray-700/80 border border-gray-300 dark:border-indigo-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-4">การจองตามวัน</h3>
                  <Pie
                    data={dailyData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'top', labels: { color: isDark ? '#F3F4F6' : '#111827' } },
                        title: { display: true, text: 'การจองรายวัน', color: isDark ? '#F3F4F6' : '#111827' },
                      },
                    }}
                  />
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* องค์ประกอบตกแต่งพื้นหลัง */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-600/20 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-200/20 dark:bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    </div>
  );
}