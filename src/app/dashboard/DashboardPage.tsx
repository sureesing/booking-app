'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Moon, Sun, LayoutDashboard } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Booking {
  firstName: string;
  lastName: string;
  timeSlot: string;
  date: string;
  symptoms?: string;
  treatment?: string;
}

interface TimeSlot {
  display: string;
  value: string;
}

export default function DashboardPage() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Initialize dark mode on client-side only
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  // Update dark mode when isDark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const url = process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx3Ur6OqLhIsK7XwAh5w3ey3CARGohbg8mRyt7OLboGeum-cfFXVguCXo_YJbhgftT4/exec';
        const response = await fetch(`${url}?action=getBookings`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', JSON.stringify(data, null, 2));

        if (data.success && Array.isArray(data.bookings)) {
          console.log('Raw bookings:', data.bookings);
          const mappedBookings = data.bookings
            .map((booking: any, index: number) => {
              let formattedDate = '';
              if (booking.date) {
                try {
                  let parsedDate: Date;
                  // Handle YYYY-MM-DD format
                  if (/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) {
                    const [year, month, day] = booking.date.split('-').map(Number);
                    parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                  }
                  // Handle DD/MM/YYYY format
                  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(booking.date)) {
                    const [day, month, year] = booking.date.split('/').map(Number);
                    parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                  }
                  // Handle other date formats
                  else {
                    parsedDate = new Date(booking.date);
                  }
                  if (!isNaN(parsedDate.getTime())) {
                    formattedDate = parsedDate.toLocaleDateString('th-TH', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      timeZone: 'Asia/Bangkok',
                    });
                  } else {
                    console.warn(`Invalid date format at index ${index}: ${booking.date}`);
                    formattedDate = '';
                  }
                } catch (e) {
                  console.warn(`Error parsing date at index ${index}: ${booking.date}`, e);
                  formattedDate = '';
                }
              } else {
                console.warn(`Missing date at index ${index}:`, booking);
                formattedDate = '';
              }
              console.log(`Index ${index}: Raw date: ${booking.date}, Formatted date: ${formattedDate}, TimeSlot: ${booking.period || booking.timeSlot}, Symptoms: ${booking.symptome || booking.symptoms}`);
              return {
                firstName: booking.firstName || '',
                lastName: booking.lastName || '',
                timeSlot: booking.period || booking.timeSlot || '',
                date: formattedDate,
                symptoms: booking.symptome || booking.symptoms || 'ไม่ระบุ',
                treatment: booking.treatment || 'ไม่มี',
              };
            })
            .filter((booking: Booking) => booking.date !== ''); // Only include bookings with valid dates
          console.log('Mapped bookings:', mappedBookings);
          setBookings(mappedBookings);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลการจองได้');
          setBookings([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  // Define time slots consistent with BookingClient
  const timeSlots: TimeSlot[] = [
    { display: 'คาบ 0', value: '07:30-08:00' },
    { display: 'คาบ 1', value: '08:30-09:30' },
    { display: 'คาบ 2', value: '09:30-10:30' },
    { display: 'คาบ 3', value: '10:30-11:30' },
    { display: 'คาบ 4', value: '11:30-12:30' },
    { display: 'คาบ 5', value: '12:30-13:30' },
    { display: 'คาบ 6', value: '13:30-14:30' },
    { display: 'คาบ 7', value: '14:30-15:30' },
    { display: 'คาบ 8', value: '15:30-16:30' },
  ];

  // Calculate statistics
  const totalBookings = bookings.length;
  console.log('Total bookings:', totalBookings, 'Bookings:', bookings);

  // Bookings by time slot
  const timeSlotCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    const display = timeSlots.find((slot) => slot.value === booking.timeSlot)?.display || booking.timeSlot || 'ไม่ระบุ';
    acc[display] = (acc[display] || 0) + 1;
    return acc;
  }, {});
  console.log('Time Slot Counts:', timeSlotCounts);
  const timeSlotData = {
    labels: Object.keys(timeSlotCounts),
    datasets: [
      {
        label: 'การจองตามช่วงเวลา',
        data: Object.values(timeSlotCounts),
        backgroundColor: [
          'rgba(99, 102, 241, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(147, 51, 234, 0.6)',
          'rgba(251, 191, 36, 0.6)',
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Bookings by symptom category
  const symptomCategories = ['ปวดหัว', 'ไข้', 'ปวดท้อง', 'เจ็บคอ', 'บาดเจ็บ', 'อื่นๆ'];
  const symptomCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    let category = 'อื่นๆ';
    if (booking.symptoms && typeof booking.symptoms === 'string') {
      const symptomsLower = booking.symptoms.trim().toLowerCase();
      console.log('Processing symptom:', booking.symptoms, 'Lowercase:', symptomsLower);
      if (symptomsLower.includes('ปวดหัว') || symptomsLower.includes('headache')) {
        category = 'ปวดหัว';
      } else if (symptomsLower.includes('ไข้') || symptomsLower.includes('fever')) {
        category = 'ไข้';
      } else if (symptomsLower.includes('ปวดท้อง') || symptomsLower.includes('stomach')) {
        category = 'ปวดท้อง';
      } else if (symptomsLower.includes('เจ็บคอ') || symptomsLower.includes('throat')) {
        category = 'เจ็บคอ';
      } else if (symptomsLower.includes('บาดเจ็บ') || symptomsLower.includes('injury')) {
        category = 'บาดเจ็บ';
      }
      console.log('Assigned category:', category);
    } else {
      console.warn('Invalid or missing symptoms:', booking.symptoms);
    }
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  console.log('Symptom Counts:', symptomCounts);
  const symptomData = {
    labels: symptomCategories,
    datasets: [
      {
        label: 'การจองตามอาการ',
        data: symptomCategories.map((category) => symptomCounts[category] || 0),
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Bookings by date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  console.log('Today:', today.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));
  console.log('Seven days ago:', sevenDaysAgo.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));

  // Generate all dates in the last 7 days for labels
  const dateRange: string[] = [];
  for (let i = 0; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dateRange.push(date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }));
  }
  dateRange.reverse(); // Sort from oldest to newest
  console.log('Date Range:', dateRange);

  // Collect unique dates from bookings within the last 7 days
  console.log('Processing daily counts for bookings:', bookings);
  const dailyCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    if (booking.date) {
      console.log(`Processing booking date: ${booking.date}`);
      // booking.date is in DD/MM/YYYY format
      if (dateRange.includes(booking.date)) {
        console.log(`Match found: ${booking.date} is in dateRange`);
        acc[booking.date] = (acc[booking.date] || 0) + 1;
      } else {
        console.log(`No match: ${booking.date} not in dateRange`);
      }
    } else {
      console.warn('Missing or invalid date:', booking);
    }
    return acc;
  }, {});
  console.log('Daily Counts:', dailyCounts);

  // Calculate max value for y-axis
  const maxBookingCount = Math.max(...Object.values(dailyCounts), 0);
  const yAxisMax = Math.ceil(maxBookingCount * 1.1); // Add 10% buffer
  const stepSize = yAxisMax <= 50 ? 10 : yAxisMax <= 200 ? 50 : 100; // Dynamic step size
  console.log('Max Booking Count:', maxBookingCount, 'Y-Axis Max:', yAxisMax, 'Step Size:', stepSize);

  const dailyData = {
    labels: dateRange,
    datasets: [
      {
        label: 'การจองตามวัน',
        data: dateRange.map((date) => dailyCounts[date] || 0),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-red-100 dark:from-indigo-950 dark:via-gray-900 dark:to-red-950 transition-colors duration-700">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl shadow-md border-b border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
      >
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
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 cursor-default flex items-center space-x-2"
              disabled
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/booking')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>จอง</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/bookings')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>ประวัติการจอง</span>
            </motion.button>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input type="checkbox" checked={isDark} onChange={handleToggle} className="sr-only peer" />
              <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                <motion.div className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500">
                  {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                </motion.div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
              </span>
            </label>
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 cursor-default flex items-center space-x-2"
                  disabled
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>แดชบอร์ด</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/booking')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>จอง</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/bookings')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>ประวัติการจอง</span>
                </motion.button>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input type="checkbox" checked={isDark} onChange={handleToggle} className="sr-only peer" />
                  <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                    <motion.div className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500">
                      {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    </motion.div>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-gray-950 dark:text-gray-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
                  </span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-5xl p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
        >
          <h2 className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-6 tracking-tight">
            แดชบอร์ด iMedReserve
          </h2>
          <p className="text-center text-lg text-gray-950 dark:text-gray-100 mb-6">
            สถิติการจองห้องพยาบาล วันที่ {today.toLocaleDateString('th-TH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              timeZone: 'Asia/Bangkok',
            })}
          </p>
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
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">ไม่พบข้อมูลการจอง</p>
          ) : (
            <div className="space-y-8">
              {/* Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-6 rounded-lg bg-white/95 dark:bg-gray-800/80 border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] shadow-sm hover:shadow-md transition-all duration-300 text-center"
              >
                <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-2">จำนวนการจองทั้งหมด</h3>
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{totalBookings}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  การจองทั้งหมดในระบบจนถึงวันที่ {today.toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'Asia/Bangkok',
                  })}
                </p>
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart: Time Slots */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-6 rounded-lg bg-white/95 dark:bg-gray-800/80 border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-4 text-center">
                    การจองตามช่วงเวลา
                  </h3>
                  <div className="max-w-sm mx-auto">
                    <Pie
                      data={timeSlotData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: isDark ? '#F3F4F6' : '#1F2937',
                              font: { size: 14 },
                              padding: 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                            bodyColor: isDark ? '#F3F4F6' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.label}: ${context.raw} การจอง`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </motion.div>

                {/* Pie Chart: Symptoms */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="p-6 rounded-lg bg-white/95 dark:bg-gray-800/80 border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-4 text-center">
                    การจองตามอาการ
                  </h3>
                  <div className="max-w-sm mx-auto">
                    <Pie
                      data={symptomData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: isDark ? '#F3F4F6' : '#1F2937',
                              font: { size: 14 },
                              padding: 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                            bodyColor: isDark ? '#F3F4F6' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.label}: ${context.raw} การจอง`,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </motion.div>

                {/* Bar Chart: Daily Bookings */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="p-6 rounded-lg bg-white/95 dark:bg-gray-800/80 border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2"
                >
                  <h3 className="text-lg font-semibold text-gray-950 dark:text-gray-100 mb-4 text-center">
                    การจองตามวันที่ (7 วันล่าสุด)
                  </h3>
                  <div className="max-w-3xl mx-auto">
                    <Bar
                      data={dailyData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: isDark ? '#F3F4F6' : '#1F2937',
                              font: { size: 14 },
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
                            bodyColor: isDark ? '#F3F4F6' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.raw} การจอง`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: isDark ? '#F3F4F6' : '#1F2937',
                              font: { size: 12 },
                            },
                          },
                          y: {
                            ticks: {
                              color: isDark ? '#F3F4F6' : '#1F2937',
                              font: { size: 12 },
                              stepSize: stepSize, // Dynamic step size
                            },
                            beginAtZero: true,
                            max: yAxisMax, // Dynamic max based on data
                          },
                        },
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-400/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 15, 0], y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, repeatType: 'reverse' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-200/20 dark:bg-red-400/40 rounded-full mix-blend-multiply filter blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: 'reverse' }}
        />
      </div>
    </div>
  );
}