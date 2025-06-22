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
  'rgba(59, 130, 246, 0.8)', // blue-500
  'rgba(239, 68, 68, 0.8)', // red-500
  'rgba(34, 197, 94, 0.8)', // green-500
  'rgba(245, 158, 11, 0.8)', // amber-500
  'rgba(168, 85, 247, 0.8)', // purple-500
  'rgba(236, 72, 153, 0.8)', // pink-500
  'rgba(16, 185, 129, 0.8)', // emerald-500
  'rgba(249, 115, 22, 0.8)', // orange-500
  'rgba(139, 92, 246, 0.8)', // violet-500
  'rgba(6, 182, 212, 0.8)', // cyan-500
  'rgba(220, 38, 127, 0.8)', // rose-500
  'rgba(14, 165, 233, 0.8)', // sky-500
  'rgba(5, 150, 105, 0.8)', // emerald-600
  'rgba(217, 119, 6, 0.8)', // amber-600
  'rgba(147, 51, 234, 0.8)', // violet-600
  'rgba(8, 145, 178, 0.8)', // cyan-600
  'rgba(185, 28, 28, 0.8)', // red-700
  'rgba(30, 64, 175, 0.8)', // blue-700
];
const pieColorsDark = [
  'rgba(59, 130, 246, 0.7)', // blue-500
  'rgba(239, 68, 68, 0.7)', // red-500
  'rgba(34, 197, 94, 0.7)', // green-500
  'rgba(245, 158, 11, 0.7)', // amber-500
  'rgba(168, 85, 247, 0.7)', // purple-500
  'rgba(236, 72, 153, 0.7)', // pink-500
  'rgba(16, 185, 129, 0.7)', // emerald-500
  'rgba(249, 115, 22, 0.7)', // orange-500
  'rgba(139, 92, 246, 0.7)', // violet-500
  'rgba(6, 182, 212, 0.7)', // cyan-500
  'rgba(220, 38, 127, 0.7)', // rose-500
  'rgba(14, 165, 233, 0.7)', // sky-500
  'rgba(5, 150, 105, 0.7)', // emerald-600
  'rgba(217, 119, 6, 0.7)', // amber-600
  'rgba(147, 51, 234, 0.7)', // violet-600
  'rgba(8, 145, 178, 0.7)', // cyan-600
  'rgba(185, 28, 28, 0.7)', // red-700
  'rgba(30, 64, 175, 0.7)', // blue-700
];
const pieBorderLight = pieColorsLight.map(c => c.replace('0.8', '1'));
const pieBorderDark = pieColorsDark.map(c => c.replace('0.7', '1'));

function groupSymptom(symptom: string) {
  if (!symptom || symptom === 'N/A') return 'ไม่ระบุ';
  const s = symptom.trim();
  if (s.includes('เวียนหัว') || s.includes('ปวดหัว')) return 'ปวด/เวียนศีรษะ';
  if (s.includes('บาดเจ็บ') || s.includes('กีฬา')) return 'บาดเจ็บ/อุบัติเหตุ';
  if (s.includes('ไข้')) return 'ไข้/ไม่สบาย';
  if (s.includes('ไอ') || s.includes('เจ็บคอ')) return 'ไอ/เจ็บคอ';
  if (s.includes('ท้องเสีย') || s.includes('ปวดท้อง')) return 'ปวดท้อง/ท้องเสีย';
  if (s.includes('คลื่นไส้') || s.includes('อาเจียน')) return 'คลื่นไส้/อาเจียน';
  if (s.includes('ปวดท้องประจำเดือน')) return 'ปวดท้องประจำเดือน';
  if (s.includes('เป็นลม')) return 'เป็นลม';
  if (s.includes('ท้องผูก')) return 'ท้องผูก';
  if (s.includes('ปวดฟัน')) return 'ปวดฟัน';
  if (s.includes('ปวดหู')) return 'ปวดหู';
  if (s.includes('ปวดหลัง')) return 'ปวดหลัง';
  if (s.includes('ปวดข้อ')) return 'ปวดข้อ';
  if (s.includes('แผล') || s.includes('เลือดออก')) return 'แผล/เลือดออก';
  if (s.includes('หายใจลำบาก')) return 'หายใจลำบาก';
  if (s.includes('แพ้') || s.includes('ผื่นคัน')) return 'แพ้/ผื่นคัน';
  if (s.includes('ปวดตา') || s.includes('สายตา')) return 'ปวดตา/สายตา';
  if (s.includes('เครียด') || s.includes('วิตกกังวล')) return 'เครียด/วิตกกังวล';
  // เพิ่มเติมได้ตามต้องการ
  return s;
}

