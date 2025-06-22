'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, Moon, Sun, LayoutDashboard, Search, User, Filter, Clock, SortAsc, SortDesc } from 'lucide-react';

interface Booking {
  firstName: string;
  lastName: string;
  timeSlot: string;
  symptoms?: string;
  treatment?: string;
  timestamp?: string;
  date?: string;
}

interface TimeSlot {
  display: string;
  value: string;
}

interface FilterState {
  sortBy: 'newest' | 'oldest';
  timePeriod: 'all' | 'today' | '1day' | '3days' | '1week' | '1month' | '1year';
  periods: string[];
}

export default function BookingsClient() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'newest',
    timePeriod: 'all',
    periods: []
  });
  const router = useRouter();

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Initialize dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  // Handle dark mode updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx3Ur6OqLhIsK7XwAh5w3ey3CARGohbg8mRyt7OLboGeum-cfFXVguCXo_YJbhgftT4/exec';
        if (!scriptUrl) {
          throw new Error('Missing NEXT_PUBLIC_SCRIPT_URL environment variable');
        }
        const query = new URLSearchParams({
          action: 'getBookings',
        });
        console.log('Fetching bookings with URL:', `${scriptUrl}?${query.toString()}`);
        const response = await fetch(`${scriptUrl}?${query.toString()}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API response:', data);
        if (data.success) {
          // Map server response to match Booking interface
          const mappedBookings = Array.isArray(data.bookings) ? data.bookings.map((booking: Record<string, unknown>) => ({
            firstName: booking.firstName as string || '',
            lastName: booking.lastName as string || '',
            timeSlot: booking.period as string || booking.timeSlot as string || '',
            symptoms: booking.symptoms as string || '',
            treatment: booking.treatment as string || '',
            timestamp: (booking.timestamp && booking.timestamp !== 'N/A') ? booking.timestamp as string : undefined,
            date: booking.date as string || '',
          })) : [];
          
          console.log('=== BOOKINGS DATA ===');
          console.log('Raw API response:', data);
          console.log('Mapped bookings:', mappedBookings);
          console.log('Sample booking timeSlot:', mappedBookings[0]?.timeSlot);
          console.log('Sample booking display:', mappedBookings[0] ? getTimeSlotDisplay(mappedBookings[0].timeSlot) : 'N/A');
          console.log('Sample booking timestamp:', mappedBookings[0]?.timestamp);
          console.log('Sample booking date:', mappedBookings[0]?.date);
          
          // Test date parsing for first booking
          if (mappedBookings[0]) {
            const testBooking = mappedBookings[0];
            console.log('=== DATE PARSING TEST ===');
            console.log('Original timestamp:', testBooking.timestamp);
            console.log('Original date:', testBooking.date);
            
            if (testBooking.timestamp) {
              const parsedTimestamp = new Date(testBooking.timestamp);
              console.log('Parsed timestamp:', parsedTimestamp.toISOString(), 'Valid:', !isNaN(parsedTimestamp.getTime()));
            }
            
            if (testBooking.date) {
              let parsedDate: Date | null = null;
              if (testBooking.date.includes('T')) {
                parsedDate = new Date(testBooking.date);
              } else if (testBooking.date.includes('/')) {
                const [day, month, year] = testBooking.date.split('/');
                parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
              console.log('Parsed date:', parsedDate?.toISOString(), 'Valid:', parsedDate ? !isNaN(parsedDate.getTime()) : false);
            }
          }
          
          setBookings(mappedBookings);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลได้');
        }
      } catch (err: unknown) {
        console.error('Fetch error:', err);
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Define time slots with proper mapping
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

  // Helper function to get display name from time slot value
  const getTimeSlotDisplay = (timeSlotValue: string): string => {
    if (!timeSlotValue) return 'ไม่ระบุ';
    
    // First try to find exact match
    const found = timeSlots.find(slot => slot.value === timeSlotValue);
    if (found) return found.display;
    
    // If it's already a display name (like "คาบ 1"), return as is
    if (timeSlotValue.startsWith('คาบ ')) return timeSlotValue;
    
    // Otherwise return the original value
    return timeSlotValue;
  };

  // Helper function to check if a booking matches selected periods
  const matchesSelectedPeriods = (bookingTimeSlot: string, selectedPeriods: string[]): boolean => {
    if (selectedPeriods.length === 0) return true;
    
    const bookingDisplay = getTimeSlotDisplay(bookingTimeSlot);
    
    // Check if any selected period matches the booking's display name
    return selectedPeriods.some(selectedPeriod => {
      // selectedPeriod is like "คาบ 1", "คาบ 2", etc.
      return bookingDisplay === selectedPeriod;
    });
  };

  // Define time periods
  const timePeriods = [
    { display: 'ทั้งหมด', value: 'all' },
    { display: 'วันนี้', value: 'today' },
    { display: 'เมื่อวาน', value: '1day' },
    { display: '2-3 วันที่แล้ว', value: '3days' },
    { display: '1 อาทิตย์ที่แล้ว', value: '1week' },
    { display: '1 เดือนที่แล้ว', value: '1month' },
    { display: '1 ปีที่แล้ว', value: '1year' },
  ];

  // Filter and search bookings
  const filteredBookings = bookings
    .filter((booking) => {
      // Search filter
      const matchesSearch = (
        booking.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.timeSlot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.symptoms && booking.symptoms.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (booking.treatment && booking.treatment.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Period filter
      const matchesPeriod = matchesSelectedPeriods(booking.timeSlot, filters.periods);
      
      // Debug logging for period filtering
      if (filters.periods.length > 0) {
        console.log('Period filtering:', {
          bookingTimeSlot: booking.timeSlot,
          bookingDisplay: getTimeSlotDisplay(booking.timeSlot),
          selectedPeriods: filters.periods,
          matchesPeriod: matchesPeriod
        });
      }

      // Time period filter
      let matchesTimePeriod = true;
      if (filters.timePeriod !== 'all') {
        // Try to get date from timestamp or date field
        let bookingDate: Date | null = null;
        
        if (booking.timestamp) {
          bookingDate = new Date(booking.timestamp);
        } else if (booking.date) {
          // Handle different date formats
          if (booking.date.includes('T')) {
            // ISO format
            bookingDate = new Date(booking.date);
          } else if (booking.date.includes('/')) {
            // DD/MM/YYYY format
            const [day, month, year] = booking.date.split('/');
            bookingDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }
        
        if (bookingDate && !isNaN(bookingDate.getTime())) {
          const now = new Date();
          const diffTime = now.getTime() - bookingDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Debug logging for time period filtering
          console.log('Time period filtering:', {
            bookingDate: bookingDate.toISOString(),
            now: now.toISOString(),
            diffDays: diffDays,
            timePeriod: filters.timePeriod,
            bookingDateStr: bookingDate.toLocaleDateString('th-TH'),
            nowStr: now.toLocaleDateString('th-TH')
          });

          switch (filters.timePeriod) {
            case 'today':
              // Show only bookings from today
              matchesTimePeriod = diffDays === 0;
              break;
            case '1day':
              // Show only bookings from yesterday (1 day ago)
              matchesTimePeriod = diffDays === 1;
              break;
            case '3days':
              // Show only bookings from 2-3 days ago
              matchesTimePeriod = diffDays >= 2 && diffDays <= 3;
              break;
            case '1week':
              // Show only bookings from 2-7 days ago
              matchesTimePeriod = diffDays >= 2 && diffDays <= 7;
              break;
            case '1month':
              // Show only bookings from 8-30 days ago
              matchesTimePeriod = diffDays >= 8 && diffDays <= 30;
              break;
            case '1year':
              // Show only bookings from 31-365 days ago
              matchesTimePeriod = diffDays >= 31 && diffDays <= 365;
              break;
          }
          
          console.log('Final result:', { matchesTimePeriod, diffDays, timePeriod: filters.timePeriod });
        } else {
          // If we can't parse the date, don't show it for time-based filters
          matchesTimePeriod = false;
          console.log('Could not parse date:', { timestamp: booking.timestamp, date: booking.date });
        }
      }

      return matchesSearch && matchesPeriod && matchesTimePeriod;
    })
    .sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return filters.sortBy === 'newest' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  // Handle filter changes
  const handleSortChange = (sortBy: 'newest' | 'oldest') => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleTimePeriodChange = (timePeriod: string) => {
    setFilters(prev => ({ ...prev, timePeriod: timePeriod as any }));
  };

  const handlePeriodToggle = (period: string) => {
    setFilters(prev => ({
      ...prev,
      periods: prev.periods.includes(period)
        ? prev.periods.filter(p => p !== period)
        : [...prev.periods, period]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      sortBy: 'newest',
      timePeriod: 'all',
      periods: []
    });
  };

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  const handleBookNow = () => {
    router.push('/booking');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-red-50 dark:from-indigo-950 dark:via-gray-900 dark:to-red-950 transition-colors duration-700">
      {/* Navigation */}
      <motion.nav
        style={{ opacity: headerOpacity }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-850/95 backdrop-blur-2xl shadow-md border-b border-gray-200/50 dark:border-[rgba(99,102,241,0.5)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <Calendar className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400">
              Sureesing
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/dashboard')}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ด</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookNow}
              className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>นักเรียนบันทึกข้อมูล</span>
            </motion.button>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={isDark}
                onChange={handleToggle}
                className="sr-only peer"
              />
              <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                <motion.div
                  className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-300 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                >
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
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
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>แดชบอร์ด</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBookNow}
                  className="text-gray-950 dark:text-gray-100 text-sm font-medium py-2 px-4 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300 flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>นักเรียนบันทึกข้อมูล</span>
                </motion.button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={handleToggle}
                    className="sr-only peer"
                  />
                  <div className="w-20 h-10 bg-gray-200 peer-checked:bg-gradient-to-r peer-checked:from-indigo-700 peer-checked:to-red-700 rounded-full transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.5)]">
                    <motion.div
                      className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-300 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                    >
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
          className="w-full max-w-6xl p-3 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-4 sm:mb-6 md:mb-8 tracking-tight">
            ประวัติการบันทึก
          </h2>
          
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

          {/* Search Bar */}
          <div className="max-w-4xl w-full mx-auto mb-6 flex flex-col sm:flex-row gap-3 px-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ค้นหาชื่อ/อาการ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base shadow-sm flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>ตัวกรอง</span>
            </motion.button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl w-full mx-auto mb-6 bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Sort Options */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <SortAsc className="w-4 h-4 mr-2" />
                      เรียงลำดับ
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={filters.sortBy === 'newest'}
                          onChange={() => handleSortChange('newest')}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-indigo-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">ใหม่สุด</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sort"
                          checked={filters.sortBy === 'oldest'}
                          onChange={() => handleSortChange('oldest')}
                          className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-indigo-600"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">เก่าสุด</span>
                      </label>
                    </div>
                  </div>

                  {/* Time Period Filter */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      ช่วงเวลา
                    </h3>
                    <div className="space-y-2">
                      {timePeriods.map((period) => (
                        <label key={period.value} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="timePeriod"
                            checked={filters.timePeriod === period.value}
                            onChange={() => handleTimePeriodChange(period.value)}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-indigo-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{period.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Period Filter */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      คาบเรียน
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <label key={slot.display} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.periods.includes(slot.display)}
                            onChange={() => handlePeriodToggle(slot.display)}
                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 dark:checked:bg-indigo-600"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{slot.display}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAllFilters}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                  >
                    ล้างตัวกรองทั้งหมด
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="max-w-4xl w-full mx-auto mb-4 px-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              พบ {filteredBookings.length} รายการ
              {filters.periods.length > 0 && ` (กรองคาบ: ${filters.periods.join(', ')})`}
              {filters.timePeriod !== 'all' && ` (${timePeriods.find(p => p.value === filters.timePeriod)?.display})`}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 px-2">ไม่พบประวัติการบันทึกข้อมูล</p>
          ) : (
            <div className="max-w-4xl w-full mx-auto grid gap-4 px-2">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-100 dark:border-gray-700 p-4 transition-all duration-200 group"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-full custom-user-avatar text-indigo-600 dark:text-indigo-300 text-xl font-bold">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-gray-100 truncate">{booking.firstName} {booking.lastName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getTimeSlotDisplay(booking.timeSlot)} |
                      <span
                        className="inline-block px-2 py-1 ml-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200"
                        title={booking.symptoms}
                      >
                        {booking.symptoms || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
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