'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Moon, Sun } from 'lucide-react';
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

// กำหนดสีสำหรับ light/dark mode
const pieColorsLight = [
  'rgba(99, 102, 241, 0.8)', // indigo
  'rgba(236, 72, 153, 0.8)', // pink
  'rgba(34, 197, 94, 0.8)', // green
  'rgba(249, 115, 22, 0.8)', // orange
  'rgba(168, 85, 247, 0.8)', // purple
  'rgba(239, 68, 68, 0.8)', // red
  'rgba(59, 130, 246, 0.8)', // blue
  'rgba(147, 51, 234, 0.8)', // violet
  'rgba(251, 191, 36, 0.8)', // yellow
  'rgba(16, 185, 129, 0.8)', // emerald
  'rgba(245, 101, 101, 0.8)', // red-400
  'rgba(139, 92, 246, 0.8)', // violet-500
  'rgba(14, 165, 233, 0.8)', // sky-500
  'rgba(34, 197, 94, 0.8)', // green-500
  'rgba(251, 146, 60, 0.8)', // orange-400
  'rgba(6, 182, 212, 0.8)', // cyan-500
  'rgba(168, 85, 247, 0.8)', // purple-500
  'rgba(156, 163, 175, 0.8)', // gray-400
];
const pieColorsDark = [
  'rgba(165,180,252,0.7)', // indigo-200
  'rgba(253,186,116,0.7)', // orange-200
  'rgba(134,239,172,0.7)', // green-200
  'rgba(251,207,232,0.7)', // pink-200
  'rgba(192,132,252,0.7)', // purple-300
  'rgba(254,202,202,0.7)', // red-200
  'rgba(191,219,254,0.7)', // blue-200
  'rgba(221,214,254,0.7)', // violet-200
  'rgba(254,240,138,0.7)', // yellow-200
  'rgba(167,243,208,0.7)', // emerald-200
  'rgba(254,215,170,0.7)', // orange-200
  'rgba(196,181,253,0.7)', // violet-200
  'rgba(186,230,253,0.7)', // sky-200
  'rgba(167,243,208,0.7)', // green-200
  'rgba(254,215,170,0.7)', // orange-200
  'rgba(165,243,252,0.7)', // cyan-200
  'rgba(196,181,253,0.7)', // purple-200
  'rgba(209,213,219,0.7)', // gray-300
];
const pieBorderLight = pieColorsLight.map(c => c.replace('0.8', '1'));
const pieBorderDark = pieColorsDark.map(c => c.replace('0.7', '1'));

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
            .map((booking: Record<string, unknown>, index: number) => {
              let formattedDate = '';
              if (booking.date) {
                try {
                  let parsedDate: Date;
                  // Handle YYYY-MM-DD format
                  if (/^\d{4}-\d{2}-\d{2}$/.test(booking.date as string)) {
                    const [year, month, day] = (booking.date as string).split('-').map(Number);
                    parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                  }
                  // Handle DD/MM/YYYY format
                  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(booking.date as string)) {
                    const [day, month, year] = (booking.date as string).split('/').map(Number);
                    parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
                  }
                  // Handle other date formats
                  else {
                    parsedDate = new Date(booking.date as string);
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
                firstName: booking.firstName as string || '',
                lastName: booking.lastName as string || '',
                timeSlot: booking.period as string || booking.timeSlot as string || '',
                date: formattedDate,
                symptoms: booking.symptome as string || booking.symptoms as string || 'ไม่ระบุ',
                treatment: booking.treatment as string || 'ไม่มี',
              };
            })
            .filter((booking: Booking) => booking.date !== ''); // Only include bookings with valid dates
          console.log('Mapped bookings:', mappedBookings);
          setBookings(mappedBookings);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลได้');
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
        label: 'ข้อมูลตามช่วงเวลา',
        data: Object.values(timeSlotCounts),
        backgroundColor: isDark ? pieColorsDark : pieColorsLight,
        borderColor: isDark ? pieBorderDark : pieBorderLight,
        borderWidth: 1,
      },
    ],
  };

  // Bookings by symptom category
  const symptomCategories = [
    'ปวดหัว', 'ไข้', 'ปวดท้อง', 'เจ็บคอ', 'บาดเจ็บ', 'เวียนหัว', 'คลื่นไส้/อาเจียน',
    'ท้องเสีย', 'ท้องผูก', 'ปวดฟัน', 'ปวดหู', 'ปวดหลัง', 'ปวดข้อ', 'แผล/เลือดออก',
    'หายใจลำบาก', 'แพ้/ผื่นคัน', 'อื่นๆ'
  ];
  const symptomCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    let category = 'อื่นๆ';
    if (booking.symptoms && typeof booking.symptoms === 'string') {
      const symptomsLower = booking.symptoms.trim().toLowerCase();
      console.log('Processing symptom:', booking.symptoms, 'Lowercase:', symptomsLower);
      
      // ตรวจสอบอาการต่างๆ
      if (symptomsLower.includes('ปวดหัว') || symptomsLower.includes('headache') || symptomsLower.includes('ปวดศีรษะ')) {
        category = 'ปวดหัว';
      } else if (symptomsLower.includes('ไข้') || symptomsLower.includes('fever') || symptomsLower.includes('ร้อน')) {
        category = 'ไข้';
      } else if (symptomsLower.includes('ปวดท้อง') || symptomsLower.includes('stomach') || symptomsLower.includes('ท้อง')) {
        category = 'ปวดท้อง';
      } else if (symptomsLower.includes('เจ็บคอ') || symptomsLower.includes('throat') || symptomsLower.includes('คอ')) {
        category = 'เจ็บคอ';
      } else if (symptomsLower.includes('บาดเจ็บ') || symptomsLower.includes('injury') || symptomsLower.includes('หกล้ม') || symptomsLower.includes('ชน')) {
        category = 'บาดเจ็บ';
      } else if (symptomsLower.includes('เวียนหัว') || symptomsLower.includes('dizzy') || symptomsLower.includes('มึน')) {
        category = 'เวียนหัว';
      } else if (symptomsLower.includes('คลื่นไส้') || symptomsLower.includes('อาเจียน') || symptomsLower.includes('nausea') || symptomsLower.includes('vomit')) {
        category = 'คลื่นไส้/อาเจียน';
      } else if (symptomsLower.includes('ท้องเสีย') || symptomsLower.includes('diarrhea') || symptomsLower.includes('ถ่ายเหลว')) {
        category = 'ท้องเสีย';
      } else if (symptomsLower.includes('ท้องผูก') || symptomsLower.includes('constipation') || symptomsLower.includes('ถ่ายยาก')) {
        category = 'ท้องผูก';
      } else if (symptomsLower.includes('ปวดฟัน') || symptomsLower.includes('toothache') || symptomsLower.includes('ฟัน')) {
        category = 'ปวดฟัน';
      } else if (symptomsLower.includes('ปวดหู') || symptomsLower.includes('earache') || symptomsLower.includes('หู')) {
        category = 'ปวดหู';
      } else if (symptomsLower.includes('ปวดหลัง') || symptomsLower.includes('back pain') || symptomsLower.includes('หลัง')) {
        category = 'ปวดหลัง';
      } else if (symptomsLower.includes('ปวดข้อ') || symptomsLower.includes('joint pain') || symptomsLower.includes('ข้อ')) {
        category = 'ปวดข้อ';
      } else if (symptomsLower.includes('แผล') || symptomsLower.includes('เลือด') || symptomsLower.includes('wound') || symptomsLower.includes('bleeding')) {
        category = 'แผล/เลือดออก';
      } else if (symptomsLower.includes('หายใจลำบาก') || symptomsLower.includes('breathing') || symptomsLower.includes('หอบ')) {
        category = 'หายใจลำบาก';
      } else if (symptomsLower.includes('แพ้') || symptomsLower.includes('ผื่น') || symptomsLower.includes('คัน') || symptomsLower.includes('allergy') || symptomsLower.includes('rash')) {
        category = 'แพ้/ผื่นคัน';
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
        label: 'การบันทึกตามอาการ',
        data: symptomCategories.map((category) => symptomCounts[category] || 0),
        backgroundColor: isDark ? pieColorsDark : pieColorsLight,
        borderColor: isDark ? pieBorderDark : pieBorderLight,
        borderWidth: 1,
      },
    ],
  };

  // Bookings by date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // 7 days total (today + 6 days back)
  console.log('Today:', today.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));
  console.log('Seven days ago:', sevenDaysAgo.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));

  // Generate all dates in the last 7 days for labels
  const dateRange: string[] = [];
  for (let i = 6; i >= 0; i--) { // Start from 6 days ago, go to today
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dateRange.push(date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Bangkok' }));
  }
  console.log('Date Range (last 7 days):', dateRange);

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
  let barStepSize = 10;
  if (yAxisMax <= 10) barStepSize = 1;
  else if (yAxisMax <= 50) barStepSize = 5;
  else if (yAxisMax <= 100) barStepSize = 10;
  else barStepSize = 20;
  console.log('Max Booking Count:', maxBookingCount, 'Y-Axis Max:', yAxisMax, 'Step Size:', barStepSize);

  const dailyData = {
    labels: dateRange,
    datasets: [
      {
        label: 'ข้อมูลการใช้งานตามวัน',
        data: dateRange.map((date) => dailyCounts[date] || 0),
        backgroundColor: isDark ? 'rgba(165,180,252,0.7)' : 'rgba(99, 102, 241, 0.8)',
        borderColor: isDark ? 'rgba(165,180,252,1)' : 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
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
              onClick={() => router.push('/booking')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>นักเรียนบันทึกข้อมูล</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/bookings')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>ประวัติการบันทึก</span>
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
                  onClick={() => router.push('/booking')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>นักเรียนบันทึกข้อมูล</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/bookings')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>ประวัติการบันทึก</span>
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
      <div className="flex-grow flex items-center justify-center px-2 sm:px-4 md:px-6 lg:px-8 pt-16 sm:pt-20 pb-6 sm:pb-10 transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-5xl p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-4 sm:mb-6 tracking-tight">
            แดชบอร์ด iMedReserve
          </h2>
          <p className="text-center text-base sm:text-lg text-gray-950 dark:text-gray-100 mb-4 sm:mb-6 px-2">
            ข้อมูลการใช้ห้องพยาบาล วันที่ {today.toLocaleDateString('th-TH', {
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
                className="text-center text-sm text-red-600 dark:text-red-400 mb-4 sm:mb-6 bg-red-100/50 dark:bg-red-900/50 rounded-lg p-3 shadow-sm mx-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          {isLoading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 px-2">ไม่พบข้อมูลการใช้บริการ</p>
          ) : (
            <div className="space-y-6 sm:space-y-8 md:space-y-10">
              {/* Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white border border-gray-200/70 shadow-lg hover:shadow-2xl transition-all duration-300 text-center"
                whileHover={{ scale: 1.025, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.12)' }}
              >
                <h3 className="text-base sm:text-lg font-semibold text-gray-950 dark:text-gray-100 mb-2">จำนวนการใช้ทั้งหมด</h3>
                <p className="text-3xl sm:text-4xl font-bold text-indigo-600 dark:text-indigo-400">{totalBookings}</p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 px-2">
                  ข้อมูลการใช้ทั้งหมดในระบบจนถึงวันที่ {today.toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'Asia/Bangkok',
                  })}
                </p>
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Pie Chart: Time Slots */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white border border-gray-200/70 shadow-lg hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-950 dark:text-gray-100 mb-3 sm:mb-4 text-center">
                    ข้อมูลตามช่วงเวลา
                  </h3>
                  <div className="max-w-xs sm:max-w-sm mx-auto">
                    <Pie
                      data={timeSlotData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: isDark ? '#fff' : '#1F2937',
                              font: { size: window.innerWidth < 640 ? 12 : 14 },
                              padding: window.innerWidth < 640 ? 15 : 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            bodyColor: isDark ? '#fff' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.label}: ${context.raw} การใช้งาน`,
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
                  className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white border border-gray-200/70 shadow-lg hover:shadow-2xl transition-all duration-300"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-950 dark:text-gray-100 mb-3 sm:mb-4 text-center">
                    ข้อมูลตามอาการ
                  </h3>
                  <div className="max-w-xs sm:max-w-sm mx-auto">
                    <Pie
                      data={symptomData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: isDark ? '#fff' : '#1F2937',
                              font: { size: window.innerWidth < 640 ? 12 : 14 },
                              padding: window.innerWidth < 640 ? 15 : 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            bodyColor: isDark ? '#fff' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.label}: ${context.raw} การใช้งาน`,
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
                  className="p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white border border-gray-200/70 shadow-lg hover:shadow-2xl transition-all duration-300 lg:col-span-2"
                  whileHover={{ scale: 1.015, boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)' }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-950 dark:text-gray-100 mb-3 sm:mb-4 text-center">
                    ข้อมูลตามวันที่ (7 วันล่าสุด)
                  </h3>
                  <div className="max-w-2xl sm:max-w-3xl mx-auto">
                    <Bar
                      data={dailyData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'top',
                            labels: {
                              color: isDark ? '#fff' : '#1F2937',
                              font: { size: window.innerWidth < 640 ? 12 : 14 },
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            bodyColor: isDark ? '#fff' : '#1F2937',
                            callbacks: {
                              label: (context) => `${context.raw} การใช้ห้องพยาบาล`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: isDark ? '#fff' : '#1F2937',
                              font: { size: window.innerWidth < 640 ? 10 : 12 },
                            },
                            grid: {
                              color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.08)',
                            },
                          },
                          y: {
                            ticks: {
                              color: isDark ? '#fff' : '#1F2937',
                              font: { size: window.innerWidth < 640 ? 10 : 12 },
                              stepSize: barStepSize,
                            },
                            grid: {
                              color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.08)',
                            },
                            beginAtZero: true,
                            max: yAxisMax,
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