export default function DashboardPage() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Define timeSlots at component level
  const timeSlots: TimeSlot[] = [
    { display: 'คาบ 0', value: '07:30-08:30' },
    { display: 'คาบ 1', value: '08:30-09:20' },
    { display: 'คาบ 2', value: '09:20-10:10' },
    { display: 'คาบ 3', value: '10:10-11:00' },
    { display: 'คาบ 4', value: '11:00-11:50' },
    { display: 'คาบ 5', value: '11:50-13:00' },
    { display: 'คาบ 6', value: '13:00-13:50' },
    { display: 'คาบ 7', value: '13:50-14:40' },
    { display: 'คาบ 8', value: '14:40-15:30' },
    { display: 'คาบ 9', value: '15:30-16:30' },
  ];

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

  // Fetch bookings with retry mechanism
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const fetchBookings = async (retryAttempt = 0) => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const url = '/api/proxy?action=getBookings';
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', JSON.stringify(data, null, 2));

        if (data.success && Array.isArray(data.bookings)) {
          // Map bookings เฉพาะ field ที่ต้องใช้ใน dashboard
          const mappedBookings = data.bookings.map((booking: any) => {
            // Try to get timeSlot from multiple possible field names
            // Check both the correct Thai field name and the one used in Google Apps Script
            const rawTimeSlot = booking.timeSlot || 
                               booking['คาบที่เรียน'] || 
                               booking['คาบเรียนที่'] || 
                               booking.period || 
                               '';
            const symptoms = booking.symptoms || booking['อาการ'] || '';
            
            // Try to get date from multiple possible field names and formats
            let dateRaw = booking.date || booking['วันที่เลือก'] || '';
            
            // Debug logging
            console.log('Processing booking:', {
              original: booking,
              rawTimeSlot,
              symptoms,
              dateRaw,
              availableFields: Object.keys(booking)
            });
            
            // If date is in ISO format, convert it to the expected format
            if (dateRaw && dateRaw.includes('T')) {
              try {
                const date = new Date(dateRaw);
                if (!isNaN(date.getTime())) {
                  // Convert to DD/MM/YYYY format for consistency
                  dateRaw = date.toLocaleDateString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    timeZone: 'Asia/Bangkok' 
                  });
                }
              } catch (e) {
                console.warn('Failed to parse date:', dateRaw, e);
              }
            }
            
            let timeSlot = 'ไม่ระบุ';
            if (rawTimeSlot && rawTimeSlot.trim() !== '') {
              const found = timeSlots.find((slot: TimeSlot) => slot.value === rawTimeSlot);
              timeSlot = found ? found.display : rawTimeSlot;
            }
            
            let formattedDate = '';
            if (dateRaw && dateRaw.trim() !== '') {
              // If it's already in DD/MM/YYYY format, use it as is
              if (dateRaw.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                formattedDate = dateRaw;
              } else {
                // Try to parse and format
                const d = new Date(dateRaw);
                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString('th-TH', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric', 
                    timeZone: 'Asia/Bangkok' 
                  });
                }
              }
            }
            
            const result = { timeSlot, symptoms, date: formattedDate };
            console.log('Mapped booking result:', result);
            return result;
          });
          setBookings(mappedBookings);
          setError('');
        } else {
          throw new Error(data.message || 'ไม่สามารถดึงข้อมูลได้');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        
        // Handle specific error types
        let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
          } else if (err.message.includes('Failed to fetch') || err.message.includes('Load failed')) {
            errorMessage = 'การเชื่อมต่อกับเครือข่ายหายไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          } else {
            errorMessage = err.message;
          }
        }

        if (isMounted) {
          setError(errorMessage);
          setBookings([]);
        }

        // Retry logic
        if (retryAttempt < maxRetries && isMounted) {
          console.log(`Retrying... Attempt ${retryAttempt + 1}/${maxRetries}`);
          setTimeout(() => {
            if (isMounted) {
              fetchBookings(retryAttempt + 1);
            }
          }, retryDelay * (retryAttempt + 1)); // Exponential backoff
        } else if (retryAttempt >= maxRetries && isMounted) {
          setError('ไม่สามารถเชื่อมต่อได้หลังจากลองหลายครั้ง กรุณารีเฟรชหน้าเว็บ');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBookings();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  // Calculate statistics
  const totalBookings = bookings.length;
  console.log('Total bookings:', totalBookings, 'Bookings:', bookings);

  // Calculate growth rate (comparing with previous week)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  const currentWeekBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date.split('/').reverse().join('-'));
    return bookingDate >= lastWeek && bookingDate <= today;
  }).length;

  const previousWeekBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date.split('/').reverse().join('-'));
    return bookingDate >= twoWeeksAgo && bookingDate < lastWeek;
  }).length;

  const growthRate = previousWeekBookings > 0 
    ? ((currentWeekBookings - previousWeekBookings) / previousWeekBookings * 100).toFixed(1)
    : currentWeekBookings > 0 ? '100' : '0';

  // Calculate most common symptoms
  const symptomCategories = [
    'ปวด/เวียนศีรษะ',
    'ไข้/ไม่สบาย',
    'ปวดท้อง/ท้องเสีย',
    'ปวดท้องประจำเดือน',
    'ไอ/เจ็บคอ',
    'บาดเจ็บ/อุบัติเหตุ',
    'เป็นลม',
    'คลื่นไส้/อาเจียน',
    'ท้องผูก',
    'ปวดฟัน',
    'ปวดหู',
    'ปวดหลัง',
    'ปวดข้อ',
    'แผล/เลือดออก',
    'หายใจลำบาก',
    'แพ้/ผื่นคัน',
    'ปวดตา/สายตา',
    'เครียด/วิตกกังวล',
    'อื่นๆ',
  ];
  const symptomCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    const category = groupSymptom(booking.symptoms || '');
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
        borderWidth: 2,
      },
    ],
  };

  // Calculate average daily bookings
  const uniqueDates = [...new Set(bookings.map(booking => booking.date))];
  const averageDailyBookings = uniqueDates.length > 0 ? (totalBookings / uniqueDates.length).toFixed(1) : '0';

  // Bookings by time slot
  const timeSlotCounts = bookings.reduce((acc: Record<string, number>, booking: Booking) => {
    let display = 'ไม่ระบุ';
    
    if (booking.timeSlot && booking.timeSlot !== 'ไม่ระบุ' && booking.timeSlot.trim() !== '') {
      // Try to find matching time slot
      const matchingSlot = timeSlots.find((slot: TimeSlot) => slot.value === booking.timeSlot);
      if (matchingSlot) {
        display = matchingSlot.display;
      } else {
        // If no exact match, use the time slot as is
        display = booking.timeSlot;
      }
    }
    
    acc[display] = (acc[display] || 0) + 1;
    return acc;
  }, {});
  
  // Filter out "ไม่ระบุ" from peak hours calculation if there are other time slots
  const timeSlotCountsForPeak = { ...timeSlotCounts };
  const hasValidTimeSlots = Object.keys(timeSlotCountsForPeak).some(key => key !== 'ไม่ระบุ' && timeSlotCountsForPeak[key] > 0);
  
  if (hasValidTimeSlots) {
    delete timeSlotCountsForPeak['ไม่ระบุ'];
  }
  
  console.log('Time Slot Counts:', timeSlotCounts);
  console.log('Time Slot Counts for Peak (filtered):', timeSlotCountsForPeak);
  const timeSlotData = {
    labels: Object.keys(timeSlotCounts),
    datasets: [
      {
        label: 'ข้อมูลตามช่วงเวลา',
        data: Object.values(timeSlotCounts),
        backgroundColor: isDark ? pieColorsDark : pieColorsLight,
        borderColor: isDark ? pieBorderDark : pieBorderLight,
        borderWidth: 2,
      },
    ],
  };

  // Bookings by date
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0); // Set to start of day
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setDate(todayDate.getDate() - 6); // 7 days total (today + 6 days back)
  console.log('Today:', todayDate.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));
  console.log('Seven days ago:', sevenDaysAgo.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' }));

  // Generate all dates in the last 7 days for labels
  const dateRange: string[] = [];
  for (let i = 6; i >= 0; i--) { // Start from 6 days ago, go to today
    const date = new Date(todayDate);
    date.setDate(todayDate.getDate() - i);
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

  // อาการที่พบบ่อยจริง
  const mostCommonSymptom = Object.entries(symptomCounts).sort(([,a],[,b])=>b-a)[0]?.[0] || 'ไม่มีข้อมูล';
  const mostCommonSymptomCount = symptomCounts[mostCommonSymptom] || 0;

  // Calculate peak hours using time slot data
  const peakHour = Object.keys(timeSlotCountsForPeak).length > 0 
    ? Object.entries(timeSlotCountsForPeak).reduce((a, b) => timeSlotCountsForPeak[a[0]] > timeSlotCountsForPeak[b[0]] ? a : b, ['', 0])
    : ['ไม่ระบุ', 0];

  // Clean up peak hour display - remove ":00" suffix if present
  const peakHourDisplay = typeof peakHour[0] === 'string' ? peakHour[0].replace(/:00$/, '') : peakHour[0];

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
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700/80 dark:hover:text-white transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>นักเรียนบันทึกข้อมูล</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/bookings')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700/80 dark:hover:text-white transition-all duration-300 flex items-center space-x-2"
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
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700/80 dark:hover:text-white transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>นักเรียนบันทึกข้อมูล</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/bookings')}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-gray-700/80 dark:hover:text-white transition-all duration-300 flex items-center space-x-2"
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
            ข้อมูลการใช้ห้องพยาบาล วันที่ {todayDate.toLocaleDateString('th-TH', {
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
                              color: isDark ? '#fff' : '#000',
                              font: { size: window.innerWidth < 640 ? 12 : 14 },
                              padding: window.innerWidth < 640 ? 15 : 20,
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            titleColor: isDark ? '#fff' : '#000',
                            bodyColor: isDark ? '#fff' : '#000',
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
                              color: isDark ? '#fff' : '#000',
                              font: { 
                                size: window.innerWidth < 640 ? 10 : 11,
                                weight: 'normal'
                              },
                              padding: window.innerWidth < 640 ? 8 : 12,
                              usePointStyle: true,
                              pointStyle: 'circle',
                              boxWidth: window.innerWidth < 640 ? 8 : 10,
                              boxHeight: window.innerWidth < 640 ? 8 : 10,
                            },
                            align: 'start',
                            maxHeight: window.innerWidth < 640 ? 120 : 150,
                            maxWidth: window.innerWidth < 640 ? 200 : 250,
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            titleColor: isDark ? '#fff' : '#000',
                            bodyColor: isDark ? '#fff' : '#000',
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
                              color: isDark ? '#fff' : '#000',
                              font: { size: window.innerWidth < 640 ? 12 : 14 },
                            },
                          },
                          tooltip: {
                            backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                            titleColor: isDark ? '#fff' : '#000',
                            bodyColor: isDark ? '#fff' : '#000',
                            callbacks: {
                              label: (context) => `${context.raw} การใช้ห้องพยาบาล`,
                            },
                          },
                        },
                        scales: {
                          x: {
                            ticks: {
                              color: isDark ? '#fff' : '#000',
                              font: { size: window.innerWidth < 640 ? 10 : 12 },
                            },
                            grid: {
                              color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.08)',
                            },
                          },
                          y: {
                            ticks: {
                              color: isDark ? '#fff' : '#000',
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

              {/* Statistics Cards - ย้ายมาด้านล่าง */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Growth Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-white">อัตราการเติบโต</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {parseFloat(growthRate) >= 0 ? '+' : ''}{growthRate}%
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${parseFloat(growthRate) >= 0 ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                      <svg className={`w-6 h-6 ${parseFloat(growthRate) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={parseFloat(growthRate) >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"} />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white mt-2">เทียบกับสัปดาห์ก่อนหน้า</p>
                </motion.div>

                {/* Average Daily */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-white">จำนวนเฉลี่ยต่อวัน</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{averageDailyBookings}</p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white mt-2">การเข้ารับบริการเฉลี่ย</p>
                </motion.div>

                {/* Peak Hour */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-white">ช่วงเวลาที่มีผู้ใช้บริการสูงสุด</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {peakHourDisplay}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/50">
                      <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white mt-2">
                    {peakHour[1]} ครั้ง
                  </p>
                </motion.div>

                {/* Top Symptom */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="p-4 sm:p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-white">อาการที่พบมากที่สุด</p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate">{mostCommonSymptom}</p>
                    </div>
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-white mt-2">{mostCommonSymptomCount} ครั้ง</p>
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