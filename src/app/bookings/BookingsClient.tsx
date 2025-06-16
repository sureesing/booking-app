'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Calendar, User, LogOut, Moon, Sun, LayoutDashboard, Search } from 'lucide-react';

interface Booking {
  email: string;
  firstName: string;
  lastName: string;
  timeSlot: string;
  details?: string;
}

export default function BookingsClient() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTimeSlot, setFilterTimeSlot] = useState<string>('all');
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams?.get('email') || '';
  const [email, setEmail] = useState<string>(emailFromUrl);

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Initialize dark mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDark(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  // Check for stored email and validate session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedEmail = localStorage.getItem('userEmail');
    if (!emailFromUrl && storedEmail) {
      setEmail(storedEmail);
      router.replace(`/bookings?email=${encodeURIComponent(storedEmail)}`);
    } else if (!emailFromUrl && !storedEmail) {
      setError('กรุณาเข้าสู่ระบบเพื่อดูประวัติการจอง');
      router.replace('/login');
    }
  }, [emailFromUrl, router]);

  // Handle dark mode updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  // Fetch bookings
  useEffect(() => {
    if (!email) return;
    const fetchBookings = async () => {
      setIsLoading(true);
      setError('');
      try {
        const scriptUrl = process.env.NEXT_PUBLIC_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxOAMq6q5ir0e_j1_2Pc_2KG9r_LovObThQlaO8-LUrHij9zzmGR-mYbtzEgwnjhoNl/exec';
        if (!scriptUrl) {
          throw new Error('Missing NEXT_PUBLIC_SCRIPT_URL environment variable');
        }
        const query = new URLSearchParams({
          action: 'getBookings',
          email: email,
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
          setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        } else {
          setError(data.message || 'ไม่สามารถดึงข้อมูลการจองได้');
        }
      } catch (err: Error) {
        console.error('Fetch error:', err);
        setError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [email]);

  // Filter and search bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = (
      booking.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.timeSlot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.details && booking.details.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesFilter = filterTimeSlot === 'all' || booking.timeSlot === filterTimeSlot;
    return matchesSearch && matchesFilter;
  });

  // Get unique time slots for filter
  const timeSlots = ['all', ...new Set(bookings.map((booking) => booking.timeSlot))];

  const handleToggle = () => {
    setIsDark((prev) => !prev);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userEmail');
    }
    router.replace('/login');
  };

  const handleBookNow = () => {
    router.push(`/booking?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-indigo-100 to-red-100 dark:from-indigo-950 dark:via-gray-900 dark:to-red-950 transition-colors duration-700">
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
              iMedReserve
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
              <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium">{email}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99,102,241,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
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
              <span>จอง</span>
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
                  className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                >
                  {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
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
                <div className="flex items-center space-x-2 text-gray-950 dark:text-gray-100">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium">{email}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/dashboard?email=${encodeURIComponent(email)}`)}
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
                  <span>จอง</span>
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
                      className="absolute left-1.5 top-1.5 w-7 h-7 bg-white dark:bg-gray-100 rounded-full shadow-lg flex items-center justify-center transform peer-checked:translate-x-10 transition-transform duration-500"
                    >
                      {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
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

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-10 transition-colors duration-700">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-4xl p-8 sm:p-10 rounded-3xl bg-white/90 dark:bg-gray-850/95 backdrop-blur-2xl shadow-2xl dark:shadow-[0_0_25px_rgba(99,102,241,0.7)] border border-gray-200/50 dark:border-[rgba(99,102,241,0.5)] transform transition-all duration-500"
        >
          <h2 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-red-500 dark:from-indigo-400 dark:via-blue-400 dark:to-red-400 mb-8 tracking-tight">
            ประวัติการจอง
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ค้นหาการจอง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <select
              value={filterTimeSlot}
              onChange={(e) => setFilterTimeSlot(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot === 'all' ? 'ทุกช่วงเวลา' : slot}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">
              ไม่พบประวัติการจอง
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700/50">
                    <th className="p-4 text-sm font-semibold text-gray-950 dark:text-gray-100">ชื่อ</th>
                    <th className="p-4 text-sm font-semibold text-gray-950 dark:text-gray-100">นามสกุล</th>
                    <th className="p-4 text-sm font-semibold text-gray-950 dark:text-gray-100">เวลา</th>
                    <th className="p-4 text-sm font-semibold text-gray-950 dark:text-gray-100">อาการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <td className="p-4 text-sm text-gray-950 dark:text-gray-100">{booking.firstName}</td>
                      <td className="p-4 text-sm text-gray-950 dark:text-gray-100">{booking.lastName}</td>
                      <td className="p-4 text-sm text-gray-950 dark:text-gray-100">{booking.timeSlot}</td>
                      <td className="p-4 text-sm text-gray-950 dark:text-gray-100">{booking.details || 'N/A'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
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